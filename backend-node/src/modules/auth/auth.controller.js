// src/modules/auth/auth.controller.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');

async function loginHandler(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'email y password son obligatorios' });
    }

    const result = await pool.query(
      `
      SELECT id, full_name, email, role, is_active, password_hash, created_at, updated_at
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res
        .status(403)
        .json({ message: 'Usuario inactivo, contacta al administrador' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash || '');
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // quitamos el hash antes de responder
    const { password_hash, ...safeUser } = user;

    // 👉 generar token JWT
    const token = jwt.sign(
      {
        id: safeUser.id,
        email: safeUser.email,
        role: safeUser.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      }
    );

    // (opcional) para ver en terminal que se está generando
    console.log('✅ Token generado para', safeUser.email);

    return res.json({
      message: 'Login correcto',
      user: safeUser,
      token, // 👈 AQUÍ VA EL TOKEN
    });
  } catch (err) {
    console.error('Error en login:', err.message);
    return res.status(500).json({ message: 'Error en login' });
  }
}

module.exports = { loginHandler };
