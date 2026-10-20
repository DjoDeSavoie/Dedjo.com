/* POST /api/atelier { action, … } : relais authentifié vers les actions « stock.* » du script
   Apps Script. Session valide (cookie), en-tête X-Atelier: 1 et action de la liste blanche exigés.
   Logique et variables d'environnement : netlify/lib/atelier.ts */

import { traiterAtelier } from "../lib/atelier";

export default async (req: Request) => traiterAtelier(req, { env: process.env });

export const config = { path: "/api/atelier" };
