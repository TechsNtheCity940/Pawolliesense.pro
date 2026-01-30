const crypto = require('crypto');

const COOKIE_NAME = 'pawollie_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12;

const base64urlEncode = (input) =>
  Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const base64urlDecode = (input) => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  const padded = pad ? normalized + '='.repeat(4 - pad) : normalized;
  return Buffer.from(padded, 'base64').toString('utf8');
};

const timingSafeEqual = (a, b) => {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

const signToken = (payload, secret) => {
  const data = base64urlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64');
  const sigUrl = sig.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${sigUrl}`;
};

const verifyToken = (token, secret) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(base64urlDecode(data));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
};

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

const shouldUseSecure = (event) => {
  const proto = (event.headers['x-forwarded-proto'] || '').toLowerCase();
  if (proto === 'https') return true;
  return process.env.NODE_ENV === 'production' || process.env.CONTEXT === 'production';
};

const buildCookie = (value, event, maxAgeSeconds) => {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`
  ];
  if (shouldUseSecure(event)) {
    parts.push('Secure');
  }
  return parts.join('; ');
};

const parseUsers = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => ({
        username: String(entry?.username || '').trim(),
        password: String(entry?.password || '')
      }))
      .filter((entry) => entry.username && entry.password);
  } catch {
    return [];
  }
};

const getCredentials = () => {
  const users = parseUsers(process.env.ADMIN_USERS);
  const fallbackUser = String(process.env.ADMIN_USERNAME || '').trim();
  const fallbackPass = String(process.env.ADMIN_PASSWORD || '');
  if (users.length === 0 && fallbackUser && fallbackPass) {
    users.push({ username: fallbackUser, password: fallbackPass });
  }

  return {
    users,
    secret: process.env.ADMIN_SESSION_SECRET
  };
};

module.exports = {
  COOKIE_NAME,
  SESSION_TTL_SECONDS,
  parseCookies,
  signToken,
  verifyToken,
  buildCookie,
  getCredentials,
  timingSafeEqual
};
