// src/modules/orders/orders.routes.js
const express = require('express');
const {
  createOrder,
  listOrders,
  getOrder,
  payOrder,
} = require('./orders.controller');

const router = express.Router();

// Lista órdenes (por merchant y opcional sucursal)
router.get('/', listOrders);

// Detalle de una orden
router.get('/:id', getOrder);

// Crear orden
router.post('/', createOrder);

// Marcar como pagada
router.patch('/:id/pay', payOrder);

module.exports = router;
