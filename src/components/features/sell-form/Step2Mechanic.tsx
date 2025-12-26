"use client";

import { Check } from "lucide-react";
import {
  ENGINE_ARCHITECTURE_TYPES,
  ENGINE_ARCHITECTURE_LABELS,
  DRIVETRAIN_TYPES,
  DRIVETRAIN_LABELS,
  EURO_STANDARDS,
} from "@/lib/vehicleData";

interface Step2MechanicProps {
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
    co2Wltp: string;
    drivetrain: string;
    topSpeed: string;
    normeEuro: string;
  };
  onUpdate: (updates: Partial<Step2MechanicProps["formData"]>) => void;
  isManualModel: boolean;
  hasCo2Data: boolean;
}

export default function Step2Mechanic({
  formData,
  onUpdate,
  isManualModel,
  hasCo2Data,
}: Step2MechanicProps) {
  return (
    <div className="space-y-8">
      <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6 md:p-8">
        <h2 className="text-2xl font-black text-white mb-2 tracking-wide">
          Mécanique & Performance
        </h2>
        <p className="text-slate-300 mb-6 font-light">
          Moteur, transmission et spécifications techniques
        </p>

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
              <span className="text-xs font-normal text-slate-400 ml-2">
                (Pour taxe annuelle)
              </span>
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

          {/* CO2 WLTP */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">
              CO2 WLTP (g/km){" "}
              <span className="text-xs font-normal text-slate-400">
                (Pour Flandre)
              </span>
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
        </div>

        {/* Architecture Moteur */}
        <div className="mt-6">
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
                      <div
                        className={`text-xs mt-0.5 ${
                          formData.architectureMoteur === value
                            ? "text-red-100"
                            : "text-slate-500"
                        }`}
                      >
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

        {/* Transmission */}
        <div className="mt-6">
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

        {/* Drivetrain */}
        <div className="mt-6">
          <label className="block text-sm font-bold text-white mb-3">
            Type de transmission (Drivetrain)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DRIVETRAIN_TYPES.map((value) => {
              const label = DRIVETRAIN_LABELS[value];
              const subtitle = label.includes("Propulsion")
                ? "Propulsion"
                : label.includes("Traction")
                ? "Traction"
                : "4x4";
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

        {/* Note de pré-remplissage */}
        {!isManualModel && formData.puissance && (
          <div className="mt-6 p-4 bg-green-900/20 border-2 border-green-600/40 rounded-xl">
            <p className="text-sm text-green-300 font-medium flex items-center gap-2">
              <Check size={16} className="text-green-500" />
              <span className="font-bold">
                Données constructeur pré-remplies automatiquement.
              </span>{" "}
              Vous pouvez les modifier si votre véhicule est différent (ex: Stage 1, préparation).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

