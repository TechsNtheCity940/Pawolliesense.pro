const RESEND_API_BASE = 'https://api.resend.com';

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');

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

const resendRequest = async ({ apiKey, path, method = 'GET', body }) => {
  const response = await fetch(`${RESEND_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
};

const normalizeContactInput = ({ email, firstName, lastName, properties }) => ({
  email: String(email || '').trim().toLowerCase(),
  firstName: String(firstName || '').trim() || undefined,
  lastName: String(lastName || '').trim() || undefined,
  properties: properties && typeof properties === 'object' ? properties : undefined
});

const upsertGlobalContact = async ({ apiKey, email, firstName, lastName, properties }) => {
  const encodedEmail = encodeURIComponent(email);

  const patchAttempt = await resendRequest({
    apiKey,
    path: `/contacts/${encodedEmail}`,
    method: 'PATCH',
    body: {
      firstName,
      lastName,
      unsubscribed: false,
      properties
    }
  });

  if (patchAttempt.ok) {
    return { ok: true, mode: 'updated', data: patchAttempt.data };
  }

  if (patchAttempt.status !== 404) {
    throw new Error(patchAttempt.data?.message || patchAttempt.data?.error || 'Unable to update Resend contact.');
  }

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

  if (!createAttempt.ok) {
    throw new Error(createAttempt.data?.message || createAttempt.data?.error || 'Unable to create Resend contact.');
  }

  return { ok: true, mode: 'created', data: createAttempt.data };
};

const upsertAudienceContact = async ({ apiKey, audienceId, email, firstName, lastName }) => {
  const encodedEmail = encodeURIComponent(email);
  const basePath = `/audiences/${encodeURIComponent(audienceId)}/contacts`;

  const patchAttempt = await resendRequest({
    apiKey,
    path: `${basePath}/${encodedEmail}`,
    method: 'PATCH',
    body: {
      firstName,
      lastName,
      unsubscribed: false
    }
  });

  if (patchAttempt.ok) {
    return { ok: true, mode: 'updated', data: patchAttempt.data };
  }

  if (patchAttempt.status !== 404) {
    throw new Error(patchAttempt.data?.message || patchAttempt.data?.error || 'Unable to update audience contact.');
  }

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
