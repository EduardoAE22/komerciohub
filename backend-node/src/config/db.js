const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Si usas parámetros sueltos:
  // host: process.env.DB_HOST,
  // port: process.env.DB_PORT,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASS,
  // database: process.env.DB_NAME,
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexión a PostgreSQL OK:', result.rows[0].now);
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    console.error(err); // <- extra para ver más detalle
  }
}

module.exports = { pool, testConnection };
