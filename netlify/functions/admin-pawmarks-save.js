const {
  COOKIE_NAME,
  parseCookies,
  verifyToken,
  getCredentials
} = require('./_adminAuth');

const {
  PROFILE_SELECT,
  supabaseRequest,
  sanitizeProfileInput,
  sanitizePostsInput,
  mapProfile
} = require('./_pawmarksDb');

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  },
  body: JSON.stringify(body)
});

const requireAdmin = (event) => {
  const { secret } = getCredentials();
  if (!secret) {
    throw new Error('Admin auth is not configured.');
  }
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || '');
  const token = cookies[COOKIE_NAME];
  const payload = verifyToken(token, secret);
  if (!payload) {
    const error = new Error('Unauthorized.');
    error.statusCode = 401;
    throw error;
  }
  return payload;
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    requireAdmin(event);
    const body = event.body ? JSON.parse(event.body) : {};
    const profileInput = body?.profile || {};

    const profileRow = sanitizeProfileInput(profileInput);
    if (!profileRow.id || !profileRow.pet_name || !profileRow.owner_name || !profileRow.hero_image) {
      return jsonResponse(400, { ok: false, error: 'Profile is missing required fields.' });
    }

    const posts = sanitizePostsInput(profileInput);

    const upserted = await supabaseRequest({
      path: '/rest/v1/pawmarks_profiles',
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: profileRow
    });

    await supabaseRequest({
      path: `/rest/v1/pawmarks_posts?profile_id=eq.${encodeURIComponent(profileRow.id)}`,
      method: 'DELETE',
      prefer: 'return=minimal'
    });

    if (posts.length) {
      await supabaseRequest({
        path: '/rest/v1/pawmarks_posts',
        method: 'POST',
        prefer: 'return=representation',
        body: posts
      });
    }

    const refreshed = await supabaseRequest({
      path: `/rest/v1/pawmarks_profiles?id=eq.${encodeURIComponent(profileRow.id)}&select=${encodeURIComponent(PROFILE_SELECT)}&limit=1`
    });

    const row = Array.isArray(refreshed) ? refreshed[0] : Array.isArray(upserted) ? upserted[0] : null;
    return jsonResponse(200, {
      ok: true,
      data: row ? mapProfile(row) : null
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return jsonResponse(statusCode, { ok: false, error: error.message || 'Unable to save pawmark.' });
  }
};
