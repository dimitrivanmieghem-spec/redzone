import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
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
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-600/40">
            <Shield size={36} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Politique de Confidentialité
          </h1>
          <p className="text-slate-700 text-lg">
            Dernière mise à jour : Décembre 2025
          </p>
          <div className="mt-4 inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold">
            ✓ Conforme RGPD & APD Belgique
          </div>
        </div>

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
            <p className="text-red-700 text-sm mb-3">
              Ce service est fourni &quot;tel quel&quot; à des fins de test. L&apos;éditeur décline toute responsabilité en cas d&apos;interruption de service ou de perte de données durant cette phase.
            </p>
            <div className="bg-white/50 p-4 rounded-lg mt-4">
              <p className="text-red-900 font-semibold mb-2">
                🔒 Collecte de données en phase Bêta
              </p>
              <p className="text-red-800 text-sm">
                Les données collectées sur cette plateforme le sont <strong>uniquement à des fins de test du fonctionnement de la plateforme</strong>. 
                Elles ne sont <strong>ni vendues ni partagées</strong> avec des tiers à des fins commerciales. 
                En phase bêta, l&apos;objectif principal est d&apos;améliorer le service et de valider le fonctionnement technique.
              </p>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-2xl mb-8">
            <p className="text-slate-900 font-semibold mb-2">
              🔒 <strong>Votre vie privée est notre priorité.</strong>
            </p>
            <p className="text-slate-700 text-sm">
              RedZone respecte strictement le Règlement Général sur la Protection des Données (RGPD) 
              et est soumis au contrôle de l&apos;Autorité de Protection des Données (APD) belge. 
              Cette politique vous explique quelles données nous collectons, pourquoi, et comment vous pouvez exercer vos droits.
            </p>
          </div>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">1. Responsable du traitement</h2>
            <div className="bg-slate-50 p-6 rounded-2xl">
              <p className="text-slate-900 mb-2">
                <strong>RedZone SPRL</strong> (À REMPLIR)
              </p>
              <p className="text-slate-700 text-sm">
                Adresse : [ADRESSE COMPLÈTE À REMPLIR]<br />
                Numéro BCE : [NUMÉRO BCE À REMPLIR]<br />
                Numéro TVA : BE [NUMÉRO TVA À REMPLIR]<br />
                Email de contact : privacy@RedZone.be (À CONFIGURER)<br />
                Délégué à la Protection des Données (DPO) : [NOM DPO À REMPLIR]
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">2. Données collectées</h2>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
              <p className="text-blue-900 font-semibold mb-2">
                📋 <strong>Phase Bêta - Finalité limitée</strong>
              </p>
              <p className="text-blue-800 text-sm">
                En phase bêta, les données sont collectées <strong>uniquement à des fins de test du fonctionnement de la plateforme</strong>. 
                Elles ne sont ni vendues ni partagées avec des tiers à des fins commerciales. 
                L&apos;objectif est de valider le fonctionnement technique et d&apos;améliorer l&apos;expérience utilisateur.
              </p>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-3">2.1. Données d&apos;identification</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6">
              <li><strong>Nom et Prénom</strong> : Pour créer votre compte vendeur</li>
              <li><strong>Adresse email</strong> : Pour l&apos;authentification et les notifications</li>
              <li><strong>Numéro de téléphone</strong> (optionnel) : Pour faciliter les contacts entre acheteurs et vendeurs</li>
            </ul>

            <h3 className="text-xl font-bold text-slate-900 mb-3">2.2. Données relatives aux véhicules (Sensibles)</h3>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded mb-6">
              <p className="text-orange-900 font-semibold mb-2">⚠️ Données sensibles au sens du RGPD</p>
              <ul className="list-disc list-inside text-orange-800 text-sm space-y-1">
                <li><strong>Numéro Car-Pass</strong> : Document obligatoire en Belgique pour certifier le kilométrage</li>
                <li><strong>Numéro de plaque d&apos;immatriculation</strong> : Pour vérifier la conformité LEZ (Low Emission Zone)</li>
                <li><strong>Norme Euro (pollution)</strong> : Pour la conformité environnementale</li>
                <li><strong>Historique du véhicule</strong> : Photos, description, équipements</li>
              </ul>
              <p className="text-orange-800 text-sm mt-2">
                <strong>Base légale :</strong> Ces données sont collectées avec votre consentement explicite 
                et sont nécessaires à l&apos;exécution du contrat (publication de l&apos;annonce).
              </p>
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-3">2.3. Données de navigation</h3>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-6">
              <li><strong>Cookies techniques</strong> : Nécessaires au fonctionnement du site (session, authentification)</li>
              <li><strong>Cookies analytiques</strong> (si acceptés) : Google Analytics pour comprendre l&apos;usage du site</li>
              <li><strong>Cookies marketing</strong> (si acceptés) : Pour afficher des publicités pertinentes</li>
              <li><strong>Adresse IP</strong> : Pour la sécurité et la prévention des fraudes (durée de conservation : 12 mois)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">3. Finalités du traitement</h2>
            <div className="space-y-4">
              <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl">
                <h4 className="font-bold text-slate-900 mb-2">📝 Gestion des annonces</h4>
                <p className="text-slate-700 text-sm">
                  Publication, modification et suppression de vos annonces de vente de véhicules.
                  <br /><strong>Base légale :</strong> Exécution du contrat
                </p>
              </div>

              <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl">
                <h4 className="font-bold text-slate-900 mb-2">🔐 Authentification et sécurité</h4>
                <p className="text-slate-700 text-sm">
                  Création et gestion de votre compte, prévention des fraudes, sécurité du site.
                  <br /><strong>Base légale :</strong> Exécution du contrat + Intérêt légitime (sécurité)
                </p>
              </div>

              <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl">
                <h4 className="font-bold text-slate-900 mb-2">📧 Communication</h4>
                <p className="text-slate-700 text-sm">
                  Envoi de notifications (nouveaux messages, validation d&apos;annonce), newsletters (si consentement).
                  <br /><strong>Base légale :</strong> Exécution du contrat + Consentement (newsletter)
                </p>
              </div>

              <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl">
                <h4 className="font-bold text-slate-900 mb-2">📊 Amélioration du service</h4>
                <p className="text-slate-700 text-sm">
                  Analyse statistique de l&apos;usage du site, optimisation de l&apos;expérience utilisateur.
                  <br /><strong>Base légale :</strong> Consentement (cookies analytiques)
                </p>
              </div>

              <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl">
                <h4 className="font-bold text-slate-900 mb-2">⚖️ Obligations légales</h4>
                <p className="text-slate-700 text-sm">
                  Respect des obligations fiscales, comptables et réglementaires belges.
                  <br /><strong>Base légale :</strong> Obligation légale
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">4. Destinataires des données</h2>
            <p className="text-slate-700 mb-4">
              Vos données personnelles peuvent être transmises aux catégories de destinataires suivants :
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li><strong>Personnel autorisé de RedZone</strong> : Équipe technique, support client, modération</li>
              <li><strong>Acheteurs potentiels</strong> : Uniquement les informations de l&apos;annonce (jamais votre email direct)</li>
              <li><strong>Prestataires techniques</strong> : Hébergement (ex: Vercel, AWS), emailing (ex: SendGrid), paiement (si applicable)</li>
              <li><strong>Autorités compétentes</strong> : En cas de réquisition judiciaire ou obligation légale</li>
            </ul>
            <div className="bg-red-50 p-4 rounded-2xl mt-4">
              <p className="text-red-900 text-sm">
                <strong>🌍 Transferts hors UE :</strong> Certains prestataires peuvent être situés hors de l&apos;Union Européenne. 
                Dans ce cas, nous nous assurons que des garanties appropriées sont en place (clauses contractuelles types, Privacy Shield, etc.).
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">5. Durée de conservation</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-300 p-3 text-left font-bold">Type de données</th>
                    <th className="border border-slate-300 p-3 text-left font-bold">Durée de conservation</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  <tr>
                    <td className="border border-slate-300 p-3">Données de compte actif</td>
                    <td className="border border-slate-300 p-3">Tant que le compte est actif + 1 an d&apos;inactivité</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-300 p-3">Annonces publiées</td>
                    <td className="border border-slate-300 p-3">5 ans après suppression (obligation légale belge)</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-3">Données de paiement</td>
                    <td className="border border-slate-300 p-3">10 ans (obligation comptable belge)</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="border border-slate-300 p-3">Cookies analytiques</td>
                    <td className="border border-slate-300 p-3">13 mois maximum (recommandation CNIL/APD)</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-3">Logs de sécurité (IP)</td>
                    <td className="border border-slate-300 p-3">12 mois</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">6. Vos droits (RGPD)</h2>
            <p className="text-slate-700 mb-4">
              Conformément au RGPD et à la loi belge du 30 juillet 2018, vous disposez des droits suivants :
            </p>

            <div className="space-y-4">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h4 className="font-bold text-slate-900 mb-2">✅ Droit d&apos;accès</h4>
                <p className="text-slate-700 text-sm">
                  Obtenir une copie de toutes les données que nous détenons sur vous.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h4 className="font-bold text-slate-900 mb-2">✏️ Droit de rectification</h4>
                <p className="text-slate-700 text-sm">
                  Corriger des données inexactes ou incomplètes.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h4 className="font-bold text-slate-900 mb-2">🗑️ Droit à l&apos;effacement (&quot;Droit à l&apos;oubli&quot;)</h4>
                <p className="text-slate-700 text-sm">
                  Demander la suppression de vos données (sauf obligation légale de conservation).
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h4 className="font-bold text-slate-900 mb-2">🔒 Droit à la limitation</h4>
                <p className="text-slate-700 text-sm">
                  Demander le gel temporaire du traitement de vos données.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h4 className="font-bold text-slate-900 mb-2">📦 Droit à la portabilité</h4>
                <p className="text-slate-700 text-sm">
                  Récupérer vos données dans un format structuré et lisible par machine (JSON, CSV).
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h4 className="font-bold text-slate-900 mb-2">🚫 Droit d&apos;opposition</h4>
                <p className="text-slate-700 text-sm">
                  Vous opposer au traitement de vos données (notamment pour le marketing direct).
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h4 className="font-bold text-slate-900 mb-2">🤖 Décision automatisée</h4>
                <p className="text-slate-700 text-sm">
                  Ne pas faire l&apos;objet d&apos;une décision fondée exclusivement sur un traitement automatisé.
                </p>
              </div>
            </div>

            <div className="bg-red-100 p-6 rounded-2xl mt-6">
              <h4 className="font-bold text-slate-900 mb-2">📧 Comment exercer vos droits ?</h4>
              <p className="text-slate-900 mb-3">
                Envoyez un email à : <strong>privacy@RedZone.be</strong> (À CONFIGURER)
              </p>
              <p className="text-slate-700 text-sm mb-2">
                Joignez une copie de votre carte d&apos;identité (pour vérification) et précisez votre demande.
              </p>
              <p className="text-slate-700 text-sm">
                <strong>Délai de réponse :</strong> Maximum 1 mois (prolongeable à 3 mois si complexe, avec justification).
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">7. Sécurité des données</h2>
            <p className="text-slate-700 mb-4">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
              <li><strong>Chiffrement HTTPS</strong> : Toutes les communications sont chiffrées (SSL/TLS)</li>
              <li><strong>Mots de passe sécurisés</strong> : Hachage bcrypt, politique de mots de passe forts</li>
              <li><strong>Accès restreint</strong> : Seul le personnel autorisé peut accéder aux données</li>
              <li><strong>Sauvegardes régulières</strong> : Backup quotidien des données critiques</li>
              <li><strong>Surveillance</strong> : Logs de sécurité, détection des intrusions</li>
              <li><strong>Conformité</strong> : Audits réguliers de sécurité et de conformité RGPD</li>
            </ul>
            <div className="bg-slate-50 p-4 rounded-2xl mt-4">
              <p className="text-slate-900 font-semibold mb-2">
                🔐 Services tiers sécurisés
              </p>
              <p className="text-slate-700 text-sm">
                L&apos;authentification et le stockage des données sont gérés par <strong>Supabase</strong>, 
                un service tiers sécurisé et conforme au RGPD. Supabase utilise des infrastructures cloud 
                certifiées (SOC 2, ISO 27001) et garantit la sécurité et la confidentialité de vos données.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">8. Cookies et technologies similaires</h2>
            <p className="text-slate-700 mb-4">
              Pour plus d&apos;informations sur notre utilisation des cookies, consultez notre bandeau cookies 
              et notre <Link href="#" className="text-red-600 hover:text-red-700 font-bold underline">politique de gestion des cookies</Link>.
            </p>
            <p className="text-slate-700 mb-4">
              Vous pouvez à tout moment modifier vos préférences via le lien <strong>&quot;Gestion des cookies&quot;</strong> en bas de page.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">9. Réclamation auprès de l&apos;autorité de contrôle</h2>
            <p className="text-slate-700 mb-4">
              Si vous estimez que vos droits ne sont pas respectés, vous avez le droit d&apos;introduire une réclamation auprès de :
            </p>
            <div className="bg-slate-50 p-6 rounded-2xl">
              <p className="text-slate-900 font-bold mb-2">
                🇧🇪 Autorité de Protection des Données (APD) - Belgique
              </p>
              <p className="text-slate-700 text-sm">
                Rue de la Presse, 35<br />
                1000 Bruxelles<br />
                Belgique<br />
                <br />
                Téléphone : +32 (0)2 274 48 00<br />
                Email : contact@apd-gba.be<br />
                Site web : <a href="https://www.autoriteprotectiondonnees.be" className="text-red-600 hover:text-red-700 underline" target="_blank" rel="noopener noreferrer">www.autoriteprotectiondonnees.be</a>
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">10. Modifications de cette politique</h2>
            <p className="text-slate-700 mb-4">
              Nous pouvons modifier cette politique de confidentialité pour refléter des changements dans nos pratiques 
              ou pour des raisons légales, réglementaires ou opérationnelles.
            </p>
            <p className="text-slate-700 mb-4">
              Toute modification importante sera notifiée par email et/ou via une bannière visible sur le site.
            </p>
            <p className="text-slate-700">
              <strong>Date de dernière modification :</strong> Décembre 2025
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">11. Contact</h2>
            <p className="text-slate-700 mb-4">
              Pour toute question concernant cette politique de confidentialité ou vos données personnelles :
            </p>
            <div className="bg-red-50 p-6 rounded-2xl">
              <p className="text-slate-900 mb-2">
                <strong>Email :</strong> privacy@RedZone.be (À CONFIGURER)
              </p>
              <p className="text-slate-900 mb-2">
                <strong>Courrier :</strong> RedZone SPRL - Service Protection des Données<br />
                [ADRESSE COMPLÈTE À REMPLIR]
              </p>
              <p className="text-slate-900">
                <strong>Délégué à la Protection des Données (DPO) :</strong> [NOM À REMPLIR]
              </p>
            </div>
          </section>
        </div>

        {/* Footer avec retour */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-full transition-all shadow-xl hover:scale-105"
          >
            <ArrowLeft size={20} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
