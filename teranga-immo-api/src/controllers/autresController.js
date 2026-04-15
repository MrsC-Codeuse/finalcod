// src/controllers/autresController.js
// Demandes de contact, favoris, avis

const db = require('../config/db');

// ════════════════════════════════════════════════════════════
//  DEMANDES DE CONTACT / VISITES
// ════════════════════════════════════════════════════════════

// POST /api/demandes
const creerDemande = async (req, res) => {
  try {
    const { id_bien, nom_contact, email_contact, tel_contact,
            message, type_demande, date_prefere } = req.body;

    const id_client = req.utilisateur ? req.utilisateur.id : null;

    const [resultat] = await db.query(
      `INSERT INTO demandes
         (id_bien, id_client, nom_contact, email_contact, tel_contact,
          message, type_demande, date_prefere)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id_bien, id_client, nom_contact || null, email_contact || null,
       tel_contact || null, message, type_demande || 'renseignement', date_prefere || null]
    );

    return res.status(201).json({
      message: 'Votre demande a bien été envoyée. Nous vous contacterons sous 24h.',
      id_demande: resultat.insertId
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// GET /api/demandes  (admin/agent)
const listerDemandes = async (req, res) => {
  try {
    const { statut } = req.query;
    const params = [];
    let where = '';
    if (statut) { where = 'WHERE d.statut = ?'; params.push(statut); }

    const [rows] = await db.query(
      `SELECT d.*, b.titre AS bien_titre
       FROM demandes d
       JOIN biens b ON d.id_bien = b.id_bien
       ${where}
       ORDER BY d.date_creation DESC`,
      params
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PATCH /api/demandes/:id/statut  (admin/agent)
const changerStatutDemande = async (req, res) => {
  try {
    const { statut } = req.body;
    await db.query('UPDATE demandes SET statut = ? WHERE id_demande = ?',
      [statut, req.params.id]);
    return res.json({ message: 'Demande mise à jour.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ════════════════════════════════════════════════════════════
//  FAVORIS
// ════════════════════════════════════════════════════════════

// GET /api/favoris  (client connecté)
const mesFavoris = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.id_bien, b.titre, b.prix_vente, b.prix_location, b.statut,
              v.nom_ville, c.libelle AS categorie, p.url_photo
       FROM favoris f
       JOIN biens b         ON f.id_bien    = b.id_bien
       JOIN villes v        ON b.id_ville   = v.id_ville
       JOIN categories c    ON b.id_categorie = c.id_categorie
       LEFT JOIN photos_biens p ON b.id_bien = p.id_bien AND p.principale = 1
       WHERE f.id_utilisateur = ?
       ORDER BY f.date_ajout DESC`,
      [req.utilisateur.id]
    );
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// POST /api/favoris/:id_bien
const ajouterFavori = async (req, res) => {
  try {
    await db.query(
      'INSERT IGNORE INTO favoris (id_utilisateur, id_bien) VALUES (?,?)',
      [req.utilisateur.id, req.params.id_bien]
    );
    return res.status(201).json({ message: 'Bien ajouté aux favoris.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// DELETE /api/favoris/:id_bien
const retirerFavori = async (req, res) => {
  try {
    await db.query(
      'DELETE FROM favoris WHERE id_utilisateur = ? AND id_bien = ?',
      [req.utilisateur.id, req.params.id_bien]
    );
    return res.json({ message: 'Bien retiré des favoris.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ════════════════════════════════════════════════════════════
//  AVIS
// ════════════════════════════════════════════════════════════

// POST /api/avis
const posterAvis = async (req, res) => {
  try {
    const { id_bien, note, commentaire } = req.body;
    if (note < 1 || note > 5) {
      return res.status(400).json({ message: 'La note doit être entre 1 et 5.' });
    }

    // Vérifier que le client a déjà séjourné dans ce bien
    const [resa] = await db.query(
      `SELECT id_reservation FROM reservations
       WHERE id_bien = ? AND id_client = ? AND statut = 'terminée'`,
      [id_bien, req.utilisateur.id]
    );
    if (resa.length === 0) {
      return res.status(403).json({
        message: 'Vous ne pouvez laisser un avis qu\'après un séjour terminé.'
      });
    }

    await db.query(
      'INSERT INTO avis (id_bien, id_client, note, commentaire) VALUES (?,?,?,?)',
      [id_bien, req.utilisateur.id, note, commentaire || null]
    );

    return res.status(201).json({
      message: 'Avis soumis. Il sera publié après modération.'
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// PATCH /api/avis/:id/valider  (admin)
const validerAvis = async (req, res) => {
  try {
    await db.query('UPDATE avis SET valide = 1 WHERE id_avis = ?', [req.params.id]);
    return res.json({ message: 'Avis validé et publié.' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ════════════════════════════════════════════════════════════
//  TABLEAU DE BORD ADMIN
// ════════════════════════════════════════════════════════════

// GET /api/admin/dashboard
const dashboard = async (req, res) => {
  try {
    const [[{ total_biens }]]         = await db.query('SELECT COUNT(*) AS total_biens FROM biens');
    const [[{ biens_disponibles }]]   = await db.query("SELECT COUNT(*) AS biens_disponibles FROM biens WHERE statut = 'disponible'");
    const [[{ total_clients }]]       = await db.query("SELECT COUNT(*) AS total_clients FROM utilisateurs WHERE role = 'client'");
    const [[{ reservations_attente }]] = await db.query("SELECT COUNT(*) AS reservations_attente FROM reservations WHERE statut = 'en_attente'");
    const [[{ demandes_nouvelles }]]  = await db.query("SELECT COUNT(*) AS demandes_nouvelles FROM demandes WHERE statut = 'nouvelle'");
    const [[{ avis_a_valider }]]      = await db.query('SELECT COUNT(*) AS avis_a_valider FROM avis WHERE valide = 0');

    return res.json({
      total_biens,
      biens_disponibles,
      total_clients,
      reservations_attente,
      demandes_nouvelles,
      avis_a_valider
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  creerDemande, listerDemandes, changerStatutDemande,
  mesFavoris, ajouterFavori, retirerFavori,
  posterAvis, validerAvis,
  dashboard
};
