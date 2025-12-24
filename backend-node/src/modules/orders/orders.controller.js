// src/modules/orders/orders.controller.js
const { pool } = require('../../config/db');

/**
 * Verifica que el merchant pertenezca al usuario logueado
 */
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

/**
 * POST /api/orders
 * Crea un ticket con sus items
 */
async function createOrder(req, res) {
  const userId = req.user.id;
  const { merchant_id, branch_id, customer_id, items, notes } = req.body;

  if (!merchant_id) {
    return res.status(400).json({ message: 'merchant_id es obligatorio' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items es obligatorio y debe tener al menos 1 producto' });
  }

  const client = await pool.connect();

  try {
    // 1) Verificar que el merchant sea del usuario
    const allowed = await hasAccessToMerchant(merchant_id, userId);
    if (!allowed) {
      client.release();
      return res.status(403).json({ message: 'No tienes acceso a este merchant' });
    }

    await client.query('BEGIN');

    // 2) Validar sucursal (si la mandan)
    if (branch_id) {
      const branchResult = await client.query(
        `
        SELECT id
        FROM branches
        WHERE id = $1
          AND merchant_id = $2
          AND is_active = true
        `,
        [branch_id, merchant_id]
      );

      if (branchResult.rows.length === 0) {
        throw new Error('Sucursal no válida para este merchant');
      }
    }

    // 3) Validar cliente (si lo mandan)
    if (customer_id) {
      const customerResult = await client.query(
        `
        SELECT id
        FROM customers
        WHERE id = $1
          AND merchant_id = $2
          AND is_active = true
        `,
        [customer_id, merchant_id]
      );

      if (customerResult.rows.length === 0) {
        throw new Error('Cliente no válido para este merchant');
      }
    }

    // 4) Validar productos y obtener precios
    const productIds = items.map((i) => i.product_id);

    const productsResult = await client.query(
      `
      SELECT id, price
      FROM products
      WHERE id = ANY($1::int[])
        AND merchant_id = $2
        AND is_active = true
      `,
      [productIds, merchant_id]
    );

    if (productsResult.rows.length !== productIds.length) {
      throw new Error('Algún producto no existe, no es activo o no pertenece a este merchant');
    }

    const productMap = {};
    for (const p of productsResult.rows) {
      productMap[p.id] = p;
    }

    // 5) Calcular total y preparar items
    let totalAmount = 0;
    const orderItemsData = items.map((item) => {
      const product = productMap[item.product_id];
      if (!product) {
        throw new Error(`Producto inválido: ${item.product_id}`);
      }

      const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const unitPrice = parseFloat(product.price);
      const totalPrice = unitPrice * quantity;

      totalAmount += totalPrice;

      return {
        product_id: item.product_id,
        quantity,
        unitPrice,
        totalPrice,
      };
    });

    // 6) Insertar orden
    const orderResult = await client.query(
      `
      INSERT INTO orders (
        merchant_id,
        branch_id,
        customer_id,
        created_by,
        total_amount,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, merchant_id, branch_id, customer_id,
                created_by, total_amount, status, notes,
                is_active, created_at, updated_at
      `,
      [
        merchant_id,
        branch_id || null,
        customer_id || null,
        userId,
        totalAmount,
        notes || null,
      ]
    );

    const order = orderResult.rows[0];

    // 7) Insertar items
    for (const item of orderItemsData) {
      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          quantity,
          unit_price,
          total_price
        )
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          order.id,
          item.product_id,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
        ]
      );
    }

    // 8) Leer items desde la BD para regresarlos con id y created_at
    const itemsResult = await client.query(
      `
      SELECT
        oi.id,
        oi.product_id,
        p.name AS product_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.created_at
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.id
      `,
      [order.id]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Orden creada',
      order,
      items: itemsResult.rows,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creando orden:', err.message);
    return res.status(500).json({ message: 'Error creando orden' });
  } finally {
    client.release();
  }
}

/**
 * GET /api/orders?merchant_id=1&branch_id=1
 * Lista órdenes de un merchant (y opcionalmente de una sucursal)
 */
async function listOrders(req, res) {
  const userId = req.user.id;
  const { merchant_id, branch_id } = req.query;

  if (!merchant_id) {
    return res.status(400).json({ message: 'merchant_id es obligatorio' });
  }

  try {
    const allowed = await hasAccessToMerchant(merchant_id, userId);
    if (!allowed) {
      return res
        .status(403)
        .json({ message: 'No tienes acceso a este merchant' });
    }

    const params = [merchant_id];
    let query = `
      SELECT
        o.id,
        o.merchant_id,
        o.branch_id,
        o.customer_id,
        o.created_by,
        o.total_amount,
        o.status,
        o.notes,
        o.is_active,
        o.created_at,
        o.updated_at
      FROM orders o
      WHERE o.merchant_id = $1
    `;

    if (branch_id) {
      query += ' AND o.branch_id = $2';
      params.push(branch_id);
    }

    query += ' ORDER BY o.id DESC';

    const result = await pool.query(query, params);

    return res.json(result.rows);
  } catch (err) {
    console.error('Error listando órdenes:', err.message);
    return res.status(500).json({ message: 'Error listando órdenes' });
  }
}

/**
 * GET /api/orders/:id
 * Detalle de una orden + items
 */
async function getOrder(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const orderResult = await pool.query(
      `
      SELECT
        o.id,
        o.merchant_id,
        o.branch_id,
        o.customer_id,
        o.created_by,
        o.total_amount,
        o.status,
        o.notes,
        o.is_active,
        o.created_at,
        o.updated_at,
        m.owner_id
      FROM orders o
      JOIN merchants m ON o.merchant_id = m.id
      WHERE o.id = $1
      `,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    const orderRow = orderResult.rows[0];

    if (orderRow.owner_id !== userId) {
      return res
        .status(403)
        .json({ message: 'No tienes acceso a esta orden' });
    }

    const { owner_id, ...order } = orderRow;

    const itemsResult = await pool.query(
      `
      SELECT
        oi.id,
        oi.product_id,
        p.name AS product_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.created_at
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.id
      `,
      [id]
    );

    return res.json({
      order,
      items: itemsResult.rows,
    });
  } catch (err) {
    console.error('Error obteniendo orden:', err.message);
    return res.status(500).json({ message: 'Error obteniendo orden' });
  }
}

/**
 * PATCH /api/orders/:id/pay
 * Marca una orden como pagada
 */
async function payOrder(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    // 1) Traer la orden + owner del merchant
    const orderResult = await pool.query(
      `
      SELECT
        o.id,
        o.merchant_id,
        o.status,
        m.owner_id
      FROM orders o
      JOIN merchants m ON o.merchant_id = m.id
      WHERE o.id = $1
      `,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    const orderRow = orderResult.rows[0];

    // 2) Verificar que la orden sea del dueño logueado
    if (orderRow.owner_id !== userId) {
      return res.status(403).json({ message: 'No tienes acceso a esta orden' });
    }

    // 3) Si ya está pagada, regresamos tal cual
    if (orderRow.status === 'paid') {
      return res.status(200).json({ message: 'La orden ya está pagada' });
    }

    // 4) Actualizar a paid
    const updateResult = await pool.query(
      `
      UPDATE orders
      SET status = 'paid',
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, merchant_id, branch_id, customer_id,
                created_by, total_amount, status, notes,
                is_active, created_at, updated_at
      `,
      [id]
    );

    const updatedOrder = updateResult.rows[0];

    return res.json({
      message: 'Orden marcada como pagada',
      order: updatedOrder,
    });
  } catch (err) {
    console.error('Error marcando orden como pagada:', err.message);
    return res.status(500).json({ message: 'Error marcando orden como pagada' });
  }
}



module.exports = {
  createOrder,
  listOrders,
  getOrder,
  payOrder,
};
