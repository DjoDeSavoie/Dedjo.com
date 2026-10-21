/* Vue Ferme (lot 4) : congélateur de la ferme, passage en étapes (compter, retirer, ajouter,
   encaissé, récapitulatif), rapprochement de caisse, fiche d'un passage. Les calculs sont faits par
   le script (apps-script/Stock.gs, planifierPassage) : le récapitulatif est un aperçu du script. */

import { FormEvent, useEffect, useRef, useState } from "react";
import { appeler, ErreurAtelier, nouvelIdOperation } from "./api";
import { useAtelier, useEcriture } from "./contexte";
import {
  Badge,
  BOUTON,
  BOUTON_PRINCIPAL,
  BOUTON_SECONDAIRE,
  CARTE,
  Champ,
  CHAMP,
  DISCRET,
  ETIQUETTE,
  Feuille,
  PasAPas,
  Pastille,
  Squelette,
  TITRE_SECTION,
} from "./composants";
import { exporterPassages } from "./exports";
import {
  articlesDe,
  dateCourte,
  depuisChampDateHeure,
  EPS,
  euros,
  euroSigne,
  heure,
  jourIso,
  jourLong,
  lireNombre,
  nombre,
  quantite,
  stockArticle,
  stockLibre,
  teinteEcart,
  versChampDateHeure,
} from "./outils";
import type { Article, Etat, Passage, ResultatPassage } from "./types";

const quand = (ms: number) => `${dateCourte(jourIso(ms))} à ${heure(ms)}`;

/** Badge d'écart de caisse : vert si juste, rouge si manque, orange si surplus, « à compléter » si vide. */
function BadgeEcart({ ecart }: { ecart: number | null }) {
  const teinte = teinteEcart(ecart);
  return <Badge teinte={teinte}>{ecart === null ? "À compléter" : teinte === "ok" ? "Juste" : `Écart ${euroSigne(ecart)}`}</Badge>;
}

/* ===================================================================
   VUE FERME
   =================================================================== */

export default function VueFerme() {
  const { etat, ouvrir } = useAtelier();
  const produits = articlesDe(etat, "produit", true);
  const congelateur = produits.map((a) => ({ a, q: stockArticle(etat, a.id, "ferme") })).filter((x) => x.q > EPS);
  const enRoute = produits.map((a) => ({ a, q: stockArticle(etat, a.id, "route") })).filter((x) => x.q > EPS);
  const total = congelateur.reduce((s, x) => s + x.q, 0);
  const passages = etat.passages;
  const dernier = passages.length ? passages[passages.length - 1] : null;

  return (
    <>
      <section className="mt-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className={TITRE_SECTION}>Congélateur de la ferme</h2>
          <span className="whitespace-nowrap text-[13px] font-bold tabular-nums text-[#5E6A78]">
            {nombre(total)} sachet{total >= 2 ? "s" : ""}
          </span>
        </div>
        <div className={`${CARTE} overflow-hidden`}>
          {congelateur.length ? (
            congelateur.map(({ a, q }) => (
              <div key={a.id} className="flex items-center gap-3 border-t border-[#E6DCC6] px-3.5 py-2.5 first:border-t-0">
                <Pastille article={a} />
                <span className="flex-1 font-display text-[16px]">{a.nom}</span>
                <b className="tabular-nums">{quantite(a, q)}</b>
              </div>
            ))
          ) : (
            <p className="px-3.5 py-3 text-[14px] text-[#5E6A78]">{dernier ? "Le congélateur est vide d'après le dernier passage." : "Le congélateur est vide."}</p>
          )}
        </div>
        <p className={`${DISCRET} mt-2`}>
          {dernier
            ? `Dernier passage : ${jourLong(dernier.horodatage).toLowerCase()} à ${heure(dernier.horodatage)}. Stock d'après le dernier compte et les ajouts.`
            : "Aucun passage enregistré."}
        </p>
        {enRoute.length ? (
          <p className={`${DISCRET} mt-1`}>En route vers la ferme : {enRoute.map(({ a, q }) => `${a.nom} ${nombre(q)}`).join(" · ")}.</p>
        ) : null}
        <button type="button" className={`${BOUTON_PRINCIPAL} mt-3 w-full`} onClick={() => ouvrir({ type: "nouveauPassage" })}>
          Nouveau passage
        </button>
      </section>

      <section className="mt-8">
        <h2 className={`${TITRE_SECTION} mb-2`}>Rapprochement caisse</h2>
        {passages.length ? (
          <div className="grid gap-2">
            {passages
              .slice()
              .reverse()
              .map((p) => (
                <button key={p.id} type="button" onClick={() => ouvrir({ type: "passage", id: p.id })} className={`${CARTE} grid gap-1.5 px-3.5 py-3 text-left hover:border-[#163F6B]`}>
                  <span className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-[16.5px] font-semibold text-[#163F6B]">Passage du {quand(p.horodatage)}</span>
                    <BadgeEcart ecart={p.ecart} />
                  </span>
                  <span className="text-[12.5px] text-[#5E6A78]">{p.depuis ? `depuis le passage du ${quand(p.depuis)}` : "premier passage"}</span>
                  <span className="grid grid-cols-3 gap-2 text-[13.5px] tabular-nums">
                    <span>
                      <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#5E6A78]">Vendus</span>
                      {nombre(p.vendus)} sachet{p.vendus >= 2 ? "s" : ""}
                    </span>
                    <span>
                      <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#5E6A78]">Attendu</span>
                      {euros(p.attendu)}
                    </span>
                    <span>
                      <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#5E6A78]">Encaissé</span>
                      {p.encaisse === null ? <span className="text-[#94600A]">à compléter</span> : euros(p.encaisse)}
                    </span>
                  </span>
                  <span className="text-[12.5px] tabular-nums text-[#5E6A78]">Écart cumulé : {euroSigne(p.ecartCumule || 0)}</span>
                </button>
              ))}
            <button type="button" className={`${BOUTON_SECONDAIRE} mt-1 w-full`} onClick={() => exporterPassages(etat)}>
              Exporter les passages (CSV)
            </button>
          </div>
        ) : (
          <p className={DISCRET}>Chaque passage apparaîtra ici avec ses ventes, l'attendu, l'encaissé et l'écart.</p>
        )}
      </section>
    </>
  );
}

/* ===================================================================
   NOUVEAU PASSAGE (§ 4.7) : compter, retirer, ajouter, encaissé, récapitulatif
   =================================================================== */

const ETAPES = ["Compter", "Retirer", "Ajouter", "Encaissé", "Récapitulatif"];

/** { id: "4" } → { id: 4 }, sans les champs vides. */
const enNombres = (saisies: Record<string, string>) =>
  Object.keys(saisies).reduce<Record<string, number>>((o, id) => {
    if (saisies[id].trim() !== "") o[id] = lireNombre(saisies[id]);
    return o;
  }, {});

export function FormPassage() {
  const { etat, sessionTerminee } = useAtelier();
  const [etape, setEtape] = useState(0);
  // Heure d'ouverture du formulaire, à la milliseconde, tant que le champ n'est pas modifié
  const [ouverture] = useState(() => Date.now());
  const [moment, setMoment] = useState(versChampDateHeure(ouverture));
  const [comptes, setComptes] = useState<Record<string, string>>({});
  const [retraits, setRetraits] = useState<Record<string, string>>({});
  const [ajouts, setAjouts] = useState<Record<string, string>>({});
  const [encaisse, setEncaisse] = useState("");
  const [note, setNote] = useState("");
  const [apercu, setApercu] = useState<ResultatPassage | null>(null);
  const [chargement, setChargement] = useState(false);
  const ecriture = useEcriture();
  const haut = useRef<HTMLDivElement>(null);

  // Produits actifs, et tout produit encore présent dans le congélateur
  const produits = articlesDe(etat, "produit", true).filter((a) => a.actif || stockArticle(etat, a.id, "ferme") > EPS);
  const aCompter = produits.filter((a) => stockArticle(etat, a.id, "ferme") > EPS);
  const compteDe = (a: Article) => (comptes[a.id] && comptes[a.id].trim() !== "" ? lireNombre(comptes[a.id]) : 0);
  const disponible = (a: Article) => stockLibre(etat, a.id, "route") + stockLibre(etat, a.id, "marseille");
  const horodatage = () => (moment === versChampDateHeure(ouverture) ? ouverture : depuisChampDateHeure(moment));
  const precedent = etat.passages.length ? etat.passages[etat.passages.length - 1] : null;

  useEffect(() => {
    if (haut.current) haut.current.scrollIntoView({ block: "start" });
  }, [etape]);

  const charge = () => ({
    horodatage: horodatage(),
    comptes: enNombres(comptes),
    retraits: enNombres(retraits),
    ajouts: enNombres(ajouts),
    encaisse: encaisse.trim() === "" ? null : lireNombre(encaisse),
    note: note.trim(),
  });

  const entierValide = (texte: string | undefined) => {
    if (!texte || texte.trim() === "") return true;
    const n = lireNombre(texte);
    return Number.isInteger(n) && n >= 0;
  };

  /** Contrôle de l'étape en cours : un message d'erreur, ou "". */
  const erreurEtape = (): string => {
    if (etape === 0) {
      if (!moment || !Number.isFinite(depuisChampDateHeure(moment))) return "Indique la date et l'heure du passage.";
      // L'attendu est le stock actuel de la ferme : un passage daté avant le dernier fausserait le rapprochement
      if (precedent && horodatage() <= precedent.horodatage) return `Le passage doit être daté après le dernier, du ${quand(precedent.horodatage)}.`;
      const invalide = produits.find((a) => !entierValide(comptes[a.id]));
      if (invalide) return `${invalide.nom} : compte un nombre entier de sachets.`;
      const manquants = aCompter.filter((a) => !comptes[a.id] || comptes[a.id].trim() === "");
      if (manquants.length) return `Compte aussi ${manquants.map((a) => a.nom).join(", ")} : mets 0 s'il n'en reste plus.`;
    }
    if (etape === 1) {
      for (const a of produits) {
        if (!entierValide(retraits[a.id])) return `${a.nom} : nombre entier de sachets attendu.`;
        if ((lireNombre(retraits[a.id] || "") || 0) > compteDe(a)) return `${a.nom} : tu ne peux pas retirer plus de sachets que tu n'en as comptés.`;
      }
    }
    if (etape === 2) {
      for (const a of produits) {
        if (!entierValide(ajouts[a.id])) return `${a.nom} : nombre entier de sachets attendu.`;
        const q = lireNombre(ajouts[a.id] || "") || 0;
        if (q > disponible(a) + EPS) return `${a.nom} : il n'y a que ${quantite(a, disponible(a))} en route et à Marseille.`;
      }
    }
    if (etape === 3 && encaisse.trim() !== "") {
      const n = lireNombre(encaisse);
      if (!Number.isFinite(n) || n < 0) return "Montant encaissé invalide.";
    }
    return "";
  };

  /** Récapitulatif : le script calcule le passage sans rien écrire (aperçu). */
  const chargerApercu = async () => {
    setChargement(true);
    setApercu(null);
    try {
      setApercu(await appeler<ResultatPassage>("stock.passage", { ...charge(), apercu: true, idOperation: nouvelIdOperation() }));
      ecriture.refuser("");
    } catch (e) {
      if (e instanceof ErreurAtelier && e.statut === 401) sessionTerminee();
      ecriture.refuser(e instanceof Error ? e.message : "Récapitulatif impossible.");
    } finally {
      setChargement(false);
    }
  };

  const suivant = () => {
    const err = erreurEtape();
    if (err) return ecriture.refuser(err);
    ecriture.refuser("");
    if (etape === 3) chargerApercu();
    setEtape(etape + 1);
  };

  const valider = (e: FormEvent) => {
    e.preventDefault();
    if (etape < 4) return suivant();
    if (!apercu) return chargerApercu();
    ecriture.envoyer("stock.passage", charge());
  };

  const saisieProduits = (
    liste: Article[],
    valeurs: Record<string, string>,
    changer: (v: Record<string, string>) => void,
    max: (a: Article) => number | undefined,
    sousTitre: (a: Article) => string
  ) =>
    liste.length ? (
      <div className={`${CARTE} overflow-hidden`}>
        {liste.map((a) => (
          <div key={a.id} className="flex items-center gap-2.5 border-t border-[#E6DCC6] py-2 pl-3 pr-2 first:border-t-0">
            <Pastille article={a} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-base leading-tight">{a.nom}</div>
              {sousTitre(a) ? <div className="text-[12.5px] tabular-nums text-[#5E6A78]">{sousTitre(a)}</div> : null}
            </div>
            <PasAPas valeur={valeurs[a.id] || ""} onChange={(v) => changer({ ...valeurs, [a.id]: v })} entier max={max(a)} libelle={`Sachets de ${a.nom}`} />
          </div>
        ))}
      </div>
    ) : null;

  const comptes0 = produits.filter((a) => compteDe(a) > 0);
  const ajoutables = produits.filter((a) => disponible(a) > EPS);

  return (
    <Feuille
      titre="Passage à la ferme"
      pied={
        <>
          {ecriture.erreur ? (
            <p role="alert" className="mb-2.5 text-[14px] font-bold text-[#B1262E]">
              {ecriture.erreur}
            </p>
          ) : null}
          <div className="flex gap-2">
            {etape > 0 ? (
              <button type="button" className={BOUTON_SECONDAIRE} onClick={() => { ecriture.refuser(""); setEtape(etape - 1); }}>
                Précédent
              </button>
            ) : null}
            <button type="submit" form="f-passage" disabled={ecriture.envoi || chargement} className={`${BOUTON_PRINCIPAL} flex-1`}>
              {etape < 4 ? "Suivant" : ecriture.envoi ? "Enregistrement…" : ecriture.reseau ? "Réessayer" : "Valider le passage"}
            </button>
          </div>
        </>
      }
    >
      <div ref={haut} />
      <ol className="mb-5 flex gap-1" aria-label="Étapes">
        {ETAPES.map((nom, i) => (
          <li key={nom} className={`h-1.5 flex-1 rounded-full ${i <= etape ? "bg-[#163F6B]" : "bg-[#E6DCC6]"}`} aria-current={i === etape ? "step" : undefined}>
            <span className="sr-only">{nom}</span>
          </li>
        ))}
      </ol>
      <p className={`${ETIQUETTE} mb-3`}>
        Étape {etape + 1} sur {ETAPES.length} · {ETAPES[etape]}
      </p>
      <form id="f-passage" onSubmit={valider} noValidate className="flex flex-col gap-4">
        {etape === 0 ? (
          <>
            <Champ id="pa-moment" libelle="Date et heure du passage" aide="L'heure du moment ; change-la si tu saisis après coup.">
              <input id="pa-moment" type="datetime-local" value={moment} onChange={(e) => setMoment(e.target.value)} className={CHAMP} />
            </Champ>
            <p className="text-[14.5px]">Compte ce qui reste dans le congélateur, produit par produit, en sachets. Laisse vide un produit absent.</p>
            {saisieProduits(produits, comptes, setComptes, () => undefined, () => "")}
          </>
        ) : null}

        {etape === 1 ? (
          <>
            <p className="text-[14.5px]">Retire les sachets abîmés ou à date dépassée : ils sont enregistrés en perte.</p>
            {comptes0.length ? (
              saisieProduits(comptes0, retraits, setRetraits, (a) => compteDe(a), (a) => `${nombre(compteDe(a))} compté${compteDe(a) >= 2 ? "s" : ""}`)
            ) : (
              <p className={DISCRET}>Rien n'a été compté : rien à retirer.</p>
            )}
          </>
        ) : null}

        {etape === 2 ? (
          <>
            <p className="text-[14.5px]">Ajoute les sachets mis dans le congélateur : ils sont pris d'abord sur « En route », puis sur Marseille, lots à la DDM la plus proche. Les lots bloqués ne partent pas.</p>
            {ajoutables.length ? (
              saisieProduits(
                ajoutables,
                ajouts,
                setAjouts,
                (a) => disponible(a),
                (a) => `${nombre(stockLibre(etat, a.id, "route"))} en route · ${nombre(stockLibre(etat, a.id, "marseille"))} à Marseille`
              )
            ) : (
              <p className={DISCRET}>Rien de disponible en route ni à Marseille.</p>
            )}
          </>
        ) : null}

        {etape === 3 ? (
          <>
            <Champ id="pa-encaisse" libelle="Encaissé (€)" aide="L'argent remis par la caisse de la ferme pour la période. Laisse vide s'il n'est pas encore connu : tu le compléteras dans la fiche du passage.">
              <input id="pa-encaisse" inputMode="decimal" value={encaisse} onChange={(e) => setEncaisse(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="Ex. 100" className={CHAMP} />
            </Champ>
            <Champ id="pa-note" libelle="Note">
              <input id="pa-note" value={note} onChange={(e) => setNote(e.target.value)} autoComplete="off" className={CHAMP} />
            </Champ>
          </>
        ) : null}

        {etape === 4 ? (
          chargement ? (
            <Squelette lignes={3} />
          ) : apercu ? (
            <RecapPassage etat={etat} passage={apercu.passage} avertissements={apercu.avertissements} />
          ) : (
            <p className={DISCRET}>Le récapitulatif n'a pas pu être calculé : corrige les étapes précédentes, puis reviens ici.</p>
          )
        ) : null}
      </form>
    </Feuille>
  );
}

/** Détail par produit, puis chiffre d'affaires attendu, encaissé et écart. */
function RecapPassage({ etat, passage: p, avertissements }: { etat: Etat; passage: Passage; avertissements: string[] }) {
  return (
    <div className="grid gap-3">
      {avertissements.length ? (
        <div className="rounded-xl bg-[#FAEDCF] px-3 py-2.5 text-[14px] font-bold text-[#94600A]">
          {avertissements.map((a) => (
            <p key={a}>{a}</p>
          ))}
        </div>
      ) : null}
      <div className={`${CARTE} overflow-hidden`}>
        {p.lignes.map((l) => {
          const a = etat.articles.find((x) => x.id === l.article);
          return (
            <div key={l.article} className="grid gap-1 border-t border-[#E6DCC6] px-3 py-2.5 first:border-t-0">
              <div className="flex items-center gap-2">
                <Pastille article={a} />
                <span className="flex-1 font-display text-[16px]">{a ? a.nom : l.article}</span>
                <b className="tabular-nums">{euros(l.montant)}</b>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center text-[12.5px] tabular-nums">
                {[
                  ["Attendu", l.attendu],
                  ["Compté", l.compte],
                  ["Vendu", l.vendu],
                  ["Retiré", l.retire],
                  ["Ajouté", l.ajoute],
                ].map(([titre, q]) => (
                  <span key={titre as string} className="rounded-md bg-[#F3ECDD] px-1 py-1">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.04em] text-[#5E6A78]">{titre}</span>
                    <b className={titre === "Vendu" && (q as number) < 0 ? "text-[#94600A]" : ""}>{nombre(q as number)}</b>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <dl className={`${CARTE} grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 px-3.5 py-3 text-[15px] tabular-nums`}>
        <dt>Sachets vendus</dt>
        <dd className="text-right font-bold">{nombre(p.vendus)}</dd>
        <dt>Chiffre d'affaires attendu</dt>
        <dd className="text-right font-bold">{euros(p.attendu)}</dd>
        <dt>Encaissé</dt>
        <dd className="text-right font-bold">{p.encaisse === null ? "à compléter" : euros(p.encaisse)}</dd>
        <dt>Écart</dt>
        <dd className="text-right">
          <BadgeEcart ecart={p.ecart} />
        </dd>
      </dl>
    </div>
  );
}

/* ===================================================================
   FICHE D'UN PASSAGE : détail, encaissé modifiable, annulation
   =================================================================== */

export function FichePassage({ id }: { id: string }) {
  const { etat } = useAtelier();
  const p = etat.passages.find((x) => x.id === id);
  const [encaisse, setEncaisse] = useState(p && p.encaisse !== null ? String(p.encaisse).replace(".", ",") : "");
  const [confirmer, setConfirmer] = useState(false);
  const caisse = useEcriture(() => undefined);
  const annulation = useEcriture();
  const minuterie = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(minuterie.current), []);
  if (!p) return <Feuille titre="Passage">{<p className={DISCRET}>Passage introuvable ou annulé.</p>}</Feuille>;

  const enregistrerEncaisse = (e: FormEvent) => {
    e.preventDefault();
    const n = encaisse.trim() === "" ? null : lireNombre(encaisse);
    if (n !== null && (!Number.isFinite(n) || n < 0)) return caisse.refuser("Montant encaissé invalide.");
    caisse.envoyer("stock.encaissement", { passage: p.id, encaisse: n });
  };

  const annuler = () => {
    if (!confirmer) {
      setConfirmer(true);
      clearTimeout(minuterie.current);
      minuterie.current = setTimeout(() => setConfirmer(false), 5000);
      return;
    }
    clearTimeout(minuterie.current);
    setConfirmer(false);
    annulation.envoyer("stock.annuler", { operation: p.id });
  };

  return (
    <Feuille titre={`Passage du ${quand(p.horodatage)}`}>
      <p className={DISCRET}>{p.depuis ? `Période : depuis le passage du ${quand(p.depuis)}.` : "Premier passage."}</p>
      {p.note ? <p className="mt-1 text-[14px]">{p.note}</p> : null}
      <div className="mt-4">
        <RecapPassage etat={etat} passage={p} avertissements={p.lignes.filter((l) => l.vendu < 0).map((l) => `${etat.articles.find((a) => a.id === l.article)?.nom || l.article} : compte supérieur au stock attendu, vérifie le passage précédent.`)} />
      </div>
      <p className={`${DISCRET} mt-2`}>Écart cumulé depuis le premier passage : {euroSigne(p.ecartCumule || 0)}.</p>

      <form onSubmit={enregistrerEncaisse} noValidate className={`${CARTE} mt-6 grid gap-3 p-3.5`}>
        <Champ id="fp-encaisse" libelle="Encaissé (€)" aide={p.encaisseLe ? `Saisi le ${quand(p.encaisseLe)}.` : "Vide : à compléter."}>
          <input id="fp-encaisse" inputMode="decimal" value={encaisse} onChange={(e) => setEncaisse(e.target.value.replace(/[^\d.,]/g, ""))} className={CHAMP} />
        </Champ>
        {caisse.erreur ? (
          <p role="alert" className="text-[14px] font-bold text-[#B1262E]">
            {caisse.erreur}
          </p>
        ) : null}
        <button type="submit" disabled={caisse.envoi} className={BOUTON_SECONDAIRE}>
          {caisse.envoi ? "Enregistrement…" : caisse.reseau ? "Réessayer" : "Enregistrer l'encaissé"}
        </button>
      </form>

      <div className="mt-6 grid gap-2">
        {annulation.erreur ? (
          <p role="alert" className="text-[14px] font-bold text-[#B1262E]">
            {annulation.erreur}
          </p>
        ) : null}
        <button
          type="button"
          onClick={annuler}
          disabled={annulation.envoi}
          className={`${BOUTON} w-full border ${confirmer ? "border-[#B1262E] bg-[#B1262E] text-white" : "border-[#E6DCC6] bg-[#FFFCF6] text-[#B1262E]"}`}
        >
          {annulation.envoi ? "Annulation…" : confirmer ? "Confirmer l'annulation du passage" : "Annuler ce passage"}
        </button>
        <p className={DISCRET}>Toutes les lignes du passage sont annulées (ventes, pertes, ajouts), sans rien effacer.</p>
      </div>
    </Feuille>
  );
}
