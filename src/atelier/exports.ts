/* Exports CSV de traçabilité (lot 3 bis) : fiche d'un lot, rappel, registre d'une période.
   Mêmes conventions que les autres exports (outils.ts) : séparateur « ; », BOM, virgule décimale. */

import { csv, GENRES, heure, jourIso, nombre, nomCourt, telecharger } from "./outils";
import type { Etat, FicheLot, LotLie, NoeudAmont, Rappel, Registre } from "./types";

/** « via Pâte levée feuilletée P191026-1 » */
export const via = (x: { via: LotLie[] }) => (x.via.length ? `via ${x.via.map((v) => `${v.nom} ${v.numero}`).join(" › ")}` : "");

const NIVEAU = ["Ce lot", "1", "2", "3", "4", "5", "6"];

/** Arbre amont à plat ; `chemin` : n° des préparations intermédiaires. */
function lignesAmont(noeuds: NoeudAmont[], etat: Etat, chemin: string[] = []): (string | number)[][] {
  return noeuds.flatMap((n) => {
    const a = etat.articles.find((x) => x.id === n.article);
    return [[n.niveau, n.nom, n.numero, n.fournisseur, n.fabrication, n.ddm, n.quantite, a ? a.unite : n.unite, chemin.join(" › ")] as (string | number)[]].concat(
      lignesAmont(n.enfants, etat, chemin.concat(n.numero))
    );
  });
}

const ENTETE_AMONT = ["Niveau", "Article consommé", "N° de lot", "Fournisseur", "Réception / fabrication", "DDM / date limite", "Quantité utilisée", "Unité", "Via"];

/** Fiche de traçabilité d'un lot : en-tête, arbre amont, lots en aval, mouvements du lot. */
export function exporterFicheLot(fiche: FicheLot, etat: Etat): void {
  const l = fiche.lot;
  const lignes: (string | number)[][] = [
    ["Fiche de traçabilité"],
    ["Article", l.nom],
    ["N° de lot", l.numero],
    ["Fabrication / réception", l.fabrication],
    ["DDM / date limite", l.ddm],
    ["Quantité produite ou reçue", l.quantiteEntree],
    ["État", l.bloque ? `Bloqué (${l.blocage ? l.blocage.motif : ""})` : "Utilisable"],
    [],
    ["Amont"],
    ENTETE_AMONT,
  ];
  if (fiche.amont.length) lignes.push(...lignesAmont(fiche.amont, etat));
  else lignes.push([l.sansMatieres ? "Matières non renseignées" : "Lot reçu : pas d'amont"]);
  lignes.push([], ["Aval"], ["Niveau", "Article", "N° de lot", "Via", "Bloqué", ...etat.emplacements.map((e) => `Stock ${e.court}`)]);
  fiche.aval.forEach((x) => lignes.push([x.niveau, x.nom, x.numero, via(x), x.bloque ? "oui" : "", ...etat.emplacements.map((e) => x.quantites[e.id] || 0)]));
  lignes.push([], ["Mouvements du lot"], ["Date", "Heure", "Type", "Motif", "Emplacement", "Quantité", "Référence", "Annulé"]);
  fiche.historique
    .slice()
    .reverse()
    .forEach((m) => lignes.push([jourIso(m.horodatage), heure(m.horodatage), GENRES[m.type] || m.type, m.motif, nomCourt(etat, m.emplacement), m.quantite, m.reference, m.annule ? "oui" : ""]));
  telecharger(`tracabilite-${l.numero}-${jourIso(Date.now())}.csv`, csv(lignes));
}

/** Rappel : résumé, amont, aval avec stock et sorties, clients livrés, ventes à la ferme. */
export function exporterRappel(r: Rappel, etat: Etat): void {
  const lignes: (string | number)[][] = [["Rappel", r.lot.nom, r.lot.numero], [r.resume.texte], [], ["Amont"], ENTETE_AMONT];
  lignes.push(...lignesAmont(r.amont, etat));
  lignes.push([], ["Aval"], ["Niveau", "Article", "N° de lot", "Via", "Produit ou reçu", "Stock Marseille", "Stock En route", "Stock Ferme", "Sorties", "Bloqué"]);
  r.aval.forEach((x) =>
    lignes.push([
      NIVEAU[x.niveau] || x.niveau,
      x.nom,
      x.numero,
      via(x),
      x.entree,
      x.quantites.marseille || 0,
      x.quantites.route || 0,
      x.quantites.ferme || 0,
      Object.entries(x.sorties)
        .map(([m, q]) => `${m} ${nombre(q)}`)
        .join(" · "),
      x.bloque ? "oui" : "",
    ])
  );
  lignes.push([], ["Clients livrés"], ["Commande", "Remise le", "Sachets", "Lots", "Prénom", "Nom", "Téléphone", "E-mail"]);
  r.clients.forEach((c) => lignes.push([c.commande, jourIso(c.remiseLe), c.sachets, c.lots.join(", "), c.prenom, c.nom, c.telephone, c.email]));
  lignes.push([], ["Ventes à la ferme"], ["Période", "Sachets", "Lots"]);
  r.ferme.forEach((f) => lignes.push([f.libelle, f.sachets, f.lots.map((l) => `${l.numero} : ${nombre(l.sachets)}`).join(" · ")]));
  telecharger(`rappel-${r.lot.numero}-${jourIso(Date.now())}.csv`, csv(lignes));
}

/** Registre de traçabilité d'une période : une ligne par couple (lot fabriqué, lot consommé). */
export function exporterRegistre(r: Registre): void {
  const lignes: (string | number)[][] = [
    [
      "Date de fabrication",
      "Article fabriqué",
      "N° de lot fabriqué",
      "Quantité",
      "Unité",
      "Article consommé",
      "N° de lot consommé",
      "Fournisseur",
      "Date de réception",
      "DDM / date limite",
      "Quantité utilisée",
      "Unité utilisée",
      "Via",
    ],
  ];
  r.lignes.forEach((l) =>
    lignes.push([
      l.fabrication,
      l.article,
      l.numero,
      l.quantite,
      l.unite,
      l.consomme,
      l.numeroConsomme,
      l.fournisseur,
      l.reception,
      l.ddm,
      l.quantiteUtilisee === null ? "" : l.quantiteUtilisee,
      l.uniteUtilisee,
      l.via,
    ])
  );
  telecharger(`registre-tracabilite-${r.du}-au-${r.au}.csv`, csv(lignes));
}
