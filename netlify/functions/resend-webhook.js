const crypto = require('crypto');

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  },
  body: JSON.stringify(body)
});

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');

const getHeader = (headers, name) => {
  if (!headers) return '';
  const target = String(name || '').toLowerCase();
  const key = Object.keys(headers).find((item) => String(item).toLowerCase() === target);
  return key ? String(headers[key] || '') : '';
};

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
};

const getWebhookSecret = () =>
  firstDefined(
    process.env.RESEND_WEBHOOK_SECRET,
    process.env.RESEND_WEBOOK_SECRET
  );

const supabaseRequest = async ({ path, method = 'GET', body, prefer } = {}) => {
  const url = `${requiredEnv('SUPABASE_URL')}${path}`;
  const key = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(url, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: prefer || 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || 'Supabase request failed.';
    throw new Error(message);
  }
  return data;
};

const parseMissingColumn = (errorMessage, tableName) => {
  if (!errorMessage || !tableName) return null;
  const match = String(errorMessage).match(new RegExp(`'([^']+)'\\s+column\\s+of\\s+'${tableName}'`, 'i'));
  return match ? match[1] : null;
};

const decodeWebhookSecret = (secret) => {
  if (!secret) return Buffer.from('');
  const raw = String(secret).trim();
  if (raw.startsWith('whsec_')) {
    return Buffer.from(raw.slice('whsec_'.length), 'base64');
  }
  return Buffer.from(raw, 'utf8');
};

const parseSvixSignatures = (headerValue) =>
  String(headerValue || '')
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [version, signature] = part.split(',');
      return { version: String(version || '').trim(), signature: String(signature || '').trim() };
    })
    .filter((item) => item.version && item.signature);

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

const verifyWebhookSignature = ({ body, secret, svixId, svixTimestamp, svixSignature }) => {
  const timestamp = Number(svixTimestamp);
  if (!Number.isFinite(timestamp)) {
    throw new Error('Invalid svix timestamp.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    throw new Error('Webhook timestamp outside allowed window.');
  }

  const signedContent = `${svixId}.${svixTimestamp}.${body}`;
  const key = decodeWebhookSecret(secret);
  const expected = crypto.createHmac('sha256', key).update(signedContent, 'utf8').digest('base64');
  const signatures = parseSvixSignatures(svixSignature);
  const valid = signatures.some((item) => item.version === 'v1' && safeEqual(item.signature, expected));
  if (!valid) {
    throw new Error('Invalid webhook signature.');
  }
};

const normalizeTags = (rawTags) => {
  if (!rawTags) return {};
  if (Array.isArray(rawTags)) {
    return rawTags.reduce((acc, tag) => {
      const key = String(tag?.name || '').trim();
      if (!key) return acc;
      acc[key] = String(tag?.value || '').trim();
      return acc;
    }, {});
  }
  if (typeof rawTags === 'object') {
    return Object.entries(rawTags).reduce((acc, [key, value]) => {
      const normalizedKey = String(key || '').trim();
      if (!normalizedKey) return acc;
      acc[normalizedKey] = String(value || '').trim();
      return acc;
    }, {});
  }
  return {};
};

const firstRecipient = (data) => {
  const toList = Array.isArray(data?.to) ? data.to : [];
  if (toList.length > 0) {
    return String(toList[0] || '').trim().toLowerCase();
  }
  const email = firstDefined(data?.email, data?.recipient);
  return String(email || '').trim().toLowerCase();
};

const parseEvent = (verifiedPayload) => {
  const data = verifiedPayload?.data || {};
  const tags = normalizeTags(data.tags);
  return {
    type: String(verifiedPayload?.type || 'unknown').trim(),
    createdAt: verifiedPayload?.created_at || null,
    data,
    tags,
    emailId: String(firstDefined(data.email_id, data.id, tags.email_id) || '').trim(),
    recipientEmail: firstRecipient(data),
    readingIdTag: String(firstDefined(tags.reading_id, tags.readingId) || '').trim(),
    customerIdTag: String(firstDefined(tags.customer_id, tags.customerId) || '').trim()
  };
};

const fetchReadingById = async (readingId) => {
  if (!readingId) return null;
  const data = await supabaseRequest({
    path: `/rest/v1/readings?id=eq.${encodeURIComponent(readingId)}&select=id,customer_id,response_email_id,response_email_sent_at&limit=1`
  });
  return Array.isArray(data) && data.length ? data[0] : null;
};

const fetchReadingByEmailId = async (emailId) => {
  if (!emailId) return null;
  const data = await supabaseRequest({
    path: `/rest/v1/readings?response_email_id=eq.${encodeURIComponent(emailId)}&select=id,customer_id,response_email_id,response_email_sent_at&order=updated_at.desc&limit=1`
  });
  return Array.isArray(data) && data.length ? data[0] : null;
};

const fetchCustomerByEmail = async (email) => {
  if (!email) return null;
  const data = await supabaseRequest({
    path: `/rest/v1/customers?email=eq.${encodeURIComponent(email)}&select=id&limit=1`
  });
  return Array.isArray(data) && data.length ? data[0] : null;
};

const buildFailureMessage = ({ type, data }) =>
  String(
    firstDefined(
      data?.error?.message,
      data?.bounce?.reason,
      data?.bounce?.message,
      data?.reason,
      data?.message,
      type
    ) || type
  ).slice(0, 1000);

const patchReadingForEvent = async ({ readingId, eventType, eventCreatedAt, emailId, data }) => {
  if (!readingId) return;
  const update = {
    updated_at: new Date().toISOString()
  };

  if (emailId) {
    update.response_email_id = emailId;
    update.response_email_provider = 'resend';
  }

  if (eventType === 'email.sent' && eventCreatedAt) {
    update.response_email_sent_at = eventCreatedAt;
  }

  if (eventType === 'email.delivered') {
    update.response_email_last_error = null;
  }

  if (['email.failed', 'email.bounced', 'email.complained', 'email.suppressed'].includes(eventType)) {
    update.response_email_last_error = buildFailureMessage({ type: eventType, data });
  }

  let payload = { ...update };
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await supabaseRequest({
        path: `/rest/v1/readings?id=eq.${encodeURIComponent(readingId)}`,
        method: 'PATCH',
        body: payload
      });
      return;
    } catch (error) {
      const missingColumn = parseMissingColumn(error?.message, 'readings');
      if (!missingColumn || !(missingColumn in payload)) {
        throw error;
      }
      delete payload[missingColumn];
    }
  }
};

const insertEventLog = async ({
  svixId,
  svixTimestamp,
  eventType,
  eventCreatedAt,
  emailId,
  recipientEmail,
  readingId,
  customerId,
  payload
}) => {
  await supabaseRequest({
    path: '/rest/v1/resend_email_events?on_conflict=svix_id',
    method: 'POST',
    prefer: 'resolution=ignore-duplicates,return=representation',
    body: {
      svix_id: svixId,
      svix_timestamp: Number(svixTimestamp) || null,
      event_type: eventType,
      event_created_at: eventCreatedAt,
      email_id: emailId || null,
      recipient_email: recipientEmail || null,
      reading_id: readingId || null,
      customer_id: customerId || null,
      payload: payload || {}
    }
  });
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed.' });
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(String(event.body || ''), 'base64').toString('utf8')
    : String(event.body || '');
  if (!rawBody) {
    return jsonResponse(400, { ok: false, error: 'Missing webhook payload.' });
  }

  const secret = getWebhookSecret();
  if (!secret) {
    return jsonResponse(500, { ok: false, error: 'Missing RESEND_WEBHOOK_SECRET.' });
  }

  const svixId = getHeader(event.headers, 'svix-id');
  const svixTimestamp = getHeader(event.headers, 'svix-timestamp');
  const svixSignature = getHeader(event.headers, 'svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return jsonResponse(400, { ok: false, error: 'Missing svix headers.' });
  }

  let verifiedPayload = null;
  try {
    verifyWebhookSignature({
      body: rawBody,
      secret,
      svixId,
      svixTimestamp,
      svixSignature
    });
    verifiedPayload = JSON.parse(rawBody);
  } catch (error) {
    return jsonResponse(400, { ok: false, error: 'Invalid webhook signature.' });
  }

  try {
    const parsed = parseEvent(verifiedPayload);
    let reading = await fetchReadingById(parsed.readingIdTag);
    if (!reading && parsed.emailId) {
      reading = await fetchReadingByEmailId(parsed.emailId);
    }

    const readingId = String(reading?.id || parsed.readingIdTag || '').trim() || null;
    let customerId = String(reading?.customer_id || parsed.customerIdTag || '').trim() || null;
    if (!customerId && parsed.recipientEmail) {
      const customer = await fetchCustomerByEmail(parsed.recipientEmail);
      customerId = String(customer?.id || '').trim() || null;
    }

    try {
      await insertEventLog({
        svixId,
        svixTimestamp,
        eventType: parsed.type,
        eventCreatedAt: parsed.createdAt,
        emailId: parsed.emailId,
        recipientEmail: parsed.recipientEmail,
        readingId,
        customerId,
        payload: verifiedPayload
      });
    } catch (error) {
      if (!String(error?.message || '').includes('relation "public.resend_email_events" does not exist')) {
        throw error;
      }
      console.error('resend_email_events table missing; apply migrations to enable event logging.');
    }

    if (readingId) {
      await patchReadingForEvent({
        readingId,
        eventType: parsed.type,
        eventCreatedAt: parsed.createdAt,
        emailId: parsed.emailId,
        data: parsed.data
      });
    }

    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error('Resend webhook processing failed', error);
    return jsonResponse(200, { ok: true, warning: error.message || 'Webhook processing error.' });
  }
};
