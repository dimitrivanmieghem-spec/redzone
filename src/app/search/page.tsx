"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Filter,
  X,
  Search as SearchIcon,
  Car,
  ChevronDown,
  SlidersHorizontal,
  ArrowUpDown,
  Grid3x3,
  List,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Sparkles,
  Tag,
  CheckSquare,
  Square,
  Save,
  Heart as HeartIcon,
  XCircle,
  Bell,
} from "lucide-react";
import Link from "next/link";
import CarCard from "@/components/features/vehicles/car-card";
import { useVehicules } from "@/hooks/useVehicules";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import VehicleComparisonModal from "@/components/features/vehicles/VehicleComparisonModal";
import { saveSearch } from "@/app/actions/search";
import { createSearchAlert } from "@/app/actions/search-alerts";
import type { Vehicule } from "@/lib/supabase/types";
import SaveSearchModal from "@/components/features/search/SaveSearchModal";
// Constantes unifiées - Source de vérité unique
import {
  CARROSSERIE_TYPES,
  DRIVETRAIN_TYPES,
  DRIVETRAIN_LABELS,
  ENGINE_ARCHITECTURE_TYPES,
  ENGINE_ARCHITECTURE_LABELS,
  EURO_STANDARDS,
} from "@/lib/vehicleData";

// Options pour les filtres
const MARQUES = [
  "Toutes les marques",
  "BMW",
  "Porsche",
  "Audi",
  "Mercedes-Benz",
  "Ferrari",
  "Lamborghini",
  "Aston Martin",
  "McLaren",
  "Lotus",
];

const CARBURANTS = [
  { value: "", label: "Tous les carburants" },
  { value: "essence", label: "Essence" },
  { value: "e85", label: "Ethanol (E85)" },
  { value: "lpg", label: "GPL" },
];

const TRANSMISSIONS = [
  { value: "manuelle", label: "Manuelle" },
  { value: "automatique", label: "Automatique" },
  { value: "sequentielle", label: "Séquentielle" },
];

// Utilisation des constantes unifiées
const CARROSSERIES = CARROSSERIE_TYPES;
const DRIVETRAINS = DRIVETRAIN_TYPES.map((value) => ({
  value,
  label: DRIVETRAIN_LABELS[value],
}));
const ENGINE_ARCHITECTURES = ENGINE_ARCHITECTURE_TYPES.map((value) => ({
  value,
  label: ENGINE_ARCHITECTURE_LABELS[value].label,
  subtitle: ENGINE_ARCHITECTURE_LABELS[value].subtitle,
}));
const NORME_EURO = [
  { value: "", label: "Toutes" },
  ...EURO_STANDARDS.map((std) => ({ value: std.value, label: std.label })),
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Plus récent" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "year_desc", label: "Année récente" },
  { value: "mileage_asc", label: "Kilométrage faible" },
];


interface Filters {
  marque: string;
  modele: string;
  prixMin: string;
  prixMax: string;
  anneeMin: string;
  anneeMax: string;
  mileageMin: string;
  mileageMax: string;
  sellerType: string;
  carburant: string;
  transmission: string[];
  carrosserie: string[];
  normeEuro: string;
  carPassOnly: boolean;
  city: string;
  postalCode: string;
  favoritesOnly: boolean;
  // Filtres pour véhicules sportifs (optionnels)
  drivetrain: string[];
  topSpeedMin: string;
  topSpeedMax: string;
  // Nouveaux filtres techniques
  architectureMoteur: string[];
  puissanceMin: string;
  puissanceMax: string;
}

type SortOption = "date_desc" | "price_asc" | "price_desc" | "year_desc" | "mileage_asc";
type ViewMode = "grid" | "list";

const ITEMS_PER_PAGE = 12;

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { favorites } = useFavorites();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "date_desc"
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    (typeof window !== "undefined" && (localStorage.getItem("search_view_mode") as ViewMode)) || "grid"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isSavingSearch, setIsSavingSearch] = useState(false);
  const [isSaveSearchModalOpen, setIsSaveSearchModalOpen] = useState(false);
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);

  // Récupérer les véhicules depuis Supabase
  const { vehicules, isLoading } = useVehicules({
    status: "active",
    type: "car",
  });

  // État des filtres
  const [filters, setFilters] = useState<Filters>({
    marque: searchParams.get("marque") || "",
    modele: searchParams.get("modele") || "",
    prixMin: searchParams.get("prixMin") || "",
    prixMax: searchParams.get("prixMax") || "",
    anneeMin: searchParams.get("anneeMin") || "",
    anneeMax: searchParams.get("anneeMax") || "",
    mileageMin: searchParams.get("mileageMin") || "",
    mileageMax: searchParams.get("mileageMax") || "",
    sellerType: searchParams.get("sellerType") || "",
    carburant: searchParams.get("carburant") || "",
    transmission: searchParams.get("transmission")?.split(",").filter(Boolean) || [],
    carrosserie: searchParams.get("carrosserie")?.split(",").filter(Boolean) || [],
    normeEuro: searchParams.get("normeEuro") || "",
    carPassOnly: searchParams.get("carPassOnly") === "true",
    city: searchParams.get("city") || "",
    postalCode: searchParams.get("postalCode") || "",
    favoritesOnly: searchParams.get("favoritesOnly") === "true",
    // Filtres pour véhicules sportifs
    drivetrain: searchParams.get("drivetrain")?.split(",").filter(Boolean) || [],
    topSpeedMin: searchParams.get("topSpeedMin") || "",
    topSpeedMax: searchParams.get("topSpeedMax") || "",
    // Nouveaux filtres techniques
    architectureMoteur: searchParams.get("architectureMoteur")?.split(",").filter(Boolean) || [],
    puissanceMin: searchParams.get("puissanceMin") || "",
    puissanceMax: searchParams.get("puissanceMax") || "",
  });

  // Sauvegarder la préférence de vue
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("search_view_mode", viewMode);
    }
  }, [viewMode]);

  // Synchroniser l'URL avec les filtres
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (sortBy !== "date_desc") params.set("sort", sortBy);
    if (filters.marque) params.set("marque", filters.marque);
    if (filters.modele) params.set("modele", filters.modele);
    if (filters.prixMin) params.set("prixMin", filters.prixMin);
    if (filters.prixMax) params.set("prixMax", filters.prixMax);
    if (filters.anneeMin) params.set("anneeMin", filters.anneeMin);
    if (filters.anneeMax) params.set("anneeMax", filters.anneeMax);
    if (filters.mileageMin) params.set("mileageMin", filters.mileageMin);
    if (filters.mileageMax) params.set("mileageMax", filters.mileageMax);
    if (filters.carburant) params.set("carburant", filters.carburant);
    if (filters.transmission.length > 0) params.set("transmission", filters.transmission.join(","));
    if (filters.carrosserie.length > 0) params.set("carrosserie", filters.carrosserie.join(","));
    if (filters.normeEuro) params.set("normeEuro", filters.normeEuro);
    if (filters.carPassOnly) params.set("carPassOnly", "true");
    if (filters.city) params.set("city", filters.city);
    if (filters.postalCode) params.set("postalCode", filters.postalCode);
    if (filters.favoritesOnly) params.set("favoritesOnly", "true");
    // Filtres pour véhicules sportifs
    if (filters.drivetrain.length > 0) params.set("drivetrain", filters.drivetrain.join(","));
    if (filters.topSpeedMin) params.set("topSpeedMin", filters.topSpeedMin);
    if (filters.topSpeedMax) params.set("topSpeedMax", filters.topSpeedMax);
    // Nouveaux filtres techniques
    if (filters.architectureMoteur.length > 0) params.set("architectureMoteur", filters.architectureMoteur.join(","));
    if (filters.puissanceMin) params.set("puissanceMin", filters.puissanceMin);
    if (filters.puissanceMax) params.set("puissanceMax", filters.puissanceMax);
    if (currentPage > 1) params.set("page", currentPage.toString());

    const newUrl = params.toString() ? `?${params.toString()}` : "/search";
    router.replace(newUrl, { scroll: false });
  }, [filters, searchQuery, sortBy, currentPage, router]);

  // Filtrer les véhicules
  const filteredVehicules = useMemo(() => {
    if (!vehicules || vehicules.length === 0) return [];

    let filtered = vehicules.filter((vehicule) => {
      // Recherche textuelle globale
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          vehicule.brand?.toLowerCase().includes(query) ||
          vehicule.model?.toLowerCase().includes(query) ||
          vehicule.description?.toLowerCase().includes(query) ||
          vehicule.city?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Filtres de base
      if (filters.marque && filters.marque !== "Toutes les marques") {
        if (vehicule.brand !== filters.marque) return false;
      }
      if (filters.modele) {
        if (!vehicule.model?.toLowerCase().includes(filters.modele.toLowerCase())) return false;
      }
      if (filters.prixMin) {
        if (!vehicule.price || vehicule.price < parseInt(filters.prixMin)) return false;
      }
      if (filters.prixMax) {
        if (!vehicule.price || vehicule.price > parseInt(filters.prixMax)) return false;
      }
      if (filters.anneeMin) {
        if (!vehicule.year || vehicule.year < parseInt(filters.anneeMin)) return false;
      }
      if (filters.anneeMax) {
        if (!vehicule.year || vehicule.year > parseInt(filters.anneeMax)) return false;
      }
      if (filters.mileageMin) {
        if (!vehicule.mileage || vehicule.mileage < parseInt(filters.mileageMin)) return false;
      }
      if (filters.mileageMax) {
        if (!vehicule.mileage || vehicule.mileage > parseInt(filters.mileageMax)) return false;
      }
      if (filters.carburant) {
        if (vehicule.fuel_type !== filters.carburant) return false;
      }
      if (filters.transmission.length > 0) {
        if (!vehicule.transmission || !filters.transmission.includes(vehicule.transmission))
          return false;
      }
      if (filters.carrosserie.length > 0) {
        if (!vehicule.body_type || !filters.carrosserie.includes(vehicule.body_type)) return false;
      }
      if (filters.normeEuro) {
        if (vehicule.euro_standard !== filters.normeEuro) return false;
      }
      if (filters.carPassOnly) {
        if (!vehicule.car_pass) return false;
      }
      if (filters.city) {
        if (!vehicule.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;
      }
      if (filters.postalCode) {
        if (vehicule.postal_code !== filters.postalCode) return false;
      }
      if (filters.favoritesOnly) {
        if (!favorites.includes(vehicule.id)) return false;
      }

      // Filtres pour véhicules sportifs
      if (filters.drivetrain.length > 0) {
        if (!vehicule.drivetrain || !filters.drivetrain.includes(vehicule.drivetrain)) return false;
      }

      if (filters.topSpeedMin) {
        if (!vehicule.top_speed || vehicule.top_speed < parseInt(filters.topSpeedMin)) return false;
      }

      if (filters.topSpeedMax) {
        if (!vehicule.top_speed || vehicule.top_speed > parseInt(filters.topSpeedMax)) return false;
      }

      // Nouveaux filtres techniques
      if (filters.architectureMoteur.length > 0) {
        if (!vehicule.engine_architecture || !filters.architectureMoteur.includes(vehicule.engine_architecture)) return false;
      }

      if (filters.puissanceMin) {
        if (!vehicule.power_hp || vehicule.power_hp < parseInt(filters.puissanceMin)) return false;
      }

      if (filters.puissanceMax) {
        if (!vehicule.power_hp || vehicule.power_hp > parseInt(filters.puissanceMax)) return false;
      }

      return true;
    });

    return filtered;
  }, [filters, vehicules, searchQuery, user, favorites]);

  // Trier les véhicules
  const sortedVehicules = useMemo(() => {
    const sorted = [...filteredVehicules];
    switch (sortBy) {
      case "price_asc":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price_desc":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "year_desc":
        return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
      case "mileage_asc":
        return sorted.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
      default:
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
    }
  }, [filteredVehicules, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedVehicules.length / ITEMS_PER_PAGE);
  const paginatedVehicules = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return sortedVehicules.slice(start, end);
  }, [sortedVehicules, currentPage]);

  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, searchQuery, sortBy]);

  // Gérer le changement de filtres
  const handleFilterChange = (key: keyof Filters, value: string | string[] | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleTransmissionToggle = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      transmission: prev.transmission.includes(value)
        ? prev.transmission.filter((t) => t !== value)
        : [...prev.transmission, value],
    }));
  };

  const handleCarrosserieToggle = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      carrosserie: prev.carrosserie.includes(value)
        ? prev.carrosserie.filter((c) => c !== value)
        : [...prev.carrosserie, value],
    }));
  };

  const handleDrivetrainToggle = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      drivetrain: prev.drivetrain.includes(value)
        ? prev.drivetrain.filter((d) => d !== value)
        : [...prev.drivetrain, value],
    }));
  };

  const handleArchitectureMoteurToggle = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      architectureMoteur: prev.architectureMoteur.includes(value)
        ? prev.architectureMoteur.filter((a) => a !== value)
        : [...prev.architectureMoteur, value],
    }));
  };


  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setFilters({
      marque: "",
      modele: "",
      prixMin: "",
      prixMax: "",
      anneeMin: "",
      anneeMax: "",
      mileageMin: "",
      mileageMax: "",
      sellerType: "",
      carburant: "",
      transmission: [],
      carrosserie: [],
      normeEuro: "",
      carPassOnly: false,
      city: "",
      postalCode: "",
      favoritesOnly: false,
      // Nouveaux filtres
      drivetrain: [],
      topSpeedMin: "",
      topSpeedMax: "",
      // Nouveaux filtres techniques
      architectureMoteur: [],
      puissanceMin: "",
      puissanceMax: "",
    });
    setSearchQuery("");
    setIsFiltersOpen(false);
    setIsAdvancedFiltersOpen(false);
    setSelectedVehicles([]);
  };

  // Gérer la sélection pour comparaison
  const handleToggleVehicleSelection = (vehicleId: string) => {
    setSelectedVehicles((prev) => {
      if (prev.includes(vehicleId)) {
        return prev.filter((id) => id !== vehicleId);
      }
      if (prev.length >= 3) {
        showToast("Vous ne pouvez comparer que 3 véhicules maximum", "error");
        return prev;
      }
      return [...prev, vehicleId];
    });
  };

  // Ouvrir le modal de comparaison
  const handleCompare = () => {
    if (selectedVehicles.length < 2) {
      showToast("Sélectionnez au moins 2 véhicules à comparer", "error");
      return;
    }
    setIsComparisonModalOpen(true);
  };

  // Ouvrir le modal de sauvegarde
  const handleSaveSearch = () => {
    if (!user) {
      showToast("Vous devez être connecté pour sauvegarder une recherche", "error");
      router.push("/login?redirect=/search");
      return;
    }
    setIsSaveSearchModalOpen(true);
  };

  // Sauvegarder la recherche avec un nom
  const handleSaveSearchWithName = async (name: string) => {
    setIsSavingSearch(true);
    try {
      const result = await saveSearch(filters, searchQuery, name);
      if (result.success) {
        showToast("Recherche sauvegardée ! Vous serez notifié des nouveaux résultats.", "success");
        setIsSaveSearchModalOpen(false);
      } else {
        showToast(result.error || "Erreur lors de la sauvegarde", "error");
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      showToast("Erreur lors de la sauvegarde", "error");
    } finally {
      setIsSavingSearch(false);
    }
  };

  // Créer une alerte de recherche
  const handleCreateAlert = async () => {
    if (!user) {
      showToast("Vous devez être connecté pour créer une alerte", "error");
      router.push("/login?redirect=/search");
      return;
    }

    setIsCreatingAlert(true);
    try {
      // Préparer les critères de recherche
      const criteria: Record<string, any> = {
        ...filters,
        searchQuery: searchQuery || undefined,
      };

      const result = await createSearchAlert(criteria);
      if (result.success) {
        showToast("Alerte créée ! Vous serez notifié des nouvelles annonces correspondantes.", "success");
      } else {
        showToast(result.error || "Erreur lors de la création de l'alerte", "error");
      }
    } catch (error) {
      console.error("Erreur création alerte:", error);
      showToast("Erreur lors de la création de l'alerte", "error");
    } finally {
      setIsCreatingAlert(false);
    }
  };

  // Compter les filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.marque && filters.marque !== "Toutes les marques") count++;
    if (filters.modele) count++;
    if (filters.prixMin) count++;
    if (filters.prixMax) count++;
    if (filters.anneeMin) count++;
    if (filters.anneeMax) count++;
    if (filters.mileageMin) count++;
    if (filters.mileageMax) count++;
    if (filters.carburant) count++;
    if (filters.transmission.length > 0) count++;
    if (filters.carrosserie.length > 0) count++;
    if (filters.normeEuro) count++;
    if (filters.carPassOnly) count++;
    if (filters.city) count++;
    if (filters.postalCode) count++;
    if (filters.favoritesOnly) count++;
    // Filtres pour véhicules sportifs
    if (filters.drivetrain.length > 0) count++;
    if (filters.topSpeedMin) count++;
    if (filters.topSpeedMax) count++;
    // Nouveaux filtres techniques
    if (filters.architectureMoteur.length > 0) count++;
    if (filters.puissanceMin) count++;
    if (filters.puissanceMax) count++;
    if (searchQuery) count++;
    return count;
  }, [filters, searchQuery]);

  // Véhicules sélectionnés pour comparaison
  const selectedVehiclesData = useMemo(() => {
    return sortedVehicules.filter((v) => selectedVehicles.includes(v.id));
  }, [sortedVehicules, selectedVehicles]);

  // Vérifier si un véhicule est nouveau (ajouté dans les 7 derniers jours)
  const isNewVehicle = (vehicule: Vehicule) => {
    if (!vehicule.created_at) return false;
    const createdDate = new Date(vehicule.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdDate >= sevenDaysAgo;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header avec barre de recherche */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Recherche</h1>
          
          {/* Barre de recherche globale */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une marque, un modèle, une ville..."
              className="w-full pl-12 pr-4 py-4 bg-neutral-900 border border-neutral-800 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all text-lg"
            />
          </div>

          {/* Compteur et contrôles */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <p className="text-neutral-400">
                {sortedVehicules.length} résultat{sortedVehicules.length > 1 ? "s" : ""}
              </p>
              {/* Bouton Alerte */}
              {user ? (
                <button
                  onClick={handleCreateAlert}
                  disabled={isCreatingAlert}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Créer une alerte pour être notifié des nouvelles annonces correspondantes"
                >
                  <Bell size={18} className={isCreatingAlert ? "animate-pulse" : ""} />
                  {isCreatingAlert ? "Création..." : "🔔 M'alerter des nouveautés"}
                </button>
              ) : (
                <button
                  onClick={() => {
                    showToast("Vous devez être connecté pour créer une alerte", "error");
                    router.push("/login?redirect=/search");
                  }}
                  className="px-4 py-2 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 text-neutral-400 font-bold rounded-xl transition-all flex items-center gap-2"
                  title="Connectez-vous pour créer une alerte"
                >
                  <Bell size={18} />
                  🔔 M'alerter des nouveautés
                </button>
              )}
              {selectedVehicles.length > 0 && (
                <button
                  onClick={handleCompare}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  Comparer ({selectedVehicles.length})
                </button>
              )}
              {user && (
                <button
                  onClick={handleSaveSearch}
                  disabled={isSavingSearch}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSavingSearch ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle vue grille/liste */}
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-red-600 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-red-600 text-white"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <List size={18} />
                </button>
              </div>

              {/* Tri */}
              <div className="flex items-center gap-2">
                <ArrowUpDown size={18} className="text-neutral-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bouton filtres mobile */}
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full hover:border-red-600/50 transition-all"
              >
                <SlidersHorizontal size={20} />
                <span>Filtres</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* SIDEBAR FILTRES */}
          <aside
            className={`${
              isFiltersOpen ? "block" : "hidden"
            } lg:block w-full lg:w-80 flex-shrink-0`}
          >
            <div className="bg-neutral-900 rounded-3xl p-6 border border-neutral-800 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {/* Header sidebar */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black flex items-center gap-2">
                  <Filter size={20} className="text-red-600" />
                  Filtres
                </h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-sm text-red-500 hover:text-red-400 font-medium transition-colors"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>

              {/* Formulaire de filtres */}
              <div className="space-y-6">
                {/* Marque */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-neutral-300">Marque</label>
                  <select
                    value={filters.marque}
                    onChange={(e) => handleFilterChange("marque", e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                  >
                    {MARQUES.map((marque) => (
                      <option key={marque} value={marque === "Toutes les marques" ? "" : marque}>
                        {marque}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Modèle */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-neutral-300">Modèle</label>
                  <input
                    type="text"
                    value={filters.modele}
                    onChange={(e) => handleFilterChange("modele", e.target.value)}
                    placeholder="Rechercher un modèle..."
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                  />
                </div>

                {/* Prix */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-neutral-300">Prix</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={filters.prixMin}
                      onChange={(e) => handleFilterChange("prixMin", e.target.value)}
                      placeholder="Min"
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                    <input
                      type="number"
                      value={filters.prixMax}
                      onChange={(e) => handleFilterChange("prixMax", e.target.value)}
                      placeholder="Max"
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                </div>

                {/* Année */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-neutral-300">Année</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={filters.anneeMin}
                      onChange={(e) => handleFilterChange("anneeMin", e.target.value)}
                      placeholder="Min"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                    <input
                      type="number"
                      value={filters.anneeMax}
                      onChange={(e) => handleFilterChange("anneeMax", e.target.value)}
                      placeholder="Max"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                </div>

                {/* Kilométrage */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-neutral-300">
                    Kilométrage
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={filters.mileageMin}
                      onChange={(e) => handleFilterChange("mileageMin", e.target.value)}
                      placeholder="Min"
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                    <input
                      type="number"
                      value={filters.mileageMax}
                      onChange={(e) => handleFilterChange("mileageMax", e.target.value)}
                      placeholder="Max"
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleFilterChange("mileageMax", "50000")}
                      className="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                      &lt; 50k
                    </button>
                    <button
                      onClick={() => handleFilterChange("mileageMax", "100000")}
                      className="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                      &lt; 100k
                    </button>
                    <button
                      onClick={() => handleFilterChange("mileageMax", "150000")}
                      className="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                      &lt; 150k
                    </button>
                  </div>
                </div>

                {/* Carburant */}
                <div>
                  <label className="block text-sm font-bold mb-2 text-neutral-300">Carburant</label>
                  <select
                    value={filters.carburant}
                    onChange={(e) => handleFilterChange("carburant", e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                  >
                    {CARBURANTS.map((carb) => (
                      <option key={carb.value} value={carb.value}>
                        {carb.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500 mt-2">
                    ⚡ Pas d&apos;électrique ici, seulement du thermique pur.
                  </p>
                </div>

                {/* Filtres avancés (collapsible) */}
                <div>
                  <button
                    onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
                    className="w-full flex items-center justify-between text-sm font-bold text-neutral-300 hover:text-white transition-colors"
                  >
                    <span>Filtres avancés</span>
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${isAdvancedFiltersOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isAdvancedFiltersOpen && (
                    <div className="mt-4 space-y-4 pt-4 border-t border-neutral-800">
                      {/* Transmission */}
                      <div>
                        <label className="block text-sm font-bold mb-2 text-neutral-300">
                          Transmission
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {TRANSMISSIONS.map((trans) => (
                            <button
                              key={trans.value}
                              onClick={() => handleTransmissionToggle(trans.value)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                filters.transmission.includes(trans.value)
                                  ? "bg-red-600 text-white"
                                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                              }`}
                            >
                              {trans.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Carrosserie */}
                      <div>
                        <label className="block text-sm font-bold mb-2 text-neutral-300">
                          Carrosserie
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {CARROSSERIES.map((carrosserie) => (
                            <button
                              key={carrosserie}
                              onClick={() => handleCarrosserieToggle(carrosserie)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                filters.carrosserie.includes(carrosserie)
                                  ? "bg-red-600 text-white"
                                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                              }`}
                            >
                              {carrosserie}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Norme Euro */}
                      <div>
                        <label className="block text-sm font-bold mb-2 text-neutral-300">
                          Norme Euro
                        </label>
                        <select
                          value={filters.normeEuro}
                          onChange={(e) => handleFilterChange("normeEuro", e.target.value)}
                          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                        >
                          {NORME_EURO.map((norme) => (
                            <option key={norme.value} value={norme.value}>
                              {norme.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Car-Pass */}
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.carPassOnly}
                            onChange={(e) => handleFilterChange("carPassOnly", e.target.checked)}
                            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-red-600 focus:ring-red-600"
                          />
                          <span className="text-sm font-bold text-neutral-300">
                            Uniquement avec Car-Pass
                          </span>
                        </label>
                      </div>

                      {/* Localisation */}
                      <div>
                        <label className="block text-sm font-bold mb-2 text-neutral-300">
                          Ville
                        </label>
                        <input
                          type="text"
                          value={filters.city}
                          onChange={(e) => handleFilterChange("city", e.target.value)}
                          placeholder="Bruxelles, Anvers..."
                          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2 text-neutral-300">
                          Code postal
                        </label>
                        <input
                          type="text"
                          value={filters.postalCode}
                          onChange={(e) => handleFilterChange("postalCode", e.target.value)}
                          placeholder="1000, 2000..."
                          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                        />
                      </div>

                      {/* Filtre Favoris uniquement */}
                      {user && (
                        <div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.favoritesOnly}
                              onChange={(e) => handleFilterChange("favoritesOnly", e.target.checked)}
                              className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-red-600 focus:ring-red-600"
                            />
                            <span className="text-sm font-bold text-neutral-300 flex items-center gap-2">
                              <HeartIcon size={16} className="text-red-600" />
                              Afficher uniquement mes favoris
                            </span>
                          </label>
                        </div>
                      )}

                      {/* Section Véhicules Sportifs */}
                      <div className="pt-4 border-t border-neutral-800">
                        <h3 className="text-sm font-black text-red-600 mb-4 uppercase">
                          🏎️ Véhicules Sportifs
                        </h3>

                        {/* Transmission (Drivetrain) */}
                        <div className="mb-4">
                          <label className="block text-sm font-bold mb-2 text-neutral-300">
                            Transmission
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {DRIVETRAINS.map((dt) => (
                              <button
                                key={dt.value}
                                onClick={() => handleDrivetrainToggle(dt.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  filters.drivetrain.includes(dt.value)
                                    ? "bg-red-600 text-white"
                                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                                }`}
                              >
                                {dt.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Architecture Moteur */}
                        <div className="mb-4">
                          <label className="block text-sm font-bold mb-2 text-neutral-300">
                            Architecture Moteur
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {ENGINE_ARCHITECTURES.map((arch) => (
                              <button
                                key={arch.value}
                                onClick={() => handleArchitectureMoteurToggle(arch.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  filters.architectureMoteur.includes(arch.value)
                                    ? "bg-red-600 text-white"
                                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                                }`}
                                title={arch.subtitle}
                              >
                                {arch.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Puissance (ch) */}
                        <div className="mb-4">
                          <label className="block text-sm font-bold mb-2 text-neutral-300">
                            Puissance (ch)
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              value={filters.puissanceMin}
                              onChange={(e) => handleFilterChange("puissanceMin", e.target.value)}
                              placeholder="Min"
                              min="0"
                              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                            />
                            <input
                              type="number"
                              value={filters.puissanceMax}
                              onChange={(e) => handleFilterChange("puissanceMax", e.target.value)}
                              placeholder="Max"
                              min="0"
                              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                            />
                          </div>
                        </div>

                        {/* Vitesse max */}
                        <div className="mb-4">
                          <label className="block text-sm font-bold mb-2 text-neutral-300">
                            Vitesse max (km/h)
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              value={filters.topSpeedMin}
                              onChange={(e) => handleFilterChange("topSpeedMin", e.target.value)}
                              placeholder="Min"
                              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                            />
                            <input
                              type="number"
                              value={filters.topSpeedMax}
                              onChange={(e) => handleFilterChange("topSpeedMax", e.target.value)}
                              placeholder="Max"
                              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                            />
                          </div>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* CONTENU PRINCIPAL */}
          <main className="flex-1">
            {isLoading ? (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <Car
                    size={80}
                    className="mx-auto mb-6 text-neutral-700 opacity-50 animate-pulse"
                  />
                  <h2 className="text-3xl font-black mb-4 text-neutral-300">Chargement...</h2>
                  <p className="text-neutral-400 text-lg">Recherche des véhicules en cours...</p>
                </div>
              </div>
            ) : paginatedVehicules.length === 0 ? (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <Car size={80} className="mx-auto mb-6 text-neutral-700 opacity-50" />
                  <h2 className="text-3xl font-black mb-4 text-neutral-300">
                    Le moteur est froid...
                  </h2>
                  <p className="text-neutral-400 text-lg mb-8">
                    Aucune voiture ne correspond à vos critères de recherche. Essayez d'élargir vos filtres ou de modifier vos critères pour découvrir plus d'annonces.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={handleResetFilters}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all inline-flex items-center gap-2 shadow-xl hover:shadow-md hover:scale-105"
                    >
                      <X size={18} />
                      Réinitialiser les filtres
                    </button>
                    <Link
                      href="/search"
                      className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-full transition-all inline-flex items-center gap-2 border border-neutral-700"
                    >
                      Voir toutes les annonces
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Grille ou Liste */}
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "space-y-4"
                  }
                >
                  {paginatedVehicules.map((vehicule, index) => {
                    const isNew = isNewVehicle(vehicule);
                    const isFavorite = favorites.includes(vehicule.id);
                    const hasCarPass = vehicule.car_pass;

                    return (
                      <div
                        key={vehicule.id}
                        className={`relative transform transition-all duration-300 hover:scale-[1.02] ${
                          viewMode === "list" ? "flex gap-4 bg-neutral-900 rounded-2xl p-4" : ""
                        }`}
                      >
                        {/* Badges */}
                        <div className="relative">
                          <CarCard car={vehicule} priority={index < 3} />
                          <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
                            {isNew && (
                              <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <Sparkles size={12} />
                                Nouveau
                              </span>
                            )}
                            {hasCarPass && (
                              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <Tag size={12} />
                                Car-Pass
                              </span>
                            )}
                            {isFavorite && (
                              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                                Favori
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Checkbox pour comparaison - Déplacé en bas à gauche pour éviter le conflit avec le bouton favori */}
                        {user && (
                          <div className="absolute bottom-2 left-2 z-20">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleToggleVehicleSelection(vehicule.id);
                              }}
                              className={`p-2.5 rounded-lg backdrop-blur-sm transition-all shadow-lg border-2 ${
                                selectedVehicles.includes(vehicule.id)
                                  ? "bg-red-600 text-white border-red-400"
                                  : "bg-black/70 text-white hover:bg-black/90 border-white/20"
                              }`}
                              title={selectedVehicles.includes(vehicule.id) ? "Retirer de la comparaison" : "Ajouter à la comparaison"}
                            >
                              {selectedVehicles.includes(vehicule.id) ? (
                                <CheckSquare size={18} />
                              ) : (
                                <Square size={18} />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-600/50 transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center gap-2">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="text-neutral-500">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              currentPage === page
                                ? "bg-red-600 text-white"
                                : "bg-neutral-900 border border-neutral-800 hover:border-red-600/50"
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-red-600/50 transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>

        {/* Modal de comparaison */}
        <VehicleComparisonModal
          vehicles={selectedVehiclesData}
          isOpen={isComparisonModalOpen}
          onClose={() => {
            setIsComparisonModalOpen(false);
            setSelectedVehicles([]);
          }}
        />
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <div className="text-center">
            <Car size={48} className="mx-auto mb-4 text-neutral-700 animate-pulse" />
            <p className="text-neutral-400">Chargement...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
