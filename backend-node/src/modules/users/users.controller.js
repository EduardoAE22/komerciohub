// src/modules/users/users.controller.js
const bcrypt = require('bcrypt');
const { pool } = require('../../config/db');

const SALT_ROUNDS = 10;
/**
 * GET /api/users
 * Lista solo usuarios activos (is_active = true)
 */
async function listUsers(req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT id, full_name, email, role, is_active, created_at, updated_at
      FROM users
      WHERE is_active = true
      ORDER BY id
    `);

    return res.json(rows);
  } catch (err) {
    console.error('Error listando usuarios:', err.message);
    return res.status(500).json({ message: 'Error listando usuarios' });
  }
}

/**
 * GET /api/users/:id
 * Obtiene un usuario por id, solo si está activo
 */
async function getUser(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `
      SELECT id, full_name, email, role, is_active, created_at, updated_at
      FROM users
      WHERE id = $1 AND is_active = true
      `,
      [id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: 'Usuario no encontrado o inactivo' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('Error obteniendo usuario:', err.message);
    return res.status(500).json({ message: 'Error obteniendo usuario' });
  }
}

/**
 * POST /api/users
 * Crea un usuario
 */
async function createUserHandler(req, res) {
  try {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'full_name, email y password son obligatorios' });
    }

    // 1) Hasheamos la contraseña
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 2) Guardamos en la BD el hash, NO el password en texto plano
    const result = await pool.query(
      `
      INSERT INTO users (full_name, email, role, is_active, password_hash, created_at, updated_at)
      VALUES ($1, $2, COALESCE($3, 'owner'), true, $4, NOW(), NOW())
      RETURNING id, full_name, email, role, is_active, created_at, updated_at
      `,
      [full_name, email, role, passwordHash]
    );

    const user = result.rows[0];

    res.status(201).json(user);
  } catch (err) {
    console.error('Error creando usuario:', err.message);
    res.status(500).json({ message: 'Error creando usuario' });
  }
}

/**
 * PUT /api/users/:id
 * Actualiza campos del usuario (parches suaves con COALESCE)
 */
async function updateUserHandler(req, res) {
  const { id } = req.params;
  const { full_name, email, password, role, is_active } = req.body;

  try {
    const { rows } = await pool.query(
      `
      UPDATE users
      SET
        full_name = COALESCE($1, full_name),
        email     = COALESCE($2, email),
        password  = COALESCE($3, password),
        role      = COALESCE($4, role),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $6
      RETURNING id, full_name, email, role, is_active, created_at, updated_at
      `,
      [
        full_name ?? null,
        email ?? null,
        password ?? null,
        role ?? null,
        is_active ?? null,
        id,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('Error actualizando usuario:', err.message);
    return res.status(500).json({ message: 'Error actualizando usuario' });
  }
}

/**
 * DELETE /api/users/:id
 * Soft delete: marca is_active = false
 */
async function deleteUserHandler(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `
      UPDATE users
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING id, full_name, email, role, is_active, created_at, updated_at
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json({
      message: 'Usuario desactivado',
      user: rows[0],
    });
  } catch (err) {
    console.error('Error desactivando usuario:', err.message);
    return res.status(500).json({ message: 'Error desactivando usuario' });
  }
}

module.exports = {
  listUsers,
  getUser,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
};
