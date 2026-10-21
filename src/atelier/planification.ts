/* Planification de production (lot 6) : moteur pur, sans React, sans réseau et sans valeur par
   défaut. Une production = une pâtée d'un seul produit. Les productions choisies sont ordonnancées
   sur les jours du week-end, sans chevauchement sur Jo, le pétrin, le laminoir et le feu, avec un
   nombre limité de productions au congélateur à la fois, jusqu'à leur mise en sachet.

   Les réglages (rendements, poids de pâte, durées, garnitures) sont du savoir-faire : ils viennent
   du classeur Stock (onglet Production), jamais du code. Ce fichier ne contient que des règles.
   Implémentation de référence : l'onglet Production de la maquette « Stock Dedjo ». */

export type Famille = "v" | "f";

export const ETAPES_V = ["pesage", "petrissage", "faconnage", "pointage", "formage", "froid1", "tourage", "froid2", "abaisse", "pousse", "sachet"] as const;
export const ETAPES_F = ["pesage", "frasage", "faconnage", "pointage", "formage", "froid1", "tourage", "froid2", "abaisse", "sachet"] as const;
export const ETAPES_POSTE = ["prep", "rangement", "nettoyage"] as const;
export type EtapeV = (typeof ETAPES_V)[number];
export type EtapeF = (typeof ETAPES_F)[number];

export interface Garniture {
  id: string;
  nom: string;
  produits: string[];
  /** Durée : pour une production (découpe, au prorata des pièces), ou fixe (cuisson). */
  min: number;
  fixe: boolean;
  /** Cuisson : occupe le feu. */
  feu: boolean;
  /** Refroidissement avant usage, en minutes. */
  froid: number;
  todo?: true;
}

export interface Reglages {
  /** Limite par défaut à Marseille, en sachets. */
  seuil: number;
  congel: { max: number; heures: number };
  v: { cap: number; gRef: number; g: Record<string, number>; mainsLibres: boolean; st: Record<EtapeV, number> };
  f: { cap: number; st: Record<EtapeF, number> };
  poste: Record<(typeof ETAPES_POSTE)[number], number>;
  garn: Garniture[];
  /** Valeurs « à confirmer » : { "v.g.lune": true }. */
  todo: Record<string, true>;
}

export type Mode = "traite" | "deux";
export type Horaire = [string, string];

export interface PlanEnCours {
  fam: "both" | Famille;
  prods: Record<string, number>;
  mode: Mode;
  /** Premier jour, AAAA-MM-JJ. */
  date: string;
  jours: { traite: Horaire[]; deux: Horaire[] };
  /** Étapes cochées : { "AAAA-MM-JJ|idTâche": 1 }. */
  checks: Record<string, 1>;
}

/* ===================================================================
   OUTILS
   =================================================================== */

export const TAILLE_MAXI = 50_000;
const JOUR = 1440;
const ceil5 = (m: number) => Math.max(5, Math.ceil(m / 5) * 5);
const pad = (n: number) => String(n).padStart(2, "0");

/** « 07:30 » → 450 */
export const enMinutes = (hm: string) => {
  const [h, m] = String(hm || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
/** 450 → « 07:30 » (l'heure dans la journée) */
export const enHeure = (m: number) => {
  const x = ((Math.round(m) % JOUR) + JOUR) % JOUR;
  return `${pad(Math.floor(x / 60))}:${pad(x % 60)}`;
};
/** 95 → « 1 h 35 », 40 → « 40 min » */
export function duree(m: number): string {
  m = Math.round(m);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h} h${r ? ` ${pad(r)}` : ""}`;
}
const isoDe = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** « 2026-10-24 » + 1 → « 2026-10-25 » (jours civils, heure locale) */
export function ajouterJoursIso(iso: string, n: number): string {
  const [a, m, j] = iso.split("-").map(Number);
  return isoDe(new Date(a, m - 1, j + n, 12));
}
/** Le prochain samedi (aujourd'hui si on est samedi). */
export function prochainSamedi(maintenant = new Date()): string {
  const d = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate(), 12);
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  return isoDe(d);
}

/** Plages horaires proposées (ce ne sont pas des réglages de production). */
export const JOURS_PROPOSES: { traite: Horaire[]; deux: Horaire[] } = {
  traite: [["07:00", "20:00"], ["07:00", "20:00"]],
  deux: [["16:00", "21:00"], ["07:00", "19:00"]],
};
export const LIMITES_JOURS = { traite: { min: 1, max: 4 }, deux: { min: 2, max: 5 } };

export function nouveauPlan(maintenant = new Date()): PlanEnCours {
  return { fam: "both", prods: {}, mode: "traite", date: prochainSamedi(maintenant), jours: JSON.parse(JSON.stringify(JOURS_PROPOSES)), checks: {} };
}

/* ===================================================================
   VALIDATION (la même que dans apps-script/Stock.gs)
   =================================================================== */

export class ErreurReglages extends Error {}

const estObjet = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
/** Id de la maquette : « noix-f » devient « noix ». */
const idProduit = (id: string) => (id === "noix-f" ? "noix" : id);

/** min : 0 (positif ou nul), POSITIF (strictement positif), ou une borne. */
const POSITIF = Number.MIN_VALUE;
function nombre(v: unknown, chemin: string, min = 0, entier = false, max = Infinity): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max || (entier && !Number.isInteger(v))) {
    const attendu =
      max < Infinity ? `un nombre entier de ${min} à ${max}` : entier ? `un nombre entier d'au moins ${min}` : min === POSITIF ? "un nombre supérieur à 0" : min > 0 ? `un nombre d'au moins ${min}` : "un nombre positif ou nul";
    throw new ErreurReglages(`Réglages : « ${chemin} » doit être ${attendu}.`);
  }
  return v;
}
function texte(v: unknown, chemin: string, max: number): string {
  if (typeof v !== "string" || !v.trim() || v.length > max) throw new ErreurReglages(`Réglages : « ${chemin} » doit être un texte (${max} caractères au plus).`);
  return v.trim();
}

/** Réglages validés et convertis, ou ErreurReglages avec un message clair. */
export function validerReglages(brut: unknown): Reglages {
  if (!estObjet(brut)) throw new ErreurReglages("Réglages : un objet JSON est attendu.");
  if (JSON.stringify(brut).length > TAILLE_MAXI) throw new ErreurReglages("Réglages : 50 ko au plus.");
  const { congel, v, f, poste, garn, todo } = brut;
  if (!estObjet(congel) || !estObjet(v) || !estObjet(f) || !estObjet(poste)) {
    throw new ErreurReglages("Réglages incomplets : seuil, congel, v, f, poste et garn sont attendus.");
  }
  if (!estObjet(v.st) || !estObjet(f.st) || !estObjet(v.g)) throw new ErreurReglages("Réglages incomplets : durées des étapes (st) ou poids de pâte (g) manquants.");
  if (typeof v.mainsLibres !== "boolean") throw new ErreurReglages("Réglages : « v.mainsLibres » doit valoir true ou false.");
  if (!Array.isArray(garn) || garn.length > 50) throw new ErreurReglages("Réglages : « garn » doit être une liste (50 garnitures au plus).");

  const g: Record<string, number> = {};
  Object.keys(v.g).forEach((id) => {
    if (id.length > 40) throw new ErreurReglages("Réglages : id de produit trop long.");
    g[idProduit(id)] = nombre(v.g[id], `v.g.${id}`, POSITIF);
  });
  const stV = {} as Record<EtapeV, number>;
  ETAPES_V.forEach((k) => (stV[k] = nombre((v.st as Record<string, unknown>)[k], `v.st.${k}`)));
  const stF = {} as Record<EtapeF, number>;
  ETAPES_F.forEach((k) => (stF[k] = nombre((f.st as Record<string, unknown>)[k], `f.st.${k}`)));
  const p = {} as Reglages["poste"];
  ETAPES_POSTE.forEach((k) => (p[k] = nombre(poste[k], `poste.${k}`)));

  const garnitures = garn.map((x, i): Garniture => {
    if (!estObjet(x)) throw new ErreurReglages(`Réglages : garniture n° ${i + 1} invalide.`);
    const produits = x.produits;
    if (!Array.isArray(produits) || produits.length > 20 || produits.some((id) => typeof id !== "string" || id.length > 40)) {
      throw new ErreurReglages(`Réglages : « garn[${i}].produits » doit être une liste d'ids de produits.`);
    }
    if (x.fixe !== undefined && typeof x.fixe !== "boolean") throw new ErreurReglages(`Réglages : « garn[${i}].fixe » doit valoir true ou false.`);
    if (x.feu !== undefined && typeof x.feu !== "boolean") throw new ErreurReglages(`Réglages : « garn[${i}].feu » doit valoir true ou false.`);
    const sortie: Garniture = {
      id: texte(x.id, `garn[${i}].id`, 60),
      nom: texte(x.nom, `garn[${i}].nom`, 100),
      produits: (produits as string[]).map(idProduit),
      min: nombre(x.min, `garn[${i}].min`),
      fixe: x.fixe === true,
      feu: x.feu === true,
      froid: x.froid === undefined ? 0 : nombre(x.froid, `garn[${i}].froid`),
    };
    if (x.todo === true) sortie.todo = true;
    return sortie;
  });
  const aConfirmer: Record<string, true> = {};
  if (todo !== undefined) {
    if (!estObjet(todo) || Object.keys(todo).length > 200) throw new ErreurReglages("Réglages : « todo » invalide.");
    Object.keys(todo).forEach((cle) => {
      if (todo[cle] === true) aConfirmer[cle.replace(/^v\.g\.noix-f$/, "v.g.noix")] = true;
    });
  }
  return {
    seuil: nombre(brut.seuil, "seuil"),
    congel: { max: nombre(congel.max, "congel.max", 1, true, 6), heures: nombre(congel.heures, "congel.heures") },
    v: { cap: nombre(v.cap, "v.cap", 1), gRef: nombre(v.gRef, "v.gRef", POSITIF), g, mainsLibres: v.mainsLibres, st: stV },
    f: { cap: nombre(f.cap, "f.cap", 1), st: stF },
    poste: p,
    garn: garnitures,
    todo: aConfirmer,
  };
}

/** Texte collé depuis la maquette (« Copier les réglages ») : JSON, 50 ko au plus. */
export function lireReglagesTexte(texteColle: string): Reglages {
  if (texteColle.length > TAILLE_MAXI) throw new ErreurReglages("Réglages : 50 ko au plus.");
  let brut: unknown;
  try {
    brut = JSON.parse(texteColle);
  } catch (e) {
    throw new ErreurReglages("Ce texte n'est pas du JSON : recopie les réglages depuis la maquette, en entier.");
  }
  return validerReglages(brut);
}

const HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;
const JOUR_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Plan en cours validé, ou ErreurReglages. */
export function validerPlan(brut: unknown): PlanEnCours {
  if (!estObjet(brut)) throw new ErreurReglages("Plan : un objet JSON est attendu.");
  if (JSON.stringify(brut).length > TAILLE_MAXI) throw new ErreurReglages("Plan : 50 ko au plus.");
  const { fam, prods, mode, date, jours, checks } = brut;
  if (fam !== "both" && fam !== "v" && fam !== "f") throw new ErreurReglages("Plan : famille invalide.");
  if (mode !== "traite" && mode !== "deux") throw new ErreurReglages("Plan : mode invalide.");
  if (typeof date !== "string" || !JOUR_ISO.test(date) || ajouterJoursIso(date, 0) !== date) throw new ErreurReglages("Plan : date invalide.");
  if (!estObjet(prods) || Object.keys(prods).length > 40) throw new ErreurReglages("Plan : productions invalides.");
  const p: Record<string, number> = {};
  Object.keys(prods).forEach((id) => {
    const n = prods[id];
    if (id.length > 40 || typeof n !== "number" || !Number.isInteger(n) || n < 0 || n > 9) throw new ErreurReglages("Plan : de 0 à 9 productions par produit.");
    if (n > 0) p[idProduit(id)] = n;
  });
  if (!estObjet(jours)) throw new ErreurReglages("Plan : jours invalides.");
  const lireJours = (liste: unknown, m: Mode): Horaire[] => {
    const { min, max } = LIMITES_JOURS[m];
    if (!Array.isArray(liste) || liste.length < min || liste.length > max) throw new ErreurReglages(`Plan : de ${min} à ${max} jours ${m === "traite" ? "d'une traite" : "en deux temps"}.`);
    return liste.map((h) => {
      if (!Array.isArray(h) || h.length !== 2 || !h.every((x) => typeof x === "string" && HEURE.test(x))) throw new ErreurReglages("Plan : heure invalide (HH:MM).");
      return [h[0], h[1]] as Horaire;
    });
  };
  const c: Record<string, 1> = {};
  if (checks !== undefined) {
    if (!estObjet(checks) || Object.keys(checks).length > 3000) throw new ErreurReglages("Plan : étapes cochées invalides.");
    Object.keys(checks).forEach((cle) => {
      if (!/^\d{4}-\d{2}-\d{2}\|[^|]{1,120}$/.test(cle) || checks[cle] !== 1) throw new ErreurReglages("Plan : étape cochée invalide.");
      c[cle] = 1;
    });
  }
  return { fam, prods: p, mode, date, jours: { traite: lireJours(jours.traite, "traite"), deux: lireJours(jours.deux, "deux") }, checks: c };
}

/* ===================================================================
   RENDEMENT
   =================================================================== */

export interface Rendement {
  fam: Famille;
  pieces: number;
  /** Pâte d'une production, en g (viennoiseries). */
  charge: number;
  sachets: number;
  reste: number;
}

/** Ce que donne une production (une pâtée pleine) d'un produit. */
export function rendement(r: Reglages, id: string, fam: Famille, piecesParSachet: number): Rendement {
  const g = fam === "v" ? r.v.g[id] || r.v.gRef : 1;
  const capacite = fam === "v" ? r.v.cap * r.v.gRef : r.f.cap;
  const pieces = Math.floor(capacite / g + 1e-9);
  const ps = piecesParSachet > 0 ? piecesParSachet : 1;
  return { fam, pieces, charge: pieces * g, sachets: Math.floor(pieces / ps), reste: pieces % ps };
}

/* ===================================================================
   ORDONNANCEMENT
   =================================================================== */

export interface Demande {
  id: string;
  fam: Famille;
  /** Nombre de productions. */
  n: number;
  piecesParSachet: number;
}

export interface Production extends Rendement {
  id: string;
  /** Rang dans sa famille (1, 2…). */
  k: number;
  /** n° de cette production parmi celles du produit, et leur nombre. */
  num: number;
  of: number;
  scale: number;
}

type Ressource = "op" | "petrin" | "lam" | "feu";
type Genre = "actif" | "machine" | "repos" | "froid" | "congel" | "jalon";
interface Etape {
  k: string;
  d: number;
  res: Ressource[];
  kind: Genre;
  off: number;
}
interface Dependance {
  b: Bloc;
  from?: "span" | "act";
  lag: number;
  garn?: boolean;
  slot?: boolean;
  clean?: boolean;
}
interface Bloc {
  id: string;
  ch?: Chaine;
  gch?: Chaine;
  g?: Garniture;
  ph?: 1 | 2 | 3;
  opt?: boolean;
  garn?: boolean;
  isClean?: boolean;
  clean?: Famille;
  wave?: Chaine[];
  deps: Dependance[];
  tasks: Etape[];
  span: number;
  act: number;
  tail?: number;
  tail1?: number;
}
interface Chaine {
  id: string;
  fam: Famille;
  p: Production;
  blocks: Bloc[];
  garn: Bloc[];
  minW: number;
}
export interface Fenetre {
  s: number;
  e: number;
}

/** Bloc : ses étapes s'enchaînent sans attente. */
function bloc(o: Omit<Partial<Bloc>, "tasks"> & { id: string; tasks: Omit<Etape, "off">[] }): Bloc {
  let off = 0;
  const tasks = o.tasks.map((t) => {
    const x = { ...t, off };
    off += t.d;
    return x;
  });
  let span = 0;
  let act = 0;
  for (const t of tasks) {
    span = Math.max(span, t.off + t.d);
    if (t.res.length) act = Math.max(act, t.off + t.d);
  }
  return { deps: [], ...o, tasks, span, act };
}

/** Productions choisies → pâtées, dans l'ordre de priorité de la liste. */
export function construireProductions(r: Reglages, demandes: Demande[]): Production[] {
  const rangs = { v: 0, f: 0 };
  const out: Production[] = [];
  for (const d of demandes) {
    if (!(d.n > 0)) continue;
    const rd = rendement(r, d.id, d.fam, d.piecesParSachet);
    for (let num = 1; num <= d.n; num++) out.push({ ...rd, id: d.id, k: ++rangs[d.fam], num, of: d.n, scale: 1 });
  }
  return out;
}

interface Probleme {
  chains: Chaine[];
  blocks: Bloc[];
  mode: Mode;
  CG: number;
}

function construireProbleme(r: Reglages, productions: Production[], mode: Mode): Probleme {
  const blocks: Bloc[] = [];
  const chains: Chaine[] = [];
  const CG = r.congel.heures * 60;
  for (const p of productions) {
    const fam = p.fam;
    const ch: Chaine = { id: fam.toUpperCase() + p.k, fam, p, blocks: [], garn: [], minW: 0 };
    const st: Record<string, number> = fam === "v" ? r.v.st : r.f.st;
    const L = ch.id;
    const ab = ceil5(st.abaisse * p.scale);
    const sac = ceil5(st.sachet * p.scale);
    const B0 = bloc({ id: `${L}-pes`, ch, ph: 1, tasks: [{ k: "pesage", d: st.pesage, res: ["op"], kind: "actif" }] });
    const B1 = bloc({
      id: `${L}-p1`,
      ch,
      ph: 1,
      tasks:
        fam === "v"
          ? [
              { k: "petrissage", d: st.petrissage, res: r.v.mainsLibres ? ["petrin"] : ["petrin", "op"], kind: r.v.mainsLibres ? "machine" : "actif" },
              { k: "faconnage", d: st.faconnage, res: ["op"], kind: "actif" },
              { k: "pointage", d: st.pointage, res: [], kind: "repos" },
              { k: "formage", d: st.formage, res: ["op", "lam"], kind: "actif" },
            ]
          : [
              { k: "frasage", d: st.frasage, res: ["op", "petrin"], kind: "actif" },
              { k: "faconnage", d: st.faconnage, res: ["op"], kind: "actif" },
              { k: "pointage", d: st.pointage, res: [], kind: "repos" },
              { k: "formage", d: st.formage, res: ["op", "lam"], kind: "actif" },
            ],
    });
    B1.deps.push({ b: B0, from: "span", lag: 0 });
    const B2 = bloc({ id: `${L}-p2`, ch, ph: 2, tasks: [{ k: "tourage", d: st.tourage, res: ["op", "lam"], kind: "actif" }] });
    B2.deps.push({ b: B1, from: "span", lag: st.froid1 });
    const B3 = bloc({
      id: `${L}-p3`,
      ch,
      ph: 2,
      tasks:
        fam === "v"
          ? [
              { k: "abaisse", d: ab, res: ["op", "lam"], kind: "actif" },
              { k: "pousse", d: r.v.st.pousse, res: [], kind: "repos" },
              { k: "congel", d: 0, res: [], kind: "jalon" },
            ]
          : [
              { k: "abaisse", d: ab, res: ["op", "lam"], kind: "actif" },
              { k: "congel", d: 0, res: [], kind: "jalon" },
            ],
    });
    B3.deps.push({ b: B2, from: "span", lag: st.froid2 });
    const B4 = bloc({ id: `${L}-sac`, ch, ph: 3, opt: true, tasks: [{ k: "sachet", d: sac, res: ["op"], kind: "actif" }] });
    B4.deps.push({ b: B3, from: "span", lag: CG });
    ch.blocks = [B0, B1, B2, B3, B4];
    chains.push(ch);
    blocks.push(B0, B1, B2, B3, B4);
    // Durée minimale jusqu'à la mise au congélateur, pour ne pas lancer une production trop tard
    B3.tail = B3.span;
    B2.tail = B2.span + st.froid2 + B3.tail;
    B1.tail = B1.span + st.froid1 + B2.tail;
    B0.tail = B0.span + B1.tail;
    B4.tail = B4.span;
    B1.tail1 = B1.span;
    B0.tail1 = B0.span + B1.span;
    // Garnitures propres à cette production : le jour même (la veille, en deux temps)
    for (const g of r.garn) {
      if (!g.produits.includes(p.id)) continue;
      const d = g.fixe ? Math.max(5, g.min) : ceil5((g.min * p.pieces) / (fam === "v" ? r.v.cap : r.f.cap));
      const G = bloc({ id: `G-${g.id}-${L}`, g, gch: ch, ph: 1, garn: true, tasks: [{ k: "garn", d, res: g.feu ? ["op", "feu"] : ["op"], kind: "actif" }] });
      G.tail = G.span;
      G.tail1 = G.span;
      B3.deps.push({ b: G, from: "span", lag: g.froid || 0, garn: true });
      ch.garn.push(G);
      blocks.push(G);
    }
  }
  return { chains, blocks, mode, CG };
}

interface Passe {
  placed: Map<string, number>;
  wOf: Map<string, number>;
  overflow: number;
  overCh: Set<Chaine>;
}

/** Une passe d'ordonnancement en série : chaque bloc à la date la plus tôt possible, dans l'ordre de la liste. */
function passe(P: Probleme, r: Reglages, wins: Fenetre[], order: Bloc[]): Passe {
  const R = r.poste.rangement;
  const PREP = r.poste.prep;
  const res: Record<Ressource, [number, number][]> = { op: [], petrin: [], lam: [], feu: [] };
  const placed = new Map<string, number>();
  const wOf = new Map<string, number>();
  let overflow = 0;
  const overCh = new Set<Chaine>();
  const derniere = wins.length - 1;
  // La préparation du poste ouvre chaque journée
  for (const w of wins) res.op.push([w.s, w.s + PREP]);
  const occupe = (rs: Ressource, a: number, b: number) => {
    for (const iv of res[rs]) if (iv[0] < b && a < iv[1]) return iv;
    return null;
  };
  const reserver = (b: Bloc, t: number) => {
    for (const k of b.tasks) if (k.d > 0) for (const rs of k.res) res[rs].push([t + k.off, t + k.off + k.d]);
  };
  // Fin de mise en sachet qui libère une place au congélateur : prévue, ou au plus tôt si elle ne tient pas
  const libere = (d: Dependance): number | null => {
    const x = placed.get(d.b.id);
    if (x !== undefined) return x + d.b.span;
    const b3 = d.b.ch!.blocks[3];
    const x3 = placed.get(b3.id);
    return x3 === undefined ? null : x3 + b3.span + P.CG + d.b.span;
  };
  const dispo = (b: Bloc) => {
    let t = 0;
    for (const d of b.deps) {
      let v: number;
      if (d.slot) {
        const f = libere(d);
        if (f === null) continue;
        v = f + d.lag;
      } else {
        const x = placed.get(d.b.id);
        if (x === undefined) continue;
        v = x + (d.from === "act" ? d.b.act : d.b.span) + d.lag;
      }
      t = Math.max(t, v);
    }
    return t;
  };
  const slotRel = (ch: Chaine) => {
    const d = ch.blocks[3].deps.find((x) => x.slot);
    return d ? libere(d) ?? 0 : 0;
  };
  function caser(b: Bloc, t0: number, w: Fenetre, strict: boolean): number | null {
    let t = Math.ceil(Math.max(t0, w.s + PREP) / 5) * 5;
    for (let garde = 0; garde < 600; garde++) {
      if (strict) {
        const lim = w.e - R;
        if (t + b.act > lim || t + b.span > w.e || (b.tail && t + b.tail > w.e)) return null;
      }
      let saut: number | null = null;
      for (const k of b.tasks) {
        if (!(k.d > 0)) continue;
        for (const rs of k.res) {
          const iv = occupe(rs, t + k.off, t + k.off + k.d);
          if (iv) {
            const j = iv[1] - k.off;
            if (saut === null || j > saut) saut = j;
          }
        }
      }
      if (saut === null) return t;
      t = Math.max(t + 5, Math.ceil(saut / 5) * 5);
    }
    return strict ? null : t;
  }
  // En deux temps, la veille commence assez tard pour limiter la nuit au froid (16 h visées)
  const minVeille = (b: Bloc, wi: number) => {
    const ch = b.ch;
    if (P.mode !== "deux" || !ch || b !== ch.blocks[0] || !wins[wi + 1]) return 0;
    return wins[wi + 1].s + PREP - 16 * 60 - (b.tail1 || 0);
  };
  function placer(b: Bloc, permis: number[]): { t: number; wi: number } | null {
    let rel = dispo(b);
    const g0 = b.gch ? placed.get(b.gch.blocks[0].id) : undefined;
    if (g0 !== undefined) rel = Math.max(rel, g0);
    const dernierPermis = permis[permis.length - 1];
    for (const wi of permis) {
      const w = wins[wi];
      if (w.e <= rel && wi !== dernierPermis) continue;
      const t = caser(b, Math.max(rel, minVeille(b, wi)), w, true);
      if (t !== null) return { t, wi };
    }
    if (b.opt) return null;
    const t = caser(b, rel, wins[dernierPermis], false)!;
    const w = wins[dernierPermis];
    const o = Math.max(0, t + b.span - w.e, t + b.act - (w.e - R));
    overflow += o;
    const ch = b.ch || b.gch;
    if (o > 0 && ch) overCh.add(ch);
    return { t, wi: dernierPermis };
  }
  const tous = wins.map((_, i) => i);
  function permisPour(b: Bloc): number[] {
    if (b.isClean) return tous;
    if (b.ph === 3) {
      const w0 = wOf.get(b.ch!.blocks[3].id) ?? 0;
      return tous.filter((i) => i >= w0);
    }
    const ch = (b.ch || b.gch)!;
    const w0 = wOf.get(ch.blocks[0].id)!;
    if (P.mode === "deux") {
      if (b === ch.blocks[0]) {
        const sr = slotRel(ch);
        const a = tous.filter((i) => i >= ch.minW && wins[i + 1] && wins[i + 1].e >= sr);
        return a.length ? a : [Math.max(0, derniere - 1)];
      }
      if (b.ph === 1) return [w0];
      return [Math.min(w0 + 1, derniere)];
    }
    if (b === ch.blocks[0]) {
      const sr = slotRel(ch);
      const a = tous.filter((i) => i >= ch.minW && wins[i].e >= sr);
      return a.length ? a : [derniere];
    }
    return [w0];
  }
  for (const b of order) {
    const permis = permisPour(b);
    let pl: { t: number; wi: number } | null;
    if (P.mode === "deux" && b.ph === 1) {
      const garde = b.tail;
      b.tail = b.tail1;
      pl = placer(b, permis);
      b.tail = garde;
    } else pl = placer(b, permis);
    if (!pl) continue;
    placed.set(b.id, pl.t);
    wOf.set(b.id, pl.wi);
    reserver(b, pl.t);
  }
  return { placed, wOf, overflow, overCh };
}

type Element = Bloc | { clean: Famille; wave: Chaine[] };

/** Ordres essayés : entrelacements V et F (chaque famille dans son ordre), place des garnitures, ordre salé/sucré. */
function ordres(P: Probleme, r: Reglages): { L: Element[]; s: Chaine[] }[] {
  const V = P.chains.filter((c) => c.fam === "v");
  const F = P.chains.filter((c) => c.fam === "f");
  const seqs: Chaine[][] = [];
  const rec = (a: number, b: number, cur: Chaine[]) => {
    if (seqs.length > 400) return;
    if (a === V.length && b === F.length) {
      seqs.push(cur.slice());
      return;
    }
    if (a < V.length) {
      cur.push(V[a]);
      rec(a + 1, b, cur);
      cur.pop();
    }
    if (b < F.length) {
      cur.push(F[b]);
      rec(a, b + 1, cur);
      cur.pop();
    }
  };
  rec(0, 0, []);
  if (seqs.length > 40) {
    const pas = seqs.length / 40;
    const garde: Chaine[][] = [];
    for (let i = 0; i < 40; i++) garde.push(seqs[Math.floor(i * pas)]);
    garde.push(seqs[seqs.length - 1]);
    seqs.length = 0;
    seqs.push(...garde);
  }
  const K = Math.max(1, r.congel.max);
  const outs: { L: Element[]; s: Chaine[] }[] = [];
  for (const s of seqs) {
    for (const gPos of [0, 1]) {
      for (const X0 of ["f", "v"] as Famille[]) {
        const L: Element[] = [];
        let prev: Chaine[] | null = null;
        let last: Famille | null = null;
        for (let w = 0; w * K < s.length; w++) {
          const wave = s.slice(w * K, w * K + K);
          if (gPos === 1) L.push(...wave.flatMap((c) => [c.blocks[0], c.blocks[1], ...c.garn]));
          else L.push(...wave.flatMap((c) => [c.blocks[0], c.blocks[1]]), ...wave.flatMap((c) => c.garn));
          L.push(...wave.map((c) => c.blocks[2]));
          // Une vague commence par la famille qui a fini la précédente ; sinon nettoyage entre les deux
          const X: Famille = last && wave.some((c) => c.fam === last) ? last : last ? wave[0].fam : X0;
          const b3 = wave.map((c) => c.blocks[3]);
          const xs = b3.filter((b) => b.ch!.fam === X);
          const ys = b3.filter((b) => b.ch!.fam !== X);
          if (last && last !== X) L.push({ clean: last, wave: [...prev!.filter((c) => c.fam === last), ...wave] });
          if (xs.length && ys.length) L.push(...xs, { clean: X, wave }, ...ys);
          else L.push(...b3);
          last = ys.length ? ys[0].ch!.fam : X;
          prev = wave;
          L.push(...wave.map((c) => c.blocks[4]));
        }
        outs.push({ L, s });
        if (!(V.length && F.length)) break;
      }
    }
  }
  return outs;
}

/* ---------- Résultat ---------- */

export interface Tache {
  id: string;
  /** Étape : pesage, petrissage… garn, nettoyage, prep, rangement, froid1, froid2, congelo, congel. */
  k: string;
  /** Production (id de chaîne : V1, F2…), ou null pour le poste et les nettoyages. */
  ch: string | null;
  /** Couleur : v, f, g (garniture), p (poste). */
  fam: "v" | "f" | "g" | "p";
  /** Ligne du Gantt : « P » (poste), « G » (garniture) ou l'id de chaîne. */
  row: string;
  s: number;
  d: number;
  kind: Genre;
  res: string[];
  /** Jour (indice de fenêtre). */
  wi: number;
  g: Garniture | null;
  clean: Famille | null;
  /** Froid : durée minimale. */
  min?: number;
}

export interface ChainePlan {
  id: string;
  fam: Famille;
  p: Production;
  /** Mise au congélateur, et mise en sachet possible à partir de… */
  jalon: number;
  sachetDes: number;
  /** Mise en sachet prévue (null si elle ne tient dans aucun jour). */
  sachetA: number | null;
}

export interface JourPlan {
  i: number;
  w: Fenetre;
  vide: boolean;
  debut: number;
  fin: number;
  /** Temps de travail de Jo, en minutes. */
  travail: number;
  libres: { s: number; d: number; attente?: boolean }[];
  depassement: number;
  sachetSeul: boolean;
}

export interface Avertissement {
  k: "over" | "congel" | "froid";
  t: string;
  wi?: number;
}

export interface Plan {
  taches: Tache[];
  jours: JourPlan[];
  avertissements: Avertissement[];
  chaines: ChainePlan[];
  /** Dernière mise au congélateur. */
  fin: number;
  mode: Mode;
}

/**
 * Organigramme des productions sur les fenêtres (minutes depuis minuit du premier jour : le jour i
 * va de i × 1440 + début à i × 1440 + fin). null s'il n'y a aucune production.
 */
export function planifier(r: Reglages, productions: Production[], mode: Mode, wins: Fenetre[]): Plan | null {
  if (!productions.length || !wins.length) return null;
  const P = construireProbleme(r, productions, mode);
  const K = Math.max(1, r.congel.max);
  let best: { score: number; res: Passe; Cs: Bloc[]; end: number; s: Chaine[] } | null = null;
  for (const { L: L0, s } of ordres(P, r)) {
    // Places au congélateur : la production n° i attend la mise en sachet de la n° i − K
    for (const c of P.chains) {
      c.minW = 0;
      c.blocks[3].deps = c.blocks[3].deps.filter((d) => !d.slot);
    }
    s.forEach((c, i) => {
      if (i >= K) c.blocks[3].deps.push({ b: s[i - K].blocks[4], lag: -c.blocks[3].span, slot: true });
    });
    for (let rep = 0; rep <= P.chains.length * wins.length; rep++) {
      for (const c of P.chains) c.blocks[3].deps = c.blocks[3].deps.filter((d) => !d.clean);
      const Cs: Bloc[] = [];
      let nc = 0;
      const L: Bloc[] = L0.flatMap((x): Bloc[] => {
        if (!("clean" in x) || "id" in x) return [x as Bloc];
        if (r.poste.nettoyage <= 0) return [];
        const C = bloc({ id: `CLEAN-${++nc}`, isClean: true, clean: x.clean, tasks: [{ k: "nettoyage", d: r.poste.nettoyage, res: ["op", "lam"], kind: "actif" }] });
        C.tail = C.span;
        for (const c of x.wave) {
          if (c.fam === x.clean) C.deps.push({ b: c.blocks[3], from: "act", lag: 0 });
          else c.blocks[3].deps.push({ b: C, from: "span", lag: 0, clean: true });
        }
        C.wave = x.wave;
        Cs.push(C);
        return [C];
      });
      const res = passe(P, r, wins, L);
      // La production fautive placée en dernier passe au jour suivant, et on recommence
      let fautive: Chaine | null = null;
      const pos = (c: Chaine) => L.indexOf(c.blocks[1]);
      for (const c of P.chains) {
        const w = c.blocks.slice(0, 4).map((b) => res.wOf.get(b.id));
        const coupee = mode === "deux" ? w[0] !== w[1] || w[2] !== w[3] || w[2] !== (w[1] as number) + 1 : new Set(w).size > 1;
        if ((coupee || res.overCh.has(c)) && (!fautive || pos(c) > pos(fautive))) fautive = c;
      }
      if (fautive) {
        const next = (res.wOf.get(fautive.blocks[0].id) as number) + 1;
        if (wins.slice(next).some((_, j) => mode !== "deux" || !!wins[next + j + 1])) {
          fautive.minW = next;
          continue;
        }
      }
      let end = 0;
      for (const c of P.chains) {
        const b = c.blocks[3];
        end = Math.max(end, (res.placed.get(b.id) as number) + b.span);
      }
      const score = res.overflow * 1000 + end;
      if (!best || score < best.score) best = { score, res, Cs, end, s: s.slice() };
      break;
    }
  }
  return mettreEnForme(best!, P, r, wins, mode, K);
}

/** Tâches datées, froids et congélation, poste, jours et avertissements. */
function mettreEnForme(best: { res: Passe; Cs: Bloc[]; end: number; s: Chaine[] }, P: Probleme, r: Reglages, wins: Fenetre[], mode: Mode, K: number): Plan {
  const { res, Cs } = best;
  const T: Tache[] = [];
  const CG = P.CG;
  const tachesDe = (b: Bloc) => {
    const t0 = res.placed.get(b.id);
    if (t0 === undefined) return;
    const wi = res.wOf.get(b.id) as number;
    const ch = b.ch || b.gch;
    for (const k of b.tasks) {
      T.push({
        id: `${b.id}-${k.k}`,
        k: k.k,
        ch: ch ? ch.id : null,
        fam: b.garn ? "g" : ch ? ch.fam : "p",
        row: b.ch ? b.ch.id : b.garn ? "G" : "P",
        s: t0 + k.off,
        d: k.d,
        kind: k.kind,
        res: k.res,
        wi,
        g: b.g || null,
        clean: b.clean || null,
      });
    }
  };
  for (const b of P.blocks) tachesDe(b);
  // Jour de mise en sachet seule : pas de préparation du poste, on commence dès l'ouverture
  wins.forEach((w, i) => {
    const ts = T.filter((t) => t.wi === i);
    if (!ts.length || ts.some((t) => t.k !== "sachet")) return;
    const pret = (id: string) => {
      const c = P.chains.find((x) => x.id === id)!;
      return (res.placed.get(c.blocks[3].id) as number) + c.blocks[3].span + CG;
    };
    const decalage = Math.min(...ts.map((t) => t.s - Math.max(w.s, pret(t.ch as string))));
    if (decalage > 0) for (const t of ts) t.s -= decalage;
  });
  const chaines: ChainePlan[] = [];
  for (const c of P.chains) {
    const [, B1, B2, B3] = c.blocks;
    const st: Record<string, number> = c.fam === "v" ? r.v.st : r.f.st;
    const e1 = (res.placed.get(B1.id) as number) + B1.span;
    const s2 = res.placed.get(B2.id) as number;
    const e2 = s2 + B2.span;
    const s3 = res.placed.get(B3.id) as number;
    const base = { ch: c.id, fam: c.fam, row: c.id, res: [], g: null, clean: null };
    T.push({ ...base, id: `${c.id}-froid1`, k: "froid1", s: e1, d: s2 - e1, kind: "froid", wi: res.wOf.get(B1.id) as number, min: st.froid1 });
    T.push({ ...base, id: `${c.id}-froid2`, k: "froid2", s: e2, d: s3 - e2, kind: "froid", wi: res.wOf.get(B2.id) as number, min: st.froid2 });
    const jalon = s3 + B3.span;
    const sachet = T.find((t) => t.k === "sachet" && t.ch === c.id);
    T.push({ ...base, id: `${c.id}-congelo`, k: "congelo", s: jalon, d: sachet ? sachet.s - jalon : CG, kind: "congel", wi: res.wOf.get(B3.id) as number });
    chaines.push({ id: c.id, fam: c.fam, p: c.p, jalon, sachetDes: jalon + CG, sachetA: sachet ? sachet.s : null });
  }
  // Nettoyage salé ↔ sucré : inutile si l'autre famille de la vague ne travaille qu'un autre jour
  for (const C of Cs) {
    if (!res.placed.has(C.id)) continue;
    const wc = res.wOf.get(C.id) as number;
    const autres = (C.wave || []).filter((c) => c.fam !== C.clean).map((c) => res.wOf.get(c.blocks[3].id) as number);
    if (!autres.every((w) => w > wc)) tachesDe(C);
  }
  // Poste : préparation à l'ouverture et rangement après la dernière tâche de Jo, chaque jour de production
  const joursProd = new Set(T.filter((t) => t.kind !== "froid" && t.kind !== "congel" && t.k !== "sachet").map((t) => t.wi));
  for (const wi of joursProd) {
    const w = wins[wi];
    if (!w) continue;
    const base = { ch: null, fam: "p" as const, row: "P", res: ["op"], wi, g: null, clean: null, kind: "actif" as const };
    T.push({ ...base, id: `P${wi}-prep`, k: "prep", s: w.s, d: r.poste.prep });
    const dernier = Math.max(...T.filter((t) => t.wi === wi && t.res.includes("op")).map((t) => t.s + t.d));
    T.push({ ...base, id: `P${wi}-rang`, k: "rangement", s: dernier, d: r.poste.rangement });
  }
  T.sort((a, b) => a.s - b.s || (a.kind === "actif" ? -1 : 1));

  const jours: JourPlan[] = wins.map((w, i) => {
    const ts = T.filter((t) => t.wi === i && t.kind !== "froid" && t.kind !== "congel");
    if (!ts.length) return { i, w, vide: true, debut: w.s, fin: w.s, travail: 0, libres: [], depassement: 0, sachetSeul: false };
    const op = ts.filter((t) => t.res.includes("op")).sort((a, b) => a.s - b.s);
    const debut = Math.min(...ts.map((t) => t.s));
    const fin = Math.max(...ts.map((t) => t.s + t.d));
    let travail = 0;
    let cur = debut;
    const libres: JourPlan["libres"] = [];
    for (const t of op) {
      if (t.s > cur) libres.push({ s: cur, d: t.s - cur });
      travail += Math.max(0, t.s + t.d - Math.max(cur, t.s));
      cur = Math.max(cur, t.s + t.d);
    }
    if (fin > cur) libres.push({ s: cur, d: fin - cur, attente: true });
    return { i, w, vide: false, debut, fin, travail, libres, depassement: Math.max(0, fin - w.e), sachetSeul: !ts.some((t) => t.k !== "sachet") };
  });

  const avertissements: Avertissement[] = [];
  for (const d of jours) {
    if (!d.vide && d.depassement > 0) {
      avertissements.push({ k: "over", wi: d.i, t: `Ça dépasse ta plage horaire de ${duree(d.depassement)} ce jour-là : commence plus tôt, finis plus tard ou ajoute un jour.` });
    }
  }
  // Congélateur plein : une production attend une mise en sachet qui ne tient dans aucun jour
  const attend = best.s.some((c, i) => i >= K && !T.some((t) => t.k === "sachet" && t.ch === best.s[i - K].id));
  if (attend) {
    avertissements.push({
      k: "congel",
      t: `Congélateur plein : avec ${P.chains.length} productions et ${K} place${K > 1 ? "s" : ""}, une production attend une mise en sachet (${r.congel.heures} h après la congélation) qui ne tient pas dans ces jours. Ajoute un jour ou étale sur deux week-ends.`,
    });
  }
  if (mode === "deux") {
    for (const c of P.chains) {
      const f = T.find((t) => t.id === `${c.id}-froid1`);
      if (f && c.fam === "v" && f.d > 18 * 60) {
        avertissements.push({ k: "froid", t: `Pâte levée : ${duree(f.d)} au froid entre la veille et le tourage. Au-delà de 18 h, commence la veille plus tard ou baisse la levure.` });
      }
    }
  }
  return { taches: T, jours, avertissements, chaines, fin: best.end, mode };
}

/** Fenêtres de travail des jours choisis (une plage vide ou à l'envers dure une heure). */
export function fenetres(jours: Horaire[]): Fenetre[] {
  return jours.map(([a, b], i) => {
    const s = enMinutes(a);
    let e = enMinutes(b);
    if (e <= s) e = s + 60;
    return { s: i * JOUR + s, e: i * JOUR + e };
  });
}
