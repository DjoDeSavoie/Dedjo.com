/* Vue Journal : opérations groupées par jour, recherche (n° de lot, article, note), filtre par type,
   annulation en deux temps (« Annuler », puis « Confirmer l'annulation » pendant 5 s). */

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { appeler, ErreurAtelier, nouvelIdOperation } from "./api";
import { useAtelier } from "./contexte";
import { Badge, BOUTON_SECONDAIRE, CARTE, CHAMP, DISCRET, Pastille, Puce, Squelette } from "./composants";
import { GENRES, heure, jourIso, jourLong, nombre, nomCourt, signe, unite } from "./outils";
import type { Etat, Operation, PageJournal, ResultatEcriture } from "./types";

const TEINTE_GENRE: Record<string, string> = {
  production: "bg-[#E0EFE4] text-[#2C7A4C]",
  reception: "bg-[#DCEBF6] text-[#1D6CA3]",
  sortie: "bg-[#EDE5D4] text-[#1A2B40]",
  envoi: "bg-[#E2E8F1] text-[#163F6B]",
  transfert: "bg-[#E2E8F1] text-[#163F6B]",
  inventaire: "bg-[#FAEDCF] text-[#94600A]",
  reprise: "bg-[#EDE5D4] text-[#5E6A78]",
  passage: "bg-[#E0EFE4] text-[#2C7A4C]",
  commande: "bg-[#DCEBF6] text-[#1D6CA3]",
};

export default function VueJournal() {
  const { sessionTerminee } = useAtelier();
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [genre, setGenre] = useState("");

  // Recherche lancée 300 ms après la dernière frappe
  useEffect(() => {
    const t = setTimeout(() => setRecherche(saisie.trim()), 300);
    return () => clearTimeout(t);
  }, [saisie]);

  const requete = useInfiniteQuery({
    queryKey: ["atelier", "journal", genre, recherche],
    queryFn: ({ pageParam }) => appeler<PageJournal>("stock.journal", { page: pageParam, parPage: 50, genre, recherche }),
    initialPageParam: 1,
    getNextPageParam: (derniere) => (derniere.page < derniere.pages ? derniere.page + 1 : undefined),
    retry: (n, e) => !(e instanceof ErreurAtelier && e.statut === 401) && n < 2,
  });
  const sessionFinie = requete.error instanceof ErreurAtelier && requete.error.statut === 401;
  useEffect(() => {
    if (sessionFinie) sessionTerminee();
  }, [sessionFinie, sessionTerminee]);

  const operations = requete.data ? requete.data.pages.flatMap((p) => p.operations) : [];
  // Regroupées par jour (le script les renvoie de la plus récente à la plus ancienne)
  const jours: { jour: string; ops: Operation[] }[] = [];
  operations.forEach((o) => {
    const j = jourIso(o.horodatage);
    const groupe = jours.find((x) => x.jour === j);
    if (groupe) groupe.ops.push(o);
    else jours.push({ jour: j, ops: [o] });
  });

  return (
    <>
      <div className="mt-3 grid gap-2">
        <input
          type="search"
          value={saisie}
          onChange={(e) => setSaisie(e.target.value)}
          placeholder="N° de lot, article, note…"
          enterKeyHint="search"
          autoComplete="off"
          aria-label="Rechercher dans le journal"
          className={CHAMP}
        />
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1" role="group" aria-label="Type d'opération">
          <Puce actif={genre === ""} onClick={() => setGenre("")}>
            Tout
          </Puce>
          {Object.entries(GENRES).map(([k, libelle]) => (
            <Puce key={k} actif={genre === k} onClick={() => setGenre(k)}>
              {libelle}
            </Puce>
          ))}
        </div>
      </div>

      {requete.isPending ? (
        <div className="mt-5">
          <Squelette lignes={4} />
        </div>
      ) : requete.isError && !operations.length ? (
        <p className={`${DISCRET} mt-5`}>{requete.error instanceof Error ? requete.error.message : "Journal indisponible."}</p>
      ) : !operations.length ? (
        recherche || genre ? (
          <p className={`${DISCRET} mt-5`}>Aucune opération ne correspond.</p>
        ) : (
          <div className="mt-7 grid justify-items-start gap-2.5 rounded-xl border border-dashed border-[#E6DCC6] p-5">
            <h2 className="font-display text-xl font-semibold text-[#163F6B]">Aucune opération pour l'instant</h2>
            <p className="text-[#5E6A78]">
              Chaque production, réception, sortie, transfert ou inventaire apparaîtra ici avec ses n° de lot. Une saisie erronée s'annule d'ici, sans rien effacer.
            </p>
          </div>
        )
      ) : (
        <>
          {jours.map(({ jour, ops }) => (
            <section key={jour}>
              <h3 className="mb-2 mt-6 font-display text-base font-semibold text-[#163F6B]">{jourLong(ops[0].horodatage)}</h3>
              <div className="grid gap-2">
                {ops.map((o) => (
                  <EntreeJournal key={o.operation} operation={o} />
                ))}
              </div>
            </section>
          ))}
          {requete.hasNextPage ? (
            <div className="mt-4">
              <button type="button" className={`${BOUTON_SECONDAIRE} w-full`} disabled={requete.isFetchingNextPage} onClick={() => requete.fetchNextPage()}>
                {requete.isFetchingNextPage ? "Chargement…" : "Voir plus"}
              </button>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

/** Lignes d'un transfert, regroupées par lot : « Marseille → Ferme », quantité déplacée. */
function deplacements(o: Operation) {
  const parLot = new Map<string, { lot: string; numero: string; article: string; de: string; vers: string; q: number; annule: boolean }>();
  o.lignes.forEach((l) => {
    const x = parLot.get(l.lot) || { lot: l.lot, numero: l.numero, article: l.article, de: "", vers: "", q: 0, annule: l.annule };
    if (l.quantite > 0) {
      x.q += l.quantite;
      x.vers = l.emplacement;
    } else x.de = l.emplacement;
    parLot.set(l.lot, x);
  });
  return Array.from(parLot.values());
}

function EntreeJournal({ operation: o }: { operation: Operation }) {
  const { etat, ouvrir, notifier, sessionTerminee, signalerReseau } = useAtelier();
  const client = useQueryClient();
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const minuterie = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(minuterie.current), []);

  const annuler = async () => {
    if (!confirmer) {
      setConfirmer(true);
      clearTimeout(minuterie.current);
      minuterie.current = setTimeout(() => setConfirmer(false), 5000);
      return;
    }
    clearTimeout(minuterie.current);
    setConfirmer(false);
    setEnvoi(true);
    try {
      const r = await appeler<ResultatEcriture>("stock.annuler", { operation: o.operation, idOperation: nouvelIdOperation() });
      signalerReseau(true);
      notifier(r.message);
      client.invalidateQueries({ queryKey: ["atelier"] });
    } catch (e) {
      if (e instanceof ErreurAtelier && e.statut === 401) sessionTerminee();
      if (e instanceof ErreurAtelier && e.reseau) signalerReseau(false);
      notifier(e instanceof Error ? e.message : "Annulation impossible.", true);
    } finally {
      setEnvoi(false);
    }
  };

  const transfert = o.genre === "transfert" || o.genre === "envoi";
  const lignes = transfert ? [] : o.lignes.filter((l) => !(o.genre === "production" && l.quantite < 0));
  const intrants = o.genre === "production" ? o.lignes.filter((l) => l.quantite < 0) : [];
  const trajets = transfert ? deplacements(o) : [];
  const ou = transfert
    ? trajets.length
      ? `${nomCourt(etat, trajets[0].de)} → ${nomCourt(etat, trajets[0].vers)}`
      : ""
    : Array.from(new Set(o.lignes.map((l) => nomCourt(etat, l.emplacement)))).join(", ");
  // Motif utile seulement s'il dit autre chose que le type (« Production », « Reprise »…)
  const note = [o.motif !== GENRES[o.genre] ? o.motif : "", o.note].filter((x, i, t) => x && t.indexOf(x) === i).join(" · ");

  return (
    <article className={`${CARTE} grid min-w-0 gap-2 px-3.5 py-3`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-md px-1.5 py-1 text-[10.5px] font-black uppercase leading-none tracking-[0.07em] ${TEINTE_GENRE[o.genre] || TEINTE_GENRE.sortie}`}>
          {GENRES[o.genre] || o.genre}
        </span>
        <span className="text-[14px] font-bold">{ou}</span>
        <span className="text-[13px] tabular-nums text-[#5E6A78]">{heure(o.horodatage)}</span>
      </div>
      <div className={o.annule ? "line-through opacity-55" : ""}>
        {transfert
          ? trajets.map((t) => <LigneEntree key={t.lot} etat={etat} article={t.article} lot={t.lot} numero={t.numero} quantite={t.q} signe={false} ouvrir={ouvrir} />)
          : lignes.map((l) => <LigneEntree key={l.id} etat={etat} article={l.article} lot={l.lot} numero={l.numero} quantite={l.quantite} signe ouvrir={ouvrir} />)}
        {intrants.length ? (
          <div className="mt-1 flex flex-wrap gap-x-3.5 gap-y-0.5 pl-4 text-[13px] tabular-nums text-[#5E6A78]">
            {intrants.map((l) => {
              const a = etat.articles.find((x) => x.id === l.article);
              return (
                <span key={l.id}>
                  {a ? a.nom : l.article} {signe(l.quantite)} {unite(a, l.quantite)}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
      {note || !o.annule ? (
        <div className="flex items-end justify-between gap-2.5">
          <span className="min-w-0 break-words text-[13.5px] text-[#5E6A78]">
            {note}
            {o.annule ? (
              <>
                {note ? " · " : ""}
                <Badge teinte="bad">Annulé</Badge>
              </>
            ) : null}
          </span>
          {!o.annule ? (
            <button
              type="button"
              onClick={annuler}
              disabled={envoi}
              className={`min-h-11 flex-none rounded-lg border px-3 text-[13px] font-bold ${
                confirmer ? "border-[#B1262E] bg-[#B1262E] text-white" : "border-[#E6DCC6] text-[#163F6B]"
              }`}
            >
              {envoi ? "Annulation…" : confirmer ? "Confirmer l'annulation" : "Annuler"}
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function LigneEntree({
  etat,
  article,
  lot,
  numero,
  quantite,
  signe: avecSigne,
  ouvrir,
}: {
  etat: Etat;
  article: string;
  lot: string;
  numero: string;
  quantite: number;
  signe: boolean;
  ouvrir: ReturnType<typeof useAtelier>["ouvrir"];
}) {
  const a = etat.articles.find((x) => x.id === article);
  return (
    <div className="flex items-baseline justify-between gap-2.5 text-[14.5px]">
      <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
        <Pastille article={a} petite />
        <span className="font-display text-[15.5px]">{a ? a.nom : article}</span>
        <button type="button" onClick={() => ouvrir({ type: "lot", id: lot })} className="min-h-8 font-mono text-[12.5px] text-[#5E6A78] underline decoration-[#E6DCC6] underline-offset-[3px]">
          {numero}
        </button>
      </span>
      <b className="whitespace-nowrap tabular-nums">
        {avecSigne ? signe(quantite) : nombre(quantite)} <span className="text-[13px] font-normal text-[#5E6A78]">{unite(a, quantite)}</span>
      </b>
    </div>
  );
}
