/* Atelier (stock privé) : logique commune aux fonctions Netlify
     netlify/functions/atelier-connexion.ts    POST /api/atelier-connexion    code d'accès → cookie de session
     netlify/functions/atelier-deconnexion.ts  POST /api/atelier-deconnexion  efface le cookie
     netlify/functions/atelier.ts              POST /api/atelier              relais vers les actions « stock.* » du script
     netlify/functions/dispo.ts                GET  /api/dispo                public : statut de chaque produit, rien d'autre

   Variables d'environnement (lues côté serveur, jamais envoyées au navigateur) :
     GSHEET_ORDER_WEBHOOK_URL  URL /exec du script Apps Script (la même que pour les commandes)
     STOCK_SHARED_SECRET       même valeur que la propriété STOCK_SECRET du script
     STOCK_ACCESS_CODE         code d'accès à l'Atelier (16 caractères au moins)
     STOCK_SESSION_SECRET      signe les cookies de session (32 caractères au moins) ;
                               le changer déconnecte tous les appareils

   Journaux : jamais de quantité, de lot, de montant ni de code saisi ; une erreur n'y laisse
   qu'un message générique et un code. Les gestionnaires reçoivent leurs dépendances (variables,
   compteur de tentatives, fetch, IP, heure) : netlify/tests/atelier.test.mjs les teste sans Netlify. */

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type Env = Record<string, string | undefined>;

export interface Compteur {
  debut: number;
  n: number;
}

/** Compteur d'échecs de connexion par visiteur (Netlify Blobs en production). */
export interface MagasinTentatives {
  get(cle: string): Promise<Compteur | null>;
  set(cle: string, compteur: Compteur): Promise<void>;
  delete(cle: string): Promise<void>;
}

export interface Dependances {
  env: Env;
  /** IP du visiteur donnée par Netlify (context.ip), si l'en-tête x-nf-client-connection-ip manque. */
  ip?: string;
  maintenant?: number;
  fetch?: typeof fetch;
  tentatives?: MagasinTentatives;
}

export const COOKIE = "dedjo_atelier";
const DUREE_SESSION_S = 30 * 24 * 60 * 60; // 30 jours
// 5 échecs par tranche de 15 minutes et par visiteur ; au-delà, même le bon code est refusé
export const TENTATIVES = { max: 5, fenetreMs: 15 * 60 * 1000 };
const DELAI_SCRIPT_MS = 20_000;
const TAILLE_MAX_CONNEXION = 2_000; // caractères
const TAILLE_MAX_ATELIER = 1_000_000; // une reprise CSV peut être longue

// Seules ces actions du script passent par le relais ; stock.dispo a sa propre route publique
export const ACTIONS_ATELIER = [
  "stock.etat",
  "stock.lot",
  "stock.journal",
  "stock.operation",
  "stock.annuler",
  "stock.passage",
  "stock.encaissement",
  "stock.commande",
  "stock.catalogue",
  "stock.import",
];
const STATUTS = ["disponible", "victime", "bientot"];

const ENTETES_PRIVES: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

/** Réponse d'une route /api/atelier* : jamais mise en cache, jamais indexée. */
export const repondrePrive = (statut: number, corps: object, entetes: Record<string, string> = {}) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { ...ENTETES_PRIVES, ...entetes } });

/** Erreur journalisée sans aucune donnée : un message générique et un code, rappelé au navigateur. */
function journaliser(prefixe: string, message: string): string {
  const code = `${prefixe}-${Date.now().toString(36).slice(-6).toUpperCase()}`;
  console.error(`Atelier ${code} : ${message}`);
  return code;
}

/* ===================================================================
   SESSION : cookie signé, code d'accès comparé en temps constant
   =================================================================== */

const signer = (charge: string, secret: string) => createHmac("sha256", secret).update(charge).digest("base64url");

/** Jeton de session : charge utile { exp } en base64url, puis sa signature HMAC-SHA256. */
export function creerJeton(secret: string, maintenant: number): string {
  const charge = Buffer.from(JSON.stringify({ exp: Math.floor(maintenant / 1000) + DUREE_SESSION_S })).toString("base64url");
  return `${charge}.${signer(charge, secret)}`;
}

export function jetonValide(jeton: string | null, secret: string, maintenant: number): boolean {
  if (!jeton || jeton.length > 500) return false;
  const morceaux = jeton.split(".");
  if (morceaux.length !== 2 || !morceaux[0] || !morceaux[1]) return false;
  const attendue = Buffer.from(signer(morceaux[0], secret));
  const recue = Buffer.from(morceaux[1]);
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(morceaux[0], "base64url").toString("utf8"));
    return typeof exp === "number" && exp * 1000 > maintenant;
  } catch {
    return false;
  }
}

export function lireCookie(req: Request, nom: string): string | null {
  for (const morceau of (req.headers.get("cookie") || "").split(";")) {
    const egal = morceau.indexOf("=");
    if (egal !== -1 && morceau.slice(0, egal).trim() === nom) return morceau.slice(egal + 1).trim();
  }
  return null;
}

const cookieSession = (jeton: string) => `${COOKIE}=${jeton}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${DUREE_SESSION_S}`;
const COOKIE_EFFACE = `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;

/** Code d'accès comparé en temps constant, sur des empreintes SHA-256 (même longueur pour tout code). */
export function codeCorrect(saisi: string, attendu: string): boolean {
  const a = createHash("sha256").update(saisi, "utf8").digest();
  const b = createHash("sha256").update(attendu, "utf8").digest();
  return timingSafeEqual(a, b);
}

/** Empreinte de l'IP, calculée comme dans commande.ts : HMAC-SHA256 tronqué, l'IP n'est pas conservée. */
export function empreinteIp(req: Request, ip: string | undefined, secret: string): string {
  const adresse = req.headers.get("x-nf-client-connection-ip") || ip || "";
  return adresse ? createHmac("sha256", secret).update(adresse).digest("hex").slice(0, 32) : "inconnue";
}

const secretSession = (env: Env) => {
  const secret = env.STOCK_SESSION_SECRET || "";
  return secret.length >= 32 ? secret : "";
};

export const sessionValide = (req: Request, env: Env, maintenant: number) => {
  const secret = secretSession(env);
  return !!secret && jetonValide(lireCookie(req, COOKIE), secret, maintenant);
};

/** En-tête exigé sur chaque POST de l'Atelier : défense CSRF en plus de SameSite=Strict. */
const enTeteAtelier = (req: Request) => req.headers.get("x-atelier") === "1";

async function lireCorps(req: Request, max: number): Promise<Record<string, unknown> | null> {
  const texte = await req.text();
  if (!texte || texte.length > max) return null;
  try {
    const donnees = JSON.parse(texte);
    return donnees && typeof donnees === "object" && !Array.isArray(donnees) ? donnees : null;
  } catch {
    return null;
  }
}

/* ===================================================================
   APPEL DU SCRIPT APPS SCRIPT
   =================================================================== */

class ErreurRelais extends Error {
  statut: number;
  prefixe: string;
  journal: string;
  constructor(statut: number, prefixe: string, journal: string, message: string) {
    super(message);
    this.statut = statut;
    this.prefixe = prefixe;
    this.journal = journal;
  }
}

type ReponseScript = Record<string, unknown>;

/** Appelle une action du script avec le secret du stock. Le secret et l'action ne viennent jamais du navigateur. */
async function appelerScript(d: Dependances, action: string, champs: Record<string, unknown>): Promise<ReponseScript> {
  const url = d.env.GSHEET_ORDER_WEBHOOK_URL;
  const secret = d.env.STOCK_SHARED_SECRET;
  if (!url || !secret) {
    throw new ErreurRelais(503, "ATL-CONF", "GSHEET_ORDER_WEBHOOK_URL ou STOCK_SHARED_SECRET manquant", "Le stock n'est pas encore configuré.");
  }
  let res: Response;
  try {
    // Apps Script répond par une redirection vers la page de résultat : fetch la suit
    res = await (d.fetch || fetch)(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...champs, action, secret }),
      redirect: "follow",
      signal: AbortSignal.timeout(DELAI_SCRIPT_MS),
    });
  } catch (e) {
    const nom = e instanceof Error ? e.name : "";
    if (nom === "TimeoutError" || nom === "AbortError") {
      throw new ErreurRelais(504, "ATL-DELAI", "le script ne répond pas à temps", "Le stock met trop de temps à répondre.");
    }
    throw new ErreurRelais(502, "ATL-RESEAU", "script injoignable", "Le stock est injoignable.");
  }
  const texte = await res.text();
  let reponse: unknown = null;
  try {
    reponse = JSON.parse(texte);
  } catch {
    // traité ci-dessous
  }
  if (!reponse || typeof reponse !== "object" || Array.isArray(reponse)) {
    // Le contenu de la réponse n'est pas journalisé : il pourrait contenir des données de stock
    throw new ErreurRelais(502, "ATL-REPONSE", `réponse inattendue du script (HTTP ${res.status})`, "Le stock a répondu de façon inattendue.");
  }
  if ((reponse as ReponseScript).ok !== true && (reponse as ReponseScript).error === "Accès refusé.") {
    throw new ErreurRelais(502, "ATL-SECRET", "le script refuse STOCK_SHARED_SECRET", "Le script refuse l'accès au stock : vérifie STOCK_SHARED_SECRET.");
  }
  return reponse as ReponseScript;
}

function reponseErreur(e: unknown): Response {
  if (e instanceof ErreurRelais) {
    const code = journaliser(e.prefixe, e.journal);
    return repondrePrive(e.statut, { ok: false, error: `${e.message} (${code})` });
  }
  const code = journaliser("ATL", `erreur interne (${e instanceof Error ? e.name : "inconnue"})`);
  return repondrePrive(500, { ok: false, error: `Erreur interne (${code}).` });
}

/* ===================================================================
   GESTIONNAIRES DES ROUTES
   =================================================================== */

/** POST /api/atelier-connexion { code } → cookie de session, avec 5 échecs au plus par 15 minutes. */
export async function traiterConnexion(req: Request, d: Dependances): Promise<Response> {
  if (req.method !== "POST") return repondrePrive(405, { ok: false }, { Allow: "POST" });
  if (!enTeteAtelier(req)) return repondrePrive(403, { ok: false });
  const attendu = d.env.STOCK_ACCESS_CODE || "";
  const secret = secretSession(d.env);
  if (attendu.length < 16 || !secret || !d.tentatives) {
    const code = journaliser("ATL-CONF", "STOCK_ACCESS_CODE (16 caractères au moins) ou STOCK_SESSION_SECRET (32 au moins) manquant");
    return repondrePrive(503, { ok: false, error: `L'Atelier n'est pas encore configuré (${code}).` });
  }
  const corps = await lireCorps(req, TAILLE_MAX_CONNEXION);
  const saisi = corps && typeof corps.code === "string" ? corps.code : "";
  const maintenant = d.maintenant ?? Date.now();
  const cle = `connexion-${empreinteIp(req, d.ip, secret)}`;
  try {
    let compteur = await d.tentatives.get(cle);
    if (!compteur || typeof compteur.debut !== "number" || typeof compteur.n !== "number" || maintenant - compteur.debut >= TENTATIVES.fenetreMs) {
      compteur = { debut: maintenant, n: 0 };
    }
    if (compteur.n >= TENTATIVES.max) {
      return repondrePrive(429, { ok: false, error: "Trop d'essais, réessaie dans quelques minutes." });
    }
    if (!saisi || saisi.length > 200 || !codeCorrect(saisi, attendu)) {
      await d.tentatives.set(cle, { debut: compteur.debut, n: compteur.n + 1 });
      return repondrePrive(401, { ok: false, error: "Code incorrect." });
    }
    if (compteur.n > 0) await d.tentatives.delete(cle);
  } catch {
    // Compteur illisible : on refuse plutôt que de laisser essayer sans limite
    const code = journaliser("ATL-BLOBS", "compteur de tentatives indisponible");
    return repondrePrive(503, { ok: false, error: `Connexion impossible pour le moment (${code}).` });
  }
  return repondrePrive(200, { ok: true }, { "Set-Cookie": cookieSession(creerJeton(secret, maintenant)) });
}

/** POST /api/atelier-deconnexion → efface le cookie de cet appareil. */
export function traiterDeconnexion(req: Request): Response {
  if (req.method !== "POST") return repondrePrive(405, { ok: false }, { Allow: "POST" });
  if (!enTeteAtelier(req)) return repondrePrive(403, { ok: false });
  return repondrePrive(200, { ok: true }, { "Set-Cookie": COOKIE_EFFACE });
}

/** POST /api/atelier { action, … } → action « stock.* » de la liste blanche, avec session valide. */
export async function traiterAtelier(req: Request, d: Dependances): Promise<Response> {
  if (!sessionValide(req, d.env, d.maintenant ?? Date.now())) return repondrePrive(401, { ok: false });
  if (req.method !== "POST") return repondrePrive(405, { ok: false }, { Allow: "POST" });
  if (!enTeteAtelier(req)) return repondrePrive(403, { ok: false });
  const corps = await lireCorps(req, TAILLE_MAX_ATELIER);
  if (!corps) return repondrePrive(400, { ok: false, error: "Requête invalide." });
  const action = typeof corps.action === "string" ? corps.action : "";
  if (!ACTIONS_ATELIER.includes(action)) return repondrePrive(400, { ok: false, error: "Action inconnue." });
  try {
    const reponse = await appelerScript(d, action, corps);
    if (reponse.ok === true) return repondrePrive(200, reponse);
    // Refus métier du script (stock insuffisant, annulation impossible…) : message renvoyé tel quel
    return repondrePrive(422, { ok: false, error: typeof reponse.error === "string" ? reponse.error : "Opération refusée." });
  } catch (e) {
    return reponseErreur(e);
  }
}

/** Ne garde que les statuts connus, pour des identifiants de produit : aucun nombre ne peut passer. */
export function filtrerStatuts(produits: unknown): Record<string, string> {
  const resultat: Record<string, string> = {};
  if (!produits || typeof produits !== "object" || Array.isArray(produits)) return resultat;
  for (const [id, statut] of Object.entries(produits)) {
    if (/^[a-z][a-z0-9-]{0,39}$/.test(id) && typeof statut === "string" && STATUTS.includes(statut)) resultat[id] = statut;
  }
  return resultat;
}

// Cache d'une minute sur le CDN de Netlify (durable : partagé entre ses serveurs) ;
// le navigateur revalide à chaque fois
const CACHE_DISPO = {
  "Netlify-CDN-Cache-Control": "public, durable, max-age=60",
  "Cache-Control": "public, max-age=0, must-revalidate",
};
const SANS_CACHE = { "Cache-Control": "no-store" };

const repondreJson = (statut: number, corps: object, entetes: Record<string, string>) =>
  new Response(JSON.stringify(corps), { status: statut, headers: { "Content-Type": "application/json; charset=utf-8", ...entetes } });

/**
 * GET /api/dispo, public : { actif: true, maj, produits: { lune: "disponible" | "victime" | "bientot", … } },
 * ou { actif: false } tant que STOCK_ACTIF n'est pas à « oui » dans le script (le site garde alors
 * sa disponibilité de secours). Jamais de quantité, de lot, de date ni rien sur la ferme.
 */
export async function traiterDispo(req: Request, d: Dependances): Promise<Response> {
  if (req.method !== "GET" && req.method !== "HEAD") return repondreJson(405, { actif: false }, { ...SANS_CACHE, Allow: "GET" });
  // Pas de paramètre : chaque variante de l'adresse contournerait le cache et appellerait le script
  if (new URL(req.url).search) return repondreJson(400, { actif: false }, SANS_CACHE);
  try {
    const reponse = await appelerScript(d, "stock.dispo", {});
    if (reponse.ok !== true) throw new ErreurRelais(502, "DSP", "le script refuse stock.dispo", "");
    if (reponse.actif !== true) return repondreJson(200, { actif: false }, CACHE_DISPO);
    const maj =
      typeof reponse.maj === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(reponse.maj)
        ? reponse.maj
        : new Date(d.maintenant ?? Date.now()).toISOString();
    return repondreJson(200, { actif: true, maj, produits: filtrerStatuts(reponse.produits) }, CACHE_DISPO);
  } catch (e) {
    journaliser("DSP", e instanceof ErreurRelais ? e.journal : "erreur interne");
    return repondreJson(503, { actif: false }, SANS_CACHE);
  }
}

/** Adapte un magasin Netlify Blobs (getStore) au compteur de tentatives. */
export function magasinBlobs(store: {
  get(cle: string, options: { type: "json" }): Promise<unknown>;
  setJSON(cle: string, valeur: unknown): Promise<unknown>;
  delete(cle: string): Promise<unknown>;
}): MagasinTentatives {
  return {
    get: async (cle) => (await store.get(cle, { type: "json" })) as Compteur | null,
    set: async (cle, compteur) => {
      await store.setJSON(cle, compteur);
    },
    delete: async (cle) => {
      await store.delete(cle);
    },
  };
}
