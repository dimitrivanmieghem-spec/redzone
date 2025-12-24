import Link from "next/link";
import { Car, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-red-950/20 to-neutral-950 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Icône animée */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <Car
              size={120}
              className="text-red-600 animate-bounce"
              strokeWidth={1.5}
            />
            <div className="absolute inset-0 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight">
          Sortie de route ! 
        </h1>

        {/* Sous-titre */}
        <p className="text-xl md:text-2xl text-neutral-300 mb-8 font-medium">
          Cette page n&apos;existe pas ou le véhicule a été vendu.
        </p>

        {/* Message additionnel */}
        <p className="text-neutral-400 mb-12 max-w-md mx-auto">
          Le véhicule que vous recherchez n&apos;est plus disponible ou la page
          demandée n&apos;existe pas. Retournez au garage pour découvrir d&apos;autres
          sportives.
        </p>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black px-8 py-4 rounded-full transition-all hover:scale-105 shadow-2xl shadow-red-600/50 flex items-center gap-3 text-lg"
          >
            <Home size={24} className="group-hover:scale-110 transition-transform" />
            Retour au Garage
          </Link>

          <Link
            href="/search"
            className="group bg-neutral-800 hover:bg-neutral-700 text-white font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-xl border-2 border-neutral-700 flex items-center gap-3"
          >
            <Car size={20} className="group-hover:scale-110 transition-transform" />
            Rechercher
          </Link>
        </div>

        {/* Code d'erreur discret */}
        <p className="mt-16 text-xs text-neutral-600 font-mono">
          Erreur 404
        </p>
      </div>
    </main>
  );
}

