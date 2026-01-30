const {
  COOKIE_NAME,
  parseCookies,
  verifyToken,
  getCredentials
} = require('./_adminAuth');

const OPENAI_URL = 'https://api.openai.com/v1/responses';

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

const getReading = async (readingId) => {
  const data = await supabaseRequest({
    path: `/rest/v1/readings?id=eq.${readingId}&select=*,customers(*),pets(*)`
  });
  return Array.isArray(data) ? data[0] : data;
};

const updateReadingNotes = async (readingId, notes, status) => {
  const payload = { notes, updated_at: new Date().toISOString() };
  if (status) payload.status = status;
  const data = await supabaseRequest({
    path: `/rest/v1/readings?id=eq.${readingId}`,
    method: 'PATCH',
    body: payload
  });
  return Array.isArray(data) ? data[0] : data;
};

const buildPrompt = ({ type, reading }) => {
  const pet = reading?.pets || {};
  const customer = reading?.customers || {};
  const name = pet.name || 'the pet';
  const guardian = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim() || 'guardian';
  const breed = pet.breed || 'unknown breed';
  const age = pet.age || 'unknown age';
  const species = pet.species || 'pet';

  const shared = [
    `Pet name: ${name}`,
    `Species: ${species}`,
    `Breed: ${breed}`,
    `Age: ${age}`,
    `Guardian: ${guardian}`,
    `Personality: ${pet.personality_description || 'No description provided.'}`,
    `Behavior concerns: ${pet.behavior_concerns || 'None.'}`,
    `Bond description: ${pet.bond_description || 'None.'}`,
    `Additional notes: ${pet.additional_notes || 'None.'}`
  ].join('\n');

  if (type === 'paw_reading') {
    return `
Write a Paw Reading (pawprint insight) for a pet. Provide an intuitive, grounded reading that is compassionate and reflective.
Rules:
- 4-6 paragraphs, each 2-4 sentences.
- Avoid claims of certainty, diagnosis, or medical advice.
- End with 2-3 gentle, actionable suggestions.
- Keep tone warm, supportive, and non-judgmental.

${shared}
`;
  }

  return `
Write a Pet Birth Chart / Star Chart reading. Provide symbolic, non-predictive insights about temperament and routines.
Rules:
- 4-6 paragraphs, each 2-4 sentences.
- Avoid deterministic or medical claims.
- Include a short section on comfort cycles or calming rituals.
- End with 2-3 gentle, actionable suggestions.

${shared}
`;
};

const getOpenAiResponse = async ({ prompt, model }) => {
  const apiKey = requiredEnv('OPENAI_API_KEY');
  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: prompt,
      temperature: 0.7,
      max_output_tokens: 900
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || 'OpenAI response failed.');
  }
  const text = data?.output_text || '';
  return { text, id: data?.id, model: data?.model };
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
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
    const readingId = body.readingId;
    const type = body.type;
    const update = body.update !== false;

    if (!readingId || !type) {
      return jsonResponse(400, { ok: false, error: 'Missing readingId or type.' });
    }

    const reading = await getReading(readingId);
    if (!reading) {
      return jsonResponse(404, { ok: false, error: 'Reading not found.' });
    }

    const model = process.env.OPENAI_READING_MODEL || 'gpt-4o-mini';
    const prompt = buildPrompt({ type, reading });
    const aiResult = await getOpenAiResponse({ prompt, model });
    const responseText = aiResult.text?.trim();
    if (!responseText) {
      return jsonResponse(500, { ok: false, error: 'OpenAI returned empty response.' });
    }

    let updated = null;
    if (update) {
      const existingNotes = reading.notes ? `${reading.notes}\n\n` : '';
      const nextNotes = `${existingNotes}${responseText}\n\n(OpenAI Request ID: ${aiResult.id || 'unknown'} | Model: ${aiResult.model || model})`;
      updated = await updateReadingNotes(readingId, nextNotes, 'in_progress');
    }

    return jsonResponse(200, { ok: true, response: responseText, updated });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error.message || 'Unable to generate reading.' });
  }
};
