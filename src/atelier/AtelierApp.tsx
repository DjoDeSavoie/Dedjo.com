/* L'Atelier : gestion du stock de Dedjo, pensée pour le téléphone d'abord.
   En-tête (vue, synchro, Réglages), vue courante, barre du bas (Stock · Saisir · Ferme · Commandes ·
   Journal), feuilles qui montent pour les fiches et les saisies. */

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Layers, Plus, Settings, ShoppingBag, Tractor, WifiOff } from "lucide-react";
import { appeler, ErreurAtelier } from "./api";
import { Contexte, ContexteAtelier, NiveauFeuille } from "./contexte";
import { BOUTON_PRINCIPAL, BOUTON_SECONDAIRE, CARTE, DISCRET, Puce, Squelette } from "./composants";
import type { Filtre } from "./outils";
import type { Etat, Feuille } from "./types";
import Connexion from "./Connexion";
import VueStock, { FicheArticle, FicheLot } from "./VueStock";
import VueSaisir, { FormInventaire, FormLignes, FormLot, FormProduction, FormReception } from "./saisies";
import VueJournal from "./VueJournal";
import VueReglages, { FormArticle, FormEmplacement } from "./VueReglages";
import { FormBlocage, VueRappel } from "./tracabilite";

type Vue = "stock" | "saisir" | "ferme" | "commandes" | "journal" | "reglages";

const TITRES: Record<Vue, string> = {
  stock: "Stock",
  saisir: "Saisir",
  ferme: "Ferme",
  commandes: "Commandes",
  journal: "Journal",
  reglages: "Réglages",
};

const BARRE: { vue: Vue; libelle: string; icone: ReactNode }[] = [
  { vue: "stock", libelle: "Stock", icone: <Layers /> },
  { vue: "saisir", libelle: "Saisir", icone: <Plus strokeWidth={2.6} /> },
  { vue: "ferme", libelle: "Ferme", icone: <Tractor /> },
  { vue: "commandes", libelle: "Commandes", icone: <ShoppingBag /> },
  { vue: "journal", libelle: "Journal", icone: <ClipboardList /> },
];

const est401 = (e: unknown) => e instanceof ErreurAtelier && e.statut === 401;

export default function AtelierApp() {
  const client = useQueryClient();
  const [connecte, setConnecte] = useState(true);
  const [vue, setVue] = useState<Vue>("stock");
  const [filtre, setFiltre] = useState<Filtre>("tout");
  // Pile des feuilles ouvertes ; `n` : clé stable de chaque feuille
  const [pile, setPile] = useState<{ f: Feuille; n: number }[]>([]);
  const compteurFeuilles = useRef(0);
  const [message, setMessage] = useState<{ texte: string; erreur: boolean; n: number } | null>(null);
  const [enLigne, setEnLigne] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const minuterie = useRef<ReturnType<typeof setTimeout>>();

  const requete = useQuery({
    queryKey: ["atelier", "etat"],
    queryFn: () => appeler<Etat>("stock.etat"),
    enabled: connecte,
    staleTime: 30_000,
    retry: (n, e) => !est401(e) && n < 2,
  });

  const sessionTerminee = useCallback(() => {
    setConnecte(false);
    setPile([]);
    client.removeQueries({ queryKey: ["atelier"] });
  }, [client]);

  useEffect(() => {
    if (est401(requete.error)) sessionTerminee();
  }, [requete.error, sessionTerminee]);

  // Bandeau « Hors ligne » : état du navigateur, et échecs réseau des appels
  useEffect(() => {
    const enLigneOui = () => setEnLigne(true);
    const enLigneNon = () => setEnLigne(false);
    window.addEventListener("online", enLigneOui);
    window.addEventListener("offline", enLigneNon);
    return () => {
      window.removeEventListener("online", enLigneOui);
      window.removeEventListener("offline", enLigneNon);
    };
  }, []);
  useEffect(() => {
    if (requete.isSuccess && !requete.isFetching) setEnLigne(true);
  }, [requete.isSuccess, requete.isFetching, requete.dataUpdatedAt]);

  // Pas de défilement de la page sous une feuille ouverte
  useEffect(() => {
    document.documentElement.style.overflow = pile.length ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [pile.length]);

  const notifier = useCallback((texte: string, erreur = false) => {
    clearTimeout(minuterie.current);
    setMessage((m) => ({ texte, erreur, n: (m ? m.n : 0) + 1 }));
    minuterie.current = setTimeout(() => setMessage(null), erreur ? 6500 : 3200);
  }, []);
  useEffect(() => () => clearTimeout(minuterie.current), []);

  const ouvrir = useCallback((f: Feuille) => setPile((p) => [...p, { f, n: ++compteurFeuilles.current }]), []);
  const retour = useCallback(() => setPile((p) => p.slice(0, -1)), []);
  const fermer = useCallback(() => setPile([]), []);
  const signalerReseau = useCallback((ok: boolean) => setEnLigne(ok), []);

  const etat = requete.data;
  const valeur = useMemo<ContexteAtelier | null>(
    () =>
      etat
        ? { etat, filtre, ouvrir, retour, fermer, profondeur: pile.length, notifier, sessionTerminee, signalerReseau }
        : null,
    [etat, filtre, ouvrir, retour, fermer, pile.length, notifier, sessionTerminee, signalerReseau]
  );

  const allerA = (v: Vue) => {
    setVue(v);
    window.scrollTo(0, 0);
  };

  if (!connecte) {
    return (
      <Connexion
        apresConnexion={() => {
          setConnecte(true);
          client.invalidateQueries({ queryKey: ["atelier"] });
        }}
      />
    );
  }

  const synchro = !enLigne ? { texte: "Hors ligne", point: "bg-[#B1262E]" } : requete.isFetching ? { texte: "Mise à jour…", point: "bg-[#5E6A78] animate-pulse" } : { texte: "À jour", point: "bg-[#2C7A4C]" };

  return (
    <div className="min-h-[100dvh] bg-[#FBF5E9] font-body text-[15px] text-[#1A2B40]">
      <div className="mx-auto max-w-[720px] px-4 pb-[calc(96px+env(safe-area-inset-bottom))]">
        <header className="sticky top-0 z-20 bg-[#FBF5E9] pb-2.5 pt-3">
          <div className="flex items-center gap-2.5">
            <span className="font-brand text-[27px] leading-none text-[#163F6B]">Dedjo</span>
            <span className="font-display text-[19px] italic leading-none text-[#5E6A78]">{TITRES[vue]}</span>
            <span className="ml-auto flex items-center gap-1.5 whitespace-nowrap text-[12px] text-[#5E6A78]" role="status">
              <i className={`h-2 w-2 rounded-full ${synchro.point}`} aria-hidden="true" />
              {synchro.texte}
            </span>
            <button
              type="button"
              aria-label="Réglages"
              aria-current={vue === "reglages" ? "page" : undefined}
              onClick={() => allerA("reglages")}
              className={`grid h-11 w-11 flex-none place-items-center rounded-[10px] border ${vue === "reglages" ? "border-[#163F6B] bg-[#163F6B] text-[#FBF5E9]" : "border-[#E6DCC6] bg-[#FFFCF6] text-[#163F6B]"}`}
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {!enLigne ? (
            <p className="mt-2.5 flex items-center gap-2 rounded-xl bg-[#FAEDCF] px-3 py-2.5 text-[14px] font-bold text-[#94600A]" role="alert">
              <WifiOff className="h-4 w-4 flex-none" aria-hidden="true" />
              Hors ligne : tes saisies restent dans le formulaire, réessaie quand le réseau revient.
            </p>
          ) : null}
          {vue === "stock" && etat ? (
            <div className="-mx-4 mt-2.5 flex gap-1.5 overflow-x-auto px-4 pb-0.5" role="group" aria-label="Emplacement">
              <Puce actif={filtre === "tout"} onClick={() => setFiltre("tout")}>
                Tout
              </Puce>
              {etat.emplacements.map((e) => (
                <Puce key={e.id} actif={filtre === e.id} onClick={() => setFiltre(e.id)}>
                  {e.court}
                </Puce>
              ))}
            </div>
          ) : null}
        </header>

        <main>
          {!valeur ? (
            requete.isError ? (
              <div className={`${CARTE} mt-6 grid justify-items-start gap-3 p-5`}>
                <p className="font-display text-xl text-[#163F6B]">Stock indisponible</p>
                <p className={DISCRET}>{requete.error instanceof Error ? requete.error.message : "Le stock n'a pas pu être chargé."}</p>
                <button type="button" className={BOUTON_PRINCIPAL} onClick={() => requete.refetch()}>
                  Réessayer
                </button>
              </div>
            ) : (
              <div className="mt-6 grid gap-6">
                <Squelette lignes={4} />
                <Squelette lignes={3} />
              </div>
            )
          ) : (
            <Contexte.Provider value={valeur}>
              {vue === "stock" ? <VueStock /> : null}
              {vue === "saisir" ? <VueSaisir /> : null}
              {vue === "ferme" ? <AVenir lot={4} texte="Le relevé du congélateur à chaque passage et le rapprochement de caisse arrivent au lot 4. En attendant, le stock de la ferme se lit dans Stock, filtre « Ferme »." action={{ libelle: "Voir le stock de la ferme", faire: () => { setFiltre("ferme"); allerA("stock"); } }} /> : null}
              {vue === "commandes" ? <AVenir lot={5} texte="Les commandes du site, leurs réservations, la remise au client et l'annulation arrivent au lot 5, avec la disponibilité des produits calculée depuis le stock." /> : null}
              {vue === "journal" ? <VueJournal /> : null}
              {vue === "reglages" ? <VueReglages /> : null}
              {pile.map((p, i) => (
                <NiveauFeuille.Provider key={p.n} value={i}>
                  <div hidden={i !== pile.length - 1}>
                    <FeuilleCourante feuille={p.f} />
                  </div>
                </NiveauFeuille.Provider>
              ))}
            </Contexte.Provider>
          )}
        </main>
      </div>

      <nav aria-label="Sections" className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E6DCC6] bg-[#FFFCF6] px-3 pb-[calc(6px+env(safe-area-inset-bottom))] pt-1.5">
        <div className="mx-auto grid max-w-[720px] grid-cols-5 gap-1">
          {BARRE.map((b) => {
            const courant = vue === b.vue;
            return (
              <button
                key={b.vue}
                type="button"
                aria-current={courant ? "page" : undefined}
                onClick={() => allerA(b.vue)}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[10px] text-[11.5px] font-bold tracking-[0.02em] ${courant ? "text-[#163F6B]" : "text-[#5E6A78]"}`}
              >
                {b.vue === "saisir" ? (
                  <span className={`grid h-[26px] w-10 place-items-center rounded-full bg-[#163F6B] text-[#FBF5E9] [&>svg]:h-[18px] [&>svg]:w-[18px] ${courant ? "ring-[3px] ring-[#F5C842]" : ""}`} aria-hidden="true">
                    {b.icone}
                  </span>
                ) : (
                  <span className="[&>svg]:h-[22px] [&>svg]:w-[22px]" aria-hidden="true">
                    {b.icone}
                  </span>
                )}
                {b.libelle}
              </button>
            );
          })}
        </div>
      </nav>

      {message ? (
        <div
          key={message.n}
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 top-[calc(12px+env(safe-area-inset-top))] z-50 w-max max-w-[calc(100%-32px)] -translate-x-1/2 rounded-xl px-4 py-3 text-[14px] font-bold shadow-xl ${
            message.erreur ? "bg-[#B1262E] text-white" : "bg-[#1A2B40] text-[#FBF5E9]"
          }`}
        >
          {message.texte}
        </div>
      ) : null}
    </div>
  );
}

function FeuilleCourante({ feuille: f }: { feuille: Feuille }) {
  switch (f.type) {
    case "article":
      return <FicheArticle id={f.id} />;
    case "lot":
      return <FicheLot id={f.id} />;
    case "production":
      return <FormProduction article={f.article} quantite={f.quantite} retourApres={f.retour} />;
    case "reception":
      return <FormReception article={f.article} quantite={f.quantite} emplacement={f.emplacement} retourApres={f.retour} />;
    case "sortie":
    case "envoi":
    case "transfert":
      return <FormLignes mode={f.type} />;
    case "inventaire":
      return <FormInventaire />;
    case "lotAction":
      return <FormLot id={f.id} mode={f.mode} />;
    case "articleEdition":
      return <FormArticle id={f.id} />;
    case "emplacementEdition":
      return <FormEmplacement id={f.id} />;
    case "blocage":
      return <FormBlocage lot={f.lot} decision={f.decision} tous={f.tous} />;
    case "rappel":
      return <VueRappel lot={f.lot} />;
    default:
      return null;
  }
}

function AVenir({ lot, texte, action }: { lot: number; texte: string; action?: { libelle: string; faire: () => void } }) {
  return (
    <div className="mt-7 grid justify-items-start gap-3 rounded-xl border border-dashed border-[#E6DCC6] p-5">
      <h2 className="font-display text-xl font-semibold text-[#163F6B]">Bientôt (lot {lot})</h2>
      <p className="max-w-[52ch] text-[#5E6A78]">{texte}</p>
      {action ? (
        <button type="button" className={BOUTON_SECONDAIRE} onClick={action.faire}>
          {action.libelle}
        </button>
      ) : null}
    </div>
  );
}
