// frontend-react/src/pages/DashboardPage.jsx
import { useEffect, useState } from 'react';
import {
  getDailySales,
  getTopProducts,
  getSalesRange,
} from '../api';

// helper nuevo
function formatSaleDate(dateStr) {
  if (!dateStr) return '';

  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    // por si viene ya en otro formato raro, no truena
    return dateStr;
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0'); // 0-11
  const year = d.getFullYear();

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  // 👉 formato: dd-mm-yyyy/hh:mm
  return `${day}-${month}-${year}/${hours}:${minutes}`;
}

function DashboardPage({ auth, onLogout }) {
  const { token, user, merchantId } = auth;

  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [daily, setDaily] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [rangeSales, setRangeSales] = useState([]); // 👈 últimos 7 días

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // helper para formatear YYYY-MM-DD
  const toIsoDate = (date) => date.toISOString().slice(0, 10);

  useEffect(() => {
    async function loadData() {
      try {
        setError('');
        setLoading(true);

        // fecha seleccionada (para el resumen del día)
        const dateIso = toIsoDate(selectedDate);

        // from = 6 días antes (incluyendo hoy → 7 días en total)
        const fromDate = new Date(selectedDate);
        fromDate.setDate(fromDate.getDate() - 6);
        const fromIso = toIsoDate(fromDate);

        const [dailyRes, topRes, rangeRes] = await Promise.all([
          // Resumen del día
          getDailySales(token, merchantId, dateIso),
          // Top productos solo de ese día
          getTopProducts(token, merchantId, dateIso, dateIso),
          // Ventas últimos 7 días (from → to)
          getSalesRange(token, merchantId, fromIso, dateIso),
        ]);

        setDaily(dailyRes);
        setTopProducts(topRes);
        setRangeSales(rangeRes);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [token, merchantId, selectedDate]);

  const handleDateChange = (e) => {
    const value = e.target.value; // "YYYY-MM-DD"
    if (!value) return;
    const [year, month, day] = value.split('-');
    setSelectedDate(new Date(year, month - 1, day));
  };

  const selectedDateIso = toIsoDate(selectedDate);

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#e5e7eb' }}>
      {/* HEADER */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '1rem 2rem',
          borderBottom: '1px solid #1f2937',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.3rem' }}>KomercioHub – Panel dueño</h1>
          <p style={{ margin: 0, fontSize: '.85rem', color: '#9ca3af' }}>
            {user.full_name} ({user.email})
          </p>
        </div>
        <button
          onClick={onLogout}
          style={{
            background: '#ef4444',
            border: 'none',
            color: 'white',
            padding: '.4rem .8rem',
            borderRadius: '.5rem',
            cursor: 'pointer',
            fontSize: '.85rem',
          }}
        >
          Cerrar sesión
        </button>
      </header>

      {/* CONTENIDO */}
      <main style={{ padding: '1.5rem 2rem', maxWidth: 700 }}>
        {error && (
          <p style={{ color: '#f97373', marginBottom: '1rem' }}>{error}</p>
        )}

        {/* Resumen del día + selector de fecha */}
        <section
          style={{
            background: '#0f172a',
            padding: '1rem 1.5rem',
            borderRadius: '.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '.75rem',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
              Resumen del día ({selectedDateIso})
            </h2>

            <div style={{ fontSize: '.85rem' }}>
              <label style={{ marginRight: '.5rem', color: '#9ca3af' }}>
                Fecha:
              </label>
              <input
                type="date"
                value={selectedDateIso}
                onChange={handleDateChange}
                style={{
                  background: '#020617',
                  border: '1px solid #1f2937',
                  borderRadius: '.4rem',
                  padding: '.2rem .4rem',
                  color: '#e5e7eb',
                  fontSize: '.85rem',
                }}
              />
            </div>
          </div>

          {loading && !daily && <p>Cargando datos...</p>}

          {daily && (
            <>
              <p style={{ margin: '.3rem 0' }}>
                Negocio: <strong>{daily.merchant_name}</strong>
              </p>
              <p style={{ margin: '.3rem 0' }}>
                Pedidos: <strong>{daily.total_orders}</strong>
              </p>
              <p style={{ margin: '.3rem 0' }}>
                Venta total: <strong>${daily.total_sales} MXN</strong>
              </p>
            </>
          )}
        </section>

        {/* 🆕 Ventas últimos 7 días */}
        <section
          style={{
            background: '#0f172a',
            padding: '1rem 1.5rem',
            borderRadius: '.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>
            Ventas últimos 7 días
          </h2>

          {loading && rangeSales.length === 0 && <p>Cargando datos...</p>}

          {rangeSales.length === 0 && !loading && (
            <p>No hay ventas registradas en estos días.</p>
          )}

          {rangeSales.length > 0 && (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '0.5rem',
                fontSize: '.9rem',
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      borderBottom: '1px solid #1f2937',
                      padding: '.4rem',
                    }}
                  >
                    Fecha
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      borderBottom: '1px solid #1f2937',
                      padding: '.4rem',
                    }}
                  >
                    Pedidos
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      borderBottom: '1px solid #1f2937',
                      padding: '.4rem',
                    }}
                  >
                    Venta total
                  </th>
                </tr>
              </thead>
              <tbody>
                {rangeSales.map((d) => (
                  <tr key={d.sale_date}>
                    <td
                      style={{
                        padding: '.4rem',
                        borderBottom: '1px solid #111827',
                      }}
                    >
                      {formatSaleDate(d.sale_date)}
                    </td>
                    <td
                      style={{
                        padding: '.4rem',
                        textAlign: 'right',
                        borderBottom: '1px solid #111827',
                      }}
                    >
                      {d.total_orders}
                    </td>
                    <td
                      style={{
                        padding: '.4rem',
                        textAlign: 'right',
                        borderBottom: '1px solid #111827',
                      }}
                    >
                      ${d.total_sales} MXN
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Top productos (mismo día seleccionado) */}
        <section
          style={{
            background: '#0f172a',
            padding: '1rem 1.5rem',
            borderRadius: '.75rem',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>
            Productos más vendidos ({selectedDateIso})
          </h2>

          {topProducts.length === 0 && !loading && (
            <p>No hay productos vendidos en este rango.</p>
          )}

          {topProducts.length > 0 && (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '0.5rem',
                fontSize: '.9rem',
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: 'left',
                      borderBottom: '1px solid #1f2937',
                      padding: '.4rem',
                    }}
                  >
                    Producto
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      borderBottom: '1px solid #1f2937',
                      padding: '.4rem',
                    }}
                  >
                    Cantidad
                  </th>
                  <th
                    style={{
                      textAlign: 'right',
                      borderBottom: '1px solid #1f2937',
                      padding: '.4rem',
                    }}
                  >
                    Ingresos
                  </th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.product_id}>
                    <td
                      style={{
                        padding: '.4rem',
                        borderBottom: '1px solid #111827',
                      }}
                    >
                      {p.product_name}
                    </td>
                    <td
                      style={{
                        padding: '.4rem',
                        textAlign: 'right',
                        borderBottom: '1px solid #111827',
                      }}
                    >
                      {p.total_quantity}
                    </td>
                    <td
                      style={{
                        padding: '.4rem',
                        textAlign: 'right',
                        borderBottom: '1px solid #111827',
                      }}
                    >
                      ${p.total_revenue} MXN
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

export default DashboardPage;
