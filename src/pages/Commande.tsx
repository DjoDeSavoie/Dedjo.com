import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";
import ProductLabelModal from "@/components/ProductLabelModal";
import { useCart } from "@/context/CartContext";
import {
  CONFIG,
  VIENNOISERIES,
  FEUILLETES,
  VIENNO_MIN,
  VIENNO_TIERS,
  VIENNO_EXTRA,
  FRIAND_UNIT,
  Product,
  eur,
  viennoPrice,
  friandPrice,
  nextTier,
} from "@/lib/catalog";

const GRAD = "linear-gradient(135deg,#185FA5 0%,#2A7FD0 100%)";

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

const Commande = () => {
  const {
    vienno,
    friand,
    addVienno,
    addFriand,
    viennoCount,
    friandCount,
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

  const vp = viennoPrice(viennoCount);
  const fp = friandPrice(friandCount);
  const nt = nextTier(viennoCount);

  const openInfo = (p: Product) => {
    setModalProduct(p);
    setModalOpen(true);
  };

  /* ---------- Validation & message ---------- */
  const validate = (): string[] => {
    const errs: string[] = [];
    if (viennoCount + friandCount === 0) errs.push("Ajoute au moins un produit à ta commande.");
    if (viennoCount > 0 && viennoCount < VIENNO_MIN)
      errs.push(`Il faut au minimum ${VIENNO_MIN} viennoiseries (tu en as ${viennoCount}).`);
    if (friandCount > 0 && friandCount < CONFIG.minFriands)
      errs.push(`Il faut au minimum ${CONFIG.minFriands} friands (tu en as ${friandCount}).`);
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
    L.push("🥐 NOUVELLE COMMANDE DEDJO");
    L.push("L'artisanat qui se partage.");
    L.push("");
    if (viennoCount > 0) {
      L.push("— Viennoiseries —");
      VIENNOISERIES.forEach((p) => {
        if (vienno[p.id] > 0) L.push(`• ${p.name} × ${vienno[p.id]}`);
      });
      L.push(`Sous-total (${viennoCount} pièces) : ${vp !== null ? eur(vp) : "à confirmer"}`);
      L.push("");
    }
    if (friandCount > 0) {
      L.push("— Feuilletés salés —");
      FEUILLETES.forEach((p) => {
        if (friand[p.id] > 0) L.push(`• ${p.name} × ${friand[p.id]}`);
      });
      L.push(`Sous-total (${friandCount} friands) : ${eur(fp)}`);
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
    L.push("❄️ Produits surgelés — four 180 °C, 25 min.");
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

  /* ---------- Sous-composants ---------- */
  const ProductCard = ({
    p,
    group,
    unit,
  }: {
    p: Product;
    group: "vienno" | "friand";
    unit?: string;
  }) => {
    const count = group === "vienno" ? vienno[p.id] : friand[p.id];
    const inc = () => (group === "vienno" ? addVienno(p.id, 1) : addFriand(p.id, 1));
    const dec = () => (group === "vienno" ? addVienno(p.id, -1) : addFriand(p.id, -1));
    return (
      <div
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
            <h3 className="font-bold text-foreground flex items-center gap-2" style={{ fontFamily: '"Bitter", serif' }}>
              {p.name}
              {p.allergen && (
                <span className="text-[0.68rem] font-bold bg-[#fdeccd] text-[#8a5a09] px-2 py-0.5 rounded-full">
                  ⚠️ Fruits à coque
                </span>
              )}
            </h3>
            {p.type && <p className="text-xs text-muted-foreground">{p.type}</p>}
            {unit && <p className="text-xs font-bold text-[#185FA5]">{unit}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={dec}
              disabled={count <= 0}
              aria-label={`Retirer un ${p.name}`}
              className="w-9 h-9 rounded-xl border-2 border-border bg-white text-[#185FA5] font-bold text-xl leading-none transition hover:border-[#2A7FD0] hover:bg-[#eef5fc] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              −
            </button>
            <span
              className="min-w-[28px] text-center font-bold text-lg"
              style={{ fontFamily: '"Bitter", serif' }}
              aria-live="polite"
            >
              {count}
            </span>
            <button
              type="button"
              onClick={inc}
              aria-label={`Ajouter un ${p.name}`}
              className="w-9 h-9 rounded-xl border-2 border-border bg-white text-[#185FA5] font-bold text-xl leading-none transition hover:border-[#2A7FD0] hover:bg-[#eef5fc]"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => openInfo(p)}
            className="text-sm font-bold text-[#185FA5] underline underline-offset-2 hover:text-[#2A7FD0]"
          >
            Voir les infos produit
          </button>
        </div>
      </div>
    );
  };

  const inputClass =
    "w-full px-3.5 py-3 border-2 border-border rounded-xl bg-white text-foreground text-base focus:outline-none focus:border-[#2A7FD0] transition-colors";
  const choiceClass = (sel: boolean) =>
    `flex-1 min-w-[200px] border-2 rounded-2xl px-3.5 py-3 cursor-pointer flex gap-2.5 items-start transition ${
      sel ? "border-[#2A7FD0] bg-[#eef5fc]" : "border-border bg-white hover:border-[#2A7FD0]"
    }`;

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
            <span className="font-pattaya text-3xl" style={{ letterSpacing: "2px" }}>
              Dedjo
            </span>
          </div>
          <p className="italic text-white/95" style={{ fontFamily: '"Playfair Display", serif' }}>
            L'artisanat qui se partage.
          </p>
          <p className="mt-3 text-sm text-white/95 max-w-lg mx-auto">
            Compose ta commande, je la prépare. Tu règles au retrait ou à la livraison — rien à payer en ligne.
          </p>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4">
        {/* Rappel surgelé */}
        <div className="flex gap-3 items-start bg-[#eaf3fb] border border-[#cfe3f6] text-[#16527f] rounded-2xl px-4 py-3 my-6 text-sm">
          <span className="text-xl leading-none">❄️</span>
          <p>
            Tout est livré <strong>surgelé</strong>, à enfourner directement, sans décongeler.
            <br />
            Pour les viennoiseries : <strong>180 °C, 25 min</strong>. Et ça embaume la cuisine.
          </p>
        </div>

        {/* Viennoiseries */}
        <section className="my-8">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-2xl">🥐</span>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: '"Bitter", serif' }}>
              Les viennoiseries
            </h2>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            Compose ton panier comme tu veux, autant de chaque parfum. <strong>Minimum 5 pièces.</strong> Plus tu en prends, moins c'est cher.
          </p>

          {/* Paliers */}
          <div className="flex gap-2 flex-wrap mb-3.5" aria-hidden="true">
            {VIENNO_TIERS.map((t) => {
              const idx = VIENNO_TIERS.indexOf(t);
              const nextQ = VIENNO_TIERS[idx + 1] ? VIENNO_TIERS[idx + 1].qty : Infinity;
              const active = viennoCount >= t.qty && viennoCount < nextQ;
              return (
                <div
                  key={t.qty}
                  className={`flex-1 min-w-[90px] border-2 rounded-2xl px-2 py-2.5 text-center transition ${
                    active ? "border-[#2A7FD0] bg-[#eef5fc] -translate-y-0.5" : "border-border bg-card"
                  }`}
                >
                  <div className="font-bold" style={{ fontFamily: '"Bitter", serif' }}>
                    {t.qty} pièces
                  </div>
                  <div className="text-[#185FA5] font-bold">{eur(t.price)}</div>
                </div>
              );
            })}
          </div>

          {/* Jauge */}
          <div className="bg-card border-2 border-border rounded-2xl px-4 py-3.5 mb-5">
            <p className="text-sm mb-2">
              {nt ? (
                <>
                  Plus que{" "}
                  <strong className="text-[#185FA5]">
                    {nt.qty - viennoCount} viennoiserie{nt.qty - viennoCount > 1 ? "s" : ""}
                  </strong>{" "}
                  pour le panier de <strong className="text-[#185FA5]">{nt.qty}</strong> à{" "}
                  <strong className="text-[#185FA5]">{eur(nt.price)}</strong>.
                </>
              ) : (
                <>
                  🎉 Paliers débloqués ! Au-delà de {VIENNO_TIERS[VIENNO_TIERS.length - 1].qty} pièces,
                  chaque viennoiserie supplémentaire est à <strong className="text-[#185FA5]">{eur(VIENNO_EXTRA)}</strong>.
                </>
              )}
            </p>
            <div className="h-2.5 bg-[#eee7d7] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  backgroundImage: GRAD,
                  width: nt
                    ? `${Math.min(100, Math.round(((viennoCount - nt.from) / (nt.qty - nt.from)) * 100))}%`
                    : "100%",
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {VIENNOISERIES.map((p) => (
              <ProductCard key={p.id} p={p} group="vienno" />
            ))}
          </div>
        </section>

        {/* Feuilletés */}
        <section className="my-8">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-2xl">🥧</span>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: '"Bitter", serif' }}>
              Les feuilletés salés
            </h2>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            De gros friands feuilletés, garnis à la main. <strong>{eur(FRIAND_UNIT)} le friand</strong> (sachet de 2 = {eur(FRIAND_UNIT * 2)}). Minimum {CONFIG.minFriands} friands.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {FEUILLETES.map((p) => (
              <ProductCard key={p.id} p={p} group="friand" unit={`${eur(FRIAND_UNIT)} / friand`} />
            ))}
          </div>
        </section>

        {/* Pizzas (mention) */}
        <section className="my-8">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="text-2xl">🍕</span>
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: '"Bitter", serif' }}>
              Les pizzas du vendredi
            </h2>
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
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: '"Bitter", serif' }}>
              Où je te retrouve ?
            </h2>
          </div>

          <div className="mb-4">
            <label className="block font-bold mb-1.5 text-sm">
              Ton secteur <span className="text-destructive">*</span>
            </label>
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
          </div>

          <div className="mb-4">
            <label className="block font-bold mb-1.5 text-sm">
              Mode de récupération <span className="text-destructive">*</span>
            </label>
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
          </div>

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
            <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: '"Bitter", serif' }}>
              Tes coordonnées
            </h2>
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
            <h2 className="text-xl font-bold mb-2.5" style={{ fontFamily: '"Bitter", serif' }}>
              🧺 Ma commande
            </h2>
            <ul className="list-none m-0 p-0">
              {viennoCount === 0 && friandCount === 0 && (
                <li className="text-muted-foreground italic py-1.5">Ton panier est encore vide.</li>
              )}
              {VIENNOISERIES.filter((p) => vienno[p.id] > 0).map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-1.5 border-b border-dashed border-border text-sm">
                  <span>{p.emoji} {p.name}</span>
                  <span>× {vienno[p.id]}</span>
                </li>
              ))}
              {viennoCount > 0 && (
                <li className="flex justify-between gap-3 py-1.5 font-bold text-[#185FA5]" style={{ fontFamily: '"Bitter", serif' }}>
                  {vp !== null ? (
                    <>
                      <span>Sous-total viennoiseries ({viennoCount} pièces)</span>
                      <span>{eur(vp)}</span>
                    </>
                  ) : (
                    <>
                      <span>Viennoiseries ({viennoCount} pièce{viennoCount > 1 ? "s" : ""})</span>
                      <span>min. {VIENNO_MIN} pour un prix</span>
                    </>
                  )}
                </li>
              )}
              {FEUILLETES.filter((p) => friand[p.id] > 0).map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-1.5 border-b border-dashed border-border text-sm">
                  <span>{p.emoji} {p.name}</span>
                  <span>× {friand[p.id]}</span>
                </li>
              ))}
              {friandCount > 0 && (
                <li className="flex justify-between gap-3 py-1.5 font-bold text-[#185FA5]" style={{ fontFamily: '"Bitter", serif' }}>
                  <span>Sous-total feuilletés ({friandCount} friand{friandCount > 1 ? "s" : ""})</span>
                  <span>{eur(fp)}</span>
                </li>
              )}
            </ul>

            <div className="flex justify-between items-baseline mt-3.5 pt-3 border-t-2 border-border">
              <span className="text-sm">Total à régler au retrait / à la livraison</span>
              <b className="text-2xl text-[#185FA5]" style={{ fontFamily: '"Bitter", serif' }}>
                {totalStr}
              </b>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
              <button
                onClick={sendWhatsApp}
                className="rounded-2xl px-3 py-3.5 font-bold text-base flex items-center justify-center gap-2 bg-[#25D366] text-[#06371b] transition hover:-translate-y-0.5 hover:shadow-hover"
                style={{ fontFamily: '"Bitter", serif' }}
              >
                📲 WhatsApp
              </button>
              <button
                onClick={sendEmail}
                className="rounded-2xl px-3 py-3.5 font-bold text-base flex items-center justify-center gap-2 text-white transition hover:-translate-y-0.5 hover:shadow-hover"
                style={{ fontFamily: '"Bitter", serif', backgroundImage: GRAD }}
              >
                ✉️ Email
              </button>
              <button
                onClick={copyRecap}
                className="rounded-2xl px-3 py-3.5 font-bold text-base flex items-center justify-center gap-2 bg-[#F5C842] text-[#5a4406] transition hover:-translate-y-0.5 hover:shadow-hover"
                style={{ fontFamily: '"Bitter", serif' }}
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
            {viennoCount + friandCount > 0
              ? `${viennoCount + friandCount} article${viennoCount + friandCount > 1 ? "s" : ""}`
              : "Panier vide"}
          </small>
          <b className="text-xl text-[#185FA5]" style={{ fontFamily: '"Bitter", serif' }}>
            {totalStr}
          </b>
        </div>
        <button
          onClick={() => recapRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="text-white font-bold px-4 py-3 rounded-2xl text-sm whitespace-nowrap"
          style={{ fontFamily: '"Bitter", serif', backgroundImage: GRAD }}
        >
          Finaliser ↓
        </button>
      </div>

      <ProductLabelModal product={modalProduct} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
};

export default Commande;
