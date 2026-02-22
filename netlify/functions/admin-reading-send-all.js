const {
  COOKIE_NAME,
  parseCookies,
  verifyToken,
  getCredentials
} = require('./_adminAuth');
const { sendReadingResponseEmail } = require('./_responseEmail');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const parseBody = (event) => {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
};

const parseMissingColumn = (errorMessage, tableName) => {
  if (!errorMessage || !tableName) return null;
  const match = String(errorMessage).match(new RegExp(`'([^']+)'\\s+column\\s+of\\s+'${tableName}'`, 'i'));
  return match ? match[1] : null;
};

const patchReadingEmailStatus = async (readingId, statusPayload) => {
  let payload = {
    ...statusPayload,
    updated_at: new Date().toISOString()
  };
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await supabaseRequest({
        path: `/rest/v1/readings?id=eq.${readingId}`,
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

const getPendingResponseReadings = async ({ limit, includeAlreadySent }) => {
  const parts = [
    '/rest/v1/readings?select=*,customers(*),pets(*)',
    'notes=not.is.null',
    `order=created_at.asc`,
    `limit=${limit}`
  ];
  if (!includeAlreadySent) {
    parts.push('response_email_sent_at=is.null');
  }
  const path = parts.join('&');
  return supabaseRequest({ path });
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
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

    const body = parseBody(event);
    const includeAlreadySent = body.force === true;
    const requestedLimit = Number(body.limit) || 100;
    const limit = Math.min(Math.max(requestedLimit, 1), 500);
    const readings = await getPendingResponseReadings({ limit, includeAlreadySent });

    const sent = [];
    const failed = [];
    const skipped = [];

    for (const reading of Array.isArray(readings) ? readings : []) {
      const readingId = String(reading?.id || '').trim();
      if (!readingId) continue;

      if (!String(reading?.notes || '').trim()) {
        skipped.push({ readingId, reason: 'missing_response_text' });
        continue;
      }

      if (!reading?.customers?.email) {
        const reason = 'missing_customer_email';
        failed.push({ readingId, reason });
        try {
          await patchReadingEmailStatus(readingId, {
            response_email_last_error: 'Missing customer email.'
          });
        } catch {
          // Best effort logging only.
        }
        continue;
      }

      try {
        const emailResult = await sendReadingResponseEmail(reading);
        const sentAt = new Date().toISOString();
        await patchReadingEmailStatus(readingId, {
          response_email_sent_at: sentAt,
          response_email_sent_to: emailResult.to,
          response_email_provider: emailResult.provider,
          response_email_id: emailResult.emailId || null,
          response_email_last_error: null
        });
        sent.push({
          readingId,
          to: emailResult.to,
          provider: emailResult.provider,
          sent_at: sentAt
        });
      } catch (error) {
        const reason = error.message || 'Unable to send response email.';
        failed.push({ readingId, reason });
        try {
          await patchReadingEmailStatus(readingId, {
            response_email_last_error: reason
          });
        } catch {
          // Best effort logging only.
        }
      }

      // Respect Resend free-tier throughput limits during bulk sends.
      await sleep(550);
    }

    return jsonResponse(200, {
      ok: true,
      total: Array.isArray(readings) ? readings.length : 0,
      sent_count: sent.length,
      failed_count: failed.length,
      skipped_count: skipped.length,
      sent,
      failed,
      skipped
    });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error.message || 'Unable to send response emails.' });
  }
};
