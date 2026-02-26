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

const normalizeText = (value, maxLength) => {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.slice(0, maxLength);
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    const payload = JSON.parse(event.body || '{}');

    const name = normalizeText(payload.name, 120);
    const email = normalizeText(payload.email, 254).toLowerCase();
    const subject = normalizeText(payload.subject, 160);
    const message = normalizeText(payload.message, 5000);

    if (!name || !email || !subject || !message) {
      return jsonResponse(400, { ok: false, error: 'Name, email, subject, and message are required.' });
    }

    if (!isValidEmail(email)) {
      return jsonResponse(400, { ok: false, error: 'Please provide a valid email address.' });
    }

    const rows = await supabaseRequest({
      path: '/rest/v1/contact_messages',
      method: 'POST',
      body: [{ name, email, subject, message, status: 'unread' }]
    });
    const row = Array.isArray(rows) ? rows[0] : null;

    return jsonResponse(200, { ok: true, data: row });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error.message || 'Unable to submit contact message.' });
  }
};
