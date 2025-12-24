// frontend-react/src/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || 'Error en login');
  }

  return res.json(); // { message, user, token, merchant_id }
}

// 🚩 ahora acepta fecha opcional
export async function getDailySales(token, merchantId, date) {
  const params = new URLSearchParams();
  params.append('merchant_id', merchantId);

  if (date) {
    // formato YYYY-MM-DD
    params.append('date', date);
  }

  const res = await fetch(
    `${API_URL}/api/reports/daily-sales?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Error obteniendo ventas del día');
  }

  return res.json();
}

// top de productos entre rango de fechas
export async function getTopProducts(token, merchantId, from, to) {
  const params = new URLSearchParams();
  params.append('merchant_id', merchantId);
  params.append('from', from);
  params.append('to', to);

  const res = await fetch(
    `${API_URL}/api/reports/top-products?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Error obteniendo top de productos');
  }

  return res.json(); // array de productos
}

// 🆕 ventas por rango (lo usaremos para "últimos 7 días")
export async function getSalesRange(token, merchantId, from, to) {
  const params = new URLSearchParams();
  params.append('merchant_id', merchantId);
  params.append('from', from);
  params.append('to', to);

  const res = await fetch(
    `${API_URL}/api/reports/sales-range?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Error obteniendo ventas por rango');
  }

  return res.json(); // [{ sale_date, total_orders, total_sales }, ...]
}
