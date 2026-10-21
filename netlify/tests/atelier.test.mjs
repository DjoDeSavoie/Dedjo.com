/* Tests des routes de l'Atelier (netlify/lib/atelier.ts), sans Netlify ni dépendance :
     node --test netlify/tests/atelier.test.mjs
   Node exécute directement le TypeScript de la bibliothèque. Le script Apps Script et Netlify Blobs
   sont remplacés par des faux en mémoire ; toutes les valeurs sont inventées. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COOKIE,
  TENTATIVES,
  creerJeton,
  jetonValide,
  traiterAtelier,
  traiterConnexion,
  traiterDeconnexion,
  traiterDispo,
} from "../lib/atelier.ts";

const ENV = {
  GSHEET_ORDER_WEBHOOK_URL: "https://script.exemple.test/exec",
  STOCK_SHARED_SECRET: "secret-stock-invente-0123456789abcdef",
  STOCK_ACCESS_CODE: "une phrase de passe inventee",
  STOCK_SESSION_SECRET: "secret-session-invente-0123456789abcdef0123",
};
const MINUTE = 60 * 1000;
const T0 = Date.UTC(2026, 9, 20, 8, 0, 0);

/** Faux magasin Netlify Blobs. */
function fauxMagasin() {
  const donnees = new Map();
  return {
    donnees,
    get: async (cle) => (donnees.has(cle) ? structuredClone(donnees.get(cle)) : null),
    set: async (cle, valeur) => void donnees.set(cle, structuredClone(valeur)),
    delete: async (cle) => void donnees.delete(cle),
  };
}

/** Faux script Apps Script : enregistre les appels, renvoie la réponse demandée. */
function fauxScript(reponse) {
  const appels = [];
  const fetch = async (url, options) => {
    appels.push({ url, corps: JSON.parse(options.body) });
    if (typeof reponse === "function") return reponse();
    return new Response(typeof reponse === "string" ? reponse : JSON.stringify(reponse), { status: 200 });
  };
  return { appels, fetch };
}

/** Capture console.error pendant `fn`. */
async function journaux(fn) {
  const lignes = [];
  const original = console.error;
  console.error = (...a) => lignes.push(a.join(" "));
  try {
    return { resultat: await fn(), lignes };
  } finally {
    console.error = original;
  }
}

const requete = (chemin, { methode = "POST", corps, entetes = {} } = {}) =>
  new Request(`https://dedjo.test${chemin}`, {
    method: methode,
    headers: entetes,
    body: corps === undefined ? undefined : typeof corps === "string" ? corps : JSON.stringify(corps),
  });

const connexion = (code, { ip = "203.0.113.7", magasin, maintenant = T0, env = ENV, entetes } = {}) =>
  traiterConnexion(
    requete("/api/atelier-connexion", { corps: { code }, entetes: entetes || { "X-Atelier": "1", "x-nf-client-connection-ip": ip } }),
    { env, tentatives: magasin, maintenant }
  );

const cookieValide = () => `${COOKIE}=${creerJeton(ENV.STOCK_SESSION_SECRET, T0)}`;

const atelier = (corps, { cookie = cookieValide(), methode = "POST", xAtelier = true, script, maintenant = T0 } = {}) => {
  const entetes = {};
  if (cookie) entetes.cookie = cookie;
  if (xAtelier) entetes["X-Atelier"] = "1";
  return traiterAtelier(requete("/api/atelier", { methode, corps: methode === "GET" ? undefined : corps, entetes }), {
    env: ENV,
    fetch: script ? script.fetch : undefined,
    maintenant,
  });
};

/* ===================================================================
   CONNEXION
   =================================================================== */

test("connexion : le bon code pose le cookie de session signé, pour 30 jours", async () => {
  const magasin = fauxMagasin();
  const res = await connexion(ENV.STOCK_ACCESS_CODE, { magasin });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  const cookie = res.headers.get("set-cookie");
  assert.match(cookie, /^dedjo_atelier=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+; HttpOnly; Secure; SameSite=Strict; Path=\/; Max-Age=2592000$/);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("x-robots-tag"), "noindex, nofollow");

  // Charge utile { exp } en base64url, valable 30 jours
  const jeton = cookie.split(";")[0].slice(COOKIE.length + 1);
  const { exp } = JSON.parse(Buffer.from(jeton.split(".")[0], "base64url").toString());
  assert.equal(exp, T0 / 1000 + 2592000);
  assert.equal(jetonValide(jeton, ENV.STOCK_SESSION_SECRET, T0 + 29 * 24 * 60 * MINUTE), true);
  assert.equal(jetonValide(jeton, ENV.STOCK_SESSION_SECRET, T0 + 31 * 24 * 60 * MINUTE), false);
});

test("connexion : « Code incorrect. », puis blocage au 6ᵉ essai en 15 minutes, même avec le bon code", async () => {
  const magasin = fauxMagasin();
  for (let i = 1; i <= TENTATIVES.max; i++) {
    const res = await connexion(`mauvais code numero ${i}`, { magasin, maintenant: T0 + i * MINUTE });
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { ok: false, error: "Code incorrect." });
    assert.equal(res.headers.get("set-cookie"), null);
  }
  const bloque = await connexion(ENV.STOCK_ACCESS_CODE, { magasin, maintenant: T0 + 6 * MINUTE });
  assert.equal(bloque.status, 429);
  assert.deepEqual(await bloque.json(), { ok: false, error: "Trop d'essais, réessaie dans quelques minutes." });
  assert.equal(bloque.headers.get("set-cookie"), null);

  // Un autre visiteur n'est pas bloqué
  assert.equal((await connexion(ENV.STOCK_ACCESS_CODE, { magasin, ip: "198.51.100.9", maintenant: T0 + 6 * MINUTE })).status, 200);
  // La tranche de 15 minutes passée, le visiteur peut réessayer
  assert.equal((await connexion(ENV.STOCK_ACCESS_CODE, { magasin, maintenant: T0 + 16 * MINUTE })).status, 200);

  // Le magasin ne garde qu'une empreinte : jamais l'IP ni le code saisi
  const contenu = JSON.stringify([...magasin.donnees]);
  assert.doesNotMatch(contenu, /203\.0\.113\.7|mauvais|phrase/);
});

test("connexion : en-tête X-Atelier exigé, POST seulement, configuration vérifiée, compteur indisponible = refus", async () => {
  const magasin = fauxMagasin();
  assert.equal((await connexion(ENV.STOCK_ACCESS_CODE, { magasin, entetes: {} })).status, 403);
  const get = await traiterConnexion(requete("/api/atelier-connexion", { methode: "GET" }), { env: ENV, tentatives: magasin });
  assert.equal(get.status, 405);

  const { resultat, lignes } = await journaux(() => connexion("x".repeat(20), { magasin, env: { ...ENV, STOCK_ACCESS_CODE: "trop court" } }));
  assert.equal(resultat.status, 503);
  assert.equal(lignes.length, 1);
  assert.doesNotMatch(lignes[0], /trop court/);

  const enPanne = { get: async () => { throw new Error("Blobs indisponible"); }, set: async () => {}, delete: async () => {} };
  const panne = await journaux(() => connexion(ENV.STOCK_ACCESS_CODE, { magasin: enPanne }));
  assert.equal(panne.resultat.status, 503);
  assert.equal(panne.resultat.headers.get("set-cookie"), null);
});

test("jeton : signature, secret et expiration vérifiés", () => {
  const jeton = creerJeton(ENV.STOCK_SESSION_SECRET, T0);
  assert.equal(jetonValide(jeton, ENV.STOCK_SESSION_SECRET, T0), true);
  assert.equal(jetonValide(jeton, "un-autre-secret-de-session-invente-0123456789", T0), false);
  const [charge, signature] = jeton.split(".");
  const faux = Buffer.from(JSON.stringify({ exp: 9999999999 })).toString("base64url");
  assert.equal(jetonValide(`${faux}.${signature}`, ENV.STOCK_SESSION_SECRET, T0), false);
  assert.equal(jetonValide(`${charge}.${signature.slice(0, -1)}A`, ENV.STOCK_SESSION_SECRET, T0), false);
  assert.equal(jetonValide(charge, ENV.STOCK_SESSION_SECRET, T0), false);
  assert.equal(jetonValide("", ENV.STOCK_SESSION_SECRET, T0), false);
});

test("déconnexion : efface le cookie", async () => {
  const res = traiterDeconnexion(requete("/api/atelier-deconnexion", { entetes: { "X-Atelier": "1" } }));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("set-cookie"), "dedjo_atelier=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0");
  assert.equal(traiterDeconnexion(requete("/api/atelier-deconnexion")).status, 403);
});

/* ===================================================================
   RELAIS /api/atelier
   =================================================================== */

test("sans cookie valide, /api/atelier renvoie 401 avec { ok:false } et rien d'autre", async () => {
  const script = fauxScript({ ok: true });
  for (const cookie of [null, `${COOKIE}=invalide`, `${COOKIE}=${creerJeton("un-autre-secret-de-session-invente-0123456789", T0)}`]) {
    const res = await atelier({ action: "stock.etat" }, { cookie, script });
    assert.equal(res.status, 401);
    assert.equal(await res.text(), '{"ok":false}');
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.headers.get("x-robots-tag"), "noindex, nofollow");
  }
  // Session expirée (plus de 30 jours)
  assert.equal((await atelier({ action: "stock.etat" }, { script, maintenant: T0 + 31 * 24 * 60 * MINUTE })).status, 401);
  // Même en GET, sans cookie : 401
  assert.equal((await atelier(undefined, { cookie: null, methode: "GET", script })).status, 401);
  assert.equal(script.appels.length, 0);
});

test("relais : X-Atelier exigé, POST seulement, liste blanche d'actions", async () => {
  const script = fauxScript({ ok: true });
  assert.equal((await atelier({ action: "stock.etat" }, { xAtelier: false, script })).status, 403);
  assert.equal((await atelier(undefined, { methode: "GET", script })).status, 405);
  for (const action of ["stock.dispo", "commande", "stock.inconnue", ""]) {
    const res = await atelier({ action }, { script });
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { ok: false, error: "Action inconnue." });
  }
  assert.equal((await atelier("pas du json", { script })).status, 400);
  assert.equal(script.appels.length, 0);
});

test("relais : les actions de traçabilité du lot 3 bis passent la liste blanche", async () => {
  for (const action of ["stock.recette", "stock.blocage", "stock.rappel", "stock.registre"]) {
    const script = fauxScript({ ok: true });
    const res = await atelier({ action }, { script });
    assert.equal(res.status, 200, action);
    assert.equal(script.appels[0].corps.action, action);
  }
});

test("relais : le secret du stock et l'action viennent du serveur, la réponse du script est renvoyée", async () => {
  const script = fauxScript({ ok: true, message: "Production enregistrée · lot 11209260127" });
  const res = await atelier({ action: "stock.operation", type: "production", article: "lune", quantite: 6, secret: "tentative", idOperation: "op-essai-0001" }, { script });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, message: "Production enregistrée · lot 11209260127" });
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(script.appels.length, 1);
  assert.equal(script.appels[0].url, ENV.GSHEET_ORDER_WEBHOOK_URL);
  assert.deepEqual(script.appels[0].corps, {
    action: "stock.operation",
    type: "production",
    article: "lune",
    quantite: 6,
    secret: ENV.STOCK_SHARED_SECRET,
    idOperation: "op-essai-0001",
  });
});

test("relais : refus du script, secret refusé, réponse illisible, délai dépassé", async () => {
  const refus = await atelier({ action: "stock.operation" }, { script: fauxScript({ ok: false, error: "Stock insuffisant : La Lune à Marseille, il manque 1 sachet." }) });
  assert.equal(refus.status, 422);
  assert.deepEqual(await refus.json(), { ok: false, error: "Stock insuffisant : La Lune à Marseille, il manque 1 sachet." });

  const secret = await journaux(() => atelier({ action: "stock.etat" }, { script: fauxScript({ ok: false, error: "Accès refusé." }) }));
  assert.equal(secret.resultat.status, 502);
  assert.match((await secret.resultat.json()).error, /^Le script refuse l'accès au stock : vérifie STOCK_SHARED_SECRET\. \(ATL-SECRET-[0-9A-Z]+\)$/);

  // Le contenu d'une réponse inattendue n'est jamais journalisé
  const illisible = await journaux(() => atelier({ action: "stock.etat" }, { script: fauxScript("<html>12 sachets de La Lune</html>") }));
  assert.equal(illisible.resultat.status, 502);
  assert.equal(illisible.lignes.length, 1);
  assert.doesNotMatch(illisible.lignes[0], /sachets|Lune|12/);

  const lent = fauxScript(() => {
    throw Object.assign(new Error("délai"), { name: "TimeoutError" });
  });
  assert.equal((await journaux(() => atelier({ action: "stock.etat" }, { script: lent }))).resultat.status, 504);

  const sansConfig = await journaux(() =>
    traiterAtelier(requete("/api/atelier", { corps: { action: "stock.etat" }, entetes: { cookie: cookieValide(), "X-Atelier": "1" } }), {
      env: { ...ENV, STOCK_SHARED_SECRET: "" },
      maintenant: T0,
    })
  );
  assert.equal(sansConfig.resultat.status, 503);
});

/* ===================================================================
   /api/dispo (public)
   =================================================================== */

const dispo = (reponseScript, { chemin = "/api/dispo", methode = "GET" } = {}) => {
  const script = fauxScript(reponseScript);
  return traiterDispo(requete(chemin, { methode }), { env: ENV, fetch: script.fetch, maintenant: T0 }).then((res) => ({ res, script }));
};

test("/api/dispo : statuts seulement, aucun nombre de stock, cache d'une minute sur le CDN", async () => {
  const { res, script } = await dispo({
    ok: true,
    actif: true,
    maj: "2026-10-20T08:00:00.000Z",
    produits: { lune: "disponible", cabosse: "victime", grappe: "bientot", rose: 12, montagne: "3 sachets", "noix-f": "disponible", "<x>": "bientot" },
    stock: { lune: { marseille: 12 } },
    disponibles: { lune: 12 },
  });
  assert.equal(res.status, 200);
  const corps = await res.json();
  assert.deepEqual(corps, {
    actif: true,
    maj: "2026-10-20T08:00:00.000Z",
    produits: { lune: "disponible", cabosse: "victime", grappe: "bientot", "noix-f": "disponible" },
  });
  assert.doesNotMatch(JSON.stringify(corps.produits), /\d/);
  assert.equal(res.headers.get("netlify-cdn-cache-control"), "public, durable, max-age=60");
  assert.equal(res.headers.get("cache-control"), "public, max-age=0, must-revalidate");
  assert.equal(script.appels[0].corps.action, "stock.dispo");
  assert.equal(script.appels[0].corps.secret, ENV.STOCK_SHARED_SECRET);
});

test("/api/dispo : { actif:false } tant que le stock n'est pas actif, et en cas de panne", async () => {
  const inactif = await dispo({ ok: true, actif: false, maj: "2026-10-20T08:00:00.000Z", produits: { lune: "bientot" } });
  assert.equal(inactif.res.status, 200);
  assert.deepEqual(await inactif.res.json(), { actif: false });

  const panne = await journaux(() => dispo({ ok: false, error: "Le classeur Stock n'est pas encore créé" }));
  assert.equal(panne.resultat.res.status, 503);
  assert.deepEqual(await panne.resultat.res.json(), { actif: false });
  assert.equal(panne.resultat.res.headers.get("cache-control"), "no-store");

  // Un paramètre contournerait le cache : refusé sans appeler le script
  const parametre = await dispo({ ok: true }, { chemin: "/api/dispo?x=1" });
  assert.equal(parametre.res.status, 400);
  assert.equal(parametre.script.appels.length, 0);
  assert.equal((await dispo({ ok: true }, { methode: "POST" })).res.status, 405);
});
