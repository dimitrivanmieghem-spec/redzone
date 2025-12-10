import Link from "next/link";
import { ArrowLeft, Car } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Car size={48} className="text-red-600" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
          Véhicule introuvable
        </h1>
        <p className="text-slate-700 text-lg mb-8 max-w-2xl mx-auto">
          Le véhicule que vous recherchez n&apos;existe pas, a été supprimé, ou n&apos;est pas encore validé par l&apos;administrateur.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-xl"
          >
            <ArrowLeft size={20} />
            Retour à la recherche
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white border-2 border-slate-300 hover:border-red-600 text-slate-900 font-bold px-8 py-4 rounded-full transition-all hover:scale-105"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

