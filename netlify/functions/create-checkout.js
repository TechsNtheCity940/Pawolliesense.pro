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

function buildLineItems(cart) {
  const items = [];
  const itemIds = [];

  (cart || []).forEach((entry) => {
    const item = ITEM_CATALOG[entry?.id];
    if (!item) return;
    itemIds.push(entry.id);
    const quantity = Number(entry.quantity ?? 1) || 1;
    const unitAmount = Math.round(item.price * 100);
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
    const cart = Array.isArray(payload.cart)
      ? payload.cart
      : payload.service
        ? [{ id: payload.service, quantity: 1 }]
        : payload.selected_service
          ? [{ id: payload.selected_service, quantity: 1 }]
          : [];
    const { items: lineItems, itemIds } = buildLineItems(cart);

    if (!lineItems.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No valid items selected.' }) };
    }

    const origin = resolveOrigin(event.headers);
    const successUrl = process.env.STRIPE_SUCCESS_URL || `${origin}/thank-you`;
    const cancelUrl = process.env.STRIPE_CANCEL_URL || `${origin}/intake`;

    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('payment_method_types[0]', 'card');
    params.append('success_url', successUrl);
    params.append('cancel_url', cancelUrl);
    if (payload.readingId) {
      params.append('client_reference_id', String(payload.readingId));
      params.append('metadata[reading_id]', String(payload.readingId));
    } else {
      params.append('client_reference_id', `pawollie_${Date.now()}`);
    }
    params.append('metadata[order_source]', 'pawollie-intake');
    if (itemIds.length) {
      params.append('metadata[item_ids]', itemIds.join(','));
      params.append('metadata[primary_service]', itemIds[0]);
    } else if (payload.service || payload.selected_service) {
      params.append('metadata[primary_service]', String(payload.service || payload.selected_service));
    }
    if (payload.email) {
      params.append('customer_email', String(payload.email));
      params.append('metadata[email]', String(payload.email));
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
