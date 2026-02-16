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

    const limitRaw = Number(event.queryStringParameters?.limit || 150);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 400)) : 150;
    const q = String(event.queryStringParameters?.q || '').trim().toLowerCase();
    const petId = String(event.queryStringParameters?.petId || '').trim();
    const readingId = String(event.queryStringParameters?.readingId || '').trim();

    const data = await supabaseRequest({
      path: `/rest/v1/uploaded_files?select=*,pets(name),customers(first_name,last_name,email)&order=created_at.desc&limit=${limit}`
    });

    const rows = Array.isArray(data) ? data : [];
    const filtered = rows.filter((row) => {
      if (petId && String(row?.pet_id || '') !== petId) return false;
      if (readingId && String(row?.reading_id || '') !== readingId) return false;
      if (!q) return true;
      const text = [
        row?.original_name,
        row?.photo_type,
        row?.storage_path,
        row?.pets?.name,
        row?.customers?.first_name,
        row?.customers?.last_name,
        row?.customers?.email
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');
      return text.includes(q);
    });

    return jsonResponse(200, { ok: true, data: filtered });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error.message || 'Unable to fetch media files.' });
  }
};
