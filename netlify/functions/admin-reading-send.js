const {
  COOKIE_NAME,
  parseCookies,
  verifyToken,
  getCredentials
} = require('./_adminAuth');
const { sendReadingResponseEmail } = require('./_responseEmail');

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
      const data = await supabaseRequest({
        path: `/rest/v1/readings?id=eq.${readingId}`,
        method: 'PATCH',
        body: payload
      });
      return Array.isArray(data) ? data[0] : data;
    } catch (error) {
      const missingColumn = parseMissingColumn(error?.message, 'readings');
      if (!missingColumn || !(missingColumn in payload)) {
        throw error;
      }
      delete payload[missingColumn];
    }
  }
  return null;
};

const getReading = async (readingId) => {
  const data = await supabaseRequest({
    path: `/rest/v1/readings?id=eq.${readingId}&select=*,customers(*),pets(*)`
  });
  return Array.isArray(data) ? data[0] : data;
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed.' });
  }

  const body = parseBody(event);

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

    const readingId = String(body.readingId || '').trim();
    const force = body.force === true;
    if (!readingId) {
      return jsonResponse(400, { ok: false, error: 'Missing readingId.' });
    }

    const reading = await getReading(readingId);
    if (!reading) {
      return jsonResponse(404, { ok: false, error: 'Reading not found.' });
    }

    if (reading.response_email_sent_at && !force) {
      return jsonResponse(200, {
        ok: true,
        skipped: true,
        message: 'Response email already sent.',
        sent_at: reading.response_email_sent_at
      });
    }

    const emailResult = await sendReadingResponseEmail(reading);
    const sentAt = new Date().toISOString();

    await patchReadingEmailStatus(readingId, {
      response_email_sent_at: sentAt,
      response_email_sent_to: emailResult.to,
      response_email_provider: emailResult.provider,
      response_email_id: emailResult.emailId || null,
      response_email_last_error: null
    });

    const updated = await getReading(readingId);

    return jsonResponse(200, {
      ok: true,
      sent_to: emailResult.to,
      provider: emailResult.provider,
      sent_at: sentAt,
      data: updated
    });
  } catch (error) {
    const readingId = String(body.readingId || '').trim();
    if (readingId) {
      try {
        await patchReadingEmailStatus(readingId, {
          response_email_last_error: error.message || 'Unable to send response email.'
        });
      } catch {
        // Best effort: preserve the original delivery error.
      }
    }
    return jsonResponse(500, { ok: false, error: error.message || 'Unable to send response email.' });
  }
};
