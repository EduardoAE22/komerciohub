// src/modules/customers/customers.controller.js
const { pool } = require('../../config/db');

// Helper: verifica que el merchant pertenece al usuario logueado
async function hasAccessToMerchant(merchantId, userId) {
  const result = await pool.query(
    `
    SELECT id
    FROM merchants
    WHERE id = $1
      AND owner_id = $2
      AND is_active = true
    `,
    [merchantId, userId]
  );

  return result.rows.length > 0;
}

// POST /api/customers
async function createCustomer(req, res) {
  const userId = req.user.id;
  const { merchant_id, full_name, phone, email, notes } = req.body;

  if (!merchant_id || !full_name) {
    return res
      .status(400)
      .json({ message: 'merchant_id y full_name son obligatorios' });
  }

  try {
    const allowed = await hasAccessToMerchant(merchant_id, userId);
    if (!allowed) {
      return res
        .status(403)
        .json({ message: 'No tienes acceso a este merchant' });
    }

    const result = await pool.query(
      `
      INSERT INTO customers (merchant_id, full_name, phone, email, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, merchant_id, full_name, phone, email, notes,
                is_active, created_at, updated_at
      `,
      [merchant_id, full_name, phone || null, email || null, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creando cliente:', err.message);
    res.status(500).json({ message: 'Error creando cliente' });
  }
}

// GET /api/customers?merchant_id=1
async function listCustomers(req, res) {
  const userId = req.user.id;
  const { merchant_id } = req.query;

  if (!merchant_id) {
    return res
      .status(400)
      .json({ message: 'merchant_id es obligatorio en query' });
  }

  try {
    const allowed = await hasAccessToMerchant(merchant_id, userId);
    if (!allowed) {
      return res
        .status(403)
        .json({ message: 'No tienes acceso a este merchant' });
    }

    const result = await pool.query(
      `
      SELECT id, merchant_id, full_name, phone, email, notes,
             is_active, created_at, updated_at
      FROM customers
      WHERE merchant_id = $1
        AND is_active = true
      ORDER BY id
      `,
      [merchant_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error listando clientes:', err.message);
    res.status(500).json({ message: 'Error listando clientes' });
  }
}

// GET /api/customers/:id
async function getCustomer(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        c.id, c.merchant_id, c.full_name, c.phone, c.email, c.notes,
        c.is_active, c.created_at, c.updated_at,
        m.owner_id
      FROM customers c
      JOIN merchants m ON c.merchant_id = m.id
      WHERE c.id = $1
        AND c.is_active = true
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    const customer = result.rows[0];

    if (customer.owner_id !== userId) {
      return res
        .status(403)
        .json({ message: 'No tienes acceso a este cliente' });
    }

    delete customer.owner_id;

    res.json(customer);
  } catch (err) {
    console.error('Error obteniendo cliente:', err.message);
    res.status(500).json({ message: 'Error obteniendo cliente' });
  }
}

// PUT /api/customers/:id
async function updateCustomer(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const { full_name, phone, email, notes, is_active } = req.body;

  try {
    const check = await pool.query(
      `
      SELECT c.id
      FROM customers c
      JOIN merchants m ON c.merchant_id = m.id
      WHERE c.id = $1
        AND m.owner_id = $2
      `,
      [id, userId]
    );

    if (check.rows.length === 0) {
      return res
        .status(403)
        .json({ message: 'No tienes acceso a este cliente' });
    }

    const result = await pool.query(
      `
      UPDATE customers
      SET
        full_name = COALESCE($1, full_name),
        phone     = COALESCE($2, phone),
        email     = COALESCE($3, email),
        notes     = COALESCE($4, notes),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $6
      RETURNING id, merchant_id, full_name, phone, email, notes,
                is_active, created_at, updated_at
      `,
      [full_name || null, phone || null, email || null, notes || null, is_active, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando cliente:', err.message);
    res.status(500).json({ message: 'Error actualizando cliente' });
  }
}

// DELETE /api/customers/:id (soft delete)
async function deleteCustomer(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const check = await pool.query(
      `
      SELECT c.id
      FROM customers c
      JOIN merchants m ON c.merchant_id = m.id
      WHERE c.id = $1
        AND m.owner_id = $2
      `,
      [id, userId]
    );

    if (check.rows.length === 0) {
      return res
        .status(403)
        .json({ message: 'No tienes acceso a este cliente' });
    }

    const result = await pool.query(
      `
      UPDATE customers
      SET is_active = false,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, merchant_id, full_name, phone, email, notes,
                is_active, created_at, updated_at
      `,
      [id]
    );

    res.json({
      message: 'Cliente desactivado',
      customer: result.rows[0],
    });
  } catch (err) {
    console.error('Error desactivando cliente:', err.message);
    res.status(500).json({ message: 'Error desactivando cliente' });
  }
}

module.exports = {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
};
