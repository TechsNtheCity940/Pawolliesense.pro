const {
  COOKIE_NAME,
  parseCookies,
  verifyToken,
  getCredentials
} = require('./_adminAuth');

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  },
  body: JSON.stringify(body)
});

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
};

const safeText = (value, fallback = '') => String(value || '').trim() || fallback;

const parseJsonValue = (raw, fallback) => {
  if (raw === null || raw === undefined || raw === '') return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const appendAdminNote = (existing, noteLine) => {
  const base = safeText(existing);
  const line = safeText(noteLine);
  if (!line) return base || null;
  if (base.includes(line)) return base || null;
  return base ? `${base}\n${line}` : line;
};

const parseCaptureIdFromNotes = (notes) => {
  const text = safeText(notes);
  const match = text.match(/PayPal payment captured \(([^)]+)\)/i);
  return safeText(match?.[1]);
};

const paypalBaseUrl = () => (
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
);

const getPayPalAccessToken = async () => {
  const clientId = requiredEnv('PAYPAL_CLIENT_ID');
  const clientSecret = requiredEnv('PAYPAL_CLIENT_SECRET');
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
    const message = data?.error_description || data?.error || 'Unable to authenticate with PayPal.';
    throw new Error(message);
  }

  return data.access_token;
};

const refundPayPalCapture = async ({ captureId, reason }) => {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalBaseUrl()}/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      note_to_payer: safeText(reason) || 'Refund approved by Pawollie Sense admin.'
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.details?.[0]?.description || data?.name || 'PayPal refund failed.';
    throw new Error(message);
  }

  return {
    refundId: safeText(data?.id),
    status: safeText(data?.status)
  };
};

const isDigitalOnlyKeepType = ({ type, customization }) => {
  const keepType = safeText(type).toLowerCase();
  const details = parseJsonValue(customization, {});
  if (keepType === 'apparel' || keepType === 'tag_ornament') return false;
  if (keepType === 'chart_certificate') {
    const format = safeText(details?.chart_format || details?.k_chart_format).toLowerCase();
    return ['digital_printable', 'digital', 'digital_only'].includes(format);
  }
  if (keepType === 'memorial_print') {
    const format = safeText(details?.memorial_format || details?.k_memorial_format).toLowerCase();
    return ['digital_printable', 'digital', 'digital_only'].includes(format);
  }
  return true;
};

const supabaseRequest = async ({ path, method = 'GET', body } = {}) => {
  const url = `${requiredEnv('SUPABASE_URL')}${path}`;
  const key = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(url, {
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
    const message = data?.message || data?.error || 'Supabase request failed.';
    throw new Error(message);
  }
  return data;
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'PATCH') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    const { secret } = getCredentials();
    if (!secret) {
      return jsonResponse(500, { ok: false, error: 'Admin auth is not configured.' });
    }
    const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || '');
    const token = cookies[COOKIE_NAME];
    const payload = verifyToken(token, secret);
    if (!payload) {
      return jsonResponse(401, { ok: false, error: 'Unauthorized.' });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const readingId = body.readingId;
    if (!readingId) {
      return jsonResponse(400, { ok: false, error: 'Missing readingId.' });
    }

    const existingRows = await supabaseRequest({
      path: `/rest/v1/readings?id=eq.${encodeURIComponent(readingId)}&select=*&limit=1`
    });
    const reading = Array.isArray(existingRows) ? existingRows[0] : null;
    if (!reading) {
      return jsonResponse(404, { ok: false, error: 'Reading not found.' });
    }

    const update = { updated_at: new Date().toISOString() };
    const action = safeText(body.action).toLowerCase();

    if (typeof body.status === 'string') {
      update.status = body.status;
      if (body.status === 'completed') {
        update.completed_at = new Date().toISOString();
      }
    }
    if (typeof body.notes === 'string') {
      update.notes = body.notes;
    }

    if (action === 'apply_free_discount') {
      const status = safeText(reading.status).toLowerCase();
      if (!['pending', 'in_progress'].includes(status)) {
        return jsonResponse(400, { ok: false, error: 'Free discount can only be applied to pending or in-progress orders.' });
      }

      const keepsakeRows = await supabaseRequest({
        path: `/rest/v1/keepsake_orders?reading_id=eq.${encodeURIComponent(readingId)}&select=keepsake_type,customization,status`
      });
      const keepsakes = Array.isArray(keepsakeRows) ? keepsakeRows : [];
      const hasPhysical = keepsakes.some((row) => !isDigitalOnlyKeepType({
        type: row?.keepsake_type,
        customization: row?.customization
      }));
      if (hasPhysical) {
        return jsonResponse(400, { ok: false, error: 'Free discount is only available for AI/digital-only orders.' });
      }

      update.total_price = 0;
      update.notes = appendAdminNote(
        reading.notes,
        `[Admin] Complimentary discount applied on ${new Date().toISOString()}.`
      );
    }

    if (action === 'cancel_order') {
      update.status = 'cancelled';
      update.notes = appendAdminNote(
        reading.notes,
        `[Admin] Order cancelled on ${new Date().toISOString()}. ${safeText(body.cancelReason)}`
      );
    }

    if (action === 'refund_order') {
      const captureId = safeText(body.captureId) || parseCaptureIdFromNotes(reading.notes);
      if (!captureId) {
        return jsonResponse(400, {
          ok: false,
          error: 'No PayPal capture id found for this order. Add captureId or refund manually in PayPal.'
        });
      }
      const refund = await refundPayPalCapture({
        captureId,
        reason: safeText(body.refundReason)
      });
      update.status = 'cancelled';
      update.total_price = 0;
      update.notes = appendAdminNote(
        reading.notes,
        `[Admin] Refund issued on ${new Date().toISOString()} (capture ${captureId}, refund ${refund.refundId || 'n/a'}, status ${refund.status || 'unknown'}).`
      );
    }

    const data = await supabaseRequest({
      path: `/rest/v1/readings?id=eq.${readingId}`,
      method: 'PATCH',
      body: update
    });

    if (action === 'cancel_order' || action === 'refund_order') {
      await supabaseRequest({
        path: `/rest/v1/keepsake_orders?reading_id=eq.${encodeURIComponent(readingId)}`,
        method: 'PATCH',
        body: {
          status: 'cancelled',
          updated_at: new Date().toISOString(),
          last_error: null
        }
      }).catch(() => {});
    }

    const updated = Array.isArray(data) ? data[0] : data;
    return jsonResponse(200, { ok: true, data: updated });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error.message || 'Unable to update reading.' });
  }
};
