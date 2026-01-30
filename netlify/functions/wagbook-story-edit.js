function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
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
    const pages = Array.isArray(payload.pages) ? payload.pages : [];
    const instruction = payload.instruction || '';
    const tone = payload.tone || 'Warm + reverent';
    const petName = payload.petName || 'Pet';
    const guardianName = payload.guardianName || 'Guardian';

    if (!pages.length) {
      return jsonResponse(400, { error: 'No pages provided to edit.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_STORY_MODEL || 'gpt-4o-mini';
    if (!apiKey) {
      return jsonResponse(200, { pages });
    }

    const prompt = `
You are editing specific pages of a pet keepsake story. Return JSON only.
Tone: ${tone}
Pet: ${petName}
Guardian: ${guardianName}
Instruction: ${instruction || 'Improve clarity and flow while preserving meaning.'}
Length: 10-12 sentences per page.
Keep sentences short (8-14 words) and avoid long clauses.
Visual detail: include setting, lighting, colors, objects, and actions so images can match.
Avoid placeholders like "(name)"; use the provided names.

Pages to edit:
${pages.map((page) => `Page ${page.page}: ${page.text}`).join('\n')}

Return JSON:
{ "pages": [ { "page": 1, "text": "..." }, ... ] }
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
        temperature: 0.6,
        max_output_tokens: 1200,
        text: { format: { type: 'json_object' } }
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || 'OpenAI edit failed.';
      return jsonResponse(response.status, { error: message });
    }

    const rawText = extractOutputText(data);
    const parsed = parseJsonFromText(rawText);

    const edited = Array.isArray(parsed?.pages) ? parsed.pages : pages;
    return jsonResponse(200, {
      pages: edited.map((page, index) => ({
        page: page?.page ?? pages[index]?.page ?? index + 1,
        text: page?.text ?? pages[index]?.text ?? ''
      }))
    });
  } catch (error) {
    return jsonResponse(500, { error: error.message || 'Unable to edit story.' });
  }
};
