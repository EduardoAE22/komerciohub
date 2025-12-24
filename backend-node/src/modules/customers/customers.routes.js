// src/modules/customers/customers.routes.js
const express = require('express');
const {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} = require('./customers.controller');

const router = express.Router();

// GET /api/customers?merchant_id=1
router.get('/', listCustomers);

// GET /api/customers/:id
router.get('/:id', getCustomer);

// POST /api/customers
router.post('/', createCustomer);

// PUT /api/customers/:id
router.put('/:id', updateCustomer);

// DELETE /api/customers/:id
router.delete('/:id', deleteCustomer);

module.exports = router;
