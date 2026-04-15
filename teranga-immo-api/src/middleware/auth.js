// src/middleware/auth.js
// Vérification du token JWT + contrôle des rôles

const jwt = require('jsonwebtoken');

// Vérifie que l'utilisateur est connecté
const authentifier = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant. Veuillez vous connecter.' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.utilisateur = payload; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré.' });
  }
};

// Restreint l'accès à certains rôles
const autoriser = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.utilisateur.role)) {
      return res.status(403).json({
        message: `Accès refusé. Rôle requis : ${roles.join(' ou ')}.`
      });
    }
    next();
  };
};

module.exports = { authentifier, autoriser };
