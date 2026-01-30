const crypto = require('crypto');

const jsonResponse = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    ...headers
  },
  body: JSON.stringify(body)
});

const base64url = (buffer) =>
  buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const generatePkce = () => {
  const codeVerifier = base64url(crypto.randomBytes(96));
  const codeChallenge = base64url(
    crypto.createHash('sha256').update(codeVerifier).digest()
  );
  return { codeVerifier, codeChallenge };
};

const buildCookie = (value, maxAgeSeconds) => {
  const parts = [
    `canva_pkce=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`
  ];
  if (process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production') {
    parts.push('Secure');
  }
  return parts.join('; ');
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  const clientId = process.env.CANVA_CLIENT_ID;
  const redirectUri = process.env.CANVA_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return jsonResponse(500, { error: 'CANVA_CLIENT_ID or CANVA_REDIRECT_URI is missing.' });
  }

  const { codeVerifier, codeChallenge } = generatePkce();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'asset:read asset:write design:content:read design:content:write',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  return {
    statusCode: 302,
    headers: {
      Location: `https://www.canva.com/api/oauth/authorize?${params.toString()}`,
      'Set-Cookie': buildCookie(codeVerifier, 600)
    },
    body: ''
  };
};
