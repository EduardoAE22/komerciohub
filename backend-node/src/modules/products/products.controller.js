// src/modules/products/products.controller.js
const { pool } = require('../../config/db');

// Helper para validar que el merchant pertenece al usuario logueado
async function hasAccessToMerchant(merchantId, userId) {
  const result = await pool.query(
    `
    SELECT id
    FROM merchants
    WHERE id = $1
      AND owner_id = $2
      AND is_active = true
    `,
    [merchantId, userId]
  );

  return result.rows.length > 0;
}

// POST /api/products
async function createProduct(req, res) {
  const userId = req.user.id;
  const { merchant_id, name, sku, price, description } = req.body;

  if (!merchant_id || !name || price == null) {
    return res
      .status(400)
      .json({ message: 'merchant_id, name y price son obligatorios' });
  }

  try {
    const allowed = await hasAccessToMerchant(merchant_id, userId);
    if (!allowed) {
      return res
        .status(403)
        .json({ message: 'No tienes acceso a este merchant' });
    }

    const result = await pool.query(
      `
      INSERT INTO products (merchant_id, name, sku, price, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, merchant_id, name, sku, price, description,
                is_active, created_at, updated_at
      `,
      [merchant_id, name, sku || null, price, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creando producto:', err.message);
    res.status(500).json({ message: 'Error creando producto' });
  }
}

// GET /api/products?merchant_id=1
async function listProducts(req, res) {
  const userId = req.user.id;
  const { merchant_id } = req.query;

  if (!merchant_id) {
    return res
      .status(400)
      .json({ message: 'merchant_id es obligatorio en query' });
  }

  try {
    const allowed = await hasAccessToMerchant(merchant_id, userId);
    if (!allowed) {
      return res
        .status(403)
        .json({ message: 'No tienes acceso a este merchant' });
    }

    const result = await pool.query(
      `
      SELECT id, merchant_id, name, sku, price, description,
             is_active, created_at, updated_at
      FROM products
      WHERE merchant_id = $1
        AND is_active = true
      ORDER BY id
      `,
      [merchant_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error listando productos:', err.message);
    res.status(500).json({ message: 'Error listando productos' });
  }
}

// GET /api/products/:id
async function getProduct(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        p.id, p.merchant_id, p.name, p.sku, p.price,
        p.description, p.is_active, p.created_at, p.updated_at,
        m.owner_id
      FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      WHERE p.id = $1
        AND p.is_active = true
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    const product = result.rows[0];

    if (product.owner_id !== userId) {
      return res.status(403).json({ message: 'No tienes acceso a este producto' });
    }

    delete product.owner_id; // no lo necesitamos en la respuesta

    res.json(product);
  } catch (err) {
    console.error('Error obteniendo producto:', err.message);
    res.status(500).json({ message: 'Error obteniendo producto' });
  }
}

// PUT /api/products/:id
async function updateProduct(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const { name, sku, price, description, is_active } = req.body;

  try {
    // validar que el producto pertenece a un merchant del usuario
    const check = await pool.query(
      `
      SELECT p.id
      FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      WHERE p.id = $1
        AND m.owner_id = $2
      `,
      [id, userId]
    );

    if (check.rows.length === 0) {
      return res
        .status(403)
        .json({ message: 'No tienes acceso a este producto' });
    }

    const result = await pool.query(
      `
      UPDATE products
      SET
        name        = COALESCE($1, name),
        sku         = COALESCE($2, sku),
        price       = COALESCE($3, price),
        description = COALESCE($4, description),
        is_active   = COALESCE($5, is_active),
        updated_at  = NOW()
      WHERE id = $6
      RETURNING id, merchant_id, name, sku, price, description,
                is_active, created_at, updated_at
      `,
      [
        name || null,
        sku || null,
        price,
        description || null,
        is_active,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando producto:', err.message);
    res.status(500).json({ message: 'Error actualizando producto' });
  }
}

// DELETE /api/products/:id (soft delete)
async function deleteProduct(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const check = await pool.query(
      `
      SELECT p.id
      FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      WHERE p.id = $1
        AND m.owner_id = $2
      `,
      [id, userId]
    );

    if (check.rows.length === 0) {
      return res
        .status(403)
        .json({ message: 'No tienes acceso a este producto' });
    }

    const result = await pool.query(
      `
      UPDATE products
      SET is_active = false,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, merchant_id, name, sku, price, description,
                is_active, created_at, updated_at
      `,
      [id]
    );

    res.json({
      message: 'Producto desactivado',
      product: result.rows[0],
    });
  } catch (err) {
    console.error('Error desactivando producto:', err.message);
    res.status(500).json({ message: 'Error desactivando producto' });
  }
}

module.exports = {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
};
