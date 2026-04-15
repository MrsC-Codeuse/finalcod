// src/routes/biens.js
const router = require('express').Router();
const {
  listerBiens, detailBien, creerBien, modifierBien, supprimerBien,
  listerVilles, listerCategories
} = require('../controllers/biensController');
const { authentifier, autoriser } = require('../middleware/auth');

// Routes publiques
router.get('/',           listerBiens);
router.get('/villes',     listerVilles);
router.get('/categories', listerCategories);
router.get('/:id',        detailBien);

// Routes protégées (agent ou admin)
router.post('/',       authentifier, autoriser('agent','admin'), creerBien);
router.put('/:id',     authentifier, autoriser('agent','admin'), modifierBien);
router.delete('/:id',  authentifier, autoriser('admin'),         supprimerBien);

module.exports = router;
