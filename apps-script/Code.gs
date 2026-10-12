/**
 * DEDJO — Réception des commandes du site
 *
 * Appelé uniquement par la fonction Netlify netlify/functions/commande.ts (le navigateur ne
 * connaît pas l'URL de ce script). Pour chaque commande :
 *   1. vérifie le secret partagé, puis revalide toutes les données (dont l'acceptation des CGV) ;
 *   2. recalcule le total (prix ci-dessous, jamais ceux envoyés par le navigateur) ;
 *   3. applique les limites anti-abus (par visiteur, par e-mail, par téléphone : voir LIMITES) ;
 *   4. ajoute une ligne dans l'onglet « Commandes » du Google Sheet ;
 *   5. envoie au client un e-mail de récapitulatif (colonne « E-mail envoyé » : oui / non), dans la
 *      limite d'un plafond quotidien et en gardant une réserve de quota pour l'e-mail de secours ;
 *   6. envoie une notification Telegram (avec un bouton « Confirmer sur WhatsApp ») ; en cas
 *      d'échec, un e-mail de secours. Aucun échec d'envoi ne remet en cause l'enregistrement ;
 *   7. renvoie { ok: true, id } ou { ok: false, error }.
 *
 * Propriétés du script (Paramètres du projet ⚙️ > Propriétés du script) :
 *   SHARED_SECRET   obligatoire : même valeur que ORDER_SHARED_SECRET sur Netlify
 *   TELEGRAM_TOKEN    jeton du bot donné par @BotFather (123456789:AA…)
 *   TELEGRAM_CHAT_ID  identifiant de ta conversation avec le bot (obtenu via getUpdates)
 *   ALERT_EMAIL       facultatif : ton adresse, pour l'e-mail de secours et le « répondre à » des
 *                     e-mails clients (par défaut, celle du compte Google qui exécute le script)
 *   DERNIER_NUMERO  géré automatiquement (dernier n° de commande attribué)
 *   EMAILS_CLIENTS_JOUR  géré automatiquement (nombre d'e-mails de récapitulatif envoyés aujourd'hui)
 *
 * ⚠️ Les prix, pièces par sachet, frais et seuil de livraison, les jours des secteurs, la cuisson
 *    et les moyens de paiement sont recopiés de src/lib/catalog.ts, et les versions des CGV de
 *    src/lib/legal.ts. Toute modification doit être faite aux deux endroits, puis redéployée :
 *    Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version.
 *
 * Mode d'emploi complet : apps-script/DEPLOIEMENT.md
 */

const CATALOGUE = [
  { id: "lune", nom: "La Lune", pieces: 6, prix: 10, unite: "pièces", famille: "viennoiseries" },
  { id: "cabosse", nom: "La Cabosse", pieces: 6, prix: 10, unite: "pièces", famille: "viennoiseries" },
  { id: "grappe", nom: "La Grappe", pieces: 4, prix: 10, unite: "pièces", famille: "viennoiseries" },
  { id: "rose", nom: "La Rose", pieces: 4, prix: 10, unite: "pièces", famille: "viennoiseries" },
  { id: "montagne", nom: "La Montagne", pieces: 2, prix: 10, unite: "friands", famille: "feuilletés" },
  { id: "foret", nom: "La Forêt", pieces: 2, prix: 10, unite: "friands", famille: "feuilletés" },
  { id: "noix", nom: "La Noix", pieces: 2, prix: 10, unite: "friands", famille: "feuilletés" },
  { id: "goet", nom: "La Goët", pieces: 2, prix: 10, unite: "friands", famille: "feuilletés" },
];

// Livraison (Marseille) : frais en dessous du seuil, offerte à partir du seuil (en sachets)
const LIVRAISON = { offerteDes: 3, frais: 5 };

// jour : 0 = dimanche … 5 = vendredi, 6 = samedi
const SECTEURS = {
  savoie: { nom: "Savoie", jour: 5, livraison: false, mode: "retrait Savoie" },
  marseille: { nom: "Marseille et alentours", jour: 6, livraison: true, mode: "livraison Marseille" },
};

// Signature des e-mails envoyés aux clients (texte ; les retours à la ligne sont conservés)
const SIGNATURE = "À très vite,\nJo — Dedjo\nL'artisanat qui se partage · dedjo.com";

// Cuisson (four préchauffé, directement sorti du congélateur), rappelée dans l'e-mail de récapitulatif.
// Recopiée de CUISSON dans src/lib/catalog.ts.
const CUISSON = { temperature: 180, minutes: { viennoiseries: 20, "feuilletés": 30 } };

// Moyens de paiement à la remise, recopiés de MOYENS_PAIEMENT dans src/lib/catalog.ts
const PAIEMENT = "en espèces ou par virement";

// Versions des CGV acceptées (CGV_VERSION dans src/lib/legal.ts). Pour une nouvelle version des CGV :
// ajouter sa date ici et publier le script AVANT le site ; garder l'ancienne date quelques jours.
const CGV_VERSIONS = ["2026-10-12"];

// Couleurs Dedjo des e-mails
const COULEURS = { nuit: "#163F6B", creme: "#FBF5E9", jaune: "#F9E830", bleu: "#7DC3E8", texte: "#2B2B2B" };

// Anti-abus : au plus `max` commandes par fenêtre, par visiteur (empreinte d'IP calculée par
// Netlify), par e-mail et par téléphone. CacheService garde une valeur 6 h au plus (360 min).
const LIMITES = [
  { cle: "ip", max: 3, fenetreMin: 10 },
  { cle: "email", max: 3, fenetreMin: 360 },
  { cle: "tel", max: 3, fenetreMin: 360 },
];

// E-mails de récapitulatif : au plus `plafondJour` par jour (au-delà, la commande est enregistrée
// sans e-mail) ; on n'envoie plus s'il reste `reserveSecours` envois ou moins dans le quota Google
// (~100 destinataires/jour avec un compte Gmail gratuit), gardés pour l'e-mail de secours.
const EMAILS_CLIENTS = { plafondJour: 40, reserveSecours: 10 };

const ONGLET = "Commandes";
const QUANTITE_MAX = 50;
const FUSEAU = "Europe/Paris";
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const EN_TETES = [
  "Date",
  "N° de commande",
  "Prénom",
  "Nom",
  "Téléphone",
  "Email",
  "Secteur",
  "Adresse",
  "Code postal",
  "Ville",
  ...CATALOGUE.map((p) => `${p.nom} (sachets)`),
  "Frais de livraison (€)",
  "Total (€)",
  "Créneau",
  "Commentaire",
  "Confirmée",
  "Livrée",
  "Payée",
  "E-mail envoyé",
  "Version CGV", // ajoutée en dernier : les colonnes existantes ne sont pas décalées
];
const COLONNE_EMAIL = EN_TETES.indexOf("E-mail envoyé") + 1;

/** Erreur de validation : son message est renvoyé tel quel au client. */
class ErreurCommande extends Error {}

/* ===================================================================
   POINTS D'ENTRÉE
   =================================================================== */

function doPost(e) {
  let data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || "");
  } catch (err) {
    return repondre({ ok: false, error: "Format de commande invalide." });
  }

  const secret = PropertiesService.getScriptProperties().getProperty("SHARED_SECRET");
  if (!secret || !data || data.secret !== secret) {
    return repondre({ ok: false, error: "Accès refusé." });
  }

  // Champ piège rempli : c'est un robot. On répond « ok » sans rien enregistrer.
  if (typeof data.website === "string" && data.website.trim() !== "") {
    return repondre({ ok: true, id: "D-0000" });
  }

  try {
    const commande = valider(data);
    verifierLimites(commande, data.empreinteIp);
    const { id, url, feuille, ligne } = enregistrer(commande);
    const echecEmail = confirmerAuClient(commande, id, feuille, ligne);
    notifier(commande, id, url, echecEmail);
    return repondre({ ok: true, id });
  } catch (err) {
    if (err instanceof ErreurCommande) return repondre({ ok: false, error: err.message });
    console.error((err && err.stack) || err);
    return repondre({ ok: false, error: "Erreur interne : la commande n'a pas été enregistrée." });
  }
}

/** Permet de vérifier dans un navigateur que le déploiement répond. */
function doGet() {
  return repondre({ ok: true, service: "Dedjo — commandes" });
}

function repondre(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(ContentService.MimeType.JSON);
}

/* ===================================================================
   VALIDATION ET CALCUL DU TOTAL
   =================================================================== */

function texte(valeur, nom, options) {
  const { requis = false, max = 200 } = options || {};
  const v = typeof valeur === "string" ? valeur.trim() : "";
  if (requis && !v) throw new ErreurCommande(`${nom} : champ manquant.`);
  if (v.length > max) throw new ErreurCommande(`${nom} : texte trop long.`);
  return v;
}

/** Prénom ou nom : lettres (accents compris), espaces, apostrophes et traits d'union uniquement. */
function nomPropre(valeur, nom) {
  const v = texte(valeur, nom, { requis: true, max: 80 });
  if (!/^[\p{L}\p{M} '’-]+$/u.test(v)) {
    throw new ErreurCommande(`${nom} : utilise uniquement des lettres, espaces, apostrophes ou traits d'union.`);
  }
  return v;
}

/** Vrai si le texte contient un lien, une adresse web ou un e-mail (http, www, domaine.xx, @). */
function contientLien(v) {
  return /https?:|:\/\/|www\.|@|[a-z0-9-]{2,}\.[a-z]{2,}/i.test(v);
}

/** Champ d'adresse (rue, ville) : refusé s'il contient un lien. */
function champAdresse(valeur, nom, max) {
  const v = texte(valeur, nom, { requis: true, max });
  if (contientLien(v)) {
    throw new ErreurCommande(`${nom} : pas de lien ni d'adresse web. Si tu abrèges, mets une espace après le point (« Av. du Prado »).`);
  }
  return v;
}

function valider(data) {
  // CGV : case cochée et version connue
  if (data.cgvAcceptees !== true) throw new ErreurCommande("Coche la case pour accepter les CGV.");
  if (CGV_VERSIONS.indexOf(data.cgvVersion) === -1) {
    throw new ErreurCommande("Les conditions générales de vente ont changé : recharge la page, puis renvoie ta commande.");
  }

  const secteur = SECTEURS[data.secteur];
  if (!secteur) throw new ErreurCommande("Secteur inconnu.");

  // Date : AAAA-MM-JJ, bon jour de la semaine, pas dans le passé
  const date = typeof data.date === "string" ? data.date : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ErreurCommande("Date invalide.");
  const [annee, mois, jour] = date.split("-").map(Number);
  const jourDate = new Date(Date.UTC(annee, mois - 1, jour, 12));
  if (jourDate.getUTCMonth() !== mois - 1 || jourDate.getUTCDate() !== jour) throw new ErreurCommande("Date invalide.");
  if (jourDate.getUTCDay() !== secteur.jour) {
    throw new ErreurCommande(`La date doit tomber un ${JOURS[secteur.jour]}.`);
  }
  if (date < Utilities.formatDate(new Date(), FUSEAU, "yyyy-MM-dd")) {
    throw new ErreurCommande("Cette date est déjà passée.");
  }

  // Coordonnées
  const client = data.client || {};
  const prenom = nomPropre(client.prenom, "Prénom");
  const nom = nomPropre(client.nom, "Nom");
  const tel = texte(client.tel, "Téléphone", { requis: true, max: 25 });
  if (!/^\+?[\d\s.()-]+$/.test(tel) || tel.replace(/\D/g, "").length < 6) {
    throw new ErreurCommande("Numéro de téléphone invalide.");
  }
  const email = texte(client.email, "Email", { requis: true, max: 120 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ErreurCommande("Adresse email invalide.");
  const message = texte(data.message, "Message", { max: 1000 });

  // Adresse : obligatoire pour une livraison, ignorée pour un retrait
  let adresse = null;
  if (secteur.livraison) {
    const a = data.adresse || {};
    adresse = {
      ligne: champAdresse(a.ligne, "Adresse", 200),
      codePostal: texte(a.codePostal, "Code postal", { requis: true, max: 5 }),
      ville: champAdresse(a.ville, "Ville", 80),
      manuelle: a.manuelle === true,
    };
    if (!/^\d{5}$/.test(adresse.codePostal)) throw new ErreurCommande("Code postal invalide.");
  }

  // Panier : produits connus, quantités entières, au moins un sachet
  const quantites = data.quantites;
  if (!quantites || typeof quantites !== "object" || Array.isArray(quantites)) throw new ErreurCommande("Panier invalide.");
  Object.keys(quantites).forEach((cle) => {
    if (!CATALOGUE.some((p) => p.id === cle)) throw new ErreurCommande("Produit inconnu dans le panier.");
  });
  const lignes = CATALOGUE.map((produit) => {
    const quantite = quantites[produit.id] === undefined ? 0 : quantites[produit.id];
    if (!Number.isInteger(quantite) || quantite < 0 || quantite > QUANTITE_MAX) {
      throw new ErreurCommande(`Quantité invalide pour ${produit.nom}.`);
    }
    return { produit, quantite };
  });
  const sachets = lignes.reduce((s, l) => s + l.quantite, 0);
  if (sachets === 0) throw new ErreurCommande("Le panier est vide.");

  const sousTotal = lignes.reduce((s, l) => s + l.quantite * l.produit.prix, 0);
  const frais = secteur.livraison && sachets < LIVRAISON.offerteDes ? LIVRAISON.frais : 0;
  const dateLettres = `${JOURS[jourDate.getUTCDay()]} ${jourDate.getUTCDate()} ${MOIS[jourDate.getUTCMonth()]}`;

  return {
    secteur,
    client: { prenom, nom, tel, email },
    adresse,
    message,
    lignes,
    sachets,
    frais,
    total: sousTotal + frais,
    dateLettres,
    creneau: `${dateLettres} · ${secteur.mode}`,
    cgvVersion: data.cgvVersion,
  };
}

/* ===================================================================
   ANTI-ABUS : LIMITES PAR VISITEUR, PAR E-MAIL ET PAR TÉLÉPHONE
   =================================================================== */

/** Empreinte SHA-256 en hexadécimal : le cache ne contient jamais d'e-mail ni de téléphone en clair. */
function empreinte(valeur) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(valeur), Utilities.Charset.UTF_8)
    .map((octet) => ((octet + 256) % 256).toString(16).padStart(2, "0"))
    .join("");
}

/** Forme canonique d'un e-mail pour les limites : sans « +étiquette », et sans les points ignorés par Gmail. */
function emailCanonique(email) {
  const [local, domaine] = email.toLowerCase().split("@");
  const sansEtiquette = local.split("+")[0];
  return domaine === "gmail.com" || domaine === "googlemail.com"
    ? `${sansEtiquette.replace(/\./g, "")}@gmail.com`
    : `${sansEtiquette}@${domaine}`;
}

/**
 * Refuse la commande si le même visiteur (empreinte d'IP envoyée par Netlify), le même e-mail ou
 * le même téléphone a déjà atteint sa limite (LIMITES). Fenêtres fixes, gardées dans CacheService.
 */
function verifierLimites(c, empreinteIp) {
  const valeurs = {
    ip: typeof empreinteIp === "string" && /^[0-9a-f]{16,64}$/.test(empreinteIp) ? empreinteIp : "inconnue",
    email: emailCanonique(c.client.email),
    tel: numeroWhatsApp(c.client.tel),
  };
  const cache = CacheService.getScriptCache();
  const verrou = LockService.getScriptLock();
  verrou.waitLock(10000);
  try {
    const maintenant = Date.now();
    const compteurs = LIMITES.map((limite) => {
      const cle = `limite:${limite.cle}:${empreinte(valeurs[limite.cle])}`;
      const fenetreMs = limite.fenetreMin * 60 * 1000;
      let compteur = null;
      try {
        compteur = JSON.parse(cache.get(cle) || "null");
      } catch (err) {
        // valeur illisible : on repart de zéro
      }
      if (!compteur || maintenant - compteur.debut >= fenetreMs) compteur = { debut: maintenant, n: 0 };
      return { limite, cle, fenetreMs, compteur };
    });
    if (compteurs.some(({ limite, compteur }) => compteur.n >= limite.max)) {
      throw new ErreurCommande(
        "Trop de commandes en peu de temps. Réessaie un peu plus tard, ou écris-moi directement sur WhatsApp."
      );
    }
    compteurs.forEach(({ cle, fenetreMs, compteur }) => {
      compteur.n += 1;
      const resteSecondes = Math.max(1, Math.ceil((compteur.debut + fenetreMs - maintenant) / 1000));
      cache.put(cle, JSON.stringify(compteur), resteSecondes);
    });
  } finally {
    verrou.releaseLock();
  }
}

/* ===================================================================
   ENREGISTREMENT DANS LE SHEET
   =================================================================== */

/** Neutralise une saisie qui serait interprétée comme une formule (=, +, -, @). */
function cellule(valeur) {
  return typeof valeur === "string" && /^[=+\-@\t\r]/.test(valeur) ? `'${valeur}` : valeur;
}

/** Force le format texte (garde le 0 initial d'un téléphone ou d'un code postal). */
function enTexte(valeur) {
  return valeur ? `'${valeur}` : "";
}

function enregistrer(c) {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(20000); // deux commandes simultanées ne peuvent pas recevoir le même numéro
  try {
    const classeur = SpreadsheetApp.getActiveSpreadsheet();
    const feuille = classeur.getSheetByName(ONGLET) || classeur.insertSheet(ONGLET);
    if (feuille.getLastRow() === 0) {
      feuille.appendRow(EN_TETES);
      feuille.getRange(1, 1, 1, EN_TETES.length).setFontWeight("bold");
      feuille.setFrozenRows(1);
    } else {
      // Onglet créé par une version précédente : on complète les en-têtes (nouvelles colonnes en fin)
      const entetes = feuille.getRange(1, 1, 1, EN_TETES.length);
      if (entetes.getValues()[0][EN_TETES.length - 1] !== EN_TETES[EN_TETES.length - 1]) {
        entetes.setValues([EN_TETES]).setFontWeight("bold");
      }
    }

    const proprietes = PropertiesService.getScriptProperties();
    const numero = Number(proprietes.getProperty("DERNIER_NUMERO") || "0") + 1;
    const id = `D-${String(numero).padStart(4, "0")}`;

    feuille.appendRow([
      new Date(),
      id,
      cellule(c.client.prenom),
      cellule(c.client.nom),
      enTexte(c.client.tel),
      cellule(c.client.email),
      c.secteur.nom,
      c.adresse ? cellule(c.adresse.ligne) + (c.adresse.manuelle ? " (saisie manuelle)" : "") : "",
      c.adresse ? enTexte(c.adresse.codePostal) : "",
      c.adresse ? cellule(c.adresse.ville) : "",
      ...c.lignes.map((l) => l.quantite || ""),
      c.frais,
      c.total,
      c.creneau,
      cellule(c.message),
      "", // Confirmée
      "", // Livrée
      "", // Payée
      "", // E-mail envoyé (rempli juste après l'envoi)
      enTexte(c.cgvVersion), // en texte : sinon le Sheet en ferait une date
    ]);
    SpreadsheetApp.flush();
    proprietes.setProperty("DERNIER_NUMERO", String(numero));

    return { id, url: `${classeur.getUrl()}#gid=${feuille.getSheetId()}`, feuille, ligne: feuille.getLastRow() };
  } finally {
    verrou.releaseLock();
  }
}

/* ===================================================================
   OUTILS COMMUNS
   =================================================================== */

function euros(n) {
  return Number.isInteger(n) ? `${n} €` : `${n.toFixed(2).replace(".", ",")} €`;
}

/** « 2026-10-12 » → « 12 octobre 2026 » */
function dateLongue(iso) {
  const [annee, mois, jour] = String(iso).split("-").map(Number);
  return `${jour} ${MOIS[mois - 1]} ${annee}`;
}

/** Échappe les caractères spéciaux HTML (&, <, >, ") : Telegram et e-mails. */
function echapper(valeur) {
  return String(valeur).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** « 1× La Lune, 1× La Montagne » */
function resumeProduits(c) {
  return c.lignes
    .filter((l) => l.quantite > 0)
    .map((l) => `${l.quantite}× ${l.produit.nom}`)
    .join(", ");
}

/** Ton adresse : ALERT_EMAIL si défini, sinon celle du compte qui exécute le script. */
function adresseJo() {
  return (
    (PropertiesService.getScriptProperties().getProperty("ALERT_EMAIL") || "").trim() ||
    Session.getEffectiveUser().getEmail()
  );
}

/* ===================================================================
   E-MAIL DE RÉCAPITULATIF AU CLIENT
   =================================================================== */

/** Contenu de l'e-mail client : objet, version texte et version HTML. */
function emailClient(c, id) {
  const sachet = (q) => `${q} sachet${q > 1 ? "s" : ""}`;
  const produits = c.lignes
    .filter((l) => l.quantite > 0)
    .map((l) => ({
      libelle: `${sachet(l.quantite)} ${l.produit.nom} (${l.quantite * l.produit.pieces} ${l.produit.unite})`,
      prix: euros(l.quantite * l.produit.prix),
    }));
  const livraison = !c.secteur.livraison
    ? "Retrait au marché, sans frais"
    : c.frais
      ? `${euros(c.frais)} (offerte dès ${LIVRAISON.offerteDes} sachets)`
      : "Offerte";
  const lieu = c.adresse
    ? `${c.adresse.ligne}, ${c.adresse.codePostal} ${c.adresse.ville}`
    : "Marché du vendredi, Ferme de la Goëttaz (Savoie)";
  const creneau = `${c.dateLettres} (${c.secteur.livraison ? "livraison" : "retrait"})`;
  const infos = [
    [c.secteur.livraison ? "Adresse" : "Retrait", lieu],
    ["Créneau souhaité", creneau],
  ];
  // Le commentaire (texte libre) n'est jamais recopié dans l'e-mail : on confirme seulement sa réception
  if (c.message) infos.push(["Ton commentaire", "bien reçu"]);
  infos.push(["Conditions générales de vente", `version du ${dateLongue(c.cgvVersion)}, acceptée avec ta commande : dedjo.com/cgv`]);

  const objet = `Ta commande Dedjo ${id} est bien reçue`;
  const intro = "Merci pour ta commande, elle est bien arrivée !";
  const suite =
    "Je te recontacte rapidement sur WhatsApp pour confirmer le créneau : ta commande devient ferme à ce moment-là. " +
    `Le paiement se fait ${PAIEMENT}, quand tu récupères ta commande : rien à régler en ligne.`;
  const cuisson = rappelCuisson(c);

  const texte = [
    `Salut ${c.client.prenom},`,
    "",
    intro,
    "",
    `Commande ${id}`,
    ...produits.map((p) => `• ${p.libelle} : ${p.prix}`),
    `• Livraison : ${livraison}`,
    `Total : ${euros(c.total)}`,
    "",
    ...infos.map(([k, v]) => `${k} : ${v}`),
    "",
    suite,
    "",
    `Rappel cuisson : ${cuisson}`,
    "",
    SIGNATURE,
  ].join("\n");

  const k = COULEURS;
  const ligneTableau = (gauche, droite, gras) =>
    `<tr><td style="padding:6px 0;${gras ? "font-weight:bold;" : ""}">${echapper(gauche)}</td>` +
    `<td style="padding:6px 0;text-align:right;white-space:nowrap;${gras ? "font-weight:bold;" : ""}">${echapper(droite)}</td></tr>`;
  const html = `<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:${k.creme};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${k.creme};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;border-top:6px solid ${k.nuit};font-family:Arial,Helvetica,sans-serif;color:${k.texte};font-size:15px;line-height:1.55;">
<tr><td style="padding:28px 28px 8px;">
  <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:26px;color:${k.nuit};">Dedjo</p>
  <p style="margin:0 0 20px;font-style:italic;color:#6b6b6b;font-size:13px;">L'artisanat qui se partage</p>
  <p style="margin:0 0 6px;">Salut ${echapper(c.client.prenom)},</p>
  <p style="margin:0 0 20px;">${echapper(intro)}</p>
  <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:18px;color:${k.nuit};">Commande ${echapper(id)}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e6e1d6;border-bottom:1px solid #e6e1d6;margin-bottom:16px;">
    ${produits.map((p) => ligneTableau(p.libelle, p.prix)).join("")}
    ${
      !c.secteur.livraison
        ? ligneTableau("Retrait au marché", "Sans frais")
        : c.frais
          ? ligneTableau(`Livraison (offerte dès ${LIVRAISON.offerteDes} sachets)`, euros(c.frais))
          : ligneTableau("Livraison", "Offerte")
    }
    <tr><td colspan="2" style="border-top:2px solid ${k.nuit};"></td></tr>
    ${ligneTableau("Total", euros(c.total), true)}
  </table>
  ${infos.map(([cle, v]) => `<p style="margin:0 0 6px;"><strong style="color:${k.nuit};">${echapper(cle)} :</strong> ${echapper(v)}</p>`).join("")}
  <p style="margin:18px 0;">${echapper(suite)}</p>
  <p style="margin:0 0 20px;padding:12px 14px;background:${k.creme};border-left:4px solid ${k.jaune};border-radius:8px;">
    ❄️ <strong>Rappel cuisson :</strong> ${echapper(cuisson)}
  </p>
  <p style="margin:0 0 24px;">${echapper(SIGNATURE).replace(/\n/g, "<br>")}</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return { objet, texte, html };
}

/** « Préchauffe ton four à 180 °C… : N min pour les viennoiseries, N min pour les feuilletés. » (durées : CUISSON) */
function rappelCuisson(c) {
  const familles = Object.keys(CUISSON.minutes).filter((f) => c.lignes.some((l) => l.quantite > 0 && l.produit.famille === f));
  const durees = familles.map((f) => `${CUISSON.minutes[f]} min pour les ${f}`).join(", ");
  return `Préchauffe ton four à ${CUISSON.temperature} °C, puis enfourne tes sachets directement sortis du congélateur, sans décongeler : ${durees}.`;
}

/** Compteur des e-mails de récapitulatif du jour (propriété EMAILS_CLIENTS_JOUR) : { jour, n }. */
function emailsClientsDuJour() {
  const jour = Utilities.formatDate(new Date(), FUSEAU, "yyyy-MM-dd");
  let compteur = null;
  try {
    compteur = JSON.parse(PropertiesService.getScriptProperties().getProperty("EMAILS_CLIENTS_JOUR") || "null");
  } catch (err) {
    // valeur illisible : on repart de zéro
  }
  return compteur && compteur.jour === jour ? compteur : { jour, n: 0 };
}

/** Ajoute 1 au compteur du jour. Ne lève jamais d'erreur : l'e-mail est déjà parti. */
function noterEmailClient() {
  try {
    const compteur = emailsClientsDuJour();
    compteur.n += 1;
    PropertiesService.getScriptProperties().setProperty("EMAILS_CLIENTS_JOUR", JSON.stringify(compteur));
  } catch (err) {
    console.error("Impossible de mettre à jour le compteur EMAILS_CLIENTS_JOUR :", err);
  }
}

/** Raison de ne pas envoyer l'e-mail client (plafond du jour, réserve de quota), ou null. */
function envoiClientBloque() {
  if (emailsClientsDuJour().n >= EMAILS_CLIENTS.plafondJour) {
    return `plafond de ${EMAILS_CLIENTS.plafondJour} e-mails clients atteint aujourd'hui (protection anti-abus)`;
  }
  if (MailApp.getRemainingDailyQuota() <= EMAILS_CLIENTS.reserveSecours) {
    return "quota d'envoi Google presque épuisé : les derniers envois sont gardés pour les alertes";
  }
  return null;
}

/**
 * Envoie l'e-mail de récapitulatif au client et note « oui » / « non » dans la colonne
 * « E-mail envoyé ». Renvoie null si l'e-mail est parti, sinon la raison de l'échec.
 * Ne lève jamais d'erreur : la commande est déjà enregistrée.
 */
function confirmerAuClient(c, id, feuille, ligne) {
  let echec = null;
  try {
    echec = envoiClientBloque();
    if (!echec) {
      const { objet, texte, html } = emailClient(c, id);
      const options = { to: c.client.email, subject: objet, body: texte, htmlBody: html, name: "Dedjo" };
      const jo = adresseJo();
      if (jo) options.replyTo = jo;
      MailApp.sendEmail(options);
      noterEmailClient();
    }
  } catch (err) {
    // Le message d'erreur de Google peut contenir l'adresse : on la masque (journaux et Telegram)
    echec = String((err && err.message) || err).split(c.client.email).join("[adresse du client]");
  }
  if (echec) console.error(`E-mail de récapitulatif de la commande ${id} non envoyé : ${echec}`);
  try {
    feuille.getRange(ligne, COLONNE_EMAIL).setValue(echec ? "non" : "oui");
  } catch (err) {
    console.error("Impossible de remplir la colonne « E-mail envoyé » :", err);
  }
  return echec;
}

/* ===================================================================
   BOUTON « CONFIRMER SUR WHATSAPP »
   =================================================================== */

/** Numéro au format international sans « + » ni espaces : 06 12 34 56 78 → 33612345678. */
function numeroWhatsApp(tel) {
  const brut = String(tel).trim();
  const chiffres = brut.replace(/\D/g, "");
  if (brut.startsWith("+")) return chiffres; // +33 6 12… → 33612…
  if (chiffres.startsWith("00")) return chiffres.slice(2); // 0033 6 12… → 33612…
  if (chiffres.length === 10 && chiffres.startsWith("0")) return `33${chiffres.slice(1)}`; // 06 12… → 33612…
  return chiffres;
}

/** Lien wa.me avec le message de confirmation prérempli, ou null si le numéro est inutilisable. */
function lienWhatsApp(c, id) {
  const numero = numeroWhatsApp(c.client.tel);
  if (numero.length < 8 || numero.length > 15) return null;
  const message =
    `Salut ${c.client.prenom}, c'est Jo de Dedjo ! Ta commande ${id} (${resumeProduits(c)}, ${euros(c.total)}) ` +
    `est confirmée pour le ${c.dateLettres} (${c.secteur.mode}). À bientôt !`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
}

/* ===================================================================
   NOTIFICATION TELEGRAM (e-mail de secours en cas d'échec)
   =================================================================== */

/** Lignes du résumé, en texte brut : [libellé, valeur]. Partagées par Telegram et l'e-mail de secours. */
function resumer(c, echecEmail) {
  const lignes = [
    ["👤", c.client.prenom],
    ["📞", c.client.tel],
    ["🧺", resumeProduits(c)],
    ["💶", `Total : ${euros(c.total)}${c.frais ? ` (dont ${euros(c.frais)} de livraison)` : ""}`],
    ["📍", c.adresse ? `${c.adresse.codePostal} ${c.adresse.ville}` : "Retrait au marché (Savoie)"],
    ["🗓️", c.creneau],
  ];
  if (c.message) lignes.push(["💬", c.message]);
  // L'adresse e-mail du client n'est pas recopiée ici (minimisation) : elle est dans le Sheet
  if (echecEmail === null) lignes.push(["✉️", "Récapitulatif envoyé au client"]);
  else if (echecEmail) lignes.push(["⚠️", `Récapitulatif NON envoyé au client : ${echecEmail}`]);
  return lignes;
}

/** Notifie la commande. Ne lève jamais d'erreur : la commande est déjà enregistrée. */
function notifier(c, id, urlFeuille, echecEmail) {
  let echec;
  try {
    echec = envoyerTelegram(c, id, urlFeuille, echecEmail);
  } catch (err) {
    echec = `exception : ${err}`;
  }
  if (!echec) return;
  console.error(`Notification Telegram impossible (${echec}) : envoi de l'e-mail de secours.`);
  try {
    envoyerEmailSecours(c, id, urlFeuille, echec, echecEmail);
  } catch (err) {
    console.error("E-mail de secours impossible aussi (la commande est bien enregistrée) :", err);
  }
}

/** Envoie le message Telegram. Renvoie null si tout va bien, sinon la raison de l'échec. */
function envoyerTelegram(c, id, urlFeuille, echecEmail) {
  const proprietes = PropertiesService.getScriptProperties();
  const jeton = (proprietes.getProperty("TELEGRAM_TOKEN") || "").trim();
  const chatId = (proprietes.getProperty("TELEGRAM_CHAT_ID") || "").trim();
  if (!jeton || !chatId) return "TELEGRAM_TOKEN ou TELEGRAM_CHAT_ID non défini";

  const texteHtml = [`<b>🥐 Commande ${echapper(id)}</b>`]
    .concat(resumer(c, echecEmail).map(([icone, valeur]) => `${icone} ${echapper(valeur)}`))
    .join("\n");

  const boutons = [[{ text: "Ouvrir le Sheet", url: urlFeuille }]];
  const whatsapp = lienWhatsApp(c, id);
  if (whatsapp) boutons.push([{ text: "Confirmer sur WhatsApp", url: whatsapp }]);

  const reponse = UrlFetchApp.fetch(`https://api.telegram.org/bot${jeton}/sendMessage`, {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({
      chat_id: chatId,
      text: texteHtml,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: boutons },
    }),
  });

  let resultat = null;
  try {
    resultat = JSON.parse(reponse.getContentText());
  } catch (err) {
    // réponse illisible : traitée ci-dessous
  }
  if (reponse.getResponseCode() === 200 && resultat && resultat.ok) return null;
  const detail = (resultat && resultat.description) || reponse.getContentText().slice(0, 200);
  return `HTTP ${reponse.getResponseCode()} : ${detail}`;
}

/** E-mail de secours, en texte brut, avec le même contenu que la notification. */
function envoyerEmailSecours(c, id, urlFeuille, raison, echecEmail) {
  const destinataire = adresseJo();
  if (!destinataire) throw new Error("aucune adresse pour l'e-mail de secours");
  const whatsapp = lienWhatsApp(c, id);
  MailApp.sendEmail({
    to: destinataire,
    subject: `🥐 Commande ${id} (notification Telegram en échec)`,
    body: [`Commande ${id}`, ""]
      .concat(resumer(c, echecEmail).map(([icone, valeur]) => `${icone} ${valeur}`))
      .concat(["", `Ouvrir le Sheet : ${urlFeuille}`])
      .concat(whatsapp ? [`Confirmer sur WhatsApp : ${whatsapp}`] : [])
      .concat(["", `La notification Telegram n'est pas partie : ${raison}`])
      .join("\n"),
  });
}

/* ===================================================================
   TEST DEPUIS L'ÉDITEUR
   • testNotification : envoie un message Telegram d'exemple, sans rien écrire dans le Sheet
     (en cas d'échec, l'e-mail de secours part : utile pour tester les deux).
   • testEmailClient : t'envoie l'e-mail de récapitulatif d'exemple, pour voir ce que reçoit le client.
   • testerCommande : passe une vraie commande de test (ligne dans le Sheet + notification).
     Supprimer ensuite la ligne de test (voir DEPLOIEMENT.md).
   Sélectionner la fonction dans la liste en haut de l'éditeur, puis ▶ Exécuter.
   =================================================================== */

/** Commande d'exemple pour les tests (rien n'est écrit dans le Sheet). */
function commandeExemple() {
  return {
    secteur: SECTEURS.marseille,
    client: { prenom: "Test <Dedjo> & Co", tel: "06 00 00 00 00", email: adresseJo() },
    lignes: [
      { produit: CATALOGUE[0], quantite: 1 },
      { produit: CATALOGUE[4], quantite: 1 },
    ],
    frais: LIVRAISON.frais,
    total: 2 * CATALOGUE[0].prix + LIVRAISON.frais,
    adresse: { ligne: "32 Avenue de la Croix Rouge", codePostal: "13013", ville: "Marseille" },
    dateLettres: "samedi 17 octobre",
    creneau: "samedi 17 octobre · livraison Marseille",
    message: "Message de test : les caractères < > & doivent s'afficher tels quels",
    cgvVersion: CGV_VERSIONS[CGV_VERSIONS.length - 1],
  };
}

function testNotification() {
  const exemple = commandeExemple();
  const url = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const echec = envoyerTelegram(exemple, "D-TEST", url, null);
  if (echec) {
    console.error(`Telegram : ${echec}. Envoi de l'e-mail de secours…`);
    envoyerEmailSecours(exemple, "D-TEST", url, echec, null);
    console.log("E-mail de secours envoyé.");
  } else {
    console.log("Message Telegram envoyé.");
  }
}

function testEmailClient() {
  const exemple = commandeExemple();
  const { objet, texte, html } = emailClient(exemple, "D-TEST");
  MailApp.sendEmail({ to: exemple.client.email, subject: objet, body: texte, htmlBody: html, name: "Dedjo", replyTo: adresseJo() });
  console.log(`E-mail de récapitulatif d'exemple envoyé à ${exemple.client.email}.`);
}

function testerCommande() {
  const samedi = new Date();
  samedi.setDate(samedi.getDate() + (((6 - samedi.getDay() + 7) % 7) || 7));
  const reponse = doPost({
    postData: {
      contents: JSON.stringify({
        secret: PropertiesService.getScriptProperties().getProperty("SHARED_SECRET"),
        website: "",
        secteur: "marseille",
        date: Utilities.formatDate(samedi, FUSEAU, "yyyy-MM-dd"),
        client: { prenom: "Test", nom: "Dedjo", tel: "06 00 00 00 00", email: adresseJo() },
        adresse: { ligne: "32 Avenue de la Croix Rouge", codePostal: "13013", ville: "Marseille", manuelle: false },
        message: "Commande de test : à supprimer",
        quantites: { lune: 1, montagne: 1 },
        cgvAcceptees: true,
        cgvVersion: CGV_VERSIONS[CGV_VERSIONS.length - 1],
      }),
    },
  });
  console.log(reponse.getContent());
}
