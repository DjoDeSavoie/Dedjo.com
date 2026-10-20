/* Écran du code d'accès : seul écran visible sans session. */

import { FormEvent, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { connecter, ErreurAtelier } from "./api";
import { BOUTON_PRINCIPAL, CHAMP, DISCRET, ETIQUETTE } from "./composants";

export default function Connexion({ apresConnexion }: { apresConnexion: () => void }) {
  const [code, setCode] = useState("");
  const [voir, setVoir] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  const entrer = async (e: FormEvent) => {
    e.preventDefault();
    if (envoi || !code) return;
    setEnvoi(true);
    setErreur("");
    try {
      await connecter(code);
      setCode("");
      apresConnexion();
    } catch (err) {
      setErreur(err instanceof ErreurAtelier ? err.message : "Connexion impossible pour le moment.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-[420px] flex-col justify-center px-4 py-10">
      <p className="font-brand text-[34px] leading-none text-[#163F6B]">Dedjo</p>
      <p className="mb-8 mt-1 font-display text-xl italic text-[#5E6A78]">Atelier</p>
      <form onSubmit={entrer} className="grid gap-3" noValidate>
        <label htmlFor="code-atelier" className={ETIQUETTE}>
          Code d'accès
        </label>
        <div className="flex gap-2">
          <input
            id="code-atelier"
            type={voir ? "text" : "password"}
            autoComplete="current-password"
            autoCapitalize="none"
            spellCheck={false}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={CHAMP}
          />
          <button
            type="button"
            onClick={() => setVoir(!voir)}
            aria-label={voir ? "Masquer le code" : "Afficher le code"}
            aria-pressed={voir}
            className="grid h-11 w-11 flex-none place-items-center rounded-[10px] border border-[#E6DCC6] bg-[#FFFCF6] text-[#163F6B]"
          >
            {voir ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
        {erreur ? (
          <p role="alert" className="text-[14px] font-bold text-[#B1262E]">
            {erreur}
          </p>
        ) : null}
        <button type="submit" disabled={envoi || !code} className={`${BOUTON_PRINCIPAL} mt-1 w-full`}>
          {envoi ? "Vérification…" : "Entrer"}
        </button>
        <p className={DISCRET}>Cet appareil reste connecté 30 jours.</p>
      </form>
    </main>
  );
}
