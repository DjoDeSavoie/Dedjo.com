import PageLegale, { Article, LienInterne, Liste } from "@/components/PageLegale";
import { CREDITS, EDITEUR, HEBERGEUR, MARQUE } from "@/lib/legal";

const MentionsLegales = () => (
  <PageLegale titre="Mentions légales">
    <Article titre="Éditeur du site">
      <p>
        Le site dedjo.com est édité par {EDITEUR.nom}, {EDITEUR.statut}, exerçant sous le nom commercial{" "}
        {EDITEUR.nomCommercial}.
      </p>
      <Liste>
        <li>Siège : {EDITEUR.siege}</li>
        {EDITEUR.siren && <li>SIREN : {EDITEUR.siren}</li>}
        {EDITEUR.immatriculation && <li>Immatriculation : {EDITEUR.immatriculation}</li>}
        <li>Téléphone : {EDITEUR.telephone}</li>
        {EDITEUR.email && <li>E-mail : {EDITEUR.email}</li>}
        <li>{EDITEUR.tva}</li>
      </Liste>
    </Article>

    <Article titre="Directeur de la publication">
      <p>{EDITEUR.nom}.</p>
    </Article>

    <Article titre="Hébergeur">
      <p>{HEBERGEUR.coordonnees ? `${HEBERGEUR.nom} — ${HEBERGEUR.coordonnees}.` : HEBERGEUR.nom}</p>
    </Article>

    <Article titre="Propriété intellectuelle">
      <p>
        La marque verbale {MARQUE.nom} a été déposée à l'INPI le {MARQUE.dateDepot}, sous le n° {MARQUE.numero}, en
        classes {MARQUE.classes}. Toute reproduction ou utilisation de cette marque sans autorisation est interdite.
      </p>
      <p>
        Les textes, photographies et éléments graphiques du site sont protégés par le droit d'auteur. Leur reproduction,
        même partielle, est interdite sans autorisation préalable de l'éditeur.
      </p>
    </Article>

    {CREDITS && (
      <Article titre="Crédits photos et graphisme">
        <p>{CREDITS}</p>
      </Article>
    )}

    <Article titre="Données personnelles">
      <p>
        Le traitement des données personnelles collectées sur le site est décrit dans la{" "}
        <LienInterne to="/confidentialite">politique de confidentialité</LienInterne>.
      </p>
    </Article>
  </PageLegale>
);

export default MentionsLegales;
