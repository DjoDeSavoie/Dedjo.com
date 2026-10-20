/* Vue Saisir et formulaires : production, réception, sortie, envoi vers la ferme, transfert,
   inventaire, et sortie ou transfert d'un lot précis. Formulaires repris de la maquette. */

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { ArrowLeftRight, ArrowUpRight, ChefHat, ClipboardCheck, PackageOpen, Truck } from "lucide-react";
import { useAtelier, useEcriture } from "./contexte";
import {
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
  articlesDe,
  aujourdhui,
  CATEGORIES,
  dateCourte,
  ddmProposee,
  EPS,
  lireNombre,
  lotsDe,
  MOTIFS_SORTIE,
  nombre,
  nomCourt,
  numeroLotProduit,
  qteLot,
  quantite,
  stockArticle,
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
   PRODUCTION
   =================================================================== */

interface LigneIntrant {
  cle: number;
  article: string;
  lot: string;
  quantite: string;
}

export function FormProduction({ article: articleInitial }: { article?: string }) {
  const { etat, filtre } = useAtelier();
  const produits = articlesDe(etat, "produit");
  const [articleId, setArticleId] = useState(articleInitial || (produits.length === 1 ? produits[0].id : ""));
  const [q, setQ] = useState("");
  const [fabrication, setFabrication] = useState(aujourdhui());
  const [ddmSaisie, setDdmSaisie] = useState<string | null>(null);
  const [numeroSaisi, setNumeroSaisi] = useState<string | null>(null);
  const [emplacement, setEmplacement] = useState(emplacementParDefaut(etat, filtre));
  const [intrants, setIntrants] = useState<LigneIntrant[]>([]);
  const [note, setNote] = useState("");
  const ecriture = useEcriture();

  const a = etat.articles.find((x) => x.id === articleId);
  // DDM et n° de lot calculés, tant qu'ils ne sont pas saisis à la main
  const ddm = ddmSaisie ?? (a ? ddmProposee(fabrication, a.conservationMois) : "");
  const numero = numeroSaisi ?? (a ? numeroLotProduit(a.codeLot, fabrication, ddm) : "");
  const existant = a ? etat.lots.find((l) => l.article === a.id && l.numero === numero.trim()) : undefined;
  const matieres = [...articlesDe(etat, "matiere"), ...articlesDe(etat, "emballage")].filter((m) => stockArticle(etat, m.id, emplacement) > EPS);

  const ajouterIntrant = () => {
    if (!matieres.length) return ecriture.refuser(`Aucune matière en stock à ${nomCourt(etat, emplacement)}.`);
    setIntrants([...intrants, { cle: Date.now(), article: matieres[0].id, lot: "", quantite: "" }]);
  };
  const changerIntrant = (cle: number, champs: Partial<LigneIntrant>) => setIntrants(intrants.map((i) => (i.cle === cle ? { ...i, ...champs } : i)));

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    if (!a) return ecriture.refuser("Choisis le produit.");
    const err = erreurQuantite(a, q);
    if (err) return ecriture.refuser(err);
    if (!fabrication) return ecriture.refuser("Indique la date de fabrication.");
    if (!ddm) return ecriture.refuser("Indique la DDM.");
    if (!numero.trim()) return ecriture.refuser("Indique le n° de lot.");
    const lignes = intrants.filter((i) => lireNombre(i.quantite) > 0);
    for (const i of lignes) {
      const m = etat.articles.find((x) => x.id === i.article);
      const errM = m ? erreurQuantite(m, i.quantite) : "Matière inconnue.";
      if (errM) return ecriture.refuser(errM);
    }
    ecriture.envoyer("stock.operation", {
      type: "production",
      article: a.id,
      quantite: lireNombre(q),
      fabrication,
      ddm,
      numero: numero.trim(),
      emplacement,
      note: note.trim(),
      intrants: lignes.map((i) => ({ article: i.article, quantite: lireNombre(i.quantite), lot: i.lot || undefined })),
    });
  };

  return (
    <Feuille titre="Production" pied={<PiedFormulaire formulaire="f-production" libelle="Enregistrer la production" {...ecriture} />}>
      <form id="f-production" onSubmit={envoyer} noValidate className="flex flex-col gap-5">
        <ChoixArticle legende="Produit" articles={produits} valeur={articleId} onChange={(id) => { setArticleId(id); setNumeroSaisi(null); }} />
        <Champ id="p-q" libelle="Quantité" aide={a && a.piecesParSachet ? `Sachets de ${a.piecesParSachet} pièces · ${nombre((lireNombre(q) || 0) * a.piecesParSachet)} pièces au total` : undefined}>
          <div className="flex items-center gap-2.5">
            <PasAPas id="p-q" valeur={q} onChange={setQ} entier grand />
            <span className="text-[14px] text-[#5E6A78]">{unite(a, 2)}</span>
          </div>
        </Champ>
        <div className="grid grid-cols-2 gap-3">
          <Champ id="p-fab" libelle="Fabrication">
            <input id="p-fab" type="date" value={fabrication} onChange={(e) => setFabrication(e.target.value)} className={CHAMP} />
          </Champ>
          <Champ id="p-ddm" libelle="DDM">
            <input id="p-ddm" type="date" value={ddm} onChange={(e) => setDdmSaisie(e.target.value)} className={CHAMP} />
          </Champ>
        </div>
        {a ? (
          <p className={`${DISCRET} -mt-3`}>
            {ddmSaisie !== null
              ? "DDM saisie à la main."
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
              : a && !a.codeConfirme
                ? `Code lot « ${a.codeLot} » à confirmer dans Réglages.`
                : "Code produit + date de fabrication + mois et année de DDM, comme sur tes étiquettes."
          }
        >
          <input
            id="p-lot"
            value={numero}
            onChange={(e) => setNumeroSaisi(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className={`${CHAMP} font-mono`}
          />
        </Champ>
        <ChampEmplacement valeur={emplacement} onChange={(v) => { setEmplacement(v); setIntrants([]); }} />
        <fieldset className="grid min-w-0 gap-2">
          <legend className={`${ETIQUETTE} mb-2`}>
            Matières utilisées <span className="font-normal normal-case tracking-normal">· facultatif</span>
          </legend>
          {intrants.map((i) => {
            const m = etat.articles.find((x) => x.id === i.article);
            const lots = lotsDe(etat, i.article, emplacement);
            return (
              <div key={i.cle} className={`${CARTE} grid grid-cols-2 gap-2 p-2.5`}>
                <select aria-label="Matière" value={i.article} onChange={(e) => changerIntrant(i.cle, { article: e.target.value, lot: "" })} className={CHAMP}>
                  {matieres.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nom}
                    </option>
                  ))}
                </select>
                <select aria-label="Lot de matière" value={i.lot} onChange={(e) => changerIntrant(i.cle, { lot: e.target.value })} className={CHAMP}>
                  <option value="">Auto · date la plus proche</option>
                  {lots.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.numero} · {quantite(m, qteLot(l, emplacement))}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <input
                    aria-label="Quantité utilisée"
                    inputMode="decimal"
                    placeholder="Qté"
                    value={i.quantite}
                    onChange={(e) => changerIntrant(i.cle, { quantite: e.target.value })}
                    className={CHAMP}
                  />
                  <span className="text-[14px] text-[#5E6A78]">{unite(m, 2)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIntrants(intrants.filter((x) => x.cle !== i.cle))}
                  className="h-11 justify-self-end rounded-[10px] border border-[#E6DCC6] px-3 text-[14px] font-bold text-[#163F6B]"
                >
                  Retirer
                </button>
              </div>
            );
          })}
          <div>
            <button type="button" onClick={ajouterIntrant} className={BOUTON_SECONDAIRE}>
              + Ajouter une matière
            </button>
          </div>
          <p className={DISCRET}>Déduit du stock de matières et relie ce lot aux lots de matières, pour ta traçabilité.</p>
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

export function FormReception({ article: articleInitial }: { article?: string }) {
  const { etat, filtre } = useAtelier();
  const [articleId, setArticleId] = useState(articleInitial || "");
  const [q, setQ] = useState("");
  const [reception, setReception] = useState(aujourdhui());
  const [ddm, setDdm] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [numero, setNumero] = useState("");
  const [emplacement, setEmplacement] = useState(emplacementParDefaut(etat, filtre));
  const [note, setNote] = useState("");
  const ecriture = useEcriture();
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
        {CATEGORIES.filter((c) => c.id !== "produit").map((c) => (
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
  const choisies = Object.entries(quantites).filter(([, v]) => lireNombre(v) > 0);
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
          <p className={DISCRET}>Le stock part des lots à la DDM la plus proche{mode === "sortie" ? "" : ", qui gardent leur n° de lot"}.</p>
          <ListeQuantites emplacement={de} quantites={quantites} onChange={(id, v) => setQuantites({ ...quantites, [id]: v })} />
        </fieldset>
      </form>
    </Feuille>
  );
}

function ListeQuantites({ emplacement, quantites, onChange }: { emplacement: string; quantites: Record<string, string>; onChange: (id: string, v: string) => void }) {
  const { etat } = useAtelier();
  const groupes = CATEGORIES.map((c) => ({ c, articles: articlesDe(etat, c.id, true).filter((a) => stockArticle(etat, a.id, emplacement) > EPS) })).filter((g) => g.articles.length);
  if (!groupes.length) return <p className={DISCRET}>Rien en stock à {nomCourt(etat, emplacement)}.</p>;
  return (
    <div className="grid gap-3.5">
      {groupes.map(({ c, articles }) => (
        <div key={c.id}>
          <h4 className={`${ETIQUETTE} mb-1.5`}>{c.nom}</h4>
          <div className={`${CARTE} overflow-hidden`}>
            {articles.map((a) => {
              const stock = stockArticle(etat, a.id, emplacement);
              const choisi = lireNombre(quantites[a.id] || "") > 0;
              return (
                <div key={a.id} className={`flex items-center gap-2.5 border-t border-[#E6DCC6] py-2 pl-3 pr-2 first:border-t-0 ${choisi ? "bg-[#F3ECDD]" : ""}`}>
                  <Pastille article={a} />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-base leading-tight">{a.nom}</div>
                    <div className="text-[12.5px] tabular-nums text-[#5E6A78]">{quantite(a, stock)} en stock</div>
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
                            <div className="break-all font-mono text-[14px] font-bold">{l.numero}</div>
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
  const [motif, setMotif] = useState(MOTIFS_SORTIE[0]);
  const [note, setNote] = useState("");
  const ecriture = useEcriture();
  if (!lot || !a) return <Feuille titre="Lot">{<p className={DISCRET}>Lot introuvable ou épuisé.</p>}</Feuille>;
  const max = lot.quantites[de] || 0;

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
      pied={<PiedFormulaire formulaire="f-lot" libelle={mode === "sortie" ? "Enregistrer la sortie" : "Enregistrer le transfert"} {...ecriture} />}
    >
      <form id="f-lot" onSubmit={envoyer} noValidate className="flex flex-col gap-5">
        <p className="flex items-center gap-2 font-display text-[17px]">
          <Pastille article={a} />
          {a.nom} · <span className="font-mono text-[15px]">{lot.numero}</span>
        </p>
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
          <ChoixPuces legende="Motif" options={MOTIFS_SORTIE.map((m) => ({ valeur: m, libelle: m }))} valeur={motif} onChange={setMotif} />
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
