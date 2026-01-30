const ITEM_CATALOG = {
  full_soul_profile: { name: 'Full Soul Discovery Profile', price: 30 },
  behavior_spirit_scan: { name: 'Personality & Behavior Spirit Scan', price: 20 },
  canine_birth_chart: { name: 'Canine Birth Chart', price: 15 },
  past_life_pawprint: { name: 'Past-Life Pawprint Reading', price: 5 },
  quick_quest: { name: 'Quick Quest', price: 5 },
  pawollie_vision: { name: 'Pawollie Vision (Daily)', price: 4.99 },
  pawsitive_pupdate: { name: 'Pawsitive Pupdate (Daily)', price: 4.99 }
};

const CURRENCY = 'USD';
const CORE_SERVICE_IDS = new Set([
  'full_soul_profile',
  'behavior_spirit_scan',
  'canine_birth_chart',
  'past_life_pawprint',
  'quick_quest'
]);
const DAILY_SERVICE_IDS = new Set(['pawollie_vision', 'pawsitive_pupdate']);

function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}

function buildItems(cart) {
  const items = [];
  let total = 0;
  const hasCoreService = (cart || []).some((entry) => CORE_SERVICE_IDS.has(entry?.id));

  (cart || []).forEach((entry) => {
    const item = ITEM_CATALOG[entry?.id];
    if (!item) return;
    const quantity = Number(entry.quantity ?? 1) || 1;
    const basePrice = DAILY_SERVICE_IDS.has(entry?.id)
      ? (hasCoreService ? 2.99 : 4.99)
      : item.price;
    const price = roundToTwo(basePrice);
    total += price * quantity;
    items.push({
      name: item.name,
      unit_amount: {
        currency_code: CURRENCY,
        value: price.toFixed(2)
      },
      quantity: String(quantity)
    });
  });

  return { items, total: roundToTwo(total) };
}

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

  if (!clientId || !clientSecret) {
    throw new Error('Missing PayPal credentials.');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error_description || 'Failed to get PayPal access token.');
  }

  return { token: data.access_token, base };
}

exports.handler = async function handler(event) {
  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const { items, total } = buildItems(payload.cart);

    if (!items.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No valid items in cart.' })
      };
    }

    const { token, base } = await getAccessToken();

    const orderResponse = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: CURRENCY,
              value: total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: CURRENCY,
                  value: total.toFixed(2)
                }
              }
            },
            items
          }
        ]
      })
    });

    const orderData = await orderResponse.json();
    return {
      statusCode: orderResponse.status,
      body: JSON.stringify(orderData)
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
