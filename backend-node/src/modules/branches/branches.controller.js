// src/modules/branches/branches.controller.js
const { pool } = require('../../config/db');

/**
 * Lista sucursales de un merchant (solo activas)
 * GET /api/branches?merchant_id=1
 */
async function listBranches(req, res) {
  const { merchant_id } = req.query;

  if (!merchant_id) {
    return res
      .status(400)
      .json({ message: 'merchant_id es obligatorio en query' });
  }

  try {
    const result = await pool.query(
      `
      SELECT id, merchant_id, name, address, city, phone,
             is_active, created_at, updated_at
      FROM branches
      WHERE merchant_id = $1 AND is_active = true
      ORDER BY id
      `,
      [merchant_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error listando sucursales:', err.message);
    res.status(500).json({ message: 'Error listando sucursales' });
  }
}

/**
 * Obtiene una sucursal por id (solo si está activa y pertenece a un merchant del dueño logueado)
 */
async function getBranch(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `
      SELECT b.id, b.merchant_id, b.name, b.address, b.city, b.phone,
             b.is_active, b.created_at, b.updated_at
      FROM branches b
      JOIN merchants m ON b.merchant_id = m.id
      WHERE b.id = $1
        AND b.is_active = true
        AND m.owner_id = $2
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error obteniendo sucursal:', err.message);
    res.status(500).json({ message: 'Error obteniendo sucursal' });
  }
}

/**
 * Crea sucursal
 * POST /api/branches
 * body: { merchant_id, name, address?, city?, phone? }
 */
async function createBranch(req, res) {
  const userId = req.user.id;
  const { merchant_id, name, address, city, phone } = req.body;

  if (!merchant_id || !name) {
    return res
      .status(400)
      .json({ message: 'merchant_id y name son obligatorios' });
  }

  try {
    // Validar que el merchant sea del dueño logueado
    const merchantCheck = await pool.query(
      `
      SELECT id
      FROM merchants
      WHERE id = $1
        AND owner_id = $2
        AND is_active = true
      `,
      [merchant_id, userId]
    );

    if (merchantCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ message: 'No tienes acceso a este merchant' });
    }

    const result = await pool.query(
      `
      INSERT INTO branches (merchant_id, name, address, city, phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, merchant_id, name, address, city, phone,
                is_active, created_at, updated_at
      `,
      [merchant_id, name, address || null, city || null, phone || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creando sucursal:', err.message);
    res.status(500).json({ message: 'Error creando sucursal' });
  }
}

/**
 * Actualiza sucursal
 * PUT /api/branches/:id
 */
async function updateBranch(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  const { name, address, city, phone, is_active } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE branches b
      SET name = COALESCE($1, b.name),
          address = COALESCE($2, b.address),
          city = COALESCE($3, b.city),
          phone = COALESCE($4, b.phone),
          is_active = COALESCE($5, b.is_active),
          updated_at = NOW()
      FROM merchants m
      WHERE b.id = $6
        AND b.merchant_id = m.id
        AND m.owner_id = $7
      RETURNING b.id, b.merchant_id, b.name, b.address, b.city, b.phone,
                b.is_active, b.created_at, b.updated_at
      `,
      [name, address, city, phone, is_active, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando sucursal:', err.message);
    res.status(500).json({ message: 'Error actualizando sucursal' });
  }
}

/**
 * Soft delete sucursal
 * DELETE /api/branches/:id
 */
async function deleteBranch(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `
      UPDATE branches b
      SET is_active = false,
          updated_at = NOW()
      FROM merchants m
      WHERE b.id = $1
        AND b.merchant_id = m.id
        AND m.owner_id = $2
      RETURNING b.id, b.merchant_id, b.name, b.address, b.city, b.phone,
                b.is_active, b.created_at, b.updated_at
      `,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sucursal no encontrada' });
    }

    res.json({
      message: 'Sucursal desactivada',
      branch: result.rows[0],
    });
  } catch (err) {
    console.error('Error desactivando sucursal:', err.message);
    res.status(500).json({ message: 'Error desactivando sucursal' });
  }
}

module.exports = {
  listBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
};
