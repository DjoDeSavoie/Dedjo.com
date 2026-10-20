/* POST /api/atelier-deconnexion : efface le cookie de session de cet appareil.
   Pour déconnecter tous les appareils, changer STOCK_SESSION_SECRET (voir netlify/lib/atelier.ts). */

import { traiterDeconnexion } from "../lib/atelier";

export default async (req: Request) => traiterDeconnexion(req);

export const config = { path: "/api/atelier-deconnexion" };
