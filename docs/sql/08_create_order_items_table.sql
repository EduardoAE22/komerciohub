-- docs/sql/08_create_order_items_table.sql
-- Ítems / líneas del ticket

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,   -- precio del producto al momento del ticket
  total_price NUMERIC(10,2) NOT NULL,  -- quantity * unit_price
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
