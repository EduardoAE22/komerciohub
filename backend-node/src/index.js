const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/db');
const usersRoutes = require('./modules/users/users.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'backend-node', timestamp: new Date().toISOString() });
});

// Rutas de usuarios
app.use('/api/users', usersRoutes);

testConnection();

app.listen(PORT, () => {
  console.log(`API backend-node escuchando en http://localhost:${PORT}`);
});
