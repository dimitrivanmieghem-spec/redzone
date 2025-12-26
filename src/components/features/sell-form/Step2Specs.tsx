"use client";

import { Check, AlertTriangle } from "lucide-react";
import {
  EXTERIOR_COLORS,
  INTERIOR_COLORS,
  CARROSSERIE_TYPES,
  EXTERIOR_COLOR_HEX,
  ENGINE_ARCHITECTURE_TYPES,
  ENGINE_ARCHITECTURE_LABELS,
  DRIVETRAIN_TYPES,
  DRIVETRAIN_LABELS,
  EURO_STANDARDS,
} from "@/lib/vehicleData";

interface Step2SpecsProps {
  formData: {
    prix: string;
    annee: string;
    km: string;
    transmission: string;
    puissance: string;
    cvFiscaux: string;
    co2: string;
    cylindree: string;
    moteur: string;
    architectureMoteur: string;
    description: string;
    carrosserie: string;
    couleurExterieure: string;
    couleurInterieure: string;
    nombrePlaces: string;
    co2Wltp: string;
    drivetrain: string;
    topSpeed: string;
    normeEuro: string;
  };
  onUpdate: (updates: Partial<Step2SpecsProps["formData"]>) => void;
  isManualModel: boolean;
  hasCo2Data: boolean;
  descriptionCheck: {
    hasError: boolean;
    detectedWords: string[];
  };
}

export default function Step2Specs({
  formData,
  onUpdate,
  isManualModel,
  hasCo2Data,
  descriptionCheck,
}: Step2SpecsProps) {
  return (
    <div className="space-y-8">
      {/* Section 2 : Caractéristiques & Configuration (Card) */}
      <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6 md:p-8">
        <h2 className="text-2xl font-black text-white mb-2 tracking-wide">
          Caractéristiques & Configuration
        </h2>
        <p className="text-slate-300 mb-6 font-light">Moteur, transmission et configuration esthétique</p>

        {/* Sous-Section A : Mécanique & Performance */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent flex-1" />
            <h3 className="text-lg font-bold text-red-500/90 tracking-wide">
              Mécanique & Performance
            </h3>
            <div className="h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent flex-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Prix */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Prix (€) *
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={formData.prix}
                onChange={(e) => onUpdate({ prix: e.target.value })}
                placeholder="Ex: 145000"
                className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-bold text-xl placeholder:text-slate-500"
              />
            </div>

            {/* Année */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Année *
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.annee}
                onChange={(e) => onUpdate({ annee: e.target.value })}
                placeholder="Ex: 2021"
                min="1950"
                max={new Date().getFullYear() + 1}
                className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
              />
            </div>

            {/* Kilométrage */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Kilométrage *
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.km}
                onChange={(e) => onUpdate({ km: e.target.value })}
                placeholder="Ex: 18000"
                min="0"
                className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
              />
            </div>

            {/* Puissance */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Puissance (ch) *
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.puissance}
                onChange={(e) => onUpdate({ puissance: e.target.value })}
                placeholder="Ex: 450"
                min="1"
                className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
              />
            </div>

            {/* CV Fiscaux */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Puissance Fiscale (CV) *
                <span className="text-xs font-normal text-slate-400 ml-2">(Pour taxe annuelle)</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.cvFiscaux}
                onChange={(e) => onUpdate({ cvFiscaux: e.target.value })}
                placeholder="Ex: 17"
                min="1"
                className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
              />
            </div>

            {/* CO2 - Affiché uniquement si les specs contiennent des données CO2 */}
            {hasCo2Data && (
              <div>
                <label className="block text-sm font-bold text-white mb-3">
                  Émissions CO2 (g/km) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={formData.co2}
                  onChange={(e) => onUpdate({ co2: e.target.value })}
                  placeholder="Ex: 233"
                  min="0"
                  className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
                />
              </div>
            )}

            {/* Norme Euro */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Norme Euro
              </label>
              <select
                value={formData.normeEuro || "euro6d"}
                onChange={(e) => onUpdate({ normeEuro: e.target.value })}
                className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium"
              >
                {EURO_STANDARDS.map((std) => (
                  <option key={std.value} value={std.value}>
                    {std.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cylindrée */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Cylindrée (cc) {isManualModel ? "*" : ""}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.cylindree}
                onChange={(e) => onUpdate({ cylindree: e.target.value })}
                placeholder="Ex: 3996"
                min="0"
                required={isManualModel}
                className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
              />
            </div>

            {/* Architecture Moteur */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Architecture Moteur {isManualModel ? "*" : "(Optionnel)"}
              </label>
              <div className="flex flex-wrap gap-3">
                {ENGINE_ARCHITECTURE_TYPES.map((value) => {
                  const arch = ENGINE_ARCHITECTURE_LABELS[value];
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onUpdate({ architectureMoteur: value, moteur: value })}
                      className={`px-6 py-3 min-h-[48px] rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                        formData.architectureMoteur === value
                          ? "bg-red-600 border-red-600 text-white font-bold shadow-lg shadow-red-600/30"
                          : "bg-slate-800/50 border-white/10 text-white hover:border-white/20 hover:shadow-md"
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-bold text-base">{arch.label}</div>
                        {arch.subtitle && (
                          <div className={`text-xs mt-0.5 ${
                            formData.architectureMoteur === value ? "text-red-100" : "text-slate-500"
                          }`}>
                            {arch.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              {isManualModel && !formData.architectureMoteur && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  ⚠️ Architecture moteur requise pour les modèles non listés
                </p>
              )}
            </div>
          </div>

          {/* Note de pré-remplissage */}
          {!isManualModel && formData.puissance && (
            <div className="mt-4 p-4 bg-green-900/20 border-2 border-green-600/40 rounded-xl">
              <p className="text-sm text-green-300 font-medium flex items-center gap-2">
                <Check size={16} className="text-green-500" />
                <span className="font-bold">Données constructeur pré-remplies automatiquement.</span> Vous pouvez les modifier si votre véhicule est différent (ex: Stage 1, préparation).
              </p>
            </div>
          )}

          {/* Transmission */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">
              Transmission *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { value: "manuelle", label: "Manuelle", emoji: "🎯" },
                { value: "automatique", label: "Automatique", emoji: "⚡" },
                { value: "sequentielle", label: "Séquentielle", emoji: "🏁" },
              ].map((trans) => (
                <button
                  key={trans.value}
                  type="button"
                  onClick={() => onUpdate({ transmission: trans.value })}
                  className={`p-4 rounded-2xl border-4 transition-all hover:scale-105 ${
                    formData.transmission === trans.value
                      ? "border-red-600 bg-red-900/20 shadow-lg"
                      : "border-white/10 hover:border-white/20 bg-slate-800/50"
                  }`}
                >
                  <span className="text-2xl mb-2 block">{trans.emoji}</span>
                  <p className="font-bold text-sm text-white">{trans.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Champs optionnels supplémentaires (affichés si pré-remplis depuis la base) */}
        {(formData.co2Wltp || formData.topSpeed || formData.drivetrain) && (
          <div className="mt-6 grid grid-cols-2 gap-6">
            {/* CO2 WLTP */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                CO2 WLTP (g/km) <span className="text-xs font-normal text-slate-400">(Pour Flandre)</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.co2Wltp}
                onChange={(e) => onUpdate({ co2Wltp: e.target.value })}
                placeholder="Ex: 245"
                min="0"
                className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
              />
            </div>

            {/* Vitesse max */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Vitesse max (km/h)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.topSpeed}
                onChange={(e) => onUpdate({ topSpeed: e.target.value })}
                placeholder="Ex: 320"
                min="0"
                className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
              />
            </div>

            {/* Transmission (RWD/FWD/AWD) */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Type de transmission
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DRIVETRAIN_TYPES.map((value) => {
                  const label = DRIVETRAIN_LABELS[value];
                  const subtitle = label.includes("Propulsion") ? "Propulsion" : label.includes("Traction") ? "Traction" : "4x4";
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onUpdate({ drivetrain: value })}
                      className={`px-4 py-3 rounded-xl border-2 transition-all text-center ${
                        formData.drivetrain === value
                          ? "bg-red-600 border-red-600 text-white font-bold"
                          : "bg-slate-800/50 border-white/10 text-white hover:border-white/20"
                      }`}
                    >
                      <div className="font-bold text-sm">{value}</div>
                      <div className="text-xs text-slate-400">{subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sous-Section B : Configuration Esthétique */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent flex-1" />
            <h3 className="text-lg font-bold text-red-500/90 tracking-wide">
              Configuration Esthétique
            </h3>
            <div className="h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent flex-1" />
          </div>

          {/* Type de Carrosserie */}
          <div>
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
            <button
              type="button"
              onClick={() => onUpdate({ carrosserie: "" })}
              className={`mt-3 text-xs px-4 py-2 rounded-lg transition-all ${
                formData.carrosserie
                  ? "text-red-600 hover:text-red-700 font-medium"
                  : "text-slate-400 cursor-not-allowed"
              }`}
            >
              {formData.carrosserie ? "✕ Réinitialiser" : ""}
            </button>
          </div>

          {/* Couleur Extérieure */}
          <div>
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
            <button
              type="button"
              onClick={() => onUpdate({ couleurExterieure: "" })}
              className={`mt-3 text-xs px-4 py-2 rounded-lg transition-all ${
                formData.couleurExterieure
                  ? "text-red-600 hover:text-red-700 font-medium"
                  : "text-slate-400 cursor-not-allowed"
              }`}
            >
              {formData.couleurExterieure ? "✕ Réinitialiser" : ""}
            </button>
          </div>

          {/* Couleur Intérieure */}
          <div>
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
            <button
              type="button"
              onClick={() => onUpdate({ couleurInterieure: "" })}
              className={`mt-3 text-xs px-4 py-2 rounded-lg transition-all ${
                formData.couleurInterieure
                  ? "text-red-600 hover:text-red-700 font-medium"
                  : "text-slate-400 cursor-not-allowed"
              }`}
            >
              {formData.couleurInterieure ? "✕ Réinitialiser" : ""}
            </button>
          </div>

          {/* Nombre de Places */}
          <div>
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
            <button
              type="button"
              onClick={() => onUpdate({ nombrePlaces: "" })}
              className={`mt-3 text-xs px-4 py-2 rounded-lg transition-all ${
                formData.nombrePlaces
                  ? "text-red-600 hover:text-red-700 font-medium"
                  : "text-slate-400 cursor-not-allowed"
              }`}
            >
              {formData.nombrePlaces ? "✕ Réinitialiser" : ""}
            </button>
          </div>
        </div>

        {/* L'Histoire du véhicule */}
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

          {/* Le Videur V2 - Alerte Inline */}
          {descriptionCheck.hasError && (
            <div className="mt-4 bg-red-900/10 border-2 border-red-600 rounded-2xl p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
                <div className="flex-1">
                  <p className="text-red-300 font-bold mb-2">
                    ⛔ Termes interdits détectés dans votre description
                  </p>
                  <p className="text-red-400 text-sm mb-3 font-light">
                    Octane98 est réservé à la vente pure de sportives essence. Merci de retirer ces termes :
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

