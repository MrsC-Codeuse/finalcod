/**
 * setup.js — Crée le compte administrateur Teranga Immo
 * Usage : node setup.js
 *
 * Prérequis : base de données déjà importée (database.sql)
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db     = require('./src/config/db');

const ADMIN = {
  nom:    'Admin',
  prenom: 'Teranga',
  email:  'admin@teranga-immo.sn',
  mdp:    'Admin2024!',        // ← changez ce mot de passe
  tel:    '+221 77 000 00 00'
};

(async () => {
  try {
    const hash = await bcrypt.hash(ADMIN.mdp, 10);

    await db.query(
      `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, role)
       VALUES (?, ?, ?, ?, ?, 'admin')
       ON DUPLICATE KEY UPDATE mot_de_passe = VALUES(mot_de_passe)`,
      [ADMIN.nom, ADMIN.prenom, ADMIN.email, hash, ADMIN.tel]
    );

    console.log('✅  Compte admin créé / mis à jour avec succès.');
    console.log(`    Email    : ${ADMIN.email}`);
    console.log(`    Password : ${ADMIN.mdp}`);
    console.log('\n⚠️   Changez le mot de passe après la première connexion !');
    process.exit(0);
  } catch (err) {
    console.error('❌  Erreur :', err.message);
    process.exit(1);
  }
})();
