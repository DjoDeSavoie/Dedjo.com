/* Tests du stock de l'Atelier (apps-script/Stock.gs), sans dépendance :
     node --test apps-script/tests/stock.test.mjs
   Le script tourne sur le faux Google de faux-google.mjs (faux classeur en mémoire). Toutes les
   données sont inventées. */

import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { CODE, STOCK, SECRET_COMMANDES, SECRET_STOCK, HEURE, brut, creerEnvironnement, preparer } from "./faux-google.mjs";

/* ===================================================================
   RÈGLES PURES
   =================================================================== */

test("n° de lot : La Lune, code 1, fabriquée le 12/09/2026, DDM 12/01/2027 → 11209260127", () => {
  const env = creerEnvironnement();
  assert.equal(env.regles.numeroLotProduit("1", "2026-09-12", "2027-01-12"), "11209260127");
  assert.equal(env.regles.ddmProposee("2026-09-12", 4), "2027-01-12");
  assert.equal(env.regles.numeroLotReception("2026-09-15", "Farine de blé"), "R150926-FAR");
  assert.equal(env.regles.numeroLotReception("2026-09-15", "Œufs"), "R150926-OEU");
});

test("DDM ramenée au dernier jour du mois", () => {
  const { regles } = creerEnvironnement();
  assert.equal(regles.ajouterMois("2026-10-31", 4), "2027-02-28");
  assert.equal(regles.ajouterMois("2027-10-31", 4), "2028-02-29"); // année bissextile
  assert.equal(regles.ajouterMois("2026-08-31", 2), "2026-10-31");
  assert.equal(regles.ajouterMois("2026-11-30", 2), "2027-01-30");
  assert.equal(regles.ddmProposee("2026-09-12", null), "");
});

test("comparaison du secret en temps constant", () => {
  const { regles } = creerEnvironnement();
  assert.equal(regles.egaliteConstante("abc", "abc"), true);
  assert.equal(regles.egaliteConstante("abc", "abd"), false);
  assert.equal(regles.egaliteConstante("abc", "abcd"), false);
});

/* ===================================================================
   CLASSEUR ET OPÉRATIONS
   =================================================================== */

test("initialiserStock crée le classeur, ses onglets et le catalogue initial, sans doublon à la relance", () => {
  const env = creerEnvironnement();
  env.ctx.initialiserStock();
  const ss = env.stock();
  assert.ok(env.proprietes.get("STOCK_SPREADSHEET_ID"));
  assert.equal(ss.fuseau, "Europe/Paris");
  assert.deepEqual(
    ss.getSheets().map((f) => f.getName()),
    ["Articles", "Emplacements", "Lots", "Mouvements", "Reservations", "Passages", "PassagesDetail"]
  );
  const articles = env.onglet("Articles");
  const produits = articles.filter((a) => a["Catégorie"] === "produit");
  assert.deepEqual(produits.map((a) => a.Id), ["lune", "cabosse", "grappe", "rose", "montagne", "foret", "noix", "goet"]);
  assert.deepEqual(produits.map((a) => a["Code lot"]), ["1", "2", "3", "4", "5", "6", "7", "8"]);
  assert.deepEqual(produits.map((a) => a["Conservation (mois)"]), [4, 4, 4, 4, 2, 2, 2, 2]);
  assert.deepEqual(produits.map((a) => a["Code lot confirmé"]), ["oui", "non", "non", "non", "non", "non", "non", "non"]);
  assert.equal(produits.find((a) => a.Id === "grappe")["Pièces par sachet"], 4);
  assert.ok(articles.some((a) => a.Id === "mp-farine" && a["Catégorie"] === "matiere"));
  assert.ok(articles.some((a) => a.Id === "emb-sacs" && a["Catégorie"] === "emballage"));
  assert.equal(articles.length, 8 + 19 + 2);
  assert.deepEqual(
    env.onglet("Emplacements").map((e) => [e.Id, e["Compte pour le site"]]),
    [["marseille", "oui"], ["ferme", "non"], ["route", "non"]]
  );

  env.ctx.initialiserStock();
  assert.equal(env.onglet("Articles").length, 29);
  assert.equal(env.stock(), ss);
  assert.deepEqual(brut(env.dispo()), { lune: "bientot", cabosse: "bientot", grappe: "bientot", rose: "bientot", montagne: "bientot", foret: "bientot", noix: "bientot", goet: "bientot" });
});

test("production : n° de lot et DDM calculés, la même production s'ajoute au lot existant", () => {
  const env = preparer();
  const r = env.operation("production", { article: "lune", quantite: 10, fabrication: "2026-09-12" });
  assert.equal(r.ok, true, r.error);
  assert.equal(r.message, "Production enregistrée · lot 11209260127");
  const r2 = env.operation("production", { article: "lune", quantite: 5, fabrication: "2026-09-12" });
  assert.equal(r2.message, "Production enregistrée · lot 11209260127");
  const lots = env.onglet("Lots");
  assert.equal(lots.length, 1);
  assert.equal(lots[0]["N° de lot"], "11209260127");
  assert.equal(lots[0]["DDM ou date limite"], "2027-01-12");
  assert.equal(env.quantite("lune", "marseille"), 15);
});

test("production avec matières : prises par lots dans l'ordre des DDM, tracées dans « Intrants » et « utilisé dans »", () => {
  const env = preparer();
  assert.equal(env.operation("reception", { article: "mp-farine", quantite: 2, reception: "2026-09-01", ddm: "2027-03-01", numero: "F-B" }).ok, true);
  assert.equal(env.operation("reception", { article: "mp-farine", quantite: 2, reception: "2026-09-05", ddm: "2027-01-01", numero: "F-A" }).ok, true);
  const r = env.operation("production", {
    article: "cabosse",
    quantite: 6,
    fabrication: "2026-09-12",
    intrants: [{ article: "mp-farine", quantite: 3 }],
  });
  assert.equal(r.ok, true, r.error);
  const lot = env.onglet("Lots").find((l) => l.Article === "cabosse");
  const intrants = JSON.parse(lot.Intrants);
  assert.deepEqual(intrants.map((i) => [i.lot, i.quantite]), [["mp-farine/F-A", 2], ["mp-farine/F-B", 1]]);

  const fiche = env.appeler("stock.lot", { lot: "mp-farine/F-B" });
  assert.equal(fiche.lot.quantites.marseille, 1);
  assert.deepEqual(fiche.utiliseDans.map((u) => [u.lot, u.quantite]), [[lot.Id, 1]]);
  const produit = env.appeler("stock.lot", { lot: lot.Id });
  assert.deepEqual(produit.intrants.map((i) => i.numero), ["F-A", "F-B"]);
});

test("réception : n° automatique R + JJMMAA + 3 lettres, et refus pour un produit fini", () => {
  const env = preparer();
  const r = env.operation("reception", { article: "mp-beurre", quantite: 2.5, reception: "2026-09-15" });
  assert.equal(r.message, "Réception enregistrée · lot R150926-BEU");
  assert.equal(env.quantite("mp-beurre", "marseille"), 2.5);
  const refus = env.operation("reception", { article: "lune", quantite: 1 });
  assert.equal(refus.ok, false);
  assert.match(refus.error, /production/);
});

test("ordre de sortie : DDM la plus proche d'abord, puis fabrication la plus ancienne", () => {
  const env = preparer();
  env.operation("production", { article: "rose", quantite: 3, fabrication: "2026-09-10", ddm: "2027-02-10", numero: "TARD" });
  env.operation("production", { article: "rose", quantite: 3, fabrication: "2026-09-12", ddm: "2027-01-10", numero: "TOT-RECENT" });
  env.operation("production", { article: "rose", quantite: 3, fabrication: "2026-09-08", ddm: "2027-01-10", numero: "TOT-ANCIEN" });
  const r = env.operation("sortie", { emplacement: "marseille", motif: "Vente", lignes: [{ article: "rose", quantite: 5 }] });
  assert.equal(r.ok, true, r.error);
  const sorties = env.onglet("Mouvements").filter((m) => m.Type === "sortie");
  assert.deepEqual(sorties.map((m) => [m.Lot, m["Quantité"]]), [["rose/TOT-ANCIEN", -3], ["rose/TOT-RECENT", -2]]);

  // Un lot précis peut être choisi
  env.operation("sortie", { emplacement: "marseille", motif: "Perte", lignes: [{ article: "rose", quantite: 1, lot: "rose/TARD" }] });
  assert.equal(env.appeler("stock.lot", { lot: "rose/TARD" }).lot.quantites.marseille, 2);
});

test("refus d'un stock négatif : rien n'est écrit, même pour les lignes valides", () => {
  const env = preparer();
  env.operation("production", { article: "lune", quantite: 4, fabrication: "2026-09-12" });
  env.operation("production", { article: "montagne", quantite: 2, fabrication: "2026-09-12" });
  const avant = env.onglet("Mouvements").length;
  const r = env.operation("sortie", {
    emplacement: "marseille",
    motif: "Vente",
    lignes: [{ article: "lune", quantite: 2 }, { article: "montagne", quantite: 3 }],
  });
  assert.equal(r.ok, false);
  assert.equal(r.error, "Stock insuffisant : La Montagne à Marseille, il manque 1 sachet.");
  assert.equal(env.onglet("Mouvements").length, avant);
  assert.equal(env.quantite("lune", "marseille"), 4);

  const envoi = env.operation("envoi", { lignes: [{ article: "lune", quantite: 5 }] });
  assert.equal(envoi.error, "Stock insuffisant : La Lune à Marseille, il manque 1 sachet.");
  const lot = env.operation("sortie", { emplacement: "marseille", motif: "Vente", lignes: [{ article: "lune", quantite: 5, lot: "lune/11209260127" }] });
  assert.equal(lot.error, "Le lot 11209260127 n'a que 4 sachets à Marseille.");
});

test("idempotence : le même idOperation renvoie le résultat précédent sans rien réécrire", () => {
  const env = preparer();
  const champs = { article: "goet", quantite: 6, fabrication: "2026-09-12", idOperation: "operation-rejouee-1" };
  const premier = env.operation("production", champs);
  const lignes = env.onglet("Mouvements").length;
  const second = env.operation("production", champs);
  assert.equal(second.ok, true);
  assert.equal(second.deja, true);
  assert.equal(second.message, premier.message);
  assert.equal(env.onglet("Mouvements").length, lignes);
  assert.equal(env.quantite("goet", "marseille"), 6);

  const sortie = { emplacement: "marseille", motif: "Dégustation / offert", lignes: [{ article: "goet", quantite: 1 }], idOperation: "operation-rejouee-2" };
  env.operation("sortie", sortie);
  env.operation("sortie", sortie);
  assert.equal(env.quantite("goet", "marseille"), 5);

  assert.equal(env.operation("sortie", Object.assign({}, sortie, { idOperation: "court" })).error, "Identifiant d'opération manquant ou invalide.");
});

test("annulation : acceptée sans effacer de ligne, refusée si le stock a déjà servi", () => {
  const env = preparer();
  env.operation("production", { article: "lune", quantite: 10, fabrication: "2026-09-12", idOperation: "production-a-annuler" });
  env.operation("envoi", { lignes: [{ article: "lune", quantite: 4 }], idOperation: "envoi-ferme-0001" });
  env.operation("transfert", { de: "route", vers: "ferme", lignes: [{ article: "lune", quantite: 4 }], idOperation: "transfert-0001" });
  env.operation("sortie", { emplacement: "ferme", motif: "Vente", lignes: [{ article: "lune", quantite: 3 }] });

  // Le transfert vers la ferme a déjà été vendu : son annulation rendrait le lot négatif à la ferme
  const refus = env.appeler("stock.annuler", { operation: "transfert-0001" });
  assert.equal(refus.ok, false);
  assert.equal(refus.error, "Annulation impossible : ce stock a déjà servi. Corrige plutôt par une nouvelle saisie.");

  // Une sortie dont le stock n'a pas resservi s'annule
  const lignes = env.onglet("Mouvements").length;
  const sortie = env.operation("sortie", { emplacement: "marseille", motif: "Perte", lignes: [{ article: "lune", quantite: 1 }], idOperation: "sortie-a-annuler" });
  assert.equal(sortie.ok, true);
  const ok = env.appeler("stock.annuler", { operation: "sortie-a-annuler" });
  assert.equal(ok.ok, true, ok.error);
  assert.equal(env.quantite("lune", "marseille"), 6);
  const mouvements = env.onglet("Mouvements");
  assert.equal(mouvements.length, lignes + 1); // la ligne reste, marquée annulée
  assert.equal(mouvements[mouvements.length - 1]["Annulé"], "oui");

  // Annuler deux fois ne change rien
  assert.equal(env.appeler("stock.annuler", { operation: "sortie-a-annuler" }).ok, true);
  assert.equal(env.quantite("lune", "marseille"), 6);
  assert.equal(env.appeler("stock.annuler", { operation: "inconnue-0001" }).error, "Opération introuvable.");
});

test("inventaire : seuls les écarts sont enregistrés", () => {
  const env = preparer();
  env.operation("production", { article: "lune", quantite: 10, fabrication: "2026-09-12" });
  const r = env.operation("inventaire", { emplacement: "marseille", comptes: [{ lot: "lune/11209260127", quantite: 8 }] });
  assert.equal(r.message, "Inventaire enregistré · 1 écart");
  assert.equal(env.quantite("lune", "marseille"), 8);
  const sansEcart = env.operation("inventaire", { emplacement: "marseille", comptes: [{ lot: "lune/11209260127", quantite: 8 }] });
  assert.equal(sansEcart.message, "Inventaire enregistré · aucun écart");
});

/* ===================================================================
   STATUTS DU SITE ET RÉSERVATIONS
   =================================================================== */

test("statuts du site : disponible, victime, bientôt, avec la réserve hors site", () => {
  const env = preparer();
  env.operation("production", { article: "lune", quantite: 10, fabrication: "2026-09-12" });
  env.operation("production", { article: "cabosse", quantite: 2, fabrication: "2026-09-12" });
  env.operation("sortie", { emplacement: "marseille", motif: "Vente", lignes: [{ article: "cabosse", quantite: 2 }] });
  // Une Grappe produite à Marseille mais entièrement envoyée vers la ferme
  env.operation("production", { article: "grappe", quantite: 3, fabrication: "2026-09-12" });
  env.operation("envoi", { lignes: [{ article: "grappe", quantite: 3 }] });

  let statuts = env.dispo();
  assert.equal(statuts.lune, "disponible");
  assert.equal(statuts.cabosse, "victime");
  assert.equal(statuts.grappe, "victime"); // « En route » ne compte jamais pour le site
  assert.equal(statuts.rose, "bientot");

  // Réserve hors site : 10 Lune gardées pour la ferme → plus rien de disponible pour le site
  assert.equal(env.appeler("stock.catalogue", { articles: [{ id: "lune", reserveHorsSite: 10 }] }).ok, true);
  statuts = env.dispo();
  assert.equal(statuts.lune, "victime");
  env.appeler("stock.catalogue", { articles: [{ id: "lune", reserveHorsSite: 9 }] });
  assert.equal(env.dispo().lune, "disponible");

  // La réponse publique ne contient aucun nombre de stock
  const reponse = env.appeler("stock.dispo");
  assert.deepEqual(Object.keys(reponse).sort(), ["actif", "maj", "ok", "produits"]);
  assert.ok(Object.values(reponse.produits).every((s) => ["disponible", "victime", "bientot"].includes(s)));
});

test("commande du site sans STOCK_ACTIF : fonctionne comme avant, sans ouvrir le classeur Stock", () => {
  const env = creerEnvironnement();
  const reponse = env.testerCommande();
  assert.deepEqual(brut(reponse), { ok: true, id: "D-0001" });
  assert.equal(env.ouvertures, 0);
  const commandes = env.commandes.getSheetByName("Commandes").objets();
  assert.equal(commandes.length, 1);
  assert.equal(commandes[0]["N° de commande"], "D-0001");
  assert.equal(commandes[0]["Total (€)"], 25);
  assert.equal(env.proprietes.get("DERNIER_NUMERO"), "1");
});

test("réservations : refus si le stock manque, réservation, remise au client et annulation", () => {
  const env = preparer();
  env.proprietes.set("STOCK_ACTIF", "oui");

  // testerCommande commande 1 Lune et 1 Montagne : rien en stock, la commande est refusée
  let reponse = env.testerCommande();
  assert.deepEqual(brut(reponse), { ok: false, error: "La Lune est victime de son succès : retire-le de ton panier pour valider ta commande." });
  assert.equal(env.commandes.getSheetByName("Commandes"), null);

  env.operation("production", { article: "lune", quantite: 1, fabrication: "2026-09-12" });
  env.operation("production", { article: "montagne", quantite: 1, fabrication: "2026-09-12" });
  reponse = env.testerCommande();
  assert.deepEqual(brut(reponse), { ok: true, id: "D-0001" });
  const reservations = env.onglet("Reservations");
  assert.deepEqual(reservations.map((r) => [r["N° de commande"], r.Article, r.Sachets, r.Statut]), [
    ["D-0001", "lune", 1, "ouverte"],
    ["D-0001", "montagne", 1, "ouverte"],
  ]);
  // Les sachets réservés ne sont plus disponibles pour le site, mais restent en stock physique
  assert.equal(env.dispo().lune, "victime");
  assert.equal(env.quantite("lune", "marseille"), 1);
  const etat = env.appeler("stock.etat");
  assert.equal(etat.reservations.length, 1);
  assert.equal(etat.reservations[0].commande, "D-0001");
  assert.equal(etat.reservations[0].prenom, "Test");
  assert.equal(etat.reservations[0].produits.length, 2);

  // Remise au client : sortie du stock de Marseille, « Livrée » cochée dans le classeur des commandes
  const remise = env.appeler("stock.commande", { commande: "D-0001", decision: "remise", idOperation: "remise-d0001" });
  assert.equal(remise.ok, true, remise.error);
  assert.equal(remise.message, "Commande D-0001 remise au client");
  assert.equal(remise.livreeCochee, true);
  assert.equal(env.commandes.getSheetByName("Commandes").objets()[0]["Livrée"], "oui");
  assert.equal(env.quantite("lune", "marseille"), 0);
  assert.deepEqual(env.onglet("Reservations").map((r) => r.Statut), ["remise", "remise"]);
  const sorties = env.onglet("Mouvements").filter((m) => m.Motif === "Commande D-0001");
  assert.equal(sorties.length, 2);

  // Annuler la remise remet le stock et rouvre la réservation
  assert.equal(env.appeler("stock.annuler", { operation: "remise-d0001" }).ok, true);
  assert.equal(env.quantite("lune", "marseille"), 1);
  assert.deepEqual(env.onglet("Reservations").map((r) => r.Statut), ["ouverte", "ouverte"]);

  // Réservation annulée : les sachets sont libérés
  const annulee = env.appeler("stock.commande", { commande: "D-0001", decision: "annulee" });
  assert.equal(annulee.ok, true, annulee.error);
  assert.deepEqual(env.onglet("Reservations").map((r) => r.Statut), ["annulee", "annulee"]);
  assert.equal(env.dispo().lune, "disponible");
  assert.equal(env.appeler("stock.commande", { commande: "D-0001", decision: "annulee" }).ok, true);
  assert.equal(env.appeler("stock.commande", { commande: "D-0001", decision: "remise" }).ok, false);
});

test("« Livrée » en case à cocher : la case est cochée", () => {
  const env = preparer();
  env.proprietes.set("STOCK_ACTIF", "oui");
  env.operation("production", { article: "lune", quantite: 2, fabrication: "2026-09-12" });
  env.operation("production", { article: "montagne", quantite: 2, fabrication: "2026-09-12" });
  env.testerCommande();
  const feuille = env.commandes.getSheetByName("Commandes");
  const colonne = vm.runInContext("EN_TETES", env.ctx).indexOf("Livrée") + 1;
  feuille.casesACocher.add(`2:${colonne}`);
  feuille.getRange(2, colonne).setValue(false);
  env.appeler("stock.commande", { commande: "D-0001", decision: "remise" });
  assert.equal(feuille.getRange(2, colonne).getValues()[0][0], true);
});

/* ===================================================================
   PASSAGE À LA FERME (§ 4.7)
   =================================================================== */

test("passage à la ferme : l'exemple du brief donne 11 sachets vendus, 110 € attendus et −10 € d'écart", () => {
  const env = preparer();
  env.operation("production", { article: "lune", quantite: 12, fabrication: "2026-09-12" });
  env.operation("production", { article: "montagne", quantite: 8, fabrication: "2026-09-12" });
  env.operation("envoi", { lignes: [{ article: "lune", quantite: 6 }] }); // 6 Lune déjà en route

  // Passage 1 : rien à compter, 10 Lune et 8 Montagne ajoutées (la route d'abord, puis Marseille)
  const p1 = env.appeler("stock.passage", { horodatage: Date.now() - 48 * HEURE, ajouts: { lune: 10, montagne: 8 }, idOperation: "passage-0001" });
  assert.equal(p1.ok, true, p1.error);
  assert.equal(p1.passage.attendu, 0);
  assert.equal(env.quantite("lune", "ferme"), 10);
  assert.equal(env.quantite("lune", "route"), 0);
  assert.equal(env.quantite("lune", "marseille"), 2);
  assert.equal(env.quantite("montagne", "ferme"), 8);

  // Passage 2 : aperçu sans écriture, puis validation
  const saisie = { horodatage: Date.now() - 2 * HEURE, comptes: { lune: 4, montagne: 3 }, retraits: { montagne: 1 }, encaisse: 100 };
  const lignes = env.onglet("Mouvements").length;
  const apercu = env.appeler("stock.passage", Object.assign({ apercu: true, idOperation: "passage-0002" }, saisie));
  assert.equal(apercu.apercu, true);
  assert.equal(apercu.passage.attendu, 110);
  assert.equal(env.onglet("Mouvements").length, lignes);

  const p2 = env.appeler("stock.passage", Object.assign({ idOperation: "passage-0002" }, saisie));
  assert.equal(p2.ok, true, p2.error);
  const parProduit = Object.fromEntries(p2.passage.lignes.map((l) => [l.article, [l.attendu, l.compte, l.vendu, l.retire]]));
  assert.deepEqual(parProduit, { lune: [10, 4, 6, 0], montagne: [8, 3, 5, 1] });
  assert.equal(p2.passage.vendus, 11);
  assert.equal(p2.passage.attendu, 110);
  assert.equal(p2.passage.encaisse, 100);
  assert.equal(p2.passage.ecart, -10);
  assert.deepEqual(brut(p2.avertissements), []);
  assert.equal(env.quantite("lune", "ferme"), 4);
  assert.equal(env.quantite("montagne", "ferme"), 2);

  // Écritures : ventes constatées, perte, et le rapprochement de caisse
  const motifs = env.onglet("Mouvements").filter((m) => m["Opération"] === "passage-0002").map((m) => m.Motif);
  assert.ok(motifs.every((m) => /^Vente constatée \(passage du \d\d\/\d\d \d\d:\d\d\)$/.test(m) || m === "Perte"));
  const etat = env.appeler("stock.etat");
  assert.deepEqual(etat.passages.map((p) => [p.attendu, p.encaisse, p.ecart, p.ecartCumule]), [[0, null, null, 0], [110, 100, -10, -10]]);

  // Le passage 3 doit compter Lune et Montagne, toujours présentes à la ferme
  const manque = env.appeler("stock.passage", { comptes: { lune: 4 } });
  assert.equal(manque.error, "Compte manquant pour La Montagne : mets 0 s'il n'en reste plus.");
});

test("passage : compte supérieur au stock attendu signalé sans bloquer, encaissé complété plus tard", () => {
  const env = preparer();
  env.operation("production", { article: "lune", quantite: 10, fabrication: "2026-09-12" });
  env.appeler("stock.passage", { horodatage: Date.now() - 72 * HEURE, ajouts: { lune: 5 } });
  env.appeler("stock.passage", { horodatage: Date.now() - 48 * HEURE, comptes: { lune: 2 } }); // 3 vendues
  // Un sachet avait été oublié au compte précédent : on en trouve 3 au lieu de 2
  const p = env.appeler("stock.passage", { horodatage: Date.now() - 2 * HEURE, comptes: { lune: 3 }, idOperation: "passage-sans-caisse" });
  assert.equal(p.ok, true, p.error);
  assert.equal(p.passage.lignes[0].vendu, -1);
  assert.deepEqual(brut(p.avertissements), ["La Lune : compte supérieur au stock attendu, vérifie le passage précédent."]);
  assert.equal(env.quantite("lune", "ferme"), 3);
  assert.equal(p.passage.ecart, null); // encaissé vide : à compléter

  const e = env.appeler("stock.encaissement", { passage: "passage-sans-caisse", encaisse: "0" });
  assert.equal(e.ok, true, e.error);
  assert.equal(e.passage.ecart, 10);

  // Annuler un passage annule toutes ses lignes
  assert.equal(env.appeler("stock.annuler", { operation: "passage-sans-caisse" }).ok, true);
  assert.equal(env.quantite("lune", "ferme"), 2);
  assert.equal(env.onglet("Passages").find((x) => x.Id === "passage-sans-caisse")["Annulé"], "oui");
});

/* ===================================================================
   REPRISE, RÉGLAGES, SÉCURITÉ
   =================================================================== */

test("reprise : import du CSV « Stock par lot » de la maquette, articles reconnus par leur nom", () => {
  const env = preparer();
  const csv = [
    "\uFEFFCatégorie;Article;N° de lot;Fabrication / réception;DDM / date limite;Fournisseur;Emplacement;Quantité;Unité",
    "Produits finis;La Noix;71209260127;2026-09-12;2026-11-12;;Marseille;3;sachets",
    "Produits finis;La Lune;11209260127;2026-09-12;2027-01-12;;Ferme de la Goëttaz;1;sachet",
    'Matières premières;Farine de blé;"F;42";2026-09-01;2027-03-01;"Moulin ""Exemple""";Marseille;12,5;kg',
  ].join("\r\n");
  const r = env.appeler("stock.import", { csv });
  assert.equal(r.ok, true, r.error);
  assert.equal(r.message, "Reprise importée · 3 lignes");
  assert.equal(env.quantite("noix", "marseille"), 3);
  assert.equal(env.quantite("lune", "ferme"), 1);
  assert.equal(env.quantite("mp-farine", "marseille"), 12.5);
  assert.equal(env.onglet("Lots").find((l) => l.Article === "mp-farine").Fournisseur, 'Moulin "Exemple"');
  assert.equal(env.dispo().noix, "disponible");

  // Une seconde reprise doit être confirmée ; un fichier invalide est refusé en entier
  assert.match(env.appeler("stock.import", { csv }).error, /déjà été importée/);
  const faux = csv.replace("La Noix", "La Noisette").replace("sachet\r", "kg\r");
  const refus = env.appeler("stock.import", { csv: faux, forcer: true });
  assert.equal(refus.ok, false);
  assert.match(refus.error, /ligne 2 : article inconnu « La Noisette »/);
  assert.match(refus.error, /ligne 3 : unité « kg » différente/);
  assert.equal(env.quantite("noix", "marseille"), 3);
});

test("réglages : un code lot modifié est confirmé, l'unité ne change plus après une saisie", () => {
  const env = preparer();
  const r = env.appeler("stock.catalogue", { articles: [{ id: "cabosse", codeLot: "2" }] });
  assert.equal(r.ok, true, r.error);
  assert.equal(env.onglet("Articles").find((a) => a.Id === "cabosse")["Code lot confirmé"], "non");
  env.appeler("stock.catalogue", { articles: [{ id: "cabosse", codeLot: "9" }] });
  assert.equal(env.onglet("Articles").find((a) => a.Id === "cabosse")["Code lot confirmé"], "oui");

  env.operation("reception", { article: "mp-sucre", quantite: 1 });
  assert.match(env.appeler("stock.catalogue", { articles: [{ id: "mp-sucre", unite: "g" }] }).error, /ne change plus/);
  const nouveau = env.appeler("stock.catalogue", { articles: [{ id: "mp-vanille", nom: "Vanille", categorie: "matiere", unite: "g" }] });
  assert.equal(nouveau.ok, true, nouveau.error);
  assert.match(env.appeler("stock.catalogue", { articles: [{ id: "vanille", nom: "Vanille", categorie: "matiere", unite: "g" }] }).error, /mp-/);
  env.appeler("stock.catalogue", { emplacements: [{ id: "route", site: true }] });
  assert.equal(env.onglet("Emplacements").find((e) => e.Id === "route")["Compte pour le site"], "non");
});

test("sécurité : secret du stock exigé, distinct de celui des commandes", () => {
  const env = preparer();
  assert.deepEqual(brut(env.appeler("stock.etat", { secret: SECRET_COMMANDES })), { ok: false, error: "Accès refusé." });
  assert.deepEqual(brut(env.appeler("stock.etat", { secret: undefined })), { ok: false, error: "Accès refusé." });
  env.proprietes.set("STOCK_SECRET", SECRET_COMMANDES);
  assert.deepEqual(brut(env.appeler("stock.etat", { secret: SECRET_COMMANDES })), { ok: false, error: "Accès refusé." });
  env.proprietes.delete("STOCK_SECRET");
  assert.deepEqual(brut(env.appeler("stock.etat", { secret: "" })), { ok: false, error: "Accès refusé." });
  env.proprietes.set("STOCK_SECRET", SECRET_STOCK);
  assert.equal(env.appeler("stock.inconnue").error, "Action inconnue.");
  assert.equal(env.appeler("stock.etat").ok, true);

  // Le secret des commandes n'ouvre pas le stock, et une action inconnue n'est pas une commande
  const commande = JSON.parse(env.ctx.doPost({ postData: { contents: JSON.stringify({ action: "autre", secret: SECRET_COMMANDES }) } }).getContent());
  assert.equal(commande.error, "Action inconnue.");

  env.verrouOccupe = true;
  assert.equal(env.operation("reception", { article: "mp-sel", quantite: 1 }).error, "Le stock est occupé, réessaie dans un instant.");
});

test("journaux : aucune donnée de stock, et une erreur interne ne donne qu'un code", () => {
  const env = preparer();
  env.operation("production", { article: "lune", quantite: 7, fabrication: "2026-09-12" });
  env.appeler("stock.passage", { ajouts: { lune: 3 } });
  env.appeler("stock.etat");
  assert.deepEqual(env.journaux, []);

  // Onglet abîmé à la main : erreur interne journalisée avec un code, sans quantité
  env.stock().getSheetByName("Mouvements").getRange = () => {
    throw new TypeError("quantité 7 illisible");
  };
  const r = env.appeler("stock.journal");
  assert.equal(r.ok, false);
  assert.match(r.error, /^Erreur interne \(STK-[0-9A-Z]+\)/);
  assert.equal(env.journaux.length, 1);
  assert.doesNotMatch(env.journaux[0][1], /quantité 7/);
});

test("journal : opérations groupées, recherche par n° de lot et filtre par genre", () => {
  const env = preparer();
  env.operation("production", { article: "lune", quantite: 7, fabrication: "2026-09-12" });
  env.operation("reception", { article: "mp-miel", quantite: 1, numero: "MIEL-ABC", note: "pot invente" });
  env.operation("envoi", { lignes: [{ article: "lune", quantite: 2 }] });
  const tout = env.appeler("stock.journal");
  assert.equal(tout.total, 3);
  assert.deepEqual(tout.operations.map((o) => o.genre), ["envoi", "reception", "production"]);
  assert.equal(tout.operations[0].lignes.length, 2);
  assert.equal(env.appeler("stock.journal", { recherche: "miel-abc" }).total, 1);
  assert.equal(env.appeler("stock.journal", { recherche: "La Lune" }).total, 2);
  assert.equal(env.appeler("stock.journal", { genre: "production" }).total, 1);
  assert.equal(env.appeler("stock.journal", { parPage: 2, page: 2 }).operations.length, 1);

  // Un passage saisi après coup se range à sa date, pas à l'ordre de saisie
  env.appeler("stock.passage", { ajouts: { lune: 1 }, horodatage: Date.now() - 48 * HEURE, idOperation: "passage-apres-coup" });
  const ordre = env.appeler("stock.journal").operations.map((o) => o.genre);
  assert.deepEqual(ordre, ["envoi", "reception", "production", "passage"]);
});

test("Code.gs et Stock.gs ne déclarent aucun nom en double (ils partagent la même portée)", () => {
  const noms = (source) => Array.from(source.matchAll(/^(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm), (m) => m[1]);
  const code = new Set(noms(CODE));
  assert.deepEqual(noms(STOCK).filter((n) => code.has(n)), []);
});
