// src/modules/merchants/merchants.routes.js
const express = require('express');
const {
  listMyMerchants,
  getMerchantHandler,
  createMerchantHandler,
  updateMerchantHandler,
  deleteMerchantHandler,
} = require('./merchants.controller');

const router = express.Router();

// Todas estas rutas YA van protegidas por el middleware auth
// porque las montaremos con authMiddleware en index.js

// GET /api/merchants
router.get('/', listMyMerchants);

// GET /api/merchants/:id
router.get('/:id', getMerchantHandler);

// POST /api/merchants
router.post('/', createMerchantHandler);

// PUT /api/merchants/:id
router.put('/:id', updateMerchantHandler);

// DELETE /api/merchants/:id
router.delete('/:id', deleteMerchantHandler);

module.exports = router;
