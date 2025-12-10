"use client";

import { Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import CarCard from "@/components/CarCard";
import { useVehicules } from "@/hooks/useVehicules";
import { useFavorites } from "@/contexts/FavoritesContext";

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const { vehicules, isLoading } = useVehicules({ status: "active" });

  // Filtrer les véhicules pour ne garder que les favoris
  const favoriteVehicules = vehicules.filter((vehicule) =>
    favorites.includes(vehicule.id)
  );

  return (
    <main className="min-h-screen bg-white text-slate-900 font-sans">
      {/* HEADER */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-900 hover:text-slate-900 mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Retour à l&apos;accueil</span>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Heart size={24} className="text-red-500 fill-red-500" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Mes Favoris
              </h1>
              <p className="text-slate-900 mt-1">
                {favorites.length === 0
                  ? "Aucun favori pour le moment"
                  : favorites.length === 1
                  ? "1 véhicule sauvegardé"
                  : `${favorites.length} véhicules sauvegardés`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <section className="max-w-6xl mx-auto py-16 px-4">
        {favoriteVehicules.length === 0 ? (
          // Message si aucun favori
          <div className="text-center py-16">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                <Heart size={48} className="text-slate-300" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
              Aucun favori enregistré
            </h2>
            <p className="text-slate-900 mb-8 max-w-md mx-auto">
              Parcourez nos annonces et cliquez sur le cœur pour sauvegarder vos
              véhicules préférés. Vous les retrouverez ici facilement !
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all shadow-xl hover:shadow-md hover:scale-105 transition-transform"
            >
              <ArrowLeft size={18} />
              Découvrir les annonces
            </Link>
          </div>
        ) : (
          // Grille des favoris
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {favoriteVehicules.map((vehicule) => (
              <CarCard key={vehicule.id} car={vehicule} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

