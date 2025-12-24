const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/db');
const usersRoutes = require('./modules/users/users.routes');
const authRoutes = require('./modules/auth/auth.routes');
const { authRequired } = require('./middleware/auth.middleware');
const merchantsRoutes = require('./modules/merchants/merchants.routes');
const branchesRoutes = require('./modules/branches/branches.routes'); // 👈 nueva
const productsRoutes = require('./modules/products/products.routes');
const customersRoutes = require('./modules/customers/customers.routes');
const ordersRoutes = require('./modules/orders/orders.routes');
const reportsRoutes = require('./modules/reports/reports.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    service: 'backend-node', 
    timestamp: new Date().toISOString() });
});

// Rutas públicas
app.use('/api/auth', authRoutes);

// Rutas protegidas (requieren token)
app.use('/api/users', authRequired, usersRoutes);
app.use('/api/merchants', authRequired, merchantsRoutes); // 👈 protegemos merchants también
app.use('/api/branches', authRequired, branchesRoutes); // 👈 nueva
app.use('/api/products', authRequired, productsRoutes);
app.use('/api/customers', authRequired, customersRoutes);
app.use('/api/orders', authRequired, ordersRoutes);
app.use('/api/reports', authRequired, reportsRoutes);

// Test conexión BD
testConnection();

app.listen(PORT, () => {
  console.log(`API backend-node escuchando en http://localhost:${PORT}`);
});
