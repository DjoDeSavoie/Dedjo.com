import PageLegale, { Article, Liste } from "@/components/PageLegale";
import { EDITEUR, GARANTIES_TRANSFERTS } from "@/lib/legal";

/** Prestataires (sous-traitants) et données qu'ils reçoivent : annexe A de l'audit. */
const PRESTATAIRES = [
  {
    nom: "Netlify, Inc.",
    role: "hébergement du site et traitement des formulaires",
    lieu: "États-Unis",
    donnees: "données saisies dans les formulaires, adresse IP",
  },
  {
    nom: "Google (Google Sheets, Apps Script, Gmail)",
    role: "enregistrement des commandes et des messages, envoi de l'e-mail de récapitulatif",
    lieu: "Union européenne et États-Unis",
    donnees: "données de commande et du formulaire de contact",
  },
  {
    nom: "Telegram",
    role: "notification des nouvelles commandes à Dedjo",
    lieu: "hors Union européenne",
    donnees: "prénom, téléphone, produits, total, code postal et ville, créneau, commentaire",
  },
  {
    nom: "WhatsApp (Meta)",
    role: "confirmation du créneau avec le client",
    lieu: "Union européenne et hors Union européenne",
    donnees: "prénom, téléphone, contenu de la commande",
  },
  {
    nom: "IGN (Géoplateforme)",
    role: "aide à la saisie de l'adresse de livraison",
    lieu: "France",
    donnees: "texte de l'adresse tapé, adresse IP",
  },
  {
    nom: "Brevo",
    role: "gestion de la newsletter",
    lieu: "France (Union européenne)",
    donnees: "adresse e-mail",
  },
];

const Confidentialite = () => (
  <PageLegale titre="Politique de confidentialité">
    <Article titre="1. Responsable du traitement">
      <p>
        Les données personnelles collectées sur le site dedjo.com sont traitées par {EDITEUR.nom}, {EDITEUR.statut}, nom
        commercial {EDITEUR.nomCommercial}, dont le siège est situé : {EDITEUR.siege}.
      </p>
      {EDITEUR.email && <p>Contact pour toute question relative aux données personnelles : {EDITEUR.email}.</p>}
    </Article>

    <Article titre="2. Données collectées et finalités">
      <Liste>
        <li>
          <strong>Commandes</strong> : prénom, nom, téléphone, e-mail, adresse de livraison le cas échéant, secteur et
          date, produits commandés, montant, commentaire facultatif. Finalités : préparer, confirmer et remettre la
          commande, envoyer le récapitulatif par e-mail, recontacter le client.
        </li>
        <li>
          <strong>Aide à la saisie de l'adresse</strong> : le texte tapé dans le champ adresse est envoyé au service
          public de géocodage de l'IGN, qui reçoit aussi l'adresse IP de l'appareil.
        </li>
        <li>
          <strong>Formulaire de contact</strong> : nom, e-mail, catégorie et message. Finalité : répondre au message.
        </li>
        <li>
          <strong>Newsletter</strong> : adresse e-mail. Finalité : envoyer la newsletter Dedjo.
        </li>
        <li>
          <strong>Sécurité</strong> : une empreinte de l'adresse IP (l'adresse IP elle-même n'est pas transmise), ainsi
          que l'e-mail et le téléphone sous forme d'empreintes, pour limiter les envois abusifs de commandes.
        </li>
      </Liste>
      <p>
        Les champs libres (commentaire, message) ne doivent contenir aucune information de santé : les recettes ne
        peuvent pas être adaptées, et les allergènes figurent sur la fiche de chaque produit.
      </p>
    </Article>

    <Article titre="3. Bases légales">
      <Liste>
        <li>
          Commandes : exécution du contrat et mesures précontractuelles (article 6.1.b du RGPD) ; obligations légales
          comptables (article 6.1.c).
        </li>
        <li>Formulaire de contact : intérêt légitime de Dedjo à répondre aux messages reçus (article 6.1.f).</li>
        <li>Newsletter : consentement (article 6.1.a), qui peut être retiré à tout moment.</li>
        <li>Sécurité : intérêt légitime de Dedjo à protéger le service contre les abus (article 6.1.f).</li>
      </Liste>
    </Article>

    <Article titre="4. Destinataires et prestataires">
      <p>
        Les données sont destinées uniquement à Dedjo. Elles ne sont ni vendues ni cédées. Elles transitent par les
        prestataires suivants, qui les traitent pour le compte de Dedjo :
      </p>
      <Liste>
        {PRESTATAIRES.map((p) => (
          <li key={p.nom}>
            <strong>{p.nom}</strong> — {p.role} ({p.lieu}) : {p.donnees}.
          </li>
        ))}
      </Liste>
    </Article>

    <Article titre="5. Transferts hors de l'Union européenne">
      <p>
        Certains prestataires (Netlify, Google, Telegram, Meta) peuvent traiter des données hors de l'Union européenne.
        {GARANTIES_TRANSFERTS && ` Garanties encadrant ces transferts : ${GARANTIES_TRANSFERTS}.`}
      </p>
    </Article>

    <Article titre="6. Durées de conservation">
      <Liste>
        <li>
          Commandes : données d'identification et de contact conservées 36 mois après la commande, puis anonymisées ;
          données comptables (numéro, date, produits, montant) conservées 10 ans.
        </li>
        <li>Notifications Telegram et e-mails liés aux commandes : supprimés dans les mêmes délais.</li>
        <li>Formulaire de contact : 12 mois après le dernier échange.</li>
        <li>Newsletter : jusqu'à la désinscription ; suppression après 3 ans sans ouverture ni clic.</li>
        <li>Empreintes utilisées pour la sécurité : 6 heures au plus.</li>
        <li>Journaux techniques des prestataires : durée fixée par chaque prestataire.</li>
      </Liste>
    </Article>

    <Article titre="7. Droits des personnes">
      <p>
        Toute personne dispose d'un droit d'accès, de rectification, d'effacement, d'opposition, de limitation du
        traitement et de portabilité de ses données, ainsi que du droit de définir des directives relatives à leur sort
        après son décès. Le consentement à la newsletter peut être retiré à tout moment, par le lien de désinscription
        présent dans chaque e-mail.
      </p>
      <p>
        {EDITEUR.email
          ? `Pour exercer ces droits : ${EDITEUR.email}.`
          : "Pour exercer ces droits, il suffit de contacter Dedjo aux coordonnées indiquées dans les mentions légales."}{" "}
        En cas de difficulté, une réclamation peut être adressée à la CNIL (
        <a
          href="https://www.cnil.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          www.cnil.fr
        </a>
        ).
      </p>
    </Article>

    <Article titre="8. Cookies">
      <p>Ce site ne dépose aucun cookie ni traceur.</p>
    </Article>

    <Article titre="9. Sécurité">
      <p>
        Le site est servi en connexion chiffrée (HTTPS). Les adresses des services techniques et les clés d'accès restent
        côté serveur et ne sont jamais envoyées au navigateur. L'accès aux données est réservé à Dedjo, et les envois de
        formulaires sont limités pour prévenir les abus.
      </p>
    </Article>
  </PageLegale>
);

export default Confidentialite;
