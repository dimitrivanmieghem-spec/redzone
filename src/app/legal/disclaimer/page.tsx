import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Bouton Retour */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-900 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Retour à l&apos;accueil</span>
        </Link>

        {/* Titre avec icône */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center hover:scale-105 transition-transform">
            <AlertTriangle size={24} className="text-blue-700" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Avertissement et Décharge de Responsabilité
          </h1>
        </div>
        <p className="text-sm text-slate-900 mb-8">
          Dernière mise à jour : {new Date().toLocaleDateString("fr-BE")}
        </p>

        {/* Contenu */}
        <div className="prose prose-slate max-w-none">
          {/* Avertissement BETA */}
          <div className="bg-red-100 border-4 border-red-500 p-6 rounded-2xl mb-8">
            <p className="text-red-900 font-black text-lg mb-3">
              ⚠️ AVERTISSEMENT BETA
            </p>
            <p className="text-red-800 font-bold mb-2">
              Service en version Bêta. L&apos;utilisation est à vos propres risques.
            </p>
            <p className="text-red-700 text-sm mt-3">
              Ce service est fourni &quot;tel quel&quot; à des fins de test. L&apos;éditeur décline toute responsabilité en cas d&apos;interruption de service ou de perte de données durant cette phase.
            </p>
          </div>

          {/* Bandeau d'avertissement important */}
          <div className="bg-blue-50 border-l-4 border-blue-700 p-6 mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <AlertTriangle size={20} className="text-blue-700" />
              AVERTISSEMENT IMPORTANT
            </h3>
            <p className="text-slate-900 leading-relaxed mb-3">
              <strong>RedZone est une plateforme communautaire de mise en relation pour véhicules sportifs.</strong>{" "}
              Nous ne vendons pas de véhicules et ne sommes pas revendeurs. Nous n&apos;intervenons
              pas dans les transactions entre vendeurs et acheteurs. Par conséquent, nous ne
              pouvons être tenus responsables des véhicules vendus via notre plateforme.
            </p>
            <div className="bg-white p-4 rounded mt-3">
              <p className="text-slate-900 font-semibold mb-2">
                ⚖️ Clause Hébergeur
              </p>
              <p className="text-slate-800 text-sm mb-2">
                RedZone agit en qualité d&apos;hébergeur technique. RedZone ne vérifie pas physiquement les véhicules 
                et ne garantit pas l&apos;exactitude des informations fournies par les vendeurs (kilométrage, état, Car-Pass). 
                Toute transaction se fait exclusivement entre l&apos;acheteur et le vendeur.
              </p>
            </div>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
              1. Nature du service
            </h2>
            <p className="text-slate-900 leading-relaxed mb-4">
              RedZone est une <strong>plateforme communautaire de mise en relation pour véhicules sportifs</strong>, 
              permettant la publication d&apos;annonces de vente de véhicules automobiles et motocycles sportifs 
              par des particuliers et des professionnels en Belgique.
            </p>
            <p className="text-slate-900 leading-relaxed mb-4">
              <strong>Nous ne sommes pas :</strong>
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-900 space-y-2">
              <li>Un concessionnaire ou revendeur de véhicules.</li>
              <li>Un mandataire automobile.</li>
              <li>Un garage ou atelier de réparation.</li>
              <li>Un organisme de contrôle technique ou d&apos;inspection automobile.</li>
              <li>Une société d&apos;assurance ou de financement.</li>
            </ul>
            <p className="text-slate-900 leading-relaxed mb-4">
              <strong>Nous ne fournissons pas :</strong>
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-900 space-y-2">
              <li>De garantie sur les véhicules vendus.</li>
              <li>De service d&apos;expertise ou d&apos;évaluation des véhicules.</li>
              <li>De service de médiation ou d&apos;arbitrage en cas de litige.</li>
              <li>De vérification approfondie de l&apos;identité des vendeurs ou de l&apos;état des véhicules.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
              2. Responsabilité des utilisateurs
            </h2>
            <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
              2.1. Responsabilité des vendeurs
            </h3>
            <p className="text-slate-900 leading-relaxed mb-4">
              Les vendeurs sont seuls responsables :
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-900 space-y-2">
              <li>De l&apos;exactitude et de la véracité des informations fournies dans leurs annonces.</li>
              <li>De la légalité de la vente du véhicule (propriété légitime, absence de gage ou d&apos;opposition).</li>
              <li>De la conformité du véhicule avec la législation belge (contrôle technique, normes Euro, Car-Pass, etc.).</li>
              <li>De la divulgation de tous les défauts, vices cachés ou problèmes mécaniques connus.</li>
              <li>De la bonne exécution de la vente et du transfert de propriété.</li>
            </ul>

            <h3 className="text-xl font-semibold text-slate-900 mb-3 tracking-tight">
              2.2. Responsabilité des acheteurs
            </h3>
            <p className="text-slate-900 leading-relaxed mb-4">
              Les acheteurs sont seuls responsables :
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-900 space-y-2">
              <li>De vérifier l&apos;identité du vendeur et la légalité de la vente.</li>
              <li>D&apos;inspecter le véhicule avant l&apos;achat (état général, kilométrage, contrôle technique).</li>
              <li>De demander et vérifier tous les documents obligatoires (Car-Pass, certificat d&apos;immatriculation, certificat de conformité).</li>
              <li>De faire réaliser une expertise indépendante si nécessaire.</li>
              <li>De négocier les conditions de la vente directement avec le vendeur.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
              3. Absence de garantie sur les annonces
            </h2>
            <p className="text-slate-900 leading-relaxed mb-4">
              RedZone ne garantit pas :
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-900 space-y-2">
              <li>
                <strong>L&apos;exactitude des informations :</strong> Les descriptions, photos, prix,
                kilométrages et spécifications techniques sont fournis par les vendeurs. Nous
                ne vérifions pas systématiquement ces informations.
              </li>
              <li>
                <strong>L&apos;état réel des véhicules :</strong> Nous n&apos;inspectons pas les véhicules
                et ne pouvons garantir leur état mécanique, leur conformité ou l&apos;absence de
                vices cachés.
              </li>
              <li>
                <strong>L&apos;authenticité des documents :</strong> Nous ne vérifions pas l&apos;authenticité
                des documents fournis par les vendeurs (Car-Pass, certificats, etc.).
              </li>
              <li>
                <strong>La disponibilité des véhicules :</strong> Les véhicules peuvent être vendus
                entre-temps ou ne plus être disponibles.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
              4. Limitation de responsabilité
            </h2>
            <p className="text-slate-900 leading-relaxed mb-4">
              <strong>RedZone ne pourra en aucun cas être tenu responsable :</strong>
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-900 space-y-2">
              <li>
                <strong>Des vices cachés ou défauts mécaniques :</strong> Problèmes de moteur,
                transmission, freins, carrosserie, électronique, etc.
              </li>
              <li>
                <strong>Des fraudes au kilométrage :</strong> Manipulation du compteur kilométrique,
                faux Car-Pass.
              </li>
              <li>
                <strong>Des litiges contractuels :</strong> Non-paiement, non-livraison, rupture
                de contrat, garantie commerciale.
              </li>
              <li>
                <strong>Des accidents ou dommages :</strong> Accidents survenant lors d&apos;un essai
                routier ou après l&apos;achat.
              </li>
              <li>
                <strong>Des problèmes administratifs :</strong> Difficultés lors de l&apos;immatriculation,
                absence de documents, véhicule gagé ou volé.
              </li>
              <li>
                <strong>Des arnaques ou escroqueries :</strong> Fausses annonces, vendeurs malhonnêtes,
                usurpation d&apos;identité.
              </li>
              <li>
                <strong>Des non-conformités réglementaires :</strong> Véhicule non conforme aux
                normes LEZ, contrôle technique invalide, importation illégale.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
              5. Recommandations aux acheteurs
            </h2>
            <p className="text-slate-900 leading-relaxed mb-4">
              Avant tout achat, nous vous recommandons vivement de :
            </p>
            <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-4">
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                ✅ Vérifications essentielles
              </h3>
              <ul className="list-disc pl-6 text-slate-900 space-y-2">
                <li>
                  <strong>Inspecter physiquement le véhicule</strong> : Ne jamais acheter sans
                  voir le véhicule en personne.
                </li>
                <li>
                  <strong>Vérifier le Car-Pass</strong> : Obligatoire pour les véhicules de plus
                  de 6 ans. Consultez le site officiel{" "}
                  <a
                    href="https://www.car-pass.be"
                    className="text-green-600 hover:text-green-700 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.car-pass.be
                  </a>
                </li>
                <li>
                  <strong>Contrôler le certificat d&apos;immatriculation</strong> : Vérifiez que le
                  vendeur est bien le propriétaire légitime.
                </li>
                <li>
                  <strong>Demander le certificat de conformité</strong> : Pour vérifier la norme
                  Euro (essentiel pour les zones LEZ à Bruxelles, Anvers, Gand).
                </li>
                <li>
                  <strong>Vérifier le contrôle technique</strong> : Le véhicule doit avoir un
                  contrôle technique valide (obligatoire pour les véhicules de plus de 4 ans).
                </li>
                <li>
                  <strong>Faire un essai routier</strong> : Testez le véhicule dans différentes
                  conditions de conduite.
                </li>
                <li>
                  <strong>Consulter un expert indépendant</strong> : En cas de doute, faites
                  inspecter le véhicule par un garage ou un expert automobile.
                </li>
                <li>
                  <strong>Vérifier l&apos;historique du véhicule</strong> : Utilisez des services
                  comme CarVertical ou AutoScout24 pour consulter l&apos;historique.
                </li>
              </ul>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                ⚠️ Signes d&apos;alerte (red flags)
              </h3>
              <ul className="list-disc pl-6 text-slate-900 space-y-2">
                <li>Prix anormalement bas par rapport au marché.</li>
                <li>Vendeur refusant une inspection ou un essai routier.</li>
                <li>Documents manquants ou suspects (photocopies uniquement, documents flous).</li>
                <li>Pression pour conclure la vente rapidement.</li>
                <li>Demande de paiement avant la livraison ou via des moyens non sécurisés.</li>
                <li>Vendeur injoignable ou changeant fréquemment de numéro de téléphone.</li>
                <li>Historique du véhicule incomplet ou incohérent.</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
              6. Législation belge applicable
            </h2>
            <p className="text-slate-900 leading-relaxed mb-4">
              Les transactions de vente de véhicules en Belgique sont régies par :
            </p>
            <ul className="list-disc pl-6 mb-4 text-slate-900 space-y-2">
              <li>
                <strong>Le Code civil belge</strong> : Articles relatifs à la vente et aux vices
                cachés.
              </li>
              <li>
                <strong>La loi Car-Pass</strong> : Obligation de fournir un certificat Car-Pass
                attestant du kilométrage réel.
              </li>
              <li>
                <strong>La législation LEZ (Low Emission Zone)</strong> : Restrictions de
                circulation pour les véhicules polluants à Bruxelles, Anvers et Gand.
              </li>
              <li>
                <strong>Le Code de la route belge</strong> : Obligations relatives au contrôle
                technique et à l&apos;immatriculation.
              </li>
            </ul>
            <p className="text-slate-900 leading-relaxed mb-4">
              En cas de litige, les recours légaux doivent être exercés directement entre
              l&apos;acheteur et le vendeur, conformément à la législation belge.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
              7. Signalement d&apos;annonces frauduleuses
            </h2>
            <p className="text-slate-900 leading-relaxed mb-4">
              Si vous suspectez une annonce frauduleuse ou trompeuse, nous vous encourageons
              à nous la signaler immédiatement en <a href="mailto:dimitri.vanmieghem@gmail.com" className="text-red-600 hover:text-red-700 font-bold underline">contactant l&apos;administrateur</a>
            </p>
            <p className="text-slate-900 leading-relaxed mb-4">
              Nous ferons de notre mieux pour traiter les signalements rapidement, mais nous
              ne pouvons garantir la suppression immédiate de toutes les annonces suspectes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
              8. Liens externes
            </h2>
            <p className="text-slate-900 leading-relaxed mb-4">
              Notre site peut contenir des liens vers des sites externes (Car-Pass, DIV,
              organismes de contrôle technique, etc.). Nous ne sommes pas responsables du
              contenu de ces sites ni des pratiques de confidentialité de ces tiers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
              9. Modification de l&apos;avertissement
            </h2>
            <p className="text-slate-900 leading-relaxed mb-4">
              Nous nous réservons le droit de modifier cet avertissement à tout moment.
              Les modifications prendront effet dès leur publication sur cette page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">
              10. Contact
            </h2>
            <p className="text-slate-900 leading-relaxed mb-4">
              Pour toute question relative à cet avertissement, contactez-nous :
            </p>
            <div className="bg-white p-4 rounded-2xl shadow-xl shadow-slate-100/50 border-0">
              <p className="text-slate-900 leading-relaxed mb-4">
                <strong>Pour toute question ou signalement, contactez l&apos;administrateur :</strong>
              </p>
              <a
                href="mailto:dimitri.vanmieghem@gmail.com"
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-red-900/20 hover:scale-105 mb-2"
              >
                Contacter l&apos;administrateur
              </a>
              <p className="text-slate-900 leading-relaxed mt-2">
                <strong>Courrier :</strong> RedZone, [Adresse à compléter]
              </p>
            </div>
          </section>

          {/* Message final */}
          <div className="bg-slate-100 shadow-xl shadow-slate-100/50 border-0 p-6 rounded-2xl mt-8">
            <p className="text-slate-900 leading-relaxed text-center font-medium">
              <strong>En utilisant RedZone, vous reconnaissez avoir lu et compris cet
              avertissement et acceptez d&apos;assumer l&apos;entière responsabilité de vos
              transactions.</strong>
            </p>
          </div>
        </div>

        {/* Bouton Retour en bas */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all hover:scale-105 transition-transform"
          >
            <ArrowLeft size={18} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

