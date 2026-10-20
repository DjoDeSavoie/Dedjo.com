/* Vue Réglages : emplacements, articles (dont la réserve hors site et les codes lot), reprise du
   stock de la maquette, exports CSV pour le PMS, déconnexion. */

import { FormEvent, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { appeler, deconnecter, ErreurAtelier } from "./api";
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
  LIEN,
  LIGNE,
  Pastille,
  PiedFormulaire,
  TITRE_SECTION,
} from "./composants";
import { articlesDe, CATEGORIES, csv, EPS, GENRES, heure, jourIso, lireNombre, ordreSortie, qteLot, slug, telecharger, UNITES, unite } from "./outils";
import type { Article, Categorie, Emplacement, PageJournal } from "./types";

export default function VueReglages() {
  const { etat, ouvrir } = useAtelier();
  return (
    <>
      <section className="mt-5">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className={TITRE_SECTION}>Emplacements</h2>
          <button type="button" className={LIEN} onClick={() => ouvrir({ type: "emplacementEdition" })}>
            Ajouter
          </button>
        </div>
        <div className={`${CARTE} overflow-hidden`}>
          {etat.emplacements.map((e) => (
            <button key={e.id} type="button" onClick={() => ouvrir({ type: "emplacementEdition", id: e.id })} className={`${LIGNE} hover:bg-[#F3ECDD]`}>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-display text-[17px]">{e.nom}</span>
                <span className={DISCRET}>
                  {[e.precision, e.court !== e.nom ? `affiché « ${e.court} »` : "", e.site ? "compte pour le site" : ""].filter(Boolean).join(" · ")}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className={TITRE_SECTION}>Articles</h2>
          <button type="button" className={LIEN} onClick={() => ouvrir({ type: "articleEdition" })}>
            Ajouter
          </button>
        </div>
        {CATEGORIES.map((c) => {
          const articles = articlesDe(etat, c.id, true);
          if (!articles.length) return null;
          return (
            <div key={c.id}>
              <h3 className="mb-2 mt-5 font-display text-base font-semibold text-[#163F6B]">{c.nom}</h3>
              <div className={`${CARTE} overflow-hidden`}>
                {articles.map((a) => (
                  <button key={a.id} type="button" onClick={() => ouvrir({ type: "articleEdition", id: a.id })} className={`${LIGNE} hover:bg-[#F3ECDD]`}>
                    <span className="mt-1.5">
                      <Pastille article={a} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-display text-[17px]">{a.nom}</span>
                      <span className={DISCRET}>{resumeArticle(a)}</span>
                      {(a.categorie === "produit" && !a.codeConfirme) || !a.actif ? (
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {a.categorie === "produit" && !a.codeConfirme ? <Badge teinte="warn">Code lot à confirmer</Badge> : null}
                          {!a.actif ? <Badge teinte="mute">Masqué</Badge> : null}
                        </span>
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <Reprise />
      <Exports />
      <Session />
    </>
  );
}

function resumeArticle(a: Article): string {
  const p = [`en ${(UNITES.find((u) => u[0] === a.unite) || [a.unite, a.unite])[1]}`];
  if (a.categorie === "produit") {
    if (a.piecesParSachet) p.push(`${a.piecesParSachet} pièces / sachet`);
    if (a.codeLot) p.push(`code lot ${a.codeLot}`);
    p.push(a.conservationMois ? `DDM ${a.conservationMois} mois` : "DDM à définir");
    if (a.reserveHorsSite) p.push(`réserve hors site ${a.reserveHorsSite}`);
  }
  if (a.seuilMarseille) p.push(`seuil Marseille ${a.seuilMarseille}`);
  if (a.seuilFerme) p.push(`seuil ferme ${a.seuilFerme}`);
  return p.join(" · ");
}

/* ===================================================================
   ARTICLE
   =================================================================== */

const enTexte = (n: number | null) => (n === null || n === undefined ? "" : String(n));
const entierOuNull = (texte: string) => {
  const n = lireNombre(texte);
  return Number.isFinite(n) ? n : null;
};

export function FormArticle({ id }: { id?: string }) {
  const { etat, retour } = useAtelier();
  const a = id ? etat.articles.find((x) => x.id === id) : undefined;
  const [categorie, setCategorie] = useState<Categorie>(a ? a.categorie : "matiere");
  const [nom, setNom] = useState(a ? a.nom : "");
  const [uniteChoisie, setUnite] = useState(a ? a.unite : "kg");
  const [pieces, setPieces] = useState(enTexte(a ? a.piecesParSachet : null));
  const [codeLot, setCodeLot] = useState(a ? a.codeLot : "");
  const [codeConfirme, setCodeConfirme] = useState(a ? a.codeConfirme : false);
  const [conservation, setConservation] = useState(enTexte(a ? a.conservationMois : null));
  const [reserve, setReserve] = useState(enTexte(a ? a.reserveHorsSite : 0));
  const [seuilMarseille, setSeuilMarseille] = useState(enTexte(a ? a.seuilMarseille : 0));
  const [seuilFerme, setSeuilFerme] = useState(enTexte(a ? a.seuilFerme : 0));
  const [actif, setActif] = useState(a ? a.actif : true);
  const ecriture = useEcriture(() => retour());
  const produit = categorie === "produit";
  const avecStock = !!a && etat.lots.some((l) => l.article === a.id);

  const envoyer = (e: FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return ecriture.refuser("Donne un nom à l'article.");
    for (const [texte, quoi] of [
      [seuilMarseille, "Seuil Marseille"],
      [seuilFerme, "Seuil ferme"],
      [reserve, "Réserve hors site"],
      [pieces, "Pièces par sachet"],
      [conservation, "Conservation"],
    ]) {
      const n = lireNombre(texte);
      if (texte !== "" && (!Number.isInteger(n) || n < 0)) return ecriture.refuser(`${quoi} : nombre entier attendu.`);
    }
    let identifiant = a ? a.id : `${categorie === "matiere" ? "mp" : "emb"}-${slug(nom)}`;
    if (!a) {
      const base = identifiant;
      for (let i = 2; etat.articles.some((x) => x.id === identifiant); i++) identifiant = `${base}-${i}`;
    }
    const article: Record<string, unknown> = {
      id: identifiant,
      nom: nom.trim(),
      unite: uniteChoisie,
      seuilMarseille: entierOuNull(seuilMarseille) || 0,
      seuilFerme: entierOuNull(seuilFerme) || 0,
      actif,
    };
    if (!a) article.categorie = categorie;
    if (produit) {
      Object.assign(article, {
        piecesParSachet: entierOuNull(pieces),
        codeLot: codeLot.trim(),
        codeConfirme,
        conservationMois: entierOuNull(conservation),
        reserveHorsSite: entierOuNull(reserve) || 0,
      });
    }
    ecriture.envoyer("stock.catalogue", { articles: [article] });
  };

  const nombreChamp = (idChamp: string, libelle: string, valeur: string, changer: (v: string) => void, aide?: string) => (
    <Champ id={idChamp} libelle={libelle} aide={aide}>
      <input id={idChamp} inputMode="numeric" value={valeur} onChange={(e) => changer(e.target.value)} placeholder="0" className={CHAMP} />
    </Champ>
  );

  return (
    <Feuille titre={a ? "Modifier l'article" : "Nouvel article"} pied={<PiedFormulaire formulaire="f-article" libelle={a ? "Enregistrer" : "Ajouter l'article"} {...ecriture} />}>
      <form id="f-article" onSubmit={envoyer} noValidate className="flex flex-col gap-5">
        <Champ id="a-nom" libelle="Nom">
          <input id="a-nom" value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="off" className={CHAMP} />
        </Champ>
        {a ? (
          <p className={DISCRET}>
            {CATEGORIES.find((c) => c.id === a.categorie)?.nom} · identifiant <span className="font-mono">{a.id}</span>
          </p>
        ) : (
          <ChoixPuces<Categorie>
            legende="Catégorie"
            options={[
              { valeur: "matiere", libelle: "Matière première" },
              { valeur: "emballage", libelle: "Emballage" },
            ]}
            valeur={categorie}
            onChange={setCategorie}
          />
        )}
        <Champ id="a-unite" libelle="Unité de stock" aide={avecStock ? "L'unité ne change plus une fois du stock saisi." : undefined}>
          <select id="a-unite" value={uniteChoisie} onChange={(e) => setUnite(e.target.value)} disabled={avecStock} className={CHAMP}>
            {UNITES.map(([v, libelle]) => (
              <option key={v} value={v}>
                {libelle}
              </option>
            ))}
          </select>
        </Champ>
        {produit ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {nombreChamp("a-pieces", "Pièces par sachet", pieces, setPieces)}
              <Champ id="a-code" libelle="Code lot">
                <input id="a-code" value={codeLot} onChange={(e) => setCodeLot(e.target.value)} autoComplete="off" className={`${CHAMP} font-mono`} />
              </Champ>
            </div>
            <label className="flex min-h-11 items-center gap-2.5 text-[15px]">
              <input type="checkbox" checked={codeConfirme} onChange={(e) => setCodeConfirme(e.target.checked)} className="h-5 w-5 accent-[#163F6B]" />
              Code lot confirmé (celui des étiquettes)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {nombreChamp("a-conservation", "Conservation (mois)", conservation, setConservation)}
              {nombreChamp("a-reserve", "Réserve hors site", reserve, setReserve)}
            </div>
            <p className={`${DISCRET} -mt-3`}>
              Le n° de lot commence par le code, suivi de la date de fabrication et du mois de DDM ; la conservation calcule la DDM. La réserve hors site (en sachets) n'est jamais proposée sur le site : par exemple 10 Lune gardées pour la ferme.
            </p>
          </>
        ) : null}
        <fieldset className="grid min-w-0 gap-2">
          <legend className={`${ETIQUETTE} mb-2`}>Seuil d'alerte</legend>
          <div className="grid grid-cols-2 gap-3">
            {nombreChamp("a-seuil-m", "Marseille", seuilMarseille, setSeuilMarseille)}
            {nombreChamp("a-seuil-f", "Ferme", seuilFerme, setSeuilFerme)}
          </div>
          <p className={DISCRET}>Une alerte s'affiche quand le stock passe sous ce nombre (0 : pas d'alerte).</p>
        </fieldset>
        <label className="flex min-h-11 items-center gap-2.5 text-[15px]">
          <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} className="h-5 w-5 accent-[#163F6B]" />
          Proposer cet article dans les saisies
        </label>
      </form>
    </Feuille>
  );
}

/* ===================================================================
   EMPLACEMENT
   =================================================================== */

export function FormEmplacement({ id }: { id?: string }) {
  const { etat, retour } = useAtelier();
  const e = id ? etat.emplacements.find((x) => x.id === id) : undefined;
  const [nom, setNom] = useState(e ? e.nom : "");
  const [court, setCourt] = useState(e ? e.court : "");
  const [precision, setPrecision] = useState(e ? e.precision : "");
  const [site, setSite] = useState(e ? e.site : false);
  const ecriture = useEcriture(() => retour());
  const route = id === "route";

  const envoyer = (ev: FormEvent) => {
    ev.preventDefault();
    if (!nom.trim()) return ecriture.refuser("Donne un nom à l'emplacement.");
    const identifiant = e ? e.id : slug(nom).slice(0, 30);
    if (!e && etat.emplacements.some((x) => x.id === identifiant)) return ecriture.refuser("Un emplacement porte déjà ce nom.");
    const emplacement: Partial<Emplacement> = { id: identifiant, nom: nom.trim(), court: court.trim() || nom.trim().slice(0, 20), precision: precision.trim(), site: route ? false : site };
    ecriture.envoyer("stock.catalogue", { emplacements: [emplacement] });
  };

  return (
    <Feuille titre={e ? "Modifier l'emplacement" : "Nouvel emplacement"} pied={<PiedFormulaire formulaire="f-emplacement" libelle={e ? "Enregistrer" : "Ajouter l'emplacement"} {...ecriture} />}>
      <form id="f-emplacement" onSubmit={envoyer} noValidate className="flex flex-col gap-5">
        <Champ id="e-nom" libelle="Nom">
          <input id="e-nom" value={nom} onChange={(x) => setNom(x.target.value)} autoComplete="off" placeholder="Ex. Ferme de la Goëttaz" className={CHAMP} />
        </Champ>
        <Champ id="e-court" libelle="Nom court" aide="Affiché sur les boutons et dans les listes (20 caractères au plus).">
          <input id="e-court" value={court} onChange={(x) => setCourt(x.target.value)} maxLength={20} autoComplete="off" placeholder="Ex. Ferme" className={CHAMP} />
        </Champ>
        <Champ id="e-precision" libelle="Précision">
          <input id="e-precision" value={precision} onChange={(x) => setPrecision(x.target.value)} autoComplete="off" placeholder="Ex. congélateur du magasin" className={CHAMP} />
        </Champ>
        <label className="flex min-h-11 items-center gap-2.5 text-[15px]">
          <input type="checkbox" checked={site && !route} disabled={route} onChange={(x) => setSite(x.target.checked)} className="h-5 w-5 accent-[#163F6B]" />
          Compte pour la disponibilité sur le site
        </label>
        {route ? <p className={`${DISCRET} -mt-3`}>Un envoi en cours ne compte jamais pour le site.</p> : null}
      </form>
    </Feuille>
  );
}

/* ===================================================================
   REPRISE DU STOCK DE LA MAQUETTE
   =================================================================== */

function Reprise() {
  const [texte, setTexte] = useState("");
  const [forcer, setForcer] = useState(false);
  const fichier = useRef<HTMLInputElement>(null);
  const ecriture = useEcriture(() => {
    setTexte("");
    setForcer(false);
    if (fichier.current) fichier.current.value = "";
  });
  const lignes = texte.split(/\r?\n/).filter((l) => l.trim()).length;
  const dejaImportee = /déjà été importée/.test(ecriture.erreur);

  const lire = async (f: File | undefined) => {
    if (!f) return;
    setTexte(await f.text());
  };

  const importer = (e: FormEvent) => {
    e.preventDefault();
    if (lignes < 2) return ecriture.refuser("Colle le contenu du fichier « Stock par lot », ou choisis le fichier.");
    ecriture.envoyer("stock.import", { csv: texte, forcer });
  };

  return (
    <section className="mt-8">
      <h2 className={`${TITRE_SECTION} mb-2`}>Reprise du stock</h2>
      <form onSubmit={importer} noValidate className={`${CARTE} grid gap-3 p-3.5`}>
        <p className={DISCRET}>
          Importe le fichier « Stock par lot » exporté par l'ancienne app (séparateur point-virgule). Les articles sont reconnus par leur nom. Chaque ligne devient une entrée « Reprise » du journal.
        </p>
        <input
          ref={fichier}
          type="file"
          accept=".csv,text/csv,text/plain"
          aria-label="Fichier CSV « Stock par lot »"
          onChange={(e) => lire(e.target.files ? e.target.files[0] : undefined)}
          className="text-[14px] file:mr-3 file:min-h-11 file:rounded-[10px] file:border file:border-[#E6DCC6] file:bg-[#FFFCF6] file:px-4 file:font-bold file:text-[#163F6B]"
        />
        <textarea
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={4}
          placeholder="…ou colle ici le contenu du fichier"
          aria-label="Contenu du fichier CSV"
          className={`${CHAMP} font-mono text-[13px]`}
        />
        {dejaImportee ? (
          <label className="flex min-h-11 items-center gap-2.5 text-[15px]">
            <input type="checkbox" checked={forcer} onChange={(e) => setForcer(e.target.checked)} className="h-5 w-5 accent-[#163F6B]" />
            Ajouter quand même une seconde reprise
          </label>
        ) : null}
        {ecriture.erreur ? (
          <p role="alert" className="text-[14px] font-bold text-[#B1262E]">
            {ecriture.erreur}
          </p>
        ) : null}
        <button type="submit" disabled={ecriture.envoi || lignes < 2 || (dejaImportee && !forcer)} className={BOUTON_PRINCIPAL}>
          {ecriture.envoi ? "Import…" : ecriture.reseau ? "Réessayer" : lignes >= 2 ? `Importer ${lignes - 1} ligne${lignes > 2 ? "s" : ""}` : "Importer"}
        </button>
      </form>
    </section>
  );
}

/* ===================================================================
   EXPORTS CSV
   =================================================================== */

function Exports() {
  const { etat, notifier, sessionTerminee } = useAtelier();
  const [journalEnCours, setJournalEnCours] = useState(false);
  const nomEmplacement = (id: string) => etat.emplacements.find((e) => e.id === id)?.nom || id;
  const articleDe = (id: string) => etat.articles.find((a) => a.id === id);

  const exporterStock = () => {
    const ordre = CATEGORIES.map((c) => c.id);
    const lignes: (string | number)[][] = [["Catégorie", "Article", "N° de lot", "Fabrication / réception", "DDM / date limite", "Fournisseur", "Emplacement", "Quantité", "Unité"]];
    etat.lots
      .filter((l) => qteLot(l, "tout") > EPS)
      .sort((x, y) => ordre.indexOf(x.categorie) - ordre.indexOf(y.categorie) || (articleDe(x.article)?.nom || "").localeCompare(articleDe(y.article)?.nom || "", "fr") || ordreSortie(x, y))
      .forEach((l) => {
        const a = articleDe(l.article);
        Object.entries(l.quantites)
          .filter(([, q]) => q > EPS)
          .forEach(([e, q]) =>
            lignes.push([CATEGORIES.find((c) => c.id === l.categorie)?.nom || "", a ? a.nom : l.article, l.numero, l.fabrication, l.ddm, l.fournisseur, nomEmplacement(e), q, unite(a, q)])
          );
      });
    telecharger(`stock-dedjo-${jourIso(Date.now())}.csv`, csv(lignes));
  };

  /** Journal complet, page par page, du plus ancien au plus récent. */
  const exporterJournal = async () => {
    setJournalEnCours(true);
    try {
      const operations: PageJournal["operations"] = [];
      for (let page = 1, pages = 1; page <= pages; page++) {
        const r = await appeler<PageJournal>("stock.journal", { page, parPage: 100 });
        operations.push(...r.operations);
        pages = r.pages;
      }
      const lignes: (string | number)[][] = [["Date", "Heure", "Opération", "Motif", "Article", "N° de lot", "Emplacement", "Quantité", "Unité", "Note", "Annulé"]];
      operations.reverse().forEach((o) =>
        o.lignes.forEach((l) => {
          const a = articleDe(l.article);
          lignes.push([jourIso(o.horodatage), heure(o.horodatage), GENRES[o.genre] || o.genre, l.motif, a ? a.nom : l.article, l.numero, nomEmplacement(l.emplacement), l.quantite, unite(a, l.quantite), o.note, l.annule ? "oui" : ""]);
        })
      );
      telecharger(`journal-stock-dedjo-${jourIso(Date.now())}.csv`, csv(lignes));
    } catch (e) {
      if (e instanceof ErreurAtelier && e.statut === 401) sessionTerminee();
      notifier(e instanceof Error ? e.message : "Export impossible.", true);
    } finally {
      setJournalEnCours(false);
    }
  };

  return (
    <section className="mt-8">
      <h2 className={`${TITRE_SECTION} mb-2`}>Exporter</h2>
      <div className="flex gap-2">
        <button type="button" className={`${BOUTON_SECONDAIRE} flex-1`} onClick={exporterStock}>
          Stock par lot
        </button>
        <button type="button" className={`${BOUTON_SECONDAIRE} flex-1`} onClick={exporterJournal} disabled={journalEnCours}>
          {journalEnCours ? "Export…" : "Journal"}
        </button>
      </div>
      <p className={`${DISCRET} mt-2`}>Fichiers CSV qui s'ouvrent dans Excel (séparateur point-virgule), pour ton PMS ou tes comptes.</p>
    </section>
  );
}

/* ===================================================================
   SESSION
   =================================================================== */

function Session() {
  const { etat, sessionTerminee, notifier } = useAtelier();
  const client = useQueryClient();
  const [envoi, setEnvoi] = useState(false);
  const sortir = async () => {
    setEnvoi(true);
    try {
      await deconnecter();
    } catch (e) {
      if (!(e instanceof ErreurAtelier && e.statut === 401)) {
        notifier(e instanceof Error ? e.message : "Déconnexion impossible.", true);
        setEnvoi(false);
        return;
      }
    }
    client.removeQueries({ queryKey: ["atelier"] });
    sessionTerminee();
  };
  return (
    <section className="mb-4 mt-8">
      <h2 className={`${TITRE_SECTION} mb-2`}>Cet appareil</h2>
      <p className={`${DISCRET} mb-3`}>
        Disponibilités du site : {etat.actif ? "calculées depuis le stock de Marseille." : "pas encore reliées au stock (STOCK_ACTIF absent)."} Pour déconnecter tous les appareils d'un coup, change{" "}
        <span className="font-mono">STOCK_SESSION_SECRET</span> sur Netlify, puis redéploie.
      </p>
      <button type="button" className={`${BOUTON_SECONDAIRE} w-full`} onClick={sortir} disabled={envoi}>
        {envoi ? "Déconnexion…" : "Se déconnecter de cet appareil"}
      </button>
    </section>
  );
}
