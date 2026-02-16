const {
  PROFILE_SELECT,
  supabaseRequest,
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

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    const id = String(event.queryStringParameters?.id || '').trim();
    if (id) {
      const data = await supabaseRequest({
        path: `/rest/v1/pawmarks_profiles?id=eq.${encodeURIComponent(id)}&select=${encodeURIComponent(PROFILE_SELECT)}&limit=1`
      });
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) {
        return jsonResponse(404, { ok: false, error: 'Pawmark not found.' });
      }
      return jsonResponse(200, { ok: true, data: mapProfile(row) });
    }

    const data = await supabaseRequest({
      path: `/rest/v1/pawmarks_profiles?select=${encodeURIComponent(PROFILE_SELECT)}&order=updated_at.desc&pawmarks_posts.order=created_at_ms.desc`
    });
    const mapped = Array.isArray(data) ? data.map(mapProfile) : [];
    return jsonResponse(200, { ok: true, data: mapped });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error.message || 'Unable to fetch pawmarks.' });
  }
};
