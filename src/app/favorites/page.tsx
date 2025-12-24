"use client";

import { Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import CarCard from "@/components/features/vehicles/car-card";
import { useVehicules } from "@/hooks/useVehicules";
import { useFavorites } from "@/contexts/FavoritesContext";

export default function FavoritesPage() {
  const { favorites, isLoading: isLoadingFavorites } = useFavorites();
  const { vehicules, isLoading: isLoadingVehicules } = useVehicules({ status: "active" });

  // Filtrer les véhicules pour ne garder que les favoris
  const favoriteVehicules = vehicules.filter((vehicule) =>
    favorites.includes(vehicule.id)
  );

  // État de chargement global
  const isLoading = isLoadingFavorites || isLoadingVehicules;

  return (
    <main className="min-h-0 sm:min-h-screen bg-neutral-950 text-white font-sans pb-24 md:pb-0">
      {/* HEADER */}
      <section className="py-6 sm:py-12 px-4 bg-neutral-950">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-neutral-300 hover:text-red-500 mb-6 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Retour au dashboard</span>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center">
              <Heart size={24} className="text-red-500 fill-red-500" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Mes Favoris
              </h1>
              <p className="text-neutral-300 mt-1">
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
      <section className="max-w-6xl mx-auto py-6 sm:py-16 px-4">
        {isLoading ? (
          // État de chargement
          <div className="text-center py-16">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center animate-pulse">
                <Heart size={48} className="text-red-500" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
              Chargement de vos favoris...
            </h2>
            <p className="text-neutral-400 max-w-md mx-auto">
              Veuillez patienter pendant le chargement de vos véhicules favoris.
            </p>
          </div>
        ) : favoriteVehicules.length === 0 ? (
          // Message si aucun favori
          <div className="text-center py-16">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center">
                <Heart size={48} className="text-neutral-400" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
              Aucun favori enregistré
            </h2>
            <p className="text-neutral-300 mb-8 max-w-md mx-auto">
              Parcourez nos annonces et cliquez sur le cœur pour sauvegarder vos
              véhicules préférés. Vous les retrouverez ici facilement !
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all shadow-xl hover:shadow-md hover:scale-105 transition-transform"
            >
              <ArrowLeft size={18} />
              Découvrir les annonces
            </Link>
          </div>
        ) : (
          // Grille des favoris
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            {favoriteVehicules.map((vehicule) => (
              <CarCard key={vehicule.id} car={vehicule} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

