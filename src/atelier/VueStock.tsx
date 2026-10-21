/* Vue Stock : filtre par emplacement, alertes, stock par produit ; fiches article et lot.
   Lot 6 : un produit à renflouer porte le lien « Planifier une production ». */

import { Fragment, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { appeler, ErreurAtelier } from "./api";
import { useAtelier } from "./contexte";
import {
  Badge,
  BOUTON_PRINCIPAL,
  BOUTON_SECONDAIRE,
  CARTE,
  DISCRET,
  ETIQUETTE,
  Feuille,
  LIGNE,
  Pastille,
  Squelette,
  TITRE_SECTION,
} from "./composants";
import {
  alertes,
  articlesDe,
  CATEGORIES,
  dateCourte,
  EPS,
  estBloque,
  etatDdm,
  Filtre,
  heure,
  GENRES,
  jourIso,
  lotsDe,
  nombre,
  nomCourt,
  ordreSortie,
  qteLot,
  quantite,
  seuil,
  signe,
  stockArticle,
  unite,
} from "./outils";
import type { Article, FicheLot as DonneesFicheLot, Lot } from "./types";
import { exporterFicheLot } from "./exports";
import { ArbreAmont, ListeAval } from "./tracabilite";
import { estARenflouer, useProduction } from "./production";

export default function VueStock() {
  const { etat, filtre, ouvrir, allerA } = useAtelier();
  const { reglages } = useProduction();
  const [alertesSeules, setAlertesSeules] = useState(false);
  const al = alertes(etat, filtre);
  const nb = al.depassees + al.proches + al.sousSeuil.size;

  return (
    <>
      <div className="mt-3">
        {!nb ? (
          <p className="flex items-center gap-2 text-[14px] text-[#5E6A78]">
            <span className="h-2 w-2 flex-none rounded-full bg-[#2C7A4C]" aria-hidden="true" />
            Tout est au-dessus des seuils et aucune DDM n'approche.
          </p>
        ) : (
          <button
            type="button"
            aria-pressed={alertesSeules}
            onClick={() => setAlertesSeules(!alertesSeules)}
            className={`${CARTE} flex min-h-11 w-full flex-wrap items-center gap-1.5 px-3 py-2.5 text-left ${alertesSeules ? "border-[#163F6B] ring-1 ring-[#163F6B]" : ""}`}
          >
            {al.depassees ? <Badge teinte="bad">{al.depassees} lot{al.depassees > 1 ? "s" : ""} à date dépassée</Badge> : null}
            {al.proches ? <Badge teinte="warn">{al.proches} lot{al.proches > 1 ? "s" : ""} à moins de 30 j</Badge> : null}
            {al.sousSeuil.size ? <Badge teinte="warn">{al.sousSeuil.size} sous le seuil</Badge> : null}
            <span className="ml-auto text-[13px] font-bold text-[#163F6B]">{alertesSeules ? "Tout afficher" : "Voir les alertes"}</span>
          </button>
        )}
      </div>

      {CATEGORIES.map((c) => {
        let articles = articlesDe(etat, c.id, true).filter((a) => a.actif || stockArticle(etat, a.id, "tout") > EPS);
        if (alertesSeules) articles = articles.filter((a) => al.sousSeuil.has(a.id) || al.ddm.has(a.id));
        if (!articles.length) return null;
        let resume: string;
        if (c.id === "produit") {
          const total = articles.reduce((s, a) => s + stockArticle(etat, a.id, filtre), 0);
          resume = `${nombre(total)} sachet${total >= 2 ? "s" : ""}`;
        } else {
          resume = `${articles.filter((a) => stockArticle(etat, a.id, filtre) > EPS).length} en stock sur ${articles.length}`;
        }
        return (
          <section key={c.id} className="mt-6">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 className={TITRE_SECTION}>{c.nom}</h2>
              <span className="whitespace-nowrap text-[13px] font-bold tabular-nums text-[#5E6A78]">{resume}</span>
            </div>
            <div className={`${CARTE} overflow-hidden`}>
              {articles.map((a) => (
                <Fragment key={a.id}>
                  <LigneArticle article={a} filtre={filtre} sousSeuil={al.sousSeuil.has(a.id)} ddm={al.ddm.get(a.id)} onClick={() => ouvrir({ type: "article", id: a.id })} />
                  {reglages && a.categorie === "produit" && a.actif && estARenflouer(etat, a, reglages) ? (
                    <div className="-mt-2 pb-2 pl-[38px] pr-3.5">
                      <button type="button" className="min-h-9 text-[13.5px] font-bold text-[#163F6B] underline underline-offset-4" onClick={() => allerA("production")}>
                        Planifier une production
                      </button>
                    </div>
                  ) : null}
                </Fragment>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

function LigneArticle({ article: a, filtre, sousSeuil, ddm, onClick }: { article: Article; filtre: Filtre; sousSeuil: boolean; ddm?: "bad" | "warn"; onClick: () => void }) {
  const { etat } = useAtelier();
  const q = stockArticle(etat, a.id, filtre);
  const lotsIci = lotsDe(etat, a.id, filtre);
  const nbLots = lotsIci.length;
  const nbBloques = lotsIci.filter((l) => estBloque(etat, l.id)).length;
  const meta = [a.categorie === "produit" && a.piecesParSachet ? `${a.piecesParSachet} pièces / sachet` : "", nbLots ? `${nbLots} lot${nbLots > 1 ? "s" : ""}` : "aucun lot"].filter(Boolean);
  const repartition =
    filtre === "tout"
      ? etat.emplacements.map((e) => ({ e, q: stockArticle(etat, a.id, e.id) })).filter((x) => x.q > EPS)
      : [];
  return (
    <button type="button" onClick={onClick} className={`${LIGNE} hover:bg-[#F3ECDD]`}>
      <span className="mt-1.5">
        <Pastille article={a} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-display text-[17px] font-medium leading-tight">{a.nom}</span>
        <span className={`${DISCRET} mt-0.5`}>{meta.join(" · ")}</span>
        {repartition.length ? (
          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] tabular-nums text-[#5E6A78]">
            {repartition.map((x) => (
              <span key={x.e.id}>
                {x.e.court} <b className="text-[#1A2B40]">{nombre(x.q)}</b>
              </span>
            ))}
          </span>
        ) : null}
        {sousSeuil || ddm || !a.actif || nbBloques ? (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {nbBloques ? <Badge teinte="bad">{nbBloques > 1 ? `${nbBloques} lots bloqués` : "Lot bloqué"}</Badge> : null}
            {sousSeuil ? <Badge teinte="warn">Sous le seuil</Badge> : null}
            {ddm ? <Badge teinte={ddm}>{a.categorie === "produit" ? "DDM" : "Date"} {ddm === "bad" ? "dépassée" : "proche"}</Badge> : null}
            {!a.actif ? <Badge teinte="mute">Masqué</Badge> : null}
          </span>
        ) : null}
      </span>
      <span className="mt-0.5 min-w-14 flex-none text-right tabular-nums">
        <b className={`block text-[21px] leading-none ${q > EPS ? "font-black" : "font-normal text-[#5E6A78]"}`}>{nombre(q)}</b>
        <span className="text-[12px] text-[#5E6A78]">{unite(a, q)}</span>
      </span>
    </button>
  );
}

/** Ligne d'un lot : n°, dates, DDM et quantités par emplacement. */
export function LigneLot({ lot, onClick }: { lot: Lot; onClick: () => void }) {
  const { etat } = useAtelier();
  const produit = lot.categorie === "produit";
  const fabrique = produit || lot.categorie === "preparation";
  const ddm = qteLot(lot, "tout") > EPS ? etatDdm(lot) : null;
  const bloque = estBloque(etat, lot.id);
  const parts = Object.entries(lot.quantites).filter(([, q]) => q > EPS);
  return (
    <button type="button" onClick={onClick} className={`${LIGNE} hover:bg-[#F3ECDD]`}>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-mono text-[14.5px] font-bold">{lot.numero}</span>
        <span className={`${DISCRET} mt-0.5`}>
          {fabrique ? "Fab." : "Reçu le"} {dateCourte(lot.fabrication)}
          {lot.ddm ? ` · ${produit ? "DDM" : "limite"} ${dateCourte(lot.ddm)}` : ""}
          {lot.fournisseur ? ` · ${lot.fournisseur}` : ""}
        </span>
        {ddm || bloque ? (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {bloque ? <Badge teinte="bad">Bloqué</Badge> : null}
            {ddm ? <Badge teinte={ddm.k}>{ddm.texte}</Badge> : null}
          </span>
        ) : null}
      </span>
      <span className="flex-none text-right text-[12.5px] leading-relaxed tabular-nums text-[#5E6A78]">
        {parts.length
          ? parts.map(([e, q]) => (
              <span key={e} className="block">
                {nomCourt(etat, e)} <b className="text-[#1A2B40]">{nombre(q)}</b>
              </span>
            ))
          : "épuisé"}
      </span>
    </button>
  );
}

/* ---------- Fiche article ---------- */

export function FicheArticle({ id }: { id: string }) {
  const { etat, ouvrir } = useAtelier();
  const a = etat.articles.find((x) => x.id === id);
  if (!a) return <Feuille titre="Article">{<p className={DISCRET}>Article introuvable.</p>}</Feuille>;
  const enStock = lotsDe(etat, a.id, "tout");
  const epuises = etat.lots
    .filter((l) => l.article === a.id && qteLot(l, "tout") <= EPS)
    .sort((x, y) => (y.creeLe || 0) - (x.creeLe || 0) || ordreSortie(y, x))
    .slice(0, 5);
  const total = stockArticle(etat, a.id, "tout");
  const produit = a.categorie === "produit";
  const fabrique = produit || a.categorie === "preparation";
  const recette = etat.recettes[a.id];

  return (
    <Feuille
      titre={a.nom}
      pied={
        <div className="flex gap-2">
          <button
            type="button"
            className={`${BOUTON_PRINCIPAL} flex-1`}
            onClick={() => ouvrir(fabrique ? { type: "production", article: a.id } : { type: "reception", article: a.id })}
          >
            {fabrique ? "Nouvelle production" : "Nouvelle réception"}
          </button>
          <button type="button" className={BOUTON_SECONDAIRE} onClick={() => ouvrir({ type: "articleEdition", id: a.id })}>
            Modifier
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
        {etat.emplacements.map((e) => {
          const q = stockArticle(etat, a.id, e.id);
          const s = seuil(a, e.id);
          const bas = s > 0 && q < s;
          return (
            <div key={e.id} className={`rounded-xl border px-3 py-2.5 ${bas ? "border-[#94600A] bg-[#FAEDCF]" : "border-[#E6DCC6] bg-[#FFFCF6]"}`}>
              <div className={ETIQUETTE}>{e.court}</div>
              <div className="mt-1 text-[14px] tabular-nums text-[#5E6A78]">
                <b className="text-[23px] font-black text-[#1A2B40]">{nombre(q)}</b> {unite(a, q)}
              </div>
              <div className="text-[12px] text-[#5E6A78]">{s > 0 ? `seuil ${nombre(s)}` : "sans seuil"}</div>
            </div>
          );
        })}
      </div>
      {produit && a.piecesParSachet ? (
        <p className={`${DISCRET} mt-2.5`}>
          Soit {nombre(total * a.piecesParSachet)} pièces au total, en sachets de {a.piecesParSachet}.
        </p>
      ) : null}
      {fabrique ? (
        <>
          <h3 className="mb-2 mt-6 font-display text-base font-semibold text-[#163F6B]">Recette</h3>
          {recette ? (
            <p className="text-[14px]">
              Pour {quantite(a, recette.rendement)} :{" "}
              {recette.composants
                .map((c) => {
                  const m = etat.articles.find((x) => x.id === c.article);
                  return `${m ? m.nom : c.article} ${quantite(m, c.quantite)}`;
                })
                .join(" · ")}
            </p>
          ) : (
            <p className={DISCRET}>Pas encore de recette : ajoute-la avec « Modifier ».</p>
          )}
        </>
      ) : null}
      <h3 className="mb-2 mt-6 font-display text-base font-semibold text-[#163F6B]">Lots en stock</h3>
      {enStock.length ? (
        <div className={`${CARTE} overflow-hidden`}>
          {enStock.map((l) => (
            <LigneLot key={l.id} lot={l} onClick={() => ouvrir({ type: "lot", id: l.id })} />
          ))}
        </div>
      ) : (
        <p className={DISCRET}>Aucun lot en stock.</p>
      )}
      {epuises.length ? (
        <>
          <h3 className="mb-2 mt-6 font-display text-base font-semibold text-[#163F6B]">Derniers lots épuisés</h3>
          <div className={`${CARTE} overflow-hidden opacity-75`}>
            {epuises.map((l) => (
              <LigneLot key={l.id} lot={l} onClick={() => ouvrir({ type: "lot", id: l.id })} />
            ))}
          </div>
        </>
      ) : null}
    </Feuille>
  );
}

/* ---------- Fiche lot ---------- */

export function FicheLot({ id }: { id: string }) {
  const { etat, ouvrir, sessionTerminee } = useAtelier();
  const requete = useQuery({
    queryKey: ["atelier", "lot", id],
    queryFn: () => appeler<DonneesFicheLot>("stock.lot", { lot: id }),
    retry: (n, e) => !(e instanceof ErreurAtelier && e.statut === 401) && n < 2,
  });
  const fiche = requete.data;
  const sessionFinie = requete.error instanceof ErreurAtelier && requete.error.statut === 401;
  useEffect(() => {
    if (sessionFinie) sessionTerminee();
  }, [sessionFinie, sessionTerminee]);
  const lot = fiche ? fiche.lot : etat.lots.find((l) => l.id === id);
  const a = lot ? etat.articles.find((x) => x.id === lot.article) : undefined;
  const produit = lot ? lot.categorie === "produit" : false;
  const fabrique = produit || (!!lot && lot.categorie === "preparation");
  const restant = lot ? qteLot(lot, "tout") : 0;
  const ddm = lot && restant > EPS ? etatDdm(lot) : null;
  const bloque = fiche ? fiche.lot.bloque : !!lot && estBloque(etat, lot.id);

  return (
    <Feuille
      titre={lot ? `Lot ${lot.numero}` : "Lot"}
      pied={
        lot && restant > EPS ? (
          <div className="flex gap-2">
            <button type="button" className={`${BOUTON_SECONDAIRE} flex-1`} onClick={() => ouvrir({ type: "lotAction", id: lot.id, mode: "sortie" })}>
              Sortie de ce lot
            </button>
            <button type="button" className={`${BOUTON_SECONDAIRE} flex-1`} onClick={() => ouvrir({ type: "lotAction", id: lot.id, mode: "transfert" })}>
              Transférer ce lot
            </button>
          </div>
        ) : undefined
      }
    >
      {!lot ? (
        requete.isError ? (
          <p className={DISCRET}>{requete.error instanceof Error ? requete.error.message : "Lot introuvable."}</p>
        ) : (
          <Squelette lignes={2} />
        )
      ) : (
        <>
          <p className="flex flex-wrap items-center gap-2.5 font-display text-xl">
            <Pastille article={a} />
            {a ? a.nom : lot.article}
            {bloque ? <Badge teinte="bad">Bloqué</Badge> : null}
            {fiche && fiche.lot.sansMatieres ? <Badge teinte="warn">Matières non renseignées</Badge> : null}
          </p>
          {fiche && fiche.lot.blocage ? (
            <p className="mt-2.5 rounded-xl bg-[#F7E0E0] px-3 py-2.5 text-[14px] text-[#B1262E]">
              <b>Bloqué · {fiche.lot.blocage.motif}</b> depuis le {dateCourte(jourIso(fiche.lot.blocage.horodatage))}
              {fiche.lot.blocage.note ? ` · ${fiche.lot.blocage.note}` : ""}
            </p>
          ) : null}
          <dl className="mt-3.5 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-[14px]">
            <dt className="text-[#5E6A78]">N° de lot</dt>
            <dd className="break-all font-mono font-bold">{lot.numero}</dd>
            <dt className="text-[#5E6A78]">{fabrique ? "Fabrication" : "Réception"}</dt>
            <dd className="font-bold">{dateCourte(lot.fabrication)}</dd>
            <dt className="text-[#5E6A78]">{produit ? "DDM" : "Date limite"}</dt>
            <dd className="font-bold">
              {lot.ddm ? dateCourte(lot.ddm) : "—"} {ddm ? <Badge teinte={ddm.k}>{ddm.texte}</Badge> : null}
            </dd>
            {lot.fournisseur ? (
              <>
                <dt className="text-[#5E6A78]">Fournisseur</dt>
                <dd className="font-bold">{lot.fournisseur}</dd>
              </>
            ) : null}
          </dl>

          <h3 className="mb-2 mt-6 font-display text-base font-semibold text-[#163F6B]">En stock</h3>
          {restant > EPS ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
              {Object.entries(lot.quantites)
                .filter(([, q]) => q > EPS)
                .map(([e, q]) => (
                  <div key={e} className="rounded-xl border border-[#E6DCC6] bg-[#FFFCF6] px-3 py-2.5">
                    <div className={ETIQUETTE}>{nomCourt(etat, e)}</div>
                    <div className="mt-1 text-[14px] tabular-nums text-[#5E6A78]">
                      <b className="text-[23px] font-black text-[#1A2B40]">{nombre(q)}</b> {unite(a, q)}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className={DISCRET}>Lot épuisé.</p>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`${BOUTON_SECONDAIRE} ${bloque ? "" : "border-[#B1262E] text-[#B1262E]"}`}
              onClick={() => ouvrir({ type: "blocage", lot: lot.id, decision: bloque ? "leve" : "bloque" })}
            >
              {bloque ? "Lever le blocage" : "Bloquer ce lot"}
            </button>
            <button type="button" className={BOUTON_SECONDAIRE} onClick={() => ouvrir({ type: "rappel", lot: lot.id })}>
              Rappel et traçabilité
            </button>
            <button type="button" className={`${BOUTON_SECONDAIRE} col-span-2`} disabled={!fiche} onClick={() => fiche && exporterFicheLot(fiche, etat)}>
              Fiche de traçabilité (CSV)
            </button>
          </div>

          {fabrique ? (
            <>
              <h3 className="mb-2 mt-6 font-display text-base font-semibold text-[#163F6B]">Matières utilisées</h3>
              {!fiche ? (
                <Squelette lignes={2} />
              ) : fiche.amont.length ? (
                <ArbreAmont noeuds={fiche.amont} />
              ) : (
                <p className={DISCRET}>Aucune matière enregistrée avec cette production : ce lot n'est pas traçable.</p>
              )}
            </>
          ) : null}
          {!produit ? (
            <>
              <h3 className="mb-2 mt-6 font-display text-base font-semibold text-[#163F6B]">Utilisé dans</h3>
              {!fiche ? (
                <Squelette lignes={2} />
              ) : fiche.aval.length ? (
                <ListeAval lots={fiche.aval} />
              ) : (
                <p className={DISCRET}>Aucune production enregistrée avec ce lot.</p>
              )}
            </>
          ) : null}

          <h3 className="mb-2 mt-6 font-display text-base font-semibold text-[#163F6B]">Historique</h3>
          {!fiche ? (
            <Squelette lignes={2} />
          ) : (
            <ol className={`${CARTE} overflow-hidden`}>
              {fiche.historique.map((h, i) => (
                <li key={`${h.operation}-${i}`} className={`grid grid-cols-[1fr_auto_auto] items-baseline gap-x-3 gap-y-0.5 border-t border-[#E6DCC6] px-3 py-2.5 text-[14px] first:border-t-0`}>
                  <span className="col-span-3 text-[12px] text-[#5E6A78]">
                    {dateCourte(jourIso(h.horodatage))} · {heure(h.horodatage)}
                  </span>
                  <span className={`min-w-0 ${h.annule ? "line-through opacity-55" : ""}`}>
                    {GENRES[h.type] || h.type}
                    {h.motif && h.motif !== GENRES[h.type] ? ` · ${h.motif}` : ""}
                    {h.note ? <span className="block text-[#5E6A78]">{h.note}</span> : null}
                    {h.annule ? <span className="ml-1 no-underline"> <Badge teinte="mute">Annulé</Badge></span> : null}
                  </span>
                  <span className="text-[13px] text-[#5E6A78]">{nomCourt(etat, h.emplacement)}</span>
                  <b className={`tabular-nums ${h.annule ? "line-through opacity-55" : ""}`}>{signe(h.quantite)}</b>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </Feuille>
  );
}
