// src/controllers/biensController.js
// Gestion des biens immobiliers (CRUD + recherche + filtres)

const db = require('../config/db');

// ── GET /api/biens ──────────────────────────────────────────
// Paramètres de filtrage optionnels :
//   ville, categorie, type (vente|location), prix_min, prix_max,
//   chambres, meuble, piscine, page, limite
const listerBiens = async (req, res) => {
  try {
    const {
      ville, categorie, type,
      prix_min, prix_max, chambres,
      meuble, piscine, mis_en_avant,
      page = 1, limite = 12
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limite);
    const params = [];
    const conditions = ["b.statut = 'disponible'"];

    if (ville)        { conditions.push('b.id_ville = ?');       params.push(ville); }
    if (categorie)    { conditions.push('b.id_categorie = ?');   params.push(categorie); }
    if (type === 'vente')    conditions.push('b.prix_vente IS NOT NULL');
    if (type === 'location') conditions.push('b.prix_location IS NOT NULL');
    if (prix_min)     { conditions.push('COALESCE(b.prix_vente, b.prix_location) >= ?'); params.push(prix_min); }
    if (prix_max)     { conditions.push('COALESCE(b.prix_vente, b.prix_location) <= ?'); params.push(prix_max); }
    if (chambres)     { conditions.push('b.nb_chambres >= ?');   params.push(chambres); }
    if (meuble  === '1') conditions.push('b.meuble = 1');
    if (piscine === '1') conditions.push('b.piscine = 1');
    if (mis_en_avant === '1') conditions.push('b.mis_en_avant = 1');

    const where = 'WHERE ' + conditions.join(' AND ');

    // Compter le total pour la pagination
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM biens b ${where}`, params
    );

    const [biens] = await db.query(
      `SELECT b.*, v.nom_ville, c.libelle AS categorie,
              p.url_photo AS photo_principale,
              CONCAT(u.prenom, ' ', u.nom) AS agent
       FROM biens b
       LEFT JOIN villes v      ON b.id_ville     = v.id_ville
       LEFT JOIN categories c  ON b.id_categorie = c.id_categorie
       LEFT JOIN photos_biens p ON b.id_bien      = p.id_bien AND p.principale = 1
       LEFT JOIN utilisateurs u ON b.id_agent     = u.id_utilisateur
       ${where}
       ORDER BY b.mis_en_avant DESC, b.date_ajout DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limite), offset]
    );

    return res.json({
      total,
      page: parseInt(page),
      limite: parseInt(limite),
      pages: Math.ceil(total / parseInt(limite)),
      biens
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── GET /api/biens/:id ──────────────────────────────────────
const detailBien = async (req, res) => {
  try {
    const [biens] = await db.query(
      `SELECT b.*, v.nom_ville, v.region, c.libelle AS categorie,
              CONCAT(u.prenom, ' ', u.nom) AS agent, u.telephone AS tel_agent,
              u.email AS email_agent
       FROM biens b
       LEFT JOIN villes v      ON b.id_ville     = v.id_ville
       LEFT JOIN categories c  ON b.id_categorie = c.id_categorie
       LEFT JOIN utilisateurs u ON b.id_agent    = u.id_utilisateur
       WHERE b.id_bien = ?`,
      [req.params.id]
    );

    if (biens.length === 0) return res.status(404).json({ message: 'Bien introuvable.' });

    // Photos
    const [photos] = await db.query(
      'SELECT * FROM photos_biens WHERE id_bien = ? ORDER BY principale DESC, ordre ASC',
      [req.params.id]
    );

    // Avis validés
    const [avis] = await db.query(
      `SELECT a.note, a.commentaire, a.date_avis,
              CONCAT(u.prenom, ' ', u.nom) AS client
       FROM avis a
       JOIN utilisateurs u ON a.id_client = u.id_utilisateur
       WHERE a.id_bien = ? AND a.valide = 1
       ORDER BY a.date_avis DESC`,
      [req.params.id]
    );

    const [[{ note_moyenne }]] = await db.query(
      'SELECT ROUND(AVG(note), 1) AS note_moyenne FROM avis WHERE id_bien = ? AND valide = 1',
      [req.params.id]
    );

    return res.json({ ...biens[0], photos, avis, note_moyenne });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── POST /api/biens ─────────────────────────────────────────
const creerBien = async (req, res) => {
  try {
    const {
      titre, description, id_categorie, id_ville, quartier, adresse,
      surface_m2, nb_chambres, nb_salles_bain, nb_etages,
      prix_vente, prix_location, periode_location,
      meuble, piscine, climatisation, parking, wifi, mis_en_avant
    } = req.body;

    const [resultat] = await db.query(
      `INSERT INTO biens
         (titre, description, id_categorie, id_ville, quartier, adresse,
          surface_m2, nb_chambres, nb_salles_bain, nb_etages,
          prix_vente, prix_location, periode_location,
          meuble, piscine, climatisation, parking, wifi,
          id_agent, mis_en_avant)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        titre, description, id_categorie, id_ville, quartier || null, adresse || null,
        surface_m2 || null, nb_chambres || null, nb_salles_bain || null, nb_etages || null,
        prix_vente || null, prix_location || null, periode_location || null,
        meuble ? 1 : 0, piscine ? 1 : 0, climatisation ? 1 : 0, parking ? 1 : 0, wifi ? 1 : 0,
        req.utilisateur.id,
        mis_en_avant ? 1 : 0
      ]
    );

    return res.status(201).json({
      message: 'Bien ajouté avec succès.',
      id_bien: resultat.insertId
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── PUT /api/biens/:id ──────────────────────────────────────
const modifierBien = async (req, res) => {
  try {
    const champs = [
      'titre','description','id_categorie','id_ville','quartier','adresse',
      'surface_m2','nb_chambres','nb_salles_bain','prix_vente','prix_location',
      'periode_location','statut','meuble','piscine','climatisation','parking','wifi','mis_en_avant'
    ];

    const mises_a_jour = [];
    const valeurs = [];

    champs.forEach(c => {
      if (req.body[c] !== undefined) {
        mises_a_jour.push(`${c} = ?`);
        valeurs.push(req.body[c]);
      }
    });

    if (mises_a_jour.length === 0) {
      return res.status(400).json({ message: 'Aucune donnée à mettre à jour.' });
    }

    valeurs.push(req.params.id);
    await db.query(
      `UPDATE biens SET ${mises_a_jour.join(', ')} WHERE id_bien = ?`,
      valeurs
    );

    return res.json({ message: 'Bien mis à jour avec succès.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── DELETE /api/biens/:id ───────────────────────────────────
const supprimerBien = async (req, res) => {
  try {
    await db.query('DELETE FROM biens WHERE id_bien = ?', [req.params.id]);
    return res.json({ message: 'Bien supprimé.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ── GET /api/biens/villes ───────────────────────────────────
const listerVilles = async (_req, res) => {
  const [rows] = await db.query('SELECT * FROM villes ORDER BY nom_ville');
  return res.json(rows);
};

// ── GET /api/biens/categories ───────────────────────────────
const listerCategories = async (_req, res) => {
  const [rows] = await db.query('SELECT * FROM categories ORDER BY libelle');
  return res.json(rows);
};

module.exports = {
  listerBiens, detailBien, creerBien, modifierBien, supprimerBien,
  listerVilles, listerCategories
};
