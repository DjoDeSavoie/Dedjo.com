/* GET /api/dispo, public : statut de chaque produit sur le site (disponible, victime, bientot),
   mis en cache une minute sur le CDN de Netlify. Jamais de quantité, de lot ni rien sur la ferme.
   Logique et variables d'environnement : netlify/lib/atelier.ts */

import { traiterDispo } from "../lib/atelier";

export default async (req: Request) => traiterDispo(req, { env: process.env });

export const config = { path: "/api/dispo" };
