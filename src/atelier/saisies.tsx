/* Vue Saisir et formulaires : production, réception, sortie, envoi vers la ferme, transfert,
   inventaire, et sortie ou transfert d'un lot précis. Formulaires repris de la maquette. */

import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftRight, ArrowUpRight, ChefHat, ClipboardCheck, PackageOpen, Truck } from "lucide-react";
import { useAtelier, useEcriture } from "./contexte";
import {
  Badge,
  CARTE,
  Champ,
  CHAMP,
  ChoixPuces,
  DISCRET,
  ETIQUETTE,
  Feuille,
  BOUTON_SECONDAIRE,
  PasAPas,
  Pastille,
  PiedFormulaire,
} from "./composants";
import {
  ajouterJours,
  arrondi,
  articlesDe,
  aujourdhui,
  CATEGORIES,
  dateCourte,
  ddmProposee,
  EPS,
  estBloque,
  lireNombre,
  lotsDe,
  MOTIFS_LOT_BLOQUE,
  MOTIFS_PREPARATION,
  MOTIFS_SORTIE,
  nombre,
  nomCourt,
  numeroLotPreparation,
  numeroLotProduit,
  proposerMatieres,
  qteLot,
  quantite,
  stockArticle,
  stockLibre,
  unite,
  uniteEntiere,
} from "./outils";
import type { Article, Etat, Feuille as TypeFeuille } from "./types";

/** Emplacement proposé par défaut : celui du filtre de la vue Stock, sinon Marseille. */
function emplacementParDefaut(etat: Etat, filtre: string): string {
  if (filtre !== "tout" && etat.emplacements.some((e) => e.id === filtre)) return filtre;
  return etat.emplacements.some((e) => e.id === "marseille") ? "marseille" : etat.emplacements[0]?.id || "";
}

/** Vérifie une quantité saisie : renvoie un message d'erreur, ou "" si elle est bonne. */
function erreurQuantite(a: Article, texte: string, zeroPermis = false): string {
  const n = lireNombre(texte);
  if (!Number.isFinite(n) || n < 0 || (!zeroPermis && n === 0)) return `${a.nom} : indique la quantité.`;
  if (uniteEntiere(a) && !Number.isInteger(n)) return `${a.nom} : la quantité doit être un nombre entier.`;
  return "";
}

/* ===================================================================
   VUE SAISIR
   =================================================================== */

const ACTIONS: { feuille: TypeFeuille; titre: string; detail: string; icone: ReactNode }[] = [
  { feuille: { type: "production" }, titre: "Production", detail: "Nouveau lot de produits finis, avec les matières utilisées.", icone: <ChefHat /> },
  { feuille: { type: "reception" }, titre: "Réception", detail: "Arrivage de matières premières ou d'emballages.", icone: <PackageOpen /> },
  { feuille: { type: "sortie" }, titre: "Sortie", detail: "Vente, dégustation, perte ou matière utilisée.", icone: <ArrowUpRight /> },
  { feuille: { type: "envoi" }, titre: "Envoi vers la ferme", detail: "De Marseille vers « En route », avant le passage à la ferme.", icone: <Truck /> },
  { feuille: { type: "transfert" }, titre: "Transfert", detail: "D'un emplacement à un autre, n° de lot conservés.", icone: <ArrowLeftRight /> },
  { feuille: { type: "inventaire" }, titre: "Inventaire", detail: "Compter un emplacement et corriger les écarts.", icone: <ClipboardCheck /> },
];

export default function VueSaisir() {
  const { ouvrir } = useAtelier();
  return (
    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
      {ACTIONS.map((x) => (
        <button
          key={x.titre}
          type="button"
          onClick={() => ouvrir(x.feuille)}
          className={`${CARTE} grid grid-cols-[44px_1fr] items-center gap-x-3.5 gap-y-0.5 p-3.5 text-left hover:border-[#163F6B]`}
        >
          <span className="row-span-2 grid h-11 w-11 place-items-center rounded-xl bg-[#EDE5D4] text-[#163F6B] [&>svg]:h-[22px] [&>svg]:w-[22px]" aria-hidden="true">
            {x.icone}
          </span>
          <span className="font-display text-lg font-semibold leading-tight text-[#163F6B]">{x.titre}</span>
          <span className="text-[13.5px] text-[#5E6A78]">{x.detail}</span>
        </button>
      ))}
    </div>
  );
}

/* ===================================================================
   PRODUCTION (produit fini ou préparation)
   Les matières sont pré-remplies par la recette ; chaque ligne montre le lot proposé et son
   disponible, et signale ce qui manque, avec un raccourci vers la réception.
   =================================================================== */

interface LigneIntrant {
  cle: number;
  article: string;
  /** "" : lot choisi automatiquement (ordre des DDM, lots bloqués exclus). */
  lot: string;
  quantite: string;
  /** Modifiée à la main (ou ajoutée) : n'est plus recalculée quand la quantité produite change. */
  manuel: boolean;
}

const enTexte = (n: number) => (n ? String(n).replace(".", ",") : "");

export function FormProduction({
  article: articleInitial,
  quantite: quantiteInitiale,
  retourApres,
  fabrication: fabricationInitiale,
  note: noteInitiale,
  emplacement: emplacementInitial,
}: {
  article?: string;
  quantite?: number;
  /** Ouverte par-dessus un autre formulaire : y revenir après l'enregistrement. */
  retourApres?: boolean;
  /** Lot 6 : pré-remplissage depuis le plan de production. */
  fabrication?: string;
  note?: string;
  emplacement?: string;
}) {
  const { etat, filtre, ouvrir, retour } = useAtelier();
  const fabricables = [...articlesDe(etat, "produit"), ...articlesDe(etat, "preparation")];
  const [articleId, setArticleId] = useState(articleInitial || (fabricables.length === 1 ? fabricables[0].id : ""));
  const [q, setQ] = useState(quantiteInitiale ? enTexte(quantiteInitiale) : "");
  const [fabrication, setFabrication] = useState(fabricationInitiale || aujourdhui());
  const [ddmSaisie, setDdmSaisie] = useState<string | null>(null);
  const [numeroSaisi, setNumeroSaisi] = useState<string | null>(null);
  const [emplacement, setEmplacement] = useState(
    emplacementInitial && etat.emplacements.some((e) => e.id === emplacementInitial) ? emplacementInitial : emplacementParDefaut(etat, filtre)
  );
  const [lignes, setLignes] = useState<LigneIntrant[]>([]);
  const [note, setNote] = useState(noteInitiale || "");
  const [confirmerSansMatieres, setConfirmerSansMatieres] = useState(false);
  const ecriture = useEcriture(retourApres ? () => retour() : undefined);
  const compteur = useRef(0);
  const articlePrecedent = useRef<string | null>(null);

  const a = etat.articles.find((x) => x.id === articleId);
  const preparation = !!a && a.categorie === "preparation";
  const qte = lireNombre(q);
  const recette = a ? etat.recettes[a.id] : undefined;

  // Recette : lignes refaites à chaque changement de produit ; quantités recalculées quand la
  // quantité produite change, sauf pour les lignes modifiées à la main
  useEffect(() => {
    const proposees = a ? proposerMatieres(etat, a.id, Number.isFinite(qte) ? qte : 0) : [];
    const proposee = (article: string) => enTexte((proposees.find((p) => p.article === article) || { quantite: 0 }).quantite);
    setLignes((avant) => {
      if (articlePrecedent.current !== articleId) {
        articlePrecedent.current = articleId;
        const r = a ? etat.recettes[a.id] : undefined;
        return r ? r.composants.map((c) => ({ cle: ++compteur.current, article: c.article, lot: "", quantite: proposee(c.article), manuel: false })) : [];
      }
      return avant.map((l) => (l.manuel ? l : { ...l, quantite: proposee(l.article) }));
    });
  }, [a, articleId, etat, qte]);

  // Date limite et n° de lot calculés, tant qu'ils ne sont pas saisis à la main
  let ddmCalculee = "";
  if (a && preparation) ddmCalculee = a.conservationJours !== null && a.conservationJours >= 0 ? ajouterJours(fabrication, a.conservationJours) : "";
  else if (a) ddmCalculee = ddmProposee(fabrication, a.conservationMois);
  const ddm = ddmSaisie ?? ddmCalculee;
  const numeroCalcule = !a ? "" : preparation ? numeroLotPreparation(etat, a, fabrication) : numeroLotProduit(a.codeLot, fabrication, ddm);
  const numero = numeroSaisi ?? numeroCalcule;
  const existant = a ? etat.lots.find((l) => l.article === a.id && l.numero === numero.trim()) : undefined;
  const composables = [...articlesDe(etat, "matiere"), ...articlesDe(etat, "emballage"), ...articlesDe(etat, "preparation")].filter((m) => !a || m.id !== a.id);
  const valides = lignes.filter((l) => lireNombre(l.quantite) > 0);

  /** Disponible d'une ligne à l'emplacement (lots bloqués exclus) et ce qui manque. */
  const bilan = (l: LigneIntrant) => {
    const m = etat.articles.find((x) => x.id === l.article);
    const lot = l.lot ? etat.lots.find((x) => x.id === l.lot) : undefined;
    const dispo = lot ? (estBloque(etat, lot.id) ? 0 : qteLot(lot, emplacement)) : stockLibre(etat, l.article, emplacement);
    const besoin = lireNombre(l.quantite);
    const manque = Number.isFinite(besoin) && besoin > dispo + EPS ? arrondi(besoin - dispo) : 0;
    const premier = lotsDe(etat, l.article, emplacement).find((x) => !estBloque(etat, x.id));
    return { m, dispo, manque, premier };
  };

  const changerLigne = (cle: number, champs: Partial<LigneIntrant>) => {
    setConfirmerSansMatieres(false);
    setLignes(lignes.map((l) => (l.cle === cle ? { ...l, ...champs } : l)));
  };
  const ajouterLigne = () => {
    const premiere = composables.find((m) => stockLibre(etat, m.id, emplacement) > EPS) || composables[0];
    if (!premiere) return ecriture.refuser("Aucune matière dans le catalogue : ajoute-en dans Réglages.");
    setLignes([...lignes, { cle: ++compteur.current, article: premiere.id, lot: "", quantite: "", manuel: true }]);
  };

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    if (!a) return ecriture.refuser("Choisis le produit.");
    const err = erreurQuantite(a, q);
    if (err) return ecriture.refuser(err);
    if (!fabrication) return ecriture.refuser("Indique la date de fabrication.");
    if (!ddm) return ecriture.refuser(preparation ? "Indique la date limite." : "Indique la DDM.");
    if (!numero.trim()) return ecriture.refuser("Indique le n° de lot.");
    for (const l of valides) {
      const { m, manque } = bilan(l);
      const errM = m ? erreurQuantite(m, l.quantite) : "Matière inconnue.";
      if (errM) return ecriture.refuser(errM);
      if (manque && m) return ecriture.refuser(`Il manque ${quantite(m, manque)} de ${m.nom} à ${nomCourt(etat, emplacement)}.`);
    }
    // Sans aucune matière : le lot ne sera pas traçable, on confirme en deux temps
    if (!valides.length && !confirmerSansMatieres) return setConfirmerSansMatieres(true);
    ecriture.envoyer("stock.operation", {
      type: "production",
      article: a.id,
      quantite: qte,
      fabrication,
      ddm,
      numero: numero.trim(),
      emplacement,
      note: note.trim(),
      intrants: valides.map((l) => ({ article: l.article, quantite: lireNombre(l.quantite), lot: l.lot || undefined })),
    });
  };

  const libelle = valides.length ? "Enregistrer la production" : confirmerSansMatieres ? "Confirmer" : "Enregistrer sans matières";

  return (
    <Feuille titre={preparation ? "Production d'une préparation" : "Production"} pied={<PiedFormulaire formulaire="f-production" libelle={libelle} {...ecriture} />}>
      <form id="f-production" onSubmit={envoyer} noValidate className="flex flex-col gap-5">
        <ChoixArticle legende="Produit" articles={articlesDe(etat, "produit")} valeur={articleId} onChange={(id) => { setArticleId(id); setNumeroSaisi(null); setDdmSaisie(null); }} />
        <ChoixArticle legende="Préparation" articles={articlesDe(etat, "preparation")} valeur={articleId} onChange={(id) => { setArticleId(id); setNumeroSaisi(null); setDdmSaisie(null); }} />
        <Champ id="p-q" libelle="Quantité" aide={a && a.piecesParSachet ? `Sachets de ${a.piecesParSachet} pièces · ${nombre((lireNombre(q) || 0) * a.piecesParSachet)} pièces au total` : undefined}>
          <div className="flex items-center gap-2.5">
            <PasAPas id="p-q" valeur={q} onChange={setQ} entier={uniteEntiere(a)} grand />
            <span className="text-[14px] text-[#5E6A78]">{a ? unite(a, 2) : "sachets"}</span>
          </div>
        </Champ>
        <div className="grid grid-cols-2 gap-3">
          <Champ id="p-fab" libelle="Fabrication">
            <input id="p-fab" type="date" value={fabrication} onChange={(e) => setFabrication(e.target.value)} className={CHAMP} />
          </Champ>
          <Champ id="p-ddm" libelle={preparation ? "Date limite" : "DDM"}>
            <input id="p-ddm" type="date" value={ddm} onChange={(e) => setDdmSaisie(e.target.value)} className={CHAMP} />
          </Champ>
        </div>
        {a ? (
          <p className={`${DISCRET} -mt-3`}>
            {ddmSaisie !== null
              ? `${preparation ? "Date limite" : "DDM"} saisie à la main.`
              : preparation
                ? ddmCalculee
                  ? `Date limite calculée : ${a.conservationJours} jour${(a.conservationJours || 0) > 1 ? "s" : ""} après la fabrication.`
                  : "Conservation (jours) à régler dans Réglages : saisis la date limite à la main."
                : a.conservationMois
                  ? `DDM calculée : ${a.conservationMois} mois après la fabrication.`
                  : "Durée de conservation à régler dans Réglages : saisis la DDM à la main."}
          </p>
        ) : null}
        <Champ
          id="p-lot"
          libelle="N° de lot"
          aide={
            existant
              ? `Ce lot existe déjà (${quantite(a, qteLot(existant, "tout"))}) : la production s'y ajoutera.`
              : a && !preparation && !a.codeConfirme
                ? `Code lot « ${a.codeLot} » à confirmer dans Réglages.`
                : preparation
                  ? "Code lot + date de fabrication + rang de la préparation ce jour-là."
                  : "Code produit + date de fabrication + mois et année de DDM, comme sur tes étiquettes."
          }
        >
          <input id="p-lot" value={numero} onChange={(e) => setNumeroSaisi(e.target.value)} autoComplete="off" spellCheck={false} className={`${CHAMP} font-mono`} />
        </Champ>
        <ChampEmplacement valeur={emplacement} onChange={setEmplacement} />

        <fieldset className="grid min-w-0 gap-2">
          <legend className={`${ETIQUETTE} mb-2`}>Matières utilisées</legend>
          {a && !recette ? (
            <p className={DISCRET}>
              Pas encore de recette pour {a.nom} : ajoute-la dans Réglages.
            </p>
          ) : null}
          {lignes.map((l) => {
            const { m, dispo, manque, premier } = bilan(l);
            const lots = lotsDe(etat, l.article, emplacement);
            return (
              <div key={l.cle} className={`${CARTE} grid gap-2 p-2.5 ${manque ? "border-[#B1262E]" : ""}`}>
                <div className="grid grid-cols-2 gap-2">
                  <select aria-label="Matière" value={l.article} onChange={(e) => changerLigne(l.cle, { article: e.target.value, lot: "", manuel: true })} className={CHAMP}>
                    {composables.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.nom}
                      </option>
                    ))}
                  </select>
                  <select aria-label="Lot" value={l.lot} onChange={(e) => changerLigne(l.cle, { lot: e.target.value })} className={CHAMP}>
                    <option value="">{premier ? `Auto · ${premier.numero}` : "Auto · date la plus proche"}</option>
                    {lots.map((x) => (
                      <option key={x.id} value={x.id} disabled={estBloque(etat, x.id)}>
                        {x.numero} · {quantite(m, qteLot(x, emplacement))}
                        {estBloque(etat, x.id) ? " · bloqué" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <PasAPas
                    valeur={l.quantite}
                    onChange={(v) => changerLigne(l.cle, { quantite: v, manuel: true })}
                    entier={uniteEntiere(m)}
                    libelle={`Quantité de ${m ? m.nom : "matière"}`}
                  />
                  <span className="text-[14px] text-[#5E6A78]">{unite(m, 2)}</span>
                  <button
                    type="button"
                    onClick={() => setLignes(lignes.filter((x) => x.cle !== l.cle))}
                    className="ml-auto h-11 rounded-[10px] border border-[#E6DCC6] px-3 text-[14px] font-bold text-[#163F6B]"
                  >
                    Retirer
                  </button>
                </div>
                {manque && m ? (
                  <div className="grid gap-2">
                    <p className="text-[13.5px] font-bold text-[#B1262E]">
                      Il manque {quantite(m, manque)} de {m.nom} à {nomCourt(etat, emplacement)}.
                    </p>
                    <button
                      type="button"
                      className={BOUTON_SECONDAIRE}
                      onClick={() =>
                        ouvrir(
                          m.categorie === "preparation"
                            ? { type: "production", article: m.id, quantite: manque, retour: true }
                            : { type: "reception", article: m.id, quantite: manque, emplacement, retour: true }
                        )
                      }
                    >
                      {m.categorie === "preparation" ? `Produire ${m.nom}` : "Enregistrer une réception"}
                    </button>
                  </div>
                ) : (
                  <p className={DISCRET}>
                    {l.lot ? `${quantite(m, dispo)} disponibles dans ce lot` : premier ? `Lot proposé : ${premier.numero} · ${quantite(m, dispo)} disponibles` : "Aucun lot disponible"}
                    {l.manuel ? "" : " · d'après la recette"}
                  </p>
                )}
              </div>
            );
          })}
          <div>
            <button type="button" onClick={ajouterLigne} className={BOUTON_SECONDAIRE}>
              + Ajouter une matière
            </button>
          </div>
          {!valides.length ? (
            <p className="rounded-xl bg-[#FAEDCF] px-3 py-2.5 text-[14px] font-bold text-[#94600A]">Production sans matières : ce lot ne sera pas traçable.</p>
          ) : (
            <p className={DISCRET}>Déduit du stock de matières et relie ce lot aux lots utilisés, pour ta traçabilité.</p>
          )}
        </fieldset>
        <Champ id="p-note" libelle="Note">
          <input id="p-note" value={note} onChange={(e) => setNote(e.target.value)} autoComplete="off" placeholder="Ex. 2 pétrins" className={CHAMP} />
        </Champ>
      </form>
    </Feuille>
  );
}

/* ===================================================================
   RÉCEPTION
   =================================================================== */

export function FormReception({
  article: articleInitial,
  quantite: quantiteInitiale,
  emplacement: emplacementInitial,
  retourApres,
}: {
  article?: string;
  quantite?: number;
  emplacement?: string;
  /** Ouverte depuis une production : y revenir après l'enregistrement, formulaire intact. */
  retourApres?: boolean;
}) {
  const { etat, filtre, retour } = useAtelier();
  const [articleId, setArticleId] = useState(articleInitial || "");
  const [q, setQ] = useState(quantiteInitiale ? enTexte(quantiteInitiale) : "");
  const [reception, setReception] = useState(aujourdhui());
  const [ddm, setDdm] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [numero, setNumero] = useState("");
  const [emplacement, setEmplacement] = useState(emplacementInitial || emplacementParDefaut(etat, filtre));
  const [note, setNote] = useState("");
  const ecriture = useEcriture(retourApres ? () => retour() : undefined);
  const a = etat.articles.find((x) => x.id === articleId);
  const fournisseurs = useMemo(
    () => Array.from(new Set(etat.lots.map((l) => l.fournisseur).filter(Boolean))).sort((x, y) => x.localeCompare(y, "fr")),
    [etat.lots]
  );

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    if (!a) return ecriture.refuser("Choisis l'article reçu.");
    const err = erreurQuantite(a, q);
    if (err) return ecriture.refuser(err);
    if (!reception) return ecriture.refuser("Indique la date de réception.");
    ecriture.envoyer("stock.operation", {
      type: "reception",
      article: a.id,
      quantite: lireNombre(q),
      reception,
      ddm,
      fournisseur: fournisseur.trim(),
      numero: numero.trim(),
      emplacement,
      note: note.trim(),
    });
  };

  return (
    <Feuille titre="Réception" pied={<PiedFormulaire formulaire="f-reception" libelle="Enregistrer la réception" {...ecriture} />}>
      <form id="f-reception" onSubmit={envoyer} noValidate className="flex flex-col gap-5">
        {CATEGORIES.filter((c) => c.id === "matiere" || c.id === "emballage").map((c) => (
          <ChoixArticle key={c.id} legende={c.nom} articles={articlesDe(etat, c.id)} valeur={articleId} onChange={setArticleId} />
        ))}
        <Champ id="r-q" libelle="Quantité reçue">
          <div className="flex items-center gap-2.5">
            <PasAPas id="r-q" valeur={q} onChange={setQ} entier={uniteEntiere(a)} grand />
            <span className="text-[14px] text-[#5E6A78]">{a ? unite(a, 2) : ""}</span>
          </div>
        </Champ>
        <div className="grid grid-cols-2 gap-3">
          <Champ id="r-date" libelle="Réception">
            <input id="r-date" type="date" value={reception} onChange={(e) => setReception(e.target.value)} className={CHAMP} />
          </Champ>
          <Champ id="r-ddm" libelle="DLC / DDM">
            <input id="r-ddm" type="date" value={ddm} onChange={(e) => setDdm(e.target.value)} className={CHAMP} />
          </Champ>
        </div>
        <Champ id="r-fournisseur" libelle="Fournisseur">
          <input id="r-fournisseur" list="r-fournisseurs" value={fournisseur} onChange={(e) => setFournisseur(e.target.value)} autoComplete="off" className={CHAMP} />
          <datalist id="r-fournisseurs">
            {fournisseurs.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </Champ>
        <Champ id="r-lot" libelle="N° de lot fournisseur" aide="Laisse vide s'il n'y en a pas : un n° sera créé à partir de la date.">
          <input id="r-lot" value={numero} onChange={(e) => setNumero(e.target.value)} autoComplete="off" spellCheck={false} className={`${CHAMP} font-mono`} />
        </Champ>
        <ChampEmplacement valeur={emplacement} onChange={setEmplacement} />
        <Champ id="r-note" libelle="Note">
          <input id="r-note" value={note} onChange={(e) => setNote(e.target.value)} autoComplete="off" className={CHAMP} />
        </Champ>
      </form>
    </Feuille>
  );
}

/* ===================================================================
   SORTIE, ENVOI VERS LA FERME, TRANSFERT : listes à quantités
   =================================================================== */

export function FormLignes({ mode }: { mode: "sortie" | "envoi" | "transfert" }) {
  const { etat, filtre } = useAtelier();
  const parDefaut = mode === "envoi" ? "marseille" : emplacementParDefaut(etat, filtre);
  const [de, setDe] = useState(parDefaut);
  const [vers, setVers] = useState(etat.emplacements.find((e) => e.id !== parDefaut)?.id || "");
  const [motif, setMotif] = useState(MOTIFS_SORTIE[0]);
  const [note, setNote] = useState("");
  const [quantites, setQuantites] = useState<Record<string, string>>({});
  const ecriture = useEcriture();
  // Perte ou retour fournisseur : les lots bloqués comptent ; une préparation ne part qu'en perte ou « Autre »
  const avecBloques = mode === "sortie" && MOTIFS_LOT_BLOQUE.includes(motif);
  const avecPreparations = mode === "sortie" && MOTIFS_PREPARATION.includes(motif);
  const visibles = articlesProposes(etat, de, avecBloques, avecPreparations).map((a) => a.id);
  const choisies = Object.entries(quantites).filter(([id, v]) => lireNombre(v) > 0 && visibles.includes(id));
  const titres = { sortie: "Sortie", envoi: "Envoi vers la ferme", transfert: "Transfert" };
  const libelle = { sortie: "Enregistrer la sortie", envoi: "Enregistrer l'envoi", transfert: "Enregistrer le transfert" }[mode];
  const options = etat.emplacements.map((e) => ({ valeur: e.id, libelle: e.court }));

  const changerDe = (v: string) => {
    setDe(v);
    setQuantites({});
    if (vers === v) setVers(etat.emplacements.find((e) => e.id !== v)?.id || "");
  };

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    if (!choisies.length) return ecriture.refuser("Indique au moins une quantité.");
    for (const [id, v] of choisies) {
      const err = erreurQuantite(etat.articles.find((x) => x.id === id) as Article, v);
      if (err) return ecriture.refuser(err);
    }
    const lignes = choisies.map(([article, v]) => ({ article, quantite: lireNombre(v) }));
    if (mode === "sortie") ecriture.envoyer("stock.operation", { type: "sortie", emplacement: de, motif, note: note.trim(), lignes });
    else if (mode === "envoi") ecriture.envoyer("stock.operation", { type: "envoi", note: note.trim(), lignes });
    else {
      if (!vers || vers === de) return ecriture.refuser("Choisis un emplacement de destination différent.");
      ecriture.envoyer("stock.operation", { type: "transfert", de, vers, note: note.trim(), lignes });
    }
  };

  return (
    <Feuille
      titre={titres[mode]}
      pied={
        <PiedFormulaire
          formulaire="f-lignes"
          libelle={choisies.length ? `${libelle} · ${choisies.length} article${choisies.length > 1 ? "s" : ""}` : libelle}
          desactive={!choisies.length}
          {...ecriture}
        />
      }
    >
      <form id="f-lignes" onSubmit={envoyer} noValidate className="flex flex-col gap-5">
        {mode === "envoi" ? (
          <p className={DISCRET}>
            De <b>Marseille</b> vers <b>{nomCourt(etat, "route")}</b>. Au passage à la ferme, les sachets ajoutés au congélateur sont pris d'abord ici.
          </p>
        ) : (
          <ChoixPuces legende={mode === "sortie" ? "Depuis" : "De"} options={options} valeur={de} onChange={changerDe} />
        )}
        {mode === "transfert" ? <ChoixPuces legende="Vers" options={options} valeur={vers} onChange={setVers} desactive={(v) => v === de} /> : null}
        {mode === "sortie" ? <ChoixPuces legende="Motif" options={MOTIFS_SORTIE.map((m) => ({ valeur: m, libelle: m }))} valeur={motif} onChange={setMotif} /> : null}
        <Champ id="l-note" libelle="Note">
          <input
            id="l-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            autoComplete="off"
            placeholder={mode === "sortie" ? "Client, occasion…" : "Ex. glacière, Chronofresh"}
            className={CHAMP}
          />
        </Champ>
        <fieldset className="grid min-w-0 gap-2">
          <legend className={`${ETIQUETTE} mb-1`}>Quantités</legend>
          <p className={DISCRET}>
            {avecBloques
              ? "Les lots bloqués partent en premier, puis les autres à la DDM la plus proche."
              : `Le stock part des lots à la DDM la plus proche${mode === "sortie" ? "" : ", qui gardent leur n° de lot"}. Les lots bloqués ne sont pas utilisés.`}
          </p>
          <ListeQuantites
            emplacement={de}
            avecBloques={avecBloques}
            avecPreparations={avecPreparations}
            quantites={quantites}
            onChange={(id, v) => setQuantites({ ...quantites, [id]: v })}
          />
        </fieldset>
      </form>
    </Feuille>
  );
}

/** Articles proposés dans une liste à quantités : en stock utilisable à cet emplacement. */
function articlesProposes(etat: Etat, emplacement: string, avecBloques: boolean, avecPreparations: boolean): Article[] {
  return CATEGORIES.flatMap((c) =>
    c.id === "preparation" && !avecPreparations
      ? []
      : articlesDe(etat, c.id, true).filter((a) => (avecBloques ? stockArticle(etat, a.id, emplacement) : stockLibre(etat, a.id, emplacement)) > EPS)
  );
}

function ListeQuantites({
  emplacement,
  avecBloques,
  avecPreparations,
  quantites,
  onChange,
}: {
  emplacement: string;
  avecBloques: boolean;
  avecPreparations: boolean;
  quantites: Record<string, string>;
  onChange: (id: string, v: string) => void;
}) {
  const { etat } = useAtelier();
  const proposes = articlesProposes(etat, emplacement, avecBloques, avecPreparations);
  const groupes = CATEGORIES.map((c) => ({ c, articles: proposes.filter((a) => a.categorie === c.id) })).filter((g) => g.articles.length);
  if (!groupes.length) return <p className={DISCRET}>Rien en stock à {nomCourt(etat, emplacement)}.</p>;
  return (
    <div className="grid gap-3.5">
      {groupes.map(({ c, articles }) => (
        <div key={c.id}>
          <h4 className={`${ETIQUETTE} mb-1.5`}>{c.nom}</h4>
          <div className={`${CARTE} overflow-hidden`}>
            {articles.map((a) => {
              const total = stockArticle(etat, a.id, emplacement);
              const stock = avecBloques ? total : stockLibre(etat, a.id, emplacement);
              const bloques = arrondi(total - stockLibre(etat, a.id, emplacement));
              const choisi = lireNombre(quantites[a.id] || "") > 0;
              return (
                <div key={a.id} className={`flex items-center gap-2.5 border-t border-[#E6DCC6] py-2 pl-3 pr-2 first:border-t-0 ${choisi ? "bg-[#F3ECDD]" : ""}`}>
                  <Pastille article={a} />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-base leading-tight">{a.nom}</div>
                    <div className="text-[12.5px] tabular-nums text-[#5E6A78]">
                      {quantite(a, stock)} {avecBloques ? "en stock" : "disponibles"}
                      {bloques > EPS ? <span className="font-bold text-[#B1262E]"> · {nombre(bloques)} bloqué{bloques >= 2 ? "s" : ""}</span> : null}
                    </div>
                  </div>
                  <PasAPas valeur={quantites[a.id] || ""} onChange={(v) => onChange(a.id, v)} entier={uniteEntiere(a)} max={stock} libelle={`Quantité ${a.nom}`} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ===================================================================
   INVENTAIRE
   =================================================================== */

export function FormInventaire() {
  const { etat, filtre } = useAtelier();
  const [emplacement, setEmplacement] = useState(emplacementParDefaut(etat, filtre));
  const [note, setNote] = useState("");
  const [comptes, setComptes] = useState<Record<string, string>>({});
  const ecriture = useEcriture();
  const ecarts = Object.entries(comptes).filter(([id, v]) => {
    const lot = etat.lots.find((l) => l.id === id);
    return lot && v !== "" && Number.isFinite(lireNombre(v)) && Math.abs(lireNombre(v) - qteLot(lot, emplacement)) > EPS;
  });

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    if (!ecarts.length) return ecriture.refuser("Aucun écart à enregistrer.");
    for (const [id, v] of ecarts) {
      const lot = etat.lots.find((l) => l.id === id);
      const err = erreurQuantite(etat.articles.find((a) => a.id === lot?.article) as Article, v, true);
      if (err) return ecriture.refuser(err);
    }
    ecriture.envoyer("stock.operation", {
      type: "inventaire",
      emplacement,
      note: note.trim(),
      comptes: ecarts.map(([lot, v]) => ({ lot, quantite: lireNombre(v) })),
    });
  };

  return (
    <Feuille
      titre="Inventaire"
      pied={
        <PiedFormulaire
          formulaire="f-inventaire"
          libelle={ecarts.length ? `Enregistrer · ${ecarts.length} écart${ecarts.length > 1 ? "s" : ""}` : "Aucun écart"}
          desactive={!ecarts.length}
          {...ecriture}
        />
      }
    >
      <form id="f-inventaire" onSubmit={envoyer} noValidate className="flex flex-col gap-5">
        <ChoixPuces
          legende="Emplacement"
          options={etat.emplacements.map((x) => ({ valeur: x.id, libelle: x.court }))}
          valeur={emplacement}
          onChange={(v) => {
            setEmplacement(v);
            setComptes({});
          }}
        />
        <Champ id="i-note" libelle="Note">
          <input id="i-note" value={note} onChange={(e) => setNote(e.target.value)} autoComplete="off" className={CHAMP} />
        </Champ>
        <fieldset className="grid min-w-0 gap-3">
          <legend className={`${ETIQUETTE} mb-1`}>Compté</legend>
          <p className={DISCRET}>Corrige seulement les lots dont le compte diffère : l'écart est enregistré.</p>
          {CATEGORIES.map((c) => {
            const articles = articlesDe(etat, c.id, true).filter((a) => lotsDe(etat, a.id, emplacement).length);
            if (!articles.length) return null;
            return (
              <div key={c.id} className="grid gap-2">
                <h4 className={ETIQUETTE}>{c.nom}</h4>
                {articles.map((a) => (
                  <div key={a.id} className={`${CARTE} grid gap-2.5 px-3 py-2.5`}>
                    <div className="flex items-center gap-2 font-display text-base">
                      <Pastille article={a} />
                      {a.nom} <span className="text-[13px] text-[#5E6A78]">en {unite(a, 2)}</span>
                    </div>
                    {lotsDe(etat, a.id, emplacement).map((l) => {
                      const enregistre = qteLot(l, emplacement);
                      const valeur = comptes[l.id] ?? String(enregistre).replace(".", ",");
                      const change = comptes[l.id] !== undefined && Math.abs(lireNombre(valeur) - enregistre) > EPS;
                      return (
                        <div key={l.id} className="flex items-center gap-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="break-all font-mono text-[14px] font-bold">
                              {l.numero} {estBloque(etat, l.id) ? <Badge teinte="bad">Bloqué</Badge> : null}
                            </div>
                            <div className="text-[12.5px] text-[#5E6A78]">
                              {l.ddm ? `${l.categorie === "produit" ? "DDM" : "Limite"} ${dateCourte(l.ddm)}` : "Sans date limite"} · noté {nombre(enregistre)}
                            </div>
                          </div>
                          <div className={change ? "rounded-[11px] ring-2 ring-[#94600A]" : ""}>
                            <PasAPas valeur={valeur} onChange={(v) => setComptes({ ...comptes, [l.id]: v })} entier={uniteEntiere(a)} libelle={`Compté pour le lot ${l.numero}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
          {!etat.lots.some((l) => qteLot(l, emplacement) > EPS) ? <p className={DISCRET}>Aucun lot en stock à {nomCourt(etat, emplacement)}.</p> : null}
        </fieldset>
      </form>
    </Feuille>
  );
}

/* ===================================================================
   SORTIE OU TRANSFERT D'UN LOT PRÉCIS
   =================================================================== */

export function FormLot({ id, mode }: { id: string; mode: "sortie" | "transfert" }) {
  const { etat } = useAtelier();
  const lot = etat.lots.find((l) => l.id === id);
  const a = lot ? etat.articles.find((x) => x.id === lot.article) : undefined;
  const lieux = lot ? Object.entries(lot.quantites).filter(([, q]) => q > EPS) : [];
  const [de, setDe] = useState(lieux[0]?.[0] || "");
  const [vers, setVers] = useState(etat.emplacements.find((e) => e.id !== lieux[0]?.[0])?.id || "");
  const [q, setQ] = useState("");
  // Lot bloqué : seulement perte ou retour fournisseur ; préparation : perte ou « Autre », jamais de transfert
  const bloque = !!lot && estBloque(etat, lot.id);
  const preparation = !!a && a.categorie === "preparation";
  const motifs = bloque ? MOTIFS_LOT_BLOQUE : preparation ? MOTIFS_PREPARATION : MOTIFS_SORTIE;
  const [motif, setMotif] = useState(motifs[0]);
  const [note, setNote] = useState("");
  const ecriture = useEcriture();
  if (!lot || !a) return <Feuille titre="Lot">{<p className={DISCRET}>Lot introuvable ou épuisé.</p>}</Feuille>;
  const max = lot.quantites[de] || 0;
  const transfertImpossible = mode === "transfert" && (bloque || preparation);

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    const err = erreurQuantite(a, q);
    if (err) return ecriture.refuser(err);
    if (lireNombre(q) > max + EPS) return ecriture.refuser(`Il n'y a que ${quantite(a, max)} de ce lot à ${nomCourt(etat, de)}.`);
    const lignes = [{ article: a.id, quantite: lireNombre(q), lot: lot.id }];
    if (mode === "sortie") ecriture.envoyer("stock.operation", { type: "sortie", emplacement: de, motif, note: note.trim(), lignes });
    else {
      if (!vers || vers === de) return ecriture.refuser("Choisis un emplacement de destination différent.");
      ecriture.envoyer("stock.operation", { type: "transfert", de, vers, note: note.trim(), lignes });
    }
  };

  return (
    <Feuille
      titre={mode === "sortie" ? "Sortie de ce lot" : "Transférer ce lot"}
      pied={
        <PiedFormulaire
          formulaire="f-lot"
          libelle={mode === "sortie" ? "Enregistrer la sortie" : "Enregistrer le transfert"}
          desactive={transfertImpossible}
          {...ecriture}
        />
      }
    >
      <form id="f-lot" onSubmit={envoyer} noValidate className="flex flex-col gap-5">
        <p className="flex flex-wrap items-center gap-2 font-display text-[17px]">
          <Pastille article={a} />
          {a.nom} · <span className="font-mono text-[15px]">{lot.numero}</span>
          {bloque ? <Badge teinte="bad">Bloqué</Badge> : null}
        </p>
        {transfertImpossible ? (
          <p className="rounded-xl bg-[#F7E0E0] px-3 py-2.5 text-[14px] font-bold text-[#B1262E]">
            {preparation ? "Une préparation reste au labo." : "Ce lot est bloqué : il ne peut pas être transféré. Seule une sortie « Perte » ou « Retour fournisseur » est possible."}
          </p>
        ) : null}
        <ChoixPuces
          legende="Depuis"
          options={lieux.map(([e, qte]) => ({ valeur: e, libelle: `${nomCourt(etat, e)} · ${nombre(qte)}` }))}
          valeur={de}
          onChange={(v) => {
            setDe(v);
            if (vers === v) setVers(etat.emplacements.find((x) => x.id !== v)?.id || "");
          }}
        />
        <Champ id="la-q" libelle="Quantité">
          <div className="flex items-center gap-2.5">
            <PasAPas id="la-q" valeur={q} onChange={setQ} entier={uniteEntiere(a)} max={max} grand />
            <span className="text-[14px] text-[#5E6A78]">{unite(a, 2)}</span>
          </div>
        </Champ>
        {mode === "transfert" ? (
          <ChoixPuces legende="Vers" options={etat.emplacements.map((x) => ({ valeur: x.id, libelle: x.court }))} valeur={vers} onChange={setVers} desactive={(v) => v === de} />
        ) : (
          <ChoixPuces legende="Motif" options={motifs.map((m) => ({ valeur: m, libelle: m }))} valeur={motif} onChange={setMotif} />
        )}
        <Champ id="la-note" libelle="Note">
          <input id="la-note" value={note} onChange={(e) => setNote(e.target.value)} autoComplete="off" className={CHAMP} />
        </Champ>
      </form>
    </Feuille>
  );
}

/* ===================================================================
   CHAMPS COMMUNS
   =================================================================== */

/** Choix d'un article parmi des cartes (pastille + nom). */
function ChoixArticle({ legende, articles, valeur, onChange }: { legende: string; articles: Article[]; valeur: string; onChange: (id: string) => void }) {
  if (!articles.length) return null;
  return (
    <fieldset className="grid min-w-0 gap-2">
      <legend className={`${ETIQUETTE} mb-2`}>{legende}</legend>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(146px,1fr))] gap-2" role="radiogroup" aria-label={legende}>
        {articles.map((a) => (
          <button
            key={a.id}
            type="button"
            role="radio"
            aria-checked={a.id === valeur}
            onClick={() => onChange(a.id)}
            className={`flex min-h-11 items-center gap-2.5 rounded-[10px] border bg-[#FFFCF6] px-3 py-2.5 text-left font-display text-[15.5px] leading-tight ${
              a.id === valeur ? "border-[#163F6B] ring-1 ring-[#163F6B]" : "border-[#E6DCC6]"
            }`}
          >
            <Pastille article={a} />
            {a.nom}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ChampEmplacement({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  const { etat } = useAtelier();
  return (
    <Champ id="emplacement" libelle="Emplacement">
      <select id="emplacement" value={valeur} onChange={(e) => onChange(e.target.value)} className={CHAMP}>
        {etat.emplacements.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nom}
          </option>
        ))}
      </select>
    </Champ>
  );
}
