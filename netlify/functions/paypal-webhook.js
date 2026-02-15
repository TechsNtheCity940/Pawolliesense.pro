function paypalBaseUrl() {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function getHeader(headers, name) {
  const target = String(name || '').toLowerCase();
  const pair = Object.entries(headers || {}).find(([key]) => String(key).toLowerCase() === target);
  return pair ? pair[1] : '';
}

async function getPayPalAccessToken() {
  const clientId = getRequiredEnv('PAYPAL_CLIENT_ID');
  const clientSecret = getRequiredEnv('PAYPAL_CLIENT_SECRET');
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || 'Unable to authenticate with PayPal.');
  }

  return data.access_token;
}

async function verifyWebhookSignature({ headers, payload }) {
  const webhookId = getRequiredEnv('PAYPAL_WEBHOOK_ID');
  const transmissionId = getHeader(headers, 'paypal-transmission-id');
  const transmissionTime = getHeader(headers, 'paypal-transmission-time');
  const certUrl = getHeader(headers, 'paypal-cert-url');
  const authAlgo = getHeader(headers, 'paypal-auth-algo');
  const transmissionSig = getHeader(headers, 'paypal-transmission-sig');

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: webhookId,
      webhook_event: payload
    })
  });

  const data = await response.json().catch(() => ({}));
  return response.ok && data?.verification_status === 'SUCCESS';
}

async function supabaseFetch(path, { method = 'GET', body } = {}) {
  const baseUrl = getRequiredEnv('SUPABASE_URL');
  const key = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || `Supabase request failed (${response.status}).`;
    throw new Error(message);
  }
  return data;
}

async function getReadingById(readingId) {
  const data = await supabaseFetch(`/rest/v1/readings?id=eq.${encodeURIComponent(readingId)}&select=*`);
  return Array.isArray(data) && data.length ? data[0] : null;
}

async function findCustomerByEmail(email) {
  if (!email) return null;
  const data = await supabaseFetch(`/rest/v1/customers?email=eq.${encodeURIComponent(email)}&select=id,email`);
  return Array.isArray(data) && data.length ? data[0] : null;
}

async function findRecentPendingReadingByCustomer({ customerId, amount }) {
  if (!customerId) return null;
  const data = await supabaseFetch(
    `/rest/v1/readings?customer_id=eq.${encodeURIComponent(customerId)}&status=in.(pending,in_progress)&order=created_at.desc&limit=25&select=*`
  );
  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return null;

  const amountValue = Number(amount || 0);
  const withExactAmount = rows.filter((row) => Number(row?.total_price || 0) === amountValue);
  const candidates = withExactAmount.length ? withExactAmount : rows;

  const now = Date.now();
  const within48h = candidates.filter((row) => {
    const created = row?.created_at ? Date.parse(row.created_at) : NaN;
    if (!Number.isFinite(created)) return true;
    return now - created <= 48 * 60 * 60 * 1000;
  });

  return (within48h.length ? within48h : candidates)[0] || null;
}

async function resolveReadingForEvent({ customId, payerEmail, amount }) {
  if (customId) {
    const explicit = await getReadingById(customId);
    if (explicit) return explicit;
  }

  const customer = await findCustomerByEmail(payerEmail);
  if (!customer) return null;
  return findRecentPendingReadingByCustomer({ customerId: customer.id, amount });
}

function appendPaymentNote(existingNotes, line) {
  const base = String(existingNotes || '').trim();
  const eventLine = String(line || '').trim();
  if (!eventLine) return base;
  if (base.includes(eventLine)) return base;
  return base ? `${base}\n${eventLine}` : eventLine;
}

async function patchReading(readingId, updates) {
  const data = await supabaseFetch(`/rest/v1/readings?id=eq.${encodeURIComponent(readingId)}`, {
    method: 'PATCH',
    body: updates
  });
  return Array.isArray(data) && data.length ? data[0] : null;
}

function extractPaymentDetails(payload) {
  const resource = payload?.resource || {};
  const amount = Number(
    resource?.amount?.value ||
    resource?.seller_receivable_breakdown?.gross_amount?.value ||
    resource?.gross_amount?.value ||
    0
  );

  const links = Array.isArray(resource?.links) ? resource.links : [];
  const upLink = links.find((link) => link?.rel === 'up');
  const orderId = upLink?.href ? String(upLink.href).split('/').pop() : '';

  const customId = resource?.custom_id || resource?.supplementary_data?.related_ids?.custom_id || '';
  const payerEmail = resource?.payer?.email_address || payload?.resource?.payer_email || '';
  const captureId = resource?.id || payload?.id || '';

  return {
    amount,
    orderId,
    captureId,
    customId: String(customId || '').trim(),
    payerEmail: String(payerEmail || '').trim()
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed.' })
    };
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const isVerified = await verifyWebhookSignature({
      headers: event.headers || {},
      payload
    });

    if (!isVerified) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Webhook signature verification failed.' })
      };
    }

    const eventType = String(payload?.event_type || '');
    const supportedEvents = new Set([
      'PAYMENT.CAPTURE.COMPLETED',
      'PAYMENT.CAPTURE.DENIED',
      'PAYMENT.CAPTURE.REFUNDED'
    ]);

    if (!supportedEvents.has(eventType)) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, ignored: true, eventType })
      };
    }

    const details = extractPaymentDetails(payload);
    const reading = await resolveReadingForEvent(details);

    if (!reading?.id) {
      console.warn('PayPal webhook: unable to match reading', {
        eventType,
        orderId: details.orderId,
        captureId: details.captureId,
        customId: details.customId,
        payerEmail: details.payerEmail,
        amount: details.amount
      });
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, matched: false, eventType })
      };
    }

    const stamp = new Date().toISOString();
    const captureId = details.captureId || 'unknown';
    let nextStatus = reading.status || 'pending';
    let note = `[PayPal webhook] ${eventType} capture=${captureId}`;

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      nextStatus = 'in_progress';
    } else if (eventType === 'PAYMENT.CAPTURE.DENIED') {
      nextStatus = 'pending';
    } else if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
      nextStatus = 'pending';
    }

    const notes = appendPaymentNote(reading.notes, note);
    await patchReading(reading.id, {
      status: nextStatus,
      notes,
      updated_at: stamp
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        matched: true,
        eventType,
        readingId: reading.id,
        status: nextStatus
      })
    };
  } catch (error) {
    console.error('PayPal webhook error', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Unable to process webhook.' })
    };
  }
};
