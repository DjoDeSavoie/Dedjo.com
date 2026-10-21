/* Contexte de l'Atelier : état du stock, feuilles ouvertes, messages, et envoi des saisies. */

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { appeler, ErreurAtelier, nouvelIdOperation } from "./api";
import type { Etat, Feuille, ResultatEcriture } from "./types";
import type { Filtre } from "./outils";

export interface ContexteAtelier {
  etat: Etat;
  filtre: Filtre;
  ouvrir: (f: Feuille) => void;
  /** Revient à la feuille précédente (ou ferme la dernière). */
  retour: () => void;
  /** Ferme toutes les feuilles. */
  fermer: () => void;
  profondeur: number;
  notifier: (message: string, erreur?: boolean) => void;
  sessionTerminee: () => void;
  signalerReseau: (enLigne: boolean) => void;
}

export const Contexte = createContext<ContexteAtelier | null>(null);

/** Rang d'une feuille dans la pile : seule la dernière est visible et réagit au clavier. */
export const NiveauFeuille = createContext(0);

export function useAtelier(): ContexteAtelier {
  const ctx = useContext(Contexte);
  if (!ctx) throw new Error("useAtelier doit être utilisé dans l'Atelier");
  return ctx;
}

export interface EtatEnvoi {
  envoi: boolean;
  erreur: string;
  /** Réseau coupé ou serveur muet : « Réessayer » renvoie la même saisie, avec le même idOperation. */
  reseau: boolean;
}

/**
 * Envoi d'une saisie. L'idOperation est fixé à l'ouverture du formulaire et gardé jusqu'au succès :
 * si le réseau coupe à la ferme ou si l'on appuie deux fois, le script ne l'enregistre qu'une fois.
 * En cas d'échec, le formulaire garde ce qui a été saisi.
 */
export function useEcriture(apresSucces?: (r: ResultatEcriture) => void) {
  const { notifier, fermer, sessionTerminee, signalerReseau } = useAtelier();
  const client = useQueryClient();
  const idOperation = useRef(nouvelIdOperation());
  const enCours = useRef(false);
  const [etat, setEtat] = useState<EtatEnvoi>({ envoi: false, erreur: "", reseau: false });

  const envoyer = useCallback(
    async (action: string, params: object) => {
      if (enCours.current) return null;
      enCours.current = true;
      setEtat({ envoi: true, erreur: "", reseau: false });
      try {
        const r = await appeler<ResultatEcriture>(action, { ...params, idOperation: idOperation.current });
        signalerReseau(true);
        idOperation.current = nouvelIdOperation();
        setEtat({ envoi: false, erreur: "", reseau: false });
        // Saisie déjà reçue (réponse perdue, puis « Réessayer ») : rien n'a été compté deux fois
        notifier(r.deja ? `${r.message} (saisie déjà reçue)` : r.message);
        client.invalidateQueries({ queryKey: ["atelier"] });
        if (apresSucces) apresSucces(r);
        else fermer();
        return r;
      } catch (e) {
        const err = e instanceof ErreurAtelier ? e : new ErreurAtelier("Erreur inattendue.", 0, true);
        if (err.statut === 401) sessionTerminee();
        if (err.reseau) signalerReseau(false);
        setEtat({ envoi: false, erreur: err.message, reseau: err.reseau });
        return null;
      } finally {
        enCours.current = false;
      }
    },
    [apresSucces, client, fermer, notifier, sessionTerminee, signalerReseau]
  );

  /** Montre une erreur de saisie trouvée avant l'envoi. */
  const refuser = useCallback((message: string) => setEtat({ envoi: false, erreur: message, reseau: false }), []);

  return { ...etat, envoyer, refuser };
}
