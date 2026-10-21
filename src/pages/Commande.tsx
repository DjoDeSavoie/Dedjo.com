import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import AdresseAutocomplete from "@/components/AdresseAutocomplete";
import ProductLabelModal from "@/components/ProductLabelModal";
import ProductTags, { StatutProduit, Tampons } from "@/components/ProductTags";
import LivraisonJauge from "@/components/LivraisonJauge";
import { useCart } from "@/context/CartContext";
import { CLE_DISPONIBILITE, useDisponibilite } from "@/hooks/useDisponibilite";
import { useQueryClient } from "@tanstack/react-query";
import { AdresseLivraison, CommandePayload, envoyerCommande } from "@/lib/commande";
import {
  CONFIG,
  VIENNOISERIES,
  FEUILLETES,
  JOURS_SEMAINE,
  MOYENS_PAIEMENT,
  PRIX_SACHET,
  SECTEURS,
  Product,
  eur,
  pluralize,
} from "@/lib/catalog";
import { CGV_VERSION, DUREE_CONSERVATION_MENTIONS, EDITEUR, LIENS_LEGAUX } from "@/lib/legal";

const GRAD = "linear-gradient(135deg,#185FA5 0%,#2A7FD0 100%)";
const RAPPEL_CONGELE = "Tout est livré congelé, à conserver au congélateur, et cuire en direct dans ton four.";
const SECTEUR_LIVRAISON = SECTEURS.find((s) => s.livraison)!;
const SEUIL_LIVRAISON = pluralize(CONFIG.livraisonOfferteDes, "sachet", "sachets");
const lienClass = "font-semibold text-[#185FA5] underline underline-offset-2 hover:text-[#2A7FD0]";

/** « samedi 18 octobre » */
const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

/** Les prochaines dates (AAAA-MM-JJ) qui tombent le `jour` voulu, au moins CONFIG.leadDays jours après aujourd'hui. */
const prochainesDates = (jour: number, nombre = 6): string[] => {
  const premier = new Date();
  premier.setHours(12, 0, 0, 0);
  premier.setDate(premier.getDate() + CONFIG.leadDays);
  premier.setDate(premier.getDate() + ((jour - premier.getDay() + 7) % 7));
  return Array.from({ length: nombre }, (_, i) => {
    const d = new Date(premier);
    d.setDate(premier.getDate() + 7 * i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
};

interface FormState {
  secteur: string;
  date: string;
  prenom: string;
  nom: string;
  tel: string;
  email: string;
  message: string;
  /** Champ piège anti-spam, invisible : rempli uniquement par les robots. */
  website: string;
}

type EtatEnvoi = "repos" | "envoi" | "succes" | "erreur";

type Group = "vienno" | "friand";

/** Les onglets de la commande, dans l'ordre. */
type Etape = 1 | 2 | 3;
const ETAPES: { numero: Etape; titre: string }[] = [
  { numero: 1, titre: "Tes produits" },
  { numero: 2, titre: "Où je te retrouve" },
  { numero: 3, titre: "Tes coordonnées" },
];

/** « 2 sachets · 12 pièces » */
const sachetsLabel = (p: Product, qty: number) =>
  `${pluralize(qty, "sachet", "sachets")} · ${qty * p.pieces} ${p.unit}`;

const Commande = () => {
  const {
    vienno,
    friand,
    addVienno,
    addFriand,
    viennoSachets,
    friandSachets,
    totalSachets,
    viennoTotal,
    friandTotal,
    total,
    clear,
  } = useCart();
  const { statut } = useDisponibilite();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormState>({
    secteur: "",
    date: "",
    prenom: "",
    nom: "",
    tel: "",
    email: "",
    message: "",
    website: "",
  });
  const [adresse, setAdresse] = useState<AdresseLivraison | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState<EtatEnvoi>("repos");
  const [erreurEnvoi, setErreurEnvoi] = useState("");
  const [numero, setNumero] = useState("");
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cgvAcceptees, setCgvAcceptees] = useState(false);
  const [etape, setEtape] = useState<Etape>(1);

  const errorsRef = useRef<HTMLDivElement>(null);
  const recapRef = useRef<HTMLDivElement>(null);
  const ongletsRef = useRef<HTMLElement>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const secteur = SECTEURS.find((s) => s.id === form.secteur);
  const isLivraison = secteur?.livraison ?? false;
  const dates = useMemo(() => (secteur ? prochainesDates(secteur.jour) : []), [secteur]);
  const livraisonOfferte = totalSachets >= CONFIG.livraisonOfferteDes;
  const fraisLivraison = isLivraison && totalSachets > 0 && !livraisonOfferte ? CONFIG.fraisLivraison : 0;
  const totalAPayer = total + fraisLivraison;
  const sachetsManquants = Math.max(0, CONFIG.livraisonOfferteDes - totalSachets);

  // Changer de secteur change le jour possible : on vide la date choisie
  const choisirSecteur = (id: string) => setForm((f) => ({ ...f, secteur: id, date: "" }));

  const openInfo = (p: Product) => {
    setModalProduct(p);
    setModalOpen(true);
  };

  /* ---------- Validation, onglet par onglet ---------- */
  const erreursEtape = (n: Etape): string[] => {
    const errs: string[] = [];
    if (n === 1) {
      if (totalSachets === 0) errs.push("Ajoute au moins un sachet à ta commande.");
    } else if (n === 2) {
      if (!secteur) errs.push("Choisis ton secteur : Savoie ou Marseille et alentours.");
      if (isLivraison && !adresse)
        errs.push("Choisis ton adresse de livraison dans les suggestions (ou saisis-la à la main avec son code postal).");
      if (!form.date) errs.push(isLivraison ? "Choisis ta date de livraison." : "Choisis ta date de retrait.");
    } else {
      // Même règle que le script (apps-script/Code.gs, nomPropre) : lettres, espaces, ' et - uniquement
      const nomValide = /^[\p{L}\p{M} '’-]+$/u;
      if (!form.prenom.trim()) errs.push("Indique ton prénom.");
      else if (!nomValide.test(form.prenom.trim()))
        errs.push("Prénom : utilise uniquement des lettres, espaces, apostrophes ou traits d'union.");
      if (!form.nom.trim()) errs.push("Indique ton nom.");
      else if (!nomValide.test(form.nom.trim()))
        errs.push("Nom : utilise uniquement des lettres, espaces, apostrophes ou traits d'union.");
      if (!form.tel.trim()) errs.push("Indique ton téléphone.");
      if (!form.email.trim()) errs.push("Indique ton email : je t'y envoie le récapitulatif de ta commande.");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.push("Vérifie ton email : il semble incomplet.");
      if (!cgvAcceptees) errs.push("Coche la case pour accepter les CGV.");
    }
    return errs;
  };

  const showErrors = (errs: string[]): boolean => {
    setErrors(errs);
    if (errs.length > 0) {
      setTimeout(() => errorsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return true;
    }
    return false;
  };

  /* ---------- Navigation entre les onglets ---------- */
  const afficherEtape = (n: Etape) => {
    setEtape(n);
    setErrors([]);
    setTimeout(() => ongletsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  /**
   * Va à l'onglet `n` : en arrière, toujours possible ; en avant, seulement si les onglets
   * précédents sont complets. Sinon, ouvre le premier onglet incomplet avec ses erreurs.
   * Renvoie true si l'onglet `n` est atteint.
   */
  const allerA = (n: Etape): boolean => {
    if (n < etape) {
      afficherEtape(n);
      return true;
    }
    for (const k of ETAPES.map((e) => e.numero).filter((k) => k < n)) {
      const errs = erreursEtape(k);
      if (errs.length > 0) {
        if (k !== etape) afficherEtape(k);
        showErrors(errs);
        return false;
      }
    }
    if (n !== etape) afficherEtape(n);
    return true;
  };

  const etapeSuivante = () => {
    if (etape < 3) allerA((etape + 1) as Etape);
  };

  /* ---------- Envoi de la commande ---------- */
  const construirePayload = (): CommandePayload => ({
    website: form.website,
    secteur: form.secteur,
    date: form.date,
    client: {
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      tel: form.tel.trim(),
      email: form.email.trim(),
    },
    adresse: isLivraison ? adresse : null,
    message: form.message.trim(),
    quantites: Object.fromEntries([...Object.entries(vienno), ...Object.entries(friand)].filter(([, q]) => q > 0)),
    cgvAcceptees,
    cgvVersion: CGV_VERSION,
  });

  /** Message prérempli pour WhatsApp, proposé en secours si l'envoi échoue. */
  const resumeSecours = () => {
    const produits = [...VIENNOISERIES, ...FEUILLETES]
      .filter((p) => (vienno[p.id] ?? friand[p.id] ?? 0) > 0)
      .map((p) => `${vienno[p.id] ?? friand[p.id]}× ${p.name}`)
      .join(", ");
    const quand = form.date ? `, ${isLivraison ? "livraison" : "retrait"} le ${formatDate(form.date)}` : "";
    return `Bonjour, je n'arrive pas à valider ma commande sur le site : ${produits} (${eur(totalAPayer)})${quand}. ${form.prenom} ${form.nom}`.trim();
  };

  const validerCommande = async () => {
    if (envoi === "envoi") return; // pas de double envoi
    // Onglets 1 et 2 complets (sinon on y retourne), puis l'onglet 3
    if (!allerA(3) || showErrors(erreursEtape(3))) return;
    setEnvoi("envoi");
    setErreurEnvoi("");
    const resultat = await envoyerCommande(construirePayload());
    if (resultat.ok) {
      setNumero(resultat.id);
      setEnvoi("succes");
      setCgvAcceptees(false); // chaque commande demande une nouvelle acceptation
      clear();
      setTimeout(() => recapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } else {
      setErreurEnvoi(resultat.error);
      setEnvoi("erreur");
      // Un produit refusé faute de stock passe à « victime » : le panier se met à jour
      queryClient.invalidateQueries({ queryKey: CLE_DISPONIBILITE });
    }
  };

  const nouvelleCommande = () => {
    setEnvoi("repos");
    setNumero("");
    setErrors([]);
    setEtape(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------- Rendu d'une carte produit ----------
     (fonction de rendu et non composant : les boutons ne sont pas recréés
      à chaque clic, le focus clavier est conservé) */
  const renderCard = (p: Product, group: Group) => {
    const count = group === "vienno" ? vienno[p.id] : friand[p.id];
    const add = group === "vienno" ? addVienno : addFriand;
    return (
      <div
        key={p.id}
        className={`relative bg-card rounded-2xl shadow-soft p-4 ${p.labels?.length ? "pt-7" : ""} flex flex-col gap-3 border-t-4`}
        style={{ borderTopColor: p.color }}
      >
        <Tampons product={p} />
        <div className="flex items-center gap-3">
          <span
            className="w-9 h-9 rounded-full flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: p.color }}
          >
            {p.emoji}
          </span>
          <div>
            <h3 className="text-foreground">
              {p.name}
            </h3>
            {p.type && <p className="text-xs text-muted-foreground">{p.type}</p>}
            <p className="text-xs font-bold text-[#185FA5]">
              Sachet de {p.pieces} {p.unit} · {eur(p.price)}
            </p>
            <ProductTags product={p} className="mt-1.5" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-auto">
          {statut(p.id) !== "disponible" ? (
            <StatutProduit statut={statut(p.id)} />
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => add(p.id, -1)}
                disabled={count <= 0}
                aria-label={`Retirer un sachet de ${p.name}`}
                className="w-9 h-9 rounded-xl border-2 border-border bg-white text-[#185FA5] font-bold text-xl leading-none transition hover:border-[#2A7FD0] hover:bg-[#eef5fc] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                −
              </button>
              <span
                className="min-w-[28px] text-center font-bold text-lg"
                aria-live="polite"
              >
                {count}
              </span>
              <button
                type="button"
                onClick={() => add(p.id, 1)}
                aria-label={`Ajouter un sachet de ${p.name}`}
                className="w-9 h-9 rounded-xl border-2 border-border bg-white text-[#185FA5] font-bold text-xl leading-none transition hover:border-[#2A7FD0] hover:bg-[#eef5fc]"
              >
                +
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => openInfo(p)}
            className="text-sm font-bold text-[#185FA5] underline underline-offset-2 hover:text-[#2A7FD0] text-right"
          >
            Voir les infos de la création
          </button>
        </div>
      </div>
    );
  };

  /* ---------- Lignes du récap ---------- */
  const renderRecapLines = (products: Product[], counts: Record<string, number>) =>
    products
      .filter((p) => counts[p.id] > 0)
      .map((p) => (
        <li key={p.id} className="flex justify-between gap-3 py-1.5 border-b border-dashed border-border text-sm">
          <span>
            {p.emoji} {p.name}{" "}
            <span className="text-muted-foreground">· {sachetsLabel(p, counts[p.id])}</span>
          </span>
          <span className="whitespace-nowrap">{eur(counts[p.id] * p.price)}</span>
        </li>
      ));

  const inputClass =
    "w-full px-3.5 py-3 border-2 border-border rounded-xl bg-white text-foreground text-base focus:outline-none focus:border-[#2A7FD0] transition-colors";
  const choiceClass = (sel: boolean) =>
    `flex-1 min-w-[200px] border-2 rounded-2xl px-3.5 py-3 cursor-pointer flex gap-2.5 items-start transition ${
      sel ? "border-[#2A7FD0] bg-[#eef5fc]" : "border-border bg-white hover:border-[#2A7FD0]"
    }`;
  const sectionTitle = "text-2xl font-bold text-foreground";

  const totalStr = totalAPayer > 0 ? eur(totalAPayer) : "—";

  /* ---------- Onglets : 1 produits, 2 lieu et date, 3 coordonnées et validation ---------- */
  const renderOnglets = () => (
    <nav ref={ongletsRef} aria-label="Étapes de la commande" className="my-6 scroll-mt-24">
      <ol className="grid grid-cols-3 gap-2">
        {ETAPES.map(({ numero, titre }) => {
          const actif = etape === numero;
          const fait = numero < etape;
          return (
            <li key={numero}>
              <button
                type="button"
                onClick={() => allerA(numero)}
                aria-current={actif ? "step" : undefined}
                aria-label={`Étape ${numero} sur ${ETAPES.length} : ${titre}${fait ? " (complète)" : ""}`}
                className={`w-full h-full rounded-2xl border-2 px-2 py-2.5 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left transition ${
                  actif ? "border-[#2A7FD0] bg-[#eef5fc]" : "border-border bg-white hover:border-[#2A7FD0]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                    actif || fait ? "text-white" : "bg-[#eef5fc] text-[#185FA5]"
                  }`}
                  style={actif || fait ? { backgroundImage: GRAD } : undefined}
                >
                  {fait ? <Check className="w-4 h-4" /> : numero}
                </span>
                <span className={`text-xs sm:text-sm font-bold leading-tight ${actif ? "text-[#185FA5]" : "text-foreground"}`}>
                  {titre}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );

  const renderErreurs = () =>
    errors.length > 0 && (
      <div
        ref={errorsRef}
        role="alert"
        className="mt-3.5 bg-[#fdecea] border-2 border-[#f5c2bd] text-[#a4291c] rounded-xl px-3.5 py-3 text-sm"
      >
        <strong>Il manque quelques infos :</strong>
        <ul className="mt-1.5 pl-5 list-disc">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    );

  /** Boutons « Retour » et « Suivant » des onglets 1 et 2. */
  const renderNavigation = () => (
    <div className="my-8">
      {renderErreurs()}
      <div className="mt-4 flex items-center justify-between gap-3">
        {etape > 1 ? (
          <button
            type="button"
            onClick={() => afficherEtape((etape - 1) as Etape)}
            className="rounded-2xl px-4 py-3 font-semibold border-2 border-border bg-white hover:border-[#2A7FD0]"
          >
            ← Retour
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={etapeSuivante}
          className="rounded-2xl px-5 py-3 font-bold text-white text-right transition hover:-translate-y-0.5 hover:shadow-hover"
          style={{ backgroundImage: GRAD }}
        >
          Suivant : {ETAPES[etape].titre.toLowerCase()} →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-36">
      <Navbar />

      {/* En-tête */}
      <header className="pt-24 pb-7 px-4 text-white" style={{ backgroundImage: GRAD }}>
        <div className="container max-w-3xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au site
          </Link>
          <h1 className="text-3xl font-bold">Commander</h1>
          <p className="mt-2 text-white/95">
            Choisis tes sachets, dis-moi où je te retrouve, puis envoie-moi ta commande : rien à payer en ligne, tu règles quand tu la récupères.
          </p>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4">
        {/* Rappel congelé */}
        <div className="flex gap-3 items-center bg-[#eaf3fb] border border-[#cfe3f6] text-[#16527f] rounded-2xl px-4 py-3 my-6 text-sm">
          <span className="text-xl leading-none">❄️</span>
          <p>{RAPPEL_CONGELE}</p>
        </div>

        {envoi === "succes" ? (
          <section ref={recapRef} className="my-8 scroll-mt-24">
            <div role="status" className="bg-card rounded-2xl shadow-soft p-6 text-center border-2 border-[#cfe3f6]">
              <CheckCircle2 className="w-12 h-12 mx-auto text-[#2A7FD0]" aria-hidden="true" />
              <h2 className="text-2xl font-bold mt-3">C'est reçu !</h2>
              <p className="mt-2 text-foreground">
                Je te recontacte rapidement sur WhatsApp pour confirmer le créneau : ta commande devient ferme à ce moment-là.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                N° de commande : <strong className="text-foreground">{numero}</strong>
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link to="/" className="rounded-xl px-4 py-2.5 font-semibold text-white" style={{ backgroundImage: GRAD }}>
                  Retour au site
                </Link>
                <button type="button" onClick={nouvelleCommande} className="rounded-xl px-4 py-2.5 font-semibold border-2 border-border hover:border-[#2A7FD0]">
                  Nouvelle commande
                </button>
              </div>
            </div>
          </section>
        ) : (
        <>
        {renderOnglets()}

        {/* ===== Onglet 1 : les produits ===== */}
        {etape === 1 && (
        <>
        {/* Viennoiseries */}
        <section className="my-8">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-2xl">🥐</span>
            <h2 className={sectionTitle}>Les viennoiseries</h2>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            Vendues en sachet, <strong>{eur(PRIX_SACHET)} le sachet</strong>. Compose ton panier comme tu veux, autant de sachets de chaque création.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {VIENNOISERIES.map((p) => renderCard(p, "vienno"))}
          </div>
        </section>

        {/* Feuilletés */}
        <section className="my-8">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-2xl">🥧</span>
            <h2 className={sectionTitle}>Les feuilletés salés</h2>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            De gros friands feuilletés, garnis à la main. Chaque sachet contient {FEUILLETES[0].pieces} {FEUILLETES[0].unit} de la même gamme, pour <strong>{eur(PRIX_SACHET)}</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {FEUILLETES.map((p) => renderCard(p, "friand"))}
          </div>
        </section>

        {/* Pizzas (mention) */}
        <section className="my-8">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-2xl">🍕</span>
            <h2 className={sectionTitle}>Les pizzas du vendredi</h2>
          </div>
          <div className="bg-card rounded-2xl shadow-soft p-4 flex gap-3.5 items-start border-l-4 border-[#F5C842]">
            <span className="text-3xl leading-none">🔥</span>
            <p className="text-foreground text-sm leading-relaxed">
              Mes pizzas au feu de bois, c'est <strong>uniquement sur place</strong>, les vendredis dédiés à la Ferme de la Goëttaz. <strong>À commander sur place</strong> — on se retrouve là-bas, on garnit, on enfourne. À très vite !
            </p>
          </div>
        </section>
        </>
        )}

        {/* ===== Onglet 2 : où je te retrouve ===== */}
        {etape === 2 && (
        <section className="my-8">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-2xl">📍</span>
            <h2 className={sectionTitle}>Où je te retrouve ?</h2>
          </div>

          <fieldset className="mb-4">
            <legend className="block font-bold mb-1.5 text-sm">
              Ton secteur <span className="text-destructive">*</span>
            </legend>
            <div className="flex gap-2.5 flex-wrap">
              {SECTEURS.map((s) => (
                <label key={s.id} className={choiceClass(form.secteur === s.id)}>
                  <input
                    type="radio"
                    name="secteur"
                    value={s.id}
                    checked={form.secteur === s.id}
                    onChange={() => choisirSecteur(s.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-bold block">{s.nom}</span>
                    <span className="text-sm text-muted-foreground">
                      {s.detail}
                      {s.livraison && (
                        <strong className="block text-foreground/80">
                          Livraison {eur(CONFIG.fraisLivraison)}, offerte dès {CONFIG.livraisonOfferteDes} sachets.
                        </strong>
                      )}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {isLivraison && (
            <div className="mb-4">
              <label htmlFor="address" className="block font-bold mb-1.5 text-sm">
                Ton adresse de livraison <span className="text-destructive">*</span>
              </label>
              <AdresseAutocomplete id="address" value={adresse} onChange={setAdresse} inputClass={inputClass} />
              <p className="mt-1.5 text-xs text-muted-foreground">
                L'aide à la saisie interroge le service public de géocodage de l'IGN.
              </p>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="date" className="block font-bold mb-1.5 text-sm">
              {isLivraison ? "Date de livraison" : secteur ? "Date de retrait" : "Date"}{" "}
              <span className="text-destructive">*</span>
            </label>
            <select
              id="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              disabled={!secteur}
              className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              <option value="">
                {secteur ? `Choisis un ${JOURS_SEMAINE[secteur.jour]}` : "Choisis d'abord ton secteur"}
              </option>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {formatDate(d)}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground mt-1.5">
              🗓️ Pense à commander quelques jours à l'avance — je prépare tout à la main.
            </p>
          </div>
        </section>
        )}

        {etape < 3 && renderNavigation()}

        {/* ===== Onglet 3 : coordonnées, récapitulatif et validation ===== */}
        {etape === 3 && (
        <>
        {/* Coordonnées */}
        <section className="my-8">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-2xl">✍️</span>
            <h2 className={sectionTitle}>Tes coordonnées</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prenom" className="block font-bold mb-1.5 text-sm">
                Prénom <span className="text-destructive">*</span>
              </label>
              <input id="prenom" type="text" autoComplete="given-name" value={form.prenom} onChange={(e) => set("prenom", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="nom" className="block font-bold mb-1.5 text-sm">
                Nom <span className="text-destructive">*</span>
              </label>
              <input id="nom" type="text" autoComplete="family-name" value={form.nom} onChange={(e) => set("nom", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="tel" className="block font-bold mb-1.5 text-sm">
                Téléphone <span className="text-destructive">*</span>
              </label>
              <input id="tel" type="tel" autoComplete="tel" placeholder="06 12 34 56 78" value={form.tel} onChange={(e) => set("tel", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="email" className="block font-bold mb-1.5 text-sm">
                Email <span className="text-destructive">*</span>
              </label>
              <input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="message" className="block font-bold mb-1.5 text-sm">
              Un message ? <span className="text-muted-foreground text-xs font-normal">(optionnel)</span>
            </label>
            <textarea
              id="message"
              placeholder="Une envie, une occasion à fêter, une indication de livraison…"
              aria-describedby="message-aide"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              className={`${inputClass} min-h-[80px] resize-y`}
            />
            <p id="message-aide" className="mt-1.5 text-xs text-muted-foreground">
              Les recettes ne peuvent pas être adaptées : vérifie les allergènes de chaque produit. N'indique pas d'information de santé.
            </p>
          </div>
          {/* Piège anti-spam : hors écran, ignoré par les humains et les lecteurs d'écran */}
          <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
            <label htmlFor="website">Ne pas remplir ce champ</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </div>
        </section>

        {/* Récap + envoi */}
        <section ref={recapRef} className="my-8 scroll-mt-24">
          <div className="bg-card rounded-2xl shadow-soft p-5">
            <h2 className="text-xl font-bold mb-2.5">
              🧺 Ma commande
            </h2>
            <ul className="list-none m-0 p-0">
              {totalSachets === 0 && (
                <li className="text-muted-foreground italic py-1.5">Ton panier est encore vide.</li>
              )}
              {renderRecapLines(VIENNOISERIES, vienno)}
              {viennoSachets > 0 && (
                <li className="flex justify-between gap-3 py-1.5 font-bold text-[#185FA5]">
                  <span>Sous-total viennoiseries ({pluralize(viennoSachets, "sachet", "sachets")})</span>
                  <span>{eur(viennoTotal)}</span>
                </li>
              )}
              {renderRecapLines(FEUILLETES, friand)}
              {friandSachets > 0 && (
                <li className="flex justify-between gap-3 py-1.5 font-bold text-[#185FA5]">
                  <span>Sous-total feuilletés ({pluralize(friandSachets, "sachet", "sachets")})</span>
                  <span>{eur(friandTotal)}</span>
                </li>
              )}
              {isLivraison && totalSachets > 0 && (
                <li className="flex justify-between gap-3 py-1.5 text-sm">
                  <span>
                    🚚 Livraison ({secteur?.nom})
                    {!livraisonOfferte && (
                      <span className="block text-xs text-[#8a5a09]">
                        Ajoute {pluralize(sachetsManquants, "sachet", "sachets")} et elle devient offerte
                      </span>
                    )}
                  </span>
                  {livraisonOfferte ? (
                    <span className="whitespace-nowrap font-semibold text-brand-night">
                      <s className="text-muted-foreground font-normal mr-1.5">{eur(CONFIG.fraisLivraison)}</s>
                      Offerte
                    </span>
                  ) : (
                    <span className="whitespace-nowrap font-semibold text-[#8a5a09]">{eur(fraisLivraison)}</span>
                  )}
                </li>
              )}
            </ul>

            <div className="flex justify-between items-baseline mt-3.5 pt-3 border-t-2 border-border">
              <span className="text-sm">Total à régler à la remise</span>
              <b className="text-2xl text-[#185FA5]">
                {totalStr}
              </b>
            </div>
            {fraisLivraison > 0 && (
              <p className="text-right text-xs text-muted-foreground mt-1">
                dont {eur(fraisLivraison)} de livraison · offerte dès {CONFIG.livraisonOfferteDes} sachets
              </p>
            )}

            {/* Informations avant la commande (C. conso L221-5), juste au-dessus du bouton */}
            <div className="mt-4 rounded-xl bg-[#f4f8fc] border border-[#cfe3f6] px-3.5 py-3 text-sm space-y-1.5">
              <p>
                <strong>Total : {totalStr}</strong>
                {" · "}
                {!secteur
                  ? `livraison (${SECTEUR_LIVRAISON.nom}) ${eur(CONFIG.fraisLivraison)}, offerte dès ${SEUIL_LIVRAISON} ; retrait sans frais.`
                  : isLivraison
                    ? fraisLivraison > 0
                      ? `dont ${eur(fraisLivraison)} de frais de livraison (offerte dès ${SEUIL_LIVRAISON}).`
                      : "livraison offerte."
                    : "retrait sans frais."}
              </p>
              <p>Paiement à la remise de ta commande : {MOYENS_PAIEMENT}. Rien à payer en ligne.</p>
              <p>
                Pas de droit de rétractation : les produits sont crus et congelés, donc susceptibles de se détériorer
                rapidement (article L221-28, 4° du Code de la consommation).
              </p>
              <p>Ta commande devient ferme quand je te confirme le créneau sur WhatsApp.</p>
              <p>
                Tout est détaillé dans les{" "}
                <Link to="/cgv" target="_blank" rel="noopener" className={lienClass}>
                  conditions générales de vente
                </Link>
                .
              </p>
            </div>

            <label className="mt-4 flex items-start gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={cgvAcceptees}
                onChange={(e) => setCgvAcceptees(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#185FA5]"
              />
              <span>
                J'ai lu et j'accepte les{" "}
                <Link to="/cgv" target="_blank" rel="noopener" className={lienClass}>
                  CGV
                </Link>{" "}
                <span className="text-destructive">*</span>
              </span>
            </label>

            <button
              type="button"
              onClick={validerCommande}
              disabled={envoi === "envoi" || !cgvAcceptees}
              aria-busy={envoi === "envoi"}
              aria-describedby={cgvAcceptees ? undefined : "cgv-aide"}
              className={`w-full mt-4 rounded-2xl px-4 py-3.5 font-bold text-base text-white flex items-center justify-center gap-2 transition hover:-translate-y-0.5 hover:shadow-hover disabled:hover:translate-y-0 disabled:hover:shadow-none ${
                cgvAcceptees ? "disabled:opacity-80 disabled:cursor-wait" : "disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
              style={{ backgroundImage: GRAD }}
            >
              {envoi === "envoi" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Envoi en cours…
                </>
              ) : (
                "Commander avec obligation de paiement"
              )}
            </button>
            {!cgvAcceptees && (
              <p id="cgv-aide" className="mt-1.5 text-xs text-muted-foreground text-center">
                Coche la case ci-dessus pour pouvoir commander.
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground text-center">
              Dedjo ({EDITEUR.nom}) utilise tes coordonnées pour traiter ta commande, t'envoyer le récapitulatif et te
              recontacter.{" "}
              {DUREE_CONSERVATION_MENTIONS ? `Elles sont conservées ${DUREE_CONSERVATION_MENTIONS} et passent` : "Elles passent"}{" "}
              par nos prestataires (Google, Netlify, Telegram, WhatsApp), dont certains sont hors de l'Union européenne.{" "}
              {EDITEUR.email && `Tes droits : ${EDITEUR.email}. `}
              En savoir plus :{" "}
              <Link to="/confidentialite" target="_blank" rel="noopener" className={lienClass}>
                politique de confidentialité
              </Link>
              .
            </p>

            {renderErreurs()}

            {envoi === "erreur" && (
              <div role="alert" className="mt-3.5 bg-[#fdecea] border-2 border-[#f5c2bd] text-[#a4291c] rounded-xl px-3.5 py-3 text-sm">
                <strong>Ta commande n'est pas partie.</strong> {erreurEnvoi}
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={validerCommande}
                    className="rounded-xl bg-[#a4291c] text-white font-bold px-3.5 py-2 hover:bg-[#8a2217]"
                  >
                    Réessayer
                  </button>
                  <a
                    href={`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(resumeSecours())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-2"
                  >
                    ou écris-moi sur WhatsApp
                  </a>
                </div>
              </div>
            )}

            <p className="mt-3.5 text-sm text-muted-foreground text-center">
              Aucun paiement en ligne : tu règles quand tu récupères ta commande. 💛
            </p>
          </div>
        </section>

        <div className="my-6">
          <button
            type="button"
            onClick={() => afficherEtape(2)}
            className="rounded-2xl px-4 py-3 font-semibold border-2 border-border bg-white hover:border-[#2A7FD0]"
          >
            ← Retour : {ETAPES[1].titre.toLowerCase()}
          </button>
        </div>
        </>
        )}
        </>
        )}

        {/* Liens légaux (nouvel onglet : le panier et le formulaire restent remplis) */}
        <nav aria-label="Informations légales" className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm pb-6">
          {LIENS_LEGAUX.map((lien) => (
            <Link
              key={lien.to}
              to={lien.to}
              target="_blank"
              rel="noopener"
              className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {lien.label}
            </Link>
          ))}
        </nav>
      </main>

      {/* Barre fixe bas : jauge livraison offerte (masquée pour la Savoie), total, onglet suivant ou « Finaliser » */}
      <div className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t border-border px-4 py-2.5 shadow-[0_-6px_20px_-10px_rgba(24,95,165,0.3)]">
        <div className="max-w-3xl mx-auto">
          {(!secteur || secteur.livraison) && envoi !== "succes" && <LivraisonJauge sachets={totalSachets} className="mb-2.5" />}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <small className="text-muted-foreground text-xs">
                {totalSachets > 0 ? pluralize(totalSachets, "sachet", "sachets") : "Panier vide"}
                {fraisLivraison > 0 && <span className="text-[#8a5a09]"> · dont {eur(fraisLivraison)} de livraison</span>}
              </small>
              <b className="text-xl text-[#185FA5]">
                {totalStr}
              </b>
            </div>
            {envoi !== "succes" && (
              <button
                type="button"
                onClick={() => (etape < 3 ? etapeSuivante() : recapRef.current?.scrollIntoView({ behavior: "smooth" }))}
                className="text-white font-bold px-4 py-3 rounded-2xl text-sm whitespace-nowrap"
                style={{ backgroundImage: GRAD }}
              >
                {etape < 3 ? "Suivant →" : "Finaliser ↓"}
              </button>
            )}
          </div>
        </div>
      </div>

      <ProductLabelModal product={modalProduct} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default Commande;
