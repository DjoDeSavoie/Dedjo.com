/* Appels de l'Atelier vers les fonctions Netlify (netlify/lib/atelier.ts). Le cookie de session est
   HttpOnly : le navigateur l'envoie seul. Chaque POST porte l'en-tête X-Atelier: 1. */

export class ErreurAtelier extends Error {
  /** Code HTTP (0 si le réseau a coupé). */
  statut: number;
  /** Résultat inconnu (réseau coupé, serveur injoignable) : on peut réessayer avec le même idOperation. */
  reseau: boolean;
  constructor(message: string, statut: number, reseau: boolean) {
    super(message);
    this.statut = statut;
    this.reseau = reseau;
  }
}

const SANS_RESEAU = "Pas de réseau : ta saisie est gardée, réessaie quand il revient.";

async function poster<T>(url: string, corps: object): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Atelier": "1" },
      body: JSON.stringify(corps),
      credentials: "same-origin",
    });
  } catch {
    throw new ErreurAtelier(SANS_RESEAU, 0, true);
  }
  let donnees: { ok?: unknown; error?: unknown } | null = null;
  try {
    donnees = await res.json();
  } catch {
    // réponse illisible : traitée ci-dessous
  }
  if (res.ok && donnees && donnees.ok === true) return donnees as T;
  const message = donnees && typeof donnees.error === "string" ? donnees.error : "";
  if (res.status === 401 && !message) throw new ErreurAtelier("Session terminée : entre à nouveau le code.", 401, false);
  // 5xx : le serveur ou le script n'a pas répondu, on ne sait pas si la saisie est passée
  const incertain = res.status >= 500 || res.status === 0;
  throw new ErreurAtelier(message || (incertain ? SANS_RESEAU : "Requête refusée."), res.status, incertain);
}

/** Action « stock.* » du script, via le relais authentifié. */
export const appeler = <T>(action: string, params: object = {}) => poster<T>("/api/atelier", { ...params, action });

export const connecter = (code: string) => poster<{ ok: true }>("/api/atelier-connexion", { code });

export const deconnecter = () => poster<{ ok: true }>("/api/atelier-deconnexion", {});

/** Identifiant d'opération : une saisie renvoyée deux fois n'est enregistrée qu'une fois. */
export function nouvelIdOperation(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const octets = new Uint8Array(16);
  crypto.getRandomValues(octets);
  return Array.from(octets, (o) => o.toString(16).padStart(2, "0")).join("");
}
