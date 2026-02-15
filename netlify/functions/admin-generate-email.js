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

const asText = (value, fallback = 'Unknown') => {
  if (value === null || value === undefined || value === '') return fallback;
  if (Array.isArray(value)) {
    const cleaned = value.map((item) => String(item || '').trim()).filter(Boolean);
    return cleaned.length ? cleaned.join(', ') : fallback;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, item]) => `${key}: ${item}`)
      .filter((line) => !line.endsWith(': '));
    return entries.length ? entries.join('; ') : fallback;
  }
  return String(value).trim() || fallback;
};

const yesNo = (value) => {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return 'unknown';
  if (['yes', 'true', '1', 'on'].includes(normalized)) return 'yes';
  if (['no', 'false', '0', 'off'].includes(normalized)) return 'no';
  return normalized;
};

const normalizeServiceKey = (raw) => {
  const key = String(raw || '').trim().toLowerCase();
  const aliases = {
    full_discovery: 'full_spirit_pawfile',
    full_spirit_profile: 'full_spirit_pawfile',
    behavior_focus: 'behavior_bond_guidance',
    canine_birth_chart: 'star_chart',
    past_life_paw_reading: 'paw_reading',
    pawollie_pack: 'all_paws_pack'
  };
  return aliases[key] || key;
};

const BRAND_GUARDRAILS = [
  'Brand guardrails (always on):',
  '- Tone: warm, grounded, modern, spiritually themed but not preachy.',
  '- Avoid melodrama, guilt, certainty claims, or owner shaming.',
  '- No medical diagnosis; if health issues are implied, gently recommend a veterinarian.',
  '- No guarantees about afterlife or absolute claims.',
  '- Use possibility language such as may, often, suggests, and possible.',
  '- Use clean headings, short paragraphs, and actionable bullets.'
];

const buildIntakeBlock = (reading) => {
  const pet = reading?.pets || {};
  const customer = reading?.customers || {};
  const extra = parseAdditionalNotes(pet.additional_notes);
  const clientName = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim();

  const lines = [
    'PAWOLLIE SENSE - CLIENT INTAKE (paste + fill)',
    `Client name: ${asText(clientName, 'Unknown')}`,
    `Email: ${asText(customer.email)}`,
    `Pet name: ${asText(pet.name)}`,
    `Species/Breed (or best guess): ${asText(`${asText(pet.species, 'Unknown species')} / ${asText(pet.breed, 'Unknown breed')}`, 'Unknown')}`,
    `Age: ${asText(extra.age)}`,
    `Sex (M/F) + spayed/neutered: ${asText(extra.sex)}`,
    `How long owner has had pet: ${asText(extra.owner_duration)}`,
    `Rescue/rehomed? (yes/no + details): ${asText(extra.rescue_rehomed, 'unknown')} | ${asText(extra.rescue_details, 'no details')}`,
    `Home environment (kids/other pets/space/routine): ${asText(extra.home_environment)}`,
    `Energy level (low/medium/high): ${asText(extra.energy_level, 'medium')}`,
    `Primary goal for this reading: ${asText(extra.primary_goal)}`,
    `Top 3 concerns (bond, behavior, anxiety, grief, communication, etc.): ${asText(extra.top_concerns)}`,
    `Behavior notes (what/when/where/how often/triggers): ${asText(extra.behavior_notes)}`,
    `Health notes (known conditions, meds, recent vet visit date): ${asText(extra.health_notes)}`,
    `Training history (what's been tried + results): ${asText(extra.training_history)}`,
    `Birth info (if known): date / time / city-state-country: ${asText(pet.birth_date, 'unknown')} / ${asText(extra.birth_time, 'unknown')} / ${asText(extra.birth_location, 'unknown')}`,
    `If unknown: estimated timeframe + location OR "unknown": ${asText(extra.birth_unknown_notes, asText(extra.bc_unknown_notes, 'unknown'))}`,
    'Owner preferences:',
    `Tone (gentle/direct/uplifting): ${asText(extra.owner_tone, 'gentle')}`,
    `Spiritual level (light/medium/deep): ${asText(extra.spiritual_level, 'medium')}`,
    `Do they want actionable steps? (yes/no): ${yesNo(extra.want_action_steps)}`,
    `Anything to avoid mentioning: ${asText(extra.avoid_mentions, 'none')}`,
    `Quick tone preference (if submitted): ${asText(extra.quick_tone, 'none')}`,
    'Photo Checklist',
    `1) Face/eyes close-up: ${yesNo(extra.core_photo_face)}`,
    `2) Full body standing: ${yesNo(extra.core_photo_full_body)}`,
    `3) Paw pads close-up: ${yesNo(extra.core_photo_paw)}`,
    `4) Candid in their element: ${yesNo(extra.core_photo_candid)}`,
    `5) Memorial photos: ${yesNo(extra.core_photo_memorial)}`
  ];

  const behaviorBlock = [
    'BEHAVIOR DEEP-DIVE (add-on)',
    `1) What exact behaviors concern you? (list): ${asText(extra.bg_behaviors, asText(extra.bg_story, 'none provided'))}`,
    `2) When did each start?: ${asText(extra.bg_start)}`,
    `3) Triggers you notice: ${asText(extra.bg_triggers)}`,
    `4) Frequency + intensity (1-10): ${asText(extra.bg_frequency_intensity)}`,
    `5) What helps? What makes it worse?: ${asText(extra.bg_helps_worse)}`,
    `6) Daily routine (wake, meals, walks, play, alone time): ${asText(extra.bg_routine)}`,
    `7) Any recent changes (move, new pet, new person, schedule)?: ${asText(extra.bg_recent_changes)}`,
    `8) Vet notes: pain, allergies, hearing/vision, meds?: ${asText(extra.bg_vet_notes)}`
  ];

  const pastLifeBlock = [
    'PAST LIFE OPT-IN (required)',
    `1) Comfortable with symbolic spiritual framing? (yes/no): ${yesNo(extra.pl_opt_in)}`,
    `2) Keep it light, medium, or deep?: ${asText(extra.pl_depth)}`,
    `3) Anything to avoid mentioning?: ${asText(extra.pl_avoid, 'none')}`,
    `4) Focus more on bond/lessons/purpose/patterns: ${asText(extra.pl_focus)}`,
    `5) Paw photos provided? (yes/no): ${yesNo(extra.pl_paw_photos)}`
  ];

  const birthChartBlock = [
    'BIRTH CHART DETAILS',
    `Birth date (or best estimate): ${asText(extra.bc_birth_date, asText(pet.birth_date, 'unknown'))}`,
    `Birth time (exact / approximate / unknown): ${asText(extra.bc_birth_time)}`,
    `Birth location (city, state/province, country): ${asText(extra.bc_birth_location)}`,
    `If unknown: adoption date + location and any known early-life notes: ${asText(extra.bc_unknown_notes, asText(extra.birth_unknown_notes, 'unknown'))}`
  ];

  const memorialBlock = [
    'MEMORIAL DETAILS',
    `Pet's full name: ${asText(pet.name)}`,
    `Dates (birth/adoption, passing date if applicable): ${asText(pet.birth_date, 'unknown')} | passing: ${asText(extra.pm_status, 'not provided')}`,
    `Owner's relationship story (short): ${asText(extra.memorial_story, asText(extra.pm_honor, 'none provided'))}`,
    `Favorite quirks / routines: ${asText(extra.memorial_quirks)}`,
    `Hardest part right now: ${asText(extra.memorial_hardest_part)}`,
    `Closure message as if from pet requested? (yes/no): ${yesNo(extra.memorial_closure_message)}`,
    `Spiritual level for memorial (light/medium/deep): ${asText(extra.memorial_spiritual_level, asText(extra.spiritual_level, 'medium'))}`,
    `Anything to avoid mentioning: ${asText(extra.memorial_avoid, asText(extra.avoid_mentions, 'none'))}`
  ];

  const personalityBlock = [
    'PERSONALITY FOCUS DETAILS',
    `Top personality words (up to 6): ${asText(extra.pf_traits)}`,
    `How they show love: ${asText(extra.pf_love)}`,
    `How they communicate clearly: ${asText(extra.pf_communicate)}`,
    `Bond snapshot: ${asText(extra.pf_bond)}`
  ];

  const deepDiscoveryBlock = [
    'DEEP DISCOVERY DETAILS',
    `Reading focus preference: ${asText(extra.dd_focus)}`,
    `Paw source (if paw reading): ${asText(extra.paw_source)}`,
    `Vision style (if portrait): ${asText(extra.vision_style)}`,
    `Additional deep notes: ${asText(extra.dd_notes)}`
  ];

  const packBlock = [
    'PACK DETAILS',
    `Pack goal: ${asText(extra.pack_goal)}`,
    `All-Paws notes: ${asText(extra.allpaws_notes)}`,
    `Furmily pet count: ${asText(extra.furmily_count)}`,
    `Furmily selections: ${asText(extra.furmily_selections, 'none')}`
  ];

  if (extra.pf_traits || extra.pf_love || extra.pf_communicate || extra.pf_bond) {
    lines.push('', ...personalityBlock);
  }
  if (extra.bg_behaviors || extra.bg_story || extra.bg_start) {
    lines.push('', ...behaviorBlock);
  }
  if (extra.pl_opt_in || extra.pl_focus || extra.pl_depth) {
    lines.push('', ...pastLifeBlock);
  }
  if (extra.bc_birth_date || extra.bc_birth_time || extra.bc_birth_location || extra.bc_unknown_notes || extra.sc_location) {
    lines.push('', ...birthChartBlock);
  }
  if (pet.is_memorial || pet.memorial_message || extra.pm_status === 'Passed') {
    lines.push('', ...memorialBlock);
  }
  if (extra.dd_focus || extra.paw_source || extra.vision_style || extra.dd_notes) {
    lines.push('', ...deepDiscoveryBlock);
  }
  if (extra.pack_goal || extra.allpaws_notes || extra.furmily_count || extra.furmily_selections) {
    lines.push('', ...packBlock);
  }

  return lines.join('\n');
};

const buildPrompt = ({ serviceKey, reading }) => {
  const intakeBlock = buildIntakeBlock(reading);
  const extra = parseAdditionalNotes(reading?.pets?.additional_notes);
  const normalizedServiceKey = normalizeServiceKey(serviceKey);
  const quickQuestion = asText(extra.quick_prompt || extra.qq_prompt || extra.question, 'Offer a gentle check-in and guidance.');

  const templates = {
    full_spirit_pawfile: [
      'You are Pawollie Sense\'s Full Discovery reader. Create a warm, grounded, modern spiritual profile for this pet using the intake and photos.',
      'Be confident but never absolute. Avoid medical diagnosis. Keep it practical and loving.',
      'OUTPUT FORMAT (use these headings exactly):',
      '1) Essence Snapshot',
      '2) Personality and Archetype',
      '3) Love Language Map (top 3 ranked)',
      '4) Communication Style (how they signal needs)',
      '5) What They Need From You (bullets: They need... / You can...)',
      '6) Bond Strengtheners (5 specific daily actions, each <2 sentences)',
      '7) Stress Signals and Soothers',
      '8) If They Could Say One Thing (short message, not cheesy)',
      '9) Gentle Disclaimer',
      '',
      'Rules:',
      '- No past-life content unless the client opted in.',
      '- Use may/often/suggests framing.',
      '- If health or pain is implied, recommend a veterinarian gently.',
      '',
      'PAWOLLIE SENSE CLIENT INTAKE:',
      intakeBlock
    ],
    personality_focus: [
      'You are Pawollie Sense\'s Personality Focus reader. Write a clear, uplifting personality profile for this pet.',
      'Keep it grounded, modern, and easy to skim.',
      'OUTPUT FORMAT:',
      '1) Personality Snapshot (6-10 sentences)',
      '2) Top Traits (5 traits; each with a real-life example)',
      '3) Bonding Style (what closeness looks like for them)',
      '4) Love Language Map (rank top 3 and explain)',
      '5) Communication Cues (how they say yes/no/need space/need comfort)',
      '6) Best Ways to Connect (5 specific actions)',
      '7) Stress Tells (what to watch for)',
      '8) Gentle Disclaimer',
      '',
      'Rules:',
      '- No behavior training plan beyond light guidance; direct behavior cases to Behavior Focus.',
      '- No medical diagnosis.',
      '',
      'PAWOLLIE SENSE CLIENT INTAKE:',
      intakeBlock
    ],
    behavior_bond_guidance: [
      'You are Pawollie Sense\'s Behavior Focus specialist. Create a compassionate, practical behavior report.',
      'No dominance myths. No punishment guidance. Focus on patterns, triggers, management, and bond repair.',
      'OUTPUT FORMAT:',
      '1) Behavior Summary',
      '2) Most Likely Drivers (rank 3-5; explain why)',
      '3) Immediate Management (5 bullets; what to do today)',
      '4) 14-Day Bond Reset Plan (daily steps)',
      '5) Skill-Build Plan (2-3 core skills; how to practice)',
      '6) Common Mistakes to Avoid',
      '7) When to Bring In a Pro (clear signs; vet/behaviorist/trainer)',
      '8) Gentle Disclaimer',
      '',
      'Rules:',
      '- If aggression, panic, self-harm, or sudden change appears, clearly and kindly recommend professional support.',
      '- Keep steps short and doable.',
      '',
      'CLIENT INTAKE:',
      intakeBlock
    ],
    star_chart: [
      'You are Pawollie Sense\'s Canine Birth Chart interpreter. This is symbolic and reflective.',
      'If birth time is unknown, explicitly use a no-time approach and do not pretend precision.',
      'OUTPUT FORMAT:',
      '1) Chart Data Summary (known/unknown)',
      '2) Core Personality Themes',
      '3) Emotional Needs (based on what can be inferred; be honest about uncertainty)',
      '4) Motivation and Play Style',
      '5) Social Style',
      '6) Growth Edges',
      '7) Owner Alignment Tips',
      '8) Chart-Based Routine (morning/midday/evening)',
      '9) Gentle Disclaimer',
      '',
      'Rules:',
      '- No predictive medical claims.',
      '- Be explicit about missing data.',
      '',
      'CLIENT INTAKE:',
      intakeBlock
    ],
    paw_reading: [
      'You are Pawollie Sense\'s Past Life Paw Reading writer. This is symbolic, spiritual reflection framed as possibility, not fact.',
      'Use paw photos + intake to suggest themes and bond lessons. Keep it respectful, never dramatic.',
      'OUTPUT FORMAT:',
      '1) Past Life Symbolic Theme (2-3 paragraphs, framed as possibility)',
      '2) Bond Threads That Repeat (bullets)',
      '3) Lessons and Gifts (bullets)',
      '4) How It Shows Up Today (practical translation)',
      '5) Support Actions (5 specific actions)',
      '6) Closure Message (optional, 120-200 words, only if requested)',
      '7) Gentle Disclaimer',
      '',
      'Rules:',
      '- No fear tactics, no guarantees, no absolute afterlife claims.',
      '- If paw photos are missing, state limitation and keep it light.',
      '',
      'CLIENT INTAKE:',
      intakeBlock
    ],
    all_paws_pack: [
      'You are Pawollie Sense\'s Pawollie Pack compiler. Create a single polished deliverable that includes:',
      'A) Full Discovery',
      'B) Personality Focus',
      'C) Behavior Focus',
      'D) Past Life Paw Reading (only if client opted in and provided paw photos)',
      'E) Canine Birth Chart (use no-time protocol if needed)',
      'Start with a 7-10 sentence Master Summary tying everything together.',
      'Each section must be clearly labeled and easy to skim.',
      'End with ONE consolidated disclaimer section.',
      '',
      'CLIENT INTAKE:',
      intakeBlock
    ],
    furmily_pack: [
      'You are Pawollie Sense\'s multi-pet bundle compiler. Create one coherent deliverable for all listed pets in the intake.',
      'For each pet, include short sections: Essence Snapshot, Behavior Notes, Support Actions, and Gentle Disclaimer.',
      'After all pets, add Household Alignment Tips (5 bullets).',
      '',
      'CLIENT INTAKE:',
      intakeBlock
    ],
    pawollie_vision: [
      'You are Pawollie Sense\'s Pawollie Vision narrator.',
      'Create an art direction and narrative brief that can guide a spirit portrait output.',
      'OUTPUT FORMAT:',
      '1) Vision Theme',
      '2) Emotional Tone',
      '3) Symbolic Elements (5-8)',
      '4) Color and Lighting Direction',
      '5) Composition Notes',
      '6) Caption for Customer',
      '7) Gentle Disclaimer',
      '',
      'Rules:',
      '- Keep it modern, calm, and premium.',
      '- Avoid absolute metaphysical claims.',
      '',
      'CLIENT INTAKE:',
      intakeBlock
    ],
    quick_quest: [
      'You are Pawollie Sense Quick Quest.',
      `Customer question: ${quickQuestion}`,
      'OUTPUT FORMAT:',
      '1) One short grounding paragraph',
      '2) Three actionable bullet suggestions',
      '3) One closing reassurance sentence',
      '',
      'CLIENT INTAKE:',
      intakeBlock
    ],
    express_pawdate: [
      'You are Pawollie Sense Express Pawdate.',
      `Customer request/context: ${quickQuestion}`,
      'OUTPUT FORMAT:',
      '1) Current emotional weather snapshot',
      '2) What the pet may need today',
      '3) Three small actions for today',
      '4) Gentle Disclaimer',
      '',
      'CLIENT INTAKE:',
      intakeBlock
    ],
    bond_spark: [
      'You are Pawollie Sense Bond Spark.',
      `Customer request/context: ${quickQuestion}`,
      'OUTPUT FORMAT:',
      '1) Bond Spark insight (short paragraph)',
      '2) Three connection actions for today',
      '3) One reflection prompt for the guardian',
      '4) Gentle Disclaimer',
      '',
      'CLIENT INTAKE:',
      intakeBlock
    ]
  };

  const serviceLines = templates[normalizedServiceKey] || [
    'You are Pawollie Sense. Produce a warm, practical service response with clear headings and actionable steps.',
    'CLIENT INTAKE:',
    intakeBlock
  ];

  return [...BRAND_GUARDRAILS, '', ...serviceLines].join('\n');
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
