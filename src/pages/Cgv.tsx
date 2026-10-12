import PageLegale, { Article, LienInterne, Liste } from "@/components/PageLegale";
import {
  ALL_PRODUCTS,
  CONFIG,
  CUISSON,
  JOURS_SEMAINE,
  MOYENS_PAIEMENT,
  PRIX_SACHET,
  SECTEURS,
  eur,
  pluralize,
} from "@/lib/catalog";
import { CGV_DETAILS, CGV_VERSION, EDITEUR, dateLongue } from "@/lib/legal";

const retrait = SECTEURS.find((s) => !s.livraison)!;
const livraison = SECTEURS.find((s) => s.livraison)!;
const seuil = pluralize(CONFIG.livraisonOfferteDes, "sachet", "sachets");

const Cgv = () => (
  <PageLegale titre="Conditions générales de vente" sousTitre={`Version du ${dateLongue(CGV_VERSION)}`}>
    <Article titre="1. Objet et champ d'application">
      <p>
        Les présentes conditions générales de vente (CGV) s'appliquent à toute commande de produits Dedjo passée par un
        consommateur au moyen du formulaire de la page Commande du site dedjo.com.
      </p>
      <p>
        Avant d'envoyer sa commande, le client accepte les CGV en cochant la case prévue à cet effet. La version acceptée
        est enregistrée avec la commande. Les CGV applicables sont celles en vigueur à la date de la commande.
      </p>
    </Article>

    <Article titre="2. Vendeur">
      <p>
        Les produits sont vendus par {EDITEUR.nom}, {EDITEUR.statut}, sous le nom commercial {EDITEUR.nomCommercial},
        titulaire du CAP Boulanger. Ses coordonnées complètes figurent dans les{" "}
        <LienInterne to="/mentions-legales">mentions légales</LienInterne>.
      </p>
      <p>
        Contact : {EDITEUR.telephone}
        {EDITEUR.email && ` — ${EDITEUR.email}`}.
      </p>
    </Article>

    <Article titre="3. Produits">
      <p>
        Dedjo fabrique à la main des viennoiseries et des friands feuilletés, vendus crus et congelés, à cuire sans
        décongeler.
      </p>
      <p>
        La fiche de chaque produit (dénomination, ingrédients et allergènes, poids net, conservation, mode de cuisson,
        nom et adresse du fabricant) est consultable avant la commande, par les liens « Voir les infos de la création »
        de la page Commande et « Voir les détails » de la page d'accueil. Seuls les produits indiqués comme disponibles
        peuvent être commandés. Les illustrations du site ne sont pas contractuelles.
      </p>
      <p>Contenu d'un sachet :</p>
      <Liste>
        {ALL_PRODUCTS.map((p) => (
          <li key={p.id}>
            {p.name} : {p.pieces} {p.unit}
          </li>
        ))}
      </Liste>
      <p>
        Les produits sont remis crus et congelés. Le client les place au congélateur dès leur réception, les cuit sans
        décongélation préalable, dans un four préchauffé à {CUISSON.temperature} °C, pendant le temps indiqué sur la fiche
        du produit, et ne les recongèle jamais après décongélation.
      </p>
    </Article>

    <Article titre="4. Prix">
      <p>
        Tous les produits sont vendus au prix unique de {eur(PRIX_SACHET)} TTC le sachet. {EDITEUR.tva}.
      </p>
      <p>
        Livraison ({livraison.nom}) : {eur(CONFIG.fraisLivraison)} pour une commande de moins de {seuil}, offerte à partir
        de {seuil}. Le retrait ({retrait.nom}) est sans frais.
      </p>
      <p>
        Le prix applicable est celui affiché au moment de la commande. Le total, frais de livraison compris, est indiqué
        avant l'envoi de la commande.
      </p>
    </Article>

    <Article titre="5. Commande et formation du contrat">
      <p>La commande se passe sur la page Commande, en plusieurs étapes :</p>
      <ol className="list-decimal pl-6 space-y-1.5">
        <li>choix des produits et du nombre de sachets ;</li>
        <li>
          choix du secteur ({retrait.nom} ou {livraison.nom}), de l'adresse de livraison le cas échéant, et de la date ;
        </li>
        <li>saisie des coordonnées : prénom, nom, téléphone et e-mail ;</li>
        <li>vérification du récapitulatif : produits, frais de livraison, total et moyens de paiement ;</li>
        <li>acceptation des CGV, en cochant la case prévue à cet effet ;</li>
        <li>envoi de la commande par le bouton « Commander avec obligation de paiement ».</li>
      </ol>
      <p>Le client reçoit ensuite par e-mail un récapitulatif de sa commande, avec son numéro.</p>
      <p>
        Après l'envoi du formulaire, Dedjo recontacte le client par WhatsApp pour confirmer le créneau de retrait ou de
        livraison. La commande devient ferme lorsque Dedjo confirme ce créneau.
      </p>
    </Article>

    <Article titre="6. Paiement">
      <p>
        Aucun paiement n'est demandé en ligne. Le paiement a lieu à la remise des produits, lors du retrait ou de la
        livraison : {MOYENS_PAIEMENT}.
      </p>
    </Article>

    <Article titre="7. Retrait et livraison">
      <Liste>
        <li>
          {retrait.nom} : retrait le {JOURS_SEMAINE[retrait.jour]}, au marché de la Ferme de la Goëttaz, sans frais.
        </li>
        <li>
          {livraison.nom} : livraison à domicile le {JOURS_SEMAINE[livraison.jour]}, effectuée par Dedjo, aux conditions de
          prix de l'article 4.
        </li>
      </Liste>
      <p>
        La date est choisie parmi celles proposées sur la page Commande, au plus tôt{" "}
        {pluralize(CONFIG.leadDays, "jour", "jours")} après la commande, puis confirmée par Dedjo.
      </p>
      <p>
        Les produits restent congelés jusqu'à leur remise
        {CGV_DETAILS.chaineDuFroid && ` : ${CGV_DETAILS.chaineDuFroid}`}.
      </p>
      <p>
        Le risque de perte ou de détérioration des produits est transféré au client au moment de leur remise, lorsqu'il
        en prend physiquement possession.
      </p>
      <p>
        En cas d'absence du client au retrait ou à la livraison, les produits ne sont jamais laissés devant la porte :
        Dedjo recontacte le client pour convenir d'un nouveau créneau.
      </p>
    </Article>

    <Article titre="8. Droit de rétractation">
      <p>
        Conformément à l'article L221-28, 4° du Code de la consommation, le droit de rétractation ne peut être exercé pour
        la fourniture de biens susceptibles de se détériorer ou de se périmer rapidement. Les produits Dedjo, crus et
        congelés, entrent dans ce cas : le client ne bénéficie pas d'un droit de rétractation. Il en est informé sur la
        page Commande, avant l'envoi de sa commande.
      </p>
    </Article>

    <Article titre="9. Garanties légales">
      <p>
        Dedjo est tenu de la garantie légale de conformité, prévue aux articles L217-3 et suivants du Code de la
        consommation, et de la garantie des vices cachés, prévue aux articles 1641 et suivants du Code civil.
      </p>
      {CGV_DETAILS.encadreGarantie && <p>{CGV_DETAILS.encadreGarantie}</p>}
    </Article>

    <Article titre="10. Réclamations">
      <p>Toute réclamation est à adresser à Dedjo, aux coordonnées indiquées dans les mentions légales.</p>
      {CGV_DETAILS.reclamations && <p>{CGV_DETAILS.reclamations}</p>}
    </Article>

    <Article titre="11. Médiation de la consommation">
      <p>
        En cas de litige non résolu après une réclamation auprès de Dedjo, le client peut recourir gratuitement à un
        médiateur de la consommation (articles L612-1 et suivants du Code de la consommation)
        {CGV_DETAILS.mediateur && ` : ${CGV_DETAILS.mediateur}`}.
      </p>
    </Article>

    <Article titre="12. Données personnelles">
      <p>
        Les données collectées lors de la commande sont traitées conformément à la{" "}
        <LienInterne to="/confidentialite">politique de confidentialité</LienInterne>.
      </p>
    </Article>

    <Article titre="13. Droit applicable">
      <p>Les présentes CGV sont soumises au droit français.</p>
    </Article>
  </PageLegale>
);

export default Cgv;
