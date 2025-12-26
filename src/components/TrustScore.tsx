"use client";

import { Shield, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Vehicule } from "@/lib/supabase/types";
import {
  calculateTrustScore,
  evaluateTrustScore,
  getTrustScoreBreakdown,
} from "@/lib/vehicleUtils";

interface TrustScoreProps {
  vehicule: Vehicule;
}

export default function TrustScore({ vehicule }: TrustScoreProps) {
  const [showDetails, setShowDetails] = useState(false);

  const score = calculateTrustScore(vehicule);
  const evaluation = evaluateTrustScore(score);
  const breakdown = getTrustScoreBreakdown(vehicule);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-8 shadow-2xl border-2 border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 ${evaluation.bgColor} rounded-2xl flex items-center justify-center`}>
          <Shield className={evaluation.color} size={32} />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            Score de Confiance Octane98
          </h3>
          <p className="text-xs text-slate-600">
            Basé sur la transparence et la qualité de l'annonce
          </p>
        </div>
      </div>

      {/* Score Principal */}
      <div className={`${evaluation.bgColor} border-2 ${evaluation.ringColor} rounded-2xl p-6 mb-4`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{evaluation.icon}</span>
            <div>
              <p className={`text-2xl font-black ${evaluation.color}`}>
                {score}/100
              </p>
              <p className={`text-sm font-bold ${evaluation.color}`}>
                {evaluation.label}
              </p>
            </div>
          </div>

          {/* Jauge Circulaire */}
          <div className="relative w-20 h-20">
            <svg className="transform -rotate-90 w-20 h-20">
              {/* Cercle de fond */}
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-200"
              />
              {/* Cercle de progression */}
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
                className={
                  score >= 80
                    ? "text-green-600"
                    : score >= 60
                    ? "text-blue-600"
                    : score >= 40
                    ? "text-orange-600"
                    : "text-red-600"
                }
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-slate-900">{score}%</span>
            </div>
          </div>
        </div>

        {/* Message d'évaluation */}
        <p className={`text-sm leading-relaxed ${evaluation.color}`}>
          {evaluation.message}
        </p>
      </div>

      {/* Bouton Détails */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between p-4 bg-white border-2 border-slate-300 rounded-2xl hover:border-slate-400 transition-all"
      >
        <span className="font-bold text-slate-900">
          {showDetails ? "Masquer" : "Voir"} le détail du score
        </span>
        {showDetails ? (
          <ChevronUp size={20} className="text-slate-600" />
        ) : (
          <ChevronDown size={20} className="text-slate-600" />
        )}
      </button>

      {/* Détail des Points */}
      {showDetails && (
        <div className="mt-4 space-y-3">
          {breakdown.map((item, index) => (
            <div
              key={index}
              className={`p-4 rounded-2xl border-2 ${
                item.achieved
                  ? "bg-green-50 border-green-600"
                  : "bg-slate-50 border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {item.achieved ? (
                    <Check size={20} className="text-green-600" />
                  ) : (
                    <X size={20} className="text-slate-400" />
                  )}
                  <span className="font-bold text-slate-900 text-sm">
                    {item.label}
                  </span>
                </div>
                <span
                  className={`font-black text-lg ${
                    item.achieved ? "text-green-600" : "text-slate-400"
                  }`}
                >
                  {item.value}/{item.max} pts
                </span>
              </div>

              {/* Barre de progression */}
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    item.achieved ? "bg-green-600" : "bg-slate-400"
                  }`}
                  style={{ width: `${(item.value / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="mt-4 p-4 bg-slate-900 text-white rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="font-black text-lg">SCORE TOTAL</span>
              <span className="font-black text-2xl">{score}/100</span>
            </div>
          </div>
        </div>
      )}

      {/* Info Supplémentaire */}
      <div className="mt-6 bg-blue-50/50 p-4 rounded-2xl border border-blue-200">
        <p className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-blue-700">💡 Comment ça marche ?</strong> Le Score de
          Confiance évalue la transparence de l'annonce. Plus le vendeur fournit d'informations
          (Car-Pass, carnet, photos, historique), plus le score est élevé et rassurant pour
          l'acheteur.
        </p>
      </div>
    </div>
  );
}

