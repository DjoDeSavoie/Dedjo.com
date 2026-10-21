/* Tests du moteur de planification (lot 6) : npm run test:planification
   Réglages INVENTÉS du § 6 de LOT-6-planification.md, utilisés tels quels : aucune valeur réelle. */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  construireProductions,
  enHeure,
  ErreurReglages,
  fenetres,
  lireReglagesTexte,
  planifier,
  rendement,
  validerPlan,
  validerReglages,
  type Demande,
  type Famille,
  type Horaire,
  type Mode,
  type Plan,
  type Reglages,
} from "./planification.ts";

const REGLAGES_INVENTES = {
  seuil: 4,
  congel: { max: 2, heures: 10 },
  v: {
    cap: 100,
    gRef: 100,
    g: { lune: 100, cabosse: 80, grappe: 100, rose: 100 },
    mainsLibres: true,
    st: { pesage: 10, petrissage: 20, faconnage: 10, pointage: 40, formage: 10, froid1: 90, tourage: 15, froid2: 45, abaisse: 20, pousse: 90, sachet: 15 },
  },
  f: { cap: 20, st: { pesage: 10, frasage: 10, faconnage: 10, pointage: 20, formage: 10, froid1: 45, tourage: 15, froid2: 45, abaisse: 20, sachet: 15 } },
  poste: { prep: 15, rangement: 15, nettoyage: 15 },
  garn: [
    { id: "t1", nom: "Découpe test", produits: ["montagne"], min: 20 },
    { id: "t2", nom: "Cuisson test", produits: ["rose"], min: 15, fixe: true, feu: true, froid: 45 },
  ],
  todo: {},
};

const R: Reglages = validerReglages(structuredClone(REGLAGES_INVENTES));

/** Copie modifiable des réglages inventés, telle qu'on la collerait depuis la maquette. */
type Brut = {
  congel: { max: number; heures: number };
  v: { g: Record<string, number>; st: Record<string, number> };
  garn: Record<string, unknown>[];
  todo: Record<string, boolean>;
};
const copie = () => structuredClone(REGLAGES_INVENTES) as unknown as Brut;

// Pièces par sachet, comme au catalogue
const PRODUITS: Record<string, { fam: Famille; ps: number }> = {
  lune: { fam: "v", ps: 6 },
  cabosse: { fam: "v", ps: 6 },
  rose: { fam: "v", ps: 4 },
  grappe: { fam: "v", ps: 4 },
  montagne: { fam: "f", ps: 2 },
  foret: { fam: "f", ps: 2 },
  goet: { fam: "f", ps: 2 },
};
const demandes = (liste: [string, number][]): Demande[] => liste.map(([id, n]) => ({ id, fam: PRODUITS[id].fam, n, piecesParSachet: PRODUITS[id].ps }));
const plan = (liste: [string, number][], mode: Mode, jours: Horaire[]) => planifier(R, construireProductions(R, demandes(liste)), mode, fenetres(jours)) as Plan;

const SAMEDI_DIMANCHE: Horaire[] = [["07:00", "20:00"], ["07:00", "20:00"]];
const tache = (P: Plan, ch: string, k: string) => {
  const t = P.taches.find((x) => x.ch === ch && x.k === k && x.row === ch);
  assert.ok(t, `tâche ${k} de ${ch} introuvable`);
  return t;
};
const chaineDe = (P: Plan, id: string, num = 1) => {
  const c = P.chaines.find((x) => x.p.id === id && x.p.num === num);
  assert.ok(c, `production ${id} introuvable`);
  return c;
};
const heureEtJour = (m: number) => `j${Math.floor(m / 1440)} ${enHeure(m)}`;

/* ---------- 1. Rendement ---------- */

test("rendement : Lune 100 pièces (16 sachets + 4), Cabosse 125 (20 + 5), Montagne 20 (10 sachets)", () => {
  assert.deepEqual(rendement(R, "lune", "v", 6), { fam: "v", pieces: 100, charge: 10000, sachets: 16, reste: 4 });
  const cabosse = rendement(R, "cabosse", "v", 6);
  assert.equal(cabosse.pieces, 125);
  assert.equal(cabosse.sachets, 20);
  assert.equal(cabosse.reste, 5);
  const montagne = rendement(R, "montagne", "f", 2);
  assert.equal(montagne.pieces, 20);
  assert.equal(montagne.sachets, 10);
  assert.equal(montagne.reste, 0);
});

/* ---------- 2. Une Lune d'une traite ---------- */

test("une Lune d'une traite, samedi de 07:00 à 20:00 : au congélateur à 13:05, en sachet à partir de 23:05", () => {
  const P = plan([["lune", 1]], "traite", [["07:00", "20:00"]]);
  const c = P.chaines[0].id;
  const poste = (k: string) => P.taches.find((t) => t.row === "P" && t.k === k)!;
  assert.equal(enHeure(poste("prep").s), "07:00");
  assert.equal(enHeure(tache(P, c, "pesage").s), "07:15");
  assert.equal(enHeure(tache(P, c, "petrissage").s), "07:25");
  assert.equal(enHeure(tache(P, c, "formage").s), "08:35");
  assert.equal(enHeure(tache(P, c, "tourage").s), "10:15");
  assert.equal(enHeure(tache(P, c, "abaisse").s), "11:15");
  assert.equal(enHeure(poste("rangement").s), "11:35");
  assert.equal(heureEtJour(P.chaines[0].jalon), "j0 13:05");
  assert.equal(heureEtJour(P.chaines[0].sachetDes), "j0 23:05");
  assert.deepEqual(P.avertissements, []);
});

/* ---------- 3. Une Lune en deux temps ---------- */

test("une Lune en deux temps : formage la veille à 17:35, tourage le jour J à 07:15, congélateur à 10:05", () => {
  const P = plan([["lune", 1]], "deux", [["16:00", "21:00"], ["07:00", "19:00"]]);
  const c = P.chaines[0].id;
  assert.equal(heureEtJour(tache(P, c, "formage").s), "j0 17:35");
  assert.equal(heureEtJour(tache(P, c, "tourage").s), "j1 07:15");
  assert.equal(heureEtJour(P.chaines[0].jalon), "j1 10:05");
  assert.deepEqual(P.avertissements, []);
});

/* ---------- 4. Lune + Rose + Montagne sur deux jours ---------- */

test("Lune + Rose + Montagne, samedi et dimanche : deux productions le samedi, la Montagne après la première mise en sachet", () => {
  const P = plan([["lune", 1], ["rose", 1], ["montagne", 1]], "traite", SAMEDI_DIMANCHE);
  const lune = chaineDe(P, "lune");
  const rose = chaineDe(P, "rose");
  const montagne = chaineDe(P, "montagne");
  assert.equal(heureEtJour(lune.jalon), "j0 13:05");
  assert.equal(heureEtJour(rose.jalon), "j0 13:25");
  // Mises en sachet le dimanche, dès l'ouverture du poste
  for (const c of [lune, rose]) {
    assert.ok(c.sachetA !== null && c.sachetA >= 1440 && c.sachetA < 1440 + 9 * 60, `mise en sachet de ${c.p.id} : ${c.sachetA}`);
  }
  const finPremiereMiseEnSachet = Math.min(lune.sachetA!, rose.sachetA!) + 15;
  assert.ok(montagne.jalon >= 1440, "Montagne congelée le dimanche");
  assert.ok(montagne.jalon >= finPremiereMiseEnSachet, "Montagne au congélateur après la fin de la première mise en sachet");
  // Cuisson test finie au moins 45 min avant l'abaisse de la Rose ; découpe test le jour de la Montagne
  const cuisson = P.taches.find((t) => t.k === "garn" && t.g && t.g.id === "t2")!;
  assert.ok(cuisson.s + cuisson.d + 45 <= tache(P, rose.id, "abaisse").s);
  const decoupe = P.taches.find((t) => t.k === "garn" && t.g && t.g.id === "t1")!;
  assert.equal(decoupe.wi, tache(P, montagne.id, "abaisse").wi);
});

/* ---------- 5. Invariants ---------- */

function verifierInvariants(P: Plan, mode: Mode, nom: string) {
  // Aucune ressource utilisée deux fois au même moment
  for (const rs of ["op", "petrin", "lam", "feu"]) {
    const iv = P.taches.filter((t) => t.d > 0 && t.res.includes(rs)).sort((a, b) => a.s - b.s);
    for (let i = 1; i < iv.length; i++) {
      assert.ok(iv[i].s >= iv[i - 1].s + iv[i - 1].d, `${nom} : ${rs} pris deux fois (${iv[i - 1].id} et ${iv[i].id})`);
    }
  }
  // Froids jamais plus courts que le minimum
  for (const t of P.taches.filter((x) => x.kind === "froid")) assert.ok(t.d >= (t.min as number), `${nom} : ${t.id} trop court`);
  // Jamais plus de congel.max productions entre congélation et fin de mise en sachet
  const sejours = P.chaines.map((c) => [c.jalon, (c.sachetA ?? c.sachetDes) + 15]);
  for (const [debut] of sejours) {
    const presentes = sejours.filter(([a, b]) => a <= debut && debut < b).length;
    assert.ok(presentes <= R.congel.max, `${nom} : ${presentes} productions au congélateur à ${heureEtJour(debut)}`);
  }
  // Nettoyage entre deux abaisses de familles différentes le même jour
  const abaisses = P.taches.filter((t) => t.k === "abaisse").sort((a, b) => a.s - b.s);
  for (let i = 1; i < abaisses.length; i++) {
    const [a, b] = [abaisses[i - 1], abaisses[i]];
    if (a.wi !== b.wi || a.fam === b.fam) continue;
    const nettoyage = P.taches.some((t) => t.k === "nettoyage" && t.s >= a.s + a.d && t.s + t.d <= b.s);
    assert.ok(nettoyage, `${nom} : pas de nettoyage entre ${a.id} et ${b.id}`);
  }
  // Découpage des productions entre les jours
  for (const c of P.chaines) {
    const jour = (k: string) => tache(P, c.id, k).wi;
    if (mode === "traite") {
      assert.equal(new Set(["pesage", "formage", "tourage", "abaisse"].map(jour)).size, 1, `${nom} : ${c.id} coupée entre deux jours`);
    } else {
      assert.equal(jour("pesage"), jour("formage"), `${nom} : ${c.id} pesage et formage le même jour`);
      assert.equal(jour("tourage"), jour("abaisse"), `${nom} : ${c.id} tourage et abaisse le même jour`);
      assert.equal(jour("tourage"), jour("formage") + 1, `${nom} : ${c.id} B2 et B3 le lendemain de B0 et B1`);
    }
  }
}

const HUIT: [string, number][] = [["lune", 2], ["rose", 1], ["cabosse", 1], ["montagne", 3], ["goet", 1]];
const CINQ_JOURS_TRAITE: Horaire[] = [["07:00", "20:00"], ["07:00", "20:00"], ["07:00", "20:00"], ["07:00", "20:00"], ["07:00", "20:00"]];
const CINQ_JOURS_DEUX: Horaire[] = [["16:00", "21:00"], ["07:00", "19:00"], ["07:00", "19:00"], ["07:00", "19:00"], ["07:00", "19:00"]];

test("invariants : ressources, froids, congélateur, nettoyages et découpage des jours, dans les deux modes", () => {
  verifierInvariants(plan([["lune", 1]], "traite", [["07:00", "20:00"]]), "traite", "une Lune");
  verifierInvariants(plan([["lune", 1]], "deux", [["16:00", "21:00"], ["07:00", "19:00"]]), "deux", "une Lune en deux temps");
  verifierInvariants(plan([["lune", 1], ["rose", 1], ["montagne", 1]], "traite", SAMEDI_DIMANCHE), "traite", "trois productions");
  verifierInvariants(plan([["lune", 1], ["rose", 1], ["montagne", 1]], "deux", [["16:00", "21:00"], ["07:00", "19:00"], ["07:00", "19:00"]]), "deux", "trois productions en deux temps");
  verifierInvariants(plan(HUIT, "traite", CINQ_JOURS_TRAITE), "traite", "huit productions");
  verifierInvariants(plan(HUIT, "deux", CINQ_JOURS_DEUX), "deux", "huit productions en deux temps");
});

test("performance : 8 productions sur 5 jours en moins de 300 ms, dans chaque mode", () => {
  for (const [mode, jours] of [["traite", CINQ_JOURS_TRAITE], ["deux", CINQ_JOURS_DEUX]] as [Mode, Horaire[]][]) {
    const debut = performance.now();
    plan(HUIT, mode, jours);
    const ms = performance.now() - debut;
    assert.ok(ms < 300, `${mode} : ${Math.round(ms)} ms`);
  }
});

/* ---------- 6. Débordement ---------- */

test("débordement : quatre productions sur un seul jour donnent les avertissements de plage et de congélateur", () => {
  const P = plan([["lune", 1], ["rose", 1], ["montagne", 1], ["cabosse", 1]], "traite", [["07:00", "20:00"]]);
  const genres = P.avertissements.map((a) => a.k);
  assert.ok(genres.includes("over"), "avertissement de dépassement");
  assert.ok(genres.includes("congel"), "avertissement congélateur");
  assert.match(P.avertissements.find((a) => a.k === "over")!.t, /^Ça dépasse ta plage horaire de .+ ce jour-là : commence plus tôt, finis plus tard ou ajoute un jour\.$/);
});

/* ---------- 7. Réglages ---------- */

test("réglages : noix-f devient noix ; nombre négatif et congel.max à 0 refusés", () => {
  const maquette = copie();
  maquette.v.g["noix-f"] = 50;
  maquette.garn.push({ id: "t3", nom: "Garniture test", produits: ["noix-f"], min: 10, todo: true });
  maquette.todo = { "v.g.noix-f": true };
  const r = lireReglagesTexte(JSON.stringify(maquette));
  assert.equal(r.v.g.noix, 50);
  assert.equal(r.v.g["noix-f"], undefined);
  assert.deepEqual(r.garn[2].produits, ["noix"]);
  assert.deepEqual(r.todo, { "v.g.noix": true });

  const negatif = copie();
  negatif.v.st.pousse = -5;
  assert.throws(() => validerReglages(negatif), (e: unknown) => e instanceof ErreurReglages && /v\.st\.pousse/.test(e.message));
  const sansPlace = copie();
  sansPlace.congel.max = 0;
  assert.throws(() => validerReglages(sansPlace), (e: unknown) => e instanceof ErreurReglages && /congel\.max/.test(e.message));
  const tropDePlaces = copie();
  tropDePlaces.congel.max = 7;
  assert.throws(() => validerReglages(tropDePlaces), ErreurReglages);
  assert.throws(() => lireReglagesTexte("pas du json"), ErreurReglages);
  assert.throws(() => lireReglagesTexte(" ".repeat(50_001)), /50 ko/);
});

test("plan en cours : validé, coches gardées, valeurs hors bornes refusées", () => {
  const p = validerPlan({ fam: "both", prods: { lune: 1, rose: 0 }, mode: "traite", date: "2026-10-24", jours: { traite: [["07:00", "20:00"]], deux: [["16:00", "21:00"], ["07:00", "19:00"]] }, checks: { "2026-10-24|V1-pes-pesage": 1 } });
  assert.deepEqual(p.prods, { lune: 1 });
  assert.deepEqual(p.checks, { "2026-10-24|V1-pes-pesage": 1 });
  const base = { fam: "both", prods: {}, mode: "traite", date: "2026-10-24", jours: { traite: [["07:00", "20:00"]], deux: [["16:00", "21:00"], ["07:00", "19:00"]] }, checks: {} };
  assert.throws(() => validerPlan({ ...base, prods: { lune: 10 } }), ErreurReglages);
  assert.throws(() => validerPlan({ ...base, date: "2026-02-30" }), ErreurReglages);
  assert.throws(() => validerPlan({ ...base, jours: { traite: [], deux: base.jours.deux } }), ErreurReglages);
  assert.throws(() => validerPlan({ ...base, jours: { traite: [["7h", "20:00"]], deux: base.jours.deux } }), ErreurReglages);
});
