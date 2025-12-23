// src/modules/users/userModel.js
const { pool } = require('../../config/db');

// Obtener todos los usuarios
async function getAllUsers() {
  const query = `
    SELECT id, full_name, email, role, is_active, created_at, updated_at
    FROM users
    ORDER BY id;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

// Obtener un usuario por id
async function getUserById(id) {
  const query = `
    SELECT id, full_name, email, role, is_active, created_at, updated_at
    FROM users
    WHERE id = $1;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}

// Crear usuario
async function createUser({ full_name, email, role = 'owner' }) {
  const query = `
    INSERT INTO users (full_name, email, role)
    VALUES ($1, $2, $3)
    RETURNING id, full_name, email, role, is_active, created_at, updated_at;
  `;
  const values = [full_name, email, role];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

// Actualizar usuario
async function updateUser(id, { full_name, role, is_active }) {
  const query = `
    UPDATE users
    SET
      full_name  = COALESCE($1, full_name),
      role       = COALESCE($2, role),
      is_active  = COALESCE($3, is_active),
      updated_at = NOW()
    WHERE id = $4
    RETURNING id, full_name, email, role, is_active, created_at, updated_at;
  `;
  const values = [full_name ?? null, role ?? null, is_active ?? null, id];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

// Borrado lógico (soft delete)
async function deleteUser(id) {
  const query = `
    UPDATE users
    SET is_active = FALSE, updated_at = NOW()
    WHERE id = $1
    RETURNING id, full_name, email, role, is_active, created_at, updated_at;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
