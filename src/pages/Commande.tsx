import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import AdresseAutocomplete from "@/components/AdresseAutocomplete";
import ProductLabelModal from "@/components/ProductLabelModal";
import ProductTags, { BientotDisponible } from "@/components/ProductTags";
import LivraisonJauge from "@/components/LivraisonJauge";
import { useCart } from "@/context/CartContext";
import { AdresseLivraison, CommandePayload, envoyerCommande } from "@/lib/commande";
import {
  CONFIG,
  VIENNOISERIES,
  FEUILLETES,
  PRIX_SACHET,
  SECTEURS,
  Product,
  estDisponible,
  eur,
  pluralize,
} from "@/lib/catalog";

const GRAD = "linear-gradient(135deg,#185FA5 0%,#2A7FD0 100%)";
const RAPPEL_CONGELE = "Tout est livré congelé, à conserver au congélateur, et cuire en direct dans ton four.";
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

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

  const errorsRef = useRef<HTMLDivElement>(null);
  const recapRef = useRef<HTMLDivElement>(null);

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

  /* ---------- Validation & message ---------- */
  const validate = (): string[] => {
    const errs: string[] = [];
    if (totalSachets === 0) errs.push("Ajoute au moins un sachet à ta commande.");
    if (!secteur) errs.push("Choisis ton secteur : Savoie ou Marseille et alentours.");
    if (isLivraison && !adresse)
      errs.push("Choisis ton adresse de livraison dans les suggestions (ou saisis-la à la main avec son code postal).");
    if (!form.date) errs.push(isLivraison ? "Choisis ta date de livraison." : "Choisis ta date de retrait.");
    if (!form.prenom.trim()) errs.push("Indique ton prénom.");
    if (!form.nom.trim()) errs.push("Indique ton nom.");
    if (!form.tel.trim()) errs.push("Indique ton téléphone.");
    if (!form.email.trim()) errs.push("Indique ton email : je t'y envoie le récapitulatif de ta commande.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.push("Vérifie ton email : il semble incomplet.");
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
    if (showErrors(validate())) return;
    setEnvoi("envoi");
    setErreurEnvoi("");
    const resultat = await envoyerCommande(construirePayload());
    if (resultat.ok) {
      setNumero(resultat.id);
      setEnvoi("succes");
      clear();
      setTimeout(() => recapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } else {
      setErreurEnvoi(resultat.error);
      setEnvoi("erreur");
    }
  };

  const nouvelleCommande = () => {
    setEnvoi("repos");
    setNumero("");
    setErrors([]);
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
        className="bg-card rounded-2xl shadow-soft p-4 flex flex-col gap-3 border-t-4"
        style={{ borderTopColor: p.color }}
      >
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
          {!estDisponible(p.id) ? (
            <BientotDisponible />
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
            Choisis tes sachets, dis-moi où je te retrouve, puis envoie-moi ta commande : tu règles en espèces quand tu la récupères, rien à payer en ligne.
          </p>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4">
        {/* Rappel congelé */}
        <div className="flex gap-3 items-center bg-[#eaf3fb] border border-[#cfe3f6] text-[#16527f] rounded-2xl px-4 py-3 my-6 text-sm">
          <span className="text-xl leading-none">❄️</span>
          <p>{RAPPEL_CONGELE}</p>
        </div>

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
              Mes pizzas au feu de bois, c'est <strong>uniquement sur place</strong>, les vendredis dédiés à la Ferme de la Goëttaz. <strong>Sans réservation</strong> — on se retrouve là-bas, on garnit, on enfourne. À très vite !
            </p>
          </div>
        </section>

        {/* Récupération */}
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
                {secteur ? `Choisis un ${JOURS[secteur.jour]}` : "Choisis d'abord ton secteur"}
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
              placeholder="Une envie, une allergie, une occasion à fêter, une indication de livraison…"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              className={`${inputClass} min-h-[80px] resize-y`}
            />
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
        <section ref={recapRef} className="my-8">
          {envoi === "succes" ? (
            <div role="status" className="bg-card rounded-2xl shadow-soft p-6 text-center border-2 border-[#cfe3f6]">
              <CheckCircle2 className="w-12 h-12 mx-auto text-[#2A7FD0]" aria-hidden="true" />
              <h2 className="text-2xl font-bold mt-3">C'est reçu !</h2>
              <p className="mt-2 text-foreground">Je te recontacte rapidement pour confirmer la livraison.</p>
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
          ) : (
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
              <span className="text-sm">Total à régler en espèces</span>
              <b className="text-2xl text-[#185FA5]">
                {totalStr}
              </b>
            </div>
            {fraisLivraison > 0 && (
              <p className="text-right text-xs text-muted-foreground mt-1">
                dont {eur(fraisLivraison)} de livraison · offerte dès {CONFIG.livraisonOfferteDes} sachets
              </p>
            )}

            <button
              type="button"
              onClick={validerCommande}
              disabled={envoi === "envoi"}
              aria-busy={envoi === "envoi"}
              className="w-full mt-4 rounded-2xl px-4 py-3.5 font-bold text-base text-white flex items-center justify-center gap-2 transition hover:-translate-y-0.5 hover:shadow-hover disabled:opacity-80 disabled:cursor-wait disabled:hover:translate-y-0"
              style={{ backgroundImage: GRAD }}
            >
              {envoi === "envoi" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> Envoi en cours…
                </>
              ) : (
                "Valider ma commande"
              )}
            </button>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              Tes coordonnées servent uniquement à préparer et livrer ta commande : elles ne sont ni revendues ni utilisées à d'autres fins.
            </p>

            {errors.length > 0 && (
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
            )}

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
              Réservation sans paiement en ligne : tu règles en espèces quand tu récupères ta commande. 💛
            </p>
          </div>
          )}
        </section>
      </main>

      {/* Barre fixe bas : jauge livraison offerte (masquée pour la Savoie), total, « Finaliser » */}
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
            <button
              onClick={() => recapRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="text-white font-bold px-4 py-3 rounded-2xl text-sm whitespace-nowrap"
              style={{ backgroundImage: GRAD }}
            >
              Finaliser ↓
            </button>
          </div>
        </div>
      </div>

      <ProductLabelModal product={modalProduct} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default Commande;
