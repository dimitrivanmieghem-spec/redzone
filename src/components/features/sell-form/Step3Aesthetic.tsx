"use client";

import { EXTERIOR_COLORS, INTERIOR_COLORS, CARROSSERIE_TYPES, EXTERIOR_COLOR_HEX } from "@/lib/vehicleData";
import { AlertTriangle } from "lucide-react";

interface Step3AestheticProps {
  formData: {
    carrosserie: string;
    couleurExterieure: string;
    couleurInterieure: string;
    nombrePlaces: string;
    description: string;
  };
  onUpdate: (updates: Partial<Step3AestheticProps["formData"]>) => void;
  descriptionCheck: {
    hasError: boolean;
    detectedWords: string[];
  };
}

export default function Step3Aesthetic({
  formData,
  onUpdate,
  descriptionCheck,
}: Step3AestheticProps) {
  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6 md:p-8">
        <h2 className="text-2xl font-black text-white mb-2 tracking-wide">
          Configuration Esthétique
        </h2>
        <p className="text-slate-300 mb-6 font-light">
          Carrosserie, couleurs et description
        </p>

        {/* Type de Carrosserie */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-white mb-3">
            Type de Carrosserie (Optionnel)
          </label>
          <div className="flex flex-wrap gap-3">
            {CARROSSERIE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onUpdate({ carrosserie: type })}
                className={`px-6 py-3 min-h-[48px] rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                  formData.carrosserie === type
                    ? "bg-red-600 border-red-600 text-white font-bold shadow-lg shadow-red-600/30"
                    : "bg-slate-800/50 border-white/10 text-white hover:border-white/20 hover:shadow-md"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          {formData.carrosserie && (
            <button
              type="button"
              onClick={() => onUpdate({ carrosserie: "" })}
              className="mt-3 text-xs px-4 py-2 text-red-600 hover:text-red-700 font-medium rounded-lg transition-all"
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>

        {/* Couleur Extérieure */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-white mb-3">
            Couleur Extérieure (Optionnel)
          </label>
          <div className="overflow-x-auto -mx-2 px-2 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-3 md:grid md:grid-cols-6 lg:grid-cols-8 md:gap-4 min-w-max md:min-w-0">
              {EXTERIOR_COLORS.map((color) => {
                const isSelected = formData.couleurExterieure === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onUpdate({ couleurExterieure: color })}
                    className="group relative flex flex-col items-center gap-2 flex-shrink-0"
                    title={color}
                  >
                    <div
                      className={`w-12 h-12 rounded-full border-4 transition-all duration-200 hover:scale-110 active:scale-95 ${
                        isSelected
                          ? "border-red-600 shadow-lg shadow-red-600/50 ring-4 ring-red-600/30 ring-offset-2 ring-offset-slate-800"
                          : "border-slate-300 hover:border-slate-400"
                      }`}
                      style={{
                        backgroundColor: EXTERIOR_COLOR_HEX[color],
                      }}
                    />
                    <span
                      className={`text-xs font-medium transition-colors text-center ${
                        isSelected ? "text-red-500 font-bold" : "text-slate-400"
                      }`}
                    >
                      {color}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {formData.couleurExterieure && (
            <button
              type="button"
              onClick={() => onUpdate({ couleurExterieure: "" })}
              className="mt-3 text-xs px-4 py-2 text-red-600 hover:text-red-700 font-medium rounded-lg transition-all"
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>

        {/* Couleur Intérieure */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-white mb-3">
            Couleur Intérieure (Optionnel)
          </label>
          <div className="flex flex-wrap gap-3">
            {INTERIOR_COLORS.map((couleur) => (
              <button
                key={couleur}
                type="button"
                onClick={() => onUpdate({ couleurInterieure: couleur })}
                className={`px-6 py-3 min-h-[48px] rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                  formData.couleurInterieure === couleur
                    ? "bg-red-600 border-red-600 text-white font-bold shadow-lg shadow-red-600/30 ring-2 ring-red-600/50 ring-offset-2 ring-offset-slate-800"
                    : "bg-slate-800/50 border-white/10 text-white hover:border-white/20 hover:shadow-md"
                }`}
              >
                {couleur}
              </button>
            ))}
          </div>
          {formData.couleurInterieure && (
            <button
              type="button"
              onClick={() => onUpdate({ couleurInterieure: "" })}
              className="mt-3 text-xs px-4 py-2 text-red-600 hover:text-red-700 font-medium rounded-lg transition-all"
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>

        {/* Nombre de Places */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-white mb-3">
            Nombre de Places (Optionnel)
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: "2", label: "2 places" },
              { value: "4", label: "4 places" },
              { value: "5", label: "5 places" },
              { value: "2+2", label: "2+2" },
            ].map((places) => (
              <button
                key={places.value}
                type="button"
                onClick={() => onUpdate({ nombrePlaces: places.value })}
                className={`px-6 py-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                  formData.nombrePlaces === places.value
                    ? "bg-red-600 border-red-600 text-white font-bold shadow-lg shadow-red-600/30"
                    : "bg-slate-800/50 border-white/10 text-white hover:border-white/20 hover:shadow-md"
                }`}
              >
                {places.label}
              </button>
            ))}
          </div>
          {formData.nombrePlaces && (
            <button
              type="button"
              onClick={() => onUpdate({ nombrePlaces: "" })}
              className="mt-3 text-xs px-4 py-2 text-red-600 hover:text-red-700 font-medium rounded-lg transition-all"
            >
              ✕ Réinitialiser
            </button>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-white mb-3 tracking-wide">
            L&apos;Histoire du véhicule *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={8}
            placeholder="Racontez l'histoire de ce véhicule : entretien, options, modifications (Stage 1, préparation...), édition limitée, garantie, historique... (Minimum 20 caractères)"
            className={`w-full p-4 bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 text-white font-light resize-none placeholder:text-slate-500 ${
              descriptionCheck.hasError
                ? "border-red-600 focus:border-red-600"
                : "focus:border-red-600"
            }`}
          />

          {/* Compteur de caractères */}
          <div className="flex items-center justify-between mt-2">
            <p
              className={`text-xs font-bold ${
                formData.description.length < 20
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {formData.description.length >= 20 ? (
                <>✓ {formData.description.length} caractères</>
              ) : (
                <>⚠️ {formData.description.length}/20 caractères minimum</>
              )}
            </p>
          </div>

          {/* Alerte Inline - Le Videur V2 */}
          {descriptionCheck.hasError && (
            <div className="mt-4 bg-red-900/10 border-2 border-red-600 rounded-2xl p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
                <div className="flex-1">
                  <p className="text-red-300 font-bold mb-2">
                    ⛔ Termes interdits détectés dans votre description
                  </p>
                  <p className="text-red-400 text-sm mb-3 font-light">
                    Octane98 est réservé à la vente pure de sportives essence.
                    Merci de retirer ces termes :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {descriptionCheck.detectedWords.map((word) => (
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
        </div>
      </div>
    </div>
  );
}

