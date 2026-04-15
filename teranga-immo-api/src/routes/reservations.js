// src/routes/reservations.js
const router = require('express').Router();
const {
  listerReservations, mesReservations, creerReservation, changerStatut
} = require('../controllers/reservationsController');
const { authentifier, autoriser } = require('../middleware/auth');

router.get('/',                       authentifier, autoriser('admin','agent'), listerReservations);
router.get('/mes-reservations',       authentifier, mesReservations);
router.post('/',                      authentifier, creerReservation);
router.patch('/:id/statut',           authentifier, autoriser('admin','agent'), changerStatut);

module.exports = router;
