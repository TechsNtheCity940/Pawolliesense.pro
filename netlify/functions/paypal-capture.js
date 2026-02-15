function paypalBaseUrl() {
  return process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing PayPal credentials.');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || 'Unable to authenticate with PayPal.');
  }
  return data.access_token;
}

async function supabasePatchReading(readingId, updates) {
  if (!readingId || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/readings?id=eq.${encodeURIComponent(readingId)}`, {
      method: 'PATCH',
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.warn('Unable to update reading after PayPal capture', data?.message || data?.error || response.status);
    }
  } catch (error) {
    console.warn('Unable to update reading after PayPal capture', error.message);
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed.' }) };
  }

  try {
    const queryToken = event.queryStringParameters?.token;
    const payload = event.body ? JSON.parse(event.body) : {};
    const orderId = String(queryToken || payload.orderId || '').trim();
    if (!orderId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing PayPal order token.' }) };
    }

    const accessToken = await getPayPalAccessToken();
    const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data?.message || data?.details?.[0]?.description || 'PayPal capture failed.' })
      };
    }

    const purchaseUnit = data?.purchase_units?.[0] || {};
    const capture = purchaseUnit?.payments?.captures?.[0] || {};
    const readingId = purchaseUnit?.custom_id;

    await supabasePatchReading(readingId, {
      status: 'in_progress',
      notes: `PayPal payment captured (${capture?.id || orderId})`,
      updated_at: new Date().toISOString()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        orderId: data?.id || orderId,
        captureId: capture?.id || null,
        status: capture?.status || data?.status || null,
        amount: capture?.amount || purchaseUnit?.amount || null,
        readingId: readingId || null
      })
    };
  } catch (error) {
    console.error('PayPal capture error', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Unable to capture PayPal order.' })
    };
  }
};
