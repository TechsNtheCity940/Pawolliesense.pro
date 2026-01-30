const crypto = require('crypto');
const nodemailer = require('nodemailer');

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
    const text = `Thank you for your Pawollie Sense order.\n\nTotal paid: ${formatUsd(total)} ${currency}\n\n${itemLines}\n\nNext step: complete your intake form and photo upload at https://pawolliesense.com/intake\n\nWith care,\nPawollie Sense`;
    const html = `
      <div>
        <p>Thank you for your Pawollie Sense order.</p>
        <p><strong>Total paid:</strong> ${formatUsd(total)} ${currency}</p>
        ${itemLines ? `<pre style="font-family: inherit; white-space: pre-wrap;">${itemLines}</pre>` : ''}
        <p>Next step: complete your intake form and photo upload at <a href="https://pawolliesense.com/intake">pawolliesense.com/intake</a>.</p>
        <p>With care,<br/>Pawollie Sense</p>
      </div>
    `;

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
