// src/routes/autres.js
const router = require('express').Router();
const {
  creerDemande, listerDemandes, changerStatutDemande,
  mesFavoris, ajouterFavori, retirerFavori,
  posterAvis, validerAvis,
  dashboard
} = require('../controllers/autresController');
const { authentifier, autoriser } = require('../middleware/auth');

// Demandes (formulaire de contact — ouvert + admin)
router.post('/demandes',                   creerDemande);   // ouvert au public
router.get('/demandes',                    authentifier, autoriser('admin','agent'), listerDemandes);
router.patch('/demandes/:id/statut',       authentifier, autoriser('admin','agent'), changerStatutDemande);

// Favoris (client connecté)
router.get('/favoris',                     authentifier, mesFavoris);
router.post('/favoris/:id_bien',           authentifier, ajouterFavori);
router.delete('/favoris/:id_bien',         authentifier, retirerFavori);

// Avis
router.post('/avis',                       authentifier, posterAvis);
router.patch('/avis/:id/valider',          authentifier, autoriser('admin'), validerAvis);

// Dashboard admin
router.get('/admin/dashboard',             authentifier, autoriser('admin'), dashboard);

module.exports = router;
