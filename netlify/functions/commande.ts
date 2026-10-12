/* Commandes du site → Google Apps Script (Sheet + notification Telegram).
   Appelée par la page /commande via POST /api/commande (voir la redirection dans netlify.toml).
   L'URL du script et le secret partagé ne quittent jamais le serveur :
     GSHEET_ORDER_WEBHOOK_URL  URL /exec du déploiement Apps Script
     ORDER_SHARED_SECRET       même valeur que la propriété SHARED_SECRET du script
   La validation complète et le calcul du total sont faits par le script (apps-script/Code.gs). */

import { createHmac } from "node:crypto";
import { CGV_VERSION } from "../../src/lib/legal";

const TAILLE_MAX = 10_000; // octets
const DELAI_MAX_MS = 15_000;

/* Empreinte de l'IP du visiteur, pour les limites anti-abus du script : HMAC-SHA256 avec le
   secret partagé, tronqué. L'IP elle-même n'est ni transmise ni conservée. */
const empreinteIp = (headers: Record<string, string | undefined> | undefined, secret: string): string => {
  const ip = headers?.["x-nf-client-connection-ip"];
  return typeof ip === "string" && ip ? createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32) : "";
};

const repondre = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return repondre(405, { ok: false, error: "Méthode non autorisée." });
  }

  const brut = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body || "";
  if (!brut || brut.length > TAILLE_MAX) {
    return repondre(413, { ok: false, error: "Commande vide ou trop volumineuse." });
  }

  let data: any;
  try {
    data = JSON.parse(brut);
  } catch {
    return repondre(400, { ok: false, error: "Format de commande invalide." });
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return repondre(400, { ok: false, error: "Format de commande invalide." });
  }

  // Champ piège rempli : c'est un robot. On répond « ok » sans rien transmettre.
  if (typeof data.website === "string" && data.website.trim() !== "") {
    return repondre(200, { ok: true, id: "D-0000" });
  }

  // CGV : case cochée et version en vigueur (revérifié par le script, qui enregistre la version)
  if (data.cgvAcceptees !== true) {
    return repondre(422, { ok: false, error: "Coche la case pour accepter les CGV." });
  }
  if (data.cgvVersion !== CGV_VERSION) {
    return repondre(422, {
      ok: false,
      error: "Les conditions générales de vente ont changé : recharge la page, puis renvoie ta commande.",
    });
  }

  const url = process.env.GSHEET_ORDER_WEBHOOK_URL;
  const secret = process.env.ORDER_SHARED_SECRET;
  if (!url || !secret) {
    console.error("Variables d'environnement manquantes : GSHEET_ORDER_WEBHOOK_URL et/ou ORDER_SHARED_SECRET");
    return repondre(500, { ok: false, error: "Le service de commande n'est pas encore configuré." });
  }

  // Le secret et l'empreinte viennent uniquement du serveur : on ignore toute valeur envoyée par le navigateur
  const { secret: _ignore, empreinteIp: _ignoreEmpreinte, ...commande } = data;

  try {
    // Apps Script répond par une redirection vers la page de résultat : fetch la suit
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...commande, empreinteIp: empreinteIp(event.headers, secret), secret }),
      redirect: "follow",
      signal: AbortSignal.timeout(DELAI_MAX_MS),
    });
    const texte = await res.text();

    let reponse: any;
    try {
      reponse = JSON.parse(texte);
    } catch {
      console.error("Réponse inattendue du script", res.status, texte.slice(0, 300));
      return repondre(502, { ok: false, error: "Le service de commande a répondu de façon inattendue." });
    }

    if (reponse?.ok === true && typeof reponse.id === "string") {
      return repondre(200, { ok: true, id: reponse.id });
    }
    const message = typeof reponse?.error === "string" ? reponse.error : "La commande a été refusée.";
    return repondre(422, { ok: false, error: message });
  } catch (e: any) {
    if (e?.name === "TimeoutError" || e?.name === "AbortError") {
      return repondre(504, { ok: false, error: "Le service de commande met trop de temps à répondre." });
    }
    console.error("Erreur d'appel au script", e);
    return repondre(502, { ok: false, error: "Le service de commande est injoignable." });
  }
};
