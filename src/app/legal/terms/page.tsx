import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Bouton Retour */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-700 hover:text-red-600 mb-8 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          <span>Retour à l&apos;accueil</span>
        </Link>

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-600/40">
            <FileText size={36} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Conditions Générales d&apos;Utilisation (CGU)
          </h1>
          <p className="text-slate-700 text-lg">
            En vigueur au : Décembre 2025
          </p>
          <div className="mt-4 inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-bold">
            ⚖️ Droit belge applicable
          </div>
        </div>

        {/* Contenu */}
        <div className="prose prose-slate max-w-none">
          {/* Avertissement BETA */}
          <div className="bg-red-100 border-4 border-red-500 p-6 rounded-2xl mb-8">
            <p className="text-red-900 font-black text-xl mb-4">
              ⚠️ CE SITE EST UN PROJET TECHNIQUE EN VERSION BÊTA
            </p>
            <p className="text-red-800 font-bold text-lg mb-3">
              IL EST ACTUELLEMENT OPÉRÉ À TITRE NON LUCRATIF ET PRIVÉ.
            </p>
            <p className="text-red-700 text-sm mb-3">
              Ce service est fourni &quot;tel quel&quot; à des fins de test. L&apos;éditeur décline toute responsabilité en cas d&apos;interruption de service ou de perte de données durant cette phase.
            </p>
            <div className="bg-white/50 p-4 rounded-lg mt-4">
              <p className="text-red-900 font-semibold mb-2">
                📌 Clause de Gratuité
              </p>
              <p className="text-red-800 text-sm">
                L&apos;utilisation de RedZone est actuellement <strong>100% gratuite</strong>. L&apos;éditeur se réserve le droit de modifier ce modèle économique dans le futur, moyennant une information préalable des utilisateurs.
              </p>
            </div>
            <div className="bg-white/50 p-4 rounded-lg mt-3">
              <p className="text-red-900 font-semibold mb-2">
                ⚖️ Clause de Responsabilité
              </p>
              <p className="text-red-800 text-sm">
                L&apos;éditeur agit en tant qu&apos;<strong>hébergeur technique bénévole</strong>. Il ne vérifie pas physiquement les véhicules et ne peut être tenu responsable des litiges entre acheteurs et vendeurs.
              </p>
            </div>
          </div>

          <div className="bg-orange-50 p-6 rounded-2xl mb-8">
            <p className="text-slate-900 font-semibold mb-2">
              ⚠️ <strong>Important : Lisez attentivement ces conditions</strong>
            </p>
            <p className="text-slate-700 text-sm">
              En utilisant la plateforme RedZone, vous acceptez sans réserve les présentes Conditions Générales d&apos;Utilisation. 
              Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
          </div>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">1. Définitions</h2>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li><strong>&quot;RedZone&quot;</strong> ou <strong>&quot;la Plateforme&quot;</strong> : Service en ligne accessible via www.RedZone.be, exploité par RedZone SPRL</li>
              <li><strong>&quot;Utilisateur&quot;</strong> : Toute personne physique ou morale utilisant la Plateforme</li>
              <li><strong>&quot;Vendeur&quot;</strong> : Utilisateur publiant une annonce de vente de véhicule</li>
              <li><strong>&quot;Acheteur&quot;</strong> : Utilisateur consultant les annonces dans l&apos;objectif d&apos;acquérir un véhicule</li>
              <li><strong>&quot;Annonce&quot;</strong> : Offre de vente d&apos;un véhicule publiée par un Vendeur</li>
              <li><strong>&quot;Car-Pass&quot;</strong> : Document belge obligatoire attestant du kilométrage réel d&apos;un véhicule</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">2. Objet et nature du service</h2>
            
            <h3 className="text-xl font-bold text-slate-900 mb-3">2.1. Plateforme communautaire</h3>
            <p className="text-slate-700 mb-4">
              RedZone est une <strong>plateforme communautaire de mise en relation pour véhicules sportifs</strong>. 
              Notre service permet aux passionnés d&apos;automobiles de publier et consulter des annonces de véhicules 
              sportifs (voitures et motos) en Belgique.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mb-3">2.2. Clause Hébergeur</h3>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
              <p className="text-red-900 font-semibold mb-2">
                ⚖️ <strong>RedZone agit en qualité d&apos;hébergeur technique bénévole</strong>
              </p>
              <p className="text-red-800 text-sm mb-2">
                Conformément à la loi belge du 11 mars 2003 et à la directive européenne 2000/31/CE, 
                RedZone agit en qualité d&apos;hébergeur technique des contenus publiés par les utilisateurs.
                <strong> En phase bêta, ce service est fourni à titre bénévole et non commercial.</strong>
              </p>
              <ul className="list-disc list-inside text-red-800 text-sm space-y-1 mt-2">
                <li><strong>RedZone ne vérifie pas physiquement les véhicules</strong> et ne garantit pas l&apos;exactitude des informations fournies par les vendeurs (kilométrage, état, Car-Pass).</li>
                <li><strong>Toute transaction se fait exclusivement entre l&apos;acheteur et le vendeur.</strong> RedZone n&apos;intervient pas dans la négociation, le paiement ou la livraison.</li>
                <li>RedZone n&apos;est ni propriétaire, ni vendeur, ni mandataire des véhicules annoncés.</li>
                <li><strong>L&apos;éditeur ne peut être tenu responsable des litiges entre acheteurs et vendeurs</strong>, ni des dommages résultant de l&apos;utilisation de la plateforme en phase bêta.</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-3">2.3. Responsabilité limitée</h3>
            <p className="text-slate-700 mb-4">
              RedZone ne peut être tenu responsable de :
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>L&apos;exactitude des informations fournies dans les annonces (prix, kilométrage, état du véhicule)</li>
              <li>La qualité, la conformité ou les vices cachés des véhicules vendus</li>
              <li>Les litiges entre Vendeurs et Acheteurs</li>
              <li>Les fraudes, escroqueries ou manquements des Utilisateurs</li>
              <li>Les dommages résultant d&apos;un usage abusif de la Plateforme</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">3. Inscription et compte utilisateur</h2>
            
            <h3 className="text-xl font-bold text-slate-900 mb-3">3.1. Conditions d&apos;inscription</h3>
            <p className="text-slate-700 mb-4">
              Pour publier une annonce, l&apos;Utilisateur doit créer un compte en fournissant :
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
              <li>Nom et prénom (personnes physiques) ou dénomination sociale (professionnels)</li>
              <li>Adresse email valide</li>
              <li>Numéro de téléphone (optionnel mais recommandé)</li>
              <li>Pour les professionnels : Numéro BCE et TVA</li>
            </ul>
            <p className="text-slate-700 mb-4">
              <strong>Conditions :</strong>
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Être âgé de minimum 18 ans</li>
              <li>Fournir des informations exactes et à jour</li>
              <li>Être le propriétaire légal du véhicule mis en vente</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mb-3">3.2. Sécurité du compte</h3>
            <p className="text-slate-700 mb-4">
              L&apos;Utilisateur est seul responsable de la confidentialité de ses identifiants. 
              Toute utilisation du compte est réputée avoir été effectuée par le titulaire.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">4. Publication d&apos;annonces</h2>
            
            <h3 className="text-xl font-bold text-slate-900 mb-3">4.1. Obligations du Vendeur</h3>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
              <p className="text-red-900 font-semibold mb-2">
                ⚠️ <strong>Obligations légales belges</strong>
              </p>
              <p className="text-red-800 text-sm mb-2">
                Le Vendeur s&apos;engage à respecter la législation belge en vigueur, notamment :
              </p>
              <ul className="list-disc list-inside text-red-800 text-sm space-y-1">
                <li><strong>Car-Pass obligatoire</strong> : Pour tout véhicule de moins de 25 ans (Loi du 11/06/2004)</li>
                <li><strong>Informations exactes</strong> : Kilométrage réel, historique d&apos;entretien, accidents éventuels</li>
                <li><strong>Norme Euro</strong> : Mention obligatoire pour la conformité LEZ (Low Emission Zone)</li>
                <li><strong>Contrôle technique valide</strong> : Le certificat doit être à jour</li>
              </ul>
            </div>

            <p className="text-slate-700 mb-4">
              Le Vendeur garantit que :
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Il est le propriétaire légal du véhicule ou dispose d&apos;une procuration valide</li>
              <li>Le véhicule n&apos;est pas gagé, volé ou fait l&apos;objet d&apos;une saisie</li>
              <li>Les photos et descriptions sont conformes à l&apos;état réel du véhicule</li>
              <li>Le prix indiqué inclut ou exclut clairement la TVA (si vendeur professionnel)</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mb-3">4.2. Modération des annonces</h3>
            <p className="text-slate-700 mb-4">
              RedZone se réserve le droit de :
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li><strong>Valider</strong> toute annonce avant publication (délai : 24-48h ouvrables)</li>
              <li><strong>Refuser</strong> ou supprimer une annonce non conforme ou frauduleuse</li>
              <li><strong>Suspendre ou supprimer</strong> un compte en cas d&apos;abus répétés</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mb-3">4.3. Contenu interdit</h3>
            <p className="text-slate-700 mb-4">
              Sont strictement interdits :
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Véhicules volés, accidentés non réparés, ou non conformes à la législation</li>
              <li>Annonces mensongères ou trompeuses (kilométrage trafiqué, photos non conformes)</li>
              <li>Contenu illégal, offensant, raciste, discriminatoire ou pornographique</li>
              <li>Coordonnées personnelles dans le titre ou la description (email, téléphone visible publiquement)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">5. Transaction entre Vendeur et Acheteur</h2>
            
            <h3 className="text-xl font-bold text-slate-900 mb-3">5.1. Mise en relation</h3>
            <p className="text-slate-700 mb-4">
              RedZone fournit un système de messagerie interne pour permettre aux Acheteurs de contacter les Vendeurs. 
              Les coordonnées personnelles (email, téléphone) ne sont communiquées qu&apos;après accord explicite du Vendeur.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mb-3">5.2. Négociation et vente</h3>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4">
              <p className="text-yellow-900 font-semibold mb-2">
                💡 <strong>Recommandations importantes</strong>
              </p>
              <ul className="list-disc list-inside text-yellow-800 text-sm space-y-1">
                <li><strong>Essai routier</strong> : Toujours tester le véhicule avant achat</li>
                <li><strong>Vérification Car-Pass</strong> : Consultez le document original (pas de copie)</li>
                <li><strong>Contrôle technique</strong> : Exigez un CT à jour de moins de 2 mois</li>
                <li><strong>Contrat de vente écrit</strong> : Établissez un contrat signé avec l&apos;identité des deux parties</li>
                <li><strong>Paiement sécurisé</strong> : Privilégiez le virement bancaire (évitez le cash)</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-3">5.3. RedZone n&apos;intervient pas dans la transaction</h3>
            <p className="text-slate-700 mb-4">
              <strong>RedZone ne gère pas :</strong>
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Le paiement (aucune transaction financière sur la plateforme)</li>
              <li>La livraison ou le transport du véhicule</li>
              <li>Les démarches administratives (changement de propriétaire, assurance, immatriculation)</li>
              <li>Les garanties légales ou commerciales</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">6. Propriété intellectuelle</h2>
            <p className="text-slate-700 mb-4">
              Tous les éléments de la Plateforme (logo, design, textes, graphismes, code source) sont la propriété exclusive 
              de RedZone SPRL ou de ses partenaires. Toute reproduction, même partielle, est interdite sans autorisation écrite.
            </p>
            <p className="text-slate-700 mb-4">
              Les photos et descriptions publiées par les Vendeurs restent leur propriété. En publiant une annonce, 
              le Vendeur accorde à RedZone une licence non-exclusive pour afficher et promouvoir l&apos;annonce sur la Plateforme.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">7. Données personnelles</h2>
            <p className="text-slate-700 mb-4">
              Le traitement de vos données personnelles est décrit dans notre{" "}
              <Link href="/legal/privacy" className="text-red-600 hover:text-red-700 font-bold underline">
                Politique de Confidentialité
              </Link>
              , conforme au RGPD et à la loi belge du 30 juillet 2018.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">8. Responsabilité et garanties</h2>
            
            <h3 className="text-xl font-bold text-slate-900 mb-3">8.1. Limitation de responsabilité</h3>
            <p className="text-slate-700 mb-4">
              RedZone ne pourra être tenu responsable des dommages directs ou indirects résultant de :
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>L&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser la Plateforme</li>
              <li>L&apos;inexactitude des informations fournies par les Utilisateurs</li>
              <li>La perte de données, virus, bugs ou erreurs techniques</li>
              <li>Tout litige entre Utilisateurs</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mb-3">8.2. Disponibilité du service</h3>
            <p className="text-slate-700 mb-4">
              RedZone s&apos;efforce d&apos;assurer un accès 24h/24, 7j/7 à la Plateforme, mais ne garantit pas une disponibilité 
              ininterrompue (maintenance, pannes, force majeure).
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">9. Résiliation et suspension</h2>
            
            <h3 className="text-xl font-bold text-slate-900 mb-3">9.1. Résiliation par l&apos;Utilisateur</h3>
            <p className="text-slate-700 mb-4">
              L&apos;Utilisateur peut supprimer son compte à tout moment via les paramètres ou en contactant support@RedZone.be.
            </p>

            <h3 className="text-xl font-bold text-slate-900 mb-3">9.2. Suspension ou résiliation par RedZone</h3>
            <p className="text-slate-700 mb-4">
              RedZone se réserve le droit de suspendre ou supprimer un compte sans préavis en cas de :
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Violation des présentes CGU</li>
              <li>Fraude, escroquerie ou activité illégale</li>
              <li>Abus répétés (spamming, harcèlement, insultes)</li>
              <li>Non-respect des obligations légales belges</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">10. Droit applicable et juridiction</h2>
            <div className="bg-slate-50 p-6 rounded-2xl">
              <p className="text-slate-900 font-bold mb-2">
                ⚖️ Loi belge applicable
              </p>
              <p className="text-slate-700 text-sm mb-4">
                Les présentes Conditions Générales d&apos;Utilisation sont régies par le <strong>droit belge</strong>.
              </p>
              <p className="text-slate-900 font-bold mb-2">
                🏛️ Compétence territoriale
              </p>
              <p className="text-slate-700 text-sm">
                En cas de litige, et à défaut de règlement amiable, les <strong>tribunaux de Bruxelles (Belgique)</strong> seront seuls compétents, 
                sauf dispositions d&apos;ordre public contraires (notamment pour les consommateurs).
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">11. Médiation</h2>
            <p className="text-slate-700 mb-4">
              Conformément au Code de droit économique belge (Livre XVI), en cas de litige avec un consommateur, 
              vous pouvez recourir à un service de médiation agréé :
            </p>
            <div className="bg-green-50 p-4 rounded-2xl">
              <p className="text-slate-900 font-bold mb-2">
                Service de Médiation pour le Consommateur
              </p>
              <p className="text-slate-700 text-sm">
                North Gate II, Boulevard du Roi Albert II, 8 Bte 1<br />
                1000 Bruxelles<br />
                <br />
                Email : contact@mediationconsommateur.be<br />
                Site : <a href="https://www.mediationconsommateur.be" className="text-red-600 hover:text-red-700 underline" target="_blank" rel="noopener noreferrer">www.mediationconsommateur.be</a>
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">12. Modification des CGU</h2>
            <p className="text-slate-700 mb-4">
              RedZone se réserve le droit de modifier les présentes CGU à tout moment. Les modifications 
              seront notifiées aux Utilisateurs par email et/ou via une bannière sur le site.
            </p>
            <p className="text-slate-700">
              La poursuite de l&apos;utilisation de la Plateforme après notification vaut acceptation des nouvelles conditions.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">13. Contact</h2>
            <div className="bg-red-50 p-6 rounded-2xl">
              <p className="text-slate-900 font-bold mb-4">
                Pour toute question concernant ces CGU :
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-4">
                <p className="text-yellow-900 font-semibold mb-2">
                  ⚠️ <strong>Important - Phase Bêta</strong>
                </p>
                <p className="text-yellow-800 text-sm">
                  Les adresses email professionnelles (type @redzone.be) ne sont pas encore actives. 
                  Pour toute demande, veuillez utiliser le formulaire de contact disponible sur le site 
                  ou contacter l&apos;administrateur via les moyens de communication alternatifs indiqués ci-dessous.
                </p>
              </div>
              <p className="text-slate-900 mb-2">
                <strong>RedZone SPRL</strong> (À REMPLIR)
              </p>
              <p className="text-slate-700 text-sm">
                Adresse : [ADRESSE COMPLÈTE À REMPLIR]<br />
                Numéro BCE : [NUMÉRO BCE À REMPLIR]<br />
                Numéro TVA : BE [NUMÉRO TVA À REMPLIR]<br />
                Email : support@RedZone.be <span className="text-red-600 font-semibold">(Non actif en phase bêta - À CONFIGURER)</span><br />
                Téléphone : [NUMÉRO À REMPLIR]
              </p>
              <p className="text-slate-600 text-xs mt-3 italic">
                En phase bêta, les réponses aux demandes peuvent prendre plus de temps. 
                Nous vous remercions de votre compréhension.
              </p>
            </div>
          </section>

          <div className="bg-green-100 p-6 rounded-2xl mt-8">
            <p className="text-green-900 text-center font-bold">
              ✅ En utilisant RedZone, vous reconnaissez avoir lu, compris et accepté ces Conditions Générales d&apos;Utilisation.
            </p>
          </div>
        </div>

        {/* Footer avec retour */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-full transition-all shadow-xl hover:scale-105"
          >
            <ArrowLeft size={20} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
