"use client";

import { SlidersHorizontal, X, Check } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useAllModelData } from "@/hooks/useModelData";
import { EXTERIOR_COLORS, INTERIOR_COLORS, CARROSSERIE_TYPES, EXTERIOR_COLOR_HEX } from "@/lib/vehicleData";

export interface FiltersState {
  marque: string;
  modele: string;
  prixMin: string;
  prixMax: string;
  anneeMin: string;
  anneeMax: string;
  kmMax: string;
  type: string[];
  carburants: string[];
  transmissions: string[];
  carrosseries: string[];
  normeEuro: string;
  carPassOnly: boolean;
  
  // FILTRES PASSIONNÉS (RedZone)
  architectures: string[];
  admissions: string[];
  couleurExterieure: string[];
  couleurInterieure: string[];
  nombrePlaces: string[];
}

interface SearchFiltersProps {
  filters: FiltersState;
  onFilterChange: (key: keyof FiltersState, value: string | string[] | boolean) => void;
  onReset: () => void;
  activeFiltersCount: number;
  onClose?: () => void;
}

export default function SearchFilters({
  filters,
  onFilterChange,
  onReset,
  activeFiltersCount,
  onClose,
}: SearchFiltersProps) {
  
  // Composant Tag/Pilule cliquable avec couleur personnalisable
  const renderTag = (active: boolean, onClick: () => void, children: React.ReactNode, color: "red" | "green" | "slate" = "red") => {
    const colorClasses = {
      red: active
        ? "bg-red-600 text-white shadow-lg hover:bg-red-700"
        : "bg-white text-slate-700 shadow-md hover:shadow-lg hover:border-red-600 border border-slate-200",
      green: active
        ? "bg-green-600 text-white shadow-lg hover:bg-green-700"
        : "bg-white text-slate-700 shadow-md hover:shadow-lg hover:border-green-600 border border-slate-200",
      slate: active
        ? "bg-slate-700 text-white shadow-lg hover:bg-slate-800"
        : "bg-white text-slate-700 shadow-md hover:shadow-lg hover:border-slate-700 border border-slate-200",
    };

    return (
      <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105 ${active ? "scale-105" : ""} ${colorClasses[color]}`}
      >
        <span className="flex items-center gap-2">
          {active && <Check size={14} />}
          {children}
        </span>
      </button>
    );
  };

  // Utiliser le hook robuste pour charger les marques et modèles
  const { brands: toutesMarques, loadingBrands: loadingMarques, loadModelsForBrand } = useAllModelData(true);
  const [modeles, setModeles] = useState<string[]>([]);
  const [loadingModeles, setLoadingModeles] = useState(false);

  // Charger les modèles quand la marque change
  useEffect(() => {
    if (!filters.marque) {
      setModeles([]);
      setLoadingModeles(false);
      return;
    }

    let isMounted = true;

    const loadModels = async () => {
      setLoadingModeles(true);
      try {
        const models = await loadModelsForBrand(filters.marque);
        if (isMounted) {
          setModeles(models);
        }
      } catch (error) {
        console.error('Erreur chargement modèles:', error);
        if (isMounted) {
          setModeles([]);
        }
      } finally {
        if (isMounted) {
          setLoadingModeles(false);
        }
      }
    };

    loadModels();

    return () => {
      isMounted = false;
    };
  }, [filters.marque, loadModelsForBrand]);

  const handleTagToggle = (key: keyof FiltersState, value: string) => {
    const currentValues = filters[key] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    onFilterChange(key, newValues);
  };

  const handleMarqueChange = (value: string) => {
    onFilterChange("marque", value);
    // Reset le modèle quand on change de marque
    if (filters.modele) {
      onFilterChange("modele", "");
    }
  };

  return (
    <div className="space-y-8 p-6 bg-white rounded-3xl shadow-2xl shadow-slate-200/50 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
          <SlidersHorizontal size={24} className="text-red-600" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center animate-pulse">
              {activeFiltersCount}
            </span>
          )}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Fermer les filtres"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Marque & Modèle */}
      <div className="space-y-4">
        <div>
          <label htmlFor="marque" className="block text-sm font-bold text-slate-900 mb-3">
            Marque
          </label>
          <select
            id="marque"
            value={filters.marque}
            onChange={(e) => handleMarqueChange(e.target.value)}
            className="w-full p-4 bg-white shadow-xl shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all placeholder:text-slate-900"
          >
            <option value="">Toutes les marques</option>
            {toutesMarques.map((marque) => (
              <option key={marque} value={marque}>
                {marque}
              </option>
            ))}
          </select>
        </div>

        {filters.marque && (
          <div>
            <label htmlFor="modele" className="block text-sm font-bold text-slate-900 mb-3">
              Modèle
            </label>
            {loadingModeles ? (
              <div className="w-full p-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                <span className="ml-3 text-sm text-slate-600 font-medium">Chargement des modèles...</span>
              </div>
            ) : modeles.length > 0 ? (
              <select
                id="modele"
                value={filters.modele}
                onChange={(e) => onFilterChange("modele", e.target.value)}
                className="w-full p-4 bg-white shadow-xl shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all placeholder:text-slate-900"
              >
                <option value="">Tous les modèles</option>
                {modeles.map((modele) => (
                  <option key={modele} value={modele}>
                    {modele}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                <p className="text-sm text-amber-800 font-medium">
                  Aucun modèle trouvé pour cette marque
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prix */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">Budget</label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Min"
            value={filters.prixMin}
            onChange={(e) => onFilterChange("prixMin", e.target.value)}
            className="w-full p-3 bg-white shadow-lg shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm placeholder:text-slate-900"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.prixMax}
            onChange={(e) => onFilterChange("prixMax", e.target.value)}
            className="w-full p-3 bg-white shadow-lg shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm placeholder:text-slate-900"
          />
        </div>
      </div>

      {/* Type de Véhicule - TAGS */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">Type de véhicule</label>
        <div className="flex flex-wrap gap-2">
          {renderTag(
            filters.type.includes("car"),
            () => handleTagToggle("type", "car"),
            "Voiture"
          )}
          {renderTag(
            filters.type.includes("moto"),
            () => handleTagToggle("type", "moto"),
            "Moto"
          )}
        </div>
      </div>

      {/* Carburant - THERMIQUES UNIQUEMENT */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">
          Carburant <span className="text-red-600 text-xs">(Thermiques uniquement)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "essence", label: "Essence" },
            { value: "e85", label: "E85 (Éthanol)" },
            { value: "lpg", label: "LPG (GPL)" },
          ].map(({ value, label }) => (
            <div key={value}>
              {renderTag(
                filters.carburants.includes(value),
                () => handleTagToggle("carburants", value),
                label
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 bg-red-50 p-2 rounded-lg">
          🏁 RedZone = Sportives thermiques uniquement
        </p>
      </div>

      {/* Transmission - TAGS */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">Transmission</label>
        <div className="flex flex-wrap gap-2">
          {renderTag(
            filters.transmissions.includes("manuelle"),
            () => handleTagToggle("transmissions", "manuelle"),
            "Manuelle"
          )}
          {renderTag(
            filters.transmissions.includes("automatique"),
            () => handleTagToggle("transmissions", "automatique"),
            "Automatique"
          )}
        </div>
      </div>

      {/* Carrosserie - TAGS (Étendu) */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">Type de Carrosserie</label>
        <div className="flex flex-wrap gap-2">
          {CARROSSERIE_TYPES.map((type) => (
            <div key={type}>
              {renderTag(
                filters.carrosseries.includes(type),
                () => handleTagToggle("carrosseries", type),
                type
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Architecture Moteur - TAGS */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">
          Architecture Moteur
        </label>
        <div className="flex flex-wrap gap-2">
          {["V8", "V6", "4 Cylindres", "Flat-6", "V12", "Moteur Rotatif", "L6", "V10"].map((arch) => (
            <div key={arch}>
              {renderTag(
                filters.architectures.includes(arch),
                () => handleTagToggle("architectures", arch),
                arch,
                "green"
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Suralimentation - TAGS */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">
          Suralimentation
        </label>
        <div className="flex flex-wrap gap-2">
          {["Atmosphérique", "Turbo", "Compresseur"].map((adm) => (
            <div key={adm}>
              {renderTag(
                filters.admissions.includes(adm),
                () => handleTagToggle("admissions", adm),
                adm,
                "green"
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Couleur Extérieure - PASTILLES */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">
          Couleur Extérieure
        </label>
        <div className="flex flex-wrap gap-3">
          {EXTERIOR_COLORS.map((color) => {
            const isSelected = filters.couleurExterieure?.includes(color) || false;
            return (
              <button
                key={color}
                type="button"
                onClick={() => handleTagToggle("couleurExterieure", color)}
                className="group relative flex flex-col items-center gap-1.5"
                title={color}
              >
                <div
                  className={`w-10 h-10 rounded-full border-4 transition-all duration-200 hover:scale-110 active:scale-95 ${
                    isSelected
                      ? "border-red-600 shadow-lg shadow-red-600/40 ring-4 ring-red-600/20"
                      : "border-slate-300 hover:border-slate-400"
                  }`}
                  style={{
                    backgroundColor: EXTERIOR_COLOR_HEX[color],
                  }}
                />
                <span
                  className={`text-xs font-medium transition-colors ${
                    isSelected ? "text-red-600 font-bold" : "text-slate-600"
                  }`}
                >
                  {color.length > 8 ? color.substring(0, 8) + "..." : color}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Couleur Intérieure - TAGS */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">
          Couleur Intérieure
        </label>
        <div className="flex flex-wrap gap-2">
          {INTERIOR_COLORS.map((couleur) => (
            <div key={couleur}>
              {renderTag(
                filters.couleurInterieure.includes(couleur),
                () => handleTagToggle("couleurInterieure", couleur),
                couleur,
                "slate"
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Nombre de Places - TAGS */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">
          Nombre de Places
        </label>
        <div className="flex flex-wrap gap-2">
          {["2", "4", "5"].map((places) => (
            <div key={places}>
              {renderTag(
                filters.nombrePlaces.includes(places),
                () => handleTagToggle("nombrePlaces", places),
                `${places} places`,
                "slate"
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Année */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">Année</label>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={filters.anneeMin}
            onChange={(e) => onFilterChange("anneeMin", e.target.value)}
            className="w-full p-3 bg-white shadow-lg shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm placeholder:text-slate-900"
          >
            <option value="">Min</option>
            {Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={filters.anneeMax}
            onChange={(e) => onFilterChange("anneeMax", e.target.value)}
            className="w-full p-3 bg-white shadow-lg shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all text-sm placeholder:text-slate-900"
          >
            <option value="">Max</option>
            {Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kilométrage */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-slate-900">Kilométrage Max</label>
        <select
          value={filters.kmMax}
          onChange={(e) => onFilterChange("kmMax", e.target.value)}
          className="w-full p-4 bg-white shadow-xl shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all placeholder:text-slate-900"
        >
          <option value="">Tous</option>
          <option value="50000">{"< 50 000 km"}</option>
          <option value="100000">{"< 100 000 km"}</option>
          <option value="150000">{"< 150 000 km"}</option>
          <option value="200000">{"< 200 000 km"}</option>
        </select>
      </div>

      {/* Car-Pass - Toggle Switch Moderne */}
      <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl">
        <label htmlFor="carPass" className="text-sm font-bold text-slate-900">
          Uniquement Car-Pass
        </label>
        <button
          type="button"
          onClick={() => onFilterChange("carPassOnly", !filters.carPassOnly)}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
            filters.carPassOnly ? "bg-green-500" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
              filters.carPassOnly ? "translate-x-6" : ""
            }`}
          />
        </button>
      </div>

      {/* Bouton Réinitialiser */}
      <button
        type="button"
        onClick={onReset}
        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-2xl transition-all hover:scale-105"
      >
        Réinitialiser
      </button>
    </div>
  );
}
