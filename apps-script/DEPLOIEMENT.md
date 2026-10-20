# Commandes Dedjo : mise en place

Quand un client clique sur « Commander avec obligation de paiement » :

```
Site (/commande) ──▶ Fonction Netlify (/api/commande) ──▶ Google Apps Script ──▶ Google Sheet « Commandes »
                      URL du script + secret                revérifie et recalcule   ├──▶ e-mail de récapitulatif au client
                      gardés côté serveur                                                 └──▶ message Telegram sur ton téléphone
                                                                                               (e-mail de secours si Telegram échoue)
```

Compte environ 20 minutes. Il te faut : ton compte Google, l'accès à Netlify, ton téléphone avec Telegram.

> **Mise à jour « Atelier (stock) »** (lot 1, octobre 2026) : un second fichier, `Stock.gs`, rejoint `Code.gs` dans l'éditeur, et `Code.gs` change. Suis la section « [Atelier (stock)](#atelier-stock) », en bas de ce document. Tant que la propriété `STOCK_ACTIF` est absente, les commandes fonctionnent exactement comme avant.

> **Mise à jour « CGV »** (lot 2) : le script refuse désormais toute commande sans acceptation des CGV. Publie donc **d'abord le site** (fusion dans `main`, déploiement Netlify terminé), **puis** recolle **tout** le nouveau `Code.gs`, 💾 Enregistrer, et publie une **nouvelle version** du déploiement. Dans l'autre ordre, toutes les commandes seraient refusées en attendant le site. La colonne « Version CGV » s'ajoute toute seule, en dernière position, à la commande suivante.

> **Mise à jour « limites anti-abus »** (octobre 2026) : recolle **tout** le nouveau `Code.gs`, 💾 Enregistrer, puis publie une **nouvelle version** du déploiement (point 3 ci-dessous). Aucune propriété à ajouter : le script crée lui-même `EMAILS_CLIENTS_JOUR`. Détails : « Limites anti-abus », plus bas.

> **Mise à jour d'une installation existante** (e-mail de récapitulatif au client, bouton WhatsApp) :
> 1. Recolle **tout** le nouveau `Code.gs` dans l'éditeur Apps Script, puis 💾 Enregistrer.
> 2. Lance **`testEmailClient`** (étape 6). Apps Script demande une **nouvelle autorisation**, pour envoyer des e-mails en ton nom : accepte-la (même procédure qu'à la première installation).
> 3. Publie une **nouvelle version** du déploiement : **Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer**. Sans cette étape, le site continue d'appeler l'ancien code.
>
> La colonne « E-mail envoyé » est ajoutée automatiquement à ton onglet « Commandes » à la commande suivante, après la colonne « Payée ».

> **Tu avais déjà installé la version ntfy ?** Recolle le nouveau `Code.gs` (étape 2), supprime les propriétés `NTFY_TOPIC`, `NTFY_TOKEN` et `NTFY_SERVER` (étape 4), suis l'étape 5 (Telegram), relance `testNotification` (étape 6), puis déploie une **nouvelle version** (voir « Au quotidien »). Tu peux désinstaller l'app ntfy.

---

## 1. Créer le Google Sheet

1. Sur [Google Drive](https://drive.google.com) : **Nouveau > Google Sheets**. Nomme-le par exemple « Dedjo — Commandes ».
2. **Fichier > Paramètres > Fuseau horaire** : choisis **(GMT+01:00) Paris**, puis enregistre.

L'onglet « Commandes » et ses en-têtes seront créés automatiquement à la première commande.

## 2. Coller le script

1. Dans le Sheet : **Extensions > Apps Script**.
2. Supprime le contenu du fichier `Code.gs` proposé, et colle **tout** le contenu de `apps-script/Code.gs` (ce dossier).
3. Renomme le projet en haut à gauche (« Dedjo commandes »), puis **💾 Enregistrer**.
4. **⚙️ Paramètres du projet** (menu de gauche) : règle le **fuseau horaire** sur `(GMT+01:00) Paris`.

## 3. Générer le secret partagé

Dans le Terminal :

```bash
openssl rand -hex 24
```

Cette valeur sert de **secret partagé** entre Netlify et le script. Elle empêche quiconque d'autre que ta fonction Netlify d'utiliser le script.

## 4. Définir les propriétés du script

Dans Apps Script : **⚙️ Paramètres du projet > Propriétés du script > Ajouter une propriété du script** :

| Propriété | Valeur |
|---|---|
| `SHARED_SECRET` | la valeur générée à l'étape 3 |
| `TELEGRAM_TOKEN` | le jeton du bot (étape 5) |
| `TELEGRAM_CHAT_ID` | l'identifiant de ta conversation avec le bot (étape 5) |
| `ALERT_EMAIL` | *(facultatif)* ton adresse : reçoit l'e-mail de secours, et sert d'adresse de réponse (« répondre à ») des e-mails clients. Par défaut : l'adresse de ton compte Google |

Enregistre. Le script ajoutera lui-même `DERNIER_NUMERO` (le compteur des numéros de commande) et `EMAILS_CLIENTS_JOUR` (le nombre d'e-mails de récapitulatif envoyés dans la journée).

## 5. Créer le bot Telegram

### Créer le bot avec BotFather

1. Dans Telegram, ouvre la conversation avec **[@BotFather](https://t.me/BotFather)** (le compte officiel, avec la coche bleue).
2. Envoie `/newbot`, puis réponds aux deux questions :
   - le **nom** affiché, par exemple `Dedjo Commandes` ;
   - l'**identifiant**, qui doit finir par `bot`, par exemple `dedjo_commandes_bot`.
3. BotFather répond avec le **jeton** du bot, sous la forme `123456789:AAH…`. Copie-le dans la propriété **`TELEGRAM_TOKEN`** (étape 4).
4. *(Facultatif)* Pour donner au bot le logo Dedjo : envoie `/setuserpic` à BotFather, choisis ton bot, puis envoie l'image `public/notif-icon.png`.

> Le jeton donne le contrôle du bot : il ne va que dans les propriétés du script, jamais dans le code ni sur Netlify. S'il fuit, envoie `/revoke` à BotFather pour en générer un nouveau.

### Trouver ton identifiant de conversation (chat ID) avec getUpdates

1. Dans Telegram, cherche ton bot (`@dedjo_commandes_bot`), ouvre la conversation et appuie sur **Démarrer** (ou envoie-lui `/start`, puis n'importe quel message, par exemple « bonjour »).
2. Dans ton navigateur, ouvre l'adresse suivante, en remplaçant `TON_JETON` par le jeton du bot :

   ```
   https://api.telegram.org/botTON_JETON/getUpdates
   ```

3. Dans la réponse, repère le bloc `"chat":{"id":123456789, …}`. Ce nombre est ton **chat ID** : copie-le dans la propriété **`TELEGRAM_CHAT_ID`** (étape 4).
   - Si la réponse est `{"ok":true,"result":[]}` (vide) : renvoie un message au bot, puis recharge la page.
   - Pour recevoir les commandes à plusieurs : crée un groupe Telegram, ajoutes-y le bot, envoie un message dans le groupe, puis relis `getUpdates`. L'identifiant d'un groupe commence par `-`.

### Vérifier depuis le Terminal (facultatif)

```bash
curl -s "https://api.telegram.org/botTON_JETON/sendMessage" -d chat_id=TON_CHAT_ID -d text="Test Dedjo"
```

Le message « Test Dedjo » doit arriver dans la conversation avec le bot.

## 6. Premiers tests, depuis l'éditeur

Dans Apps Script, choisis la fonction à lancer dans la liste en haut, puis **▶ Exécuter**.

> **Autorisations.** À la première exécution, et après chaque mise à jour qui ajoute une capacité (comme l'envoi d'e-mails aux clients), Google demande des autorisations : **Examiner les autorisations**, choisis ton compte. Si Google affiche « Google n'a pas validé cette application », clique sur **Paramètres avancés > Accéder à Dedjo commandes (non sécurisé)** : c'est ton propre script. Puis **Autoriser**. La liste inclut l'**envoi d'e-mails en ton nom** : c'est pour le récapitulatif envoyé aux clients et pour l'e-mail de secours.

1. **`testNotification`** envoie un message Telegram d'exemple, sans rien écrire dans le Sheet.
   - Tu dois recevoir « 🥐 Commande D-TEST » avec les boutons **Ouvrir le Sheet** et **Confirmer sur WhatsApp**. Les caractères `< > &` du message d'exemple doivent s'afficher tels quels.
   - Si le journal indique « Telegram : … Envoi de l'e-mail de secours… », lis la raison (jeton ou chat ID faux) et vérifie ta boîte mail : l'e-mail de secours a dû arriver.
2. **`testEmailClient`** t'envoie l'e-mail de récapitulatif d'exemple, celui que reçoivent les clients. Vérifie sa présentation sur ton téléphone et sur ton ordinateur.
3. **`testerCommande`** passe une vraie commande de test, avec **ton** adresse comme adresse client. Vérifie :
   - le journal d'exécution affiche `{"ok":true,"id":"D-0001"}` ;
   - le Sheet contient un onglet « Commandes » avec une ligne de test, et « oui » dans la colonne **E-mail envoyé** ;
   - tu reçois l'e-mail « Ta commande Dedjo D-0001 est bien reçue » ;
   - Telegram affiche « Commande D-0001 » avec le prénom, le téléphone (cliquable pour appeler), les produits, le total de 25 € (2 sachets + 5 € de livraison), le code postal, le créneau et « ✉️ Récapitulatif envoyé au client » ;
   - le bouton **Confirmer sur WhatsApp** ouvre WhatsApp avec le message de confirmation prérempli.
4. **Nettoie** : supprime la ligne de test du Sheet, puis remets la propriété `DERNIER_NUMERO` à `0`. La première vraie commande sera ainsi la `D-0001`.

## L'e-mail de récapitulatif au client

Après chaque commande, le script envoie au client un e-mail « Ta commande Dedjo D-000X est bien reçue » : numéro, détail des sachets, livraison (offerte ou 5 €), total, adresse, créneau souhaité, version des CGV acceptée, confirmation du créneau sur WhatsApp (moment où la commande devient ferme), paiement à la récupération de la commande (constante `PAIEMENT`), et un rappel de cuisson. Si le client a laissé un commentaire, l'e-mail indique seulement « Ton commentaire : bien reçu » : le texte libre n'est jamais recopié (voir « Limites anti-abus »).

- **Expéditeur** : l'e-mail part de ton compte Gmail, avec le nom affiché **« Dedjo »**. Si le client répond, sa réponse arrive à ton adresse (`ALERT_EMAIL` si défini, sinon celle de ton compte).
- **Personnaliser le texte** : la signature est la constante `SIGNATURE`, en haut de `Code.gs`. Le rappel de cuisson (four préchauffé, une durée pour les viennoiseries et une pour les feuilletés) s'adapte aux produits commandés ; température et durées se règlent dans la constante `CUISSON`, avec les **mêmes valeurs** que `CUISSON` dans `src/lib/catalog.ts`. Après modification : nouvelle version du déploiement.
- **Suivi** : la colonne **E-mail envoyé** du Sheet indique `oui` ou `non`. En cas d'échec, la commande est quand même enregistrée, et le message Telegram l'indique (« ⚠️ Récapitulatif NON envoyé au client », avec la raison).
- **Quota** : Google limite les envois à environ **100 e-mails par jour** avec un compte Gmail gratuit (1 500 avec Google Workspace). Le script n'envoie pas plus de **40 récapitulatifs par jour**, et garde toujours **10 envois** de côté pour l'e-mail de secours (voir « Limites anti-abus »).

## Limites anti-abus

Elles empêchent un robot d'utiliser le formulaire pour envoyer des e-mails depuis ton compte Gmail, ou de remplir ton Sheet.

- **Commandes rapprochées** : au plus **3 commandes en 10 minutes** pour un même visiteur, **3 en 6 heures** pour une même adresse e-mail, et **3 en 6 heures** pour un même téléphone. Au-delà, le site affiche « Trop de commandes en peu de temps… » et **la commande n'est pas enregistrée**.
  - Le visiteur est reconnu grâce à une empreinte de son adresse IP, calculée par la fonction Netlify : l'IP elle-même n'est jamais transmise au script ni enregistrée. Les compteurs sont effacés automatiquement au bout de 6 heures au plus.
  - Pour l'e-mail, les variantes `+étiquette` et, chez Gmail, les points sont ignorés (`ca.mille+1@gmail.com` compte comme `camille@gmail.com`).
- **Saisies filtrées** : le prénom et le nom n'acceptent que des lettres, des espaces, des apostrophes et des traits d'union. L'adresse et la ville refusent les liens et les adresses web (`http`, `www.`, `quelquechose.com`, `@`).
- **Plafond d'e-mails** : au-delà de **40 récapitulatifs dans la journée**, la commande est enregistrée normalement, mais sans e-mail au client. Telegram l'indique (« ⚠️ Récapitulatif NON envoyé au client : plafond… »). C'est sûrement une attaque : regarde les dernières lignes du Sheet.
- **Réserve de quota** : quand il reste **10 envois ou moins** dans le quota Google du jour, le script n'envoie plus de récapitulatif, pour que l'e-mail de secours puisse toujours partir.
- **Réglages** : constantes `LIMITES` et `EMAILS_CLIENTS`, en haut de `Code.gs` (puis nouvelle version du déploiement).
- **Tests depuis l'éditeur** : `testerCommande` n'a pas d'empreinte d'IP et compte donc comme un seul visiteur. Au 4ᵉ essai en 10 minutes, il est refusé : attends 10 minutes. Comme il utilise ton adresse, il est aussi limité à 3 essais en 6 heures.

## Le bouton « Confirmer sur WhatsApp »

Dans chaque message Telegram, le bouton **Confirmer sur WhatsApp** ouvre une conversation avec le client et ce message prérempli : « Salut Camille, c'est Jo de Dedjo ! Ta commande D-0007 (1× La Lune, 1× La Montagne, 25 €) est confirmée pour le samedi 17 octobre (livraison Marseille). À bientôt ! ». Tu peux le modifier avant de l'envoyer.

Les numéros français sont convertis au format international : `06 12 34 56 78` devient `33612345678`. Si le numéro saisi est inutilisable (trop court), le bouton n'apparaît pas.

## 7. Déployer en application web

1. **Déployer > Nouveau déploiement**, puis l'engrenage **⚙️ > Application Web**.
2. Réglages :
   - **Description** : `Commandes v1`
   - **Exécuter en tant que** : **Moi**
   - **Qui a accès** : **Tout le monde**. C'est nécessaire pour que Netlify puisse l'appeler ; le `SHARED_SECRET` empêche quiconque d'autre de s'en servir.
3. **Déployer**, puis copie l'**URL de l'application Web** (elle se termine par `/exec`).
4. Vérification : ouvre cette URL dans ton navigateur. Elle doit afficher `{"ok":true,"service":"Dedjo — commandes"}`.

## 8. Brancher l'URL sur Netlify

1. Netlify : **Site configuration > Environment variables > Add a variable**. Ajoute :

   | Variable | Valeur |
   |---|---|
   | `GSHEET_ORDER_WEBHOOK_URL` | l'URL `/exec` de l'étape 7 |
   | `ORDER_SHARED_SECRET` | **la même valeur** que `SHARED_SECRET` (étape 4) |

2. **Deploys > Trigger deploy > Deploy site** : les fonctions ne lisent les variables qu'au déploiement.

### En local (facultatif)

Ajoute les deux mêmes variables dans ton fichier `.env` (modèle : `.env.example`), puis lance :

```bash
npx netlify dev
```

Ouvre ensuite `http://localhost:8888/commande`. `npm run dev` seul ne fait pas tourner les fonctions : `/api/commande` y renvoie une erreur.

> Une commande passée en local est une **vraie** commande (ligne dans le Sheet et message Telegram) : pense à la supprimer.

## 9. Test de bout en bout, sur le site en ligne

1. Sur `dedjo.com/commande` : ajoute 1 sachet, choisis **Marseille**, sélectionne une adresse dans les suggestions, une date et tes coordonnées, puis coche la case des CGV.
2. **Commander avec obligation de paiement** doit afficher « C'est reçu ! » avec un numéro de commande.
3. Vérifie la ligne dans le Sheet (5 € de livraison, total correct, version des CGV dans la dernière colonne), puis le message Telegram. Touche le numéro de téléphone pour vérifier qu'il lance l'appel.
4. Supprime la ligne de test, et ajuste `DERNIER_NUMERO` si tu veux repartir de `D-0001`.

---

## Au quotidien

- **Suivi** : les colonnes **Confirmée / Livrée / Payée** sont à toi. Pour en faire des cases à cocher, sélectionne-les puis **Insertion > Case à cocher**.
- **Modifier le script** : il tient en deux fichiers, `Code.gs` (commandes) et `Stock.gs` (Atelier) ; recolle **tout** le fichier qui a changé. Après chaque modification, **Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer**. L'URL ne change pas, mais sans nouvelle version, l'ancien code continue de tourner.
- **Changer un prix, le nombre de pièces, les frais ou le seuil de livraison** : modifie **à la fois** `src/lib/catalog.ts` (le site) **et** les constantes `CATALOGUE` / `LIVRAISON` / `SECTEURS` en haut de `Code.gs` (le script, qui recalcule le total), puis redéploie les deux.
- **Changer les moyens de paiement ou la durée de cuisson** : même chose, `MOYENS_PAIEMENT` et `CUISSON` dans `src/lib/catalog.ts`, `PAIEMENT` et `CUISSON` dans `Code.gs`.
- **Modifier les CGV** : donne une nouvelle date à `CGV_VERSION` dans `src/lib/legal.ts`, et **ajoute** cette date à `CGV_VERSIONS` en haut de `Code.gs` (garde l'ancienne quelques jours, pour les visiteurs qui ont encore l'ancienne page ouverte). Publie **d'abord le script** (nouvelle version), **puis** le site : sinon le script refuserait la nouvelle version.
- **Ajouter un produit** : même chose. Ajoute-le aux deux endroits ; une nouvelle colonne apparaîtra dans un **nouvel** onglet « Commandes » (renomme l'ancien en « Commandes (archive) » avant la première commande, pour que les en-têtes se recréent). Relance ensuite `initialiserStock` : il ajoute le produit au classeur Stock, avec le même id.

## Dépannage

Les erreurs du script se lisent dans Apps Script, menu de gauche **Exécutions**.

| Symptôme | Cause probable | Solution |
|---|---|---|
| « Le service de commande n'est pas encore configuré. » | Variables absentes sur Netlify | Étape 8, puis redéployer le site |
| « Accès refusé. » | `ORDER_SHARED_SECRET` (Netlify) ≠ `SHARED_SECRET` (script) | Recopier exactement la même valeur, redéployer le site |
| « Coche la case pour accepter les CGV. » alors que la case est cochée | Le site publié est plus ancien que le script (il n'envoie pas l'acceptation des CGV) | Publier le site, ou attendre la fin du déploiement Netlify |
| « Les conditions générales de vente ont changé… » | `CGV_VERSION` (site) absente de `CGV_VERSIONS` (script), ou page ouverte avant une mise à jour des CGV | Ajouter la date à `CGV_VERSIONS`, nouvelle version du script ; sinon, recharger la page |
| « …a répondu de façon inattendue. » | Mauvaise URL (pas celle en `/exec`), ou accès qui n'est pas « Tout le monde » | Étape 7 |
| Pas de message Telegram, mais un e-mail « notification Telegram en échec » | Telegram a refusé l'envoi : la raison est à la fin de l'e-mail | Voir les lignes ci-dessous |
| Raison : « TELEGRAM_TOKEN ou TELEGRAM_CHAT_ID non défini » | Propriété manquante ou mal nommée | Étape 4 |
| Raison : « HTTP 401 : Unauthorized » | Jeton du bot faux ou révoqué | Recopier le jeton de BotFather dans `TELEGRAM_TOKEN` |
| Raison : « HTTP 400 : Bad Request: chat not found » | Chat ID faux, ou tu n'as jamais écrit au bot | Écrire au bot, puis refaire `getUpdates` (étape 5) |
| Raison : « HTTP 403 : Forbidden: bot was blocked by the user » | Tu as bloqué ou supprimé la conversation avec le bot | Rouvrir le bot dans Telegram et appuyer sur **Démarrer** |
| « Trop de commandes en peu de temps… » | Limite anti-abus atteinte : même visiteur, même e-mail ou même téléphone | Attendre (10 min pour un visiteur, 6 h pour un e-mail ou un téléphone). Pour un vrai client, prendre la commande sur WhatsApp |
| « Prénom : utilise uniquement des lettres… » ou « Adresse : pas de lien… » | Saisie refusée par les filtres anti-abus | Corriger la saisie (pour une abréviation, une espace après le point : « Av. du Prado ») |
| Colonne **E-mail envoyé** à `non` | Envoi au client refusé : la raison est dans le message Telegram (plafond anti-abus du jour, quota quotidien de Google, ou adresse inexistante) | Contacter le client par téléphone ou WhatsApp ; vérifier l'adresse dans le Sheet. Si la raison est le plafond, vérifier les dernières lignes du Sheet (robot ?) |
| L'e-mail au client n'arrive pas, mais la colonne indique `oui` | L'e-mail est dans ses indésirables, ou l'adresse contient une faute de frappe | Lui demander de vérifier ses spams ; corriger l'adresse et le recontacter |
| Ni message Telegram, ni e-mail | Autorisation d'envoi d'e-mails pas accordée, ou quota d'e-mails Google atteint | Relancer `testNotification` depuis l'éditeur et accepter les autorisations ; consulter **Exécutions** |
| Une modification du script n'a aucun effet | Pas de nouvelle version déployée | « Gérer les déploiements » > Nouvelle version |
| En local, `/api/commande` ne répond pas | Site lancé avec `npm run dev` | Utiliser `npx netlify dev` |

Quand seuls Telegram ou l'e-mail échouent, **la commande est quand même enregistrée dans le Sheet**.

## Sécurité et données personnelles

- L'URL du script et le secret partagé ne sont **jamais** envoyés au navigateur : seule la fonction Netlify les connaît.
- Le jeton du bot Telegram et ton chat ID ne sont que dans les propriétés du script. Personne d'autre ne reçoit les messages du bot : il n'écrit qu'à la conversation dont tu lui as donné l'identifiant.
- L'e-mail de récapitulatif part de ton compte Gmail : le client voit ton adresse comme expéditeur, sous le nom « Dedjo ».
- Les messages Telegram contiennent le prénom, le téléphone, le code postal et le commentaire du client, mais pas son adresse e-mail (elle n'est que dans le Sheet). Les journaux d'exécution du script ne contiennent pas non plus l'adresse. Les messages restent dans ta conversation Telegram : supprime-les quand tu n'en as plus besoin.
- Le Sheet contient des données personnelles : limite son partage, et supprime les commandes anciennes quand tu n'en as plus besoin.

---

## Atelier (stock)

L'Atelier gère le stock par lot à Marseille et à la Ferme de la Goëttaz : produits finis, matières premières et emballages. Il relève aussi le congélateur de la ferme à chaque passage, et en déduit les ventes à comparer à l'argent encaissé.

```
Atelier (page privée, lot 3) ──▶ Fonction Netlify (lot 2) ──▶ Google Apps Script (Stock.gs) ──▶ Google Sheet « Dedjo — Stock »
                                  STOCK_SHARED_SECRET          vérifie STOCK_SECRET              privé, jamais partagé
```

Le **lot 1** installe le script seul : rien n'est encore visible sur le site, et les commandes ne changent pas. Compte environ 10 minutes.

### 1. Créer le fichier `Stock.gs`

1. Dans l'éditeur Apps Script, à côté de `Code.gs` : **➕ (Ajouter un fichier) > Script**. Nomme-le `Stock` : l'éditeur ajoute `.gs` tout seul.
2. Colle **tout** le contenu de `apps-script/Stock.gs` dans ce nouveau fichier.
3. Ouvre `Code.gs`, supprime son contenu et colle **tout** le nouveau `apps-script/Code.gs` : il aiguille désormais les actions du stock vers `Stock.gs`.
4. **💾 Enregistrer.**

### 2. Ajouter la propriété `STOCK_SECRET`

1. Dans le Terminal, génère une **nouvelle** valeur :

   ```bash
   openssl rand -hex 24
   ```

2. **⚙️ Paramètres du projet > Propriétés du script > Ajouter une propriété du script** : `STOCK_SECRET`, avec cette valeur.
3. Garde-la : au lot 2, elle ira sur Netlify sous le nom `STOCK_SHARED_SECRET`.

> Ce secret est **distinct** de `SHARED_SECRET` : une fuite de l'un ne donne pas l'autre. Le script refuse toute action du stock (« Accès refusé. ») si `STOCK_SECRET` manque, fait moins de 24 caractères, ou a la même valeur que `SHARED_SECRET`.

### 3. Lancer `initialiserStock`

1. Choisis **`initialiserStock`** dans la liste en haut de l'éditeur, puis **▶ Exécuter**.
2. Si Google demande une nouvelle autorisation (créer et modifier des classeurs dans ton Drive), accepte-la : même procédure qu'à l'étape 6.
3. Le journal d'exécution affiche « Classeur « Dedjo — Stock » créé dans ton Drive. Ne le partage pas. ».
4. Vérifie :
   - ton Drive contient le classeur « Dedjo — Stock », avec 7 onglets : `Articles`, `Emplacements`, `Lots`, `Mouvements`, `Reservations`, `Passages`, `PassagesDetail` ;
   - `Articles` compte 29 lignes : les 8 produits du site, 19 matières premières et 2 emballages ;
   - `Emplacements` compte 3 lignes : `marseille` (compte pour le site), `ferme` et `route` ;
   - la propriété `STOCK_SPREADSHEET_ID` est apparue dans les propriétés du script.
5. Lance **`testerStock`**. Le journal doit afficher `{"ok":true,"actif":false,…,"produits":{"lune":"bientot",…}}` : les 8 produits sont « bientot », puisque rien n'est encore en stock.

> **Ne partage jamais ce classeur**, et ne recopie son identifiant nulle part : il n'est que dans `STOCK_SPREADSHEET_ID`. Le classeur des commandes peut être partagé sans exposer le stock.
>
> Relancer `initialiserStock` est sans risque : il n'ajoute que les onglets, articles et emplacements manquants.

**Codes lot** : `1` pour La Lune, repris de l'étiquette réelle. Les codes `2` à `8` des autres produits sont proposés par défaut et **restent à confirmer** : la colonne « Code lot confirmé » vaut `non`. Tu les confirmeras dans les Réglages de l'Atelier (lot 3).

**Conservation** : 4 mois pour La Lune, La Cabosse, La Grappe et La Rose ; 2 mois pour les feuilletés salés. La DDM proposée à la production en découle, et se règle par produit dans la colonne « Conservation (mois) ».

### 4. Déployer une nouvelle version

**Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer.** L'URL ne change pas.

### 5. Ne pas mettre `STOCK_ACTIF` avant le lot 5

Tant que la propriété `STOCK_ACTIF` est absente, les commandes du site fonctionnent **exactement comme avant** : le script n'ouvre même pas le classeur Stock. Au lot 5, `STOCK_ACTIF` à `oui` fera réserver les sachets de chaque commande sur le stock de Marseille.

### Vérifier

1. Lance **`testerCommande`** (étape 6) : le journal affiche `{"ok":true,"id":"D-000X"}`, la ligne de test arrive dans l'onglet « Commandes », comme avant. Nettoie ensuite la ligne et `DERNIER_NUMERO` (étape 6, point 4).
2. Sur ton ordinateur, à la racine du dépôt, lance les tests du stock (aucune installation nécessaire) :

   ```bash
   node --test apps-script/tests/stock.test.mjs
   ```

   La fin doit afficher `# pass 24` et `# fail 0`. Les tests utilisent un faux classeur en mémoire et des données inventées : ils ne touchent ni Google ni ton stock.

### Lot 2 : brancher Netlify

Le lot 2 ajoute quatre fonctions Netlify (logique commune dans `netlify/lib/atelier.ts`) :

| Route | Rôle |
|---|---|
| `POST /api/atelier-connexion` | vérifie le code d'accès, puis pose un cookie de session de 30 jours sur l'appareil |
| `POST /api/atelier-deconnexion` | efface le cookie de cet appareil |
| `POST /api/atelier` | relaie les actions « stock.* » vers le script, seulement avec une session valide |
| `GET /api/dispo` | public : le statut de chaque produit, mis en cache une minute, et rien d'autre |

Le lot 1 doit être en place (points 1 à 4 ci-dessus). Compte environ 10 minutes.

1. **Génère le secret de session**, dans le Terminal :

   ```bash
   openssl rand -hex 32
   ```

2. **Choisis le code d'accès** : une phrase de passe de **16 caractères au moins**, par exemple quatre ou cinq mots que toi seul associes, facile à taper sur ton téléphone. Ne la réutilise nulle part ailleurs.
3. **Netlify : Site configuration > Environment variables > Add a variable.** Ajoute :

   | Variable | Valeur |
   |---|---|
   | `STOCK_SHARED_SECRET` | **la même valeur** que la propriété `STOCK_SECRET` du script (lot 1, point 2) |
   | `STOCK_ACCESS_CODE` | ta phrase de passe (point 2) |
   | `STOCK_SESSION_SECRET` | la valeur générée au point 1 |

   `GSHEET_ORDER_WEBHOOK_URL` est déjà là : l'Atelier utilise le même script que les commandes. Si Netlify te propose de marquer une valeur comme secrète (« Contains secret values »), coche-le pour les trois.
4. **Publie le site** avec ce code (fusion de la branche dans `main`). Les fonctions ne lisent les variables qu'au déploiement : si tu ajoutes ou changes une variable après coup, relance **Deploys > Trigger deploy > Deploy site**.

Rien à activer pour Netlify Blobs : le compteur des tentatives de connexion (magasin « atelier-tentatives ») se crée tout seul au premier code faux.

#### Vérifier le lot 2

1. Statuts publics : ouvre `https://dedjo.com/api/dispo` dans ton navigateur. Il doit afficher `{"actif":false}` : le stock n'est pas encore actif (`STOCK_ACTIF` absent). Au lot 5, la réponse deviendra `{"actif":true,"maj":"…","produits":{"lune":"disponible",…}}`, sans aucun nombre.
2. Atelier fermé sans session, dans le Terminal :

   ```bash
   curl -i -X POST https://dedjo.com/api/atelier -H "X-Atelier: 1" -d '{"action":"stock.etat"}'
   ```

   La réponse commence par `HTTP/2 401`, contient `x-robots-tag: noindex, nofollow` et se termine par `{"ok":false}`.
3. *(Facultatif)* Limite des tentatives : lance six fois la commande ci-dessous. Les cinq premières répondent « Code incorrect. », la sixième « Trop d'essais, réessaie dans quelques minutes. ». Ta connexion est alors bloquée 15 minutes, même avec le bon code.

   ```bash
   curl -X POST https://dedjo.com/api/atelier-connexion -H "X-Atelier: 1" -d '{"code":"essai-faux-0000000"}'
   ```

4. Tests sur ton ordinateur, sans Netlify :

   ```bash
   node --test netlify/tests/atelier.test.mjs
   ```

   La fin doit afficher `# pass 11` et `# fail 0`.

La connexion avec le bon code se vérifiera depuis la page de l'Atelier, au lot 3.

#### Sessions et code d'accès

- **Déconnecter tous les appareils** (téléphone perdu, code divulgué) : remplace `STOCK_SESSION_SECRET` sur Netlify par une nouvelle valeur (`openssl rand -hex 32`), puis **Deploys > Trigger deploy > Deploy site**. Tous les cookies existants deviennent invalides.
- **Changer le code d'accès** : modifie `STOCK_ACCESS_CODE`, puis redéploie. Les appareils déjà connectés le restent : change aussi `STOCK_SESSION_SECRET` pour les déconnecter.
- Une session dure **30 jours** sur chaque appareil, puis le code est redemandé.

### Lot 3 : la page de l'Atelier

La page **dedjo.com/atelier** est l'outil du quotidien, pensé pour le téléphone :

- **barre du bas** : Stock · Saisir (+) · Ferme · Commandes · Journal ; **Réglages** par la roue dentée, en haut à droite. Ferme et Commandes arrivent aux lots 4 et 5 ;
- **Stock** : filtre Tout / Marseille / Ferme / En route, alertes (sous le seuil, DDM à moins de 30 jours ou dépassée), puis fiche produit et fiche lot (historique, matières utilisées, « utilisé dans ») ;
- **Saisir** : production, réception, sortie, envoi vers la ferme, transfert, inventaire ; depuis une fiche lot, sortie ou transfert de ce lot précis ;
- **Journal** : recherche par n° de lot, article ou note, filtre par type, et annulation en deux temps (« Annuler », puis « Confirmer l'annulation » dans les 5 secondes) ;
- **Réglages** : articles et emplacements, réserve hors site et codes lot, reprise du fichier « Stock par lot » de l'ancienne app, exports CSV du stock par lot et du journal, déconnexion.

La page n'est citée nulle part sur le site : ni menu, ni pied de page, ni `robots.txt`. Elle est marquée `noindex` dans la page et dans l'en-tête `X-Robots-Tag`, et son code est chargé à part : un visiteur du site ne le télécharge jamais.

**Réseau fragile** (la ferme en partage de connexion) : si l'envoi échoue, le formulaire garde ce que tu as saisi et propose **Réessayer**, et un bandeau « Hors ligne » s'affiche. Une saisie partie mais dont la réponse s'est perdue n'est jamais comptée deux fois : au nouvel essai, l'Atelier affiche « (saisie déjà reçue) ».

#### Mettre en service le lot 3

1. Le script change un peu (ordre du journal, qui suit désormais la date des opérations) : recolle **tout** `apps-script/Stock.gs` dans l'éditeur, 💾 Enregistrer, puis **nouvelle version** du déploiement.
2. Publie le site : fusion de la branche dans `main` (les lots 1 et 2 doivent être en place).

#### Vérifier le lot 3

1. Ouvre `https://dedjo.com/atelier` sur ton téléphone : l'écran du code s'affiche. Entre ta phrase de passe : la vue Stock apparaît, avec le catalogue initial (tout à 0 avant la reprise).
2. Ajoute la page à l'écran d'accueil : Safari, **Partager > Sur l'écran d'accueil** (Chrome : menu **⋮ > Ajouter à l'écran d'accueil**).
3. Reprends ton stock : **Réglages > Reprise du stock**, choisis le fichier « Stock par lot » exporté par l'ancienne app, puis **Importer**. Vérifie les quantités dans Stock, emplacement par emplacement.
4. Essai d'écriture : une réception de test (par exemple 1 kg de sel), puis annule-la dans le Journal. Elle reste visible, barrée, avec « Annulé ».
5. Ouvre directement `https://dedjo.com/cgv` : la page s'affiche. Avant ce lot, ouvrir directement une page autre que l'accueil donnait une erreur 404 (règles par page dans `netlify.toml`).

#### Essayer l'Atelier sur ton ordinateur, sans toucher au vrai stock

```bash
npm run atelier:local
```

Le vrai script tourne alors sur un faux classeur en mémoire, avec un stock de démonstration inventé, derrière `netlify dev`. Ouvre `http://localhost:8888/atelier`, code `atelier-local-0000`. **Ctrl+C** arrête tout ; rien n'est écrit, ni sur le disque ni chez Google.

### Les propriétés du stock

| Propriété | Valeur |
|---|---|
| `STOCK_SECRET` | la valeur générée au point 2 ; même valeur que `STOCK_SHARED_SECRET` sur Netlify (lot 2) |
| `STOCK_SPREADSHEET_ID` | remplie par `initialiserStock` : l'identifiant du classeur Stock |
| `STOCK_ACTIF` | `oui` au lot 5 seulement : les commandes réservent leurs sachets |
| `STOCK_VERSION` | gérée automatiquement : change à chaque écriture, pour rafraîchir le cache |

### Comment le stock est tenu

- **Aucune quantité n'est écrite dans le classeur** : le stock d'un lot à un emplacement est la somme de ses mouvements non annulés. Ne modifie pas l'onglet `Mouvements` à la main : passe par l'Atelier.
- **Rien ne s'efface** : une saisie erronée s'annule (colonne « Annulé »). L'annulation est refusée si le stock a déjà servi, par exemple un transfert déjà vendu : il faut alors corriger par une nouvelle saisie.
- **N° de lot d'un produit fini** : code lot + date de fabrication `JJMMAA` + mois et année de DDM `MMAA`. La Lune fabriquée le 12/09/2026, DDM le 12/01/2027 : `11209260127`. Une production au même n° s'ajoute au lot existant.
- **N° de lot d'une réception** : celui du fournisseur, sinon `R` + `JJMMAA` + `-` + 3 lettres de l'article (`R150926-FAR`).
- **Ordre de sortie** : toujours le lot dont la DDM est la plus proche, puis la fabrication la plus ancienne.
- **Écritures sûres** : sous le même verrou que les commandes. Une saisie qui rendrait un lot négatif est refusée en entier. Une saisie envoyée deux fois (réseau coupé à la ferme, double appui) n'est enregistrée qu'une fois.
- **Statuts du site**, calculés sur Marseille seulement : `disponible` (au moins 1 sachet hors réservations et réserve hors site), `victime` (plus rien, mais déjà entré en stock à Marseille), `bientot` (jamais en stock). La réponse publique ne contient que ces statuts.

### Actions du script (pour la fonction Netlify du lot 2)

Toutes passent par `doPost` avec `{ action, secret, … }` ; les écritures portent un `idOperation` généré par le navigateur.

| Action | Rôle |
|---|---|
| `stock.dispo` | statuts du site par produit, et `actif` (valeur de `STOCK_ACTIF`) |
| `stock.etat` | catalogue, emplacements, lots et quantités, réservations ouvertes, 300 derniers mouvements groupés par opération, passages |
| `stock.operation` | `type` : `production`, `reception`, `sortie`, `envoi` (Marseille vers « En route »), `transfert`, `inventaire` |
| `stock.passage` | passage à la ferme ; avec `apercu: true`, renvoie le récapitulatif sans rien écrire |
| `stock.encaissement` | compléter ou corriger l'encaissé d'un passage |
| `stock.commande` | `decision` : `remise` (sortie du stock, « Livrée » cochée) ou `annulee` (sachets libérés) |
| `stock.annuler` | annuler une opération du journal |
| `stock.catalogue` | articles (dont la réserve hors site) et emplacements |
| `stock.lot` | fiche d'un lot : historique, matières utilisées, « utilisé dans » |
| `stock.journal` | journal par page, avec `recherche` et `genre` |
| `stock.import` | reprise du CSV « Stock par lot » exporté par la maquette |

### Dépannage du stock

| Symptôme | Cause probable | Solution |
|---|---|---|
| « Accès refusé. » sur une action du stock | `STOCK_SECRET` absent, trop court, identique à `SHARED_SECRET`, ou différent de `STOCK_SHARED_SECRET` (Netlify) | Point 2, puis nouvelle version du déploiement |
| « Le classeur Stock n'est pas encore créé… » | `initialiserStock` jamais lancé | Point 3 |
| « Onglet … introuvable » ou « en-têtes inattendus » | Onglet renommé, ou en-têtes modifiés à la main | Rétablir le nom ou les en-têtes, puis relancer `initialiserStock` |
| « STOCK_SPREADSHEET_ID ne correspond à aucun classeur… » | Classeur supprimé, ou propriété mal recopiée | Restaurer le classeur depuis la corbeille du Drive, ou corriger la propriété |
| « Erreur interne (STK-…) » | Erreur inattendue du script | Menu **Exécutions** : cherche ce code. Le journal ne contient jamais de quantité ni de lot |
| « Le stock est occupé, réessaie dans un instant. » | Une autre écriture ou une commande est en cours | Réessayer : la saisie ne sera pas enregistrée deux fois |
| Avec `STOCK_ACTIF` à `oui`, toutes les commandes échouent en « Erreur interne » | Classeur Stock inaccessible | Supprimer `STOCK_ACTIF` le temps de corriger : les commandes repartent comme avant |
| `/api/dispo` répond `{"actif":false}` avec une erreur 503 | Variable manquante sur Netlify, `STOCK_SHARED_SECRET` ≠ `STOCK_SECRET`, ou lot 1 pas encore déployé | Netlify : **Logs > Functions > dispo**, la ligne « Atelier DSP-… » donne la raison |
| « L'Atelier n'est pas encore configuré (ATL-CONF-…) » | `STOCK_ACCESS_CODE` (moins de 16 caractères) ou `STOCK_SESSION_SECRET` (moins de 32) manquant ou trop court | Lot 2, point 3, puis redéployer |
| « Le script refuse l'accès au stock : vérifie STOCK_SHARED_SECRET » | `STOCK_SHARED_SECRET` (Netlify) ≠ `STOCK_SECRET` (script) | Recopier exactement la même valeur, puis redéployer |
| « Trop d'essais, réessaie dans quelques minutes. » | 5 codes faux en 15 minutes depuis cette connexion | Attendre 15 minutes |
| « Connexion impossible pour le moment (ATL-BLOBS-…) » | Netlify Blobs indisponible : la connexion est refusée plutôt que laissée sans limite | Réessayer plus tard ; consulter **Logs > Functions > atelier-connexion** |

### Sécurité du stock

- Le classeur Stock n'est jamais partagé, et son identifiant n'est que dans les propriétés du script.
- Le secret du stock est distinct de celui des commandes, et comparé en temps constant.
- Les journaux d'exécution ne contiennent ni quantité, ni lot, ni montant : une erreur inattendue n'y laisse qu'un code.
- Le site public ne reçoit que les statuts `disponible`, `victime` et `bientot` : jamais de quantité, de lot, de date, ni rien sur la ferme ou la caisse. La fonction `dispo` refiltre la réponse du script : seuls ces trois mots peuvent passer.
- L'Atelier s'ouvre avec un code d'accès, comparé en temps constant. Après 5 codes faux en 15 minutes, la connexion est bloquée ; le compteur, dans Netlify Blobs, ne garde qu'une empreinte de l'adresse IP, jamais l'adresse elle-même ni le code saisi.
- Le cookie de session est signé, illisible par le JavaScript de la page (`HttpOnly`), envoyé seulement en HTTPS (`Secure`) et seulement depuis dedjo.com (`SameSite=Strict`). Chaque écriture exige en plus l'en-tête `X-Atelier: 1`.
- Les routes `/api/atelier*` ne sont jamais mises en cache ni indexées, et n'acceptent qu'une liste fermée d'actions du script.
