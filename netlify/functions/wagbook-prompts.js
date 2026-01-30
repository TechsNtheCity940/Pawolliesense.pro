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
    const storyTitle = payload.storyTitle || `${petName}'s Wag Book`;
    const storyPages = Array.isArray(payload.storyPages) ? payload.storyPages : [];
    const hasReferences = Boolean(payload.hasReferences);
    const characterDetails = [
      `Pet: ${petName}`,
      `Guardian: ${guardianName}`,
      `Character names: ${characterNames || 'None provided'}`,
      `Story idea: ${storyline || 'None provided'}`,
      `Admin notes: ${notes || 'None'}`,
      `Admin prompt: ${adminPrompt || 'None'}`
    ].join('\n');

    if (!storyPages.length) {
      return jsonResponse(400, { error: 'Story pages are required to build prompts.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_PROMPT_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      const prompts = storyPages.map((text, index) => {
        const base = `Illustrate scene ${index + 1}: ${text}`;
        return hasReferences ? base : `${characterDetails}\n${base}`;
      });
      return jsonResponse(200, { prompts });
    }

    const prompt = `
You are creating image prompts for a pet keepsake storybook. Return JSON only.
Requirements:
- Provide 11 image prompts, one per story page.
- Match each prompt to the corresponding story page.
- Keep the style cohesive, warm, and storybook friendly.
- All images must be Pixar-style: 3D animated look, soft cinematic lighting, expressive faces, gentle depth of field, vibrant but warm color palette.
- Avoid text overlays in the image.
${hasReferences ? '- Reference images are available; use them to keep characters consistent across all prompts.' : '- No reference images are provided. Include the character details in EVERY prompt to keep the pet and guardian consistent.'}

Story title: ${storyTitle}
Tone: ${tone}
Pet name: ${petName}
Guardian name: ${guardianName}
Character names: ${characterNames || 'None provided'}
Story idea: ${storyline || 'None provided'}
Admin notes: ${notes || 'None'}
Admin prompt: ${adminPrompt || 'None'}
Character details (include in each prompt when no references):
${characterDetails}

Story pages:
${storyPages.map((item, idx) => {
  const pageNum = item?.page ?? idx + 1;
  const text = item?.text ?? item;
  return `Page ${pageNum}: ${text}`;
}).join('\n')}

Return JSON with this shape:
{ "prompts": [
  { "page": 1, "text": "prompt 1" },
  ...
  { "page": 11, "text": "prompt 11" }
] }
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
        max_output_tokens: 800
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || 'OpenAI prompt generation failed.';
      return jsonResponse(response.status, { error: message });
    }

    const rawText = extractOutputText(data);
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      parsed = null;
    }

    const prompts = Array.isArray(parsed?.prompts)
      ? parsed.prompts.slice(0, 11)
      : storyPages.map((item, index) => ({
        page: item?.page ?? index + 1,
        text: `Illustrate scene ${item?.page ?? index + 1}: ${item?.text ?? item}`
      }));

    const normalized = prompts.map((item, index) => {
      const text = item?.text ?? item;
      const page = item?.page ?? index + 1;
      if (!hasReferences) {
        return {
          page,
          text: `${characterDetails}\n${text}`
        };
      }
      return { page, text };
    });

    return jsonResponse(200, { prompts: normalized });
  } catch (error) {
    return jsonResponse(500, { error: error.message || 'Unable to generate prompts.' });
  }
};
