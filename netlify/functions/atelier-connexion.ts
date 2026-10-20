/* POST /api/atelier-connexion { code } : code d'accès de l'Atelier → cookie de session.
   5 échecs au plus par 15 minutes et par visiteur, comptés dans Netlify Blobs.
   Logique et variables d'environnement : netlify/lib/atelier.ts */

import { getStore } from "@netlify/blobs";
import { magasinBlobs, traiterConnexion } from "../lib/atelier";

export default async (req: Request, context: { ip?: string }) =>
  traiterConnexion(req, {
    env: process.env,
    ip: context.ip,
    // Cohérence forte : un échec compté se voit tout de suite, depuis n'importe quel serveur
    tentatives: magasinBlobs(getStore({ name: "atelier-tentatives", consistency: "strong" })),
  });

export const config = { path: "/api/atelier-connexion" };
