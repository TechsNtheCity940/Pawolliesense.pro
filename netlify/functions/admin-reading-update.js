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

    const update = { updated_at: new Date().toISOString() };
    if (typeof body.status === 'string') {
      update.status = body.status;
      if (body.status === 'completed') {
        update.completed_at = new Date().toISOString();
      }
    }
    if (typeof body.notes === 'string') {
      update.notes = body.notes;
    }

    const data = await supabaseRequest({
      path: `/rest/v1/readings?id=eq.${readingId}`,
      method: 'PATCH',
      body: update
    });

    const updated = Array.isArray(data) ? data[0] : data;
    return jsonResponse(200, { ok: true, data: updated });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error.message || 'Unable to update reading.' });
  }
};
