# 🏠 Teranga Immo — API REST Node.js

API backend pour la plateforme immobilière Teranga Immo (Dakar, Saly, Mbour).

---

## ⚙️ Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditez .env avec vos paramètres XAMPP/MySQL

# 3. Démarrer (développement)
npm run dev

# 4. Démarrer (production)
npm start
```

---

## 📋 Prérequis

- Node.js v18+
- XAMPP avec MySQL démarré
- Base de données `teranga_immo` importée via phpMyAdmin

---

## 🔗 Endpoints

### 🔐 Authentification — `/api/auth`

| Méthode | URL | Description | Auth |
|---------|-----|-------------|------|
| POST | `/api/auth/inscription` | Créer un compte | ❌ |
| POST | `/api/auth/connexion` | Se connecter (retourne le token JWT) | ❌ |
| GET | `/api/auth/profil` | Voir son profil | ✅ |

**Exemple inscription :**
```json
POST /api/auth/inscription
{
  "nom": "Diallo",
  "prenom": "Fatou",
  "email": "fatou@example.com",
  "mot_de_passe": "motdepasse123",
  "telephone": "+221 77 000 00 00",
  "pays": "Sénégal"
}
```

**Exemple connexion :**
```json
POST /api/auth/connexion
{
  "email": "fatou@example.com",
  "mot_de_passe": "motdepasse123"
}
```
→ Retourne un `token` JWT à inclure dans les requêtes suivantes :
`Authorization: Bearer <token>`

---

### 🏡 Biens immobiliers — `/api/biens`

| Méthode | URL | Description | Auth |
|---------|-----|-------------|------|
| GET | `/api/biens` | Liste avec filtres | ❌ |
| GET | `/api/biens/:id` | Détail d'un bien | ❌ |
| GET | `/api/biens/villes` | Liste des villes | ❌ |
| GET | `/api/biens/categories` | Liste des catégories | ❌ |
| POST | `/api/biens` | Ajouter un bien | ✅ agent/admin |
| PUT | `/api/biens/:id` | Modifier un bien | ✅ agent/admin |
| DELETE | `/api/biens/:id` | Supprimer un bien | ✅ admin |

**Filtres disponibles (GET /api/biens) :**
```
?ville=1&categorie=2&type=location&prix_min=50000&prix_max=500000
&chambres=2&meuble=1&piscine=1&page=1&limite=12
```

---

### 📅 Réservations — `/api/reservations`

| Méthode | URL | Description | Auth |
|---------|-----|-------------|------|
| GET | `/api/reservations` | Toutes les réservations | ✅ admin/agent |
| GET | `/api/reservations/mes-reservations` | Mes réservations | ✅ client |
| POST | `/api/reservations` | Créer une réservation | ✅ client |
| PATCH | `/api/reservations/:id/statut` | Confirmer/annuler | ✅ admin/agent |

**Exemple réservation :**
```json
POST /api/reservations
{
  "id_bien": 5,
  "date_arrivee": "2024-08-01",
  "date_depart": "2024-08-07",
  "nb_personnes": 2,
  "message_client": "Nous arriverons vers 15h."
}
```

---

### 📬 Demandes de contact — `/api/demandes`

| Méthode | URL | Description | Auth |
|---------|-----|-------------|------|
| POST | `/api/demandes` | Envoyer une demande | ❌ |
| GET | `/api/demandes` | Voir toutes les demandes | ✅ admin/agent |
| PATCH | `/api/demandes/:id/statut` | Marquer traitée/fermée | ✅ admin/agent |

---

### ❤️ Favoris — `/api/favoris`

| Méthode | URL | Auth |
|---------|-----|------|
| GET | `/api/favoris` | ✅ client |
| POST | `/api/favoris/:id_bien` | ✅ client |
| DELETE | `/api/favoris/:id_bien` | ✅ client |

---

### ⭐ Avis — `/api/avis`

| Méthode | URL | Description | Auth |
|---------|-----|-------------|------|
| POST | `/api/avis` | Poster un avis | ✅ client |
| PATCH | `/api/avis/:id/valider` | Valider (publier) | ✅ admin |

---

### 📊 Dashboard admin — `/api/admin/dashboard`

| Méthode | URL | Auth |
|---------|-----|------|
| GET | `/api/admin/dashboard` | ✅ admin |

Retourne : total biens, biens disponibles, total clients, réservations en attente, demandes nouvelles, avis à valider.

---

## 🔑 Rôles utilisateurs

| Rôle | Droits |
|------|--------|
| `client` | Réserver, gérer favoris, poster avis |
| `agent` | + Ajouter/modifier biens, gérer réservations et demandes |
| `admin` | Accès complet |

---

## 📁 Structure du projet

```
teranga-immo-api/
├── src/
│   ├── server.js              # Point d'entrée
│   ├── config/
│   │   └── db.js              # Connexion MySQL
│   ├── middleware/
│   │   └── auth.js            # JWT + contrôle des rôles
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── biensController.js
│   │   ├── reservationsController.js
│   │   └── autresController.js
│   └── routes/
│       ├── auth.js
│       ├── biens.js
│       ├── reservations.js
│       └── autres.js
├── uploads/                   # Photos uploadées
├── .env.example
└── package.json
```
