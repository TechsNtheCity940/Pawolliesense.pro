const nodemailer = require('nodemailer');
const { upsertResendContact, getResendApiKey } = require('./_resendContacts');

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_RESEND_FROM = 'no-reply@pawolliesense.pro';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRetryAfterMs = (headers) => {
  const retryAfter = headers?.get?.('retry-after');
  const seconds = Number(retryAfter || 0);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(Math.ceil(seconds * 1000), 5000);
  }
  return 700;
};

const jsonResponse = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...headers
  },
  body: JSON.stringify(body)
});

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} environment variable.`);
  }
  return value;
};

const buildNameParts = (fullName) => {
  const tokens = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    first: tokens[0] || 'Friend',
    last: tokens.slice(1).join(' ')
  };
};

const buildQuickQuestNotes = (payload) => {
  const lines = [
    'Quick Quest Intake',
    `Service: ${payload.service || 'quick_quest'}`,
    payload.tone ? `Tone: ${payload.tone}` : null,
    payload.question ? `Question: ${payload.question}` : null,
    payload.context ? `Context: ${payload.context}` : null,
    payload.timezone ? `Timezone: ${payload.timezone}` : null,
    payload.relationship ? `Relationship: ${payload.relationship}` : null
  ].filter(Boolean);
  return lines.join('\n');
};

const supabaseRequest = async ({ url, key, path, method, body, params }) => {
  const endpoint = new URL(`${url.replace(/\/$/, '')}/rest/v1/${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      endpoint.searchParams.set(k, v);
    });
  }

  const response = await fetch(endpoint.toString(), {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.message || data?.error || 'Supabase request failed.';
    throw new Error(message);
  }
  return data;
};

const getOpenAiResponse = async ({ apiKey, prompt, profile, styleHint }) => {
  const systemPrompt = [
    'You are Pawollie Sense Quick Quest, a compassionate and insightful responder.',
    'Write a unique, non-generic response tailored to the guardian and pet details provided.',
    'Keep it grounded, supportive, and actionable without claiming certainty.',
    'Avoid medical, veterinary, legal, or behavioral diagnosis; suggest seeking a professional if needed.',
    'Never mention being an AI or any model.',
    'Structure: 1 short paragraph + 3 bullet suggestions + 1 closing sentence.',
    `Style hint: ${styleHint}`
  ].join(' ');

  const userPrompt = [
    `Guardian: ${profile.guardianName}`,
    `Pet: ${profile.petName} (${profile.species || 'pet'})`,
    profile.breed ? `Breed: ${profile.breed}` : null,
    profile.birthDate ? `Birth date: ${profile.birthDate}` : null,
    profile.relationship ? `Relationship: ${profile.relationship}` : null,
    profile.timezone ? `Timezone: ${profile.timezone}` : null,
    profile.tone ? `Requested tone: ${profile.tone}` : null,
    `Question: ${prompt}`,
    profile.context ? `Context: ${profile.context}` : null
  ].filter(Boolean).join('\n');

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemPrompt }]
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userPrompt }]
        }
      ],
      max_output_tokens: 350
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'OpenAI response failed.');
  }

  if (data.output_text) {
    return {
      text: data.output_text.trim(),
      id: data.id,
      model: data.model
    };
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

  const result = textChunks.join('\n').trim();
  if (!result) {
    throw new Error('OpenAI returned an empty response.');
  }
  return { text: result, id: data.id, model: data.model };
};

const sendResendEmail = async ({ apiKey, from, to, subject, html, text }) => {
  const maxRetries = 4;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from, to, subject, html, text })
    });

    if (response.ok) {
      return;
    }

    const data = await response.json().catch(() => ({}));
    if (response.status === 429 && attempt < maxRetries) {
      const baseDelay = parseRetryAfterMs(response.headers);
      const backoff = baseDelay + (attempt * 350);
      await sleep(backoff);
      continue;
    }
    throw new Error(data?.message || 'Resend email failed.');
  }
};

const sendSendGridEmail = async ({ apiKey, from, to, subject, html, text }) => {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html }
      ]
    })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data?.errors?.[0]?.message || 'SendGrid email failed.');
  }
};

const resolveSmtpConfig = () => {
  const host = process.env.SMTP_HOST || (process.env.GMAIL_USER ? 'smtp.gmail.com' : '');
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || '';
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '';
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : port === 465;

  if (!host || !user || !pass) return null;
  return {
    host,
    port,
    secure,
    auth: { user, pass }
  };
};

const sendSmtpEmail = async ({ to, subject, html, text }) => {
  const smtp = resolveSmtpConfig();
  if (!smtp) {
    throw new Error('SMTP configuration is missing.');
  }
  const from = process.env.EMAIL_FROM || smtp.auth.user;
  const transporter = nodemailer.createTransport(smtp);
  await transporter.sendMail({ from, to, subject, html, text });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const resendApiKey = getResendApiKey();
  if (resendApiKey) {
    await sendResendEmail({
      apiKey: resendApiKey,
      from: process.env.RESEND_FROM || DEFAULT_RESEND_FROM,
      to,
      subject,
      html,
      text
    });
    return 'resend';
  }

  const from = process.env.EMAIL_FROM;
  if (process.env.SENDGRID_API_KEY) {
    await sendSendGridEmail({
      apiKey: process.env.SENDGRID_API_KEY,
      from: from || 'no-reply@pawolliesense.com',
      to,
      subject,
      html,
      text
    });
    return 'sendgrid';
  }

  if (process.env.SMTP_USER || process.env.GMAIL_USER) {
    await sendSmtpEmail({ to, subject, html, text });
    return 'smtp';
  }

  throw new Error('No email provider configured.');
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const service = String(payload.service || '').trim();
    const guardianName = String(payload.guardian_name || '').trim();
    const email = String(payload.email || '').trim();
    const petName = String(payload.pet_name || '').trim();
    const question = String(payload.question || payload.qq_prompt || '').trim();
    const consent = Boolean(payload.consent);

    if (service !== 'quick_quest') {
      return jsonResponse(400, { ok: false, error: 'Only quick_quest is supported here.' });
    }

    if (!guardianName || !email || !petName || !question) {
      return jsonResponse(400, { ok: false, error: 'Missing required quick quest fields.' });
    }

    if (!consent) {
      return jsonResponse(400, { ok: false, error: 'Consent is required.' });
    }

    const supabaseUrl = requiredEnv('SUPABASE_URL');
    const supabaseKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const openAiKey = requiredEnv('OPENAI_API_KEY');

    const { first: firstName, last: lastName } = buildNameParts(guardianName);

    const existingCustomers = await supabaseRequest({
      url: supabaseUrl,
      key: supabaseKey,
      path: 'customers',
      method: 'GET',
      params: {
        select: '*',
        email: `eq.${email}`
      }
    });

    const customer = existingCustomers?.[0] || (await supabaseRequest({
      url: supabaseUrl,
      key: supabaseKey,
      path: 'customers',
      method: 'POST',
      body: {
        first_name: firstName,
        last_name: lastName,
        email
      }
    }))?.[0];

    if (!customer?.id) {
      throw new Error('Unable to create customer record.');
    }

    try {
      await upsertResendContact({
        email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        properties: {
          quick_quest_opt_in: 'true',
          last_pet_name: petName
        }
      });
    } catch (contactError) {
      console.warn('Resend contact sync failed', contactError.message || contactError);
    }

    const petPayload = {
      customer_id: customer.id,
      name: petName,
      species: payload.species || payload.pet_species || null,
      breed: payload.breed || payload.pet_breed || null,
      age: payload.age || payload.pet_age || null,
      gender: payload.sex || payload.pet_gender || null,
      birth_date: payload.birth_date || null,
      additional_notes: buildQuickQuestNotes({
        service,
        tone: payload.qq_tone || payload.tone,
        question,
        context: payload.qq_context || payload.context,
        timezone: payload.timezone,
        relationship: payload.relationship
      })
    };

    const pet = (await supabaseRequest({
      url: supabaseUrl,
      key: supabaseKey,
      path: 'pets',
      method: 'POST',
      body: petPayload
    }))?.[0];

    if (!pet?.id) {
      throw new Error('Unable to create pet record.');
    }

    const totalPrice = Number(payload.estimated_total) || 9;
    const reading = (await supabaseRequest({
      url: supabaseUrl,
      key: supabaseKey,
      path: 'readings',
      method: 'POST',
      body: {
        customer_id: customer.id,
        pet_id: pet.id,
        services: [service],
        consent_acknowledged: true,
        status: 'in_progress',
        total_price: totalPrice
      }
    }))?.[0];

    if (!reading?.id) {
      throw new Error('Unable to create reading record.');
    }

    const styleHints = [
      'Warm and grounded with a gentle cadence.',
      'Softly encouraging with clear, simple language.',
      'Calm, reassuring, and emotionally specific.',
      'Bright and hopeful with a hint of poetic imagery.',
      'Direct, practical, and supportive.'
    ];
    const styleHint = styleHints[Math.floor(Math.random() * styleHints.length)];

    console.log('Quick quest: generating AI response', {
      service,
      email,
      petName
    });

    const aiResult = await getOpenAiResponse({
      apiKey: openAiKey,
      prompt: question,
      profile: {
        guardianName,
        petName,
        species: payload.species,
        breed: payload.breed,
        birthDate: payload.birth_date,
        relationship: payload.relationship,
        timezone: payload.timezone,
        tone: payload.qq_tone || payload.tone,
        context: payload.qq_context || payload.context
      },
      styleHint
    });

    const aiResponse = aiResult.text;
    const responseLog = [
      `Quick Quest Response (sent ${new Date().toISOString()}):`,
      aiResponse,
      '',
      `OpenAI Request ID: ${aiResult.id || 'unknown'}`,
      `Model: ${aiResult.model || 'unknown'}`
    ].join('\n');

    await supabaseRequest({
      url: supabaseUrl,
      key: supabaseKey,
      path: 'readings',
      method: 'PATCH',
      params: {
        id: `eq.${reading.id}`,
        select: '*'
      },
      body: {
        status: 'completed',
        notes: responseLog,
        completed_at: new Date().toISOString()
      }
    });

    const subject = `Your Quick Quest for ${petName}`;
    const text = `${aiResponse}\n\nIf you have any follow-up questions, reply to this email.\n\nWith care,\nPawollie Sense`;
    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
        <p>Here is your Quick Quest response for <strong>${petName}</strong>:</p>
        <p style="white-space: pre-line;">${aiResponse}</p>
        <p>If you have any follow-up questions, reply to this email.</p>
        <p>With care,<br/>Pawollie Sense</p>
      </div>
    `;

    const emailProvider = await sendEmail({ to: email, subject, html, text });
    console.log('Quick quest: email sent', { to: email, provider: emailProvider });

    return jsonResponse(200, {
      ok: true,
      reading_id: reading.id,
      response: aiResponse,
      openai_request_id: aiResult.id || null,
      email_provider: emailProvider
    });
  } catch (error) {
    console.error('Quick quest error', error);
    return jsonResponse(500, { ok: false, error: error.message || 'Quick quest failed.' });
  }
};
