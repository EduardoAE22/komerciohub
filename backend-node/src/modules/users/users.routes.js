// src/modules/users/users.routes.js
const express = require('express');
const {
  listUsers,
  getUser,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
} = require('./users.controller');

const router = express.Router();

// OJO: aquí ya NO usamos router.use(authRequired)
// La protección está en src/index.js

// GET /api/users -> lista usuarios activos
router.get('/', listUsers);

// GET /api/users/:id -> solo usuarios activos
router.get('/:id', getUser);

// POST /api/users
router.post('/', createUserHandler);

// PUT /api/users/:id
router.put('/:id', updateUserHandler);

// DELETE /api/users/:id -> soft delete (is_active = false)
router.delete('/:id', deleteUserHandler);

module.exports = router;
