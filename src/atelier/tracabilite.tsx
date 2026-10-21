/* Traçabilité (lot 3 bis) : arbre amont, aval transitif, blocage des lots (avec propagation),
   écran Rappel et exports CSV (fiche d'un lot, rappel, registre). Les coordonnées des clients
   d'un rappel ne sont jamais gardées : la requête est oubliée dès que l'écran se ferme. */

import { FormEvent, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { appeler, ErreurAtelier } from "./api";
import { useAtelier, useEcriture } from "./contexte";
import {
  Badge,
  BOUTON_PRINCIPAL,
  BOUTON_SECONDAIRE,
  CARTE,
  Champ,
  CHAMP,
  ChoixPuces,
  DISCRET,
  ETIQUETTE,
  Feuille,
  Pastille,
  PiedFormulaire,
  Squelette,
} from "./composants";
import { exporterRappel, via } from "./exports";
import { dateCourte, EPS, jourIso, MOTIFS_BLOCAGE, nombre, nomCourt, quantite } from "./outils";
import type { Etat, FicheLot, LotAval, LotLie, NoeudAmont, Rappel } from "./types";

const TITRE = "mb-2 mt-6 font-display text-base font-semibold text-[#163F6B]";
const est401 = (e: unknown) => e instanceof ErreurAtelier && e.statut === 401;

/** Requête qui renvoie à l'écran du code si la session a expiré. */
function useSessionSurveillee(erreur: unknown) {
  const { sessionTerminee } = useAtelier();
  const fini = est401(erreur);
  useEffect(() => {
    if (fini) sessionTerminee();
  }, [fini, sessionTerminee]);
}

/** « Fab. 12 sept. 2026 · DDM 12 janv. 2027 · Moulin… » */
function dates(l: LotLie): string {
  const fabrique = l.categorie === "produit" || l.categorie === "preparation";
  return [
    l.fabrication ? `${fabrique ? "Fab." : "Reçu le"} ${dateCourte(l.fabrication)}` : "",
    l.ddm ? `${l.categorie === "produit" ? "DDM" : "limite"} ${dateCourte(l.ddm)}` : "",
    l.fournisseur,
  ]
    .filter(Boolean)
    .join(" · ");
}

/* ===================================================================
   AMONT ET AVAL
   =================================================================== */

/** Arbre des matières utilisées : chaque préparation se déplie sur ses propres intrants. */
export function ArbreAmont({ noeuds }: { noeuds: NoeudAmont[] }) {
  const { etat, ouvrir } = useAtelier();
  return (
    <ul className="grid gap-1.5">
      {noeuds.map((n) => {
        const a = etat.articles.find((x) => x.id === n.article);
        return (
          <li key={`${n.lot}-${n.niveau}`}>
            <button type="button" onClick={() => ouvrir({ type: "lot", id: n.lot })} className={`${CARTE} flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-[#F3ECDD]`}>
              <span className="mt-1.5">
                <Pastille article={a} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex flex-wrap items-center gap-1.5 font-display text-[16px] leading-tight">
                  {n.nom} {n.bloque ? <Badge teinte="bad">Bloqué</Badge> : null}
                </span>
                <span className="break-all font-mono text-[12.5px] text-[#5E6A78]">{n.numero}</span>
                <span className="text-[12.5px] text-[#5E6A78]">{dates(n)}</span>
              </span>
              <b className="whitespace-nowrap tabular-nums">{quantite(a, n.quantite)}</b>
            </button>
            {n.enfants.length ? (
              <div className="ml-3 mt-1.5 border-l-2 border-[#E6DCC6] pl-2.5">
                <ArbreAmont noeuds={n.enfants} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}


/** Lots fabriqués avec ce lot, directement ou via des préparations, avec leur stock. */
export function ListeAval({ lots }: { lots: LotAval[] }) {
  const { etat, ouvrir } = useAtelier();
  return (
    <div className={`${CARTE} overflow-hidden`}>
      {lots.map((x) => {
        const a = etat.articles.find((y) => y.id === x.article);
        const stock = Object.entries(x.quantites).filter(([, q]) => q > EPS);
        return (
          <button
            key={x.lot}
            type="button"
            onClick={() => ouvrir({ type: "lot", id: x.lot })}
            className="flex w-full items-start gap-2.5 border-t border-[#E6DCC6] px-3 py-2.5 text-left first:border-t-0 hover:bg-[#F3ECDD]"
          >
            <span className="mt-1.5">
              <Pastille article={a} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex flex-wrap items-center gap-1.5 font-display text-[16px] leading-tight">
                {x.nom} {x.bloque ? <Badge teinte="bad">Bloqué</Badge> : null}
              </span>
              <span className="break-all font-mono text-[12.5px] text-[#5E6A78]">{x.numero}</span>
              {x.via.length ? <span className="text-[12.5px] text-[#5E6A78]">{via(x)}</span> : null}
            </span>
            <span className="flex-none text-right text-[12.5px] leading-relaxed tabular-nums text-[#5E6A78]">
              {stock.length
                ? stock.map(([e, q]) => (
                    <span key={e} className="block">
                      {nomCourt(etat, e)} <b className="text-[#1A2B40]">{nombre(q)}</b>
                    </span>
                  ))
                : "épuisé"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ===================================================================
   BLOCAGE
   =================================================================== */

/**
 * Bloquer un lot (motif obligatoire), en proposant les lots en aval qui ont encore du stock, cochés
 * par défaut ; ou lever le blocage (note obligatoire, confirmation dans la page).
 * `tous` : lots concernés par un rappel, à bloquer ensemble.
 */
export function FormBlocage({ lot, decision, tous }: { lot: string; decision: "bloque" | "leve"; tous?: string[] }) {
  const { etat, retour } = useAtelier();
  const requete = useQuery({ queryKey: ["atelier", "lot", lot], queryFn: () => appeler<FicheLot>("stock.lot", { lot }), retry: (n, e) => !est401(e) && n < 2 });
  useSessionSurveillee(requete.error);
  const fiche = requete.data;
  const bloquer = decision === "bloque";
  const [motif, setMotif] = useState(tous ? "Rappel fournisseur" : MOTIFS_BLOCAGE[0]);
  const [note, setNote] = useState("");
  const [decoches, setDecoches] = useState<string[]>([]);
  const [confirmer, setConfirmer] = useState(false);
  const ecriture = useEcriture(() => retour());

  // Lots proposés en plus du lot lui-même : ceux du rappel, ou l'aval qui a encore du stock
  const proposes = (tous || (fiche ? fiche.aBloquer : [])).filter((id) => id !== lot);
  const lotsChoisis = [lot].concat(proposes.filter((id) => !decoches.includes(id)));
  const decrire = (id: string) => {
    const l = etat.lots.find((x) => x.id === id);
    const a = l ? etat.articles.find((x) => x.id === l.article) : undefined;
    const enAval = fiche ? fiche.aval.find((x) => x.lot === id) : undefined;
    return { l, a, via: enAval ? via(enAval) : "" };
  };
  const origine = decrire(lot);

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    if (!bloquer && !note.trim()) return ecriture.refuser("Indique pourquoi tu lèves le blocage.");
    if (!bloquer && !confirmer) return setConfirmer(true);
    ecriture.envoyer("stock.blocage", { lots: bloquer ? lotsChoisis : [lot], decision, motif, note: note.trim(), reference: lot });
  };

  const titre = bloquer ? (tous ? "Bloquer les lots concernés" : "Bloquer ce lot") : "Lever le blocage";
  const libelle = bloquer
    ? lotsChoisis.length > 1
      ? `Bloquer ${lotsChoisis.length} lots`
      : "Bloquer ce lot"
    : confirmer
      ? "Confirmer la levée du blocage"
      : "Lever le blocage";

  return (
    <Feuille titre={titre} pied={<PiedFormulaire formulaire="f-blocage" libelle={libelle} {...ecriture} />}>
      <form id="f-blocage" onSubmit={envoyer} noValidate className="flex flex-col gap-5">
        <p className="flex flex-wrap items-center gap-2 font-display text-[17px]">
          <Pastille article={origine.a} />
          {origine.a ? origine.a.nom : ""} · <span className="font-mono text-[15px]">{origine.l ? origine.l.numero : lot}</span>
        </p>
        {bloquer ? (
          <>
            <ChoixPuces legende="Motif" options={MOTIFS_BLOCAGE.map((m) => ({ valeur: m, libelle: m }))} valeur={motif} onChange={setMotif} />
            <p className={DISCRET}>
              Un lot bloqué ne part plus en vente, en envoi, en transfert, ni en production, et ne compte plus dans la disponibilité du site. Il reste possible de le sortir en « Perte » ou « Retour fournisseur ».
            </p>
            {!tous && !fiche ? (
              <Squelette lignes={1} />
            ) : proposes.length ? (
              <fieldset className="grid min-w-0 gap-2">
                <legend className={`${ETIQUETTE} mb-2`}>{tous ? "Lots concernés qui ont encore du stock" : "Bloquer aussi les lots en aval qui ont encore du stock"}</legend>
                <div className={`${CARTE} overflow-hidden`}>
                  {proposes.map((id) => {
                    const { l, a, via: chemin } = decrire(id);
                    const coche = !decoches.includes(id);
                    return (
                      <label key={id} className="flex min-h-11 cursor-pointer items-start gap-2.5 border-t border-[#E6DCC6] px-3 py-2.5 first:border-t-0">
                        <input
                          type="checkbox"
                          checked={coche}
                          onChange={() => setDecoches(coche ? decoches.concat(id) : decoches.filter((x) => x !== id))}
                          className="mt-0.5 h-5 w-5 flex-none accent-[#B1262E]"
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="font-display text-[16px] leading-tight">{a ? a.nom : ""}</span>
                          <span className="break-all font-mono text-[12.5px] text-[#5E6A78]">{l ? l.numero : id}</span>
                          {chemin ? <span className="text-[12.5px] text-[#5E6A78]">{chemin}</span> : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : (
              <p className={DISCRET}>Aucun lot en aval n'a encore de stock.</p>
            )}
          </>
        ) : null}
        <Champ id="b-note" libelle={bloquer ? "Note" : "Pourquoi lever le blocage ?"}>
          <input
            id="b-note"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setConfirmer(false);
            }}
            autoComplete="off"
            placeholder={bloquer ? "Ex. courrier du fournisseur du 19/10" : "Ex. analyse conforme"}
            className={CHAMP}
          />
        </Champ>
        {!bloquer && confirmer ? (
          <p className="rounded-xl bg-[#FAEDCF] px-3 py-2.5 text-[14px] font-bold text-[#94600A]">Le lot redeviendra utilisable partout. Confirme ci-dessous.</p>
        ) : null}
      </form>
    </Feuille>
  );
}

/* ===================================================================
   RAPPEL ET TRAÇABILITÉ
   =================================================================== */

function BoutonCopier({ texte, libelle }: { texte: string; libelle: string }) {
  const { notifier } = useAtelier();
  return (
    <button
      type="button"
      aria-label={`Copier ${libelle}`}
      onClick={() =>
        navigator.clipboard
          .writeText(texte)
          .then(() => notifier(`${libelle.charAt(0).toUpperCase()}${libelle.slice(1)} copié`))
          .catch(() => notifier("Copie impossible : sélectionne le texte à la main.", true))
      }
      className="grid h-11 w-11 flex-none place-items-center rounded-[10px] border border-[#E6DCC6] bg-[#FFFCF6] text-[#163F6B]"
    >
      <Copy className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

const STOCKS_RAPPEL = ["marseille", "route", "ferme"];

/** « 3 kg de Pâte levée feuilletée PL211026-1 » : quantité d'un lot, dans l'unité de son article. */
function quantiteDuLot(etat: Etat, lotId: string, q: number): string {
  const l = etat.lots.find((x) => x.id === lotId);
  const a = l ? etat.articles.find((x) => x.id === l.article) : undefined;
  return `${quantite(a, q)}${a && l ? ` de ${a.nom} ${l.numero}` : ""}`;
}

export function VueRappel({ lot }: { lot: string }) {
  const { etat, ouvrir } = useAtelier();
  // Jamais gardé : oublié dès que l'écran se ferme (coordonnées des clients)
  const requete = useQuery({
    queryKey: ["atelier", "rappel", lot],
    queryFn: () => appeler<Rappel>("stock.rappel", { lot }),
    gcTime: 0,
    staleTime: 0,
    retry: (n, e) => !est401(e) && n < 2,
  });
  useSessionSurveillee(requete.error);
  const r = requete.data;
  const aBloquer = r ? r.aval.filter((x) => !x.bloque && Object.values(x.quantites).some((q) => q > EPS)).map((x) => x.lot) : [];

  return (
    <Feuille
      titre="Rappel et traçabilité"
      pied={
        r ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!aBloquer.length}
              onClick={() => ouvrir({ type: "blocage", lot, decision: "bloque", tous: aBloquer })}
              className={`${BOUTON_PRINCIPAL} flex-1 bg-[#B1262E] hover:bg-[#981f26]`}
            >
              {aBloquer.length ? "Bloquer tous les lots concernés" : "Tous les lots sont bloqués ou épuisés"}
            </button>
            <button type="button" onClick={() => exporterRappel(r, etat)} className={BOUTON_SECONDAIRE}>
              CSV
            </button>
          </div>
        ) : undefined
      }
    >
      {!r ? (
        requete.isError ? (
          <p className={DISCRET}>{requete.error instanceof Error ? requete.error.message : "Rappel indisponible."}</p>
        ) : (
          <Squelette lignes={4} />
        )
      ) : (
        <>
          <p className="flex flex-wrap items-center gap-2 font-display text-xl">
            {r.lot.nom} · <span className="font-mono text-[16px]">{r.lot.numero}</span>
            {r.lot.bloque ? <Badge teinte="bad">Bloqué</Badge> : null}
          </p>
          <p className="mt-3 rounded-xl bg-[#163F6B] px-3.5 py-3 text-[15px] font-bold leading-snug text-[#FBF5E9]">{r.resume.texte}</p>

          <h3 className={TITRE}>Amont</h3>
          {r.amont.length ? (
            <ArbreAmont noeuds={r.amont} />
          ) : (
            <p className={DISCRET}>
              {r.lot.categorie === "produit" || r.lot.categorie === "preparation"
                ? "Aucune matière enregistrée pour ce lot : il n'est pas traçable en amont."
                : `Lot reçu${r.lot.fournisseur ? ` de ${r.lot.fournisseur}` : ""} : c'est le début de la chaîne.`}
            </p>
          )}

          <h3 className={TITRE}>Aval</h3>
          <div className="grid gap-2">
            {r.aval.map((x) => {
              const a = etat.articles.find((y) => y.id === x.article);
              const sorties = Object.entries(x.sorties);
              return (
                <div key={x.lot} className={`${CARTE} grid gap-1.5 px-3 py-2.5`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pastille article={a} />
                    <span className="font-display text-[16px]">{x.nom}</span>
                    <button type="button" onClick={() => ouvrir({ type: "lot", id: x.lot })} className="font-mono text-[12.5px] text-[#5E6A78] underline underline-offset-[3px]">
                      {x.numero}
                    </button>
                    {x.niveau === 0 ? <Badge teinte="info">Ce lot</Badge> : null}
                    {x.bloque ? <Badge teinte="bad">Bloqué</Badge> : null}
                  </div>
                  {x.via.length ? <p className="text-[12.5px] text-[#5E6A78]">{via(x)}</p> : null}
                  <p className="text-[13.5px] tabular-nums">
                    {x.niveau === 0 && x.categorie !== "produit" && x.categorie !== "preparation" ? "Reçu" : "Produit"} {quantite(a, x.entree)}
                    {x.niveau > 0 ? ` · avec ${quantiteDuLot(etat, x.depuis, x.quantiteUtilisee)}` : ""}
                  </p>
                  <p className="flex flex-wrap gap-x-3 text-[13.5px] tabular-nums">
                    {STOCKS_RAPPEL.map((e) => (
                      <span key={e}>
                        {nomCourt(etat, e)} <b>{nombre(x.quantites[e] || 0)}</b>
                      </span>
                    ))}
                  </p>
                  {sorties.length ? (
                    <p className="text-[13px] text-[#5E6A78]">
                      Sorties : {sorties.map(([motif, q]) => `${motif} ${nombre(q)}`).join(" · ")}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <h3 className={TITRE}>Clients livrés</h3>
          {r.clients.length ? (
            <div className="grid gap-2">
              {r.clients.map((c) => (
                <div key={c.commande} className={`${CARTE} grid gap-1.5 px-3 py-2.5`}>
                  <p className="font-bold">
                    {c.commande} · remise le {dateCourte(jourIso(c.remiseLe))} · {nombre(c.sachets)} sachet{c.sachets >= 2 ? "s" : ""}
                  </p>
                  <p className="select-text">
                    {c.prenom} {c.nom} <span className="text-[12.5px] text-[#5E6A78]">· lots {c.lots.join(", ")}</span>
                  </p>
                  {[
                    { texte: c.telephone, libelle: "téléphone" },
                    { texte: c.email, libelle: "e-mail" },
                  ]
                    .filter((x) => x.texte)
                    .map((x) => (
                      <div key={x.libelle} className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 select-all break-all font-mono text-[14px]">{x.texte}</span>
                        <BoutonCopier texte={x.texte} libelle={x.libelle} />
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <p className={DISCRET}>Aucune commande du site remise avec ces lots.</p>
          )}

          <h3 className={TITRE}>Ferme</h3>
          {r.ferme.length ? (
            <div className={`${CARTE} overflow-hidden`}>
              {r.ferme.map((f) => (
                <p key={f.passage} className="border-t border-[#E6DCC6] px-3 py-2.5 text-[14px] first:border-t-0">
                  <b>
                    {nombre(f.sachets)} sachet{f.sachets >= 2 ? "s" : ""}
                  </b>{" "}
                  vendu{f.sachets >= 2 ? "s" : ""} {f.libelle}
                  <span className="block text-[12.5px] text-[#5E6A78]">{f.lots.map((l) => `${l.numero} : ${nombre(l.sachets)}`).join(" · ")}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className={DISCRET}>Aucune vente constatée à la ferme pour ces lots.</p>
          )}
        </>
      )}
    </Feuille>
  );
}
