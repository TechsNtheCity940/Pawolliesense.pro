const jsonResponse = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    ...headers
  },
  body: JSON.stringify(body)
});

const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    cookies[key] = value;
  });
  return cookies;
};

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
};

const supabaseUpsertToken = async (tokenPayload) => {
  const url = `${requiredEnv('SUPABASE_URL')}/rest/v1/canva_tokens`;
  const key = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify([tokenPayload])
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || 'Supabase token upsert failed.';
    throw new Error(message);
  }
  return Array.isArray(data) ? data[0] : data;
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  const redirectUri = process.env.CANVA_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return jsonResponse(500, { error: 'Canva OAuth env vars are missing.' });
  }

  const query = event.queryStringParameters || {};
  const code = query.code;
  if (!code) {
    return jsonResponse(400, { error: 'Missing code parameter.' });
  }

  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || '');
  const codeVerifier = cookies.canva_pkce;
  if (!codeVerifier) {
    return jsonResponse(400, { error: 'Missing PKCE verifier.' });
  }

  const tokenRes = await fetch('https://api.canva.com/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      code_verifier: codeVerifier
    })
  });

  const tokens = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok) {
    return jsonResponse(tokenRes.status, { error: tokens?.error || 'Token exchange failed.' });
  }

  const expiresAt = tokens?.expires_in
    ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString()
    : null;

  await supabaseUpsertToken({
    id: 'default',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || null,
    token_type: tokens.token_type || null,
    scope: tokens.scope || null,
    expires_at: expiresAt
  });

  return jsonResponse(200, { ok: true }, {
    'Set-Cookie': 'canva_pkce=; Path=/; HttpOnly; Max-Age=0'
  });
};
