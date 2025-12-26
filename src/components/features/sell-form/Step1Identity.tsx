"use client";

import { useState, useEffect } from "react";
import { Car, Bike, Check, AlertTriangle } from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import { VehicleType } from "@/lib/supabase/modelSpecs";
import { checkVehicleModeration, getModerationMessage } from "@/lib/moderationUtils";
import { createClient } from "@/lib/supabase/client";

interface Step1IdentityProps {
  formData: {
    type: VehicleType | "";
    marque: string;
    modele: string;
    modeleManuel: string;
    carburant: string;
  };
  onUpdate: (updates: Partial<Step1IdentityProps["formData"]>) => void;
  onTypeChange: (type: VehicleType) => void;
  onMarqueChange: (marque: string) => void;
  marques: string[];
  modeles: string[];
  loadingBrands: boolean;
  loadingModels: boolean;
  errorBrands: string | null;
  errorModels: string | null;
  isManualModel: boolean;
  moderationCheck: {
    isAllowed: boolean;
    detectedWords: string[];
  };
  isEffectivelyBanned: boolean;
}

export default function Step1Identity({
  formData,
  onUpdate,
  onTypeChange,
  onMarqueChange,
  marques: marquesFromProps,
  modeles,
  loadingBrands: loadingBrandsFromProps,
  loadingModels,
  errorBrands: errorBrandsFromProps,
  errorModels,
  isManualModel,
  moderationCheck,
  isEffectivelyBanned,
}: Step1IdentityProps) {
  // État local pour le chargement des marques
  const [localMarques, setLocalMarques] = useState<string[]>([]);
  const [localLoadingBrands, setLocalLoadingBrands] = useState(false);
  const [localErrorBrands, setLocalErrorBrands] = useState<string | null>(null);

  // Utiliser les valeurs locales si disponibles, sinon les props
  const marques = localMarques.length > 0 ? localMarques : marquesFromProps;
  const loadingBrands = localLoadingBrands || loadingBrandsFromProps;
  const errorBrands = localErrorBrands || errorBrandsFromProps;

  // Charger les marques directement depuis Supabase
  useEffect(() => {
    if (!formData.type || isEffectivelyBanned) {
      setLocalMarques([]);
      setLocalErrorBrands(null);
      return;
    }

    let isMounted = true;

    const loadBrands = async () => {
      if (!isMounted) return;
      
      setLocalLoadingBrands(true);
      setLocalErrorBrands(null);

      try {
        const supabase = createClient();
        console.log(`🔍 [Step1Identity] Chargement des marques pour type: ${formData.type}`);

        // Ajouter un timeout pour chaque requête
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Timeout: La requête prend trop de temps (10s)"));
          }, 10000);
        });

        // Tentative 1 : Table 'brands' (si elle existe)
        let brandsData: string[] = [];
        let hasError = false;
        let errorDetails: any = null;

        try {
          const brandsQuery = supabase
            .from('brands')
            .select('name')
            .eq('type', formData.type)
            .order('name');

          const { data: brandsTableData, error: brandsError } = await Promise.race([
            brandsQuery,
            timeoutPromise
          ]);

          if (brandsError) {
            console.warn(`⚠️ [Step1Identity] Table 'brands' non disponible:`, brandsError);
            errorDetails = brandsError;
            hasError = true;
          } else if (brandsTableData && brandsTableData.length > 0) {
            brandsData = brandsTableData.map((item: any) => item.name).filter(Boolean);
            console.log(`✅ [Step1Identity] ${brandsData.length} marques chargées depuis table 'brands'`);
          }
        } catch (brandsTableError) {
          console.warn(`⚠️ [Step1Identity] Erreur accès table 'brands':`, brandsTableError);
          errorDetails = brandsTableError;
          hasError = true;
        }

        // Tentative 2 : Table 'model_specs_db' (fallback)
        if (brandsData.length === 0 && isMounted) {
          console.log(`🔄 [Step1Identity] Tentative avec table 'model_specs_db'...`);
          
          try {
            const modelSpecsQuery = supabase
              .from('model_specs_db')
              .select('marque')
              .eq('type', formData.type)
              .eq('is_active', true);

            const { data: modelSpecsData, error: modelSpecsError } = await Promise.race([
              modelSpecsQuery,
              timeoutPromise
            ]);

            if (modelSpecsError) {
              console.error(`❌ [Step1Identity] Erreur table 'model_specs_db':`, modelSpecsError);
              throw new Error(`Erreur réseau ou table inexistante: ${modelSpecsError.message}`);
            }

            if (modelSpecsData && modelSpecsData.length > 0) {
              // Extraire les marques uniques et trier
              const uniqueBrands = Array.from(
                new Set(modelSpecsData.map((item: any) => item.marque).filter(Boolean))
              ).sort() as string[];
              
              brandsData = uniqueBrands;
              console.log(`✅ [Step1Identity] ${brandsData.length} marques chargées depuis table 'model_specs_db'`);
            } else {
              console.warn(`⚠️ [Step1Identity] Aucune marque trouvée dans 'model_specs_db'`);
            }
          } catch (modelSpecsTableError: any) {
            console.error(`❌ [Step1Identity] Erreur accès table 'model_specs_db':`, modelSpecsTableError);
            errorDetails = modelSpecsTableError;
            hasError = true;
          }
        }

        // Gestion du résultat
        if (!isMounted) return;

        if (brandsData.length > 0) {
          setLocalMarques(brandsData);
          setLocalErrorBrands(null);
          console.log(`✅ [Step1Identity] Marques chargées avec succès:`, brandsData.slice(0, 5), '...');
        } else {
          const errorMessage = hasError && errorDetails
            ? `Impossible de charger les marques. ${errorDetails.message || 'Erreur inconnue'}`
            : "Impossible de charger les marques. Aucune donnée disponible.";
          
          setLocalErrorBrands(errorMessage);
          setLocalMarques([]);
          console.error(`❌ [Step1Identity] ${errorMessage}`, errorDetails);
        }
      } catch (error: any) {
        if (!isMounted) return;
        
        const errorMessage = error?.message || "Erreur lors du chargement des marques";
        console.error(`❌ [Step1Identity] Erreur générale:`, error);
        setLocalErrorBrands(errorMessage);
        setLocalMarques([]);
      } finally {
        if (isMounted) {
          setLocalLoadingBrands(false);
        }
      }
    };

    loadBrands();

    return () => {
      isMounted = false;
    };
  }, [formData.type, isEffectivelyBanned]);

  return (
    <div className="space-y-8">
      {/* Section 1 : L'Identité (Card) */}
      <div className="bg-neutral-800/50 rounded-2xl border border-white/10 p-6 md:p-8">
        <h2 className="text-2xl font-black text-white mb-2 tracking-wide">
          L&apos;Identité
        </h2>
        <p className="text-neutral-300 mb-6 font-light">Marque, modèle et essence</p>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onTypeChange("car")}
            className={`p-6 rounded-2xl border-4 transition-all hover:scale-105 ${
              formData.type === "car"
                ? "border-red-600 bg-red-900/20 shadow-xl shadow-red-600/20"
                : "border-neutral-700 hover:border-neutral-600 bg-neutral-800/50"
            }`}
          >
            <Car
              size={48}
              className={formData.type === "car" ? "text-red-500 mx-auto mb-3" : "text-neutral-400 mx-auto mb-3"}
            />
            <p className="font-black text-lg text-white">Voiture</p>
            {formData.type === "car" && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  <Check size={14} />
                  Sélectionné
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => onTypeChange("moto")}
            className={`p-6 rounded-2xl border-4 transition-all hover:scale-105 ${
              formData.type === "moto"
                ? "border-red-600 bg-red-900/20 shadow-xl shadow-red-600/20"
                : "border-neutral-700 hover:border-neutral-600 bg-neutral-800/50"
            }`}
          >
            <Bike
              size={48}
              className={formData.type === "moto" ? "text-red-500 mx-auto mb-3" : "text-neutral-400 mx-auto mb-3"}
            />
            <p className="font-black text-lg text-white">Moto</p>
            {formData.type === "moto" && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                  <Check size={14} />
                  Sélectionné
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {formData.type && (
        <>
          {/* Marque - SearchableSelect */}
          <div>
            <SearchableSelect
              value={formData.marque}
              onChange={onMarqueChange}
              options={marques}
              placeholder="Rechercher une marque..."
              label="Marque"
              loading={loadingBrands}
              error={errorBrands}
              disabled={isEffectivelyBanned || !formData.type}
              required
            />
          </div>

          {/* Modèle - SearchableSelect */}
          {formData.marque && (
            <div>
              <SearchableSelect
                value={formData.modele}
                onChange={(value) => onUpdate({ modele: value })}
                options={[...modeles, "__AUTRE__"]}
                placeholder="Rechercher un modèle..."
                label="Modèle"
                loading={loadingModels}
                error={errorModels}
                disabled={!formData.marque}
                required
              />
              {isManualModel && (
                <div className="mt-3 space-y-3">
                  <div className="p-4 bg-amber-900/20 border-2 border-amber-600/40 rounded-xl">
                    <p className="text-sm font-bold text-amber-300 mb-2">
                      ⚠️ Modèle non listé : Tous les champs techniques deviennent obligatoires.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
                      Nom du modèle *
                    </label>
                    <input
                      type="text"
                      value={formData.modeleManuel}
                      onChange={(e) => onUpdate({ modeleManuel: e.target.value })}
                      placeholder="Ex: 911 GT3 RS (992)"
                      className="w-full p-4 bg-neutral-800 border-2 border-amber-400 rounded-2xl focus:ring-4 focus:ring-amber-600/20 focus:border-amber-600 text-white font-medium"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Carburant */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">
              Carburant *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: "essence", label: "Essence", emoji: "⛽" },
                { value: "e85", label: "E85", emoji: "🌽" },
                { value: "lpg", label: "LPG", emoji: "🔥" },
              ].map((carb) => (
                <button
                  key={carb.value}
                  type="button"
                  onClick={() => onUpdate({ carburant: carb.value })}
                  className={`p-4 rounded-2xl border-4 transition-all hover:scale-105 ${
                    formData.carburant === carb.value
                      ? "border-red-600 bg-red-900/20 shadow-lg"
                      : "border-white/10 hover:border-white/20 bg-neutral-800/50"
                  }`}
                >
                  <span className="text-3xl mb-2 block">{carb.emoji}</span>
                  <p className="font-bold text-sm text-white">
                    {carb.label}
                  </p>
                </button>
              ))}
            </div>
            <p className="text-xs text-red-400 mt-3 font-bold bg-red-900/20 p-3 rounded-xl border-2 border-red-600/40">
              🏁 Octane98 est dédié aux sportives thermiques uniquement. Pas de Diesel, Hybride ou Électrique.
            </p>
          </div>

          {/* Alerte Modération */}
          {!moderationCheck.isAllowed && (
            <div className="bg-red-900/10 border-4 border-red-600 rounded-2xl p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={32} />
                <div>
                  <h3 className="text-xl font-black text-red-600 mb-2">
                    Le Videur a parlé 🛑
                  </h3>
                  <p className="text-red-800 mb-3">
                    {getModerationMessage(moderationCheck.detectedWords)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {moderationCheck.detectedWords.map((word) => (
                      <span
                        key={word}
                        className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase"
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

