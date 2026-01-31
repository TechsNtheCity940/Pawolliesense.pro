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

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} environment variable.`);
  }
  return value;
};

const supabaseRequest = async ({ path, method = 'GET', body, params }) => {
  const supabaseUrl = requiredEnv('SUPABASE_URL').replace(/\/$/, '');
  const supabaseKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const endpoint = new URL(`${supabaseUrl}/rest/v1/${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      endpoint.searchParams.set(key, value);
    });
  }

  const response = await fetch(endpoint.toString(), {
    method,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
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
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject, html, text })
  });

  if (!response.ok) {
    const data = await response.json();
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
  const transporter = require('nodemailer').createTransport(smtp);
  await transporter.sendMail({ from, to, subject, html, text });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const from = process.env.EMAIL_FROM;
  if (process.env.RESEND_API_KEY) {
    await sendResendEmail({
      apiKey: process.env.RESEND_API_KEY,
      from: from || 'no-reply@pawolliesense.com',
      to,
      subject,
      html,
      text
    });
    return 'resend';
  }

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

const QUICK_QUEST_KEYS = new Set(['quick_quest', 'express_pawdate', 'bond_spark', 'quick-quest']);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' });
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
    const readingId = String(body.readingId || '').trim();
    if (!readingId) {
      return jsonResponse(400, { ok: false, error: 'Missing readingId.' });
    }

    const [reading] = await supabaseRequest({
      path: 'readings',
      params: {
        id: `eq.${readingId}`,
        select: '*,customers(*),pets(*)'
      }
    });

    if (!reading) {
      return jsonResponse(404, { ok: false, error: 'Reading not found.' });
    }

    const services = Array.isArray(reading.services) ? reading.services : [];
    const normalized = services.map((service) => String(service || '').toLowerCase());
    if (!normalized.some((service) => QUICK_QUEST_KEYS.has(service))) {
      return jsonResponse(400, { ok: false, error: 'Not a quick quest service.' });
    }

    const existingNotes = String(reading.notes || '');
    if (reading.status === 'completed' && existingNotes.includes('Quick Quest Response')) {
      return jsonResponse(200, { ok: true, skipped: true });
    }

    const pet = reading.pets || {};
    const customer = reading.customers || {};
    const guardianName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Guardian';
    const email = customer.email || '';
    if (!email) {
      return jsonResponse(400, { ok: false, error: 'Missing customer email.' });
    }

    const extraNotes = parseAdditionalNotes(pet.additional_notes);
    const question = String(
      body.question ||
      extraNotes.quick_prompt ||
      extraNotes.qq_prompt ||
      extraNotes.quick_question ||
      extraNotes.question ||
      ''
    ).trim() || 'Please share a gentle insight or supportive check-in for today.';

    const styleHints = [
      'Warm and grounded with a gentle cadence.',
      'Softly encouraging with clear, simple language.',
      'Calm, reassuring, and emotionally specific.',
      'Bright and hopeful with a hint of poetic imagery.',
      'Direct, practical, and supportive.'
    ];
    const styleHint = styleHints[Math.floor(Math.random() * styleHints.length)];
    const openAiKey = requiredEnv('OPENAI_API_KEY');

    const aiResult = await getOpenAiResponse({
      apiKey: openAiKey,
      prompt: question,
      profile: {
        guardianName,
        petName: pet.name || 'your pet',
        species: pet.species,
        breed: pet.breed,
        birthDate: pet.birth_date,
        relationship: extraNotes.relationship || '',
        timezone: extraNotes.timezone || '',
        tone: extraNotes.quick_tone || '',
        context: extraNotes.quick_context || ''
      },
      styleHint
    });

    const aiResponse = aiResult.text;
    const responseLog = [
      existingNotes ? `${existingNotes}\n\n` : '',
      `Quick Quest Response (sent ${new Date().toISOString()}):`,
      aiResponse,
      '',
      `OpenAI Request ID: ${aiResult.id || 'unknown'}`,
      `Model: ${aiResult.model || 'unknown'}`
    ].join('\n');

    await supabaseRequest({
      path: 'readings',
      method: 'PATCH',
      params: { id: `eq.${readingId}`, select: '*' },
      body: {
        status: 'completed',
        notes: responseLog,
        completed_at: new Date().toISOString()
      }
    });

    const subject = `Your Quick Quest for ${pet.name || 'your pet'}`;
    const text = `${aiResponse}\n\nIf you have any follow-up questions, reply to this email.\n\nWith care,\nPawollie Sense`;
    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
        <p>Here is your Quick Quest response for <strong>${pet.name || 'your pet'}</strong>:</p>
        <p style="white-space: pre-line;">${aiResponse}</p>
        <p>If you have any follow-up questions, reply to this email.</p>
        <p>With care,<br/>Pawollie Sense</p>
      </div>
    `;

    const emailProvider = await sendEmail({ to: email, subject, html, text });
    return jsonResponse(200, { ok: true, email_provider: emailProvider });
  } catch (error) {
    console.error('Admin quick quest fulfill error', error);
    return jsonResponse(500, { ok: false, error: error.message || 'Quick quest fulfillment failed.' });
  }
};
