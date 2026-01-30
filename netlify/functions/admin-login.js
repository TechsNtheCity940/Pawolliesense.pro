const {
  SESSION_TTL_SECONDS,
  signToken,
  buildCookie,
  getCredentials,
  timingSafeEqual
} = require('./_adminAuth');

const jsonResponse = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...headers
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' });
  }

  const { users, secret } = getCredentials();
  if (!users.length || !secret) {
    return jsonResponse(500, { ok: false, error: 'Admin auth is not configured' });
  }

  let payload = {};
  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : event.body || '';
    payload = JSON.parse(rawBody || '{}');
  } catch {
    return jsonResponse(400, { ok: false, error: 'Invalid request body' });
  }

  const inputUser = String(payload.username || '');
  const inputPass = String(payload.password || '');

  const matched = users.some((entry) => (
    timingSafeEqual(inputUser, entry.username) &&
    timingSafeEqual(inputPass, entry.password)
  ));

  if (!matched) {
    return jsonResponse(401, { ok: false, error: 'Invalid credentials' });
  }

  const token = signToken(
    {
      sub: inputUser,
      exp: Date.now() + SESSION_TTL_SECONDS * 1000
    },
    secret
  );

  const cookie = buildCookie(token, event, SESSION_TTL_SECONDS);

  return jsonResponse(200, { ok: true }, { 'Set-Cookie': cookie });
};
