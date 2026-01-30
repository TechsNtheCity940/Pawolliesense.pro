function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function buildMockStory({ petName, guardianName }) {
  const pages = Array.from({ length: 11 }, (_, index) => ({
    page: index + 1,
    text:
      `${petName} and ${guardianName} step into chapter ${index + 1} with a clear, scene-ready moment. ` +
      `${petName} pads across a warm floor while morning light spills across the room and catches the soft colors of their fur. ` +
      `${guardianName} kneels nearby, smiling, with a favorite blanket and a small toy that adds a pop of color. ` +
      `A familiar sound—keys, a kettle, or a quiet breeze—anchors the space and sets the mood. ` +
      `${petName} tilts their head, ears alert, then trots closer as if answering a gentle call. ` +
      `They pause together by a window where the outside world is calm and inviting. ` +
      `The scene includes a few treasured details: a framed photo, a cozy cushion, and a soft glow on the wall. ` +
      `${guardianName} offers a hand, and ${petName} responds with a nuzzle that shows trust and affection. ` +
      `A playful beat follows—maybe a tiny leap, a tail wag, or a quiet roll into the sunbeam. ` +
      `The moment closes with both of them settled side by side, the room peaceful and full of love.`
  }));
  return {
    title: `${petName}'s Wag Book`,
    coverTitle: `${petName}'s Wag Book`,
    coverSubtitle: `A keepsake journey for ${guardianName}`,
    dedication: `Dedicated to ${petName}.`,
    coverImage: '',
    pages
  };
}

function extractOutputText(data) {
  if (!data) return '';
  if (data.output_text) return data.output_text;
  if (Array.isArray(data.output)) {
    return data.output
      .map((item) =>
        Array.isArray(item.content)
          ? item.content.map((content) => content.text || '').join('')
          : ''
      )
      .join('');
  }
  return '';
}

function parseJsonFromText(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json|```/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch (innerError) {
      return null;
    }
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const petName = payload.petName || 'Pet';
    const guardianName = payload.guardianName || 'Guardian';
    const characterNames = payload.characterNames || '';
    const storyline = payload.storyline || '';
    const tone = payload.tone || 'Warm + reverent';
    const adminPrompt = payload.adminPrompt || '';
    const notes = payload.notes || '';
    const coverImage = payload.coverImage || '';

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_STORY_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      const mock = buildMockStory({ petName, guardianName });
      return jsonResponse(200, { ...mock, coverImage });
    }

    const prompt = `
You are writing a keepsake storybook for a pet. Return JSON only.
Story requirements:
- 11 story pages (page 1-11), each 10-12 sentences.
- Keep sentences short (8-14 words) and avoid long clauses.
- Each page must be visually detailed (setting, lighting, colors, objects, actions) so an illustrator can match the scene.
- Avoid placeholders like "(name)"; use the provided names directly.
- Title page text and dedication page text.
- Tone: ${tone}
- Pet name: ${petName}
- Guardian name: ${guardianName}
- Character names: ${characterNames || 'None provided'}
- Story idea: ${storyline || 'None provided'}
- Admin notes: ${notes || 'None'}
- Additional constraints: ${adminPrompt || 'None'}

Return JSON with this shape:
{
  "title": "string",
  "dedication": "string",
  "cover_title": "string",
  "cover_subtitle": "string",
  "pages": [
    { "page": 1, "text": "..." },
    ...
    { "page": 11, "text": "..." }
  ]
}
`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        input: prompt,
        temperature: 0.7,
        max_output_tokens: 1700,
        text: { format: { type: 'json_object' } }
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || 'OpenAI story generation failed.';
      return jsonResponse(response.status, { error: message });
    }

    const rawText = extractOutputText(data);
    const parsed = parseJsonFromText(rawText);

    if (!parsed || !Array.isArray(parsed.pages)) {
      const fallback = buildMockStory({ petName, guardianName });
      return jsonResponse(200, { ...fallback, coverImage });
    }

    return jsonResponse(200, {
      title: parsed.title || `${petName}'s Wag Book`,
      coverTitle: parsed.cover_title || parsed.title || `${petName}'s Wag Book`,
      coverSubtitle: parsed.cover_subtitle || `A keepsake journey for ${guardianName}`,
      dedication: parsed.dedication || `Dedicated to ${petName}.`,
      pages: parsed.pages.slice(0, 11).map((page, index) => ({
        page: page.page || index + 1,
        text: page.text || ''
      })),
      coverImage
    });
  } catch (error) {
    return jsonResponse(500, { error: error.message || 'Unable to generate story.' });
  }
};
