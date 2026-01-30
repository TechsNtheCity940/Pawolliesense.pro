function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toDataUrl(mimeType, base64Data) {
  return `data:${mimeType};base64,${base64Data}`;
}

function buildAbsoluteUrl(rawUrl, baseUrl) {
  if (!rawUrl) return '';
  if (/^https?:\/\//i.test(rawUrl) || rawUrl.startsWith('data:')) return rawUrl;
  if (!baseUrl) return rawUrl;
  if (rawUrl.startsWith('/')) return `${baseUrl}${rawUrl}`;
  return `${baseUrl}/${rawUrl}`;
}

async function fetchImageAsBase64(url, baseUrl) {
  if (!url) return null;
  const resolvedUrl = buildAbsoluteUrl(url, baseUrl);
  if (resolvedUrl.startsWith('data:')) {
    const match = url.match(/^data:(.+);base64,(.+)$/);
    if (!match) return null;
    return { mimeType: match[1], data: match[2] };
  }

  const response = await fetch(resolvedUrl);
  if (!response.ok) return null;
  const contentType = response.headers.get('content-type') || 'image/png';
  const buffer = Buffer.from(await response.arrayBuffer());
  return { mimeType: contentType, data: buffer.toString('base64') };
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const rawPrompts = Array.isArray(payload.prompts) ? payload.prompts : [];
    const prompts = rawPrompts.map((item, index) => {
      if (typeof item === 'string') {
        return { page: index + 1, text: item };
      }
      return {
        page: Number(item?.page || index + 1),
        text: String(item?.text || '')
      };
    });
    const referenceImages = normalizeArray(payload.referenceImages);
    const strictReferences = payload.strictReferences !== false;
    const instruction = String(payload.instruction || '').trim();
    const petName = payload.petName || 'Pet';
    const guardianName = payload.guardianName || 'Guardian';
    const characterNames = payload.characterNames || '';
    const storyline = payload.storyline || '';
    const adminPrompt = payload.adminPrompt || '';
    const notes = payload.notes || '';
    const hasReferences = referenceImages.length > 0;
    const characterDetails = [
      `Pet: ${petName}`,
      `Guardian: ${guardianName}`,
      `Character names: ${characterNames || 'None provided'}`,
      `Story idea: ${storyline || 'None provided'}`,
      `Admin notes: ${notes || 'None'}`,
      `Admin prompt: ${adminPrompt || 'None'}`
    ].join(' | ');

    if (!prompts.length) {
      return jsonResponse(400, { error: 'Image prompts are required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const apiKey = process.env.GEMINI_API_KEY; const endpoint = process.env.GEMINI_IMAGE_ENDPOINT;
    if (!apiKey || !endpoint) {
      const fallback = prompts.map((_, index) => referenceImages[index % referenceImages.length] || '');
      return jsonResponse(200, { images: fallback });
    }

    const protoHeader = event.headers['x-forwarded-proto'] || event.headers['X-Forwarded-Proto'];
    const hostHeader = event.headers.host || event.headers.Host;
    const fallbackBaseUrl = protoHeader && hostHeader ? `${protoHeader}://${hostHeader}` : '';
    const baseUrl = process.env.URL || process.env.DEPLOY_URL || fallbackBaseUrl;

    const referenceParts = [];
    for (let i = 0; i < referenceImages.length; i += 1) {
      const ref = await fetchImageAsBase64(referenceImages[i], baseUrl);
      if (ref) {
        referenceParts.push({
          inlineData: {
            mimeType: ref.mimeType,
            data: ref.data
          }
        });
      }
    }

    const images = [];
    for (const prompt of prompts) {
      const stylePrefix =
        'Pixar-style 3D animated look, soft cinematic lighting, expressive faces, gentle depth of field, vibrant but warm color palette. No text overlays. ';
      const instructionPrefix = instruction ? `Additional instruction: ${instruction}. ` : '';
      const characterPrefix = hasReferences ? '' : `Character details: ${characterDetails}. Keep appearance consistent across pages. `;
      const useReferencePrefix = strictReferences && hasReferences;
      const promptText = useReferencePrefix
        ? `Use the uploaded reference images as the primary character inspiration. Maintain likeness, colors, and defining traits. ${instructionPrefix}${stylePrefix}${prompt.text}`
        : `${characterPrefix}${instructionPrefix}${stylePrefix}${prompt.text}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: promptText },
                ...referenceParts
              ]
            }
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE']
          }
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data?.error?.message || 'Gemini image generation failed.';
        return jsonResponse(response.status, { error: message });
      }
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find((part) => part.inlineData?.data);
      if (!imagePart) {
        images.push({ page: prompt.page, image: '' });
      } else {
        images.push({
          page: prompt.page,
          image: toDataUrl(imagePart.inlineData.mimeType || 'image/png', imagePart.inlineData.data)
        });
      }
    }

    return jsonResponse(200, {
      images,
      imageUrls: images.map((item) => item.image || '')
    });
  } catch (error) {
    return jsonResponse(500, { error: error.message || 'Unable to generate images.' });
  }
};
