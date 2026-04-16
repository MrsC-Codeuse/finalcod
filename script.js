// ============================================================
//  TERANGA IMMO — script.js
//  Connexion au backend Node.js via fetch()
// ============================================================

const API = 'http://localhost:3000/api';
let typeRecherche = 'location';
let tokenJWT = localStorage.getItem('teranga_token') || null;

// ════════════════════════════════════════════════════════════
//  UTILITAIRES
// ════════════════════════════════════════════════════════════

function afficherToast(message, duree = 3000) {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duree);
}

function scrollVers(cible) {
  document.querySelector(cible)?.scrollIntoView({ behavior: 'smooth' });
}

function headersAuth() {
  const h = { 'Content-Type': 'application/json' };
  if (tokenJWT) h['Authorization'] = 'Bearer ' + tokenJWT;
  return h;
}

// ════════════════════════════════════════════════════════════
//  TAGS RAPIDES HERO
// ════════════════════════════════════════════════════════════

function activerFiltre(type) {
  scrollVers('#recherche');
  const map = {
    'meuble':   'filtre-meuble',
    'vue-mer':  'filtre-vue-mer',
    'piscine':  'filtre-piscine',
    'securise':   'filtre-securise',
    'non-meuble': 'filtre-non-meuble'
  };
  const id = map[type];
  if (id) {
    const el = document.getElementById(id);
    if (el) el.checked = true;
  }
}

function filtrerZone(idVille, nomVille) {
  const sel = document.getElementById('filtre-ville');
  if (sel) sel.value = String(idVille);
  scrollVers('#recherche');
  afficherToast(`Zone "${nomVille}" sélectionnée`);
}

// ════════════════════════════════════════════════════════════
//  NAVBAR — scroll + burger
// ════════════════════════════════════════════════════════════

window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

function fermerMenu() {
  const links  = document.querySelector('.nav-links');
  const burger = document.getElementById('burger');
  links?.querySelector('.mobile-nav-actions')?.remove();
  links?.classList.remove('open');
  burger?.classList.remove('open');
  document.body.classList.remove('menu-ouvert');
}

function toggleMenu() {
  const burger  = document.getElementById('burger');
  const links   = document.querySelector('.nav-links');
  const actions = document.querySelector('.nav-actions');

  if (links?.classList.contains('open')) {
    fermerMenu();
    return;
  }

  // Injecter les boutons Connexion / S'inscrire en bas du drawer
  if (links && actions && !links.querySelector('.mobile-nav-actions')) {
    const li = document.createElement('li');
    li.className = 'mobile-nav-actions';
    li.innerHTML = actions.innerHTML;
    links.appendChild(li);
  }

  links?.classList.add('open');
  burger?.classList.add('open');
  document.body.classList.add('menu-ouvert');
}

// Fermer au clic sur un lien de navigation
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', fermerMenu);
});

// Fermer en cliquant sur le fond sombre (hors du drawer)
document.addEventListener('click', e => {
  if (!document.body.classList.contains('menu-ouvert')) return;
  const drawer = document.querySelector('.nav-links.open');
  const burger = document.getElementById('burger');
  if (drawer && !drawer.contains(e.target) && !burger?.contains(e.target)) {
    fermerMenu();
  }
});

// ════════════════════════════════════════════════════════════
//  COMPTEUR ANIMÉ (hero stats)
// ════════════════════════════════════════════════════════════

function animerCompteurs() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const cible = parseInt(el.dataset.target);
    const duree = 2000;
    const pas = cible / (duree / 16);
    let compteur = 0;
    const timer = setInterval(() => {
      compteur += pas;
      if (compteur >= cible) { compteur = cible; clearInterval(timer); }
      el.textContent = Math.floor(compteur).toLocaleString('fr-FR');
    }, 16);
  });
}

window.addEventListener('load', () => {
  setTimeout(animerCompteurs, 600);
});

// ════════════════════════════════════════════════════════════
//  MODALS
// ════════════════════════════════════════════════════════════

function ouvrirModal(id) {
  fermerMenu();
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function fermerModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

function fermerModalOverlay(event, id) {
  if (event.target === document.getElementById(id)) fermerModal(id);
}

function switchModal(fermer, ouvrir) {
  fermerModal(fermer);
  setTimeout(() => ouvrirModal(ouvrir), 200);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['modal-connexion','modal-inscription','modal-bien'].forEach(fermerModal);
  }
});

// ════════════════════════════════════════════════════════════
//  AUTHENTIFICATION
// ════════════════════════════════════════════════════════════

async function inscrire(event) {
  event.preventDefault();
  const errEl  = document.getElementById('reg-error');
  const okEl   = document.getElementById('reg-success');
  errEl.classList.remove('visible');
  okEl.classList.remove('visible');

  const body = {
    nom:          document.getElementById('reg-nom').value.trim(),
    prenom:       document.getElementById('reg-prenom').value.trim(),
    email:        document.getElementById('reg-email').value.trim(),
    telephone:    document.getElementById('reg-tel').value.trim(),
    mot_de_passe: document.getElementById('reg-mdp').value
  };

  try {
    const res  = await fetch(`${API}/auth/inscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.message;
      errEl.classList.add('visible');
      return;
    }

    okEl.textContent = '✅ Compte créé ! Vous pouvez vous connecter.';
    okEl.classList.add('visible');
    setTimeout(() => switchModal('modal-inscription', 'modal-connexion'), 1500);

  } catch {
    errEl.textContent = 'Erreur réseau. Vérifiez que le serveur est démarré.';
    errEl.classList.add('visible');
  }
}

async function connecter(event) {
  event.preventDefault();
  const errEl = document.getElementById('login-error');
  errEl.classList.remove('visible');

  const body = {
    email:        document.getElementById('login-email').value.trim(),
    mot_de_passe: document.getElementById('login-mdp').value
  };

  try {
    const res  = await fetch(`${API}/auth/connexion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.message;
      errEl.classList.add('visible');
      return;
    }

    tokenJWT = data.token;
    localStorage.setItem('teranga_token', tokenJWT);
    fermerModal('modal-connexion');
    afficherToast(`👋 Bienvenue ${data.utilisateur.prenom} !`);
    mettreAJourNavbar(data.utilisateur);

  } catch {
    errEl.textContent = 'Erreur réseau. Vérifiez que le serveur est démarré.';
    errEl.classList.add('visible');
  }
}

function mettreAJourNavbar(utilisateur) {
  const actions = document.querySelector('.nav-actions');
  if (actions) {
    actions.innerHTML = `
      <span style="font-size:0.85rem;color:var(--gris-texte)">
        ${utilisateur.prenom} ${utilisateur.nom}
      </span>
      <button class="btn-outline" onclick="deconnecter()">Déconnexion</button>
    `;
  }
}

function deconnecter() {
  tokenJWT = null;
  localStorage.removeItem('teranga_token');
  location.reload();
}

// ════════════════════════════════════════════════════════════
//  RECHERCHE / FILTRES
// ════════════════════════════════════════════════════════════

function setType(type, btn) {
  typeRecherche = type;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}

async function rechercherBiens() {
  const ville     = document.getElementById('filtre-ville').value;
  const categorie = document.getElementById('filtre-categorie').value;
  const prix      = document.getElementById('filtre-prix').value;
  const chambres  = document.getElementById('filtre-chambres').value;
  const meuble    = document.getElementById('filtre-meuble').checked ? '1' : '';
  const piscine   = document.getElementById('filtre-piscine').checked ? '1' : '';
  const vue_mer    = document.getElementById('filtre-vue-mer').checked ? '1' : '';
  const non_meuble = document.getElementById('filtre-non-meuble').checked ? '1' : '';
  const prestige   = document.getElementById('filtre-prestige').checked ? '1' : '';

  const params = new URLSearchParams();
  params.append('type', typeRecherche);
  if (ville)     params.append('ville', ville);
  if (categorie) params.append('categorie', categorie);
  if (prix)      params.append('prix_max', prix);
  if (chambres)  params.append('chambres', chambres);
  if (meuble)    params.append('meuble', meuble);
  if (piscine)   params.append('piscine', piscine);
  if (vue_mer)     params.append('vue_mer', vue_mer);
  if (non_meuble)  params.append('non_meuble', non_meuble);
  if (prestige)    params.append('prestige', prestige);

  scrollVers('#biens');

  try {
    const res  = await fetch(`${API}/biens?${params.toString()}`);
    const data = await res.json();
    afficherBiens(data.biens || []);
    afficherToast(`${data.total} bien(s) trouvé(s)`);
  } catch {
    afficherToast('Erreur de connexion à l\'API.');
  }
}

// ════════════════════════════════════════════════════════════
//  AFFICHAGE DES BIENS (résultats API)
// ════════════════════════════════════════════════════════════

function afficherBiens(biens) {
  const grille = document.getElementById('biens-grid');

  if (biens.length === 0) {
    grille.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--gris-texte)">
        <div style="font-size:3rem;margin-bottom:1rem">🏠</div>
        <p>Aucun bien ne correspond à votre recherche.</p>
      </div>`;
    return;
  }

  grille.innerHTML = biens.map((b, i) => {
    const prix = b.prix_vente
      ? `${Number(b.prix_vente).toLocaleString('fr-FR')} <small>FCFA</small>`
      : `${Number(b.prix_location).toLocaleString('fr-FR')} <small>FCFA/mois</small>`;
    const badge = b.prix_vente ? 'vente' : 'location';
    const photo = b.photo_principale
      ? b.photo_principale
      : `appartnonmeuble.png`;

    return `
      <article class="bien-card" style="animation-delay:${i * 0.08}s" data-id="${b.id_bien}">
        <div class="card-img-wrap">
          <img src="${photo}" alt="${b.titre}" loading="lazy"
               onerror="this.src='appartnonmeuble.png'"/>
          <span class="card-badge ${badge}">${badge === 'vente' ? 'Vente' : 'Location'}</span>
          <button class="card-fav" onclick="toggleFavori(this, ${b.id_bien})" title="Favoris">♡</button>
        </div>
        <div class="card-body">
          <div class="card-ville">📍 ${b.nom_ville || ''}</div>
          <h3 class="card-titre">${b.titre}</h3>
          <div class="card-features">
            ${b.nb_chambres ? `<span>🛏 ${b.nb_chambres} chambre(s)</span>` : ''}
            ${b.surface_m2  ? `<span>📐 ${b.surface_m2} m²</span>` : ''}
            ${b.piscine     ? `<span>🏊 Piscine</span>` : ''}
          </div>
          <div class="card-footer">
            <div class="card-prix">${prix}</div>
            <button class="btn-card" onclick="voirBien(${b.id_bien})">Voir</button>
          </div>
        </div>
      </article>`;
  }).join('');
}

// ════════════════════════════════════════════════════════════
//  DÉTAIL D'UN BIEN
// ════════════════════════════════════════════════════════════

const BIENS_STATIQUES = {
  1: {
    id_bien: 1,
    titre: "Appartement vue sur mer",
    description: "Magnifique appartement entièrement meublé avec une vue imprenable sur l'océan Atlantique. Situé au cœur de Saly Portudal, à quelques pas de la plage.",
    nom_ville: "Saly Portudal", quartier: "Bord de mer",
    surface_m2: 120, nb_chambres: 3, nb_salles_bain: 2,
    prix_location: 1000000, periode_location: "mois",
    meuble: 1, piscine: 0, climatisation: 1, parking: 1, wifi: 1,
    photo: "appartvuesurmer.png", badge: "location"
  },
  2: {
    id_bien: 2,
    titre: "Villa avec piscine",
    description: "Somptueuse villa de standing avec piscine privée, jardin tropical et garage. Architecture moderne dans un quartier résidentiel sécurisé de Saly Portudal.",
    nom_ville: "Saly Portudal", quartier: "Résidentiel",
    surface_m2: 350, nb_chambres: 5, nb_salles_bain: 4,
    prix_vente: 85000000,
    meuble: 0, piscine: 1, climatisation: 1, parking: 1, wifi: 1,
    photo: "villaavecpiscine.png", badge: "vente"
  },
  3: {
    id_bien: 3,
    titre: "Appartement vue piscine",
    description: "Bel appartement meublé avec vue directe sur la piscine de la résidence. Environnement calme et sécurisé à Mbour.",
    nom_ville: "Mbour", quartier: "Centre",
    surface_m2: 85, nb_chambres: 2, nb_salles_bain: 1,
    prix_location: 1200000, periode_location: "mois",
    meuble: 1, piscine: 1, climatisation: 1, parking: 0, wifi: 1,
    photo: "appartvuepiscine.png", badge: "location"
  },
  4: {
    id_bien: 4,
    titre: "Résidence meublée",
    description: "Spacieuse résidence meublée haut de gamme à Dakar, idéale pour les expatriés et les professionnels en mission.",
    nom_ville: "Dakar", quartier: "Plateau",
    surface_m2: 200, nb_chambres: 4, nb_salles_bain: 3,
    prix_location: 600000, periode_location: "mois",
    meuble: 1, piscine: 0, climatisation: 1, parking: 1, wifi: 1,
    photo: "residence.png", badge: "location"
  },
  5: {
    id_bien: 5,
    titre: "Villa à vendre",
    description: "Magnifique villa de prestige à vendre à Dakar dans un quartier résidentiel prisé. Grandes surfaces, belle architecture et parking sécurisé.",
    nom_ville: "Dakar", quartier: "Almadies",
    surface_m2: 280, nb_chambres: 4, nb_salles_bain: 3,
    prix_vente: 200000000,
    meuble: 0, piscine: 0, climatisation: 1, parking: 1, wifi: 0,
    photo: "villaavendre.png", badge: "vente"
  },
  6: {
    id_bien: 6,
    titre: "Appartement non meublé",
    description: "Appartement non meublé lumineux et bien situé à Dakar. Idéal pour une installation à long terme, proche commerces et transports.",
    nom_ville: "Dakar", quartier: "Mermoz",
    surface_m2: 75, nb_chambres: 2, nb_salles_bain: 1,
    prix_location: 1200000, periode_location: "mois",
    meuble: 0, piscine: 0, climatisation: 0, parking: 0, wifi: 0,
    photo: "appartnonmeuble.png", badge: "location"
  }
};

async function voirBien(id) {
  ouvrirModal('modal-bien');
  const b = BIENS_STATIQUES[id];
  if (!b) {
    document.getElementById('modal-bien-content').innerHTML =
      '<p style="padding:2rem;color:var(--rouge)">Bien introuvable.</p>';
    return;
  }
  const prix = b.prix_vente
    ? `${Number(b.prix_vente).toLocaleString('fr-FR')} FCFA`
    : `${Number(b.prix_location).toLocaleString('fr-FR')} FCFA/${b.periode_location || 'mois'}`;
  const badgeLabel = b.badge === 'vente' ? 'Vente' : 'Location';
  document.getElementById('modal-bien-content').innerHTML = `
    <div>
      <div style="position:relative;margin-bottom:1.5rem">
        <img src="${b.photo}" alt="${b.titre}" 
             style="width:100%;height:260px;object-fit:cover;border-radius:12px;"
             onerror="this.src='appartnonmeuble.png'"/>
        <span class="card-badge ${b.badge}" style="position:absolute;top:1rem;left:1rem">${badgeLabel}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
        <div>
          <p style="font-size:0.8rem;color:var(--gris-texte);margin-bottom:0.3rem">📍 ${b.nom_ville} ${b.quartier ? '· ' + b.quartier : ''}</p>
          <h2 style="font-family:var(--font-display);font-size:1.6rem;font-weight:600">${b.titre}</h2>
        </div>
        <div style="text-align:right">
          <div style="font-family:var(--font-display);font-size:1.4rem;color:var(--vert);font-weight:600">${prix}</div>
        </div>
      </div>
      <p style="color:var(--gris-texte);line-height:1.7;margin-bottom:1.5rem">${b.description}</p>
      <div style="display:flex;flex-wrap:wrap;gap:0.75rem;margin-bottom:2rem">
        ${b.nb_chambres    ? `<span style="background:var(--gris-clair);padding:0.4rem 0.8rem;border-radius:20px;font-size:0.85rem">🛏 ${b.nb_chambres} chambre(s)</span>` : ''}
        ${b.nb_salles_bain ? `<span style="background:var(--gris-clair);padding:0.4rem 0.8rem;border-radius:20px;font-size:0.85rem">🚿 ${b.nb_salles_bain} salle(s) de bain</span>` : ''}
        ${b.surface_m2     ? `<span style="background:var(--gris-clair);padding:0.4rem 0.8rem;border-radius:20px;font-size:0.85rem">📐 ${b.surface_m2} m²</span>` : ''}
        ${b.meuble         ? `<span style="background:var(--gris-clair);padding:0.4rem 0.8rem;border-radius:20px;font-size:0.85rem">🛋️ Meublé</span>` : ''}
        ${b.piscine        ? `<span style="background:var(--gris-clair);padding:0.4rem 0.8rem;border-radius:20px;font-size:0.85rem">🏊 Piscine</span>` : ''}
        ${b.climatisation  ? `<span style="background:var(--gris-clair);padding:0.4rem 0.8rem;border-radius:20px;font-size:0.85rem">❄️ Climatisé</span>` : ''}
        ${b.parking        ? `<span style="background:var(--gris-clair);padding:0.4rem 0.8rem;border-radius:20px;font-size:0.85rem">🚗 Parking</span>` : ''}
        ${b.wifi           ? `<span style="background:var(--gris-clair);padding:0.4rem 0.8rem;border-radius:20px;font-size:0.85rem">📶 Wi-Fi</span>` : ''}
      </div>
      <div style="display:flex;gap:1rem;flex-wrap:wrap">
        <button class="btn-submit" onclick="demanderVisite(${b.id_bien})" style="flex:1">📅 Demander une visite</button>
        <a href="https://wa.me/221781733682?text=Bonjour%2C+je+suis+intéressé(e)+par+*${encodeURIComponent(b.titre)}*+à+${encodeURIComponent(b.nom_ville)}" 
           target="_blank"
           style="flex:1;display:flex;align-items:center;justify-content:center;gap:0.5rem;background:#25D366;color:white;border-radius:var(--radius);padding:0.9rem;text-decoration:none;font-weight:500">
          💬 WhatsApp
        </a>
      </div>
    </div>`;
}

// ════════════════════════════════════════════════════════════
//  FAVORIS
// ════════════════════════════════════════════════════════════

async function toggleFavori(btn, idBien) {
  if (!tokenJWT) {
    ouvrirModal('modal-connexion');
    afficherToast('Connectez-vous pour sauvegarder des favoris.');
    return;
  }
  const estActif = btn.classList.contains('active');
  const methode  = estActif ? 'DELETE' : 'POST';

  try {
    await fetch(`${API}/favoris/${idBien}`, {
      method: methode,
      headers: headersAuth()
    });
    btn.classList.toggle('active');
    btn.textContent = estActif ? '♡' : '♥';
    afficherToast(estActif ? 'Retiré des favoris' : '❤️ Ajouté aux favoris');
  } catch {
    afficherToast('Erreur réseau.');
  }
}

// ════════════════════════════════════════════════════════════
//  DEMANDE DE VISITE
// ════════════════════════════════════════════════════════════

function demanderVisite(_idBien) {
  fermerModal('modal-bien');
  setTimeout(() => {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    afficherToast('Remplissez le formulaire pour demander une visite.');
  }, 400);
}

// ════════════════════════════════════════════════════════════
//  FORMULAIRE CONTACT → API
// ════════════════════════════════════════════════════════════

async function envoyerDemande(event) {
  event.preventDefault();
  const successEl = document.getElementById('form-success');
  successEl.style.display = 'none';

  const body = {
    id_bien:       1,
    nom_contact:   document.getElementById('c-nom').value.trim(),
    email_contact: document.getElementById('c-email').value.trim(),
    tel_contact:   document.getElementById('c-tel').value.trim(),
    message:       document.getElementById('c-message').value.trim(),
    type_demande:  document.getElementById('c-type').value
  };

  try {
    const res = await fetch(`${API}/demandes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      successEl.style.display = 'block';
      event.target.reset();
      afficherToast('✅ Message envoyé avec succès !');
    } else {
      afficherToast('Erreur lors de l\'envoi du message.');
    }
  } catch {
    successEl.style.display = 'block';
    event.target.reset();
  }
}

// ════════════════════════════════════════════════════════════
//  CHARGER PLUS DE BIENS
// ════════════════════════════════════════════════════════════

async function chargerPlusBiens() {
  try {
    const res  = await fetch(`${API}/biens?limite=12`);
    const data = await res.json();
    afficherBiens(data.biens || []);
    afficherToast(`${data.total} biens chargés depuis la base de données`);
  } catch {
    afficherToast('Impossible de charger les biens. Vérifiez que l\'API est démarrée.');
  }
}

// ════════════════════════════════════════════════════════════
//  INIT — vérifier si déjà connecté
// ════════════════════════════════════════════════════════════

async function init() {
  if (!tokenJWT) return;
  try {
    const res = await fetch(`${API}/auth/profil`, { headers: headersAuth() });
    if (res.ok) {
      const user = await res.json();
      mettreAJourNavbar(user);
    } else {
      tokenJWT = null;
      localStorage.removeItem('teranga_token');
    }
  } catch { /* serveur hors ligne, on ignore */ }
}

init();

// ════════════════════════════════════════════════════════════
//  TABS FILTRES "BIENS À LA UNE"
// ════════════════════════════════════════════════════════════

document.querySelectorAll('.bien-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.bien-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    const filter = this.dataset.filter;
    document.querySelectorAll('#biens-grid .bien-card').forEach(card => {
      if (filter === 'all') {
        card.style.display = '';
      } else {
        const badge = card.querySelector('.card-badge');
        card.style.display = (badge && badge.classList.contains(filter)) ? '' : 'none';
      }
    });
  });
});

// ════════════════════════════════════════════════════════════
//  FORMULAIRE PRISE DE RENDEZ-VOUS
// ════════════════════════════════════════════════════════════

async function envoyerRDV(event) {
  event.preventDefault();
  const okEl = document.getElementById('rdv-success');
  const body = {
    nom_contact:   document.getElementById('rdv-nom').value.trim(),
    email_contact: document.getElementById('rdv-email').value.trim(),
    tel_contact:   document.getElementById('rdv-tel').value.trim(),
    type_demande:  document.getElementById('rdv-type').value,
    message:       document.getElementById('rdv-message').value.trim(),
    id_bien:       null
  };
  try {
    await fetch(`${API}/demandes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch { /* serveur hors ligne — on confirme quand même */ }
  okEl.textContent = '✅ Votre demande de RDV a bien été envoyée ! Nous vous contactons sous 24h.';
  okEl.classList.add('visible');
  event.target.reset();
  setTimeout(() => fermerModal('modal-rdv'), 2500);
}