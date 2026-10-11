/* ===================================================================
   ENVOI D'UNE COMMANDE
   Navigateur → /api/commande (fonction Netlify) → Google Apps Script
   → Google Sheet + notification Telegram. L'URL du script et le secret
   partagé restent côté serveur (voir netlify/functions/commande.ts).
   =================================================================== */

export interface AdresseLivraison {
  /** Numéro et voie, ex. « 32 Avenue de la Croix Rouge ». */
  ligne: string;
  codePostal: string;
  ville: string;
  /** true si saisie à la main (adresse introuvable dans les suggestions). */
  manuelle: boolean;
}

export interface CommandePayload {
  /** Champ piège anti-spam : toujours vide pour un humain. */
  website: string;
  secteur: string;
  /** AAAA-MM-JJ */
  date: string;
  client: { prenom: string; nom: string; tel: string; email: string };
  adresse: AdresseLivraison | null;
  message: string;
  /** Nombre de sachets par produit (uniquement ceux commandés). */
  quantites: Record<string, number>;
}

/** ok: true → id renseigné ; ok: false → error renseigné. */
export interface ResultatEnvoi {
  ok: boolean;
  id?: string;
  error?: string;
}

const DELAI_MAX_MS = 20000;

export async function envoyerCommande(payload: CommandePayload): Promise<ResultatEnvoi> {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), DELAI_MAX_MS);
  try {
    const res = await fetch("/api/commande", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controleur.signal,
    });
    let data: { ok?: unknown; id?: unknown; error?: unknown } | null = null;
    try {
      data = await res.json();
    } catch {
      return { ok: false, error: "Le serveur a répondu de façon inattendue." };
    }
    if (data?.ok === true && typeof data.id === "string") return { ok: true, id: data.id };
    return { ok: false, error: typeof data?.error === "string" ? data.error : "L'envoi de la commande a échoué." };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, error: "Le serveur met trop de temps à répondre." };
    }
    return { ok: false, error: "Connexion impossible : vérifie ta connexion internet." };
  } finally {
    clearTimeout(minuteur);
  }
}
