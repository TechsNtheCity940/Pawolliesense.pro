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
    const text = payload.text || '';
    if (!text.trim()) {
      return jsonResponse(400, { error: 'No text provided.' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_SPELLCHECK_MODEL || 'gpt-4o-mini';
    if (!apiKey) {
      return jsonResponse(200, { issues: [] });
    }

    const prompt = `
You are a proofreader. Identify potential spelling errors only (not style) in the text.
Return JSON with this shape:
{
  "issues": [
    { "word": "misspelled", "suggestion": "correct", "context": "short excerpt" }
  ]
}
If no issues, return { "issues": [] }.

Text:
${text}
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
        temperature: 0.2,
        max_output_tokens: 800
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data?.error?.message || 'Spellcheck failed.';
      return jsonResponse(response.status, { error: message });
    }

    const rawText = extractOutputText(data);
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      parsed = null;
    }

    const issues = Array.isArray(parsed?.issues) ? parsed.issues : [];
    return jsonResponse(200, { issues });
  } catch (error) {
    return jsonResponse(500, { error: error.message || 'Spellcheck failed.' });
  }
};
