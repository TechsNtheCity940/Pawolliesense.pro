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

exports.handler = async (event) => {
  const { secret } = getCredentials();
  if (!secret) {
    return jsonResponse(500, { ok: false, error: 'Admin auth is not configured' });
  }

  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || '');
  const token = cookies[COOKIE_NAME];
  const payload = verifyToken(token, secret);

  if (!payload) {
    return jsonResponse(200, { ok: false });
  }

  return jsonResponse(200, { ok: true, user: payload.sub || 'admin' });
};
