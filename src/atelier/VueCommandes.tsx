/* Vue Commandes (lot 5) : réservations ouvertes des commandes du site, remise au client ou annulation
   (§ 4.6), et statuts que voit le site public, à vérifier avant de mettre STOCK_ACTIF à « oui ». */

import { useEffect, useRef, useState } from "react";
import { useAtelier, useEcriture } from "./contexte";
import { Badge, BOUTON, BOUTON_PRINCIPAL, CARTE, ChoixPuces, DISCRET, ETIQUETTE, Feuille, Pastille, TITRE_SECTION } from "./composants";
import { articlesDe, heure, jourIso, dateCourte, EPS, nombre, quantite, stockLibre } from "./outils";
import type { Etat, Reservation, ResultatEcriture } from "./types";

const STATUTS: Record<string, { libelle: string; teinte: "ok" | "warn" | "mute" }> = {
  disponible: { libelle: "Disponible", teinte: "ok" },
  victime: { libelle: "Victime de son succès", teinte: "warn" },
  bientot: { libelle: "Bientôt disponible", teinte: "mute" },
};

const recue = (ms: number) => `${dateCourte(jourIso(ms))} à ${heure(ms)}`;
const sachets = (n: number) => `${nombre(n)} sachet${n >= 2 ? "s" : ""}`;
const nomArticle = (etat: Etat, id: string) => (etat.articles.find((a) => a.id === id) || { nom: id }).nom;

/* ===================================================================
   VUE COMMANDES
   =================================================================== */

export default function VueCommandes() {
  const { etat, ouvrir } = useAtelier();
  const ouvertes = etat.reservations.slice().sort((a, b) => a.horodatage - b.horodatage);
  const produits = articlesDe(etat, "produit", true).filter((a) => etat.statuts[a.id]);

  return (
    <>
      <section className="mt-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className={TITRE_SECTION}>Réservations ouvertes</h2>
          <span className="whitespace-nowrap text-[13px] font-bold tabular-nums text-[#5E6A78]">{nombre(ouvertes.length)}</span>
        </div>
        {ouvertes.length ? (
          <div className="grid gap-2">
            {ouvertes.map((r) => (
              <button key={r.commande} type="button" onClick={() => ouvrir({ type: "commande", id: r.commande })} className={`${CARTE} grid gap-1 px-3.5 py-3 text-left hover:border-[#163F6B]`}>
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="font-display text-[17px] font-semibold text-[#163F6B]">
                    {r.commande}
                    {r.prenom ? ` · ${r.prenom}` : ""}
                  </span>
                  <span className="text-[13px] font-bold tabular-nums">{sachets(r.produits.reduce((s, p) => s + p.sachets, 0))}</span>
                </span>
                {r.creneau || r.secteur ? <span className="text-[14px]">{[r.creneau, r.secteur].filter(Boolean).join(" · ")}</span> : null}
                <span className="text-[13px] text-[#5E6A78]">{r.produits.map((p) => `${nomArticle(etat, p.article)} × ${nombre(p.sachets)}`).join(" · ")}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className={DISCRET}>
            {etat.actif ? "Aucune réservation ouverte : chaque commande du site apparaîtra ici jusqu'à sa remise ou son annulation." : "Aucune réservation : tant que STOCK_ACTIF n'est pas à « oui », les commandes du site ne réservent rien."}
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className={`${TITRE_SECTION} mb-2`}>Sur le site</h2>
        <p className={`mb-3 rounded-xl px-3 py-2.5 text-[14px] font-bold ${etat.actif ? "bg-[#E0EFE4] text-[#2C7A4C]" : "bg-[#FAEDCF] text-[#94600A]"}`}>
          {etat.actif
            ? "Le site suit le stock de Marseille : chaque commande réserve ses sachets."
            : "STOCK_ACTIF n'est pas à « oui » : le site utilise encore la disponibilité écrite dans le code. Voici ce qu'il afficherait avec le stock ; vérifie-le avant d'activer."}
        </p>
        <div className={`${CARTE} overflow-hidden`}>
          {produits.map((a) => {
            const s = STATUTS[etat.statuts[a.id]] || STATUTS.bientot;
            const libres = etat.disponibles[a.id] || 0;
            return (
              <div key={a.id} className="flex items-center gap-3 border-t border-[#E6DCC6] px-3.5 py-2.5 first:border-t-0">
                <Pastille article={a} />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[16px]">{a.nom}</span>
                  <span className="block text-[12.5px] tabular-nums text-[#5E6A78]">
                    {libres > EPS ? `${sachets(libres)} commandable${libres >= 2 ? "s" : ""}` : "rien de commandable"}
                    {a.reserveHorsSite ? ` · réserve hors site ${nombre(a.reserveHorsSite)}` : ""}
                  </span>
                </span>
                <Badge teinte={s.teinte}>{s.libelle}</Badge>
              </div>
            );
          })}
        </div>
        <p className={`${DISCRET} mt-2`}>
          Commandable = stock de Marseille − réservations ouvertes − réserve hors site, sans les lots bloqués. Le site ne reçoit que le statut, jamais ces nombres.
        </p>
      </section>
    </>
  );
}

/* ===================================================================
   FICHE D'UNE COMMANDE : remise au client ou annulation
   =================================================================== */

export function FicheCommande({ id }: { id: string }) {
  const { etat, notifier, fermer } = useAtelier();
  const r: Reservation | undefined = etat.reservations.find((x) => x.commande === id);
  const [emplacement, setEmplacement] = useState("marseille");
  const [confirmer, setConfirmer] = useState(false);
  const remise = useEcriture((res: ResultatEcriture) => {
    if (res.livreeCochee === false) notifier(`${res.message}. Coche « Livrée » à la main dans le classeur des commandes.`, true);
    fermer();
  });
  const annulation = useEcriture();
  const minuterie = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(minuterie.current), []);
  if (!r) return <Feuille titre={`Commande ${id}`}>{<p className={DISCRET}>Plus de réservation ouverte pour cette commande.</p>}</Feuille>;

  const lieu = etat.emplacements.find((e) => e.id === emplacement);
  const manques = r.produits.filter((p) => stockLibre(etat, p.article, emplacement) + EPS < p.sachets);

  const annuler = () => {
    if (!confirmer) {
      setConfirmer(true);
      clearTimeout(minuterie.current);
      minuterie.current = setTimeout(() => setConfirmer(false), 5000);
      return;
    }
    clearTimeout(minuterie.current);
    setConfirmer(false);
    annulation.envoyer("stock.commande", { commande: r.commande, decision: "annulee" });
  };

  const erreur = remise.erreur || annulation.erreur;

  return (
    <Feuille
      titre={`Commande ${r.commande}`}
      pied={
        <>
          {erreur ? (
            <p role="alert" className="mb-2.5 text-[14px] font-bold text-[#B1262E]">
              {erreur}
            </p>
          ) : null}
          <button
            type="button"
            disabled={remise.envoi || annulation.envoi}
            onClick={() => remise.envoyer("stock.commande", { commande: r.commande, decision: "remise", emplacement })}
            className={`${BOUTON_PRINCIPAL} w-full`}
          >
            {remise.envoi ? "Enregistrement…" : remise.reseau ? "Réessayer la remise" : "Remise au client"}
          </button>
        </>
      }
    >
      <dl className={`${CARTE} grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 px-3.5 py-3 text-[15px]`}>
        <dt className={ETIQUETTE}>Prénom</dt>
        <dd>{r.prenom || "—"}</dd>
        <dt className={ETIQUETTE}>Secteur</dt>
        <dd>{r.secteur || "—"}</dd>
        <dt className={ETIQUETTE}>Créneau</dt>
        <dd>{r.creneau || "—"}</dd>
        <dt className={ETIQUETTE}>Reçue</dt>
        <dd>{recue(r.horodatage)}</dd>
      </dl>

      <h3 className={`${ETIQUETTE} mb-2 mt-5`}>Produits réservés</h3>
      <div className={`${CARTE} overflow-hidden`}>
        {r.produits.map((p) => {
          const a = etat.articles.find((x) => x.id === p.article);
          const libre = stockLibre(etat, p.article, emplacement);
          return (
            <div key={p.article} className="flex items-center gap-3 border-t border-[#E6DCC6] px-3.5 py-2.5 first:border-t-0">
              <Pastille article={a} />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[16px]">{a ? a.nom : p.article}</span>
                <span className={`block text-[12.5px] tabular-nums ${libre + EPS < p.sachets ? "font-bold text-[#B1262E]" : "text-[#5E6A78]"}`}>
                  {a ? quantite(a, libre) : nombre(libre)} {lieu ? `à ${lieu.nom}` : ""}
                </span>
              </span>
              <b className="tabular-nums">× {nombre(p.sachets)}</b>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <ChoixPuces
          legende="Sortir le stock depuis"
          options={etat.emplacements.filter((e) => e.id !== "route").map((e) => ({ valeur: e.id, libelle: e.court || e.nom }))}
          valeur={emplacement}
          onChange={(v) => {
            setEmplacement(v);
            remise.refuser("");
          }}
        />
        <p className={`${DISCRET} mt-2`}>
          {manques.length
            ? `Pas assez de ${manques.map((p) => nomArticle(etat, p.article)).join(", ")} ici : choisis un autre emplacement, ou saisis d'abord la production ou le transfert.`
            : `La remise sort les sachets, lots à la DDM la plus proche, motif « Commande ${r.commande} », et coche « Livrée » dans le classeur des commandes.`}
        </p>
      </div>

      <div className="mt-8 grid gap-2">
        <button
          type="button"
          onClick={annuler}
          disabled={remise.envoi || annulation.envoi}
          className={`${BOUTON} w-full border ${confirmer ? "border-[#B1262E] bg-[#B1262E] text-white" : "border-[#E6DCC6] bg-[#FFFCF6] text-[#B1262E]"}`}
        >
          {annulation.envoi ? "Annulation…" : confirmer ? "Confirmer : libérer les sachets" : "Commande annulée"}
        </button>
        <p className={DISCRET}>Les sachets réservés redeviennent commandables sur le site. Rien n'est sorti du stock.</p>
      </div>
    </Feuille>
  );
}
