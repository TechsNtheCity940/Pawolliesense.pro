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

const safeText = (value) => String(value || '').trim();

const parseJsonObject = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
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
  if (event.httpMethod !== 'PATCH') {
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

    const body = event.body ? JSON.parse(event.body) : {};
    const keepsakeOrderId = safeText(body?.keepsakeOrderId);
    if (!keepsakeOrderId) {
      return jsonResponse(400, { ok: false, error: 'Missing keepsakeOrderId.' });
    }

    const rows = await supabaseRequest({
      path: `/rest/v1/keepsake_orders?id=eq.${encodeURIComponent(keepsakeOrderId)}&select=*`
    });
    const current = Array.isArray(rows) ? rows[0] : null;
    if (!current) {
      return jsonResponse(404, { ok: false, error: 'Keepsake order not found.' });
    }

    const patch = {
      updated_at: new Date().toISOString()
    };

    if (body.generatedCopy && typeof body.generatedCopy === 'object') {
      patch.generated_copy = JSON.stringify(body.generatedCopy);
    }

    if (typeof body.generatedAssetUrl === 'string') {
      patch.generated_asset_url = safeText(body.generatedAssetUrl) || null;
    }

    if (typeof body.status === 'string' && safeText(body.status)) {
      patch.status = safeText(body.status);
    }

    if (typeof body.keepsakeNotes === 'string') {
      const existing = parseJsonObject(current.customization);
      patch.customization = {
        ...existing,
        keepsake_notes: safeText(body.keepsakeNotes)
      };
    }

    if (patch.status === 'awaiting_approval') {
      patch.last_error = null;
    }

    const updatedRows = await supabaseRequest({
      path: `/rest/v1/keepsake_orders?id=eq.${encodeURIComponent(keepsakeOrderId)}`,
      method: 'PATCH',
      body: patch
    });
    const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;

    if (updated?.reading_id) {
      const allRows = await supabaseRequest({
        path: `/rest/v1/keepsake_orders?reading_id=eq.${encodeURIComponent(updated.reading_id)}&select=status,last_error`
      });
      const statuses = (Array.isArray(allRows) ? allRows : []).map((row) => safeText(row?.status).toLowerCase());
      let keepsakeStatus = 'queued';
      let keepsakeLastError = null;
      if (statuses.some((status) => status === 'failed')) {
        keepsakeStatus = 'failed';
        const failedRow = (Array.isArray(allRows) ? allRows : []).find(
          (row) => safeText(row?.status).toLowerCase() === 'failed'
        );
        keepsakeLastError = safeText(failedRow?.last_error) || 'Keepsake pipeline has failures.';
      } else if (statuses.every((status) => ['shopify_draft_created', 'submitted', 'fulfilled', 'completed'].includes(status))) {
        keepsakeStatus = 'ready';
      } else if (statuses.some((status) => status === 'awaiting_approval')) {
        keepsakeStatus = 'awaiting_approval';
      } else if (statuses.some((status) => status === 'processing')) {
        keepsakeStatus = 'processing';
      }
      await supabaseRequest({
        path: `/rest/v1/readings?id=eq.${encodeURIComponent(updated.reading_id)}`,
        method: 'PATCH',
        body: {
          keepsake_status: keepsakeStatus,
          keepsake_last_error: keepsakeLastError
        }
      });
    }

    return jsonResponse(200, { ok: true, data: updated });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error.message || 'Unable to update keepsake order.' });
  }
};
