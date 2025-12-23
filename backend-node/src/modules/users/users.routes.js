// src/modules/users/users.routes.js
const express = require('express');
const {
  listUsers,
  getUser,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler, // soft delete
} = require('./users.controller');

const router = express.Router();

// GET /api/users -> solo usuarios activos
router.get('/', listUsers);

// GET /api/users/:id -> solo devuelve activos
router.get('/:id', getUser);

// POST /api/users
router.post('/', createUserHandler);

// PUT /api/users/:id
router.put('/:id', updateUserHandler);

// DELETE /api/users/:id -> desactiva usuario (soft delete)
router.delete('/:id', deleteUserHandler);

module.exports = router;
