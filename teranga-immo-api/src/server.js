// src/server.js
// Point d'entrée de l'API Teranga Immo

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── Middleware globaux ──────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dossier statique pour les photos uploadées
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/biens',        require('./routes/biens'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api',              require('./routes/autres'));

// ── Route d'accueil ────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    message: '🏠 Bienvenue sur l\'API Teranga Immo',
    version: '1.0.0',
    endpoints: {
      auth:         '/api/auth',
      biens:        '/api/biens',
      reservations: '/api/reservations',
      demandes:     '/api/demandes',
      favoris:      '/api/favoris',
      avis:         '/api/avis',
      admin:        '/api/admin/dashboard'
    }
  });
});

// ── Gestion des routes inconnues ────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: 'Route introuvable.' });
});

// ── Démarrage ───────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀  Serveur Teranga Immo démarré sur http://localhost:${PORT}`);
});
