// src/modules/auth/auth.routes.js
const express = require('express');
const { loginHandler } = require('./auth.controller');

const router = express.Router();

// POST /api/auth/login
router.post('/login', loginHandler);

module.exports = router;
