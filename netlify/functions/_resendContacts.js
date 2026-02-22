const RESEND_API_BASE = 'https://api.resend.com';

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRetryAfterMs = (headers) => {
  const retryAfter = headers?.get?.('retry-after');
  const seconds = Number(retryAfter || 0);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(Math.ceil(seconds * 1000), 5000);
  }
  return 650;
};

const getResendApiKey = () =>
  firstDefined(
    process.env.RESEND_API_KEY,
    process.env.Resend_API_KEY,
    process.env.Resend_API_Key,
    process.env.RESEND_API_Key
  );

const getResendAudienceId = () =>
  firstDefined(
    process.env.RESEND_AUDIENCE_ID,
    process.env.RESEND_CONTACTS_AUDIENCE_ID
  );

const getAllowedPropertyKeys = () =>
  String(process.env.RESEND_CONTACT_PROPERTY_KEYS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const sanitizeProperties = (properties) => {
  if (!properties || typeof properties !== 'object') return undefined;
  const allowedKeys = getAllowedPropertyKeys();
  if (!allowedKeys.length) return undefined;
  const sanitized = {};
  allowedKeys.forEach((key) => {
    const value = properties[key];
    if (value === undefined || value === null) return;
    const next = String(value).trim();
    if (!next) return;
    sanitized[key] = next;
  });
  return Object.keys(sanitized).length ? sanitized : undefined;
};

const resendRequest = async ({ apiKey, path, method = 'GET', body, retries = 1 }) => {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(`${RESEND_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));

    if (response.status !== 429 || attempt >= retries) {
      return { ok: response.ok, status: response.status, data, headers: response.headers };
    }
    await sleep(parseRetryAfterMs(response.headers));
  }

  return { ok: false, status: 429, data: { message: 'rate limit exceeded' } };
};

const normalizeContactInput = ({ email, firstName, lastName, properties }) => ({
  email: String(email || '').trim().toLowerCase(),
  firstName: String(firstName || '').trim() || undefined,
  lastName: String(lastName || '').trim() || undefined,
  properties: sanitizeProperties(properties)
});

const upsertGlobalContact = async ({ apiKey, email, firstName, lastName, properties }) => {
  const createAttempt = await resendRequest({
    apiKey,
    path: '/contacts',
    method: 'POST',
    body: {
      email,
      firstName,
      lastName,
      unsubscribed: false,
      properties
    }
  });

  if (createAttempt.status === 409 || String(createAttempt.data?.message || '').toLowerCase().includes('already')) {
    return { ok: true, mode: 'exists', data: createAttempt.data };
  }

  if (!createAttempt.ok) {
    throw new Error(createAttempt.data?.message || createAttempt.data?.error || 'Unable to create Resend contact.');
  }

  return { ok: true, mode: 'created', data: createAttempt.data };
};

const upsertAudienceContact = async ({ apiKey, audienceId, email, firstName, lastName }) => {
  const basePath = `/audiences/${encodeURIComponent(audienceId)}/contacts`;

  const createAttempt = await resendRequest({
    apiKey,
    path: basePath,
    method: 'POST',
    body: {
      email,
      firstName,
      lastName,
      unsubscribed: false
    }
  });

  if (createAttempt.status === 409 || String(createAttempt.data?.message || '').toLowerCase().includes('already')) {
    return { ok: true, mode: 'exists', data: createAttempt.data };
  }

  if (!createAttempt.ok) {
    throw new Error(createAttempt.data?.message || createAttempt.data?.error || 'Unable to create audience contact.');
  }

  return { ok: true, mode: 'created', data: createAttempt.data };
};

const upsertResendContact = async ({ email, firstName, lastName, properties } = {}) => {
  const apiKey = getResendApiKey();
  const normalized = normalizeContactInput({ email, firstName, lastName, properties });

  if (!apiKey) return { ok: false, skipped: true, reason: 'missing_api_key' };
  if (!normalized.email) return { ok: false, skipped: true, reason: 'missing_email' };

  try {
    const result = await upsertGlobalContact({
      apiKey,
      email: normalized.email,
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      properties: normalized.properties
    });
    return { ok: true, mode: result.mode, data: result.data };
  } catch (error) {
    const audienceId = getResendAudienceId();
    if (!audienceId) {
      throw error;
    }
    const fallback = await upsertAudienceContact({
      apiKey,
      audienceId,
      email: normalized.email,
      firstName: normalized.firstName,
      lastName: normalized.lastName
    });
    return { ok: true, mode: fallback.mode, data: fallback.data, fallback: 'audience' };
  }
};

module.exports = {
  getResendApiKey,
  upsertResendContact
};
