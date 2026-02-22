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
  if (event.httpMethod !== 'GET') {
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

    const limitRaw = Number(event.queryStringParameters?.limit || 200);
    const limit = Math.min(Math.max(limitRaw, 1), 500);
    const readingId = String(event.queryStringParameters?.readingId || '').trim();

    const params = [
      'select=*',
      'order=created_at.desc',
      `limit=${limit}`
    ];
    if (readingId) {
      params.push(`reading_id=eq.${encodeURIComponent(readingId)}`);
    }

    const data = await supabaseRequest({
      path: `/rest/v1/resend_email_events?${params.join('&')}`
    });

    return jsonResponse(200, { ok: true, data });
  } catch (error) {
    if (String(error?.message || '').includes('relation "public.resend_email_events" does not exist')) {
      return jsonResponse(200, {
        ok: true,
        data: [],
        warning: 'Resend event log table is missing. Run the latest Supabase migrations.'
      });
    }
    return jsonResponse(500, { ok: false, error: error.message || 'Unable to fetch email events.' });
  }
};
