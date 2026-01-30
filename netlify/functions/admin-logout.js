const { buildCookie } = require('./_adminAuth');

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
  const cookie = buildCookie('', event, 0);
  return jsonResponse(200, { ok: true }, { 'Set-Cookie': cookie });
};
