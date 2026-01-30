const CORE_ITEMS = {
  full_soul_profile: { label: 'Full Soul Discovery Profile', price: 30 },
  behavior_spirit_scan: { label: 'Personality & Behavior Spirit Scan', price: 20 },
  canine_birth_chart: { label: 'Canine Birth Chart', price: 15 },
  past_life_pawprint: { label: 'Past-Life Pawprint Reading', price: 5 },
  quick_quest: { label: 'Quick Quest', price: 5 }
};

const DAILY_ITEMS = {
  pawollie_vision: { label: 'Pawollie Vision' },
  pawsitive_pupdate: { label: 'Pawsitive Pupdate' }
};

function formatUSD(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '$0.00';
  return `$${amount.toFixed(2)}`;
}

function getSelectedCartItems() {
  const items = [];
  let hasCore = false;

  const select = document.getElementById('cart_service');
  if (select instanceof HTMLSelectElement) {
    const key = select.value;
    if (key && CORE_ITEMS[key]) {
      items.push({ id: key, type: 'core', ...CORE_ITEMS[key] });
      hasCore = true;
    }
  }

  const dailyInputs = Array.from(document.querySelectorAll('input[name="daily_services"]'));
  dailyInputs.forEach((input) => {
    if (input instanceof HTMLInputElement && input.checked) {
      const key = input.value;
      if (DAILY_ITEMS[key]) {
        items.push({ id: key, type: 'daily', ...DAILY_ITEMS[key] });
      }
    }
  });

  return { items, hasCore };
}

function calculateTotal(items, hasCore) {
  const dailyPrice = hasCore ? 2.99 : 4.99;
  return items.reduce((sum, item) => {
    if (item.type === 'daily') return sum + dailyPrice;
    return sum + (item.price || 0);
  }, 0);
}

function updateCartTotal() {
  const display = document.getElementById('cart_total');
  if (!display) return;
  const { items, hasCore } = getSelectedCartItems();
  const total = calculateTotal(items, hasCore);
  display.textContent = items.length ? formatUSD(total) : '$0.00';
}

function initCart() {
  const form = document.getElementById('cart-form');
  if (form && form.dataset.pawollieInit === 'true') return;
  if (form) form.dataset.pawollieInit = 'true';

  const select = document.getElementById('cart_service');
  if (select instanceof HTMLSelectElement) {
    select.addEventListener('change', updateCartTotal);
  }

  const dailyInputs = Array.from(document.querySelectorAll('input[name="daily_services"]'));
  dailyInputs.forEach((input) => {
    input.addEventListener('change', updateCartTotal);
  });

  updateCartTotal();
}

async function createStripeCheckout() {
  const { items } = getSelectedCartItems();
  if (!items.length) {
    throw new Error('Please select a service or daily option before checkout.');
  }

  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      cart: items.map((item) => ({
        id: item.id,
        quantity: 1
      }))
    })
  });

  const orderData = await response.json();
  if (orderData?.url) return orderData.url;

  const errorMessage = orderData?.error || orderData?.message || JSON.stringify(orderData);
  throw new Error(errorMessage);
}

function resultMessage(message) {
  const container = document.querySelector('#result-message');
  if (container) container.textContent = message;
}

function initStripeCheckout() {
  const button = document.getElementById('stripe-checkout-btn');
  if (!(button instanceof HTMLButtonElement)) return;
  if (button.dataset.pawollieInit === 'true') return;
  button.dataset.pawollieInit = 'true';

  button.addEventListener('click', async () => {
    button.disabled = true;
    resultMessage('Redirecting to secure checkout...');
    try {
      const checkoutUrl = await createStripeCheckout();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Sorry, your checkout could not be processed.';
      resultMessage(message);
    } finally {
      button.disabled = false;
    }
  });
}

window.pawollieInitCart = initCart;
window.pawollieInitStripeCheckout = initStripeCheckout;

window.addEventListener('load', () => {
  initCart();
  initStripeCheckout();
});
