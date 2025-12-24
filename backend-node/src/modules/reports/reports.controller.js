// src/modules/reports/reports.controller.js
const { pool } = require('../../config/db');

/**
 * GET /api/reports/daily-sales?merchant_id=1&date=2025-12-23
 * Reporte de ventas del día para un merchant
 */
async function getDailySales(req, res) {
  const userId = req.user.id; // viene del token (authRequired)
  const merchantId = parseInt(req.query.merchant_id, 10);
  const dateParam = req.query.date; // opcional: '2025-12-23'

  if (!merchantId) {
    return res
      .status(400)
      .json({ message: 'merchant_id es requerido en el query string' });
  }

  try {
    let query;
    let params;
    let dateUsed;

    if (dateParam) {
      // Usar fecha enviada
      query = `
        SELECT
          m.id AS merchant_id,
          m.name AS merchant_name,
          COALESCE(COUNT(o.id), 0) AS total_orders,
          COALESCE(SUM(o.total_amount), 0) AS total_sales
        FROM merchants m
        LEFT JOIN orders o
          ON o.merchant_id = m.id
         AND o.status = 'paid'
         AND o.is_active = TRUE
         AND o.created_at::date = $3
        WHERE m.id = $1
          AND m.owner_id = $2
          AND m.is_active = TRUE
        GROUP BY m.id, m.name
      `;
      params = [merchantId, userId, dateParam];
      dateUsed = dateParam;
    } else {
      // Usar fecha de hoy
      query = `
        SELECT
          m.id AS merchant_id,
          m.name AS merchant_name,
          COALESCE(COUNT(o.id), 0) AS total_orders,
          COALESCE(SUM(o.total_amount), 0) AS total_sales
        FROM merchants m
        LEFT JOIN orders o
          ON o.merchant_id = m.id
         AND o.status = 'paid'
         AND o.is_active = TRUE
         AND o.created_at::date = CURRENT_DATE
        WHERE m.id = $1
          AND m.owner_id = $2
          AND m.is_active = TRUE
        GROUP BY m.id, m.name
      `;
      params = [merchantId, userId];
      dateUsed = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: 'Merchant no encontrado o no pertenece al usuario' });
    }

    const row = result.rows[0];

    return res.json({
      merchant_id: row.merchant_id,
      merchant_name: row.merchant_name,
      date: dateUsed,
      total_orders: parseInt(row.total_orders, 10),
      total_sales: row.total_sales || '0.00', // viene como string de PG
    });
  } catch (err) {
    console.error('Error obteniendo reporte de ventas del día:', err.message);
    return res
      .status(500)
      .json({ message: 'Error obteniendo reporte de ventas del día' });
  }
}

/**
 * GET /api/reports/sales-range?merchant_id=1&from=2025-12-23&to=2025-12-25
 */
async function getSalesRange(req, res) {
  const userId = req.user.id;
  const merchantId = parseInt(req.query.merchant_id, 10);
  const from = req.query.from; // YYYY-MM-DD
  const to = req.query.to;     // YYYY-MM-DD

  if (!merchantId) {
    return res
      .status(400)
      .json({ message: 'merchant_id es requerido en el query string' });
  }

  if (!from || !to) {
    return res
      .status(400)
      .json({ message: 'from y to son requeridos en el query string (YYYY-MM-DD)' });
  }

  try {
    const query = `
      SELECT
        o.created_at::date AS sale_date,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_sales
      FROM orders o
      JOIN merchants m
        ON m.id = o.merchant_id
      WHERE m.id = $1
        AND m.owner_id = $2
        AND m.is_active = TRUE
        AND o.is_active = TRUE
        AND o.status = 'paid'
        AND o.created_at::date BETWEEN $3 AND $4
      GROUP BY sale_date
      ORDER BY sale_date;
    `;

    const params = [merchantId, userId, from, to];

    const result = await pool.query(query, params);

    return res.json(
      result.rows.map((row) => ({
        sale_date: row.sale_date,
        total_orders: parseInt(row.total_orders, 10),
        total_sales: row.total_sales || '0.00',
      }))
    );
  } catch (err) {
    console.error('Error obteniendo reporte de ventas por rango:', err.message);
    return res
      .status(500)
      .json({ message: 'Error obteniendo reporte de ventas por rango' });
  }
}

async function getTopProducts(req, res) {
  const userId = req.user.id;
  const merchantId = parseInt(req.query.merchant_id, 10);
  const from = req.query.from; // YYYY-MM-DD
  const to = req.query.to;     // YYYY-MM-DD

  if (!merchantId) {
    return res
      .status(400)
      .json({ message: 'merchant_id es requerido en el query string' });
  }

  if (!from || !to) {
    return res.status(400).json({
      message: 'from y to son requeridos en el query string (YYYY-MM-DD)',
    });
  }

  try {
    const query = `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        SUM(oi.quantity) AS total_quantity,
        COALESCE(SUM(oi.total_price), 0) AS total_revenue
      FROM order_items oi
      JOIN orders o
        ON o.id = oi.order_id
      JOIN merchants m
        ON m.id = o.merchant_id
      JOIN products p
        ON p.id = oi.product_id
      WHERE m.id = $1
        AND m.owner_id = $2
        AND m.is_active = TRUE
        AND o.is_active = TRUE
        AND o.status = 'paid'
        AND o.created_at::date BETWEEN $3 AND $4
      GROUP BY p.id, p.name
      ORDER BY total_quantity DESC, total_revenue DESC;
    `;

    const params = [merchantId, userId, from, to];

    const result = await pool.query(query, params);

    return res.json(
      result.rows.map((row) => ({
        product_id: row.product_id,
        product_name: row.product_name,
        total_quantity: parseInt(row.total_quantity, 10),
        total_revenue: row.total_revenue || '0.00',
      }))
    );
  } catch (err) {
    console.error('Error obteniendo top de productos:', err.message);
    return res
      .status(500)
      .json({ message: 'Error obteniendo top de productos' });
  }
}

/**
 * GET /api/reports/owner/daily-summary?date=YYYY-MM-DD
 * Usa el dueño del token (req.user.id) y saca el resumen de ese día.
 * Si no viene date, usa la fecha de hoy.
 */
async function getOwnerDailySummary(req, res) {
  const userId = req.user.id;
  const dateParam = req.query.date;

  const dateUsed = dateParam || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    const query = `
      SELECT
        m.id AS merchant_id,
        m.name AS merchant_name,
        COALESCE(COUNT(o.id), 0) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_sales
      FROM merchants m
      LEFT JOIN orders o
        ON o.merchant_id = m.id
       AND o.status = 'paid'
       AND o.is_active = TRUE
       AND o.created_at::date = $2
      WHERE m.owner_id = $1
        AND m.is_active = TRUE
      GROUP BY m.id, m.name
      ORDER BY m.id
      LIMIT 1;
    `;

    const params = [userId, dateUsed];

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'No se encontró negocio activo para este dueño',
      });
    }

    const row = result.rows[0];

    return res.json({
      merchant_id: row.merchant_id,
      merchant_name: row.merchant_name,
      date: dateUsed,
      total_orders: parseInt(row.total_orders, 10),
      total_sales: row.total_sales || '0.00',
    });
  } catch (err) {
    console.error('Error en getOwnerDailySummary:', err.message);
    return res
      .status(500)
      .json({ message: 'Error obteniendo resumen diario del dueño' });
  }
}

/**
 * GET /api/reports/owner/top-products?date=YYYY-MM-DD
 * Top productos del dueño en la fecha dada (o hoy si no mandan date).
 */
async function getOwnerTopProducts(req, res) {
  const userId = req.user.id;
  const dateParam = req.query.date;
  const dateUsed = dateParam || new Date().toISOString().slice(0, 10);

  try {
    const query = `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        SUM(oi.quantity) AS total_quantity,
        COALESCE(SUM(oi.total_price), 0) AS total_revenue
      FROM order_items oi
      JOIN orders o
        ON o.id = oi.order_id
      JOIN merchants m
        ON m.id = o.merchant_id
      JOIN products p
        ON p.id = oi.product_id
      WHERE m.owner_id = $1
        AND m.is_active = TRUE
        AND o.is_active = TRUE
        AND o.status = 'paid'
        AND o.created_at::date = $2
      GROUP BY p.id, p.name
      ORDER BY total_quantity DESC, total_revenue DESC;
    `;

    const params = [userId, dateUsed];

    const result = await pool.query(query, params);

    return res.json(
      result.rows.map((row) => ({
        product_id: row.product_id,
        product_name: row.product_name,
        total_quantity: parseInt(row.total_quantity, 10),
        total_revenue: row.total_revenue || '0.00',
      }))
    );
  } catch (err) {
    console.error('Error en getOwnerTopProducts:', err.message);
    return res
      .status(500)
      .json({ message: 'Error obteniendo top de productos del dueño' });
  }
}

module.exports = {
  getDailySales,
  getSalesRange,
  getTopProducts,
  getOwnerDailySummary,
  getOwnerTopProducts,
};

