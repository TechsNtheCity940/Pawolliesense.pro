const crypto = require('crypto');
const nodemailer = require('nodemailer');

const OPENAI_URL = 'https://api.openai.com/v1/responses';

function parseSignatureHeader(header) {
  return header.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (!key || !value) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(value);
    return acc;
  }, {});
}

function verifyStripeSignature(payload, header, secret) {
  if (!header || !secret) {
    throw new Error('Missing Stripe signature or webhook secret.');
  }

  const parsed = parseSignatureHeader(header);
  const timestamp = parsed.t?.[0];
  const signatures = parsed.v1 || [];
  if (!timestamp || !signatures.length) {
    throw new Error('Invalid Stripe signature header.');
  }

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > 300) {
    throw new Error('Stripe webhook timestamp is too old.');
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  const isValid = signatures.some((sig) => sig === expected);
  if (!isValid) {
    throw new Error('Invalid Stripe webhook signature.');
  }

  return JSON.parse(payload);
}

function formatUsd(amount) {
  if (typeof amount !== 'number') return '$0.00';
  return `$${(amount / 100).toFixed(2)}`;
}

async function fetchStripeLineItems(sessionId, stripeSecret) {
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}/line_items?limit=20`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${stripeSecret}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Unable to fetch Stripe line items.');
  }
  return data?.data || [];
}

async function sendResendEmail({ apiKey, from, to, subject, html, text }) {
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
}

async function sendSendGridEmail({ apiKey, from, to, subject, html, text }) {
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
}

function resolveSmtpConfig() {
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
}

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

async function sendSmtpEmail({ to, subject, html, text }) {
  const smtp = resolveSmtpConfig();
  if (!smtp) {
    throw new Error('SMTP configuration is missing.');
  }
  const from = process.env.EMAIL_FROM || smtp.auth.user;
  const transporter = nodemailer.createTransport(smtp);
  await transporter.sendMail({ from, to, subject, html, text });
}

async function sendConfirmationEmail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM;
  if (process.env.RESEND_API_KEY) {
    return sendResendEmail({
      apiKey: process.env.RESEND_API_KEY,
      from: from || 'no-reply@pawolliesense.com',
      to,
      subject,
      html,
      text
    });
  }

  if (process.env.SENDGRID_API_KEY) {
    return sendSendGridEmail({
      apiKey: process.env.SENDGRID_API_KEY,
      from: from || 'no-reply@pawolliesense.com',
      to,
      subject,
      html,
      text
    });
  }

  if (process.env.SMTP_USER || process.env.GMAIL_USER) {
    return sendSmtpEmail({ to, subject, html, text });
  }

  throw new Error('No email provider configured.');
}

const QUICK_QUEST_KEYS = new Set(['quick_quest', 'quick-quest']);

const shouldFulfillQuickQuest = (services = [], metadataService = '') => {
  const normalized = services.map((service) => String(service || '').toLowerCase());
  if (normalized.some((service) => QUICK_QUEST_KEYS.has(service))) return true;
  if (metadataService && QUICK_QUEST_KEYS.has(String(metadataService).toLowerCase())) return true;
  return false;
};

const handleQuickQuestFulfillment = async ({ readingId, fallbackEmail, metadataService }) => {
  if (!readingId) return { ok: false, reason: 'missing reading id' };

  const [reading] = await supabaseRequest({
    path: 'readings',
    params: {
      id: `eq.${readingId}`,
      select: '*,customers(*),pets(*)'
    }
  });

  if (!reading) return { ok: false, reason: 'reading not found' };

  const services = Array.isArray(reading.services) ? reading.services : [];
  if (!shouldFulfillQuickQuest(services, metadataService)) {
    return { ok: false, reason: 'not quick quest' };
  }

  const existingNotes = String(reading.notes || '');
  if (reading.status === 'completed' && existingNotes.includes('Quick Quest Response')) {
    return { ok: true, skipped: true };
  }

  const pet = reading.pets || {};
  const customer = reading.customers || {};
  const guardianName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Guardian';
  const email = customer.email || fallbackEmail;
  if (!email) return { ok: false, reason: 'missing email' };

  const extraNotes = parseAdditionalNotes(pet.additional_notes);
  const question = String(
    extraNotes.quick_prompt ||
    extraNotes.qq_prompt ||
    extraNotes.quick_question ||
    extraNotes.question ||
    ''
  ).trim();

  if (!question) {
    return { ok: false, reason: 'missing quick quest question' };
  }

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

  await sendConfirmationEmail({ to: email, subject, html, text });
  return { ok: true };
};

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed.' };
  }

  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripeSecret || !webhookSecret) {
      throw new Error('Stripe secrets are not configured.');
    }

    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : event.body || '';

    const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    const stripeEvent = verifyStripeSignature(rawBody, signature, webhookSecret);

    if (stripeEvent.type !== 'checkout.session.completed') {
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    const session = stripeEvent.data?.object;
    const email = session?.customer_details?.email;
    const total = session?.amount_total;
    const currency = session?.currency?.toUpperCase() || 'USD';
    const metadata = session?.metadata || {};
    const readingId = metadata.reading_id || session?.client_reference_id || '';
    const metadataService = metadata.primary_service || '';

    console.log('Stripe checkout completed', {
      id: session?.id,
      email,
      total,
      currency
    });

    if (!email) {
      return { statusCode: 200, body: JSON.stringify({ received: true }) };
    }

    let lineItems = [];
    try {
      lineItems = await fetchStripeLineItems(session.id, stripeSecret);
    } catch (error) {
      console.warn('Stripe line item fetch failed', error.message);
    }

    const itemLines = lineItems
      .map((item) => `- ${item.description || 'Service'} x${item.quantity || 1}`)
      .join('\n');

    const subject = 'Pawollie Sense confirmation';
    const text = `Thank you for your Pawollie Sense order.\n\nTotal paid: ${formatUsd(total)} ${currency}\n\n${itemLines}\n\nYour intake is already on file. If you purchased an instant Quick Quest, your response will arrive by email shortly.\n\nWith care,\nPawollie Sense`;
    const html = `
      <div>
        <p>Thank you for your Pawollie Sense order.</p>
        <p><strong>Total paid:</strong> ${formatUsd(total)} ${currency}</p>
        ${itemLines ? `<pre style="font-family: inherit; white-space: pre-wrap;">${itemLines}</pre>` : ''}
        <p>Your intake is already on file. If you purchased an instant Quick Quest, your response will arrive by email shortly.</p>
        <p>With care,<br/>Pawollie Sense</p>
      </div>
    `;

    try {
      await handleQuickQuestFulfillment({ readingId, fallbackEmail: email, metadataService });
    } catch (error) {
      console.error('Quick quest fulfillment failed', error.message);
    }

    try {
      await sendConfirmationEmail({ to: email, subject, html, text });
    } catch (error) {
      console.error('Confirmation email failed', error.message);
      if (process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Email send failed.' }) };
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (error) {
    console.error('Stripe webhook error', error.message);
    return { statusCode: 400, body: `Webhook Error: ${error.message}` };
  }
};
