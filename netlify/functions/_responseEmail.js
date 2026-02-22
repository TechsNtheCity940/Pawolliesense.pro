const nodemailer = require('nodemailer');
const { upsertResendContact, getResendApiKey } = require('./_resendContacts');

const DEFAULT_FROM_EMAIL = 'no-reply@pawolliesense.pro';

const SERVICE_LABELS = {
  full_spirit_pawfile: 'Full Spirit Pawfile',
  behavior_bond_guidance: 'Behavior Bond Guidance',
  pawmarks_pack: 'Pawmarks Pack',
  pawmark_post: 'Pawmark Post',
  star_chart: 'Star Chart',
  paw_reading: 'Paw Reading',
  pawollie_vision: 'Pawollie Vision',
  express_pawdate: 'Express Pawdate',
  quick_quest: 'Quick Quest',
  bond_spark: 'Bond Spark',
  all_paws_pack: 'All-Paws Pack',
  furmily_pack: 'Furmily Pack'
};

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeService = (service) => String(service || '').trim().toLowerCase();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const parseRetryAfterMs = (headers) => {
  const retryAfter = headers?.get?.('retry-after');
  const seconds = Number(retryAfter || 0);
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.min(Math.ceil(seconds * 1000), 5000);
  }
  return 700;
};

const getServiceLabel = (services) => {
  if (!Array.isArray(services) || services.length === 0) return 'Pawollie Sense Reading';
  const labels = services
    .map((service) => SERVICE_LABELS[normalizeService(service)] || String(service || '').trim())
    .filter(Boolean);
  if (!labels.length) return 'Pawollie Sense Reading';
  return labels.join(', ');
};

const buildSubject = ({ petName, serviceLabel }) => {
  if (petName) return `Your Pawollie Sense ${serviceLabel} for ${petName}`;
  return `Your Pawollie Sense ${serviceLabel}`;
};

const buildEmailPayload = (reading) => {
  const customer = reading?.customers || {};
  const pet = reading?.pets || {};
  const to = String(customer.email || '').trim();
  const responseText = String(reading?.notes || '').trim();
  const guardianName = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim();
  const petName = String(pet.name || '').trim();
  const serviceLabel = getServiceLabel(reading?.services);

  if (!to) {
    throw new Error('Missing customer email.');
  }
  if (!responseText) {
    throw new Error('No saved response found on this order.');
  }

  const greetingName = guardianName || 'there';
  const subject = buildSubject({ petName, serviceLabel });
  const text = [
    `Hi ${greetingName},`,
    '',
    `Your ${serviceLabel} is ready${petName ? ` for ${petName}` : ''}.`,
    '',
    responseText,
    '',
    'With care,',
    'Pawollie Sense'
  ].join('\n');
  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <p>Hi ${escapeHtml(greetingName)},</p>
      <p>Your <strong>${escapeHtml(serviceLabel)}</strong> is ready${petName ? ` for <strong>${escapeHtml(petName)}</strong>` : ''}.</p>
      <div style="white-space: pre-line; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px;">${escapeHtml(responseText)}</div>
      <p style="margin-top: 16px;">With care,<br/>Pawollie Sense</p>
    </div>
  `;

  return { to, subject, text, html };
};

const sendResendEmail = async ({ apiKey, from, to, subject, html, text, tags }) => {
  const maxRetries = 4;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text,
        tags: Array.isArray(tags) && tags.length ? tags : undefined
      })
    });

    const data = await response.json().catch(() => ({}));
    if (response.ok) {
      return data;
    }

    if (response.status === 429 && attempt < maxRetries) {
      const baseDelay = parseRetryAfterMs(response.headers);
      const backoff = baseDelay + (attempt * 350);
      await sleep(backoff);
      continue;
    }

    throw new Error(data?.message || data?.error || 'Resend email failed.');
  }

  throw new Error('Resend email failed after retries.');
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
    const data = await response.json().catch(() => ({}));
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
  return { host, port, secure, auth: { user, pass } };
};

const sendSmtpEmail = async ({ to, subject, html, text }) => {
  const smtp = resolveSmtpConfig();
  if (!smtp) {
    throw new Error('SMTP configuration is missing.');
  }
  const transporter = nodemailer.createTransport(smtp);
  const from = process.env.EMAIL_FROM || smtp.auth.user || DEFAULT_FROM_EMAIL;
  await transporter.sendMail({ from, to, subject, html, text });
};

const sendEmail = async ({ to, subject, html, text, tags }) => {
  const resendApiKey = getResendApiKey();
  if (resendApiKey) {
    const from = process.env.RESEND_FROM || DEFAULT_FROM_EMAIL;
    const result = await sendResendEmail({
      apiKey: resendApiKey,
      from,
      to,
      subject,
      html,
      text,
      tags
    });
    return { provider: 'resend', emailId: result?.id || null };
  }

  const from = process.env.EMAIL_FROM || DEFAULT_FROM_EMAIL;

  if (process.env.SENDGRID_API_KEY) {
    await sendSendGridEmail({
      apiKey: process.env.SENDGRID_API_KEY,
      from,
      to,
      subject,
      html,
      text
    });
    return { provider: 'sendgrid', emailId: null };
  }

  if (process.env.SMTP_USER || process.env.GMAIL_USER) {
    await sendSmtpEmail({ to, subject, html, text });
    return { provider: 'smtp', emailId: null };
  }

  throw new Error('No email provider configured. Set RESEND_API_KEY, SENDGRID_API_KEY, or SMTP/GMAIL env vars.');
};

const sendReadingResponseEmail = async (reading) => {
  const customer = reading?.customers || {};
  const readingId = String(reading?.id || '').trim();
  const customerId = String(reading?.customer_id || '').trim();
  const serviceTags = Array.isArray(reading?.services) ? reading.services : [];

  const payload = buildEmailPayload(reading);
  const sendResult = await sendEmail({
    ...payload,
    tags: [
      readingId ? { name: 'reading_id', value: readingId } : null,
      customerId ? { name: 'customer_id', value: customerId } : null
    ].filter(Boolean)
  });

  try {
    await upsertResendContact({
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      properties: {
        last_order_id: readingId || undefined,
        last_services: serviceTags.join(', ') || undefined
      }
    });
  } catch (error) {
    console.warn('Resend contact sync failed', error?.message || error);
  }

  return {
    to: payload.to,
    provider: sendResult.provider,
    subject: payload.subject,
    emailId: sendResult.emailId || null
  };
};

module.exports = {
  sendReadingResponseEmail
};
