// src/controllers/authController.js
// Inscription et connexion des utilisateurs

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

// POST /api/auth/inscription
const inscription = async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, telephone, pays } = req.body;

    // Vérifier si l'email existe déjà
    const [existant] = await db.query(
      'SELECT id_utilisateur FROM utilisateurs WHERE email = ?', [email]
    );
    if (existant.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hasher le mot de passe
    const hash = await bcrypt.hash(mot_de_passe, 12);

    const [resultat] = await db.query(
      `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, pays)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nom, prenom, email, hash, telephone || null, pays || 'Sénégal']
    );

    return res.status(201).json({
      message: 'Compte créé avec succès.',
      id_utilisateur: resultat.insertId
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/auth/connexion
const connexion = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM utilisateurs WHERE email = ? AND actif = 1', [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const utilisateur = rows[0];
    const valide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
    if (!valide) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: utilisateur.id_utilisateur, email: utilisateur.email, role: utilisateur.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { mot_de_passe: _, ...profil } = utilisateur;

    return res.json({ message: 'Connexion réussie.', token, utilisateur: profil });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/auth/profil
const profil = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id_utilisateur, nom, prenom, email, telephone, pays, role, date_inscription
       FROM utilisateurs WHERE id_utilisateur = ?`,
      [req.utilisateur.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { inscription, connexion, profil };
