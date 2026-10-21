/* Réglages › Production (lot 6) : taille des pâtées, durées des étapes, poste, congélateur et
   garnitures. Ce sont des réglages de savoir-faire : ils vivent dans l'onglet Production du
   classeur, jamais dans le code. On les saisit ici, ou on les colle depuis la maquette. */

import { FormEvent, useMemo, useState } from "react";
import { useAtelier, useEcriture } from "./contexte";
import { Badge, BOUTON_SECONDAIRE, CARTE, CHAMP, DISCRET, ETIQUETTE, Feuille, PiedFormulaire, TITRE_SECTION } from "./composants";
import { ErreurReglages, ETAPES_F, ETAPES_POSTE, ETAPES_V, lireReglagesTexte, rendement, validerReglages, type Reglages } from "./planification";
import { familleDe, NOM_FAMILLE, piecesParSachet, useProduction } from "./production";
import { articlesDe, lireNombre, nombre, slug } from "./outils";

const LIBELLES_V: Record<string, string> = {
  pesage: "Pesage",
  petrissage: "Pétrissage",
  faconnage: "Façonnage (boulage)",
  pointage: "Pointage",
  formage: "Formage : abaisse en rectangle",
  froid1: "Froid après le formage",
  tourage: "Tourage",
  froid2: "Froid après le tourage",
  abaisse: "Abaisse, division, façonnage",
  pousse: "Pousse",
  sachet: "Mise en sachet",
};
const LIBELLES_F: Record<string, string> = {
  pesage: "Pesage",
  frasage: "Frasage au pétrin",
  faconnage: "Façonnage",
  pointage: "Pointage",
  formage: "Formage : abaisse en rectangle",
  froid1: "Froid après le formage",
  tourage: "Tourage",
  froid2: "Froid après le tourage",
  abaisse: "Abaisse, division, garnissage",
  sachet: "Mise en sachet",
};
const LIBELLES_POSTE: Record<string, string> = { prep: "Préparation et nettoyage", rangement: "Rangement et nettoyage", nettoyage: "Nettoyage salé ↔ sucré" };

/* ===================================================================
   SECTION DE LA VUE RÉGLAGES
   =================================================================== */

export function SectionProduction() {
  const { ouvrir } = useAtelier();
  const { requete, reglages, erreurReglages } = useProduction();
  const aConfirmer = reglages ? Object.keys(reglages.todo).length + reglages.garn.filter((g) => g.todo).length : 0;
  return (
    <section className="mt-8">
      <h2 className={`${TITRE_SECTION} mb-2`}>Production</h2>
      <p className={`${DISCRET} mb-3`}>
        Taille des pâtées, durées des étapes, congélateur et garnitures, pour l'organigramme de l'onglet Production. Ils restent dans ton classeur, jamais dans le code du site.
      </p>
      <div className={`${CARTE} mb-3 px-3.5 py-3 text-[14.5px]`}>
        {requete.isLoading ? (
          <span className={DISCRET}>Lecture des réglages…</span>
        ) : requete.isError ? (
          <span className="font-bold text-[#B1262E]">{requete.error instanceof Error ? requete.error.message : "Réglages illisibles."}</span>
        ) : erreurReglages ? (
          <span className="font-bold text-[#B1262E]">Réglages enregistrés illisibles : {erreurReglages} Recolle-les depuis la maquette.</span>
        ) : reglages ? (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
              Limite à Marseille {nombre(reglages.seuil)} sachets · {reglages.congel.max} place{reglages.congel.max > 1 ? "s" : ""} au congélateur · {reglages.garn.length} garniture
              {reglages.garn.length > 1 ? "s" : ""}
            </span>
            {aConfirmer ? <Badge teinte="warn">{aConfirmer} à confirmer</Badge> : null}
          </span>
        ) : (
          <span className={DISCRET}>Pas encore de réglages : le plus simple est de les coller depuis la maquette.</span>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" className={BOUTON_SECONDAIRE} onClick={() => ouvrir({ type: "collerReglages" })}>
          Coller les réglages de la maquette
        </button>
        <button type="button" className={BOUTON_SECONDAIRE} onClick={() => ouvrir({ type: "reglagesProduction" })} disabled={requete.isLoading}>
          {reglages ? "Modifier les réglages" : "Saisir les réglages"}
        </button>
      </div>
    </section>
  );
}

/* ===================================================================
   COLLER LES RÉGLAGES DE LA MAQUETTE
   =================================================================== */

export function FormCollerReglages() {
  const { etat } = useAtelier();
  const [texte, setTexte] = useState("");
  const ecriture = useEcriture();
  const lecture = useMemo((): { r: Reglages | null; erreur: string } => {
    if (!texte.trim()) return { r: null, erreur: "" };
    try {
      return { r: lireReglagesTexte(texte.trim()), erreur: "" };
    } catch (e) {
      return { r: null, erreur: e instanceof ErreurReglages ? e.message : "Réglages illisibles." };
    }
  }, [texte]);
  const r = lecture.r;
  const produits = articlesDe(etat, "produit").filter((a) => familleDe(a.id));

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    if (!r) return ecriture.refuser(lecture.erreur || "Colle d'abord les réglages copiés depuis la maquette.");
    ecriture.envoyer("stock.production.reglages", { reglages: r });
  };

  return (
    <Feuille titre="Coller les réglages" pied={<PiedFormulaire formulaire="f-coller" libelle="Enregistrer ces réglages" {...ecriture} desactive={!r} />}>
      <form id="f-coller" onSubmit={envoyer} noValidate className="flex flex-col gap-4">
        <p className={DISCRET}>
          Dans la maquette « Stock Dedjo » : Production › Réglages de production › <b>Copier les réglages</b>. Colle-les ici : ils sont vérifiés, puis enregistrés dans ton classeur (les anciens restent dans l'historique de l'onglet Production).
        </p>
        <label className="grid gap-1.5">
          <span className={ETIQUETTE}>Réglages copiés</span>
          <textarea
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
            rows={6}
            spellCheck={false}
            autoComplete="off"
            placeholder='{"seuil": …, "congel": …, "v": …, "f": …, "poste": …, "garn": […]}'
            className={`${CHAMP} min-h-[140px] font-mono text-[12.5px]`}
          />
        </label>
        {lecture.erreur ? (
          <p className="text-[14px] font-bold text-[#B1262E]" role="alert">
            {lecture.erreur}
          </p>
        ) : null}
        {r ? (
          <div className={`${CARTE} grid gap-2 px-3.5 py-3 text-[14px]`}>
            <p className="font-bold text-[#2C7A4C]">Réglages lisibles. Aperçu :</p>
            <p>
              {r.garn.length} garniture{r.garn.length > 1 ? "s" : ""} · {r.congel.max} place{r.congel.max > 1 ? "s" : ""} au congélateur, mise en sachet {nombre(r.congel.heures)} h après · limite à Marseille{" "}
              {nombre(r.seuil)} sachets
              {Object.keys(r.todo).length + r.garn.filter((g) => g.todo).length ? ` · ${Object.keys(r.todo).length + r.garn.filter((g) => g.todo).length} valeur(s) à confirmer` : ""}
            </p>
            <ul className="grid gap-0.5 text-[13px] text-[#5E6A78]">
              {produits.map((a) => {
                const fam = familleDe(a.id);
                if (!fam) return null;
                const rd = rendement(r, a.id, fam, piecesParSachet(a));
                return (
                  <li key={a.id}>
                    {NOM_FAMILLE[fam]} · 1 pâtée de {a.nom} → {rd.pieces} pièces, {rd.sachets} sachets
                    {rd.reste ? ` + ${rd.reste}` : ""}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </form>
    </Feuille>
  );
}

/* ===================================================================
   FORMULAIRE COMPLET
   =================================================================== */

interface GarnitureSaisie {
  cle: number;
  id: string;
  nom: string;
  min: string;
  cuisson: boolean;
  froid: string;
  produits: string[];
  todo: boolean;
}

const enTexte = (n: number | undefined) => (n === undefined || n === null || !Number.isFinite(n) ? "" : String(n).replace(".", ","));

export function FormReglagesProduction() {
  const { etat } = useAtelier();
  const { reglages } = useProduction();
  const produits = articlesDe(etat, "produit", true).filter((a) => familleDe(a.id));
  const viennoiseries = produits.filter((a) => familleDe(a.id) === "v");
  const idsG = [...new Set([...viennoiseries.map((a) => a.id), ...Object.keys(reglages ? reglages.v.g : {})])];

  const [champs, setChamps] = useState<Record<string, string>>(() => {
    const r = reglages;
    const c: Record<string, string> = {
      seuil: enTexte(r?.seuil),
      "congel.max": enTexte(r?.congel.max),
      "congel.heures": enTexte(r?.congel.heures),
      "v.cap": enTexte(r?.v.cap),
      "v.gRef": enTexte(r?.v.gRef),
      "f.cap": enTexte(r?.f.cap),
    };
    idsG.forEach((id) => (c[`v.g.${id}`] = enTexte(r?.v.g[id])));
    ETAPES_V.forEach((k) => (c[`v.st.${k}`] = enTexte(r?.v.st[k])));
    ETAPES_F.forEach((k) => (c[`f.st.${k}`] = enTexte(r?.f.st[k])));
    ETAPES_POSTE.forEach((k) => (c[`poste.${k}`] = enTexte(r?.poste[k])));
    return c;
  });
  const [mainsLibres, setMainsLibres] = useState(reglages ? reglages.v.mainsLibres : true);
  const [touches, setTouches] = useState<Set<string>>(new Set());
  const [compteur, setCompteur] = useState(1000);
  const [garn, setGarn] = useState<GarnitureSaisie[]>(() =>
    (reglages ? reglages.garn : []).map((g, i) => ({ cle: i, id: g.id, nom: g.nom, min: enTexte(g.min), cuisson: g.fixe, froid: enTexte(g.froid), produits: g.produits, todo: !!g.todo }))
  );
  const ecriture = useEcriture();
  const todo = reglages ? reglages.todo : {};

  const changer = (cle: string, v: string) => {
    setChamps({ ...champs, [cle]: v.replace(/[^\d.,]/g, "") });
    if (!touches.has(cle)) setTouches(new Set([...touches, cle]));
  };
  const changerGarn = (cle: number, modif: Partial<GarnitureSaisie>) => setGarn(garn.map((g) => (g.cle === cle ? { ...g, ...modif, todo: false } : g)));

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    const n = (cle: string) => lireNombre(champs[cle] || "");
    const g: Record<string, number> = {};
    idsG.forEach((id) => {
      if ((champs[`v.g.${id}`] || "").trim()) g[id] = n(`v.g.${id}`);
    });
    const st = (prefixe: string, etapes: readonly string[]) => etapes.reduce<Record<string, number>>((o, k) => ({ ...o, [k]: n(`${prefixe}.${k}`) }), {});
    // Une valeur modifiée à la main n'est plus « à confirmer »
    const resteAConfirmer: Record<string, true> = {};
    Object.keys(todo).forEach((cle) => {
      if (!touches.has(cle)) resteAConfirmer[cle] = true;
    });
    const brut = {
      seuil: n("seuil"),
      congel: { max: n("congel.max"), heures: n("congel.heures") },
      v: { cap: n("v.cap"), gRef: n("v.gRef"), g, mainsLibres, st: st("v.st", ETAPES_V) },
      f: { cap: n("f.cap"), st: st("f.st", ETAPES_F) },
      poste: st("poste", ETAPES_POSTE),
      garn: garn
        .filter((x) => x.nom.trim())
        .map((x) => ({
          id: x.id || `${slug(x.nom)}-${Math.random().toString(36).slice(2, 6)}`,
          nom: x.nom.trim(),
          produits: x.produits,
          min: lireNombre(x.min),
          fixe: x.cuisson,
          feu: x.cuisson,
          froid: x.cuisson ? lireNombre(x.froid || "0") : 0,
          ...(x.todo ? { todo: true } : {}),
        })),
      todo: resteAConfirmer,
    };
    let r: Reglages;
    try {
      r = validerReglages(brut);
    } catch (err) {
      // Le message cite le chemin de la valeur (« v.cap ») : on le remplace par le libellé du champ
      const message = err instanceof ErreurReglages ? err.message.replace(/« ([^»]+) »/, (tout, chemin: string) => (etiquettes[chemin] ? `« ${etiquettes[chemin]} »` : tout)) : "Réglages invalides.";
      return ecriture.refuser(message);
    }
    ecriture.envoyer("stock.production.reglages", { reglages: r });
  };

  // Libellé de chaque champ, pour les messages de refus
  const etiquettes: Record<string, string> = {};
  const nIn = (cle: string, libelle: string, aConfirmer = false, aide?: string) => {
    etiquettes[cle] = libelle;
    return (
      <label key={cle} className="grid min-w-0 grid-rows-[1fr_auto] gap-1.5">
        <span className={`${ETIQUETTE} flex flex-wrap items-end gap-1.5 self-end`}>
          {libelle}
          {aConfirmer && !touches.has(cle) ? <Badge teinte="warn">à confirmer</Badge> : null}
        </span>
        <input inputMode="decimal" autoComplete="off" value={champs[cle] || ""} placeholder={aide} onChange={(e) => changer(cle, e.target.value)} className={CHAMP} />
      </label>
    );
  };
  const grille = "grid grid-cols-2 gap-3 sm:grid-cols-3";
  const legende = `${ETIQUETTE} mb-2`;

  return (
    <Feuille titre="Réglages de production" pied={<PiedFormulaire formulaire="f-reglages-production" libelle="Enregistrer les réglages" {...ecriture} />}>
      <form id="f-reglages-production" onSubmit={envoyer} noValidate className="flex flex-col gap-6">
        <fieldset className="grid min-w-0 gap-2">
          <legend className={legende}>Limite et congélateur</legend>
          <div className={grille}>
            {nIn("seuil", "Limite à Marseille (sachets)")}
            {nIn("congel.max", "Productions au congélateur à la fois (1 à 6)")}
            {nIn("congel.heures", "Congélation avant mise en sachet (h)")}
          </div>
          <p className={DISCRET}>Un produit est à renflouer quand son disponible à Marseille est inférieur ou égal à cette limite. Le seuil Marseille réglé sur un produit passe avant.</p>
        </fieldset>

        <fieldset className="grid min-w-0 gap-2">
          <legend className={legende}>Viennoiseries · une production</legend>
          <div className={grille}>
            {nIn("v.cap", "Pièces par pâtée")}
            {nIn("v.gRef", "Pâte par pièce de référence (g)")}
          </div>
          <div className={grille}>{idsG.map((id) => nIn(`v.g.${id}`, `${(etat.articles.find((a) => a.id === id) || { nom: id }).nom} (g)`, !!todo[`v.g.${id}`], "comme la référence"))}</div>
          <p className={DISCRET}>Une pâtée = pièces × pâte par pièce de référence. Chaque produit en tire autant de pièces que son poids de pâte le permet.</p>
          <label className="flex items-center gap-2.5 text-[15px]">
            <input type="checkbox" checked={mainsLibres} onChange={(e) => setMainsLibres(e.target.checked)} className="h-5 w-5 accent-[#163F6B]" />
            Pendant le pétrissage, j'ai les mains libres
          </label>
        </fieldset>

        <fieldset className="grid min-w-0 gap-2">
          <legend className={legende}>Viennoiseries · durées en minutes</legend>
          <div className={grille}>{ETAPES_V.map((k) => nIn(`v.st.${k}`, LIBELLES_V[k]))}</div>
          <p className={DISCRET}>Les froids sont des minimums ; pointage et pousse ont une durée fixe. Abaisse et mise en sachet : pour une production pleine.</p>
        </fieldset>

        <fieldset className="grid min-w-0 gap-2">
          <legend className={legende}>Feuilletés · une production</legend>
          <div className={grille}>{nIn("f.cap", "Pièces par pâtée")}</div>
        </fieldset>

        <fieldset className="grid min-w-0 gap-2">
          <legend className={legende}>Feuilletés · durées en minutes</legend>
          <div className={grille}>{ETAPES_F.map((k) => nIn(`f.st.${k}`, LIBELLES_F[k]))}</div>
        </fieldset>

        <fieldset className="grid min-w-0 gap-2">
          <legend className={legende}>Poste · durées en minutes</legend>
          <div className={grille}>{ETAPES_POSTE.map((k) => nIn(`poste.${k}`, LIBELLES_POSTE[k]))}</div>
        </fieldset>

        <fieldset className="grid min-w-0 gap-2">
          <legend className={legende}>Garnitures</legend>
          {garn.map((g) => (
            <div key={g.cle} className={`${CARTE} grid grid-cols-2 gap-2.5 p-3`}>
              <label className="col-span-2 grid gap-1.5">
                <span className={`${ETIQUETTE} flex flex-wrap items-center gap-1.5`}>
                  Préparation {g.todo ? <Badge teinte="warn">à confirmer</Badge> : null}
                </span>
                <input value={g.nom} autoComplete="off" onChange={(e) => changerGarn(g.cle, { nom: e.target.value })} className={CHAMP} />
              </label>
              <label className="grid gap-1.5">
                <span className={ETIQUETTE}>Durée (min)</span>
                <input inputMode="decimal" value={g.min} onChange={(e) => changerGarn(g.cle, { min: e.target.value.replace(/[^\d.,]/g, "") })} className={CHAMP} />
              </label>
              <label className="grid gap-1.5">
                <span className={ETIQUETTE}>Type</span>
                <select value={g.cuisson ? "c" : "d"} onChange={(e) => changerGarn(g.cle, { cuisson: e.target.value === "c" })} className={CHAMP}>
                  <option value="d">Découpe, au prorata</option>
                  <option value="c">Cuisson, durée fixe</option>
                </select>
              </label>
              {g.cuisson ? (
                <label className="grid gap-1.5">
                  <span className={ETIQUETTE}>Refroidir avant usage (min)</span>
                  <input inputMode="decimal" value={g.froid} onChange={(e) => changerGarn(g.cle, { froid: e.target.value.replace(/[^\d.,]/g, "") })} className={CHAMP} />
                </label>
              ) : null}
              <fieldset className="col-span-2 grid gap-1.5">
                <legend className={`${ETIQUETTE} mb-1.5`}>Pour</legend>
                <div className="flex flex-wrap gap-1.5">
                  {produits.map((a) => {
                    const coche = g.produits.includes(a.id);
                    return (
                      <label key={a.id} className={`flex min-h-10 cursor-pointer items-center rounded-full border px-3.5 text-[14px] font-bold ${coche ? "border-[#163F6B] bg-[#163F6B] text-[#FBF5E9]" : "border-[#E6DCC6] bg-[#FFFCF6]"}`}>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={coche}
                          onChange={(e) => changerGarn(g.cle, { produits: e.target.checked ? [...g.produits, a.id] : g.produits.filter((x) => x !== a.id) })}
                        />
                        {a.nom}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <button type="button" className="col-span-2 justify-self-start text-[14px] font-bold text-[#B1262E] underline underline-offset-4" onClick={() => setGarn(garn.filter((x) => x.cle !== g.cle))}>
                Retirer cette garniture
              </button>
            </div>
          ))}
          <button
            type="button"
            className={BOUTON_SECONDAIRE}
            onClick={() => {
              setGarn([...garn, { cle: compteur, id: "", nom: "", min: "", cuisson: false, froid: "", produits: [], todo: false }]);
              setCompteur(compteur + 1);
            }}
          >
            + Ajouter une préparation
          </button>
          <p className={DISCRET}>
            Découpe : durée pour une production pleine, au prorata des pièces. Cuisson : durée fixe sur le feu, puis refroidissement avant de garnir. Chaque production a ses propres garnitures, faites le jour même (la veille en deux temps).
          </p>
        </fieldset>
        <p className={DISCRET}>Les anciens réglages restent dans l'historique de l'onglet Production de ton classeur.</p>
      </form>
    </Feuille>
  );
}
