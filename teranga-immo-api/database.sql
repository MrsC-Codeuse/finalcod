-- ============================================================
--  TERANGA IMMO — Schéma de base de données
--  MySQL 5.7+ / MariaDB 10.3+
--  Lancer : mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS teranga_immo
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE teranga_immo;

-- ------------------------------------------------------------
--  VILLES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS villes (
  id_ville   INT AUTO_INCREMENT PRIMARY KEY,
  nom_ville  VARCHAR(100) NOT NULL,
  region     VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO villes (nom_ville, region) VALUES
  ('Dakar',          'Dakar'),
  ('Saly Portudal',  'Thiès'),
  ('Mbour',          'Thiès'),
  ('Thiès',          'Thiès'),
  ('Saint-Louis',    'Saint-Louis'),
  ('Ziguinchor',     'Ziguinchor');

-- ------------------------------------------------------------
--  CATÉGORIES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id_categorie  INT AUTO_INCREMENT PRIMARY KEY,
  libelle       VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO categories (libelle) VALUES
  ('Appartement meublé'),
  ('Appartement non meublé'),
  ('Villa'),
  ('Studio'),
  ('Résidence'),
  ('Terrain'),
  ('Bureau');

-- ------------------------------------------------------------
--  UTILISATEURS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utilisateurs (
  id_utilisateur  INT AUTO_INCREMENT PRIMARY KEY,
  nom             VARCHAR(100) NOT NULL,
  prenom          VARCHAR(100) NOT NULL,
  email           VARCHAR(191) NOT NULL UNIQUE,
  mot_de_passe    VARCHAR(255) NOT NULL,
  telephone       VARCHAR(30),
  role            ENUM('client','agent','admin') NOT NULL DEFAULT 'client',
  date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Compte admin par défaut
-- Mot de passe : Admin2024! (hash bcrypt)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, role) VALUES
  ('Admin', 'Teranga', 'admin@teranga-immo.sn',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   '+221 77 000 00 00', 'admin');

-- ⚠️  Le hash ci-dessus correspond au mot de passe "password".
--     Changez-le IMMÉDIATEMENT en production via le script setup.js

-- ------------------------------------------------------------
--  BIENS IMMOBILIERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS biens (
  id_bien          INT AUTO_INCREMENT PRIMARY KEY,
  titre            VARCHAR(255) NOT NULL,
  description      TEXT,
  id_categorie     INT,
  id_ville         INT,
  quartier         VARCHAR(150),
  adresse          VARCHAR(255),
  surface_m2       DECIMAL(8,2),
  nb_chambres      TINYINT UNSIGNED,
  nb_salles_bain   TINYINT UNSIGNED,
  nb_etages        TINYINT UNSIGNED,
  prix_vente       DECIMAL(14,2),
  prix_location    DECIMAL(12,2),
  periode_location ENUM('nuit','semaine','mois'),
  meuble           TINYINT(1) DEFAULT 0,
  piscine          TINYINT(1) DEFAULT 0,
  climatisation    TINYINT(1) DEFAULT 0,
  parking          TINYINT(1) DEFAULT 0,
  wifi             TINYINT(1) DEFAULT 0,
  vue_mer          TINYINT(1) DEFAULT 0,
  securise         TINYINT(1) DEFAULT 0,
  id_agent         INT,
  mis_en_avant     TINYINT(1) DEFAULT 0,
  statut           ENUM('disponible','loué','vendu','indisponible') DEFAULT 'disponible',
  date_ajout       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_categorie) REFERENCES categories(id_categorie) ON DELETE SET NULL,
  FOREIGN KEY (id_ville)     REFERENCES villes(id_ville)         ON DELETE SET NULL,
  FOREIGN KEY (id_agent)     REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Données de démo
INSERT INTO biens
  (titre, description, id_categorie, id_ville, quartier,
   surface_m2, nb_chambres, nb_salles_bain,
   prix_location, periode_location,
   meuble, piscine, climatisation, parking, wifi, vue_mer, securise,
   id_agent, mis_en_avant, statut)
VALUES
  ('Appartement vue sur mer — Saly Portudal',
   'Magnifique appartement avec vue imprenable sur l\'océan Atlantique, idéal pour des vacances de rêve.',
   1, 2, 'Saly Nord',
   65, 2, 1,
   75000, 'nuit',
   1, 0, 1, 1, 1, 1, 1,
   1, 1, 'disponible'),

  ('Villa avec piscine — Saly Portudal',
   'Superbe villa de standing avec piscine privée, jardin tropical et personnel de maison inclus.',
   3, 2, 'Saly Centre',
   220, 4, 3,
   150000, 'nuit',
   1, 1, 1, 1, 1, 0, 1,
   1, 1, 'disponible'),

  ('Appartement vue piscine — Mbour',
   'Appartement moderne dans une résidence sécurisée avec vue sur la piscine commune.',
   1, 3, 'Centre-ville',
   55, 2, 1,
   45000, 'nuit',
   1, 1, 1, 0, 1, 0, 1,
   1, 0, 'disponible'),

  ('Résidence meublée — Dakar',
   'Studio entièrement équipé dans le quartier des Almadies, proche plage et commodités.',
   5, 1, 'Almadies',
   40, 1, 1,
   600000, 'mois',
   1, 0, 1, 0, 1, 0, 1,
   1, 1, 'disponible'),

  ('Villa à vendre — Dakar',
   'Belle villa R+1 en vente à Mermoz, grand terrain, idéale pour famille ou investissement locatif.',
   3, 1, 'Mermoz',
   180, 5, 3,
   NULL, NULL,
   0, 0, 0, 1, 0, 0, 1,
   1, 1, 'disponible'),

  ('Appartement non meublé — Dakar',
   'Grand appartement vide de 3 pièces dans un immeuble neuf à Fann Résidence.',
   2, 1, 'Fann Résidence',
   80, 2, 1,
   350000, 'mois',
   0, 0, 1, 1, 0, 0, 1,
   1, 0, 'disponible');

-- Mettre à jour le prix_vente de la villa
UPDATE biens SET prix_vente = 85000000 WHERE titre LIKE 'Villa à vendre%';

-- ------------------------------------------------------------
--  PHOTOS DES BIENS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS photos_biens (
  id_photo   INT AUTO_INCREMENT PRIMARY KEY,
  id_bien    INT NOT NULL,
  url_photo  VARCHAR(500) NOT NULL,
  principale TINYINT(1) DEFAULT 0,
  ordre      TINYINT UNSIGNED DEFAULT 0,
  FOREIGN KEY (id_bien) REFERENCES biens(id_bien) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Photos de démo (images locales du dossier front/)
INSERT INTO photos_biens (id_bien, url_photo, principale, ordre) VALUES
  (1, 'appartmentviemer.png',    1, 0),
  (2, 'villapiscinesaly.png',    1, 0),
  (3, 'appartpiscine.png',       1, 0),
  (4, 'residencemeublee.png',    1, 0),
  (5, 'villadakar.png',          1, 0),
  (6, 'appartnonmeuble.png',     1, 0);

-- ------------------------------------------------------------
--  RÉSERVATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservations (
  id_reservation  INT AUTO_INCREMENT PRIMARY KEY,
  id_bien         INT NOT NULL,
  id_client       INT NOT NULL,
  date_arrivee    DATE NOT NULL,
  date_depart     DATE NOT NULL,
  nb_personnes    TINYINT UNSIGNED DEFAULT 1,
  prix_total      DECIMAL(14,2),
  message_client  TEXT,
  statut          ENUM('en_attente','confirmée','annulée','terminée') DEFAULT 'en_attente',
  date_creation   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_bien)   REFERENCES biens(id_bien)           ON DELETE CASCADE,
  FOREIGN KEY (id_client) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
--  DEMANDES DE CONTACT / VISITES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS demandes (
  id_demande     INT AUTO_INCREMENT PRIMARY KEY,
  id_bien        INT,
  id_client      INT,
  nom_contact    VARCHAR(150),
  email_contact  VARCHAR(191),
  tel_contact    VARCHAR(30),
  message        TEXT,
  type_demande   ENUM('visite','location','offre_achat','renseignement') DEFAULT 'renseignement',
  date_prefere   DATE,
  statut         ENUM('nouvelle','traitée','fermée') DEFAULT 'nouvelle',
  date_creation  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_bien)   REFERENCES biens(id_bien)           ON DELETE SET NULL,
  FOREIGN KEY (id_client) REFERENCES utilisateurs(id_utilisateur) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
--  FAVORIS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favoris (
  id_favori      INT AUTO_INCREMENT PRIMARY KEY,
  id_utilisateur INT NOT NULL,
  id_bien        INT NOT NULL,
  date_ajout     DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_favori (id_utilisateur, id_bien),
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
  FOREIGN KEY (id_bien)        REFERENCES biens(id_bien)               ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
--  AVIS / ÉVALUATIONS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS avis (
  id_avis      INT AUTO_INCREMENT PRIMARY KEY,
  id_bien      INT NOT NULL,
  id_client    INT NOT NULL,
  note         TINYINT NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire  TEXT,
  date_avis    DATETIME DEFAULT CURRENT_TIMESTAMP,
  valide       TINYINT(1) DEFAULT 0,
  FOREIGN KEY (id_bien)   REFERENCES biens(id_bien)           ON DELETE CASCADE,
  FOREIGN KEY (id_client) REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  FIN DU SCHÉMA
-- ============================================================
