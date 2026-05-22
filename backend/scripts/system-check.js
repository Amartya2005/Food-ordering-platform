require('dotenv').config({ quiet: true, override: true });

const API_BASE = `http://127.0.0.1:${process.env.PORT || 5000}`;
const ORIGIN = 'http://127.0.0.1:5174';

const results = [];
let failures = 0;

const record = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  if (!passed) failures += 1;
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`[${status}] ${name}${detail ? ` — ${detail}` : ''}`);
};

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Origin: ORIGIN,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  return { response, body };
}

async function preflight(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'OPTIONS',
    headers: {
      Origin: ORIGIN,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });

  return {
    status: response.status,
    allowOrigin: response.headers.get('access-control-allow-origin'),
  };
}

async function main() {
  console.log(`\nSystem check → ${API_BASE} (Origin: ${ORIGIN})\n`);

  const health = await request('/health');
  record('Health', health.response.status === 200);

  const preflightResult = await preflight('/api/auth/register');
  record(
    'CORS preflight (register)',
    preflightResult.status === 204 && preflightResult.allowOrigin === ORIGIN,
    `status=${preflightResult.status}, allow-origin=${preflightResult.allowOrigin}`,
  );

  const unique = Date.now();
  const registerPayload = {
    name: 'System Check User',
    email: `syscheck.${unique}@food.local`,
    password: 'Password1!Test',
    role: 'customer',
    address: '99 Test Street, Food City',
  };

  const register = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(registerPayload),
  });
  record(
    'Register new customer',
    register.response.status === 201 && Boolean(register.body?.data?.token),
    register.body?.message || `status ${register.response.status}`,
  );

  const demoAccounts = [
    { label: 'Customer login', email: 'customer@food.local', password: 'Password1!Cust' },
    { label: 'Owner login', email: 'owner@food.local', password: 'Password1!Owner' },
    { label: 'Admin login', email: 'admin@food.local', password: 'Password1!Admin' },
  ];

  let customerToken = register.body?.data?.token;

  for (const account of demoAccounts) {
    const login = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: account.email, password: account.password }),
    });

    const token = login.body?.data?.token;
    const passed = login.response.status === 200 && Boolean(token);
    record(account.label, passed, login.body?.message || `status ${login.response.status}`);

    if (account.email === 'customer@food.local' && token) {
      customerToken = token;
    }
  }

  if (!customerToken) {
    record('Customer flow', false, 'No customer token');
    console.log(`\n${results.length - failures}/${results.length} checks passed.\n`);
    process.exit(1);
  }

  const restaurants = await request('/api/restaurants', {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const restaurantList = restaurants.body?.data?.restaurants || [];
  record(
    'List restaurants',
    restaurants.response.status === 200 && restaurantList.length > 0,
    `count=${restaurantList.length}`,
  );

  const restaurantId = restaurantList[0]?.id;
  const menu = await request(`/api/menu/${restaurantId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const menuItems = menu.body?.data?.menuItems || [];
  record(
    'Load restaurant menu',
    menu.response.status === 200 && menuItems.length > 0,
    `items=${menuItems.length}`,
  );

  const order = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${customerToken}` },
    body: JSON.stringify({
      restaurantId,
      items: [{ menuItemId: menuItems[0].id, quantity: 1 }],
    }),
  });
  record(
    'Place order',
    order.response.status === 201 && Boolean(order.body?.data?.order?.id),
    order.body?.message || `status ${order.response.status}`,
  );

  const ownerLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'owner@food.local', password: 'Password1!Owner' }),
  });
  const ownerToken = ownerLogin.body?.data?.token;

  const ownerOrders = await request(`/api/orders/restaurant/${restaurantId}`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const ownerOrderList = ownerOrders.body?.data?.orders || [];
  record(
    'Owner view restaurant orders',
    ownerOrders.response.status === 200,
    `orders=${ownerOrderList.length}`,
  );

  const passed = results.length - failures;
  console.log(`\n${passed}/${results.length} checks passed.\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('System check crashed:', error.message);
  process.exit(1);
});
