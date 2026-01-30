const CART_ITEMS = {
  full_soul_profile: { label: 'Full Soul Discovery Profile', price: 30 },
  behavior_spirit_scan: { label: 'Personality and Behavior Spirit Scan', price: 20 },
  canine_birth_chart: { label: 'Canine Birth Chart', price: 15 },
  past_life_pawprint: { label: 'Past-Life Pawprint Reading', price: 5 },
  quick_quest: { label: 'Quick Quest', price: 5 },
  pawollie_vision: { label: 'Pawollie Vision (Daily)', price: 4.99 },
  pawsitive_pupdate: { label: 'Pawsitive Pupdate (Daily)', price: 4.99 }
};

function formatUSD(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '$0.00';
  return `$${amount.toFixed(2)}`;
}

function getSelectedCartItem() {
  const select = document.getElementById('cart_service');
  if (!(select instanceof HTMLSelectElement)) return null;
  const key = select.value;
  if (!key || !CART_ITEMS[key]) return null;
  return { key, ...CART_ITEMS[key] };
}

function updateCartTotal() {
  const display = document.getElementById('cart_total');
  if (!display) return;
  const item = getSelectedCartItem();
  display.textContent = item ? formatUSD(item.price) : '$0.00';
}

function initCart() {
  const select = document.getElementById('cart_service');
  if (select instanceof HTMLSelectElement) {
    select.addEventListener('change', updateCartTotal);
  }
  updateCartTotal();
}

async function createPayPalOrder() {
  const item = getSelectedCartItem();
  if (!item) {
    throw new Error('Please select a service before checkout.');
  }

  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cart: [{
        id: item.key,
        quantity: 1
      }]
    })
  });

  const orderData = await response.json();
  if (orderData.id) return orderData.id;

  const errorDetail = orderData?.details?.[0];
  const errorMessage = errorDetail
    ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
    : JSON.stringify(orderData);

  throw new Error(errorMessage);
}

async function capturePayPalOrder(orderId) {
  const response = await fetch(`/api/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return response.json();
}

function resultMessage(message) {
  const container = document.querySelector('#result-message');
  if (container) container.textContent = message;
}

function initPayPalButtons() {
  if (!window.paypal || typeof window.paypal.Buttons !== 'function') return;

  window.paypal.Buttons({
    style: {
      shape: 'rect',
      layout: 'vertical',
      color: 'blue',
      label: 'paypal'
    },
    async createOrder() {
      try {
        return await createPayPalOrder();
      } catch (error) {
        console.error(error);
        resultMessage('Please select a service before checkout.');
        throw error;
      }
    },
    async onApprove(data, actions) {
      try {
        const orderData = await capturePayPalOrder(data.orderID);
        const errorDetail = orderData?.details?.[0];

        if (errorDetail?.issue === 'INSTRUMENT_DECLINED') {
          return actions.restart();
        }
        if (errorDetail) {
          throw new Error(`${errorDetail.description} (${orderData.debug_id})`);
        }
        if (!orderData.purchase_units) {
          throw new Error(JSON.stringify(orderData));
        }

        const transaction =
          orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
          orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];

        resultMessage(`Transaction ${transaction?.status}: ${transaction?.id}`);
      } catch (error) {
        console.error(error);
        resultMessage('Sorry, your transaction could not be processed.');
      }
    }
  }).render('#paypal-button-container');
}

window.addEventListener('load', () => {
  initCart();
  initPayPalButtons();
});
