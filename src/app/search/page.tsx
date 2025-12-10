"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, ArrowUpDown, Car as CarIcon, Loader2, X } from "lucide-react";
import CarCard from "@/components/CarCard";
import SearchFilters, { FiltersState } from "@/components/SearchFilters";
import { searchVehicules, SearchFilters as SearchFiltersType, SortOption } from "@/lib/supabase/search";
import { Vehicule } from "@/lib/supabase/types";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // États des filtres (avec nouveaux filtres passionnés)
  const [filters, setFilters] = useState<FiltersState>({
    marque: searchParams.get("marque") || "",
    modele: searchParams.get("modele") || "",
    prixMin: searchParams.get("prixMin") || "",
    prixMax: searchParams.get("prixMax") || "",
    anneeMin: searchParams.get("anneeMin") || "",
    anneeMax: searchParams.get("anneeMax") || "",
    kmMax: searchParams.get("kmMax") || "",
    type: searchParams.get("type")?.split(",").filter(Boolean) || [],
    carburants: searchParams.get("carburants")?.split(",").filter(Boolean) || [],
    transmissions: searchParams.get("transmissions")?.split(",").filter(Boolean) || [],
    carrosseries: searchParams.get("carrosseries")?.split(",").filter(Boolean) || [],
    normeEuro: searchParams.get("normeEuro") || "",
    carPassOnly: searchParams.get("carPassOnly") === "true",
    
    // FILTRES PASSIONNÉS (RedZone)
    architectures: searchParams.get("architectures")?.split(",").filter(Boolean) || [],
    admissions: searchParams.get("admissions")?.split(",").filter(Boolean) || [],
    couleurExterieure: searchParams.get("couleurExterieure")?.split(",").filter(Boolean) || [],
    couleurInterieure: searchParams.get("couleurInterieure")?.split(",").filter(Boolean) || [],
    nombrePlaces: searchParams.get("nombrePlaces")?.split(",").filter(Boolean) || [],
  });

  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sortBy") as SortOption) || "annee_desc"
  );

  // État pour les véhicules filtrés côté serveur
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const previousVehiculesRef = useRef<Vehicule[]>([]); // Garder les données précédentes

  // Charger les véhicules avec filtres côté serveur
  useEffect(() => {
    let isMounted = true; // Flag pour éviter les mises à jour d'état après démontage
    let abortController = new AbortController();

    const loadVehicules = async () => {
      setIsLoading(true);
      try {
        // Convertir les filtres de l'état local en format pour la requête
        const searchFilters: SearchFiltersType = {
          marque: filters.marque || undefined,
          modele: filters.modele || undefined,
          prixMin: filters.prixMin ? parseInt(filters.prixMin) : undefined,
          prixMax: filters.prixMax ? parseInt(filters.prixMax) : undefined,
          anneeMin: filters.anneeMin ? parseInt(filters.anneeMin) : undefined,
          anneeMax: filters.anneeMax ? parseInt(filters.anneeMax) : undefined,
          kmMax: filters.kmMax ? parseInt(filters.kmMax) : undefined,
          type: filters.type.length > 0 ? filters.type : undefined,
          carburants: filters.carburants.length > 0 ? filters.carburants : undefined,
          transmissions: filters.transmissions.length > 0 ? filters.transmissions : undefined,
          carrosseries: filters.carrosseries.length > 0 ? filters.carrosseries : undefined,
          normeEuro: filters.normeEuro || undefined,
          carPassOnly: filters.carPassOnly || undefined,
          architectures: filters.architectures.length > 0 ? filters.architectures : undefined,
          admissions: filters.admissions.length > 0 ? filters.admissions : undefined,
          couleurExterieure: filters.couleurExterieure.length > 0 ? filters.couleurExterieure : undefined,
          couleurInterieure: filters.couleurInterieure.length > 0 ? filters.couleurInterieure : undefined,
          nombrePlaces: filters.nombrePlaces.length > 0 ? filters.nombrePlaces : undefined,
        };

        const results = await searchVehicules(searchFilters, sortBy);
        
        // Ne mettre à jour l'état que si le composant est toujours monté et la requête n'est pas annulée
        if (isMounted && !abortController.signal.aborted) {
          setVehicules(results);
          previousVehiculesRef.current = results; // Sauvegarder les données réussies
        }
      } catch (error) {
        console.error("Erreur chargement véhicules:", error);
        // Ne pas vider les données en cas d'erreur, garder les données précédentes
        if (isMounted && !abortController.signal.aborted) {
          if (previousVehiculesRef.current.length > 0) {
            console.warn("Erreur de chargement, conservation des données précédentes");
            // Garder les données précédentes
          } else {
            setVehicules([]);
          }
        }
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadVehicules();

    // Cleanup: annuler la requête et marquer le composant comme démonté
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [
    filters.marque,
    filters.modele,
    filters.prixMin,
    filters.prixMax,
    filters.anneeMin,
    filters.anneeMax,
    filters.kmMax,
    filters.type?.join(','),
    filters.carburants?.join(','),
    filters.transmissions?.join(','),
    filters.carrosseries?.join(','),
    filters.normeEuro,
    filters.carPassOnly,
    filters.architectures?.join(','),
    filters.admissions?.join(','),
    filters.couleurExterieure?.join(','),
    filters.couleurInterieure?.join(','),
    filters.nombrePlaces?.join(','),
    sortBy,
  ]);

  // Mettre à jour l'URL quand les filtres changent
  useEffect(() => {
    const params = new URLSearchParams();

    // Ajouter les filtres simples
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(","));
        } else if (typeof value === "boolean" && value) {
          params.set(key, "true");
        } else if (typeof value === "string" && value) {
          params.set(key, value);
        }
      }
    });

    // Ajouter le tri
    if (sortBy !== "annee_desc") {
      params.set("sortBy", sortBy);
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/search?${queryString}` : "/search";

    router.replace(newUrl, { scroll: false });
  }, [filters, sortBy, router]);

  // Handler pour modifier un filtre
  const handleFilterChange = useCallback((key: keyof FiltersState, value: string | string[] | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Réinitialiser les filtres
  const resetFilters = useCallback(() => {
    setFilters({
      marque: "",
      modele: "",
      prixMin: "",
      prixMax: "",
      anneeMin: "",
      anneeMax: "",
      kmMax: "",
      type: [],
      carburants: [],
      transmissions: [],
      carrosseries: [],
      normeEuro: "",
      carPassOnly: false,
      architectures: [],
      admissions: [],
      couleurExterieure: [],
      couleurInterieure: [],
      nombrePlaces: [],
    });
    setSortBy("annee_desc");
  }, []);

  // Les véhicules sont déjà filtrés et triés côté serveur
  const filteredVehicules = vehicules;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            🔍 Recherche <span className="text-red-600">RedZone</span>
          </h1>
          <p className="text-slate-300 text-lg">
            Trouvez la sportive de vos rêves
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR DESKTOP - Filtres */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 sticky top-24 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Filter size={24} className="text-red-600" />
                  Filtres
                </h2>
                <button
                  onClick={resetFilters}
                  className="text-sm text-slate-600 hover:text-red-600 font-medium transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
              <SearchFilters filters={filters} onFilterChange={handleFilterChange} onReset={resetFilters} activeFiltersCount={0} />
            </div>
          </aside>

          {/* MOBILE - Bouton filtres fixe en haut */}
          <div className="lg:hidden sticky top-16 z-40 bg-white pb-4">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95"
            >
              <Filter size={22} />
              Filtres ({Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length})
            </button>
          </div>

          {/* MOBILE - Bottom Sheet pour filtres */}
          {isFilterOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end lg:hidden" onClick={() => setIsFilterOpen(false)}>
              <div className="bg-white w-full max-h-[90vh] overflow-y-auto rounded-t-3xl shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
                {/* Handle bar */}
                <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-10">
                  <h2 className="text-2xl font-black text-slate-900">Filtres</h2>
                  <button 
                    onClick={() => setIsFilterOpen(false)} 
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors active:scale-95"
                    aria-label="Fermer les filtres"
                  >
                    <X size={20} className="text-slate-700" />
                  </button>
                </div>
                
                {/* Contenu des filtres */}
                <div className="p-6 pb-24">
                  <SearchFilters filters={filters} onFilterChange={handleFilterChange} onReset={resetFilters} activeFiltersCount={0} />
                </div>
                
                {/* Bouton fixe en bas */}
                <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 shadow-2xl safe-area-inset-bottom">
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 min-h-[48px] rounded-2xl transition-all active:scale-95 shadow-lg"
                  >
                    Voir {vehicules.length} résultat{vehicules.length > 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RÉSULTATS */}
          <main className="flex-1">
            {/* Barre de tri */}
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-100/50 p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CarIcon size={20} className="text-red-600" />
                <span className="font-bold text-slate-900">
                  {isLoading ? "Chargement..." : `${filteredVehicules.length} véhicule(s) trouvé(s)`}
                </span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="border-2 border-slate-200 rounded-xl px-4 py-2 font-medium text-slate-900 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
              >
                <option value="annee_desc">Plus récent</option>
                <option value="prix_asc">Prix croissant</option>
                <option value="prix_desc">Prix décroissant</option>
                <option value="km_asc">Km croissant</option>
              </select>
            </div>

            {/* Grille de résultats */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-slate-100 rounded-3xl overflow-hidden animate-pulse">
                    <div className="h-64 bg-slate-200" />
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-slate-200 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                      <div className="h-4 bg-slate-200 rounded w-full" />
                      <div className="flex gap-2">
                        <div className="h-6 bg-slate-200 rounded w-20" />
                        <div className="h-6 bg-slate-200 rounded w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredVehicules.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-lg shadow-slate-100/50">
                <div className="text-6xl mb-4">🏎️</div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Aucun bolide trouvé
                </h3>
                <p className="text-slate-600 mb-6">
                  Essayez d&apos;ajuster vos critères de recherche
                </p>
                <button
                  onClick={resetFilters}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-full transition-all"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVehicules.map((vehicule) => (
                  <CarCard key={vehicule.id} vehicule={vehicule} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
