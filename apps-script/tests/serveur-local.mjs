/* Atelier en local, sans toucher au vrai stock : npm run atelier:local
   1. fait tourner le vrai script (Code.gs + Stock.gs) sur le faux Google de faux-google.mjs, avec un
      stock de démonstration inventé, derrière une petite adresse locale qui imite Apps Script ;
   2. lance `netlify dev` (site + fonctions) branché sur ce faux script, avec des secrets inventés.
   Puis ouvrir http://localhost:8888/atelier, code « atelier-local-0000 ». Ctrl+C arrête tout.
   Option --sans-netlify : seulement le faux script (port 8790). Rien n'est écrit sur le disque. */

import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SECRET_COMMANDES, SECRET_STOCK, preparer } from "./faux-google.mjs";

const PORT_SCRIPT = 8790;
const PORT_SITE = 8888;
const CODE_ACCES = "atelier-local-0000";
const JOUR = 24 * 60 * 60 * 1000;

const env = preparer();

/** Date d'il y a `n` jours, au format AAAA-MM-JJ. */
const ilYa = (n) => new Date(Date.now() - n * JOUR).toISOString().slice(0, 10);

function operation(type, champs) {
  const r = env.operation(type, champs);
  if (!r.ok) throw new Error(`Stock de démonstration : ${type} refusé (${r.error})`);
}

// Stock de démonstration (inventé)
env.appeler("stock.catalogue", { articles: [{ id: "cabosse", seuilMarseille: 10 }, { id: "lune", reserveHorsSite: 2 }] });
operation("reception", { article: "mp-farine", quantite: 25, reception: ilYa(30), ddm: ilYa(-200), fournisseur: "Moulin d'exemple", numero: "FAR-2026-01" });
operation("reception", { article: "mp-beurre", quantite: 10, reception: ilYa(12), ddm: ilYa(-40), fournisseur: "Laiterie d'exemple" });
operation("reception", { article: "emb-sacs", quantite: 200, reception: ilYa(60) });
operation("production", {
  article: "lune",
  quantite: 12,
  fabrication: ilYa(20),
  intrants: [
    { article: "mp-farine", quantite: 3 },
    { article: "mp-beurre", quantite: 1.5 },
  ],
});
operation("production", { article: "cabosse", quantite: 8, fabrication: ilYa(15) });
operation("production", { article: "grappe", quantite: 4, fabrication: ilYa(100) });
operation("production", { article: "montagne", quantite: 6, fabrication: ilYa(10) });
operation("envoi", { lignes: [{ article: "lune", quantite: 4 }] });
env.appeler("stock.passage", { ajouts: { lune: 4, montagne: 2 }, horodatage: Date.now() - 2 * JOUR });
operation("sortie", { emplacement: "marseille", motif: "Dégustation / offert", lignes: [{ article: "montagne", quantite: 1 }], note: "Marché d'essai" });

// Faux Apps Script : POST → doPost, GET → doGet, comme le déploiement en application web
const serveur = http.createServer((req, res) => {
  let corps = "";
  req.on("data", (morceau) => (corps += morceau));
  req.on("end", () => {
    const sortie = req.method === "POST" ? env.ctx.doPost({ postData: { contents: corps } }) : env.ctx.doGet();
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(sortie.getContent());
  });
});
serveur.listen(PORT_SCRIPT, "127.0.0.1", () => {
  console.log(`Faux script Apps Script : http://127.0.0.1:${PORT_SCRIPT}/exec (stock de démonstration inventé)`);
});

if (!process.argv.includes("--sans-netlify")) {
  const racine = fileURLToPath(new URL("../..", import.meta.url));
  const netlify = spawn("npx", ["netlify", "dev", "--offline", "--port", String(PORT_SITE)], {
    cwd: racine,
    stdio: "inherit",
    env: {
      ...process.env,
      BROWSER: "none",
      // Variables de l'environnement : elles passent avant celles d'un fichier .env
      GSHEET_ORDER_WEBHOOK_URL: `http://127.0.0.1:${PORT_SCRIPT}/exec`,
      ORDER_SHARED_SECRET: SECRET_COMMANDES,
      STOCK_SHARED_SECRET: SECRET_STOCK,
      STOCK_ACCESS_CODE: CODE_ACCES,
      STOCK_SESSION_SECRET: "secret-session-local-invente-0123456789",
    },
  });
  console.log(`Atelier : http://localhost:${PORT_SITE}/atelier · code « ${CODE_ACCES} »`);
  const arreter = () => {
    netlify.kill("SIGTERM");
    serveur.close();
    process.exit(0);
  };
  process.on("SIGINT", arreter);
  process.on("SIGTERM", arreter);
  netlify.on("exit", (code) => {
    serveur.close();
    process.exit(code || 0);
  });
}
