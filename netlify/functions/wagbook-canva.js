function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

const CANVA_BASE = 'https://api.canva.com/rest/v1';

function toDataUrlParts(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
}

async function fetchAsBlob(source, fallbackType) {
  if (!source) return null;
  if (source.startsWith('data:')) {
    const parsed = toDataUrlParts(source);
    if (!parsed) return null;
    const buffer = Buffer.from(parsed.data, 'base64');
    return new Blob([buffer], { type: parsed.mimeType || fallbackType });
  }
  const response = await fetch(source);
  if (!response.ok) return null;
  const contentType = response.headers.get('content-type') || fallbackType;
  const buffer = Buffer.from(await response.arrayBuffer());
  return new Blob([buffer], { type: contentType });
}

async function uploadAsset({ token, blob, filename }) {
  const form = new FormData();
  form.append('file', blob, filename);
  const response = await fetch(`${CANVA_BASE}/assets`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || 'Canva asset upload failed.';
    throw new Error(message);
  }
  return data?.id;
}

async function createDesign({ token, title, width, height }) {
  const response = await fetch(`${CANVA_BASE}/designs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, width, height })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || 'Canva design creation failed.';
    throw new Error(message);
  }
  return data?.id;
}

async function createImportJob({ token, designId, assets }) {
  const response = await fetch(`${CANVA_BASE}/design-imports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ design_id: designId, assets })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || 'Canva import job failed.';
    throw new Error(message);
  }
  return data?.id;
}

async function createExportJob({ token, designId }) {
  const response = await fetch(`${CANVA_BASE}/exports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      design_id: designId,
      format: { type: 'pdf', export_quality: 'pro' }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || 'Canva export job failed.';
    throw new Error(message);
  }
  return data?.id;
}

async function pollExport({ token, exportId }) {
  const maxTries = 20;
  const delayMs = 3000;
  for (let attempt = 0; attempt < maxTries; attempt += 1) {
    const response = await fetch(`${CANVA_BASE}/exports/${exportId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.message || data?.error || 'Canva export poll failed.';
      throw new Error(message);
    }
    if (data?.status === 'success' && data?.download?.url) {
      return data.download.url;
    }
    if (data?.status === 'failed') {
      throw new Error('Canva export failed.');
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error('Canva export timed out.');
}

async function refreshCanvaToken({ refreshToken }) {
  const clientId = process.env.CANVA_CLIENT_ID;
  const clientSecret = process.env.CANVA_CLIENT_SECRET;
  const redirectUri = process.env.CANVA_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Canva OAuth env vars are missing.');
  }

  const response = await fetch('https://api.canva.com/api/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      refresh_token: refreshToken
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error || data?.message || 'Canva refresh token failed.';
    throw new Error(message);
  }
  return data;
}

async function readStoredToken() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  const tokenRes = await fetch(`${supabaseUrl}/rest/v1/canva_tokens?id=eq.default&select=*`, {
    method: 'GET',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  });
  const tokenData = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !Array.isArray(tokenData) || !tokenData.length) {
    return null;
  }
  return tokenData[0];
}

async function upsertStoredToken(tokenPayload) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  const response = await fetch(`${supabaseUrl}/rest/v1/canva_tokens`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
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
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    let token = payload?.accessToken || process.env.CANVA_ACCESS_TOKEN;

    if (!payload?.title || !payload?.coverImage) {
      return jsonResponse(400, { error: 'Missing book title or cover image.' });
    }

    const storyPages = Array.isArray(payload.storyPages) ? payload.storyPages : [];
    const imagePages = Array.isArray(payload.imagePages) ? payload.imagePages : [];
    if (storyPages.length !== 11 || imagePages.length !== 11) {
      return jsonResponse(400, { error: 'Story and image pages must both be 11 items.' });
    }

    const orderedPages = [
      { type: 'title', title: payload.title, coverImage: payload.coverImage },
      ...storyPages.flatMap((storyPage, index) => ([
        { type: 'story', pageNumber: index + 1, text: storyPage.text || '' },
        { type: 'image', pageNumber: index + 1, imageUrl: imagePages[index]?.imageUrl || '' }
      ])),
      { type: 'dedication', text: payload.dedication || '' }
    ];

    if (orderedPages.length !== 24) {
      return jsonResponse(400, { error: 'Ordered pages must total 24 pages.' });
    }

    let storedToken = null;
    if (!token) {
      storedToken = await readStoredToken();
      if (storedToken?.access_token) {
        token = storedToken.access_token;
      }
    }

    if (storedToken?.refresh_token) {
      const expiresAt = storedToken.expires_at ? new Date(storedToken.expires_at).getTime() : 0;
      const now = Date.now();
      const isExpired = expiresAt && now >= expiresAt - 2 * 60 * 1000;
      if (isExpired) {
        const refreshed = await refreshCanvaToken({ refreshToken: storedToken.refresh_token });
        const nextExpiresAt = refreshed?.expires_in
          ? new Date(Date.now() + Number(refreshed.expires_in) * 1000).toISOString()
          : storedToken.expires_at;
        const updated = await upsertStoredToken({
          id: 'default',
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token || storedToken.refresh_token,
          token_type: refreshed.token_type || storedToken.token_type,
          scope: refreshed.scope || storedToken.scope,
          expires_at: nextExpiresAt
        });
        token = updated?.access_token || refreshed.access_token || token;
      }
    }

    if (!token) {
      return jsonResponse(200, { pdfUrl: 'https://example.com/mock-wagbook.pdf', orderedPages });
    }

    const designId = await createDesign({
      token,
      title: payload.title,
      width: 2550,
      height: 3300
    });

    const assets = [];
    for (const page of orderedPages) {
      const pageNumber = assets.length + 1;
      if (page.type === 'title') {
        const coverBlob = await fetchAsBlob(page.coverImage, 'image/png');
        if (!coverBlob) throw new Error('Unable to fetch cover image.');
        const assetId = await uploadAsset({
          token,
          blob: coverBlob,
          filename: `cover-${pageNumber}.png`
        });
        assets.push({ asset_id: assetId, page: pageNumber });
      } else if (page.type === 'story') {
        const textBlob = new Blob([page.text || ''], { type: 'text/plain' });
        const assetId = await uploadAsset({
          token,
          blob: textBlob,
          filename: `story-${pageNumber}.txt`
        });
        assets.push({ asset_id: assetId, page: pageNumber });
      } else if (page.type === 'image') {
        const imageBlob = await fetchAsBlob(page.imageUrl, 'image/png');
        if (!imageBlob) throw new Error(`Unable to fetch image for page ${pageNumber}.`);
        const assetId = await uploadAsset({
          token,
          blob: imageBlob,
          filename: `image-${pageNumber}.png`
        });
        assets.push({ asset_id: assetId, page: pageNumber });
      } else if (page.type === 'dedication') {
        const textBlob = new Blob([page.text || ''], { type: 'text/plain' });
        const assetId = await uploadAsset({
          token,
          blob: textBlob,
          filename: `dedication-${pageNumber}.txt`
        });
        assets.push({ asset_id: assetId, page: pageNumber });
      }
    }

    await createImportJob({ token, designId, assets });
    const exportId = await createExportJob({ token, designId });
    const pdfUrl = await pollExport({ token, exportId });

    return jsonResponse(200, { pdfUrl, orderedPages, designId });
  } catch (error) {
    return jsonResponse(500, { error: error.message || 'Unable to export PDF.' });
  }
};
