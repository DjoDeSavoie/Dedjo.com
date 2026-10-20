/**
 * DEDJO — L'Atelier : gestion du stock par lot
 *
 * Classeur Google séparé et privé, « Dedjo — Stock », jamais partagé. Il est créé par
 * initialiserStock(), à lancer une fois depuis l'éditeur, qui range son identifiant dans la
 * propriété STOCK_SPREADSHEET_ID. Les actions « stock.* » arrivent par doPost (Code.gs) et exigent
 * le secret STOCK_SECRET, distinct de SHARED_SECRET : une fuite de l'un ne donne pas l'autre.
 *
 * Deux parties :
 *   1. StockRegles : les règles métier, en fonctions pures (aucun service Google). Elles se chargent
 *      dans Node pour les tests : apps-script/tests/stock.test.mjs (node --test).
 *   2. StockClasseur et les fonctions du bas : lecture et écriture du classeur, sous le verrou
 *      partagé avec les commandes, cache, actions appelées par Netlify.
 *
 * Les quantités ne sont jamais stockées : chacune est la somme des mouvements non annulés.
 * Aucune ligne n'est jamais effacée : une opération s'annule (colonne « Annulé »).
 *
 * Propriétés du script (en plus de celles de Code.gs) :
 *   STOCK_SECRET          obligatoire : même valeur que STOCK_SHARED_SECRET sur Netlify, différente de SHARED_SECRET
 *   STOCK_SPREADSHEET_ID  rempli par initialiserStock() : identifiant du classeur Stock
 *   STOCK_ACTIF           « oui » : les commandes du site réservent leurs sachets (à ne mettre qu'au lot 5)
 *   STOCK_VERSION         géré automatiquement : change à chaque écriture, ce qui invalide le cache
 *
 * Journaux : jamais de quantité, de lot, de montant ni de donnée de stock, seulement un code d'erreur.
 * Mode d'emploi : apps-script/DEPLOIEMENT.md, section « Atelier (stock) ».
 */

/** Erreur métier : son message est renvoyé tel quel à l'Atelier. */
class ErreurStock extends Error {}

/* Onglets du classeur Stock : [clé, en-tête, genre]. Genres : texte, nombre, jour (AAAA-MM-JJ),
   horodatage (date et heure), ouinon (« oui » / « non »), coche (« oui » ou vide), json,
   prix (nombre, ou JSON { produit: prix } si les prix diffèrent). */
const STOCK_ONGLETS = {
  Articles: [
    ["id", "Id", "texte"],
    ["nom", "Nom", "texte"],
    ["categorie", "Catégorie", "texte"],
    ["unite", "Unité", "texte"],
    ["piecesParSachet", "Pièces par sachet", "nombre"],
    ["codeLot", "Code lot", "texte"],
    ["conservationMois", "Conservation (mois)", "nombre"],
    ["seuilMarseille", "Seuil Marseille", "nombre"],
    ["seuilFerme", "Seuil ferme", "nombre"],
    ["reserveHorsSite", "Réserve hors site", "nombre"],
    ["actif", "Actif", "ouinon"],
    ["ordre", "Ordre", "nombre"],
    ["codeConfirme", "Code lot confirmé", "ouinon"],
  ],
  Emplacements: [
    ["id", "Id", "texte"],
    ["nom", "Nom", "texte"],
    ["court", "Nom court", "texte"],
    ["precision", "Précision", "texte"],
    ["site", "Compte pour le site", "ouinon"],
  ],
  Lots: [
    ["id", "Id", "texte"],
    ["article", "Article", "texte"],
    ["numero", "N° de lot", "texte"],
    ["categorie", "Catégorie", "texte"],
    ["fabrication", "Fabrication ou réception", "jour"],
    ["ddm", "DDM ou date limite", "jour"],
    ["fournisseur", "Fournisseur", "texte"],
    ["intrants", "Intrants", "json"],
    ["creeLe", "Créé le", "horodatage"],
  ],
  Mouvements: [
    ["id", "Id ligne", "texte"],
    ["operation", "Opération", "texte"],
    ["horodatage", "Horodatage", "horodatage"],
    ["type", "Type", "texte"],
    ["motif", "Motif", "texte"],
    ["article", "Article", "texte"],
    ["lot", "Lot", "texte"],
    ["emplacement", "Emplacement", "texte"],
    ["quantite", "Quantité", "nombre"],
    ["note", "Note", "texte"],
    ["reference", "Référence", "texte"],
    ["annule", "Annulé", "coche"],
    ["annuleLe", "Annulé le", "horodatage"],
  ],
  Reservations: [
    ["commande", "N° de commande", "texte"],
    ["horodatage", "Horodatage", "horodatage"],
    ["article", "Article", "texte"],
    ["sachets", "Sachets", "nombre"],
    ["statut", "Statut", "texte"],
    ["statutLe", "Statut le", "horodatage"],
    ["emplacement", "Emplacement de remise", "texte"],
  ],
  Passages: [
    ["id", "Id", "texte"],
    ["horodatage", "Horodatage", "horodatage"],
    ["encaisse", "Encaissé (€)", "nombre"],
    ["encaisseLe", "Encaissé saisi le", "horodatage"],
    ["prix", "Prix du sachet (€)", "prix"],
    ["note", "Note", "texte"],
    ["annule", "Annulé", "coche"],
  ],
  PassagesDetail: [
    ["passage", "Passage", "texte"],
    ["article", "Article", "texte"],
    ["attendu", "Attendu avant comptage", "nombre"],
    ["compte", "Compté", "nombre"],
    ["retire", "Retiré", "nombre"],
    ["ajoute", "Ajouté", "nombre"],
    ["vendu", "Vendu calculé", "nombre"],
  ],
};

/* ===================================================================
   1. RÈGLES MÉTIER (fonctions pures, sans service Google)
   =================================================================== */

const StockRegles = (() => {
  const EPS = 1e-9;
  const CATEGORIES = ["produit", "matiere", "emballage"];
  const UNITES = ["sachet", "kg", "g", "L", "pièce", "unité"];
  const UNITES_ENTIERES = ["sachet", "pièce", "unité"];
  const MOTIFS_SORTIE = ["Vente", "Dégustation / offert", "Utilisé en production", "Perte", "Autre"];
  const QUANTITE_MAXI = 100000;
  const LIGNES_MAXI = 60; // articles d'une même saisie
  const ID_OPERATION = /^[A-Za-z0-9_-]{8,80}$/;
  const JOUR_MS = 24 * 60 * 60 * 1000;
  const ANNULATION_IMPOSSIBLE = "Annulation impossible : ce stock a déjà servi. Corrige plutôt par une nouvelle saisie.";

  // Motifs écrits par le script (le journal et les calculs s'en servent : ne pas les renommer)
  const MOTIF = {
    production: "Production",
    intrant: "Utilisé en production",
    reception: "Réception",
    envoi: "Envoi vers la ferme",
    transfert: "Transfert",
    inventaire: "Écart d'inventaire",
    reprise: "Reprise",
    perte: "Perte",
    ajoutFerme: "Ajout au congélateur",
    venteConstatee: "Vente constatée",
    compteSuperieur: "Compte supérieur au stock attendu",
  };

  const EMPLACEMENTS_INITIAUX = [
    { id: "marseille", nom: "Marseille", court: "Marseille", precision: "", site: true },
    { id: "ferme", nom: "Ferme de la Goëttaz", court: "Ferme", precision: "Congélateur du magasin, en dépôt-vente", site: false },
    // Envoi en cours : ne compte jamais pour le site
    { id: "route", nom: "En route vers la ferme", court: "En route", precision: "Envoi en cours", site: false },
  ];

  const MATIERES_INITIALES = [
    ["mp-farine", "Farine de blé", "kg"],
    ["mp-beurre", "Beurre", "kg"],
    ["mp-lait", "Lait", "L"],
    ["mp-sucre", "Sucre", "kg"],
    ["mp-levure", "Levure", "kg"],
    ["mp-sel", "Sel", "kg"],
    ["mp-chocolat", "Chocolat", "kg"],
    ["mp-oeufs", "Œufs", "pièce"],
    ["mp-raisins", "Raisins secs", "kg"],
    ["mp-pralines", "Pralines roses", "kg"],
    ["mp-lardons", "Lardons fumés", "kg"],
    ["mp-oignons", "Oignons", "kg"],
    ["mp-reblochon", "Reblochon", "kg"],
    ["mp-chevre", "Bûche de chèvre", "kg"],
    ["mp-fondue", "Fromage à fondue", "kg"],
    ["mp-poireaux", "Poireaux", "kg"],
    ["mp-champignons", "Champignons", "kg"],
    ["mp-noix", "Noix", "kg"],
    ["mp-miel", "Miel", "kg"],
  ];
  const EMBALLAGES_INITIAUX = [
    ["emb-sacs", "Sacs congélation", "pièce"],
    ["emb-etiquettes", "Étiquettes A5", "pièce"],
  ];

  // Conservation des produits finis, en mois, par famille de CATALOGUE. 2 mois pour les feuilletés
  // salés (décidé par Jo : lardons fumés et noix rancissent vite au congélateur), à allonger
  // après les tests de cuisson à 1, 2 et 3 mois.
  const CONSERVATION_MOIS = { viennoiseries: 4, "feuilletés": 2 };

  /* ---------- Outils ---------- */

  const arrondi = (n) => Math.round(n * 1e6) / 1e6;
  const centimes = (n) => Math.round(n * 100) / 100;
  const deux = (n) => String(n).padStart(2, "0");
  const comparer = (x, y) => (x < y ? -1 : x > y ? 1 : 0);
  const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`;

  /** Copie d'un enregistrement sans son n° de ligne dans le classeur. */
  function sansLigne(objet) {
    const copie = Object.assign({}, objet);
    delete copie._ligne;
    return copie;
  }

  /** « La Forêt » → « la foret » : pour comparer des noms sans accents ni majuscules. */
  function normaliser(valeur) {
    return String(valeur === null || valeur === undefined ? "" : valeur)
      .replace(/œ/g, "oe")
      .replace(/Œ/g, "OE")
      .replace(/æ/g, "ae")
      .replace(/Æ/g, "AE")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[’`]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  /** 1.5 → « 1,5 » */
  const nombreFr = (n) => String(arrondi(n)).replace(".", ",");

  /** « 1 sachet », « 3 sachets », « 0,5 kg » */
  function quantiteFr(article, n) {
    const unite = (article && article.unite) || "unité";
    const auPluriel = Math.abs(n) >= 2 && UNITES_ENTIERES.includes(unite);
    return `${nombreFr(n)} ${unite}${auPluriel ? "s" : ""}`;
  }

  /** Comparaison en temps constant, pour le secret partagé. */
  function egaliteConstante(a, b) {
    const x = String(a);
    const y = String(b);
    let difference = x.length ^ y.length;
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      difference |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
    }
    return difference === 0;
  }

  /** Texte libre (note, fournisseur, n° de lot…) : espaces superflus retirés, longueur limitée. */
  function texteLibre(valeur, nom, max) {
    if (valeur === undefined || valeur === null) return "";
    if (typeof valeur !== "string" && typeof valeur !== "number") throw new ErreurStock(`${nom} : valeur invalide.`);
    const v = String(valeur).replace(/\s+/g, " ").trim();
    if (v.length > max) throw new ErreurStock(`${nom} : texte trop long (${max} caractères au plus).`);
    return v;
  }

  /** Identifiant d'opération généré par le navigateur : il rend chaque écriture rejouable sans doublon. */
  function lireIdOperation(valeur) {
    if (typeof valeur !== "string" || !ID_OPERATION.test(valeur)) {
      throw new ErreurStock("Identifiant d'opération manquant ou invalide.");
    }
    return valeur;
  }

  function nombreSaisi(valeur) {
    if (typeof valeur === "number") return valeur;
    if (typeof valeur === "string" && valeur.trim() !== "") return Number(valeur.replace(/\s/g, "").replace(",", "."));
    return NaN;
  }

  /** Quantité positive (ou nulle si `zero`), entière pour les sachets, pièces et unités. */
  function lireQuantite(valeur, article, zero) {
    const n = nombreSaisi(valeur);
    if (!Number.isFinite(n) || n < 0 || (!zero && n === 0) || n > QUANTITE_MAXI) {
      throw new ErreurStock(`${article.nom} : quantité invalide.`);
    }
    if (UNITES_ENTIERES.includes(article.unite) && !Number.isInteger(n)) {
      throw new ErreurStock(`${article.nom} : la quantité doit être un nombre entier.`);
    }
    return arrondi(n);
  }

  /** Quantité facultative (vide = 0). */
  function lireQuantiteOuZero(valeur, article) {
    return valeur === undefined || valeur === null || valeur === "" ? 0 : lireQuantite(valeur, article, true);
  }

  /** Montant en euros (vide = null : « à compléter »). */
  function lireEuros(valeur) {
    if (valeur === undefined || valeur === null || valeur === "") return null;
    const n = nombreSaisi(valeur);
    if (!Number.isFinite(n) || n < 0 || n > 1000000) throw new ErreurStock("Montant encaissé invalide.");
    return centimes(n);
  }

  /** Horodatage en millisecondes (maintenant par défaut), modifiable pour une saisie faite après coup. */
  function lireHorodatage(valeur, ctx) {
    if (valeur === undefined || valeur === null || valeur === "") return ctx.maintenant;
    const ms = typeof valeur === "string" ? Date.parse(valeur) : Number(valeur);
    if (!Number.isFinite(ms) || ms < ctx.maintenant - 400 * JOUR_MS || ms > ctx.maintenant + 10 * 60 * 1000) {
      throw new ErreurStock("Date et heure invalides.");
    }
    return Math.round(ms);
  }

  /* ---------- Dates et n° de lot ---------- */

  function jourValide(iso) {
    if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    const [a, m, j] = iso.split("-").map(Number);
    const date = new Date(Date.UTC(a, m - 1, j));
    return date.getUTCFullYear() === a && date.getUTCMonth() === m - 1 && date.getUTCDate() === j;
  }

  function lireJour(valeur, nom, requis) {
    if (valeur === undefined || valeur === null || valeur === "") {
      if (requis) throw new ErreurStock(`${nom} : date manquante.`);
      return "";
    }
    if (!jourValide(valeur)) throw new ErreurStock(`${nom} : date invalide.`);
    return valeur;
  }

  /** « 12/09/2026 » ou « 2026-09-12 » → « 2026-09-12 » (vide accepté). */
  function jourDepuisTexte(valeur) {
    const v = String(valeur || "").trim();
    if (!v) return "";
    const fr = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
    const iso = fr ? `${fr[3]}-${deux(fr[2])}-${deux(fr[1])}` : v;
    if (!jourValide(iso)) throw new ErreurStock(`date « ${v} » invalide`);
    return iso;
  }

  /** Ajoute des mois à une date, ramenée au dernier jour du mois si besoin : 31/10 + 4 mois = 28/02. */
  function ajouterMois(iso, mois) {
    const [a, m, j] = iso.split("-").map(Number);
    const debut = new Date(Date.UTC(a, m - 1 + mois, 1));
    const dernierJour = new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() + 1, 0)).getUTCDate();
    return `${debut.getUTCFullYear()}-${deux(debut.getUTCMonth() + 1)}-${deux(Math.min(j, dernierJour))}`;
  }

  /** DDM proposée : fabrication + conservation de l'article ("" si aucune durée n'est réglée). */
  function ddmProposee(fabrication, conservationMois) {
    const mois = Number(conservationMois);
    return fabrication && Number.isInteger(mois) && mois > 0 ? ajouterMois(fabrication, mois) : "";
  }

  /** N° de lot d'un produit fini : code lot + fabrication JJMMAA + DDM MMAA (La Lune : 1 120926 0127). */
  function numeroLotProduit(codeLot, fabrication, ddm) {
    const [a, m, j] = fabrication.split("-");
    let numero = String(codeLot).trim() + j + m + a.slice(2);
    if (ddm) {
      const [aa, mm] = ddm.split("-");
      numero += mm + aa.slice(2);
    }
    return numero;
  }

  /** N° de lot d'une réception sans n° fournisseur : R + JJMMAA + « - » + 3 lettres de l'article. */
  function numeroLotReception(reception, nomArticle) {
    const [a, m, j] = reception.split("-");
    const lettres = normaliser(nomArticle).replace(/[^a-z]/g, "").slice(0, 3).toUpperCase() || "ART";
    return `R${j}${m}${a.slice(2)}-${lettres}`;
  }

  /* ---------- Catalogue initial ---------- */

  /** Articles et emplacements créés par initialiserStock(). `catalogue` : CATALOGUE de Code.gs. */
  function catalogueInitial(catalogue) {
    const produits = catalogue.map((p, i) => ({
      id: p.id,
      nom: p.nom,
      categorie: "produit",
      unite: "sachet",
      piecesParSachet: p.pieces,
      // Code 1 : repris de l'étiquette réelle de La Lune. Les suivants sont à confirmer par Jo (Réglages).
      codeLot: String(i + 1),
      conservationMois: CONSERVATION_MOIS[p.famille] || null,
      seuilMarseille: 0,
      seuilFerme: 0,
      reserveHorsSite: 0,
      actif: true,
      ordre: i + 1,
      codeConfirme: p.id === "lune",
    }));
    const autres = MATIERES_INITIALES.map((m) => m.concat("matiere"))
      .concat(EMBALLAGES_INITIAUX.map((e) => e.concat("emballage")))
      .map(([id, nom, unite, categorie], i) => ({
        id,
        nom,
        categorie,
        unite,
        piecesParSachet: null,
        codeLot: "",
        conservationMois: null,
        seuilMarseille: 0,
        seuilFerme: 0,
        reserveHorsSite: 0,
        actif: true,
        ordre: produits.length + i + 1,
        codeConfirme: false,
      }));
    return { articles: produits.concat(autres), emplacements: EMPLACEMENTS_INITIAUX.map((e) => Object.assign({}, e)) };
  }

  /* ---------- Quantités calculées ---------- */

  /** Lit une quantité dans un double index (lot ou article → emplacement → quantité). */
  function lireIndex(index, a, b) {
    const parEmplacement = index.get(a);
    return (parEmplacement && parEmplacement.get(b)) || 0;
  }

  function ajouterIndex(index, a, b, quantite) {
    if (!index.has(a)) index.set(a, new Map());
    const parEmplacement = index.get(a);
    parEmplacement.set(b, arrondi((parEmplacement.get(b) || 0) + quantite));
  }

  /** Index de la base, et stock par lot et par article à chaque emplacement (mouvements non annulés). */
  function indexer(base) {
    const parLot = new Map();
    const parArticle = new Map();
    for (const m of base.mouvements) {
      if (m.annule) continue;
      ajouterIndex(parLot, m.lot, m.emplacement, Number(m.quantite || 0));
      ajouterIndex(parArticle, m.article, m.emplacement, Number(m.quantite || 0));
    }
    return {
      articles: new Map(base.articles.map((a) => [a.id, a])),
      emplacements: new Map(base.emplacements.map((e) => [e.id, e])),
      lots: new Map(base.lots.map((l) => [l.id, l])),
      parLot,
      parArticle,
    };
  }

  /** { emplacement: quantité } d'un lot ou d'un article, sans les zéros. */
  function versObjet(parEmplacement) {
    const objet = {};
    if (parEmplacement) parEmplacement.forEach((q, emplacement) => { if (Math.abs(q) > EPS) objet[emplacement] = q; });
    return objet;
  }

  /** Ordre de sortie : DDM la plus proche d'abord ; à égalité, la fabrication la plus ancienne. */
  function ordreSortie(a, b) {
    return (
      comparer(a.ddm || "9999-12-31", b.ddm || "9999-12-31") ||
      comparer(a.fabrication || "", b.fabrication || "") ||
      (a.creeLe || 0) - (b.creeLe || 0) ||
      comparer(String(a.id), String(b.id))
    );
  }

  /* ---------- Brouillon d'une opération ----------
     Toutes les lignes d'une opération sont préparées ici, avec un stock tenu à jour au fil des
     lignes. Rien n'est écrit tant que tout n'est pas valide : pas d'écriture à moitié. */

  function nouveauBrouillon(base, ctx, idOperation, horodatage) {
    const idx = indexer(base);
    const lots = new Map(idx.lots);
    const nouveauxLots = new Set();
    const touches = new Map(); // « lot|emplacement » → [lot, emplacement]
    const ecritures = { ajouts: {}, majs: {} };
    let numeroLigne = 0;

    const b = {
      idOperation,
      horodatage,
      ctx,
      idx,
      ecritures,
      lots,

      ajout(onglet, objet) {
        (ecritures.ajouts[onglet] = ecritures.ajouts[onglet] || []).push(objet);
        return objet;
      },
      maj(onglet, ligne, champs) {
        (ecritures.majs[onglet] = ecritures.majs[onglet] || []).push({ ligne, champs });
      },

      quantite: (lot, emplacement) => lireIndex(idx.parLot, lot, emplacement),
      stockArticle: (article, emplacement) => lireIndex(idx.parArticle, article, emplacement),

      article(id) {
        const a = idx.articles.get(id);
        if (!a) throw new ErreurStock("Article inconnu.");
        return a;
      },
      emplacement(id) {
        const e = idx.emplacements.get(id);
        if (!e) throw new ErreurStock("Emplacement inconnu.");
        return e;
      },
      lot(id) {
        return typeof id === "string" ? lots.get(id) : undefined;
      },

      /** Lot existant de cet article avec ce n°, sinon nouveau lot. Une production au même n° s'y ajoute. */
      lotPour(champs) {
        const id = `${champs.article}/${champs.numero}`;
        let lot = lots.get(id);
        if (!lot) {
          lot = b.ajout("Lots", {
            id,
            article: champs.article,
            numero: champs.numero,
            categorie: champs.categorie,
            fabrication: champs.fabrication || "",
            ddm: champs.ddm || "",
            fournisseur: champs.fournisseur || "",
            intrants: [],
            creeLe: ctx.maintenant,
          });
          lots.set(id, lot);
          nouveauxLots.add(id);
        }
        return lot;
      },

      /** Matières utilisées, recopiées dans la colonne « Intrants » du lot produit (traçabilité PMS). */
      ajouterIntrants(lot, intrants) {
        const liste = (lot.intrants || []).concat(intrants);
        if (nouveauxLots.has(lot.id)) {
          lot.intrants = liste;
        } else {
          lots.set(lot.id, Object.assign({}, lot, { intrants: liste }));
          b.maj("Lots", lot._ligne, { intrants: liste });
        }
      },

      mouvement(champs) {
        numeroLigne += 1;
        const quantite = arrondi(champs.quantite);
        const m = b.ajout("Mouvements", {
          id: `${idOperation}-${numeroLigne}`,
          operation: idOperation,
          horodatage,
          type: champs.type,
          motif: champs.motif || "",
          article: champs.article,
          lot: champs.lot,
          emplacement: champs.emplacement,
          quantite,
          note: champs.note || "",
          reference: champs.reference || "",
          annule: false,
          annuleLe: null,
        });
        ajouterIndex(idx.parLot, m.lot, m.emplacement, quantite);
        ajouterIndex(idx.parArticle, m.article, m.emplacement, quantite);
        touches.set(`${m.lot}|${m.emplacement}`, [m.lot, m.emplacement]);
        return m;
      },

      /** Lots d'un article présents à un emplacement, dans l'ordre de sortie. */
      lotsDisponibles(article, emplacement) {
        return Array.from(lots.values())
          .filter((l) => l.article === article && b.quantite(l.id, emplacement) > EPS)
          .sort(ordreSortie);
      },

      /** Répartit une quantité sur les lots (ou sur le lot choisi), sans rien écrire. */
      allouer(articleId, emplacement, quantite, lotChoisi) {
        const article = b.article(articleId);
        const lieu = b.emplacement(emplacement);
        if (lotChoisi) {
          const lot = b.lot(lotChoisi);
          if (!lot || lot.article !== articleId) throw new ErreurStock(`Lot introuvable pour ${article.nom}.`);
          const present = b.quantite(lot.id, emplacement);
          if (quantite > present + EPS) {
            throw new ErreurStock(`Le lot ${lot.numero} n'a que ${quantiteFr(article, present)} à ${lieu.court}.`);
          }
          return [{ lot: lot.id, quantite }];
        }
        const parts = [];
        let reste = quantite;
        for (const lot of b.lotsDisponibles(articleId, emplacement)) {
          if (reste <= EPS) break;
          const prise = arrondi(Math.min(reste, b.quantite(lot.id, emplacement)));
          parts.push({ lot: lot.id, quantite: prise });
          reste = arrondi(reste - prise);
        }
        if (reste > EPS) {
          throw new ErreurStock(`Stock insuffisant : ${article.nom} à ${lieu.court}, il manque ${quantiteFr(article, reste)}.`);
        }
        return parts;
      },

      /** Sortie d'un emplacement, lot par lot dans l'ordre des DDM (ou sur le lot choisi). */
      sortir(articleId, emplacement, quantite, lotChoisi, champs) {
        return b.allouer(articleId, emplacement, quantite, lotChoisi).map((p) =>
          b.mouvement(Object.assign({}, champs, { article: articleId, lot: p.lot, emplacement, quantite: -p.quantite }))
        );
      },

      /** Déplacement d'un emplacement à un autre : les n° de lot sont conservés. */
      deplacer(articleId, de, vers, quantite, lotChoisi, champs) {
        for (const p of b.allouer(articleId, de, quantite, lotChoisi)) {
          b.mouvement(Object.assign({}, champs, { type: "transfert", article: articleId, lot: p.lot, emplacement: de, quantite: -p.quantite }));
          b.mouvement(Object.assign({}, champs, { type: "transfert", article: articleId, lot: p.lot, emplacement: vers, quantite: p.quantite }));
        }
      },

      /** Refuse l'opération entière si un lot devient négatif à un emplacement. */
      verifier() {
        touches.forEach(([lotId, emplacement]) => {
          if (b.quantite(lotId, emplacement) < -EPS) {
            const lot = lots.get(lotId);
            const lieu = idx.emplacements.get(emplacement);
            throw new ErreurStock(
              `Stock insuffisant sur le lot ${lot ? lot.numero : lotId} à ${lieu ? lieu.court : emplacement} : rien n'a été enregistré.`
            );
          }
        });
      },
    };
    return b;
  }

  /** Liste d'articles d'une saisie : [{ article, quantite, lot? }]. */
  function lireLignes(liste, requis) {
    const lignes = liste === undefined || liste === null ? [] : liste;
    if (!Array.isArray(lignes) || lignes.length > LIGNES_MAXI) throw new ErreurStock("Liste d'articles invalide.");
    if (requis && !lignes.length) throw new ErreurStock("Ajoute au moins un article.");
    return lignes.map((l) => {
      if (!l || typeof l !== "object" || typeof l.article !== "string") throw new ErreurStock("Ligne d'article invalide.");
      return { article: l.article, quantite: l.quantite, lot: typeof l.lot === "string" && l.lot ? l.lot : null };
    });
  }

  /* ---------- Opérations de stock (§ 4.4) ---------- */

  const OPERATIONS = {
    production(b, d) {
      const a = b.article(d.article);
      if (a.categorie !== "produit") throw new ErreurStock("Une production concerne un produit fini.");
      const quantite = lireQuantite(d.quantite, a);
      const lieu = b.emplacement(d.emplacement || "marseille");
      const fabrication = lireJour(d.fabrication || b.ctx.aujourdhui, "Fabrication", true);
      const ddm = lireJour(d.ddm || ddmProposee(fabrication, a.conservationMois), "DDM", false);
      if (!ddm) throw new ErreurStock(`DDM manquante : aucune durée de conservation n'est réglée pour ${a.nom}.`);
      if (ddm <= fabrication) throw new ErreurStock("La DDM doit tomber après la fabrication.");
      let numero = texteLibre(d.numero, "N° de lot", 40);
      if (!numero) {
        if (!String(a.codeLot || "").trim()) {
          throw new ErreurStock(`Code lot manquant pour ${a.nom} : règle-le dans Réglages, ou saisis le n° de lot.`);
        }
        numero = numeroLotProduit(a.codeLot, fabrication, ddm);
      }
      const note = texteLibre(d.note, "Note", 300);
      const lot = b.lotPour({ article: a.id, numero, categorie: "produit", fabrication, ddm });
      b.mouvement({ type: "production", motif: MOTIF.production, article: a.id, lot: lot.id, emplacement: lieu.id, quantite, note });

      // Matières utilisées : prises au même emplacement, lot par lot dans l'ordre des DDM
      const intrants = [];
      for (const i of lireLignes(d.intrants, false)) {
        const m = b.article(i.article);
        if (m.categorie === "produit") throw new ErreurStock("Les matières utilisées sont des matières premières ou des emballages.");
        const champs = { type: "production", motif: MOTIF.intrant, reference: lot.id, note };
        for (const s of b.sortir(m.id, lieu.id, lireQuantite(i.quantite, m), i.lot, champs)) {
          intrants.push({ lot: s.lot, article: m.id, quantite: -s.quantite, operation: b.idOperation });
        }
      }
      if (intrants.length) b.ajouterIntrants(lot, intrants);
    },

    reception(b, d) {
      const a = b.article(d.article);
      if (a.categorie === "produit") {
        throw new ErreurStock("Une réception concerne une matière première ou un emballage : pour un produit fini, saisis une production.");
      }
      const quantite = lireQuantite(d.quantite, a);
      const lieu = b.emplacement(d.emplacement || "marseille");
      const reception = lireJour(d.reception || b.ctx.aujourdhui, "Réception", true);
      const ddm = lireJour(d.ddm, "Date limite", false);
      const numero = texteLibre(d.numero, "N° de lot", 40) || numeroLotReception(reception, a.nom);
      const fournisseur = texteLibre(d.fournisseur, "Fournisseur", 80);
      const lot = b.lotPour({ article: a.id, numero, categorie: a.categorie, fabrication: reception, ddm, fournisseur });
      const note = texteLibre(d.note, "Note", 300);
      b.mouvement({ type: "reception", motif: MOTIF.reception, article: a.id, lot: lot.id, emplacement: lieu.id, quantite, note });
    },

    sortie(b, d) {
      const lieu = b.emplacement(d.emplacement || "marseille");
      if (!MOTIFS_SORTIE.includes(d.motif)) throw new ErreurStock("Choisis le motif de la sortie.");
      const note = texteLibre(d.note, "Note", 300);
      for (const l of lireLignes(d.lignes, true)) {
        const a = b.article(l.article);
        b.sortir(a.id, lieu.id, lireQuantite(l.quantite, a), l.lot, { type: "sortie", motif: d.motif, note });
      }
    },

    envoi(b, d) {
      b.emplacement("marseille");
      b.emplacement("route");
      const note = texteLibre(d.note, "Note", 300);
      for (const l of lireLignes(d.lignes, true)) {
        const a = b.article(l.article);
        b.deplacer(a.id, "marseille", "route", lireQuantite(l.quantite, a), l.lot, { motif: MOTIF.envoi, note });
      }
    },

    transfert(b, d) {
      const de = b.emplacement(d.de);
      const vers = b.emplacement(d.vers);
      if (de.id === vers.id) throw new ErreurStock("Choisis deux emplacements différents.");
      const note = texteLibre(d.note, "Note", 300);
      for (const l of lireLignes(d.lignes, true)) {
        const a = b.article(l.article);
        b.deplacer(a.id, de.id, vers.id, lireQuantite(l.quantite, a), l.lot, { motif: MOTIF.transfert, note });
      }
    },

    /** Compte d'un emplacement, lot par lot : seuls les écarts sont enregistrés. */
    inventaire(b, d) {
      const lieu = b.emplacement(d.emplacement);
      const note = texteLibre(d.note, "Note", 300);
      if (!Array.isArray(d.comptes) || !d.comptes.length || d.comptes.length > 300) {
        throw new ErreurStock("Indique au moins un compte.");
      }
      const vus = new Set();
      for (const c of d.comptes) {
        const lot = c && b.lot(c.lot);
        if (!lot) throw new ErreurStock("Lot introuvable dans l'inventaire.");
        if (vus.has(lot.id)) throw new ErreurStock(`Le lot ${lot.numero} est compté deux fois.`);
        vus.add(lot.id);
        const a = b.article(lot.article);
        const ecart = arrondi(lireQuantite(c.quantite, a, true) - b.quantite(lot.id, lieu.id));
        if (Math.abs(ecart) > EPS) {
          b.mouvement({ type: "inventaire", motif: MOTIF.inventaire, article: a.id, lot: lot.id, emplacement: lieu.id, quantite: ecart, note });
        }
      }
    },
  };

  /** Genre d'une opération, pour le journal : type de sa première ligne, affiné par son motif. */
  function genreOperation(lignes, estPassage) {
    if (estPassage) return "passage";
    const premiere = lignes[0];
    if (premiere.type === "sortie" && /^Commande D-/.test(premiere.motif)) return "commande";
    if (premiere.type === "transfert" && premiere.motif === MOTIF.envoi) return "envoi";
    return premiere.type;
  }

  /** Message de confirmation, recalculé à l'identique depuis les lignes écrites (rejeu idempotent). */
  function messageOperation(lignes, lots) {
    const numero = (motif) => {
      const ligne = lignes.find((l) => l.motif === motif);
      const lot = ligne && lots.get(ligne.lot);
      return lot ? lot.numero : "";
    };
    switch (genreOperation(lignes, false)) {
      case "production":
        return `Production enregistrée · lot ${numero(MOTIF.production)}`;
      case "reception":
        return `Réception enregistrée · lot ${numero(MOTIF.reception)}`;
      case "commande":
        return `Commande ${lignes[0].reference} remise au client`;
      case "envoi":
        return "Envoi vers la ferme enregistré";
      case "transfert":
        return "Transfert enregistré";
      case "sortie":
        return "Sortie enregistrée";
      case "inventaire":
        return `Inventaire enregistré · ${pluriel(lignes.length, "écart")}`;
      case "reprise":
        return `Reprise importée · ${pluriel(lignes.length, "ligne")}`;
      default:
        return "Opération enregistrée";
    }
  }

  function planifierOperation(base, d, ctx, idOperation) {
    const operation = Object.prototype.hasOwnProperty.call(OPERATIONS, d.type) ? OPERATIONS[d.type] : null;
    if (!operation) throw new ErreurStock("Type d'opération inconnu.");
    const b = nouveauBrouillon(base, ctx, idOperation, lireHorodatage(d.horodatage, ctx));
    operation(b, d);
    b.verifier();
    const lignes = b.ecritures.ajouts.Mouvements || [];
    const message = lignes.length ? messageOperation(lignes, b.lots) : "Inventaire enregistré · aucun écart";
    return { ecritures: b.ecritures, resultat: { message } };
  }

  /* ---------- Reprise : import du CSV « Stock par lot » de la maquette ---------- */

  /** Lignes d'un CSV (séparateur « ; » ou tabulation, guillemets doublés), sans les lignes vides. */
  function lireCsv(texte) {
    const s = String(texte).replace(/^﻿/, "");
    const premiereLigne = s.split(/\r?\n/)[0];
    const separateur = premiereLigne.includes(";") ? ";" : premiereLigne.includes("\t") ? "\t" : ";";
    const lignes = [];
    let ligne = [];
    let champ = "";
    let entreGuillemets = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (entreGuillemets) {
        if (c === '"' && s[i + 1] === '"') {
          champ += '"';
          i++;
        } else if (c === '"') {
          entreGuillemets = false;
        } else {
          champ += c;
        }
      } else if (c === '"') {
        entreGuillemets = true;
      } else if (c === separateur) {
        ligne.push(champ);
        champ = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && s[i + 1] === "\n") i++;
        ligne.push(champ);
        lignes.push(ligne);
        ligne = [];
        champ = "";
      } else {
        champ += c;
      }
    }
    if (champ !== "" || ligne.length) {
      ligne.push(champ);
      lignes.push(ligne);
    }
    return lignes.filter((l) => l.some((cellule) => cellule.trim() !== ""));
  }

  /** « sachets », « pièces », « litre (L) » → unité du catalogue (sachet, pièce, L…). */
  function uniteDepuisTexte(valeur) {
    const v = normaliser(valeur);
    if (/^sachets?$/.test(v)) return "sachet";
    if (/^pieces?$/.test(v)) return "pièce";
    if (/^unites?$/.test(v)) return "unité";
    if (v === "l" || v.indexOf("litre") === 0) return "L";
    return v;
  }

  const COLONNES_REPRISE = {
    article: "article",
    numero: "n° de lot",
    fabrication: "fabrication / reception",
    ddm: "ddm / date limite",
    fournisseur: "fournisseur",
    emplacement: "emplacement",
    quantite: "quantite",
    unite: "unite",
  };

  function planifierImport(base, d, ctx, idOperation) {
    if (typeof d.csv !== "string" || !d.csv.trim()) throw new ErreurStock("Colle le contenu du fichier « Stock par lot ».");
    if (d.csv.length > 500000) throw new ErreurStock("Fichier trop volumineux.");
    if (d.forcer !== true && base.mouvements.some((m) => m.type === "reprise" && !m.annule)) {
      throw new ErreurStock("Une reprise a déjà été importée : annule-la dans le journal, ou confirme l'ajout d'une seconde reprise.");
    }
    const lignes = lireCsv(d.csv);
    const entetes = (lignes[0] || []).map(normaliser);
    const colonne = {};
    Object.keys(COLONNES_REPRISE).forEach((cle) => { colonne[cle] = entetes.indexOf(COLONNES_REPRISE[cle]); });
    const manquantes = ["article", "numero", "emplacement", "quantite"].filter((cle) => colonne[cle] === -1);
    if (manquantes.length) {
      throw new ErreurStock("Ce fichier n'est pas l'export « Stock par lot » : colonnes Article, N° de lot, Emplacement ou Quantité introuvables.");
    }
    if (lignes.length < 2) throw new ErreurStock("Le fichier ne contient aucune ligne de stock.");

    // Articles reconnus par leur nom (La Noix avait l'id « noix-f » dans la maquette), à défaut par
    // leur id. Les noms passent en second pour l'emporter : « Noix » est la matière, pas La Noix.
    const articles = new Map();
    base.articles.forEach((a) => articles.set(normaliser(a.id), a));
    base.articles.forEach((a) => articles.set(normaliser(a.nom), a));
    const lieux = new Map();
    base.emplacements.forEach((e) => [e.id, e.court, e.nom].forEach((nom) => { if (nom) lieux.set(normaliser(nom), e); }));

    const b = nouveauBrouillon(base, ctx, idOperation, lireHorodatage(d.horodatage, ctx));
    const erreurs = [];
    lignes.slice(1).forEach((cellules, i) => {
      const valeur = (cle) => (colonne[cle] === -1 ? "" : String(cellules[colonne[cle]] || "").trim());
      try {
        const a = articles.get(normaliser(valeur("article")));
        if (!a) throw new ErreurStock(`article inconnu « ${valeur("article")} »`);
        const lieu = lieux.get(normaliser(valeur("emplacement")));
        if (!lieu) throw new ErreurStock(`emplacement inconnu « ${valeur("emplacement")} »`);
        const numero = texteLibre(valeur("numero"), "N° de lot", 40);
        if (!numero) throw new ErreurStock("n° de lot manquant");
        const unite = valeur("unite");
        if (unite && uniteDepuisTexte(unite) !== a.unite) {
          throw new ErreurStock(`unité « ${unite} » différente de celle de ${a.nom} (${a.unite})`);
        }
        const quantite = lireQuantite(valeur("quantite"), a);
        const lot = b.lotPour({
          article: a.id,
          numero,
          categorie: a.categorie,
          fabrication: jourDepuisTexte(valeur("fabrication")),
          ddm: jourDepuisTexte(valeur("ddm")),
          fournisseur: texteLibre(valeur("fournisseur"), "Fournisseur", 80),
        });
        b.mouvement({ type: "reprise", motif: MOTIF.reprise, article: a.id, lot: lot.id, emplacement: lieu.id, quantite });
      } catch (err) {
        if (!(err instanceof ErreurStock)) throw err;
        erreurs.push(`ligne ${i + 2} : ${err.message}`);
      }
    });
    if (erreurs.length) {
      const suite = erreurs.length > 8 ? ` ; et ${erreurs.length - 8} autre(s)` : "";
      throw new ErreurStock(`Import refusé, rien n'a été enregistré. ${erreurs.slice(0, 8).join(" ; ")}${suite}.`);
    }
    b.verifier();
    return { ecritures: b.ecritures, resultat: { message: messageOperation(b.ecritures.ajouts.Mouvements, b.lots) } };
  }

  /* ---------- Passage à la ferme (§ 4.7) ---------- */

  /** Prix figé dans le passage : un nombre si tous les produits ont le même prix, sinon { id: prix }. */
  function prixFiges(ids, prix) {
    const valeurs = ids.map((id) => Number(prix[id] || 0));
    if (valeurs.every((v) => v === valeurs[0])) return valeurs[0] || 0;
    return ids.reduce((objet, id, i) => Object.assign(objet, { [id]: valeurs[i] }), {});
  }

  function prixDe(prix, article) {
    if (typeof prix === "number") return prix;
    return prix && typeof prix[article] === "number" ? prix[article] : 0;
  }

  /** Récapitulatif d'un passage : par produit, puis vendus, chiffre d'affaires attendu, encaissé et écart. */
  function resumePassage(passage, details) {
    const lignes = details
      .filter((x) => x.passage === passage.id)
      .map((x) => {
        const prix = prixDe(passage.prix, x.article);
        return {
          article: x.article,
          attendu: x.attendu,
          compte: x.compte,
          retire: x.retire,
          ajoute: x.ajoute,
          vendu: x.vendu,
          prix,
          montant: centimes(x.vendu * prix),
        };
      });
    const encaisse = typeof passage.encaisse === "number" ? passage.encaisse : null;
    const attendu = centimes(lignes.reduce((s, l) => s + l.montant, 0));
    return {
      id: passage.id,
      horodatage: passage.horodatage,
      note: passage.note || "",
      annule: !!passage.annule,
      encaisseLe: passage.encaisseLe || null,
      lignes,
      vendus: arrondi(lignes.reduce((s, l) => s + l.vendu, 0)),
      attendu,
      encaisse,
      ecart: encaisse === null ? null : centimes(encaisse - attendu),
    };
  }

  function resultatPassage(passage, details, articles) {
    const resume = resumePassage(passage, details);
    const avertissements = resume.lignes
      .filter((l) => l.vendu < -EPS)
      .map((l) => `${articles.has(l.article) ? articles.get(l.article).nom : l.article} : compte supérieur au stock attendu, vérifie le passage précédent.`);
    return { message: "Passage enregistré", passage: resume, avertissements };
  }

  function lireSaisies(objet, ids) {
    if (objet === undefined || objet === null) return {};
    if (typeof objet !== "object" || Array.isArray(objet)) throw new ErreurStock("Saisie du passage invalide.");
    Object.keys(objet).forEach((id) => {
      if (!ids.includes(id)) throw new ErreurStock("Produit inconnu dans le passage.");
    });
    return objet;
  }

  /** Lot sur lequel reviennent des sachets comptés en trop : celui de la dernière vente constatée à la ferme. */
  function lotDeRegularisation(base, article) {
    const lignes = base.mouvements.filter((m) => !m.annule && m.article === article && m.emplacement === "ferme");
    const vente = lignes.filter((m) => m.type === "sortie" && String(m.motif).indexOf(MOTIF.venteConstatee) === 0).pop();
    const derniere = vente || lignes[lignes.length - 1];
    return derniere ? derniere.lot : null;
  }

  function planifierPassage(base, d, ctx, idOperation) {
    const horodatage = lireHorodatage(d.horodatage, ctx);
    const b = nouveauBrouillon(base, ctx, idOperation, horodatage);
    const ferme = b.emplacement("ferme").id;
    b.emplacement("route");
    b.emplacement("marseille");
    const produits = base.articles.filter((a) => a.categorie === "produit");
    const ids = produits.map((p) => p.id);
    const comptes = lireSaisies(d.comptes, ids);
    const retraits = lireSaisies(d.retraits, ids);
    const ajouts = lireSaisies(d.ajouts, ids);

    // 1. Comptage : l'attendu est le stock « ferme » du système juste avant le passage
    const manquants = [];
    const lignes = [];
    for (const p of produits) {
      const attendu = b.stockArticle(p.id, ferme);
      const compteSaisi = comptes[p.id] !== undefined && comptes[p.id] !== null && comptes[p.id] !== "";
      if (attendu > EPS && !compteSaisi) {
        manquants.push(p.nom);
        continue;
      }
      const compte = compteSaisi ? lireQuantite(comptes[p.id], p, true) : 0;
      const retire = lireQuantiteOuZero(retraits[p.id], p);
      const ajoute = lireQuantiteOuZero(ajouts[p.id], p);
      if (retire > compte + EPS) throw new ErreurStock(`${p.nom} : tu ne peux pas retirer plus de sachets que tu n'en as comptés.`);
      if (!compteSaisi && attendu <= EPS && !retire && !ajoute) continue;
      lignes.push({ produit: p, attendu, compte, retire, ajoute, vendu: arrondi(attendu - compte) });
    }
    if (manquants.length) {
      throw new ErreurStock(`Compte manquant pour ${manquants.join(", ")} : mets 0 s'il n'en reste plus.`);
    }
    if (!lignes.length) throw new ErreurStock("Rien à enregistrer : compte, retire ou ajoute au moins un produit.");

    // 2. Écritures : ventes constatées, retraits en perte, ajouts pris sur la route puis sur Marseille
    const quand = `passage du ${ctx.heure(horodatage)}`;
    const reference = idOperation;
    for (const l of lignes) {
      const p = l.produit;
      if (l.vendu > EPS) {
        b.sortir(p.id, ferme, l.vendu, null, { type: "sortie", motif: `${MOTIF.venteConstatee} (${quand})`, reference });
      } else if (l.vendu < -EPS) {
        // Compte supérieur au stock attendu : signalé sans bloquer, et le stock est remis au niveau du compte
        const lot = lotDeRegularisation(base, p.id);
        if (!lot) throw new ErreurStock(`${p.nom} n'a jamais été à la ferme : vérifie le compte.`);
        b.mouvement({ type: "inventaire", motif: `${MOTIF.compteSuperieur} (${quand})`, article: p.id, lot, emplacement: ferme, quantite: -l.vendu, reference });
      }
      if (l.retire > EPS) {
        b.sortir(p.id, ferme, l.retire, null, { type: "sortie", motif: MOTIF.perte, note: `Retiré au ${quand} (abîmé ou date dépassée)`, reference });
      }
      if (l.ajoute > EPS) {
        const champs = { motif: `${MOTIF.ajoutFerme} (${quand})`, reference };
        const deLaRoute = arrondi(Math.min(l.ajoute, Math.max(0, b.stockArticle(p.id, "route"))));
        if (deLaRoute > EPS) b.deplacer(p.id, "route", ferme, deLaRoute, null, champs);
        const deMarseille = arrondi(l.ajoute - deLaRoute);
        if (deMarseille > EPS) b.deplacer(p.id, "marseille", ferme, deMarseille, null, champs);
      }
    }

    const encaisse = lireEuros(d.encaisse);
    const passage = b.ajout("Passages", {
      id: idOperation,
      horodatage,
      encaisse,
      encaisseLe: encaisse === null ? null : ctx.maintenant,
      prix: prixFiges(lignes.map((l) => l.produit.id), ctx.prix),
      note: texteLibre(d.note, "Note", 300),
      annule: false,
    });
    const details = lignes.map((l) =>
      b.ajout("PassagesDetail", {
        passage: idOperation,
        article: l.produit.id,
        attendu: l.attendu,
        compte: l.compte,
        retire: l.retire,
        ajoute: l.ajoute,
        vendu: l.vendu,
      })
    );
    b.verifier();
    const resultat = resultatPassage(passage, details, b.idx.articles);
    // Aperçu : le récapitulatif avant validation, sans rien écrire
    if (d.apercu === true) return { ecritures: null, resultat: Object.assign(resultat, { message: "Aperçu du passage", apercu: true }) };
    return { ecritures: b.ecritures, resultat };
  }

  function planifierEncaissement(base, d, ctx) {
    const passage = base.passages.find((p) => p.id === d.passage);
    if (!passage) throw new ErreurStock("Passage introuvable.");
    if (passage.annule) throw new ErreurStock("Ce passage est annulé.");
    const encaisse = lireEuros(d.encaisse);
    const message = encaisse === null ? "Encaissé effacé : à compléter" : "Encaissé enregistré";
    const avant = typeof passage.encaisse === "number" ? passage.encaisse : null;
    if (avant === encaisse) return { ecritures: null, resultat: { message, passage: resumePassage(passage, base.details) } };
    const champs = { encaisse, encaisseLe: encaisse === null ? null : ctx.maintenant };
    return {
      ecritures: { ajouts: {}, majs: { Passages: [{ ligne: passage._ligne, champs }] } },
      resultat: { message, passage: resumePassage(Object.assign({}, passage, champs), base.details) },
    };
  }

  /* ---------- Commandes du site : réservations (§ 4.6) ---------- */

  /** Emplacements qui comptent pour le site (Marseille) ; « En route » n'en fait jamais partie. */
  function emplacementsSite(base) {
    return base.emplacements.filter((e) => e.site && e.id !== "route").map((e) => e.id);
  }

  /** Disponible pour le site, par produit : stock physique − réservations ouvertes − réserve hors site. */
  function disponibles(base, idx) {
    const index = idx || indexer(base);
    const sites = emplacementsSite(base);
    const reserve = {};
    base.reservations.forEach((r) => {
      if (r.statut === "ouverte") reserve[r.article] = (reserve[r.article] || 0) + Number(r.sachets || 0);
    });
    const resultat = {};
    base.articles.forEach((a) => {
      if (a.categorie !== "produit") return;
      const physique = sites.reduce((s, e) => s + lireIndex(index.parArticle, a.id, e), 0);
      resultat[a.id] = arrondi(physique - (reserve[a.id] || 0) - Number(a.reserveHorsSite || 0));
    });
    return resultat;
  }

  /**
   * Statut affiché sur le site, par produit : « disponible » (au moins 1 sachet), « victime » (plus
   * rien, mais déjà entré en stock à Marseille), « bientot » (jamais en stock). Aucune quantité.
   */
  function statutsSite(base, idsSite) {
    const idx = indexer(base);
    const dispo = disponibles(base, idx);
    const sites = emplacementsSite(base);
    const dejaEnStock = new Set(
      base.mouvements
        .filter((m) => !m.annule && m.quantite > 0 && sites.includes(m.emplacement) && ["production", "reception", "reprise"].includes(m.type))
        .map((m) => m.article)
    );
    const produits = {};
    idsSite.forEach((id) => {
      produits[id] = (dispo[id] || 0) >= 1 ? "disponible" : dejaEnStock.has(id) ? "victime" : "bientot";
    });
    return produits;
  }

  /** Premier produit dont les sachets commandés dépassent le disponible, ou null. */
  function produitEnManque(base, quantites) {
    const dispo = disponibles(base);
    return Object.keys(quantites).find((id) => quantites[id] > 0 && quantites[id] > (dispo[id] || 0) + EPS) || null;
  }

  /** Une ligne « Reservations » par produit commandé. */
  function reservationsCommande(commande, quantites, horodatage) {
    return Object.keys(quantites)
      .filter((id) => quantites[id] > 0)
      .map((id) => ({ commande, horodatage, article: id, sachets: quantites[id], statut: "ouverte", statutLe: horodatage, emplacement: "" }));
  }

  /** Remise au client (sortie du stock) ou annulation (les sachets sont libérés). */
  function planifierCommande(base, d, ctx, idOperation) {
    const commande = typeof d.commande === "string" && /^D-\d{4,6}$/.test(d.commande) ? d.commande : "";
    if (!commande) throw new ErreurStock("N° de commande invalide.");
    if (!["remise", "annulee"].includes(d.decision)) throw new ErreurStock("Choisis « remise au client » ou « annulée ».");
    const lignes = base.reservations.filter((r) => r.commande === commande);
    if (!lignes.length) throw new ErreurStock(`Aucune réservation pour la commande ${commande}.`);
    const message = d.decision === "remise" ? `Commande ${commande} remise au client` : `Réservation de la commande ${commande} annulée`;
    const ouvertes = lignes.filter((r) => r.statut === "ouverte");
    if (!ouvertes.length) {
      if (lignes.every((r) => r.statut === d.decision)) return { ecritures: null, resultat: { message } };
      throw new ErreurStock(`La commande ${commande} n'a plus de réservation ouverte.`);
    }
    const b = nouveauBrouillon(base, ctx, idOperation, lireHorodatage(d.horodatage, ctx));
    let lieu = "";
    if (d.decision === "remise") {
      lieu = b.emplacement(d.emplacement || "marseille").id;
      for (const r of ouvertes) {
        const a = b.article(r.article);
        b.sortir(a.id, lieu, lireQuantite(r.sachets, a), null, { type: "sortie", motif: `Commande ${commande}`, reference: commande });
      }
      b.ecritures.livree = commande; // case « Livrée » à cocher dans le classeur des commandes
    }
    ouvertes.forEach((r) => b.maj("Reservations", r._ligne, { statut: d.decision, statutLe: ctx.maintenant, emplacement: lieu }));
    b.verifier();
    return { ecritures: b.ecritures, resultat: { message } };
  }

  /* ---------- Annulation (§ 4.9) : les lignes sont marquées, jamais supprimées ---------- */

  function planifierAnnulation(base, d, ctx) {
    const operation = typeof d.operation === "string" ? d.operation : "";
    const lignes = base.mouvements.filter((m) => m.operation === operation);
    const passage = base.passages.find((p) => p.id === operation);
    if (!operation || (!lignes.length && !passage)) throw new ErreurStock("Opération introuvable.");
    const actives = lignes.filter((m) => !m.annule);
    const message = "Opération annulée";
    if (!actives.length && (!passage || passage.annule)) return { ecritures: null, resultat: { message } };

    // Stock après annulation : aucun lot ne doit devenir négatif
    const idx = indexer(base);
    actives.forEach((m) => ajouterIndex(idx.parLot, m.lot, m.emplacement, -Number(m.quantite)));
    if (actives.some((m) => lireIndex(idx.parLot, m.lot, m.emplacement) < -EPS)) throw new ErreurStock(ANNULATION_IMPOSSIBLE);

    const majs = {
      Mouvements: actives.map((m) => ({ ligne: m._ligne, champs: { annule: true, annuleLe: ctx.maintenant } })),
    };
    if (passage && !passage.annule) majs.Passages = [{ ligne: passage._ligne, champs: { annule: true } }];
    // Remise au client annulée : la réservation redevient ouverte
    const remise = actives.find((m) => m.type === "sortie" && /^Commande D-/.test(m.motif));
    if (remise) {
      majs.Reservations = base.reservations
        .filter((r) => r.commande === remise.reference && r.statut === "remise")
        .map((r) => ({ ligne: r._ligne, champs: { statut: "ouverte", statutLe: ctx.maintenant, emplacement: "" } }));
    }
    return { ecritures: { ajouts: {}, majs }, resultat: { message } };
  }

  /* ---------- Réglages : articles et emplacements ---------- */

  function entierOuVide(valeur, nom, max) {
    if (valeur === undefined || valeur === null || valeur === "") return null;
    const n = nombreSaisi(valeur);
    if (!Number.isInteger(n) || n < 0 || n > max) throw new ErreurStock(`${nom} : nombre invalide.`);
    return n;
  }

  function lireArticle(s, existant, base, ctx) {
    const id = typeof s.id === "string" ? s.id.trim() : "";
    const a = existant
      ? Object.assign({}, existant)
      : { id, piecesParSachet: null, codeLot: "", conservationMois: null, seuilMarseille: 0, seuilFerme: 0, reserveHorsSite: 0, actif: true, ordre: null, codeConfirme: false };
    if (existant) {
      if (s.categorie !== undefined && s.categorie !== existant.categorie) throw new ErreurStock("La catégorie d'un article existant ne change pas.");
    } else {
      if (!/^[a-z0-9-]{2,40}$/.test(id)) throw new ErreurStock("Identifiant d'article invalide : lettres minuscules, chiffres et tirets.");
      if (!CATEGORIES.includes(s.categorie)) throw new ErreurStock("Catégorie invalide.");
      if (s.categorie === "produit" && !ctx.idsSite.includes(id)) throw new ErreurStock("Un nouveau produit fini doit d'abord exister sur le site.");
      if (s.categorie === "matiere" && id.indexOf("mp-") !== 0) throw new ErreurStock("L'identifiant d'une matière commence par « mp- ».");
      if (s.categorie === "emballage" && id.indexOf("emb-") !== 0) throw new ErreurStock("L'identifiant d'un emballage commence par « emb- ».");
      a.categorie = s.categorie;
    }
    if (s.nom !== undefined) a.nom = texteLibre(s.nom, "Nom", 60);
    if (!a.nom) throw new ErreurStock("Nom de l'article manquant.");
    if (s.unite !== undefined && s.unite !== a.unite) {
      if (!UNITES.includes(s.unite)) throw new ErreurStock("Unité invalide.");
      if (existant && base.mouvements.some((m) => m.article === id)) throw new ErreurStock(`L'unité de ${a.nom} ne change plus une fois du stock saisi.`);
      a.unite = s.unite;
    }
    if (!a.unite) throw new ErreurStock("Unité manquante.");
    if (s.piecesParSachet !== undefined) a.piecesParSachet = entierOuVide(s.piecesParSachet, "Pièces par sachet", 1000);
    if (s.conservationMois !== undefined) a.conservationMois = entierOuVide(s.conservationMois, "Conservation", 60);
    ["seuilMarseille", "seuilFerme", "reserveHorsSite"].forEach((cle) => {
      if (s[cle] !== undefined) a[cle] = entierOuVide(s[cle], "Seuil ou réserve", QUANTITE_MAXI) || 0;
    });
    if (s.ordre !== undefined) a.ordre = entierOuVide(s.ordre, "Ordre", 10000);
    if (s.actif !== undefined) a.actif = s.actif === true;
    if (s.codeLot !== undefined) {
      const code = texteLibre(s.codeLot, "Code lot", 10);
      if (!/^[A-Za-z0-9]*$/.test(code)) throw new ErreurStock("Code lot : lettres et chiffres uniquement.");
      if (code !== a.codeLot) a.codeConfirme = true; // un code modifié dans Réglages est confirmé par Jo
      a.codeLot = code;
    }
    if (typeof s.codeConfirme === "boolean") a.codeConfirme = s.codeConfirme;
    return a;
  }

  function lireEmplacement(s, existant) {
    const id = typeof s.id === "string" ? s.id.trim() : "";
    const e = existant ? Object.assign({}, existant) : { id, precision: "", site: false };
    if (!existant && !/^[a-z0-9-]{2,30}$/.test(id)) throw new ErreurStock("Identifiant d'emplacement invalide : lettres minuscules, chiffres et tirets.");
    if (s.nom !== undefined) e.nom = texteLibre(s.nom, "Nom", 60);
    if (!e.nom) throw new ErreurStock("Nom de l'emplacement manquant.");
    if (s.court !== undefined) e.court = texteLibre(s.court, "Nom court", 20);
    if (!e.court) e.court = e.nom.slice(0, 20);
    if (s.precision !== undefined) e.precision = texteLibre(s.precision, "Précision", 120);
    if (s.site !== undefined) e.site = s.site === true;
    if (e.id === "route") e.site = false; // un envoi en cours ne compte jamais pour le site
    return e;
  }

  function planifierCatalogue(base, d, ctx) {
    const ecritures = { ajouts: {}, majs: {} };
    const pousser = (genre, onglet, objet) => {
      (ecritures[genre][onglet] = ecritures[genre][onglet] || []).push(objet);
    };
    const liste = (valeur, max) => {
      if (valeur === undefined || valeur === null) return [];
      if (!Array.isArray(valeur) || valeur.length > max) throw new ErreurStock("Réglages invalides.");
      return valeur.filter((x) => x && typeof x === "object");
    };
    const champsArticle = STOCK_ONGLETS.Articles.map((c) => c[0]).filter((cle) => cle !== "id" && cle !== "categorie");
    const vus = new Set();
    for (const s of liste(d.articles, 200)) {
      const existant = base.articles.find((a) => a.id === s.id);
      const a = lireArticle(s, existant, base, ctx);
      if (vus.has(a.id)) throw new ErreurStock("Article en double dans les réglages.");
      vus.add(a.id);
      if (existant) {
        pousser("majs", "Articles", { ligne: existant._ligne, champs: champsArticle.reduce((o, cle) => Object.assign(o, { [cle]: a[cle] }), {}) });
      } else {
        pousser("ajouts", "Articles", a);
      }
    }
    for (const s of liste(d.emplacements, 30)) {
      const existant = base.emplacements.find((e) => e.id === s.id);
      const e = lireEmplacement(s, existant);
      if (vus.has(`@${e.id}`)) throw new ErreurStock("Emplacement en double dans les réglages.");
      vus.add(`@${e.id}`);
      if (existant) {
        pousser("majs", "Emplacements", { ligne: existant._ligne, champs: { nom: e.nom, court: e.court, precision: e.precision, site: e.site } });
      } else {
        pousser("ajouts", "Emplacements", e);
      }
    }
    if (!vus.size) throw new ErreurStock("Aucun réglage à enregistrer.");
    return { ecritures, resultat: { message: "Réglages enregistrés" } };
  }

  /* ---------- Lectures : état, fiche lot, journal, rapprochement ---------- */

  /** Mouvements groupés par opération, les plus récentes d'abord (date et heure de l'opération, qui
      peut être saisie après coup ; à égalité, la dernière saisie d'abord). */
  function grouperOperations(mouvements, idx, base) {
    const passages = new Set(base.passages.map((p) => p.id));
    const groupes = new Map();
    for (const m of mouvements) {
      let g = groupes.get(m.operation);
      if (!g) {
        g = { operation: m.operation, horodatage: m.horodatage, note: m.note, reference: m.reference, lignes: [] };
        groupes.set(m.operation, g);
      }
      const lot = idx.lots.get(m.lot);
      g.lignes.push({
        id: m.id,
        type: m.type,
        motif: m.motif,
        article: m.article,
        lot: m.lot,
        numero: lot ? lot.numero : "",
        emplacement: m.emplacement,
        quantite: m.quantite,
        annule: !!m.annule,
        annuleLe: m.annuleLe || null,
      });
    }
    return Array.from(groupes.values())
      .map((g, rang) => Object.assign(g, {
        genre: genreOperation(g.lignes, passages.has(g.operation)),
        motif: g.lignes[0].motif,
        annule: g.lignes.every((l) => l.annule),
        rang,
      }))
      .sort((a, b) => (b.horodatage || 0) - (a.horodatage || 0) || b.rang - a.rang)
      .map((g) => {
        delete g.rang;
        return g;
      });
  }

  /** Passages non annulés, du plus ancien au plus récent : période, vendus, attendu, encaissé, écarts. */
  function rapprochement(base) {
    let cumul = 0;
    let precedent = null;
    return base.passages
      .filter((p) => !p.annule)
      .sort((a, b) => a.horodatage - b.horodatage)
      .map((p) => {
        const r = resumePassage(p, base.details);
        if (r.ecart !== null) cumul = centimes(cumul + r.ecart);
        r.depuis = precedent;
        r.ecartCumule = cumul;
        precedent = p.horodatage;
        return r;
      });
  }

  function reservationsOuvertes(base) {
    const parCommande = new Map();
    base.reservations.forEach((r) => {
      if (r.statut !== "ouverte") return;
      if (!parCommande.has(r.commande)) parCommande.set(r.commande, { commande: r.commande, horodatage: r.horodatage, produits: [] });
      parCommande.get(r.commande).produits.push({ article: r.article, sachets: r.sachets });
    });
    return Array.from(parCommande.values());
  }

  /** État de l'Atelier : catalogue, lots et quantités, réservations ouvertes, 300 derniers mouvements, passages. */
  function etatComplet(base, ctx) {
    const idx = indexer(base);
    const recents = base.mouvements.slice(-300);
    const lotsRecents = new Set(recents.map((m) => m.lot));
    const lots = base.lots
      .map((l) => Object.assign(sansLigne(l), { quantites: versObjet(idx.parLot.get(l.id)) }))
      .filter((l) => lotsRecents.has(l.id) || Object.keys(l.quantites).length);
    const stock = {};
    idx.parArticle.forEach((parEmplacement, article) => { stock[article] = versObjet(parEmplacement); });
    return {
      articles: base.articles.map(sansLigne),
      emplacements: base.emplacements.map(sansLigne),
      lots,
      stock,
      reservations: reservationsOuvertes(base),
      operations: grouperOperations(recents, idx, base),
      passages: rapprochement(base),
      disponibles: disponibles(base, idx),
      statuts: statutsSite(base, ctx.idsSite),
    };
  }

  /** Fiche d'un lot : quantités, historique, matières utilisées et « utilisé dans ». */
  function ficheLot(base, lotId) {
    const idx = indexer(base);
    const lot = typeof lotId === "string" ? idx.lots.get(lotId) : undefined;
    if (!lot) throw new ErreurStock("Lot introuvable.");
    const nom = (article) => (idx.articles.has(article) ? idx.articles.get(article).nom : article);
    const numero = (id) => (idx.lots.has(id) ? idx.lots.get(id).numero : "");
    const ligne = (m) => ({
      operation: m.operation,
      horodatage: m.horodatage,
      type: m.type,
      motif: m.motif,
      emplacement: m.emplacement,
      quantite: m.quantite,
      note: m.note,
      reference: m.reference,
      annule: !!m.annule,
    });
    const intrant = (m) => !m.annule && m.type === "production" && m.motif === MOTIF.intrant;
    return {
      lot: Object.assign(sansLigne(lot), { nom: nom(lot.article), quantites: versObjet(idx.parLot.get(lot.id)) }),
      historique: base.mouvements.filter((m) => m.lot === lot.id).map(ligne).reverse(),
      intrants: base.mouvements
        .filter((m) => intrant(m) && m.reference === lot.id)
        .map((m) => ({ lot: m.lot, numero: numero(m.lot), article: m.article, nom: nom(m.article), quantite: -m.quantite })),
      utiliseDans: base.mouvements
        .filter((m) => intrant(m) && m.lot === lot.id)
        .map((m) => {
          const produit = idx.lots.get(m.reference);
          return { lot: m.reference, numero: numero(m.reference), article: produit ? produit.article : "", nom: produit ? nom(produit.article) : "", quantite: -m.quantite };
        }),
    };
  }

  /** Journal par page, avec recherche (n° de lot, article, note) et filtre par genre d'opération. */
  function journal(base, d) {
    const idx = indexer(base);
    let operations = grouperOperations(base.mouvements, idx, base);
    const genre = typeof d.genre === "string" ? d.genre : "";
    if (genre) operations = operations.filter((o) => o.genre === genre);
    const recherche = normaliser(typeof d.recherche === "string" ? d.recherche : "");
    if (recherche) {
      operations = operations.filter((o) => {
        const mots = [o.motif, o.note, o.reference];
        o.lignes.forEach((l) => mots.push(l.numero, l.article, idx.articles.has(l.article) ? idx.articles.get(l.article).nom : ""));
        return normaliser(mots.join(" ")).indexOf(recherche) !== -1;
      });
    }
    const parPage = Math.min(100, Math.max(1, Math.floor(Number(d.parPage)) || 50));
    const pages = Math.max(1, Math.ceil(operations.length / parPage));
    const page = Math.min(pages, Math.max(1, Math.floor(Number(d.page)) || 1));
    return { operations: operations.slice((page - 1) * parPage, page * parPage), page, pages, total: operations.length };
  }

  /* ---------- Écritures : aiguillage et rejeu ---------- */

  /**
   * Résultat d'une opération déjà écrite avec cet idOperation (réseau coupé, double appui), ou null.
   * Il est recalculé depuis les lignes écrites : rien n'est réécrit.
   */
  function resultatPrecedent(base, idOperation) {
    const articles = new Map(base.articles.map((a) => [a.id, a]));
    const passage = base.passages.find((p) => p.id === idOperation);
    if (passage) return resultatPassage(passage, base.details, articles);
    const lignes = base.mouvements.filter((m) => m.operation === idOperation);
    if (!lignes.length) return null;
    return { message: messageOperation(lignes, new Map(base.lots.map((l) => [l.id, l]))) };
  }

  /** Prépare une écriture : { ecritures, resultat }. `ecritures` vaut null quand il n'y a rien à écrire. */
  function planifier(action, base, d, ctx) {
    const idOperation = lireIdOperation(d.idOperation);
    switch (action) {
      case "stock.operation":
        return planifierOperation(base, d, ctx, idOperation);
      case "stock.passage":
        return planifierPassage(base, d, ctx, idOperation);
      case "stock.encaissement":
        return planifierEncaissement(base, d, ctx);
      case "stock.commande":
        return planifierCommande(base, d, ctx, idOperation);
      case "stock.annuler":
        return planifierAnnulation(base, d, ctx);
      case "stock.catalogue":
        return planifierCatalogue(base, d, ctx);
      case "stock.import":
        return planifierImport(base, d, ctx, idOperation);
      default:
        throw new ErreurStock("Action inconnue.");
    }
  }

  return {
    MOTIF,
    MOTIFS_SORTIE,
    egaliteConstante,
    lireIdOperation,
    normaliser,
    jourValide,
    ajouterMois,
    ddmProposee,
    numeroLotProduit,
    numeroLotReception,
    catalogueInitial,
    indexer,
    ordreSortie,
    lireCsv,
    disponibles,
    statutsSite,
    produitEnManque,
    reservationsCommande,
    resumePassage,
    rapprochement,
    etatComplet,
    ficheLot,
    journal,
    resultatPrecedent,
    planifier,
  };
})();

/* ===================================================================
   2. CLASSEUR STOCK (SpreadsheetApp, LockService, CacheService)
   =================================================================== */

const StockClasseur = (() => {
  const VERROU_MS = 20000; // même attente que enregistrer() dans Code.gs : le verrou est partagé
  const CACHE_SECONDES = 600;
  const MORCEAU_CACHE = 30000; // caractères par valeur (CacheService accepte 100 Ko par valeur)
  const LECTURES = ["stock.etat", "stock.dispo", "stock.lot", "stock.journal"];
  const ECRITURES = ["stock.operation", "stock.annuler", "stock.passage", "stock.encaissement", "stock.commande", "stock.catalogue", "stock.import"];
  const TABLES = {
    articles: "Articles",
    emplacements: "Emplacements",
    lots: "Lots",
    mouvements: "Mouvements",
    reservations: "Reservations",
    passages: "Passages",
    details: "PassagesDetail",
  };
  // Ordre d'écriture : les mouvements en dernier (ce sont eux qui font foi)
  const ORDRE_ECRITURE = ["Articles", "Emplacements", "Lots", "Reservations", "PassagesDetail", "Passages", "Mouvements"];

  const proprietes = () => PropertiesService.getScriptProperties();

  function classeur() {
    const id = proprietes().getProperty("STOCK_SPREADSHEET_ID");
    if (!id) throw new ErreurStock("Le classeur Stock n'est pas encore créé : lance initialiserStock depuis l'éditeur.");
    return SpreadsheetApp.openById(id);
  }

  /** Erreur inattendue : journalisée avec un code, sans son message (qui pourrait contenir des données). */
  function journaliser(prefixe, err) {
    const code = `${prefixe}-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    const pile = String((err && err.stack) || "").split("\n").slice(1).join("\n");
    console.error(`Atelier ${code} : erreur interne${err && err.name ? ` (${err.name})` : ""}.${pile ? `\n${pile}` : ""}`);
    return code;
  }

  /* ---------- Cellules ---------- */

  const sansApostrophe = (v) => (v.charAt(0) === "'" ? v.slice(1) : v);

  function lireJson(v, defaut) {
    try {
      return v === "" || v === null ? defaut : JSON.parse(sansApostrophe(String(v)));
    } catch (err) {
      return defaut;
    }
  }

  function lireCellule(valeur, genre) {
    const v = valeur === null || valeur === undefined ? "" : valeur;
    switch (genre) {
      case "nombre":
        return v === "" ? null : Number(v);
      case "horodatage":
        return v instanceof Date ? v.getTime() : v === "" ? null : Number(v);
      case "ouinon":
      case "coche":
        return v === true || /^(oui|vrai|true|x)$/i.test(String(v).trim());
      case "json":
        return lireJson(v, []);
      case "prix":
        return typeof v === "number" ? v : lireJson(v, null);
      default: // texte, jour
        return v instanceof Date ? Utilities.formatDate(v, FUSEAU, "yyyy-MM-dd") : sansApostrophe(String(v).trim());
    }
  }

  /** Valeur écrite dans une cellule. Les textes commencent par « ' » : ni formule, ni conversion en date ou en nombre. */
  function ecrireCellule(v, genre) {
    if (v === null || v === undefined) return "";
    switch (genre) {
      case "nombre":
        return typeof v === "number" ? v : "";
      case "horodatage":
        return typeof v === "number" ? new Date(v) : "";
      case "ouinon":
        return v ? "oui" : "non";
      case "coche":
        return v ? "oui" : "";
      case "json":
        return `'${JSON.stringify(v)}`;
      case "prix":
        return typeof v === "number" ? v : `'${JSON.stringify(v)}`;
      default:
        return v === "" ? "" : `'${v}`;
    }
  }

  /* ---------- Lecture et écriture des onglets ---------- */

  function feuille(ss, nom) {
    const f = ss.getSheetByName(nom);
    if (!f) throw new ErreurStock(`Onglet « ${nom} » introuvable dans le classeur Stock : relance initialiserStock.`);
    return f;
  }

  function lireOnglet(ss, nom) {
    const colonnes = STOCK_ONGLETS[nom];
    const f = feuille(ss, nom);
    const derniere = f.getLastRow();
    if (derniere < 2) return [];
    return f
      .getRange(2, 1, derniere - 1, colonnes.length)
      .getValues()
      .map((ligne, i) => {
        const objet = { _ligne: i + 2 };
        colonnes.forEach(([cle, , genre], c) => { objet[cle] = lireCellule(ligne[c], genre); });
        return objet;
      })
      .filter((objet) => objet[colonnes[0][0]] !== "");
  }

  /** Lit les onglets du classeur (tous, ou seulement ceux de `tables`). */
  function lireBase(ss, tables) {
    const base = {};
    Object.keys(TABLES).forEach((cle) => {
      base[cle] = !tables || tables.includes(cle) ? lireOnglet(ss, TABLES[cle]) : [];
    });
    return base;
  }

  function ajouterLignes(ss, nom, objets) {
    if (!objets.length) return;
    const colonnes = STOCK_ONGLETS[nom];
    const f = feuille(ss, nom);
    const valeurs = objets.map((o) => colonnes.map(([cle, , genre]) => ecrireCellule(o[cle], genre)));
    f.getRange(f.getLastRow() + 1, 1, valeurs.length, colonnes.length).setValues(valeurs);
  }

  /** Mises à jour de cellules, regroupées en blocs (lignes consécutives, mêmes colonnes contiguës). */
  function modifierLignes(ss, nom, majs) {
    const colonnes = STOCK_ONGLETS[nom];
    const f = feuille(ss, nom);
    const numero = (cle) => colonnes.findIndex((c) => c[0] === cle) + 1;
    const genre = (cle) => colonnes[numero(cle) - 1][2];
    const blocs = [];
    majs
      .slice()
      .sort((a, b) => a.ligne - b.ligne)
      .forEach((maj) => {
        const cles = Object.keys(maj.champs).sort((a, b) => numero(a) - numero(b));
        if (cles.some((cle) => numero(cle) < 1) || !(maj.ligne >= 2)) throw new Error("Mise à jour invalide");
        const contigues = cles.every((cle, i) => i === 0 || numero(cle) === numero(cles[i - 1]) + 1);
        const dernier = blocs[blocs.length - 1];
        if (contigues && dernier && dernier.contigues && dernier.cles.join() === cles.join() && dernier.fin + 1 === maj.ligne) {
          dernier.majs.push(maj);
          dernier.fin = maj.ligne;
        } else {
          blocs.push({ cles, contigues, debut: maj.ligne, fin: maj.ligne, majs: [maj] });
        }
      });
    blocs.forEach((bloc) => {
      if (bloc.contigues) {
        const valeurs = bloc.majs.map((maj) => bloc.cles.map((cle) => ecrireCellule(maj.champs[cle], genre(cle))));
        f.getRange(bloc.debut, numero(bloc.cles[0]), valeurs.length, bloc.cles.length).setValues(valeurs);
      } else {
        bloc.majs.forEach((maj) => bloc.cles.forEach((cle) => {
          f.getRange(maj.ligne, numero(cle)).setValue(ecrireCellule(maj.champs[cle], genre(cle)));
        }));
      }
    });
  }

  /** Une nouvelle version rend obsolète tout ce qui est en cache. */
  function nouvelleVersion() {
    proprietes().setProperty("STOCK_VERSION", `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);
  }

  /** Applique les écritures préparées par StockRegles, puis invalide le cache. */
  function appliquer(ss, ecritures) {
    if (!ecritures) return false;
    let ecrit = false;
    ORDRE_ECRITURE.forEach((nom) => {
      const ajouts = (ecritures.ajouts || {})[nom] || [];
      const majs = (ecritures.majs || {})[nom] || [];
      if (ajouts.length) ajouterLignes(ss, nom, ajouts);
      if (majs.length) modifierLignes(ss, nom, majs);
      if (ajouts.length || majs.length) ecrit = true;
    });
    if (ecrit) {
      SpreadsheetApp.flush();
      nouvelleVersion();
    }
    return ecrit;
  }

  /* ---------- Verrou et cache ---------- */

  /** Écriture sous le verrou du script, partagé avec le circuit des commandes. */
  function sousVerrou(fn) {
    const verrou = LockService.getScriptLock();
    try {
      verrou.waitLock(VERROU_MS);
    } catch (err) {
      throw new ErreurStock("Le stock est occupé, réessaie dans un instant.");
    }
    try {
      return fn();
    } finally {
      verrou.releaseLock();
    }
  }

  /** Valeur calculée, gardée en cache jusqu'à la prochaine écriture (clé liée à STOCK_VERSION). */
  function avecCache(nom, calcul) {
    const cache = CacheService.getScriptCache();
    const cle = `stock:${nom}:${proprietes().getProperty("STOCK_VERSION") || "0"}`;
    try {
      const nombre = Number(cache.get(cle));
      if (nombre > 0) {
        const cles = Array.from({ length: nombre }, (_, i) => `${cle}:${i}`);
        const morceaux = cache.getAll(cles);
        if (cles.every((k) => typeof morceaux[k] === "string")) return JSON.parse(cles.map((k) => morceaux[k]).join(""));
      }
    } catch (err) {
      // cache illisible : on recalcule
    }
    const valeur = calcul();
    try {
      const json = JSON.stringify(valeur);
      const morceaux = {};
      let n = 0;
      for (let i = 0; i < json.length; i += MORCEAU_CACHE) morceaux[`${cle}:${n++}`] = json.slice(i, i + MORCEAU_CACHE);
      if (n <= 30) {
        cache.putAll(morceaux, CACHE_SECONDES);
        cache.put(cle, String(n), CACHE_SECONDES);
      }
    } catch (err) {
      // le cache est facultatif
    }
    return valeur;
  }

  /* ---------- Classeur des commandes ---------- */

  function feuilleCommandes() {
    const f = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ONGLET);
    return f && f.getLastRow() >= 2 ? f : null;
  }

  /** Prénom, secteur et créneau des commandes demandées (onglet « Commandes »). */
  function infosCommandes(numeros) {
    const infos = {};
    const f = numeros.length ? feuilleCommandes() : null;
    if (!f) return infos;
    const colonne = (nom) => EN_TETES.indexOf(nom);
    f.getRange(2, 1, f.getLastRow() - 1, EN_TETES.length).getValues().forEach((ligne) => {
      const numero = String(ligne[colonne("N° de commande")]).trim();
      if (numeros.includes(numero)) {
        infos[numero] = {
          prenom: String(ligne[colonne("Prénom")]),
          secteur: String(ligne[colonne("Secteur")]),
          creneau: String(ligne[colonne("Créneau")]),
        };
      }
    });
    return infos;
  }

  /** Coche « Livrée » pour une commande remise au client (case à cocher, ou « oui » sinon). */
  function cocherLivree(numero) {
    try {
      const f = feuilleCommandes();
      if (!f) return false;
      const numeros = f.getRange(2, EN_TETES.indexOf("N° de commande") + 1, f.getLastRow() - 1, 1).getValues();
      const i = numeros.findIndex((ligne) => String(ligne[0]).trim() === numero);
      if (i === -1) return false;
      const zone = f.getRange(i + 2, EN_TETES.indexOf("Livrée") + 1);
      if (zone.isChecked() === null) zone.setValue("oui");
      else zone.check();
      return true;
    } catch (err) {
      journaliser("STK-LIVREE", err);
      return false;
    }
  }

  /* ---------- Actions ---------- */

  function contexte() {
    const maintenant = Date.now();
    return {
      maintenant,
      aujourdhui: Utilities.formatDate(new Date(maintenant), FUSEAU, "yyyy-MM-dd"),
      heure: (ms) => Utilities.formatDate(new Date(ms), FUSEAU, "dd/MM HH:mm"),
      prix: CATALOGUE.reduce((prix, p) => Object.assign(prix, { [p.id]: p.prix }), {}),
      idsSite: CATALOGUE.map((p) => p.id),
    };
  }

  function ecrire(action, demande) {
    StockRegles.lireIdOperation(demande.idOperation);
    return sousVerrou(() => {
      const ss = classeur();
      const base = lireBase(ss);
      const precedent = StockRegles.resultatPrecedent(base, demande.idOperation);
      if (precedent) return Object.assign({ ok: true, deja: true }, precedent);
      const { ecritures, resultat } = StockRegles.planifier(action, base, demande, contexte());
      appliquer(ss, ecritures);
      const reponse = Object.assign({ ok: true }, resultat);
      if (ecritures && ecritures.livree) reponse.livreeCochee = cocherLivree(ecritures.livree);
      return reponse;
    });
  }

  /** Statuts du site seulement : jamais de quantité, de lot, de date ni rien sur la ferme. */
  function dispo() {
    const calcul = avecCache("dispo", () => {
      const base = lireBase(classeur(), ["articles", "emplacements", "mouvements", "reservations"]);
      return { maj: new Date().toISOString(), produits: StockRegles.statutsSite(base, CATALOGUE.map((p) => p.id)) };
    });
    return { ok: true, actif: stockActif(), maj: calcul.maj, produits: calcul.produits };
  }

  function etat() {
    const calcul = avecCache("etat", () => {
      const ctx = contexte();
      const e = StockRegles.etatComplet(lireBase(classeur()), ctx);
      const infos = infosCommandes(e.reservations.map((r) => r.commande));
      e.reservations.forEach((r) => Object.assign(r, infos[r.commande] || { prenom: "", secteur: "", creneau: "" }));
      e.maj = new Date(ctx.maintenant).toISOString();
      return e;
    });
    return Object.assign({ ok: true, actif: stockActif() }, calcul);
  }

  function executer(action, demande) {
    if (ECRITURES.includes(action)) return ecrire(action, demande);
    if (!LECTURES.includes(action)) return { ok: false, error: "Action inconnue." };
    if (action === "stock.dispo") return dispo();
    if (action === "stock.etat") return etat();
    const base = lireBase(classeur());
    if (action === "stock.lot") return Object.assign({ ok: true }, StockRegles.ficheLot(base, demande.lot));
    return Object.assign({ ok: true }, StockRegles.journal(base, demande));
  }

  /* ---------- Création du classeur ---------- */

  /** Crée le classeur Stock (ou complète celui qui existe) ; renvoie true s'il vient d'être créé. */
  function preparer() {
    const props = proprietes();
    const id = props.getProperty("STOCK_SPREADSHEET_ID");
    let ss;
    if (id) {
      try {
        ss = SpreadsheetApp.openById(id);
      } catch (err) {
        throw new Error("STOCK_SPREADSHEET_ID ne correspond à aucun classeur accessible : corrige ou supprime cette propriété, puis relance initialiserStock.");
      }
    } else {
      ss = SpreadsheetApp.create("Dedjo — Stock");
    }
    ss.setSpreadsheetTimeZone(FUSEAU);
    const feuilleParDefaut = ss.getSheets()[0];
    Object.keys(STOCK_ONGLETS).forEach((nom) => {
      const colonnes = STOCK_ONGLETS[nom];
      const f = ss.getSheetByName(nom) || ss.insertSheet(nom);
      if (f.getLastRow() === 0) {
        f.getRange(1, 1, 1, colonnes.length).setValues([colonnes.map((c) => c[1])]).setFontWeight("bold");
        f.setFrozenRows(1);
      } else {
        const entetes = f.getRange(1, 1, 1, colonnes.length).getValues()[0];
        if (colonnes.some((c, i) => String(entetes[i]).trim() !== c[1])) {
          throw new Error(`Onglet « ${nom} » : en-têtes inattendus. Rétablis-les, puis relance initialiserStock.`);
        }
      }
    });
    // La feuille vide créée avec le classeur ne sert pas
    if (!id && feuilleParDefaut && !STOCK_ONGLETS[feuilleParDefaut.getName()]) ss.deleteSheet(feuilleParDefaut);

    // Catalogue initial : seuls les articles et emplacements absents sont ajoutés (relance sans risque)
    const base = lireBase(ss, ["articles", "emplacements"]);
    const initial = StockRegles.catalogueInitial(CATALOGUE);
    ajouterLignes(ss, "Emplacements", initial.emplacements.filter((e) => !base.emplacements.some((x) => x.id === e.id)));
    ajouterLignes(ss, "Articles", initial.articles.filter((a) => !base.articles.some((x) => x.id === a.id)));
    SpreadsheetApp.flush();
    if (!id) props.setProperty("STOCK_SPREADSHEET_ID", ss.getId());
    nouvelleVersion();
    return !id;
  }

  return { classeur, lireBase, appliquer, executer, journaliser, preparer };
})();

/* ===================================================================
   POINTS D'ENTRÉE (appelés par Code.gs ou depuis l'éditeur)
   =================================================================== */

/** Actions « stock.* » reçues par doPost : vérifie STOCK_SECRET, puis exécute l'action. */
function traiterActionStock(data) {
  const proprietes = PropertiesService.getScriptProperties();
  const secret = proprietes.getProperty("STOCK_SECRET") || "";
  // Secret absent, trop court ou identique à celui des commandes : l'Atelier reste fermé
  if (
    secret.length < 24 ||
    secret === proprietes.getProperty("SHARED_SECRET") ||
    typeof data.secret !== "string" ||
    !StockRegles.egaliteConstante(data.secret, secret)
  ) {
    return { ok: false, error: "Accès refusé." };
  }
  try {
    return StockClasseur.executer(data.action, data);
  } catch (err) {
    if (err instanceof ErreurStock) return { ok: false, error: err.message };
    const code = StockClasseur.journaliser("STK", err);
    return { ok: false, error: `Erreur interne (${code}). Réessaie : une saisie déjà enregistrée ne sera pas faite deux fois.`, code };
  }
}

/** Vrai quand la propriété STOCK_ACTIF vaut « oui » : les commandes du site réservent leurs sachets. */
function stockActif() {
  return String(PropertiesService.getScriptProperties().getProperty("STOCK_ACTIF") || "").trim().toLowerCase() === "oui";
}

/**
 * Commandes du site, avec STOCK_ACTIF à « oui » : appelée par enregistrer() (Code.gs), sous son
 * verrou, avant l'écriture de la commande. Refuse la commande si un produit dépasse le disponible
 * de Marseille ; sinon écrit une ligne « Reservations » par produit, avec le n° de commande.
 */
function reserverStockCommande(c, id) {
  const ss = StockClasseur.classeur();
  const base = StockClasseur.lireBase(ss, ["articles", "emplacements", "mouvements", "reservations"]);
  const quantites = {};
  c.lignes.forEach((l) => {
    if (l.quantite > 0) quantites[l.produit.id] = l.quantite;
  });
  const manque = StockRegles.produitEnManque(base, quantites);
  if (manque) {
    const produit = c.lignes.find((l) => l.produit.id === manque).produit;
    throw new ErreurCommande(`${produit.nom} est victime de son succès : retire-le de ton panier pour valider ta commande.`);
  }
  StockClasseur.appliquer(ss, { ajouts: { Reservations: StockRegles.reservationsCommande(id, quantites, Date.now()) } });
}

/**
 * À lancer une fois depuis l'éditeur : crée le classeur « Dedjo — Stock » dans ton Drive, avec ses
 * onglets et le catalogue initial, et range son identifiant dans STOCK_SPREADSHEET_ID. Relancer
 * ne crée rien en double : seuls les onglets, articles et emplacements manquants sont ajoutés.
 */
function initialiserStock() {
  const cree = StockClasseur.preparer();
  console.log(
    cree
      ? "Classeur « Dedjo — Stock » créé dans ton Drive. Ne le partage pas."
      : "Classeur « Dedjo — Stock » vérifié : onglets et catalogue initial complets."
  );
  if (!PropertiesService.getScriptProperties().getProperty("STOCK_SECRET")) {
    console.log("Pense à ajouter la propriété STOCK_SECRET (voir DEPLOIEMENT.md).");
  }
}

/** Test depuis l'éditeur : affiche le statut de chaque produit sur le site (aucune quantité). */
function testerStock() {
  console.log(JSON.stringify(StockClasseur.executer("stock.dispo", {})));
}
