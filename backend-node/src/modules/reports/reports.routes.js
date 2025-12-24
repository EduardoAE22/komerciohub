// src/modules/reports/reports.routes.js
const express = require('express');
const { 
    getDailySales, 
    getSalesRange,
    getTopProducts,
    getOwnerDailySummary,
  getOwnerTopProducts, 

} = require('./reports.controller');

const router = express.Router();

// Reporte 1: ventas del día (con o sin ?date=YYYY-MM-DD)
router.get('/daily-sales', getDailySales);
router.get('/sales-range', getSalesRange);
router.get('/top-products', getTopProducts);

// Reportes “owner” (sin merchant_id, usan el dueño del token)
router.get('/owner/daily-summary', getOwnerDailySummary);
router.get('/owner/top-products', getOwnerTopProducts);

module.exports = router;
