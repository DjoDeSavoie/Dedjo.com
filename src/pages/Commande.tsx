import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";
import ProductLabelModal from "@/components/ProductLabelModal";
import ProductTags from "@/components/ProductTags";
import { useCart } from "@/context/CartContext";
import {
  CONFIG,
  VIENNOISERIES,
  FEUILLETES,
  PRIX_SACHET,
  Product,
  eur,
  pluralize,
} from "@/lib/catalog";

const GRAD = "linear-gradient(135deg,#185FA5 0%,#2A7FD0 100%)";
const RAPPEL_CONGELE = "Tout est livré congelé, à conserver au congélateur, et cuire en direct dans ton four.";

interface FormState {
  secteur: string;
  mode: string;
  address: string;
  date: string;
  prenom: string;
  nom: string;
  tel: string;
  email: string;
  message: string;
}

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
  } = useCart();

  const [form, setForm] = useState<FormState>({
    secteur: "",
    mode: "",
    address: "",
    date: "",
    prenom: "",
    nom: "",
    tel: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const errorsRef = useRef<HTMLDivElement>(null);
  const recapRef = useRef<HTMLDivElement>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const isLivraison = /livraison/i.test(form.mode);

  const dateMin = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + CONFIG.leadDays);
    return d.toISOString().split("T")[0];
  }, []);

  const openInfo = (p: Product) => {
    setModalProduct(p);
    setModalOpen(true);
  };

  /* ---------- Validation & message ---------- */
  const validate = (): string[] => {
    const errs: string[] = [];
    if (totalSachets === 0) errs.push("Ajoute au moins un sachet à ta commande.");
    if (!form.secteur) errs.push("Choisis ton secteur (Savoie ou Marseille).");
    if (!form.mode) errs.push("Choisis ton mode de récupération.");
    if (isLivraison && !form.address.trim()) errs.push("Indique ton adresse de livraison.");
    if (!form.date) errs.push("Choisis une date souhaitée.");
    if (!form.prenom.trim()) errs.push("Indique ton prénom.");
    if (!form.nom.trim()) errs.push("Indique ton nom.");
    if (!form.tel.trim()) errs.push("Indique ton téléphone.");
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

  const buildMessage = (): string => {
    const L: string[] = [];
    const lines = (products: Product[], counts: Record<string, number>) =>
      products
        .filter((p) => counts[p.id] > 0)
        .forEach((p) => L.push(`• ${p.name} × ${sachetsLabel(p, counts[p.id])} — ${eur(counts[p.id] * p.price)}`));

    L.push("🥐 NOUVELLE COMMANDE DEDJO");
    L.push("L'artisanat qui se partage.");
    L.push("");
    if (viennoSachets > 0) {
      L.push("— Viennoiseries —");
      lines(VIENNOISERIES, vienno);
      L.push(`Sous-total : ${eur(viennoTotal)}`);
      L.push("");
    }
    if (friandSachets > 0) {
      L.push("— Feuilletés salés —");
      lines(FEUILLETES, friand);
      L.push(`Sous-total : ${eur(friandTotal)}`);
      L.push("");
    }
    L.push(`TOTAL : ${eur(total)} (à régler au retrait / à la livraison)`);
    L.push("");
    L.push("— Récupération —");
    L.push(`Secteur : ${form.secteur}`);
    L.push(`Mode : ${form.mode}`);
    if (isLivraison) L.push(`Adresse : ${form.address}`);
    L.push(`Date souhaitée : ${form.date}`);
    L.push("");
    L.push("— Coordonnées —");
    L.push(`${form.prenom} ${form.nom}`);
    L.push(`Tél : ${form.tel}`);
    if (form.email.trim()) L.push(`Email : ${form.email}`);
    if (form.message.trim()) L.push(`Message : ${form.message}`);
    L.push("");
    L.push(`❄️ ${RAPPEL_CONGELE}`);
    return L.join("\n");
  };

  const sendWhatsApp = () => {
    if (showErrors(validate())) return;
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(buildMessage())}`, "_blank");
  };
  const sendEmail = () => {
    if (showErrors(validate())) return;
    const subj = `Commande Dedjo — ${form.prenom} ${form.nom}`;
    window.location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(buildMessage())}`;
  };
  const copyRecap = async () => {
    if (showErrors(validate())) return;
    const msg = buildMessage();
    try {
      await navigator.clipboard.writeText(msg);
      toast.success("Récapitulatif copié ✓");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = msg;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast.success("Récapitulatif copié ✓");
      } catch {
        toast.error("Copie impossible — sélectionne le texte manuellement");
      }
      document.body.removeChild(ta);
    }
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

  const totalStr = total > 0 ? eur(total) : "—";

  return (
    <div className="min-h-screen bg-background pb-28">
      <Navbar />

      {/* En-tête */}
      <header className="pt-24 pb-8 px-6 text-white text-center" style={{ backgroundImage: GRAD }}>
        <div className="container max-w-3xl mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Retour au site
          </Link>
          <div className="flex items-center justify-center gap-3 mb-1">
            <Logo className="w-11 h-11" />
            <span className="font-brand text-3xl text-brand-cream">Dedjo</span>
          </div>
          <p className="font-display italic text-white/95">
            L'artisanat qui se partage.
          </p>
          <p className="mt-3 text-sm text-white/95 max-w-lg mx-auto">
            Compose ta commande, je la prépare. Tu règles au retrait ou à la livraison — rien à payer en ligne.
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
              {[
                { v: "Savoie", d: "Retrait au marché du vendredi, Ferme de la Goëttaz" },
                { v: "Marseille", d: "Livraison locale à domicile" },
              ].map((o) => (
                <label key={o.v} className={choiceClass(form.secteur === o.v)}>
                  <input
                    type="radio"
                    name="secteur"
                    value={o.v}
                    checked={form.secteur === o.v}
                    onChange={() => set("secteur", o.v)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-bold block">{o.v}</span>
                    <span className="text-sm text-muted-foreground">{o.d}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mb-4">
            <legend className="block font-bold mb-1.5 text-sm">
              Mode de récupération <span className="text-destructive">*</span>
            </legend>
            <div className="flex gap-2.5 flex-wrap">
              {[
                {
                  v: "Retrait au marché du vendredi (Ferme de la Goëttaz)",
                  t: "Retrait au marché",
                  d: "Le vendredi, à la Ferme de la Goëttaz",
                },
                { v: "Livraison à domicile", t: "Livraison à domicile", d: "Je te l'apporte (selon secteur)" },
              ].map((o) => (
                <label key={o.v} className={choiceClass(form.mode === o.v)}>
                  <input
                    type="radio"
                    name="mode"
                    value={o.v}
                    checked={form.mode === o.v}
                    onChange={() => set("mode", o.v)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-bold block">{o.t}</span>
                    <span className="text-sm text-muted-foreground">{o.d}</span>
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
              <input
                id="address"
                type="text"
                autoComplete="street-address"
                placeholder="N°, rue, code postal, ville"
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="date" className="block font-bold mb-1.5 text-sm">
              Date souhaitée <span className="text-destructive">*</span>
            </label>
            <input
              id="date"
              type="date"
              min={dateMin}
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className={inputClass}
            />
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
                Email <span className="text-muted-foreground text-xs font-normal">(optionnel)</span>
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
              placeholder="Une envie, une allergie, une occasion à fêter…"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
              className={`${inputClass} min-h-[80px] resize-y`}
            />
          </div>
        </section>

        {/* Récap + envoi */}
        <section ref={recapRef} className="my-8">
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
            </ul>

            <div className="flex justify-between items-baseline mt-3.5 pt-3 border-t-2 border-border">
              <span className="text-sm">Total à régler au retrait / à la livraison</span>
              <b className="text-2xl text-[#185FA5]">
                {totalStr}
              </b>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
              <button
                onClick={sendWhatsApp}
                className="rounded-2xl px-3 py-3.5 font-bold text-base flex items-center justify-center gap-2 bg-[#25D366] text-[#06371b] transition hover:-translate-y-0.5 hover:shadow-hover"
              >
                📲 WhatsApp
              </button>
              <button
                onClick={sendEmail}
                className="rounded-2xl px-3 py-3.5 font-bold text-base flex items-center justify-center gap-2 text-white transition hover:-translate-y-0.5 hover:shadow-hover"
                style={{ backgroundImage: GRAD }}
              >
                ✉️ Email
              </button>
              <button
                onClick={copyRecap}
                className="rounded-2xl px-3 py-3.5 font-bold text-base flex items-center justify-center gap-2 bg-[#F5C842] text-[#5a4406] transition hover:-translate-y-0.5 hover:shadow-hover"
              >
                📋 Copier
              </button>
            </div>

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

            <p className="mt-3.5 text-sm text-muted-foreground text-center">
              Réservation sans paiement en ligne — tu règles en main propre au retrait ou à la livraison. 💛
            </p>
          </div>
        </section>
      </main>

      {/* Barre fixe bas */}
      <div className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t border-border px-4 py-2.5 flex items-center justify-between gap-3 shadow-[0_-6px_20px_-10px_rgba(24,95,165,0.3)]">
        <div className="flex flex-col">
          <small className="text-muted-foreground text-xs">
            {totalSachets > 0 ? pluralize(totalSachets, "sachet", "sachets") : "Panier vide"}
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

      <ProductLabelModal product={modalProduct} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default Commande;
