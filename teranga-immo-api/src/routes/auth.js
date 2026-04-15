// src/routes/auth.js
const router = require('express').Router();
const { inscription, connexion, profil } = require('../controllers/authController');
const { authentifier } = require('../middleware/auth');

router.post('/inscription', inscription);
router.post('/connexion',   connexion);
router.get('/profil',       authentifier, profil);

module.exports = router;
