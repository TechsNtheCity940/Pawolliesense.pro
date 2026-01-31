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

const parseAdditionalNotes = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return { raw: String(raw) };
  }
};

const buildPrompt = ({ serviceKey, reading }) => {
  const pet = reading?.pets || {};
  const customer = reading?.customers || {};
  const extra = parseAdditionalNotes(pet.additional_notes);
  const guardian = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim() || 'guardian';
  const name = pet.name || 'the pet';
  const breed = pet.breed || 'unknown breed';
  const age = pet.age || 'unknown age';
  const species = pet.species || 'pet';

  const shared = [
    `Pet name: ${name}`,
    `Species: ${species}`,
    `Breed: ${breed}`,
    `Age: ${age}`,
    `Guardian: ${guardian}`,
    `Personality notes: ${pet.personality_description || extra.pf_traits || 'None provided.'}`,
    `Bond notes: ${extra.pf_bond || 'None provided.'}`,
    `Behavior notes: ${extra.bg_story || 'None provided.'}`,
    `Memorial notes: ${pet.memorial_message || extra.pm_message || 'None provided.'}`,
    `Additional notes: ${pet.additional_notes || 'None provided.'}`
  ].join('\n');

  const rules = [
    'Write a compassionate, grounded response tailored to the pet and guardian.',
    'Avoid medical/veterinary diagnosis or claims of certainty.',
    'Provide helpful, gentle guidance with actionable steps.',
    'Do not mention AI, OpenAI, or model names.'
  ];

  if (serviceKey === 'quick_quest' || serviceKey === 'express_pawdate' || serviceKey === 'bond_spark') {
    const question = extra.quick_prompt || extra.qq_prompt || extra.question || 'Offer a gentle check-in and guidance.';
    return [
      'Quick Quest response.',
      'Structure: 1 short paragraph + 3 bullet suggestions + 1 closing sentence.',
      ...rules,
      `Question: ${question}`,
      shared
    ].join('\n');
  }

  if (serviceKey === 'paw_reading') {
    return [
      'Paw Reading (pawprint insight).',
      'Structure: 4-6 short paragraphs, 2-4 sentences each.',
      ...rules,
      shared
    ].join('\n');
  }

  if (serviceKey === 'star_chart') {
    return [
      'Star Chart (pet astrology insight).',
      'Structure: 4-6 short paragraphs, 2-4 sentences each.',
      'Include a short section on comfort cycles or calming rituals.',
      ...rules,
      shared
    ].join('\n');
  }

  if (serviceKey === 'pawollie_vision') {
    return [
      'Pawollie Vision (spirit portrait) narrative.',
      'Structure: 3-5 short paragraphs, poetic but clear.',
      'Describe the emotional tone, symbolism, and colors to guide the portrait.',
      ...rules,
      shared
    ].join('\n');
  }

  if (serviceKey === 'behavior_bond_guidance') {
    return [
      'Behavior Bond Guidance.',
      'Structure: 4-6 short paragraphs, 2-4 sentences each.',
      'Focus on emotional triggers and supportive guidance.',
      ...rules,
      shared
    ].join('\n');
  }

  if (serviceKey === 'full_spirit_pawfile') {
    return [
      'Full Spirit Pawfile.',
      'Structure: 5-7 short paragraphs, 2-4 sentences each.',
      'Cover archetype, communication style, emotional energy, love language, and bond reflection.',
      ...rules,
      shared
    ].join('\n');
  }

  return [
    'Pawollie Sense reading.',
    'Structure: 3-5 short paragraphs, 2-4 sentences each.',
    ...rules,
    shared
  ].join('\n');
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
  if (data.output_text) {
    return { text: String(data.output_text).trim(), id: data?.id, model: data?.model };
  }

  const output = data.output || [];
  const textChunks = [];
  output.forEach((item) => {
    (item.content || []).forEach((content) => {
      if (content.type === 'output_text' && content.text) {
        textChunks.push(content.text);
      }
    });
  });

  const text = textChunks.join('\n').trim();
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
    if (!readingId) {
      return jsonResponse(400, { ok: false, error: 'Missing readingId.' });
    }

    const data = await supabaseRequest({
      path: `/rest/v1/readings?id=eq.${readingId}&select=*,customers(*),pets(*)`
    });
    const reading = Array.isArray(data) ? data[0] : data;
    if (!reading) {
      return jsonResponse(404, { ok: false, error: 'Reading not found.' });
    }

    const services = Array.isArray(reading.services) ? reading.services : [];
    const serviceKey = String(body.service || services[0] || '').trim();
    if (!serviceKey) {
      return jsonResponse(400, { ok: false, error: 'Missing service key.' });
    }

    const model = process.env.OPENAI_READING_MODEL || 'gpt-4o-mini';
    const instruction = String(body.instruction || '').trim();
    const basePrompt = buildPrompt({ serviceKey, reading });
    const prompt = instruction
      ? `${basePrompt}\n\nAdmin reprompt instructions:\n${instruction}`
      : basePrompt;
    const aiResult = await getOpenAiResponse({ prompt, model });
    const responseText = aiResult.text?.trim();
    if (!responseText) {
      return jsonResponse(500, { ok: false, error: 'OpenAI returned empty response.' });
    }

    const existingNotes = reading.notes ? `${reading.notes}\n\n` : '';
    const nextNotes = `${existingNotes}${responseText}\n\n(OpenAI Request ID: ${aiResult.id || 'unknown'} | Model: ${aiResult.model || model})`;
    await supabaseRequest({
      path: `/rest/v1/readings?id=eq.${readingId}`,
      method: 'PATCH',
      body: {
        notes: nextNotes,
        status: 'completed',
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }
    });

    return jsonResponse(200, { ok: true, response: responseText });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error.message || 'Unable to generate response.' });
  }
};
