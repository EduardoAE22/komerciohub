import { useState } from 'react';
import { login } from '../api';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('dueno@example.com');
  const [password, setPassword] = useState('secreto123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      // data = { message, user, token }
      onLogin({
        token: data.token,
        user: data.user,
        // por ahora dejamos merchant fijo en 1 (demo)
        merchantId: 1,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>
      <form
        onSubmit={handleSubmit}
        style={{ background: '#020617', padding: '2rem', borderRadius: '0.75rem', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.4)' }}
      >
        <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem', textAlign: 'center' }}>
          KomercioHub
        </h1>
        <p style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '.9rem', color: '#cbd5f5' }}>
          Inicia sesión como dueño para ver tus ventas.
        </p>

        <label style={{ display: 'block', marginBottom: '.5rem', fontSize: '.85rem' }}>
          Correo electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '.5rem .75rem',
            borderRadius: '.5rem',
            border: '1px solid #1e293b',
            marginBottom: '1rem',
            background: '#020617',
            color: 'white',
          }}
        />

        <label style={{ display: 'block', marginBottom: '.5rem', fontSize: '.85rem' }}>
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: '.5rem .75rem',
            borderRadius: '.5rem',
            border: '1px solid #1e293b',
            marginBottom: '1rem',
            background: '#020617',
            color: 'white',
          }}
        />

        {error && (
          <p style={{ color: '#f97373', fontSize: '.85rem', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '.6rem',
            borderRadius: '.5rem',
            border: 'none',
            background: '#22c55e',
            color: '#020617',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
