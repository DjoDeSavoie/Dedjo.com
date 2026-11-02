# Dedjo.com

Site de Dedjo, « L'artisanat qui se partage » : viennoiseries et feuilletés salés façonnés à la main, livrés congelés à Marseille ou à retirer au marché de la Ferme de la Goëttaz, en Savoie.

## Technique

- **Site** : Vite, React, TypeScript, Tailwind CSS et composants shadcn/ui (`src/`).
- **Hébergement** : Netlify, qui publie la branche `main`.
- **Fonctions serveur** : `netlify/functions/` (commandes, contact, newsletter, stock), appelées par le site via `/api/*` (voir `netlify.toml`).
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
| `npm run photos` | prépare les photos des produits (voir ci-dessous) |
| `npm run test:atelier` | tests du stock (script Apps Script et fonctions Netlify), sans Google ni Netlify |
| `npm run atelier:local` | Atelier complet en local, sur un faux classeur et un stock de démonstration inventé (voir `apps-script/DEPLOIEMENT.md`) |

## Photos des produits

1. Dépose la photo, en JPEG ou PNG, dans `photos-originales/` (hors du dépôt) sous le nom `{id}-{n}.jpg`, ex. `lune-1.jpg` : n° 1 = photo de la carte, 2 et suivants = photos de la pop-up.
2. Lance `npm run photos` : il crée `{id}-{n}-600.webp` et `-1200.webp` dans `src/assets/produits/`, recadrés en 4:3, sans aucune métadonnée (ni position GPS), et affiche leur poids.
3. Vérifie avec `npm run dev`, puis commite les `.webp`. Pour retirer une photo, supprime ses deux `.webp` ; un produit sans photo garde son emoji.

## Secrets

Aucun secret dans le dépôt : les clés et URL sont dans les variables d'environnement Netlify (modèle : `.env.example`) et dans les propriétés du script Apps Script.
