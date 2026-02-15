const ITEM_CATALOG = {
  full_spirit_pawfile: { name: 'Full Spirit Pawfile', price: 35 },
  behavior_bond_guidance: { name: 'Behavior Bond Guidance', price: 40 },
  pawmarks_pack: { name: 'Pawmarks Pack (Memorial & Keepsake Experience)', price: 45 },
  pawmark_post: { name: 'Pawmark Post (Memorial Feed Post Only)', price: 15 },
  star_chart: { name: 'Star Chart (Pet Astrology Insight)', price: 19 },
  paw_reading: { name: 'Paw Reading (Pawprint Insight)', price: 19 },
  pawollie_vision: { name: 'Pawollie Vision (Spirit Portrait)', price: 19 },
  express_pawdate: { name: 'Express Pawdate', price: 9 },
  quick_quest: { name: 'Quick Quest (One Question Insight)', price: 9 },
  bond_spark: { name: 'Bond Spark (Mini Insight)', price: 9 },
  all_paws_pack: { name: 'All-Paws Pack (Every Service Included)', price: 119 },
  furmily_pack: { name: 'Furmily Pack (Multi-Pet Household Pack)', price: 79 }
};

function buildItems(cart) {
  const items = [];
  const itemIds = [];
  let total = 0;

  (cart || []).forEach((entry) => {
    const item = ITEM_CATALOG[entry?.id];
    if (!item) return;
    const quantity = Number(entry.quantity ?? 1) || 1;
    const unitPrice = Number(item.price || 0);
    total += unitPrice * quantity;
    itemIds.push(entry.id);
    items.push({
      name: item.name,
      unit_amount: {
        currency_code: 'USD',
        value: unitPrice.toFixed(2)
      },
      quantity: String(quantity),
      category: 'DIGITAL_GOODS'
    });
  });

  return { items, itemIds, total };
}

function resolveOrigin(headers) {
  return (
    headers?.origin ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    'http://localhost:5173'
  );
}

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

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed.' }) };
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const cart = Array.isArray(payload.cart)
      ? payload.cart
      : payload.service
        ? [{ id: payload.service, quantity: 1 }]
        : payload.selected_service
          ? [{ id: payload.selected_service, quantity: 1 }]
          : [];

    const { items, itemIds, total } = buildItems(cart);
    if (!items.length || total <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No valid items selected.' }) };
    }

    const origin = resolveOrigin(event.headers);
    const returnUrl = process.env.PAYPAL_RETURN_URL || `${origin}/thank-you`;
    const cancelUrl = process.env.PAYPAL_CANCEL_URL || `${origin}/intake`;
    const accessToken = await getPayPalAccessToken();

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          custom_id: payload.readingId ? String(payload.readingId) : undefined,
          reference_id: itemIds[0] || undefined,
          description: itemIds.map((id) => ITEM_CATALOG[id]?.name).filter(Boolean).join(', ').slice(0, 127),
          amount: {
            currency_code: 'USD',
            value: total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: total.toFixed(2)
              }
            }
          },
          items
        }
      ],
      application_context: {
        brand_name: 'Pawollie Sense',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl
      }
    };

    const response = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data?.message || data?.details?.[0]?.description || 'PayPal order creation failed.' })
      };
    }

    const approveUrl = (data?.links || []).find((link) => link.rel === 'approve')?.href;
    if (!approveUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'PayPal approval URL was not returned.' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ id: data.id, url: approveUrl, provider: 'paypal' })
    };
  } catch (error) {
    console.error('PayPal checkout error', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Unable to start PayPal checkout.' })
    };
  }
};
