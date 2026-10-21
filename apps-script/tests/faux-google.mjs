/* Faux Google pour le script Apps Script : faux classeur en mémoire et faux services (Properties,
   Lock, Cache, Spreadsheet, Utilities, Mail…). Code.gs et Stock.gs y sont chargés ensemble dans un
   contexte vm, comme dans l'éditeur Apps Script. Sert aux tests (stock.test.mjs) et au serveur local
   de l'Atelier (serveur-local.mjs). Toutes les données sont inventées. */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";

export const CODE = readFileSync(new URL("../Code.gs", import.meta.url), "utf8");
export const STOCK = readFileSync(new URL("../Stock.gs", import.meta.url), "utf8");

export const SECRET_COMMANDES = "secret-commandes-invente-0123456789abcdef";
export const SECRET_STOCK = "secret-stock-invente-fedcba9876543210-xyz";
export const HEURE = 60 * 60 * 1000;

/** Copie « simple » d'un objet venu du contexte vm (sinon deepEqual compare aussi les prototypes). */
export const brut = (x) => JSON.parse(JSON.stringify(x));

/* ===================================================================
   FAUX CLASSEUR GOOGLE SHEETS
   Comme Sheets : un texte commençant par « ' » est gardé tel quel (sans l'apostrophe) ; sinon un
   texte qui ressemble à un nombre ou à une date est converti, et une formule est refusée.
   =================================================================== */

class FausseFeuille {
  constructor(nom, env) {
    this.nom = nom;
    this.env = env;
    this.lignes = [];
    this.casesACocher = new Set(); // « ligne:colonne » des cellules en case à cocher
    this.id = ++env.compteurFeuilles;
  }
  getName() {
    return this.nom;
  }
  getSheetId() {
    return this.id;
  }
  getLastRow() {
    for (let i = this.lignes.length; i > 0; i--) if (this.lignes[i - 1].some((v) => v !== "")) return i;
    return 0;
  }
  getRange(ligne, colonne, nbLignes = 1, nbColonnes = 1) {
    if (!(ligne >= 1 && colonne >= 1 && nbLignes >= 1 && nbColonnes >= 1)) throw new Error(`Plage invalide ${ligne},${colonne},${nbLignes},${nbColonnes}`);
    return new FausseZone(this, ligne, colonne, nbLignes, nbColonnes);
  }
  appendRow(valeurs) {
    this.ecrire(this.getLastRow() + 1, 1, [valeurs]);
  }
  setFrozenRows() {}
  convertir(v) {
    if (typeof v === "string") {
      if (v.startsWith("'")) return v.slice(1);
      if (/^[=]/.test(v)) throw new Error("Formule écrite dans le classeur");
      if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new this.env.DateCtx(`${v}T00:00:00`);
    }
    return v;
  }
  ecrire(ligne, colonne, valeurs) {
    valeurs.forEach((rang, i) =>
      rang.forEach((v, j) => {
        while (this.lignes.length < ligne + i) this.lignes.push([]);
        const r = this.lignes[ligne + i - 1];
        while (r.length < colonne + j) r.push("");
        r[colonne + j - 1] = this.convertir(v);
      })
    );
  }
  lire(ligne, colonne, nbLignes, nbColonnes) {
    return Array.from({ length: nbLignes }, (_, i) =>
      Array.from({ length: nbColonnes }, (_, j) => {
        const v = (this.lignes[ligne + i - 1] || [])[colonne + j - 1];
        return v === undefined ? "" : v;
      })
    );
  }
  /** Lignes lues comme des objets, selon les en-têtes de la ligne 1. */
  objets() {
    const [entetes, ...lignes] = this.lire(1, 1, this.getLastRow(), (this.lignes[0] || []).length);
    return lignes.map((l) => Object.fromEntries(entetes.map((e, i) => [e, l[i]])));
  }
}

class FausseZone {
  constructor(feuille, ligne, colonne, nbLignes, nbColonnes) {
    Object.assign(this, { feuille, ligne, colonne, nbLignes, nbColonnes });
  }
  getValues() {
    return this.feuille.lire(this.ligne, this.colonne, this.nbLignes, this.nbColonnes);
  }
  setValues(valeurs) {
    if (valeurs.length !== this.nbLignes || valeurs.some((r) => r.length !== this.nbColonnes)) throw new Error("Dimensions incorrectes");
    this.feuille.ecrire(this.ligne, this.colonne, valeurs);
    return this;
  }
  setValue(v) {
    this.feuille.ecrire(this.ligne, this.colonne, [[v]]);
    return this;
  }
  setFontWeight() {
    return this;
  }
  isChecked() {
    const cle = `${this.ligne}:${this.colonne}`;
    return this.feuille.casesACocher.has(cle) ? this.getValues()[0][0] === true : null;
  }
  check() {
    this.feuille.ecrire(this.ligne, this.colonne, [[true]]);
    return this;
  }
}

class FauxClasseur {
  constructor(nom, env) {
    this.nom = nom;
    this.env = env;
    this.id = `classeur-${++env.compteurClasseurs}`;
    this.feuilles = [];
  }
  getId() {
    return this.id;
  }
  getUrl() {
    return `https://exemple.test/${this.id}`;
  }
  getSheets() {
    return this.feuilles.slice();
  }
  getSheetByName(nom) {
    return this.feuilles.find((f) => f.nom === nom) || null;
  }
  insertSheet(nom) {
    const f = new FausseFeuille(nom, this.env);
    this.feuilles.push(f);
    return f;
  }
  deleteSheet(f) {
    this.feuilles = this.feuilles.filter((x) => x !== f);
  }
  setSpreadsheetTimeZone(fuseau) {
    this.fuseau = fuseau;
  }
}

/* ===================================================================
   FAUX SERVICES ET CHARGEMENT DES SCRIPTS
   =================================================================== */

function formatDate(date, fuseau, motif) {
  const parties = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: fuseau,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  return motif.replace(/yyyy|MM|dd|HH|mm|ss/g, (k) => ({ yyyy: parties.year, MM: parties.month, dd: parties.day, HH: parties.hour, mm: parties.minute, ss: parties.second })[k]);
}

export function creerEnvironnement() {
  const env = { compteurFeuilles: 0, compteurClasseurs: 0, ouvertures: 0, journaux: [], emails: [], verrouOccupe: false };
  const proprietes = new Map([["SHARED_SECRET", SECRET_COMMANDES], ["STOCK_SECRET", SECRET_STOCK]]);
  const cache = new Map();
  const classeurs = new Map();
  env.proprietes = proprietes;
  env.commandes = new FauxClasseur("Dedjo — Commandes", env);

  const services = {
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (proprietes.has(k) ? proprietes.get(k) : null),
        setProperty: (k, v) => proprietes.set(k, String(v)),
        deleteProperty: (k) => proprietes.delete(k),
      }),
    },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => {
          if (env.verrouOccupe) throw new Error("Lock timeout");
        },
        releaseLock: () => {},
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (cache.has(k) ? cache.get(k) : null),
        put: (k, v) => cache.set(k, v),
        getAll: (cles) => Object.fromEntries(cles.filter((k) => cache.has(k)).map((k) => [k, cache.get(k)])),
        putAll: (valeurs) => Object.entries(valeurs).forEach(([k, v]) => cache.set(k, v)),
      }),
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => env.commandes,
      openById: (id) => {
        env.ouvertures += 1;
        if (!classeurs.has(id)) throw new Error("Classeur introuvable");
        return classeurs.get(id);
      },
      create: (nom) => {
        const c = new FauxClasseur(nom, env);
        c.insertSheet("Feuille 1");
        classeurs.set(c.getId(), c);
        return c;
      },
      flush: () => {},
    },
    Utilities: {
      formatDate,
      computeDigest: (_algo, texte) => Array.from(createHash("sha256").update(String(texte), "utf8").digest(), (o) => (o > 127 ? o - 256 : o)),
      DigestAlgorithm: { SHA_256: "SHA_256" },
      Charset: { UTF_8: "UTF_8" },
    },
    ContentService: {
      createTextOutput: (texte) => ({ setMimeType() { return this; }, getContent: () => texte }),
      MimeType: { JSON: "application/json" },
    },
    MailApp: {
      sendEmail: (options) => env.emails.push(options),
      getRemainingDailyQuota: () => 100,
    },
    UrlFetchApp: {
      fetch: () => ({ getResponseCode: () => 200, getContentText: () => '{"ok":true}' }),
    },
    Session: { getEffectiveUser: () => ({ getEmail: () => "jo@exemple.test" }) },
    console: {
      log: (...a) => env.journaux.push(["log", a.join(" ")]),
      error: (...a) => env.journaux.push(["error", a.join(" ")]),
    },
  };

  const contexte = vm.createContext(services);
  vm.runInContext(CODE, contexte, { filename: "Code.gs" });
  vm.runInContext(STOCK, contexte, { filename: "Stock.gs" });
  env.DateCtx = vm.runInContext("Date", contexte);
  env.ctx = contexte;
  env.regles = vm.runInContext("StockRegles", contexte);
  env.stock = () => classeurs.get(proprietes.get("STOCK_SPREADSHEET_ID"));
  /** Vrai si une valeur du cache contient ce texte (pour vérifier qu'aucune donnée client n'y est gardée). */
  env.cacheContient = (texte) => Array.from(cache.values()).some((v) => String(v).includes(texte));
  env.onglet = (nom) => env.stock().getSheetByName(nom).objets();

  /** Appel d'une action « stock.* » comme le fera Netlify : POST JSON vers doPost. */
  let compteur = 0;
  env.appeler = (action, champs = {}) => {
    const corps = Object.assign({ action, secret: SECRET_STOCK }, champs);
    if (!("idOperation" in corps)) corps.idOperation = `op-test-${String(++compteur).padStart(4, "0")}`;
    return JSON.parse(contexte.doPost({ postData: { contents: JSON.stringify(corps) } }).getContent());
  };
  env.operation = (type, champs = {}) => env.appeler("stock.operation", Object.assign({ type }, champs));
  env.dispo = () => env.appeler("stock.dispo").produits;
  /** Stock d'un article à un emplacement, d'après stock.etat. */
  env.quantite = (article, emplacement) => (env.appeler("stock.etat").stock[article] || {})[emplacement] || 0;
  /** Commande de test passée depuis l'éditeur (testerCommande), réponse du script. */
  env.testerCommande = () => {
    env.journaux.length = 0;
    contexte.testerCommande();
    return JSON.parse(env.journaux.find(([genre]) => genre === "log")[1]);
  };
  return env;
}

/** Environnement avec le classeur Stock initialisé. */
export function preparer() {
  const env = creerEnvironnement();
  env.ctx.initialiserStock();
  env.journaux.length = 0;
  return env;
}
