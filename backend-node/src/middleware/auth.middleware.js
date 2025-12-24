// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

function authRequired(req, res, next) {
  const authHeader = req.headers['authorization'] || '';

  // Esperamos: "Bearer <token>"
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardamos los datos del usuario en la request
    req.user = decoded; // { id, email, role, iat, exp }

    return next();
  } catch (err) {
    console.error('Error verificando token:', err.message);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

// (Opcional) Middleware para roles específicos
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ message: 'No tienes permiso para esta acción' });
    }

    return next();
  };
}

module.exports = { authRequired, requireRole };
