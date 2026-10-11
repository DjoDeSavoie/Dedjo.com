/**
 * DEDJO — Réception des commandes du site
 *
 * Appelé uniquement par la fonction Netlify netlify/functions/commande.ts (le navigateur ne
 * connaît pas l'URL de ce script). Pour chaque commande :
 *   1. vérifie le secret partagé, puis revalide toutes les données ;
 *   2. recalcule le total (prix ci-dessous, jamais ceux envoyés par le navigateur) ;
 *   3. ajoute une ligne dans l'onglet « Commandes » du Google Sheet ;
 *   4. envoie une notification Telegram ; en cas d'échec, un e-mail de secours (l'enregistrement
 *      n'est jamais remis en cause) ;
 *   5. renvoie { ok: true, id } ou { ok: false, error }.
 *
 * Propriétés du script (Paramètres du projet ⚙️ > Propriétés du script) :
 *   SHARED_SECRET   obligatoire : même valeur que ORDER_SHARED_SECRET sur Netlify
 *   TELEGRAM_TOKEN    jeton du bot donné par @BotFather (123456789:AA…)
 *   TELEGRAM_CHAT_ID  identifiant de ta conversation avec le bot (obtenu via getUpdates)
 *   ALERT_EMAIL       facultatif : adresse de l'e-mail de secours (par défaut, celle du compte
 *                     Google qui exécute le script)
 *   DERNIER_NUMERO  géré automatiquement (dernier n° de commande attribué)
 *
 * ⚠️ Les prix, pièces par sachet, frais et seuil de livraison et les jours des secteurs sont
 *    recopiés de src/lib/catalog.ts. Toute modification doit être faite aux deux endroits, puis
 *    redéployée : Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version.
 *
 * Mode d'emploi complet : apps-script/DEPLOIEMENT.md
 */

const CATALOGUE = [
  { id: "lune", nom: "La Lune", pieces: 6, prix: 10 },
  { id: "cabosse", nom: "La Cabosse", pieces: 6, prix: 10 },
  { id: "grappe", nom: "La Grappe", pieces: 4, prix: 10 },
  { id: "rose", nom: "La Rose", pieces: 4, prix: 10 },
  { id: "montagne", nom: "La Montagne", pieces: 2, prix: 10 },
  { id: "foret", nom: "La Forêt", pieces: 2, prix: 10 },
  { id: "noix", nom: "La Noix", pieces: 2, prix: 10 },
  { id: "goet", nom: "La Goët", pieces: 2, prix: 10 },
];

// Livraison (Marseille) : frais en dessous du seuil, offerte à partir du seuil (en sachets)
const LIVRAISON = { offerteDes: 3, frais: 5 };

// jour : 0 = dimanche … 5 = vendredi, 6 = samedi
const SECTEURS = {
  savoie: { nom: "Savoie", jour: 5, livraison: false, mode: "retrait Savoie" },
  marseille: { nom: "Marseille et alentours", jour: 6, livraison: true, mode: "livraison Marseille" },
};

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
];

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
    const { id, url } = enregistrer(commande);
    notifier(commande, id, url);
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

function valider(data) {
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
  const prenom = texte(client.prenom, "Prénom", { requis: true, max: 80 });
  const nom = texte(client.nom, "Nom", { requis: true, max: 80 });
  const tel = texte(client.tel, "Téléphone", { requis: true, max: 25 });
  if (!/^\+?[\d\s.()-]+$/.test(tel) || tel.replace(/\D/g, "").length < 6) {
    throw new ErreurCommande("Numéro de téléphone invalide.");
  }
  const email = texte(client.email, "Email", { max: 120 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ErreurCommande("Adresse email invalide.");
  const message = texte(data.message, "Message", { max: 1000 });

  // Adresse : obligatoire pour une livraison, ignorée pour un retrait
  let adresse = null;
  if (secteur.livraison) {
    const a = data.adresse || {};
    adresse = {
      ligne: texte(a.ligne, "Adresse", { requis: true, max: 200 }),
      codePostal: texte(a.codePostal, "Code postal", { requis: true, max: 5 }),
      ville: texte(a.ville, "Ville", { requis: true, max: 80 }),
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

  return {
    secteur,
    client: { prenom, nom, tel, email },
    adresse,
    message,
    lignes,
    sachets,
    frais,
    total: sousTotal + frais,
    creneau: `${JOURS[jourDate.getUTCDay()]} ${jourDate.getUTCDate()} ${MOIS[jourDate.getUTCMonth()]} · ${secteur.mode}`,
  };
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
    ]);
    SpreadsheetApp.flush();
    proprietes.setProperty("DERNIER_NUMERO", String(numero));

    return { id, url: `${classeur.getUrl()}#gid=${feuille.getSheetId()}` };
  } finally {
    verrou.releaseLock();
  }
}

/* ===================================================================
   NOTIFICATION TELEGRAM (e-mail de secours en cas d'échec)
   =================================================================== */

function euros(n) {
  return Number.isInteger(n) ? `${n} €` : `${n.toFixed(2).replace(".", ",")} €`;
}

/** Échappe les caractères spéciaux du mode HTML de Telegram (&, <, >). */
function echapper(valeur) {
  return String(valeur).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Lignes du résumé, en texte brut : [libellé, valeur]. Partagées par Telegram et l'e-mail. */
function resumer(c) {
  const produits = c.lignes
    .filter((l) => l.quantite > 0)
    .map((l) => `${l.quantite}× ${l.produit.nom}`)
    .join(", ");
  const lignes = [
    ["👤", c.client.prenom],
    ["📞", c.client.tel],
    ["🧺", produits],
    ["💶", `Total : ${euros(c.total)}${c.frais ? ` (dont ${euros(c.frais)} de livraison)` : ""}`],
    ["📍", c.adresse ? `${c.adresse.codePostal} ${c.adresse.ville}` : "Retrait au marché (Savoie)"],
    ["🗓️", c.creneau],
  ];
  if (c.message) lignes.push(["💬", c.message]);
  return lignes;
}

/** Notifie la commande. Ne lève jamais d'erreur : la commande est déjà enregistrée. */
function notifier(c, id, urlFeuille) {
  let echec;
  try {
    echec = envoyerTelegram(c, id, urlFeuille);
  } catch (err) {
    echec = `exception : ${err}`;
  }
  if (!echec) return;
  console.error(`Notification Telegram impossible (${echec}) : envoi de l'e-mail de secours.`);
  try {
    envoyerEmailSecours(c, id, urlFeuille, echec);
  } catch (err) {
    console.error("E-mail de secours impossible aussi (la commande est bien enregistrée) :", err);
  }
}

/** Envoie le message Telegram. Renvoie null si tout va bien, sinon la raison de l'échec. */
function envoyerTelegram(c, id, urlFeuille) {
  const proprietes = PropertiesService.getScriptProperties();
  const jeton = (proprietes.getProperty("TELEGRAM_TOKEN") || "").trim();
  const chatId = (proprietes.getProperty("TELEGRAM_CHAT_ID") || "").trim();
  if (!jeton || !chatId) return "TELEGRAM_TOKEN ou TELEGRAM_CHAT_ID non défini";

  const texteHtml = [`<b>🥐 Commande ${echapper(id)}</b>`]
    .concat(resumer(c).map(([icone, valeur]) => `${icone} ${echapper(valeur)}`))
    .join("\n");

  const reponse = UrlFetchApp.fetch(`https://api.telegram.org/bot${jeton}/sendMessage`, {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({
      chat_id: chatId,
      text: texteHtml,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: [[{ text: "Ouvrir le Sheet", url: urlFeuille }]] },
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
function envoyerEmailSecours(c, id, urlFeuille, raison) {
  const destinataire =
    (PropertiesService.getScriptProperties().getProperty("ALERT_EMAIL") || "").trim() ||
    Session.getEffectiveUser().getEmail();
  if (!destinataire) throw new Error("aucune adresse pour l'e-mail de secours");
  MailApp.sendEmail({
    to: destinataire,
    subject: `🥐 Commande ${id} (notification Telegram en échec)`,
    body: [`Commande ${id}`, ""]
      .concat(resumer(c).map(([icone, valeur]) => `${icone} ${valeur}`))
      .concat(["", `Ouvrir le Sheet : ${urlFeuille}`, "", `La notification Telegram n'est pas partie : ${raison}`])
      .join("\n"),
  });
}

/* ===================================================================
   TEST DEPUIS L'ÉDITEUR
   • testNotification : envoie un message Telegram d'exemple, sans rien écrire dans le Sheet
     (en cas d'échec, l'e-mail de secours part : utile pour tester les deux).
   • testerCommande : passe une vraie commande de test (ligne dans le Sheet + notification).
     Supprimer ensuite la ligne de test (voir DEPLOIEMENT.md).
   Sélectionner la fonction dans la liste en haut de l'éditeur, puis ▶ Exécuter.
   =================================================================== */

function testNotification() {
  const exemple = {
    client: { prenom: "Test <Dedjo> & Co", tel: "06 00 00 00 00" },
    lignes: [
      { produit: CATALOGUE[0], quantite: 1 },
      { produit: CATALOGUE[4], quantite: 1 },
    ],
    frais: LIVRAISON.frais,
    total: 2 * CATALOGUE[0].prix + LIVRAISON.frais,
    adresse: { codePostal: "13013", ville: "Marseille" },
    creneau: "samedi 17 octobre · livraison Marseille",
    message: "Message de test : les caractères < > & doivent s'afficher tels quels",
  };
  const url = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  const echec = envoyerTelegram(exemple, "D-TEST", url);
  if (echec) {
    console.error(`Telegram : ${echec}. Envoi de l'e-mail de secours…`);
    envoyerEmailSecours(exemple, "D-TEST", url, echec);
    console.log("E-mail de secours envoyé.");
  } else {
    console.log("Message Telegram envoyé.");
  }
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
        client: { prenom: "Test", nom: "Dedjo", tel: "06 00 00 00 00", email: "" },
        adresse: { ligne: "32 Avenue de la Croix Rouge", codePostal: "13013", ville: "Marseille", manuelle: false },
        message: "Commande de test : à supprimer",
        quantites: { lune: 1, montagne: 1 },
      }),
    },
  });
  console.log(reponse.getContent());
}
