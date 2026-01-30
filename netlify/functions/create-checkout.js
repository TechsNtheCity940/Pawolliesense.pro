const ITEM_CATALOG = {
  full_soul_profile: { name: 'Full Soul Discovery Profile', price: 30 },
  behavior_spirit_scan: { name: 'Personality & Behavior Spirit Scan', price: 20 },
  canine_birth_chart: { name: 'Canine Birth Chart', price: 15 },
  past_life_pawprint: { name: 'Past-Life Pawprint Reading', price: 5 },
  quick_quest: { name: 'Quick Quest', price: 5 },
  pawollie_vision: { name: 'Pawollie Vision (Daily)', price: 4.99 },
  pawsitive_pupdate: { name: 'Pawsitive Pupdate (Daily)', price: 4.99 }
};

const CORE_SERVICE_IDS = new Set([
  'full_soul_profile',
  'behavior_spirit_scan',
  'canine_birth_chart',
  'past_life_pawprint',
  'quick_quest'
]);
const DAILY_SERVICE_IDS = new Set(['pawollie_vision', 'pawsitive_pupdate']);

function buildLineItems(cart) {
  const items = [];
  const itemIds = [];
  const hasCoreService = (cart || []).some((entry) => CORE_SERVICE_IDS.has(entry?.id));

  (cart || []).forEach((entry) => {
    const item = ITEM_CATALOG[entry?.id];
    if (!item) return;
    itemIds.push(entry.id);
    const quantity = Number(entry.quantity ?? 1) || 1;
    const basePrice = DAILY_SERVICE_IDS.has(entry?.id)
      ? (hasCoreService ? 2.99 : 4.99)
      : item.price;
    const unitAmount = Math.round(basePrice * 100);
    items.push({
      name: item.name,
      unitAmount,
      quantity
    });
  });

  return { items, itemIds };
}

function resolveOrigin(headers) {
  return (
    headers?.origin ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    'http://localhost:5173'
  );
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed.' }) };
  }

  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecret) {
      throw new Error('Missing Stripe secret key.');
    }

    const payload = event.body ? JSON.parse(event.body) : {};
    const { items: lineItems, itemIds } = buildLineItems(payload.cart);

    if (!lineItems.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No valid items in cart.' }) };
    }

    const origin = resolveOrigin(event.headers);
    const successUrl = process.env.STRIPE_SUCCESS_URL || `${origin}/thank-you`;
    const cancelUrl = process.env.STRIPE_CANCEL_URL || `${origin}/cart`;

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('payment_method_types[0]', 'card');
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    params.append('client_reference_id', `pawollie_${Date.now()}`);
    params.append('metadata[order_source]', 'pawollie-cart');
    if (itemIds.length) {
      params.append('metadata[item_ids]', itemIds.join(','));
    }
    lineItems.forEach((item, index) => {
      params.append(`line_items[${index}][price_data][currency]`, 'usd');
      params.append(`line_items[${index}][price_data][product_data][name]`, item.name);
      params.append(`line_items[${index}][price_data][unit_amount]`, String(item.unitAmount));
      params.append(`line_items[${index}][quantity]`, String(item.quantity));
    });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data?.error?.message || 'Stripe checkout failed.' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ id: data.id, url: data.url })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};