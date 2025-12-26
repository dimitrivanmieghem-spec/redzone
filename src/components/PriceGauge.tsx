"use client";

import { TrendingDown, TrendingUp, Minus, BarChart3 } from "lucide-react";
import { PriceAnalysis } from "@/lib/priceUtils";
import { formatPrice } from "@/lib/priceUtils";

interface PriceGaugeProps {
  analysis: PriceAnalysis;
  currentPrice: number;
  analysisText: string;
}

export default function PriceGauge({ analysis, currentPrice, analysisText }: PriceGaugeProps) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-8 shadow-2xl border-2 border-slate-200">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
          <BarChart3 className="text-slate-700" size={28} />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            Analyse de Prix Intelligente
          </h3>
          <p className="text-xs text-slate-600">
            Basée sur {analysis.sampleSize} véhicules similaires sur Octane98
          </p>
        </div>
      </div>

      {/* Label Principal */}
      <div className={`${analysis.colorBg} border-2 ${
        analysis.label === "Super Affaire" ? "border-green-300" :
        analysis.label === "Prix Élevé" ? "border-orange-300" :
        "border-blue-300"
      } rounded-2xl p-6 mb-6`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {analysis.label === "Super Affaire" && (
              <>
                <TrendingDown className="text-green-600" size={32} />
                <span className="text-2xl font-black text-green-700">
                  Super Affaire !
                </span>
              </>
            )}
            {analysis.label === "Prix Élevé" && (
              <>
                <TrendingUp className="text-orange-600" size={32} />
                <span className="text-2xl font-black text-orange-700">
                  Prix Élevé
                </span>
              </>
            )}
            {analysis.label === "Prix Correct" && (
              <>
                <Minus className="text-blue-600" size={32} />
                <span className="text-2xl font-black text-blue-700">
                  Prix Correct
                </span>
              </>
            )}
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black ${analysis.color}`}>
              {analysis.percentageDiff >= 0 ? "+" : ""}
              {analysis.percentageDiff.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-600 font-bold mt-1">
              vs marché
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          {analysisText}
        </p>
      </div>

      {/* Jauge Visuelle */}
      <div className="space-y-4">
        <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
          <span>MIN</span>
          <span>MARCHÉ</span>
          <span>MAX</span>
        </div>

        {/* Barre de progression */}
        <div className="relative h-12 bg-gradient-to-r from-green-100 via-blue-100 to-orange-100 rounded-full overflow-hidden shadow-inner">
          {/* Marqueur MIN */}
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600" />
          
          {/* Marqueur MOYENNE */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-blue-600" />
          
          {/* Marqueur MAX */}
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-orange-600" />

          {/* Curseur Position Actuelle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
            style={{ left: `${analysis.position}%` }}
          >
            <div className="relative">
              {/* Flèche vers le bas */}
              <div className="w-6 h-6 bg-red-600 rotate-45 -mb-3 shadow-lg border-2 border-white" />
              {/* Prix actuel */}
              <div className="bg-red-600 text-white font-black text-xs px-3 py-2 rounded-full shadow-2xl whitespace-nowrap">
                {formatPrice(currentPrice)}
              </div>
            </div>
          </div>
        </div>

        {/* Légendes */}
        <div className="flex justify-between text-xs">
          <div className="text-center">
            <p className="font-bold text-green-700">{formatPrice(analysis.minPrice)}</p>
            <p className="text-slate-600">Prix min</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-blue-700">{formatPrice(analysis.averagePrice)}</p>
            <p className="text-slate-600">Moyenne</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-orange-700">{formatPrice(analysis.maxPrice)}</p>
            <p className="text-slate-600">Prix max</p>
          </div>
        </div>
      </div>

      {/* Statistiques Détaillées */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200">
          <p className="text-xs text-slate-600 font-bold mb-1">ÉCART</p>
          <p className={`text-xl font-black ${
            analysis.difference < 0 ? "text-green-600" : "text-orange-600"
          }`}>
            {analysis.difference >= 0 ? "+" : ""}
            {analysis.difference.toLocaleString("fr-BE")} €
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200">
          <p className="text-xs text-slate-600 font-bold mb-1">ÉCHANTILLON</p>
          <p className="text-xl font-black text-slate-900">
            {analysis.sampleSize} véhicules
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200">
          <p className="text-xs text-slate-600 font-bold mb-1">POSITION</p>
          <p className="text-xl font-black text-blue-600">
            {Math.round(analysis.position)}%
          </p>
        </div>
      </div>

      {/* Note explicative */}
      <div className="mt-6 bg-blue-50/50 p-4 rounded-2xl border border-blue-200">
        <p className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-blue-700">💡 Comment ça marche ?</strong> Notre algorithme compare ce véhicule 
          à {analysis.sampleSize} autres {analysis.sampleSize > 1 ? "véhicules identiques" : "véhicule identique"} actuellement 
          en vente sur Octane98 pour vous donner une estimation objective du prix.
        </p>
      </div>
    </div>
  );
}

