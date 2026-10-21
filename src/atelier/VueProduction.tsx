/* Vue Production (lot 6) : choisir les productions des produits à renflouer, les jours et le mode,
   puis suivre l'organigramme (Gantt) et la feuille de route à cocher ; enfin, enregistrer les lots.
   Le calcul est fait dans le navigateur (planification.ts) ; les réglages et le plan en cours
   vivent dans le classeur (onglet Production). Reprend l'onglet Production de la maquette. */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { appeler, ErreurAtelier, nouvelIdOperation } from "./api";
import { useAtelier } from "./contexte";
import { Badge, BOUTON_PRINCIPAL, BOUTON_SECONDAIRE, CARTE, CHAMP, DISCRET, ETIQUETTE, Feuille, LIEN, PasAPas, Pastille, Puce, Squelette, TITRE_SECTION } from "./composants";
import {
  ajouterJoursIso,
  construireProductions,
  duree,
  enHeure,
  fenetres,
  LIMITES_JOURS,
  nouveauPlan,
  planifier,
  prochainSamedi,
  type ChainePlan,
  type Famille,
  type Horaire,
  type Plan,
  type PlanEnCours,
  type Reglages,
  type Tache,
} from "./planification";
import { CLE_PRODUCTION, NOM_FAMILLE, piecesParSachet, produitsPlanifiables, useProduction, type DonneesProduction, type ProduitPlanifiable } from "./production";
import { aujourdhui, dateCourte, nombre, quantite } from "./outils";
import type { Etat, LotPlanifie } from "./types";

const JOUR_MIN = 1440;
const PALETTE: Record<string, { fond: string; encre: string; teinte: string }> = {
  v: { fond: "#E8B22A", encre: "#2A1E00", teinte: "#FBF0CF" },
  f: { fond: "#B5482B", encre: "#FFFFFF", teinte: "#F6E1D7" },
  g: { fond: "#6E6A35", encre: "#FFFFFF", teinte: "#E9E7D5" },
  p: { fond: "#163F6B", encre: "#FBF5E9", teinte: "#DCE6F2" },
};
const GLACE = { fond: "#DCEBF6", bord: "#7FAFD8" };

const JOUR_LONG = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const JOUR_COURT = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
const enDate = (iso: string) => {
  const [a, m, j] = iso.split("-").map(Number);
  return new Date(a, m - 1, j, 12);
};
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const nomJour = (iso: string) => majuscule(JOUR_LONG.format(enDate(iso)));

const LIBELLES: Record<string, string> = {
  pesage: "Pesage",
  petrissage: "Lancer le pétrissage",
  frasage: "Frasage au pétrin",
  faconnage: "Façonnage (boulage)",
  pointage: "Pointage",
  formage: "Formage : abaisse en rectangle",
  froid1: "Froid",
  froid2: "Froid",
  tourage: "Tourage",
  pousse: "Pousse",
  congel: "Mise au congélateur",
  congelo: "Congélation",
  sachet: "Mise en sachet et étiquetage",
  prep: "Préparation du poste et nettoyage",
  rangement: "Rangement et nettoyage",
  nettoyage: "Nettoyage du plan et du laminoir",
};
const COURTS: Record<string, string> = {
  pesage: "Pesage",
  petrissage: "Pétrin",
  frasage: "Frasage",
  faconnage: "Façon.",
  pointage: "Pointage",
  formage: "Formage",
  tourage: "Tourage",
  abaisse: "Abaisse",
  pousse: "Pousse",
  congelo: "Congélation",
  sachet: "Sachets",
  prep: "Prépa",
  rangement: "Rangement",
  nettoyage: "Nettoyage",
};

/* ===================================================================
   VUE
   =================================================================== */

export default function VueProduction() {
  const { allerA } = useAtelier();
  const { requete, reglages, erreurReglages, plan } = useProduction();

  if (requete.isLoading) {
    return (
      <div className="mt-5 grid gap-6">
        <Squelette lignes={4} />
        <Squelette lignes={2} />
      </div>
    );
  }
  if (requete.isError) {
    return (
      <div className={`${CARTE} mt-6 grid justify-items-start gap-3 p-5`}>
        <p className="font-display text-xl text-[#163F6B]">Production indisponible</p>
        <p className={DISCRET}>{requete.error instanceof Error ? requete.error.message : "Les réglages de production n'ont pas pu être lus."}</p>
        <button type="button" className={BOUTON_PRINCIPAL} onClick={() => requete.refetch()}>
          Réessayer
        </button>
      </div>
    );
  }
  if (!reglages) {
    return (
      <div className="mt-7 grid justify-items-start gap-3 rounded-xl border border-dashed border-[#E6DCC6] p-5">
        <h2 className="font-display text-xl font-semibold text-[#163F6B]">Renseigne d'abord tes réglages de production</h2>
        <p className="max-w-[52ch] text-[#5E6A78]">
          {erreurReglages
            ? `Les réglages enregistrés ne sont pas lisibles (${erreurReglages}) : recolle-les depuis la maquette.`
            : "Taille des pâtées, durées des étapes, places au congélateur et garnitures : ils restent dans ton classeur, jamais dans le code du site. Le plus simple : copie-les depuis la maquette, puis colle-les dans Réglages › Production."}
        </p>
        <button type="button" className={BOUTON_PRINCIPAL} onClick={() => allerA("reglages")}>
          Ouvrir les réglages
        </button>
      </div>
    );
  }
  return <Planificateur reglages={reglages} planEnregistre={plan} />;
}

/* ===================================================================
   PLANIFICATEUR
   =================================================================== */

type EtatEnvoi = "ok" | "envoi" | "erreur";

/** Plan enregistré au plus une fois par seconde, avec la dernière valeur. */
function useEnregistrementPlan() {
  const client = useQueryClient();
  const { sessionTerminee } = useAtelier();
  const [etatEnvoi, setEtatEnvoi] = useState<EtatEnvoi>("ok");
  const enAttente = useRef<PlanEnCours | null>(null);
  const dernier = useRef(0);
  const minuterie = useRef<ReturnType<typeof setTimeout>>();
  const enCours = useRef(false);

  const envoyer = useCallback(async () => {
    minuterie.current = undefined;
    const p = enAttente.current;
    if (!p || enCours.current) return;
    enAttente.current = null;
    enCours.current = true;
    dernier.current = Date.now();
    setEtatEnvoi("envoi");
    try {
      await appeler("stock.production.plan", { plan: p, idOperation: nouvelIdOperation() });
      setEtatEnvoi("ok");
    } catch (e) {
      if (e instanceof ErreurAtelier && e.statut === 401) sessionTerminee();
      if (!enAttente.current) enAttente.current = p;
      setEtatEnvoi("erreur");
    } finally {
      enCours.current = false;
    }
    if (enAttente.current && !minuterie.current) {
      minuterie.current = setTimeout(envoyer, 1000);
    }
  }, [sessionTerminee]);

  const programmer = useCallback(
    (p: PlanEnCours) => {
      enAttente.current = p;
      // Le cache garde la dernière valeur : en revenant sur l'onglet, on retrouve son plan
      client.setQueryData<DonneesProduction>(CLE_PRODUCTION, (avant) => (avant ? { ...avant, plan: p } : avant));
      if (minuterie.current) return;
      minuterie.current = setTimeout(envoyer, Math.max(0, 1000 - (Date.now() - dernier.current)));
    },
    [client, envoyer]
  );

  const reessayer = useCallback(() => {
    clearTimeout(minuterie.current);
    minuterie.current = undefined;
    envoyer();
  }, [envoyer]);

  return { etatEnvoi, programmer, reessayer };
}

/** Plan d'un week-end passé : on repart du prochain samedi, coches vidées. */
function planDuJour(p: PlanEnCours | null): PlanEnCours {
  if (!p) return nouveauPlan();
  if (p.date < aujourdhui()) return { ...p, date: prochainSamedi(), checks: {} };
  return p;
}

function Planificateur({ reglages: r, planEnregistre }: { reglages: Reglages; planEnregistre: PlanEnCours | null }) {
  const { etat, ouvrir, allerA } = useAtelier();
  const [plan, setPlan] = useState<PlanEnCours>(() => planDuJour(planEnregistre));
  const { etatEnvoi, programmer, reessayer } = useEnregistrementPlan();
  const [selection, setSelection] = useState<string | null>(null);

  const changer = (p: PlanEnCours) => {
    setPlan(p);
    programmer(p);
  };

  const produits = useMemo(() => produitsPlanifiables(etat, r), [etat, r]);
  const visibles = produits.filter((p) => plan.fam === "both" || plan.fam === p.fam);
  const jours = plan.jours[plan.mode];
  const { min: minJours, max: maxJours } = LIMITES_JOURS[plan.mode];

  const calcul = useMemo(() => {
    // Viennoiseries puis feuilletés, chacun dans son ordre de priorité (comme la liste affichée)
    const demandes = [...visibles.filter((p) => p.fam === "v"), ...visibles.filter((p) => p.fam === "f")].map((p) => ({
      id: p.a.id,
      fam: p.fam,
      n: plan.prods[p.a.id] || 0,
      piecesParSachet: piecesParSachet(p.a),
    }));
    const productions = construireProductions(r, demandes);
    let resultat: Plan | null = null;
    let erreur = "";
    try {
      resultat = productions.length ? planifier(r, productions, plan.mode, fenetres(jours)) : null;
    } catch (e) {
      erreur = "L'organigramme n'a pas pu être calculé : vérifie tes réglages de production.";
    }
    return { productions, resultat, erreur };
    // visibles dépend de produits et de la famille
  }, [r, produits, plan.fam, plan.prods, plan.mode, jours]); // eslint-disable-line react-hooks/exhaustive-deps

  const nb = calcul.productions.length;
  const parProduit = new Map<string, number>();
  calcul.productions.forEach((p) => parProduit.set(p.id, (parProduit.get(p.id) || 0) + p.sachets));
  const aRenflouer = produits.filter((p) => p.aRenflouer).length;

  const changerJours = (liste: Horaire[]) => changer({ ...plan, jours: { ...plan.jours, [plan.mode]: liste } });

  return (
    <>
      {/* ---------- Productions ---------- */}
      <section className="mt-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className={TITRE_SECTION}>Productions</h2>
          {Object.values(plan.prods).some((n) => n > 0) ? (
            <button type="button" className={LIEN} onClick={() => changer({ ...plan, prods: {} })}>
              Tout remettre à zéro
            </button>
          ) : null}
        </div>
        <p className={`${DISCRET} mb-3`}>
          {aRenflouer
            ? `${aRenflouer} produit${aRenflouer > 1 ? "s" : ""} à renflouer, en tête de liste.`
            : `Aucun produit à renflouer (limite par défaut : ${nombre(r.seuil)} sachets à Marseille).`}{" "}
          Choisis le nombre de productions : une production, c'est une pâtée d'un produit.
        </p>
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1" role="group" aria-label="Famille">
          {(
            [
              ["both", "Les deux"],
              ["v", "Viennoiseries"],
              ["f", "Feuilletés"],
            ] as [PlanEnCours["fam"], string][]
          ).map(([k, t]) => (
            <Puce key={k} actif={plan.fam === k} onClick={() => changer({ ...plan, fam: k })}>
              {t}
            </Puce>
          ))}
        </div>
        {(["v", "f"] as Famille[]).map((fam) => {
          const liste = visibles.filter((p) => p.fam === fam);
          if (!liste.length) return null;
          return (
            <Fragment key={fam}>
              <h3 className="mb-2 mt-5 font-display text-[16px] font-semibold text-[#163F6B]">{NOM_FAMILLE[fam]}</h3>
              <div className={`${CARTE} overflow-hidden`}>
                {liste.map((p) => (
                  <LigneProduit key={p.a.id} p={p} n={plan.prods[p.a.id] || 0} onChange={(n) => changer({ ...plan, prods: { ...plan.prods, [p.a.id]: n } })} />
                ))}
              </div>
            </Fragment>
          );
        })}
        <div className="mt-3 grid gap-1.5">
          {nb ? (
            <p className="text-[14.5px] tabular-nums">
              <b>
                {nb} production{nb > 1 ? "s" : ""}
              </b>{" "}
              · {[...parProduit.entries()].map(([id, s]) => `${s} ${nomCourt(etat, id)}`).join(", ")} (en sachets)
            </p>
          ) : (
            <p className={DISCRET}>Aucune production choisie.</p>
          )}
          {nb > r.congel.max ? (
            <p className={DISCRET}>
              Congélateur : {r.congel.max} production{r.congel.max > 1 ? "s" : ""} à la fois, jusqu'à la mise en sachet {nombre(r.congel.heures)} h après la congélation. Compte au moins{" "}
              {Math.ceil(nb / r.congel.max)} jours de production.
            </p>
          ) : null}
        </div>
      </section>

      {/* ---------- Quand ---------- */}
      <section className="mt-8">
        <h2 className={`${TITRE_SECTION} mb-2`}>Quand</h2>
        <div className="flex gap-1.5" role="group" aria-label="Organisation">
          {(
            [
              ["traite", "D'une traite"],
              ["deux", "En deux temps"],
            ] as [PlanEnCours["mode"], string][]
          ).map(([k, t]) => (
            <Puce key={k} actif={plan.mode === k} onClick={() => changer({ ...plan, mode: k, checks: {} })}>
              {t}
            </Puce>
          ))}
        </div>
        <p className={`${DISCRET} my-3`}>
          {plan.mode === "deux"
            ? "La veille : pesées, pétrissage, formage et garnitures, puis une nuit au froid. Le jour J commence au tourage."
            : "Chaque production est faite du début à la fin dans la même journée. Le lendemain sert aussi à la mise en sachet."}
        </p>
        <label className="mb-3 grid max-w-[260px] gap-1.5">
          <span className={ETIQUETTE}>Premier jour</span>
          <input type="date" value={plan.date} onChange={(e) => e.target.value && changer({ ...plan, date: e.target.value, checks: {} })} className={CHAMP} />
        </label>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {jours.map((h, i) => (
            <div key={i} className={`${CARTE} grid gap-2.5 p-3`}>
              <p className="font-display text-[16px] font-semibold text-[#163F6B]">{titreJour(plan, i)}</p>
              <div className="grid grid-cols-2 gap-2.5">
                {(["Début", "Fin au plus tard"] as const).map((lib, j) => (
                  <label key={lib} className="grid gap-1.5">
                    <span className={ETIQUETTE}>{lib}</span>
                    <input
                      type="time"
                      step={300}
                      value={h[j]}
                      onChange={(e) => {
                        if (!/^\d{2}:\d{2}$/.test(e.target.value)) return;
                        const liste = jours.map((x) => [...x] as Horaire);
                        liste[i][j] = e.target.value;
                        changerJours(liste);
                      }}
                      className={CHAMP}
                    />
                  </label>
                ))}
              </div>
              {i === jours.length - 1 && jours.length > minJours ? (
                <button type="button" className={`${LIEN} justify-self-start`} onClick={() => changerJours(jours.slice(0, -1))}>
                  Retirer ce jour
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {jours.length < maxJours ? (
          <button type="button" className={`${BOUTON_SECONDAIRE} mt-2.5`} onClick={() => changerJours([...jours, plan.mode === "deux" ? ["07:00", "19:00"] : ["07:00", "20:00"]])}>
            + Ajouter un jour
          </button>
        ) : null}
        <p className={`${DISCRET} mt-2.5`}>
          Congélateur : {r.congel.max} production{r.congel.max > 1 ? "s" : ""} à la fois jusqu'à la mise en sachet, {nombre(r.congel.heures)} h après la congélation.{" "}
          <button type="button" className="font-bold text-[#163F6B] underline underline-offset-4" onClick={() => allerA("reglages")}>
            Régler
          </button>
        </p>
      </section>

      {/* ---------- Organigramme ---------- */}
      {calcul.erreur ? (
        <p className="mt-8 rounded-xl bg-[#F7E0E0] px-3.5 py-3 text-[14px] font-bold text-[#B1262E]">{calcul.erreur}</p>
      ) : calcul.resultat ? (
        <Organigramme
          plan={plan}
          resultat={calcul.resultat}
          reglages={r}
          selection={selection}
          setSelection={setSelection}
          onCocher={(cle, fait) => {
            const checks = { ...plan.checks };
            if (fait) checks[cle] = 1;
            else delete checks[cle];
            changer({ ...plan, checks });
          }}
          onToutDecocher={() => changer({ ...plan, checks: {} })}
          onEnregistrer={() => ouvrir({ type: "enregistrerProduction", lignes: lotsPlanifies(plan, calcul.resultat as Plan) })}
        />
      ) : (
        <section className="mt-8">
          <h2 className={`${TITRE_SECTION} mb-2`}>Organigramme</h2>
          <div className="grid gap-2 rounded-xl border border-dashed border-[#E6DCC6] p-5">
            <p className="font-display text-lg text-[#163F6B]">Aucune production choisie</p>
            <p className={DISCRET}>Ajoute une production à un produit : l'organigramme se calcule tout seul, jour par jour, avec la feuille de route à cocher.</p>
          </div>
        </section>
      )}

      <p className={`${DISCRET} mb-4 mt-6`} role="status">
        {etatEnvoi === "envoi" ? (
          "Enregistrement du plan…"
        ) : etatEnvoi === "erreur" ? (
          <>
            <span className="font-bold text-[#B1262E]">Plan pas encore enregistré.</span>{" "}
            <button type="button" className="font-bold text-[#163F6B] underline underline-offset-4" onClick={reessayer}>
              Réessayer
            </button>
          </>
        ) : (
          "Plan enregistré dans ton classeur : tu le retrouves sur tous tes appareils."
        )}
      </p>
    </>
  );
}

const nomCourt = (etat: Etat, id: string) => (etat.articles.find((a) => a.id === id) || { nom: id }).nom.replace(/^L[ae] /, "");
const nomComplet = (etat: Etat, id: string) => (etat.articles.find((a) => a.id === id) || { nom: id }).nom;

function titreJour(plan: PlanEnCours, i: number): string {
  const n = plan.jours[plan.mode].length;
  const role = plan.mode === "deux" ? (i === 0 ? "La veille" : i === n - 1 ? "Jour J" : "Jour J et veille") : `Jour ${i + 1}`;
  return `${role} · ${nomJour(ajouterJoursIso(plan.date, i))}`;
}

function LigneProduit({ p, n, onChange }: { p: ProduitPlanifiable; n: number; onChange: (n: number) => void }) {
  const r = p.rendement;
  return (
    <div className={`flex items-center gap-2.5 border-t border-[#E6DCC6] py-2.5 pl-3 pr-2 first:border-t-0 ${n > 0 ? "bg-[#F3ECDD]" : ""}`}>
      <Pastille article={p.a} />
      <div className="min-w-0 flex-1">
        <div className="font-display text-[16px] leading-tight">{p.a.nom}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] tabular-nums text-[#5E6A78]">
          <span>
            Marseille {nombre(p.dispo)} · limite {nombre(p.limite)}
            {p.ferme > 0 ? ` · ferme ${nombre(p.ferme)}` : ""}
          </span>
          {p.rupture ? <Badge teinte="bad">Rupture</Badge> : p.aRenflouer ? <Badge teinte="warn">À renflouer</Badge> : null}
        </div>
        <div className="text-[12.5px] tabular-nums text-[#5E6A78]">
          1 production → {r.sachets} sachet{r.sachets > 1 ? "s" : ""}
          {r.reste ? ` + ${r.reste} pièce${r.reste > 1 ? "s" : ""}` : ""}
        </div>
      </div>
      <PasAPas
        valeur={n ? String(n) : ""}
        entier
        max={9}
        libelle={`Productions de ${p.a.nom}`}
        onChange={(v) => {
          const x = Math.round(Number(v.replace(",", ".")));
          onChange(Number.isFinite(x) ? Math.min(9, Math.max(0, x)) : 0);
        }}
      />
    </div>
  );
}

/** Lots à enregistrer : un par produit et par jour de congélation. */
function lotsPlanifies(plan: PlanEnCours, res: Plan): LotPlanifie[] {
  const m = new Map<string, number>();
  for (const c of res.chaines) {
    const cle = `${c.p.id}|${ajouterJoursIso(plan.date, Math.floor(c.jalon / JOUR_MIN))}`;
    m.set(cle, (m.get(cle) || 0) + c.p.sachets);
  }
  return [...m.entries()].map(([cle, sachets]) => {
    const [article, fabrication] = cle.split("|");
    return { article, fabrication, sachets };
  });
}

/* ===================================================================
   ORGANIGRAMME : résumé, avertissements, Gantt, feuille de route
   =================================================================== */

interface PropsOrganigramme {
  plan: PlanEnCours;
  resultat: Plan;
  reglages: Reglages;
  selection: string | null;
  setSelection: (id: string | null) => void;
  onCocher: (cle: string, fait: boolean) => void;
  onToutDecocher: () => void;
  onEnregistrer: () => void;
}

function Organigramme({ plan, resultat: P, reglages: r, selection, setSelection, onCocher, onToutDecocher, onEnregistrer }: PropsOrganigramme) {
  const { etat } = useAtelier();
  const maintenant = useMaintenant(plan.date);
  const jours = P.jours.filter((d) => !d.vide);
  const chaine = (id: string | null) => (id ? P.chaines.find((c) => c.id === id) : undefined);
  const nomProd = (c: ChainePlan) => `${nomComplet(etat, c.p.id)}${c.p.of > 1 ? ` ${c.p.num}` : ""}`;
  const horloge = (m: number) => `${JOUR_COURT.format(enDate(ajouterJoursIso(plan.date, Math.floor(m / JOUR_MIN))))} ${enHeure(m)}`;
  const libelle = (t: Tache) => {
    if (t.k === "garn") return t.g ? t.g.nom : "Garniture";
    if (t.k === "abaisse") return t.fam === "f" ? "Abaisse, division, garnissage" : "Abaisse, division, façonnage";
    if (t.k === "nettoyage") return t.clean === "f" ? "Nettoyage plan et laminoir (salé → sucré)" : "Nettoyage plan et laminoir (sucré → salé)";
    if (t.k === "petrissage" && t.kind !== "machine") return "Pétrissage";
    return LIBELLES[t.k] || t.k;
  };
  const nomLigne = (t: Tache) => {
    if (t.row === "P") return "Poste";
    const c = chaine(t.ch);
    if (t.row === "G") return c ? `Garniture · ${nomProd(c)}` : "Garniture";
    return c ? nomProd(c) : t.row;
  };
  const note = (t: Tache) => noteEtape(t, P, r, etat, horloge);
  const todo = aConfirmer(P, r, etat);
  const tSel = selection ? P.taches.find((t) => t.id === selection) : undefined;
  const coches = Object.keys(plan.checks).length;

  return (
    <>
      <section className="mt-8">
        <h2 className={`${TITRE_SECTION} mb-2`}>Organigramme</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {jours.map((d) => (
            <div key={d.i} className={`${CARTE} grid gap-0.5 px-3.5 py-2.5`}>
              <span className="text-[13px] text-[#5E6A78]">{nomJour(ajouterJoursIso(plan.date, d.i))}</span>
              <b className="text-[20px] tabular-nums leading-tight">
                {enHeure(d.debut)} → {enHeure(d.fin)}
              </b>
              <span className="text-[13px] text-[#5E6A78]">
                {d.sachetSeul ? "Mise en sachet · " : ""}
                {duree(d.fin - d.debut)} sur place · {duree(d.travail)} de travail
              </span>
            </div>
          ))}
        </div>
        {P.avertissements.map((a, i) => (
          <p key={i} className="mt-3 rounded-xl bg-[#FAEDCF] px-3.5 py-3 text-[14px] font-bold text-[#94600A]" role="alert">
            {a.t}
          </p>
        ))}
        {todo.length ? (
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px]">
            <Badge teinte="warn">À confirmer</Badge>
            <span>{todo.join(", ")}</span>
            <BoutonReglages />
          </p>
        ) : null}
        {jours.map((d) => (
          <Fragment key={d.i}>
            <h3 className="mb-2 mt-5 font-display text-[16px] font-semibold text-[#163F6B]">{nomJour(ajouterJoursIso(plan.date, d.i))}</h3>
            <Gantt P={P} jour={d.i} nomProd={nomProd} selection={selection} setSelection={setSelection} libelle={libelle} maintenant={maintenant} />
          </Fragment>
        ))}
        <p className="mt-2 min-h-[1.4em] text-[13.5px] text-[#5E6A78]" aria-live="polite">
          {tSel ? (
            <>
              <b className="text-[#1A2B40]">{tSel.kind === "froid" ? `Froid, au moins ${duree(tSel.min || 0)}` : tSel.kind === "congel" ? "Congélation, jusqu'à la mise en sachet" : libelle(tSel)}</b> · {nomLigne(tSel)} ·{" "}
              {tSel.d
                ? `${Math.floor(tSel.s / JOUR_MIN) !== Math.floor((tSel.s + tSel.d) / JOUR_MIN) ? horloge(tSel.s) : enHeure(tSel.s)} – ${
                    Math.floor(tSel.s / JOUR_MIN) !== Math.floor((tSel.s + tSel.d) / JOUR_MIN) ? horloge(tSel.s + tSel.d) : enHeure(tSel.s + tSel.d)
                  } · ${duree(tSel.d)}`
                : enHeure(tSel.s)}
            </>
          ) : (
            "Touche un bloc pour voir ses horaires."
          )}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[12.5px] text-[#5E6A78]">
          <Legende style={{ background: PALETTE.p.fond }}>Tu travailles</Legende>
          <Legende style={{ background: `repeating-linear-gradient(135deg,${PALETTE.p.fond} 0 3px,${PALETTE.p.teinte} 3px 6px)` }}>Pétrin seul</Legende>
          <Legende style={{ background: PALETTE.p.teinte, boxShadow: `inset 0 0 0 1px ${PALETTE.p.fond}` }}>Pointage, pousse</Legende>
          <Legende style={{ background: GLACE.fond, boxShadow: `inset 0 0 0 1px ${GLACE.bord}` }}>Froid</Legende>
          <Legende style={{ background: PALETTE.v.fond }}>Viennoiseries</Legende>
          <Legende style={{ background: PALETTE.f.fond }}>Feuilletés</Legende>
          <Legende style={{ background: PALETTE.g.fond }}>Garnitures</Legende>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className={TITRE_SECTION}>Feuille de route</h2>
          {coches ? (
            <button type="button" className={LIEN} onClick={onToutDecocher}>
              Tout décocher
            </button>
          ) : null}
        </div>
        {jours.map((d) => {
          const date = ajouterJoursIso(plan.date, d.i);
          const lignes: ({ s: number; t: Tache } | { s: number; libre: { s: number; d: number; attente?: boolean } })[] = P.taches
            .filter((t) => t.wi === d.i && (t.kind === "actif" || t.kind === "machine" || t.kind === "jalon"))
            .map((t) => ({ s: t.s, t }));
          d.libres.filter((g) => g.d >= 10).forEach((g) => lignes.push({ s: g.s, libre: g }));
          lignes.sort((a, b) => a.s - b.s || ("libre" in a ? 1 : -1));
          return (
            <Fragment key={d.i}>
              <h3 className="mb-2 mt-5 font-display text-[16px] font-semibold text-[#163F6B]">{nomJour(date)}</h3>
              <div className={`${CARTE} overflow-hidden`}>
                {lignes.map((l) => {
                  const enCours = maintenant !== null && maintenant >= l.s && maintenant < l.s + Math.max("t" in l ? l.t.d : l.libre.d, 5);
                  if ("libre" in l) {
                    return (
                      <div key={`libre-${l.s}`} className={`grid grid-cols-[24px_46px_minmax(0,1fr)_auto] items-start gap-x-2.5 border-t border-[#E6DCC6] bg-[#F3ECDD] px-3 py-2.5 first:border-t-0 ${enCours ? "shadow-[inset_3px_0_0_#C8352B]" : ""}`}>
                        <span />
                        <span className="text-[14px] font-bold tabular-nums">{enHeure(l.s)}</span>
                        <span className="text-[14.5px] italic text-[#5E6A78]">{l.libre.attente ? "Attente de la fin de pousse" : "Libre"}</span>
                        <span className="whitespace-nowrap text-[13px] tabular-nums text-[#5E6A78]">{duree(l.libre.d)}</span>
                      </div>
                    );
                  }
                  const t = l.t;
                  const cle = `${date}|${t.id}`;
                  const fait = !!plan.checks[cle];
                  const c = chaine(t.ch);
                  const n = note(t);
                  const idCase = `ck-${t.id}-${d.i}`;
                  return (
                    <div
                      key={t.id}
                      className={`grid grid-cols-[24px_46px_minmax(0,1fr)_auto] items-start gap-x-2.5 border-t border-[#E6DCC6] px-3 py-2.5 first:border-t-0 ${t.kind === "jalon" ? "bg-[#DCEBF6]" : ""} ${enCours ? "shadow-[inset_3px_0_0_#C8352B]" : ""}`}
                    >
                      <input id={idCase} type="checkbox" checked={fait} onChange={(e) => onCocher(cle, e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#163F6B]" aria-label={`Fait : ${libelle(t)}`} />
                      <span className={`text-[14px] font-bold tabular-nums ${enCours ? "text-[#C8352B]" : ""}`}>{enHeure(t.s)}</span>
                      <label htmlFor={idCase} className={fait ? "line-through opacity-55" : ""}>
                        {t.row === "P" || c ? <Pilule fam={t.row === "P" ? "p" : (c as ChainePlan).fam}>{t.row === "P" ? "Poste" : `${nomCourt(etat, (c as ChainePlan).p.id)}${(c as ChainePlan).p.of > 1 ? ` ${(c as ChainePlan).p.num}` : ""}`}</Pilule> : null}
                        <span className="text-[14.5px] font-bold leading-snug">{libelle(t)}</span>
                        {n ? <span className="mt-0.5 block text-[13px] leading-snug text-[#5E6A78]">{n}</span> : null}
                      </label>
                      <span className="whitespace-nowrap text-[13px] tabular-nums text-[#5E6A78]">{t.kind === "jalon" ? "" : `${t.kind === "machine" ? "pétrin " : ""}${duree(t.d)}`}</span>
                    </div>
                  );
                })}
              </div>
            </Fragment>
          );
        })}
      </section>

      <section className="mt-8">
        <h2 className={`${TITRE_SECTION} mb-2`}>Après la production</h2>
        <div className={`${CARTE} overflow-hidden`}>
          {P.chaines.map((c) => (
            <div key={c.id} className="flex items-start gap-3 border-t border-[#E6DCC6] px-3.5 py-2.5 first:border-t-0">
              <span className="mt-1.5">
                <Pastille article={etat.articles.find((a) => a.id === c.p.id)} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[16px]">
                  {nomProd(c)} · {c.p.sachets} sachet{c.p.sachets > 1 ? "s" : ""}
                </span>
                <span className="block text-[12.5px] tabular-nums text-[#5E6A78]">
                  Au congélateur {horloge(c.jalon)} · {c.sachetA !== null ? `mise en sachet ${horloge(c.sachetA)}` : `en sachet à partir de ${horloge(c.sachetDes)}, après ces jours`}
                </span>
              </span>
            </div>
          ))}
        </div>
        <button type="button" className={`${BOUTON_PRINCIPAL} mt-3 w-full`} onClick={onEnregistrer}>
          Enregistrer la production
        </button>
        <p className={`${DISCRET} mt-2`}>Une fois la production terminée : un lot par produit et par jour de congélation, avec ses matières, par le formulaire de production habituel.</p>
      </section>
    </>
  );
}

function BoutonReglages() {
  const { allerA } = useAtelier();
  return (
    <button type="button" className="font-bold text-[#163F6B] underline underline-offset-4" onClick={() => allerA("reglages")}>
      Régler
    </button>
  );
}

function Legende({ style, children }: { style: CSSProperties; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className="inline-block h-[11px] w-5 rounded-[3px]" style={style} aria-hidden="true" />
      {children}
    </span>
  );
}

function Pilule({ fam, children }: { fam: string; children: string }) {
  const c = PALETTE[fam] || PALETTE.p;
  return (
    <span className="mr-1.5 inline-block whitespace-nowrap rounded-full px-1.5 py-0.5 align-[1px] text-[10.5px] font-bold leading-none" style={{ background: c.teinte, boxShadow: `inset 0 0 0 1px ${c.fond}` }}>
      {children}
    </span>
  );
}

/** Minutes écoulées depuis minuit du premier jour du plan (repère « maintenant »), mises à jour chaque minute. */
function useMaintenant(datePlan: string): number | null {
  const calcul = useCallback(() => {
    const debut = enDate(datePlan);
    debut.setHours(0, 0, 0, 0);
    const n = Math.floor((Date.now() - debut.getTime()) / 60000);
    return n >= 0 && n < 7 * JOUR_MIN ? n : null;
  }, [datePlan]);
  const [m, setM] = useState(calcul);
  useEffect(() => {
    setM(calcul());
    const id = setInterval(() => setM(calcul()), 60_000);
    return () => clearInterval(id);
  }, [calcul]);
  return m;
}

/* ---------- Gantt d'un jour ---------- */

const LARGEUR_LIBELLE = 108;
const PX_HEURE = 72;

function Gantt({
  P,
  jour,
  nomProd,
  selection,
  setSelection,
  libelle,
  maintenant,
}: {
  P: Plan;
  jour: number;
  nomProd: (c: ChainePlan) => string;
  selection: string | null;
  setSelection: (id: string | null) => void;
  libelle: (t: Tache) => string;
  maintenant: number | null;
}) {
  const d = P.jours[jour];
  const a = Math.floor(d.debut / 60) * 60;
  const b = Math.max(a + 120, Math.ceil(d.fin / 60) * 60);
  const R = b - a;
  const heures = R / 60;
  const visible = (t: Tache) => (t.kind === "jalon" ? t.s >= a && t.s <= b : t.s < b && t.s + t.d > a);
  const taches = P.taches.filter((t) => visible(t) && (t.wi === jour || t.kind === "froid" || t.kind === "congel"));
  // Les garnitures s'affichent sur la ligne de leur production
  const ligneDe = (t: Tache) => (t.row === "G" ? (t.ch as string) : t.row);
  const lignes = ["P", ...P.chaines.map((c) => c.id)].filter((l) => taches.some((t) => ligneDe(t) === l && (t.kind !== "congel" || t.wi === jour)));
  const pct = (m: number) => `${(((m - a) / R) * 100).toFixed(3)}%`;
  const larg = (m: number) => `${((m / R) * 100).toFixed(3)}%`;

  const bloc = (t: Tache) => {
    const s = Math.max(t.s, a);
    const e = Math.min(t.s + t.d, b);
    const sel = selection === t.id;
    const contour = sel ? "outline outline-2 outline-offset-1 outline-[#3F95CC] z-[2]" : "";
    const choisir = () => setSelection(sel ? null : t.id);
    if (t.kind === "jalon") {
      return (
        <button key={t.id} type="button" onClick={choisir} aria-label={`${libelle(t)} à ${enHeure(t.s)}`} className={`absolute bottom-0.5 top-0.5 w-[5px] rounded-[2px] ${contour}`} style={{ left: `calc(${pct(t.s)} - 2px)`, background: GLACE.bord }} />
      );
    }
    const c = PALETTE[t.fam] || PALETTE.p;
    const texte = t.kind === "froid" ? `Froid ${duree(t.d)}` : t.k === "garn" ? (t.g ? t.g.nom : "") : COURTS[t.k] || "";
    const montre = ((e - s) / 60) * PX_HEURE >= texte.length * 6.2 + 10;
    const place: CSSProperties = { left: pct(s), width: larg(e - s) };
    const apparence: Record<string, { style: CSSProperties; classe: string }> = {
      actif: { style: { background: c.fond, color: c.encre }, classe: "font-bold" },
      machine: { style: { background: `repeating-linear-gradient(135deg,${c.fond} 0 4px,${c.teinte} 4px 8px)` }, classe: "font-bold" },
      repos: { style: { background: c.teinte, boxShadow: `inset 0 0 0 1px ${c.fond}` }, classe: "font-normal" },
      froid: { style: { background: GLACE.fond, boxShadow: `inset 0 0 0 1px ${GLACE.bord}` }, classe: "font-normal" },
      congel: { style: { background: `linear-gradient(to right,${GLACE.fond},transparent)`, borderLeft: `2px solid ${GLACE.bord}` }, classe: "font-normal text-[#5E6A78] rounded-none" },
    };
    const { style: habit, classe } = apparence[t.kind] || apparence.actif;
    const style: CSSProperties = { ...place, ...habit };
    return (
      <button
        key={t.id}
        type="button"
        onClick={choisir}
        aria-label={`${t.kind === "froid" ? "Froid" : libelle(t)}, ${enHeure(t.s)}`}
        className={`absolute bottom-[5px] top-[5px] flex min-w-[3px] items-center overflow-hidden whitespace-nowrap rounded px-1.5 text-left text-[11px] leading-none ${classe} ${contour}`}
        style={style}
      >
        {montre ? <span className={`overflow-hidden text-ellipsis ${t.kind === "machine" ? "rounded-[3px] bg-[#FFFCF6] px-1 py-0.5" : ""}`}>{texte}</span> : null}
      </button>
    );
  };

  // Toi : occupé (fusion des tâches de Jo) et libre
  const occupe: [number, number][] = [];
  P.taches
    .filter((t) => t.wi === jour && t.res.includes("op") && t.d > 0)
    .sort((x, y) => x.s - y.s)
    .forEach((t) => {
      const der = occupe[occupe.length - 1];
      if (der && t.s <= der[1]) der[1] = Math.max(der[1], t.s + t.d);
      else occupe.push([t.s, t.s + t.d]);
    });
  const ligneMaintenant = maintenant !== null && maintenant >= a && maintenant <= b ? maintenant : null;

  return (
    <div className={`${CARTE} overflow-x-auto overscroll-x-contain`}>
      <div className="relative pb-1.5 pr-2.5 pt-0.5" style={{ minWidth: heures * PX_HEURE + LARGEUR_LIBELLE }}>
        <div className="grid" style={{ gridTemplateColumns: `${LARGEUR_LIBELLE}px 1fr` }}>
          <div className="sticky left-0 z-[3] bg-[#FFFCF6]" />
          <div className="relative h-6">
            {Array.from({ length: heures + 1 }, (_, i) => (
              <span
                key={i}
                className="absolute top-1.5 whitespace-nowrap text-[11.5px] font-bold tabular-nums leading-none text-[#5E6A78]"
                style={{ left: `${((i / heures) * 100).toFixed(3)}%`, transform: i === 0 ? "none" : i === heures ? "translateX(-100%)" : "translateX(-50%)" }}
              >
                {enHeure(a + i * 60)}
              </span>
            ))}
          </div>
        </div>
        {lignes.map((l) => {
          const c = P.chaines.find((x) => x.id === l);
          return (
            <div key={l} className="grid" style={{ gridTemplateColumns: `${LARGEUR_LIBELLE}px 1fr` }}>
              <div className="sticky left-0 z-[3] flex min-w-0 flex-col justify-center border-r border-[#E6DCC6] bg-[#FFFCF6] pl-3 pr-2 text-[12px] font-bold leading-tight">
                {c ? (
                  <>
                    <span className="truncate">{nomProd(c)}</span>
                    <small className="truncate text-[11px] font-normal text-[#5E6A78]">
                      {c.p.pieces} pièces · {c.p.sachets} sachets
                    </small>
                  </>
                ) : (
                  <>
                    Poste
                    <small className="text-[11px] font-normal text-[#5E6A78]">prépa, rangement</small>
                  </>
                )}
              </div>
              <Piste heures={heures}>{taches.filter((t) => ligneDe(t) === l && (t.kind !== "congel" || t.wi === jour)).map(bloc)}</Piste>
            </div>
          );
        })}
        <div className="mt-1.5 grid" style={{ gridTemplateColumns: `${LARGEUR_LIBELLE}px 1fr` }}>
          <div className="sticky left-0 z-[3] flex flex-col justify-center border-r border-[#E6DCC6] bg-[#FFFCF6] pl-3 pr-2 text-[12px] font-bold leading-tight text-[#163F6B]">
            Toi
            <small className="text-[11px] font-normal text-[#5E6A78]">occupé · libre</small>
          </div>
          <Piste heures={heures}>
            {occupe.map(([s, e]) => (
              <span key={s} className="absolute bottom-[5px] top-[5px] flex items-center overflow-hidden rounded px-1.5 text-[11px] font-bold" style={{ left: pct(s), width: larg(e - s), background: PALETTE.p.fond, color: PALETTE.p.encre }}>
                {((e - s) / 60) * PX_HEURE >= 44 ? duree(e - s) : ""}
              </span>
            ))}
            {d.libres
              .filter((g) => g.d >= 5)
              .map((g) => (
                <span key={`l${g.s}`} className="absolute bottom-[5px] top-[5px] flex items-center justify-center overflow-hidden rounded text-[11px] text-[#5E6A78]" style={{ left: pct(g.s), width: larg(g.d), boxShadow: "inset 0 0 0 1px #E6DCC6" }}>
                  {(g.d / 60) * PX_HEURE >= 70 ? `libre ${duree(g.d)}` : ""}
                </span>
              ))}
          </Piste>
        </div>
        {ligneMaintenant !== null ? (
          <div className="pointer-events-none absolute bottom-1 top-6 z-[4] w-0.5 bg-[#C8352B]" style={{ left: `calc(${LARGEUR_LIBELLE}px + (100% - ${LARGEUR_LIBELLE + 10}px) * ${((ligneMaintenant - a) / R).toFixed(4)})` }} aria-hidden="true" />
        ) : null}
      </div>
    </div>
  );
}

function Piste({ heures, children }: { heures: number; children: ReactNode }) {
  return (
    <div
      className="relative h-[34px] border-t border-[#EFE8DA]"
      style={{ backgroundImage: "linear-gradient(to right,#EFE8DA 1px,transparent 1px)", backgroundSize: `calc(100% / ${heures}) 100%` }}
    >
      {children}
    </div>
  );
}

/* ---------- Notes de la feuille de route ---------- */

function noteEtape(t: Tache, P: Plan, r: Reglages, etat: Etat, horloge: (m: number) => string): string {
  const c = t.ch ? P.chaines.find((x) => x.id === t.ch) : undefined;
  const st: Record<string, number> | null = c ? (c.fam === "v" ? r.v.st : r.f.st) : null;
  const suivante = (k: string) => P.taches.find((x) => x.ch === t.ch && x.k === k && x.row === t.row);
  const sachets = c ? `${c.p.sachets} sachet${c.p.sachets > 1 ? "s" : ""}` : "";
  const garnitures = c ? r.garn.filter((g) => g.produits.includes(c.p.id)).map((g) => g.nom.toLowerCase()) : [];
  switch (t.k) {
    case "pesage":
      return c ? `${c.p.pieces} ${nomCourt(etat, c.p.id)}${c.fam === "v" ? ` · ${nombre(c.p.charge / 1000)} kg de pâte` : ""} → ${sachets}.` : "";
    case "petrissage":
      return t.kind === "machine" ? "Le pétrin tourne : tu as les mains libres." : "";
    case "frasage":
      return "Racle la cuve si elle vient de servir à la pâte levée.";
    case "faconnage":
      return st ? `→ pointage ${duree(st.pointage)}` : "";
    case "formage":
    case "tourage": {
      const f = suivante(t.k === "formage" ? "froid1" : "froid2");
      if (!f) return "";
      const fin = f.s + f.d;
      return `→ froid jusqu'à ${f.d >= 600 ? horloge(fin) : enHeure(fin)} (${duree(f.d)})`;
    }
    case "abaisse": {
      if (!c) return "";
      const j = suivante("congel");
      const g = garnitures.length ? ` Garnitures : ${garnitures.join(", ")}.` : "";
      return c.fam === "v"
        ? `${c.p.pieces} pièces.${g} → pousse ${duree(r.v.st.pousse)}${j ? `, au congélateur à ${enHeure(j.s)}` : ""}.`
        : `${c.p.pieces} pièces.${g} → au congélateur directement.`;
    }
    case "congel":
      return c ? `${nomComplet(etat, c.p.id)} : en sachet à partir de ${horloge(t.s + r.congel.heures * 60)}.` : "";
    case "sachet":
      return c ? `${sachets} de ${nomComplet(etat, c.p.id)}${c.p.reste ? ` (+ ${c.p.reste} pièce${c.p.reste > 1 ? "s" : ""})` : ""}.` : "";
    case "garn":
      return `${t.g && t.g.fixe ? `Refroidis-la vite, filmée au contact. Prête à ${enHeure(t.s + t.d + (t.g.froid || 0))}. ` : ""}${c ? `Pour ${nomComplet(etat, c.p.id)}${c.p.of > 1 ? ` ${c.p.num}` : ""}.` : ""}`;
    case "nettoyage":
      return t.clean === "f" ? "Plus aucune trace de garniture salée avant la viennoiserie." : "Plus aucune trace de viennoiserie (crème, chocolat) avant les feuilletés.";
    case "prep":
      return "Mise en place, plan désinfecté, matières sorties.";
    default:
      return "";
  }
}

/** Valeurs « à confirmer » utilisées par ce plan : poids de pâte et garnitures. */
function aConfirmer(P: Plan, r: Reglages, etat: Etat): string[] {
  const utilises = new Set(P.chaines.map((c) => c.p.id));
  const out: string[] = [];
  utilises.forEach((id) => {
    if (r.todo[`v.g.${id}`]) out.push(`poids de pâte de ${nomComplet(etat, id)}`);
  });
  r.garn.forEach((g) => {
    if (g.todo && g.produits.some((id) => utilises.has(id))) out.push(g.nom.charAt(0).toLowerCase() + g.nom.slice(1));
  });
  return out;
}

/* ===================================================================
   ENREGISTRER LA PRODUCTION : un lot par produit et par jour de congélation
   =================================================================== */

export function FeuilleEnregistrerProduction({ lignes }: { lignes: LotPlanifie[] }) {
  const { etat, ouvrir } = useAtelier();
  return (
    <Feuille titre="Enregistrer la production">
      <p className={`${DISCRET} mb-3`}>
        Un lot par produit et par jour de congélation. Chaque ligne ouvre le formulaire de production pré-rempli, matières comprises par la recette : corrige les sachets réellement produits avant d'enregistrer.
      </p>
      <div className={`${CARTE} overflow-hidden`}>
        {lignes.map((l) => {
          const a = etat.articles.find((x) => x.id === l.article);
          const lot = etat.lots.find((x) => x.article === l.article && x.fabrication === l.fabrication);
          return (
            <div key={`${l.article}|${l.fabrication}`} className="flex items-center gap-3 border-t border-[#E6DCC6] px-3.5 py-3 first:border-t-0">
              <Pastille article={a} />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[16px]">{a ? a.nom : l.article}</span>
                <span className="block text-[12.5px] tabular-nums text-[#5E6A78]">
                  Fabrication {dateCourte(l.fabrication)} · {a ? quantite(a, l.sachets) : `${l.sachets} sachets`}
                </span>
              </span>
              {lot ? (
                <Badge teinte="ok">Enregistré · lot {lot.numero}</Badge>
              ) : (
                <button
                  type="button"
                  className={BOUTON_SECONDAIRE}
                  onClick={() => ouvrir({ type: "production", article: l.article, sachets: l.sachets, fabrication: l.fabrication, emplacement: "marseille", note: "Production planifiée", retour: true })}
                >
                  Enregistrer
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className={`${DISCRET} mt-3`}>Pas d'enregistrement groupé sans matières : chaque lot garde sa traçabilité.</p>
    </Feuille>
  );
}
