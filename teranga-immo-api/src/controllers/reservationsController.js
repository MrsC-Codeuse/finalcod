// src/controllers/reservationsController.js
// Gestion des réservations (location courte durée & hôtel)

const db = require('../config/db');

// ── GET /api/reservations  (admin/agent) ────────────────────
const listerReservations = async (req, res) => {
  try {
    const { statut, page = 1, limite = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limite);
    const params = [];
    let where = '';

    if (statut) { where = 'WHERE r.statut = ?'; params.push(statut); }

    const [rows] = await db.query(
      `SELECT r.*,
              b.titre AS bien_titre, v.nom_ville,
              CONCAT(u.prenom, ' ', u.nom) AS client, u.email, u.telephone
       FROM reservations r
       JOIN biens b        ON r.id_bien   = b.id_bien
       JOIN villes v       ON b.id_ville  = v.id_ville
       JOIN utilisateurs u ON r.id_client = u.id_utilisateur
       ${where}
       ORDER BY r.date_creation DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limite), offset]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── GET /api/reservations/mes-reservations  (client) ────────
const mesReservations = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, b.titre AS bien_titre, v.nom_ville, p.url_photo
       FROM reservations r
       JOIN biens b         ON r.id_bien = b.id_bien
       JOIN villes v        ON b.id_ville = v.id_ville
       LEFT JOIN photos_biens p ON b.id_bien = p.id_bien AND p.principale = 1
       WHERE r.id_client = ?
       ORDER BY r.date_creation DESC`,
      [req.utilisateur.id]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── POST /api/reservations ──────────────────────────────────
const creerReservation = async (req, res) => {
  try {
    const { id_bien, date_arrivee, date_depart, nb_personnes, message_client } = req.body;

    // Vérifier disponibilité (pas de chevauchement)
    const [conflit] = await db.query(
      `SELECT id_reservation FROM reservations
       WHERE id_bien = ?
         AND statut IN ('en_attente','confirmée')
         AND date_arrivee < ?
         AND date_depart   > ?`,
      [id_bien, date_depart, date_arrivee]
    );
    if (conflit.length > 0) {
      return res.status(409).json({ message: 'Ce bien est déjà réservé sur ces dates.' });
    }

    // Calculer le prix total
    const [[bien]] = await db.query(
      'SELECT prix_location, periode_location FROM biens WHERE id_bien = ?', [id_bien]
    );
    if (!bien) return res.status(404).json({ message: 'Bien introuvable.' });

    const jours = Math.ceil(
      (new Date(date_depart) - new Date(date_arrivee)) / (1000 * 60 * 60 * 24)
    );
    let prix_total = 0;
    if (bien.periode_location === 'nuit')   prix_total = bien.prix_location * jours;
    if (bien.periode_location === 'semaine') prix_total = bien.prix_location * Math.ceil(jours / 7);
    if (bien.periode_location === 'mois')    prix_total = bien.prix_location * Math.ceil(jours / 30);

    const [resultat] = await db.query(
      `INSERT INTO reservations
         (id_bien, id_client, date_arrivee, date_depart, nb_personnes, prix_total, message_client)
       VALUES (?,?,?,?,?,?,?)`,
      [id_bien, req.utilisateur.id, date_arrivee, date_depart,
       nb_personnes || 1, prix_total, message_client || null]
    );

    return res.status(201).json({
      message: 'Réservation créée. En attente de confirmation.',
      id_reservation: resultat.insertId,
      prix_total
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── PATCH /api/reservations/:id/statut  (admin/agent) ───────
const changerStatut = async (req, res) => {
  try {
    const { statut } = req.body;
    const statutsValides = ['confirmée', 'annulée', 'terminée'];
    if (!statutsValides.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    await db.query(
      'UPDATE reservations SET statut = ? WHERE id_reservation = ?',
      [statut, req.params.id]
    );

    // Si annulée, remettre le bien disponible
    if (statut === 'annulée') {
      await db.query(
        `UPDATE biens SET statut = 'disponible'
         WHERE id_bien = (SELECT id_bien FROM reservations WHERE id_reservation = ?)`,
        [req.params.id]
      );
    }

    return res.json({ message: `Réservation passée en statut : ${statut}.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { listerReservations, mesReservations, creerReservation, changerStatut };
