"use client";

import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useVehicules } from "@/hooks/useVehicules";
import CarCard from "@/components/features/vehicles/car-card";

export default function FavoritesTab() {
  const { favorites, isLoading: isLoadingFavorites } = useFavorites();
  const { vehicules, isLoading: isLoadingVehicules } = useVehicules({ status: "active" });
  const router = useRouter();

  // Filtrer les véhicules pour ne garder que les favoris
  const favoriteVehicules = vehicules.filter((vehicule) =>
    favorites.includes(vehicule.id)
  );

  const isLoading = isLoadingFavorites || isLoadingVehicules;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Mes Favoris
          </h1>
          <p className="text-slate-400">
            {isLoading
              ? "Chargement..."
              : favorites.length === 0
              ? "Aucun favori pour le moment"
              : favorites.length === 1
              ? "1 véhicule sauvegardé"
              : `${favorites.length} véhicules sauvegardés`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-neutral-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-neutral-400 font-medium">Chargement de vos favoris...</p>
        </div>
      ) : favoriteVehicules.length === 0 ? (
        <div className="bg-neutral-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 p-12 text-center">
          <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={48} className="text-neutral-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
            Aucun favori enregistré
          </h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">
            Parcourez nos annonces et cliquez sur le cœur pour sauvegarder vos
            véhicules préférés. Vous les retrouverez ici facilement !
          </p>
          <button
            onClick={() => router.push("/search")}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all shadow-xl hover:shadow-md hover:scale-105"
          >
            Découvrir les annonces
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteVehicules.map((vehicule) => (
            <CarCard key={vehicule.id} car={vehicule} />
          ))}
        </div>
      )}
    </div>
  );
}

