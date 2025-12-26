import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

export default function MentionsPage() {
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
          <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-slate-600/40">
            <Building2 size={36} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            Mentions Légales
          </h1>
          <p className="text-slate-700 text-lg">
            Informations légales obligatoires
          </p>
        </div>

        {/* Contenu */}
        <div className="prose prose-slate max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">1. Éditeur du site</h2>
            <div className="bg-slate-50 p-6 rounded-2xl">
              <p className="text-slate-900 mb-2">
                <strong>Le site est édité à titre personnel par :</strong>
              </p>
              <p className="text-slate-700 text-sm mb-2">
                <strong>Nom :</strong> Dimitri Van Mieghem
              </p>
              <p className="text-slate-700 text-sm mb-2">
                <strong>Statut :</strong> Personne physique
              </p>
              <p className="text-slate-700 text-sm mb-2">
                <strong>Domicilié en :</strong> Belgique
              </p>
              <p className="text-slate-700 text-sm mb-2">
                <strong>Email de contact :</strong> <a href="mailto:admin@octane98.be" className="text-red-600 hover:text-red-700 font-bold underline">admin@octane98.be</a>
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
                <p className="text-blue-900 text-sm">
                  <strong>📌 Note :</strong> Ce site est actuellement opéré à titre personnel dans le cadre d&apos;un projet en phase de lancement. 
                  L&apos;éditeur se réserve le droit de créer une structure juridique (société) à l&apos;avenir, moyennant information préalable des utilisateurs.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">2. Hébergement</h2>
            <div className="bg-slate-50 p-6 rounded-2xl">
              <p className="text-slate-900 mb-2">
                <strong>Hébergeur :</strong> Vercel Inc.
              </p>
              <p className="text-slate-700 text-sm mb-2">
                Adresse : 340 S Lemon Ave #4133<br />
                Walnut, CA 91789<br />
                États-Unis
              </p>
              <p className="text-slate-700 text-sm">
                Site web : <a href="https://vercel.com" className="text-red-600 hover:text-red-700 underline" target="_blank" rel="noopener noreferrer">www.vercel.com</a>
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">3. Protection des données personnelles</h2>
            <p className="text-slate-700 mb-4">
              Le responsable du traitement des données personnelles est <strong>Dimitri Van Mieghem</strong>, éditeur du site à titre personnel.
            </p>
            <p className="text-slate-700 mb-4">
              <strong>Contact pour toute question relative aux données personnelles :</strong> <a href="mailto:admin@octane98.be" className="text-red-600 hover:text-red-700 font-bold underline">admin@octane98.be</a>
            </p>
            <p className="text-slate-700 mb-4">
              Pour plus d&apos;informations sur le traitement de vos données, consultez notre{" "}
              <Link href="/legal/privacy" className="text-red-600 hover:text-red-700 font-bold underline">
                Politique de Confidentialité
              </Link>.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">4. Propriété intellectuelle</h2>
            <p className="text-slate-700 mb-4">
              L&apos;ensemble des contenus présents sur le site www.Octane98.be (textes, graphiques, logo, icônes, images, 
              sons, logiciels) est la propriété exclusive de Dimitri Van Mieghem ou de ses partenaires, 
              sauf mention contraire.
            </p>
            <p className="text-slate-700 mb-4">
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie 
              des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, 
              sauf autorisation écrite préalable de Dimitri Van Mieghem.
            </p>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <p className="text-orange-900 text-sm">
                <strong>⚠️ Toute exploitation non autorisée du site ou de l&apos;un des éléments qu&apos;il contient 
                sera considérée comme constitutive d&apos;une contrefaçon</strong> et poursuivie conformément 
                aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">5. Liens hypertextes</h2>
            <p className="text-slate-700 mb-4">
              Le site www.Octane98.be peut contenir des liens vers d&apos;autres sites internet. 
              Dimitri Van Mieghem ne peut être tenu responsable du contenu de ces sites externes.
            </p>
            <p className="text-slate-700 mb-4">
              La création de liens hypertextes vers le site www.Octane98.be est autorisée sous réserve :
            </p>
            <ul className="list-disc list-inside text-slate-700 space-y-2">
              <li>Que les pages ne soient pas imbriquées dans un cadre (frame)</li>
              <li>Que le lien s&apos;ouvre dans une nouvelle fenêtre</li>
              <li>Qu&apos;aucune mention trompeuse ne soit associée au lien</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">6. Cookies</h2>
            <p className="text-slate-700 mb-4">
              Le site www.Octane98.be utilise des cookies pour améliorer l&apos;expérience utilisateur 
              et analyser le trafic. Vous pouvez gérer vos préférences via le bandeau cookies ou 
              le lien &quot;Gestion des cookies&quot; en bas de page.
            </p>
            <p className="text-slate-700 mb-4">
              Pour plus d&apos;informations, consultez notre{" "}
              <Link href="/legal/privacy" className="text-red-600 hover:text-red-700 font-bold underline">
                Politique de Confidentialité
              </Link>.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">7. Droit applicable</h2>
            <div className="bg-slate-50 p-6 rounded-2xl">
              <p className="text-slate-900 font-bold mb-2">
                ⚖️ Loi belge
              </p>
              <p className="text-slate-700 text-sm mb-4">
                Les présentes mentions légales sont régies par le droit belge.
              </p>
              <p className="text-slate-900 font-bold mb-2">
                🏛️ Tribunaux compétents
              </p>
              <p className="text-slate-700 text-sm">
                En cas de litige, les tribunaux de Bruxelles (Belgique) seront seuls compétents.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">8. Médiateur de la consommation</h2>
            <p className="text-slate-700 mb-4">
              Conformément à l&apos;article XVI.2 du Code de droit économique belge, 
              en cas de litige avec un consommateur, vous pouvez faire appel à un service de médiation agréé :
            </p>
            <div className="bg-green-50 p-6 rounded-2xl">
              <p className="text-slate-900 font-bold mb-2">
                Service de Médiation pour le Consommateur
              </p>
              <p className="text-slate-700 text-sm">
                North Gate II, Boulevard du Roi Albert II, 8 Bte 1<br />
                1000 Bruxelles<br />
                Belgique<br />
                <br />
                Téléphone : +32 (0)2 702 52 00<br />
                Email : contact@mediationconsommateur.be<br />
                Site : <a href="https://www.mediationconsommateur.be" className="text-red-600 hover:text-red-700 underline" target="_blank" rel="noopener noreferrer">www.mediationconsommateur.be</a>
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">9. Contact</h2>
            <p className="text-slate-700 mb-4">
              Pour toute question ou réclamation concernant le site :
            </p>
            <div className="bg-red-50 p-6 rounded-2xl">
              <p className="text-slate-900 mb-4">
                <strong>Pour toute question, contactez l&apos;éditeur :</strong>
              </p>
              <a
                href="mailto:admin@octane98.be"
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-red-900/20 hover:scale-105"
              >
                Contacter l&apos;éditeur
              </a>
              <p className="text-slate-900 mt-4">
                <strong>Email :</strong> <a href="mailto:admin@octane98.be" className="text-red-600 hover:text-red-700 font-bold underline">admin@octane98.be</a>
              </p>
              <p className="text-slate-700 text-sm mt-3">
                <em>En phase de lancement, les réponses aux demandes peuvent prendre quelques jours. Merci de votre compréhension.</em>
              </p>
            </div>
          </section>

          <div className="bg-slate-100 p-6 rounded-2xl mt-8 text-center">
            <p className="text-slate-900 text-sm">
              <strong>Dernière mise à jour des mentions légales :</strong> Décembre 2025
            </p>
          </div>
        </div>

        {/* Footer avec retour */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-bold px-8 py-4 rounded-full transition-all shadow-xl hover:scale-105"
          >
            <ArrowLeft size={20} />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

