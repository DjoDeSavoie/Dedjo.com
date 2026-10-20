# Dedjo.com

Site de Dedjo, « L'artisanat qui se partage » : viennoiseries et feuilletés salés façonnés à la main, livrés congelés à Marseille ou à retirer au marché de la Ferme de la Goëttaz, en Savoie.

## Technique

- **Site** : Vite, React, TypeScript, Tailwind CSS et composants shadcn/ui (`src/`).
- **Hébergement** : Netlify, qui publie la branche `main`.
- **Fonctions serveur** : `netlify/functions/` (commandes, contact, newsletter, stock), appelées par le site via `/api/*` (voir `netlify.toml`). Tests : `node --test apps-script/tests/stock.test.mjs netlify/tests/atelier.test.mjs`.
- **Commandes** : Google Apps Script et Google Sheet (`apps-script/`). Mise en place pas à pas : [`apps-script/DEPLOIEMENT.md`](apps-script/DEPLOIEMENT.md).
- **Catalogue** : `src/lib/catalog.ts` (produits, prix, disponibilité, secteurs). Les prix et secteurs sont recopiés dans `apps-script/Code.gs` : toute modification se fait aux deux endroits.

## Travailler en local

Il faut Node.js 22 et npm.

```bash
npm install
npm run dev
```

Le site s'ouvre sur `http://localhost:5173`. Ce mode ne fait pas tourner les fonctions Netlify : pour tester `/api/commande` et les formulaires, copie `.env.example` en `.env`, renseigne les variables, puis lance :

```bash
npx netlify dev
```

et ouvre `http://localhost:8888`.

## Autres commandes

| Commande | Rôle |
|---|---|
| `npm run build` | construit le site dans `dist/` |
| `npm run preview` | sert la version construite |
| `npm run lint` | vérifie le code avec ESLint |

## Secrets

Aucun secret dans le dépôt : les clés et URL sont dans les variables d'environnement Netlify (modèle : `.env.example`) et dans les propriétés du script Apps Script.
