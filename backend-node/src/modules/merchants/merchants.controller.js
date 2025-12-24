// src/modules/merchants/merchants.controller.js
const { pool } = require('../../config/db');

// GET /api/merchants -> lista SOLO negocios del dueño logueado
async function listMyMerchants(req, res) {
  const ownerId = req.user.id; // viene del token

  try {
    const result = await pool.query(
      `
      SELECT id, owner_id, name, description, is_active, created_at, updated_at
      FROM merchants
      WHERE owner_id = $1 AND is_active = true
      ORDER BY id
      `,
      [ownerId]
    );

    return res.json(result.rows);
  } catch (err) {
    console.error('Error listando merchants:', err.message);
    return res.status(500).json({ message: 'Error listando merchants' });
  }
}

// GET /api/merchants/:id -> un negocio del dueño
async function getMerchantHandler(req, res) {
  const { id } = req.params;
  const ownerId = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT id, owner_id, name, description, is_active, created_at, updated_at
      FROM merchants
      WHERE id = $1 AND owner_id = $2 AND is_active = true
      `,
      [id, ownerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Negocio no encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error obteniendo merchant:', err.message);
    return res.status(500).json({ message: 'Error obteniendo merchant' });
  }
}

// POST /api/merchants -> crear negocio para el dueño logueado
async function createMerchantHandler(req, res) {
  const ownerId = req.user.id;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'name es obligatorio' });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO merchants (owner_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING id, owner_id, name, description, is_active, created_at, updated_at
      `,
      [ownerId, name, description || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creando merchant:', err.message);
    return res.status(500).json({ message: 'Error creando merchant' });
  }
}

// PUT /api/merchants/:id -> actualizar name/description (soft)
async function updateMerchantHandler(req, res) {
  const { id } = req.params;
  const ownerId = req.user.id;
  const { name, description } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE merchants
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        updated_at = NOW()
      WHERE id = $3 AND owner_id = $4 AND is_active = true
      RETURNING id, owner_id, name, description, is_active, created_at, updated_at
      `,
      [name || null, description || null, id, ownerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Negocio no encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando merchant:', err.message);
    return res.status(500).json({ message: 'Error actualizando merchant' });
  }
}

// DELETE /api/merchants/:id -> soft delete (is_active = false)
async function deleteMerchantHandler(req, res) {
  const { id } = req.params;
  const ownerId = req.user.id;

  try {
    const result = await pool.query(
      `
      UPDATE merchants
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND owner_id = $2 AND is_active = true
      RETURNING id, owner_id, name, description, is_active, created_at, updated_at
      `,
      [id, ownerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Negocio no encontrado' });
    }

    return res.json({
      message: 'Negocio desactivado',
      merchant: result.rows[0],
    });
  } catch (err) {
    console.error('Error desactivando merchant:', err.message);
    return res.status(500).json({ message: 'Error desactivando merchant' });
  }
}

module.exports = {
  listMyMerchants,
  getMerchantHandler,
  createMerchantHandler,
  updateMerchantHandler,
  deleteMerchantHandler,
};
