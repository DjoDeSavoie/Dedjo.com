# Commandes Dedjo : mise en place

Quand un client clique sur « Valider ma commande » :

```
Site (/commande) ──▶ Fonction Netlify (/api/commande) ──▶ Google Apps Script ──▶ Google Sheet « Commandes »
                      URL du script + secret                revérifie et recalcule   ├──▶ e-mail de récapitulatif au client
                      gardés côté serveur                                                 └──▶ message Telegram sur ton téléphone
                                                                                               (e-mail de secours si Telegram échoue)
```

Compte environ 20 minutes. Il te faut : ton compte Google, l'accès à Netlify, ton téléphone avec Telegram.

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

Enregistre. Le script ajoutera lui-même `DERNIER_NUMERO` (le compteur des numéros de commande).

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
   - Telegram affiche « Commande D-0001 » avec le prénom, le téléphone (cliquable pour appeler), les produits, le total de 25 € (2 sachets + 5 € de livraison), le code postal, le créneau et « ✉️ Récapitulatif envoyé à … » ;
   - le bouton **Confirmer sur WhatsApp** ouvre WhatsApp avec le message de confirmation prérempli.
4. **Nettoie** : supprime la ligne de test du Sheet, puis remets la propriété `DERNIER_NUMERO` à `0`. La première vraie commande sera ainsi la `D-0001`.

## L'e-mail de récapitulatif au client

Après chaque commande, le script envoie au client un e-mail « Ta commande Dedjo D-000X est bien reçue » : numéro, détail des sachets, livraison (offerte ou 5 €), total, adresse, créneau souhaité, commentaire, paiement en espèces à la récupération de la commande, et un rappel de cuisson.

- **Expéditeur** : l'e-mail part de ton compte Gmail, avec le nom affiché **« Dedjo »**. Si le client répond, sa réponse arrive à ton adresse (`ALERT_EMAIL` si défini, sinon celle de ton compte).
- **Personnaliser le texte** : la signature est la constante `SIGNATURE`, en haut de `Code.gs`. Le rappel de cuisson (four préchauffé à 180 °C : 25 min pour les viennoiseries, 30 min pour les feuilletés) s'adapte aux produits commandés ; températures et durées se règlent dans la constante `CUISSON`. Après modification : nouvelle version du déploiement.
- **Suivi** : la colonne **E-mail envoyé** du Sheet indique `oui` ou `non`. En cas d'échec, la commande est quand même enregistrée, et le message Telegram l'indique (« ⚠️ E-mail de récapitulatif NON envoyé », avec la raison).
- **Quota** : Google limite les envois à environ **100 e-mails par jour** avec un compte Gmail gratuit (1 500 avec Google Workspace).

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

1. Sur `dedjo.com/commande` : ajoute 1 sachet, choisis **Marseille**, sélectionne une adresse dans les suggestions, une date et tes coordonnées.
2. **Valider ma commande** doit afficher « C'est reçu ! » avec un numéro de commande.
3. Vérifie la ligne dans le Sheet (5 € de livraison, total correct), puis le message Telegram. Touche le numéro de téléphone pour vérifier qu'il lance l'appel.
4. Supprime la ligne de test, et ajuste `DERNIER_NUMERO` si tu veux repartir de `D-0001`.

---

## Au quotidien

- **Suivi** : les colonnes **Confirmée / Livrée / Payée** sont à toi. Pour en faire des cases à cocher, sélectionne-les puis **Insertion > Case à cocher**.
- **Modifier le script** : après chaque modification, **Déployer > Gérer les déploiements > ✏️ > Version : Nouvelle version > Déployer**. L'URL ne change pas, mais sans nouvelle version, l'ancien code continue de tourner.
- **Changer un prix, le nombre de pièces, les frais ou le seuil de livraison** : modifie **à la fois** `src/lib/catalog.ts` (le site) **et** les constantes `CATALOGUE` / `LIVRAISON` / `SECTEURS` en haut de `Code.gs` (le script, qui recalcule le total), puis redéploie les deux.
- **Ajouter un produit** : même chose. Ajoute-le aux deux endroits ; une nouvelle colonne apparaîtra dans un **nouvel** onglet « Commandes » (renomme l'ancien en « Commandes (archive) » avant la première commande, pour que les en-têtes se recréent).

## Dépannage

Les erreurs du script se lisent dans Apps Script, menu de gauche **Exécutions**.

| Symptôme | Cause probable | Solution |
|---|---|---|
| « Le service de commande n'est pas encore configuré. » | Variables absentes sur Netlify | Étape 8, puis redéployer le site |
| « Accès refusé. » | `ORDER_SHARED_SECRET` (Netlify) ≠ `SHARED_SECRET` (script) | Recopier exactement la même valeur, redéployer le site |
| « …a répondu de façon inattendue. » | Mauvaise URL (pas celle en `/exec`), ou accès qui n'est pas « Tout le monde » | Étape 7 |
| Pas de message Telegram, mais un e-mail « notification Telegram en échec » | Telegram a refusé l'envoi : la raison est à la fin de l'e-mail | Voir les lignes ci-dessous |
| Raison : « TELEGRAM_TOKEN ou TELEGRAM_CHAT_ID non défini » | Propriété manquante ou mal nommée | Étape 4 |
| Raison : « HTTP 401 : Unauthorized » | Jeton du bot faux ou révoqué | Recopier le jeton de BotFather dans `TELEGRAM_TOKEN` |
| Raison : « HTTP 400 : Bad Request: chat not found » | Chat ID faux, ou tu n'as jamais écrit au bot | Écrire au bot, puis refaire `getUpdates` (étape 5) |
| Raison : « HTTP 403 : Forbidden: bot was blocked by the user » | Tu as bloqué ou supprimé la conversation avec le bot | Rouvrir le bot dans Telegram et appuyer sur **Démarrer** |
| Colonne **E-mail envoyé** à `non` | Envoi au client refusé : la raison est dans le message Telegram (souvent le quota quotidien de Google, ou une adresse inexistante) | Contacter le client par téléphone ou WhatsApp ; vérifier l'adresse dans le Sheet |
| L'e-mail au client n'arrive pas, mais la colonne indique `oui` | L'e-mail est dans ses indésirables, ou l'adresse contient une faute de frappe | Lui demander de vérifier ses spams ; corriger l'adresse et le recontacter |
| Ni message Telegram, ni e-mail | Autorisation d'envoi d'e-mails pas accordée, ou quota d'e-mails Google atteint | Relancer `testNotification` depuis l'éditeur et accepter les autorisations ; consulter **Exécutions** |
| Une modification du script n'a aucun effet | Pas de nouvelle version déployée | « Gérer les déploiements » > Nouvelle version |
| En local, `/api/commande` ne répond pas | Site lancé avec `npm run dev` | Utiliser `npx netlify dev` |

Dans tous ces cas, **la commande est quand même enregistrée dans le Sheet**.

## Sécurité et données personnelles

- L'URL du script et le secret partagé ne sont **jamais** envoyés au navigateur : seule la fonction Netlify les connaît.
- Le jeton du bot Telegram et ton chat ID ne sont que dans les propriétés du script. Personne d'autre ne reçoit les messages du bot : il n'écrit qu'à la conversation dont tu lui as donné l'identifiant.
- L'e-mail de récapitulatif part de ton compte Gmail : le client voit ton adresse comme expéditeur, sous le nom « Dedjo ».
- Les messages contiennent le prénom, le téléphone, le code postal et le commentaire du client. Ils restent dans ta conversation Telegram : supprime-les quand tu n'en as plus besoin.
- Le Sheet contient des données personnelles : limite son partage, et supprime les commandes anciennes quand tu n'en as plus besoin.
