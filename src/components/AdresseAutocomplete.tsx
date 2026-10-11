import { KeyboardEvent, useEffect, useId, useState } from "react";
import { Check, Loader2, MapPin } from "lucide-react";
import { AdresseLivraison } from "@/lib/commande";

/* API Adresse de l'IGN (Base Adresse Nationale, Géoplateforme) : gratuite, sans clé,
   appelable depuis le navigateur. https://geoservices.ign.fr/documentation/services/services-geoplateforme/geocodage */
const API = "https://data.geopf.fr/geocodage/search";
// Centre de Marseille : les adresses proches passent en premier, sans exclure les autres communes
const PRIORITE = { lat: 43.2965, lon: 5.3698 };
const MIN_CARACTERES = 3;
const ATTENTE_MS = 250;

interface Suggestion {
  cle: string;
  ligne: string;
  codePostal: string;
  ville: string;
  avecNumero: boolean;
}

interface ProprietesBan {
  id?: string;
  label?: string;
  name?: string;
  postcode?: string;
  city?: string;
  type?: string;
}

const formater = (a: AdresseLivraison) => `${a.ligne}, ${a.codePostal} ${a.ville}`;

interface Props {
  id: string;
  value: AdresseLivraison | null;
  onChange: (adresse: AdresseLivraison | null) => void;
  inputClass: string;
}

/** Champ adresse avec suggestions : le client choisit son adresse, le code postal en découle. */
const AdresseAutocomplete = ({ id, value, onChange, inputClass }: Props) => {
  const listeId = useId();
  const [texte, setTexte] = useState(value && !value.manuelle ? formater(value) : "");
  const [requete, setRequete] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const [chargement, setChargement] = useState(false);
  const [indisponible, setIndisponible] = useState(false);
  const [sansNumero, setSansNumero] = useState(false);
  const [manuel, setManuel] = useState(value?.manuelle ?? false);
  const [saisie, setSaisie] = useState({
    ligne: value?.manuelle ? value.ligne : "",
    codePostal: value?.manuelle ? value.codePostal : "",
    ville: value?.manuelle ? value.ville : "",
  });

  // Recherche des suggestions, uniquement quand le client tape (pas après un choix)
  useEffect(() => {
    const q = requete.trim();
    if (q.length < MIN_CARACTERES) {
      setSuggestions([]);
      setOuvert(false);
      setChargement(false);
      return;
    }
    const controleur = new AbortController();
    const minuteur = setTimeout(async () => {
      setChargement(true);
      try {
        const url = `${API}?q=${encodeURIComponent(q)}&autocomplete=1&limit=5&index=address&lat=${PRIORITE.lat}&lon=${PRIORITE.lon}`;
        const res = await fetch(url, { signal: controleur.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { features?: { properties?: ProprietesBan }[] } = await res.json();
        const liste = (data.features ?? [])
          .map((f) => f.properties)
          .filter((p): p is ProprietesBan => !!p?.name && !!p.postcode && !!p.city && p.type !== "municipality")
          .map((p) => ({
            cle: p.id ?? p.label ?? `${p.name}-${p.postcode}`,
            ligne: p.name!,
            codePostal: p.postcode!,
            ville: p.city!,
            avecNumero: p.type === "housenumber",
          }));
        setSuggestions(liste);
        setActif(liste.length ? 0 : -1);
        setOuvert(true);
        setIndisponible(false);
        setChargement(false);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setSuggestions([]);
        setOuvert(false);
        setIndisponible(true);
        setChargement(false);
      }
    }, ATTENTE_MS);
    return () => {
      clearTimeout(minuteur);
      controleur.abort();
    };
  }, [requete]);

  const taper = (v: string) => {
    setTexte(v);
    setRequete(v);
    setSansNumero(false);
    if (value) onChange(null); // l'adresse choisie ne correspond plus au texte
  };

  const choisir = (s: Suggestion) => {
    const adresse: AdresseLivraison = { ligne: s.ligne, codePostal: s.codePostal, ville: s.ville, manuelle: false };
    onChange(adresse);
    setTexte(formater(adresse));
    setRequete("");
    setSuggestions([]);
    setOuvert(false);
    setSansNumero(!s.avecNumero);
  };

  const clavier = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!suggestions.length) return;
      e.preventDefault();
      setOuvert(true);
      const pas = e.key === "ArrowDown" ? 1 : -1;
      setActif((i) => (i + pas + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && ouvert && actif >= 0 && suggestions[actif]) {
      e.preventDefault();
      choisir(suggestions[actif]);
    } else if (e.key === "Escape" && ouvert) {
      e.preventDefault();
      setOuvert(false);
    }
  };

  const majSaisie = (cle: keyof typeof saisie, v: string) => {
    const suivante = { ...saisie, [cle]: cle === "codePostal" ? v.replace(/\D/g, "").slice(0, 5) : v };
    setSaisie(suivante);
    const complete =
      suivante.ligne.trim().length >= 3 && /^\d{5}$/.test(suivante.codePostal) && suivante.ville.trim().length >= 2;
    onChange(
      complete
        ? { ligne: suivante.ligne.trim(), codePostal: suivante.codePostal, ville: suivante.ville.trim(), manuelle: true }
        : null
    );
  };

  const passerEnManuel = () => {
    setManuel(true);
    setOuvert(false);
    setSaisie((s) => ({ ...s, ligne: s.ligne || (value ? "" : texte) }));
    onChange(null);
  };

  const revenirAuxSuggestions = () => {
    setManuel(false);
    setTexte("");
    setRequete("");
    onChange(null);
  };

  const lien = "text-sm font-semibold text-[#185FA5] underline underline-offset-2 hover:text-[#2A7FD0]";

  if (manuel) {
    return (
      <div className="space-y-2.5">
        <input
          id={id}
          type="text"
          autoComplete="address-line1"
          placeholder="N° et rue"
          value={saisie.ligne}
          onChange={(e) => majSaisie("ligne", e.target.value)}
          className={inputClass}
        />
        <div className="grid grid-cols-[8rem_1fr] gap-2.5">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            aria-label="Code postal"
            placeholder="Code postal"
            value={saisie.codePostal}
            onChange={(e) => majSaisie("codePostal", e.target.value)}
            className={inputClass}
          />
          <input
            type="text"
            autoComplete="address-level2"
            aria-label="Ville"
            placeholder="Ville"
            value={saisie.ville}
            onChange={(e) => majSaisie("ville", e.target.value)}
            className={inputClass}
          />
        </div>
        <button type="button" onClick={revenirAuxSuggestions} className={lien}>
          ← Revenir aux suggestions d'adresse
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={ouvert}
          aria-controls={listeId}
          aria-activedescendant={ouvert && actif >= 0 ? `${listeId}-${actif}` : undefined}
          autoComplete="off"
          placeholder="Commence à taper ton adresse…"
          value={texte}
          onChange={(e) => taper(e.target.value)}
          onKeyDown={clavier}
          onFocus={() => !value && suggestions.length > 0 && setOuvert(true)}
          onBlur={() => setOuvert(false)}
          className={`${inputClass} pr-10`}
        />
        {chargement && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" aria-hidden="true" />
        )}

        {ouvert && (
          // onMouseDown : garde le focus dans le champ pour que le clic soit pris en compte
          <div
            className="absolute z-30 left-0 right-0 mt-1 bg-white border-2 border-border rounded-xl shadow-lg overflow-hidden"
            onMouseDown={(e) => e.preventDefault()}
          >
            {suggestions.length > 0 ? (
              <ul id={listeId} role="listbox" aria-label="Adresses suggérées">
                {suggestions.map((s, i) => (
                  <li
                    key={s.cle}
                    id={`${listeId}-${i}`}
                    role="option"
                    aria-selected={i === actif}
                    onClick={() => choisir(s)}
                    onMouseEnter={() => setActif(i)}
                    className={`flex items-start gap-2.5 px-3.5 py-2.5 cursor-pointer ${i === actif ? "bg-[#eef5fc]" : ""}`}
                  >
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#185FA5]" aria-hidden="true" />
                    <span>
                      <span className="block font-medium text-foreground">{s.ligne}</span>
                      <span className="block text-sm text-muted-foreground">
                        {s.codePostal} {s.ville}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3.5 py-2.5 text-sm text-muted-foreground">
                Aucune adresse trouvée : vérifie l'orthographe, ou saisis-la à la main.
              </p>
            )}
          </div>
        )}
      </div>

      {value ? (
        <p className="mt-1.5 text-sm text-[#1f6b3a] flex items-center gap-1.5">
          <Check className="w-4 h-4" aria-hidden="true" />
          Code postal : <strong>{value.codePostal}</strong> · {value.ville}
        </p>
      ) : indisponible ? (
        <p className="mt-1.5 text-sm text-[#8a5a09]">Les suggestions d'adresse sont indisponibles pour le moment.</p>
      ) : (
        <p className="mt-1.5 text-sm text-muted-foreground">Tape ton adresse, puis choisis-la dans la liste.</p>
      )}
      {sansNumero && value && (
        <p className="mt-1 text-sm text-[#8a5a09]">Cette adresse n'a pas de numéro : précise-le dans ton message.</p>
      )}

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={passerEnManuel} className={lien}>
          Je ne trouve pas mon adresse
        </button>
        <span className="text-xs text-muted-foreground">Suggestions : Base Adresse Nationale (service public)</span>
      </div>
    </div>
  );
};

export default AdresseAutocomplete;
