"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, AlertCircle, Info, Award } from "lucide-react";

interface TaxCalculatorProps {
  puissanceKw?: number;
  puissanceCv?: number;
  cvFiscaux?: number; // Chevaux fiscaux (pour taxe annuelle)
  co2?: number;
  carburant?: string; // Optionnel (non utilisé dans les calculs mais utile pour l'affichage)
  annee: number;
}

export default function TaxCalculator({
  puissanceKw = 0,
  puissanceCv = 0,
  cvFiscaux = 0,
  co2 = 0,
  carburant = "essence",
  annee,
}: TaxCalculatorProps) {
  type Region = "wallonie" | "flandre";
  const [region, setRegion] = useState<Region>("wallonie");

  // Calcul de l'âge du véhicule
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - annee);
  const isAncetre = age >= 30; // Véhicule de collection (30+ ans)

  // ============================================
  // WALLONIE / BRUXELLES - Calcul Officiel 2025
  // ============================================

  // ============================================
  // PARTIE 1 : TAXE DE MISE EN CIRCULATION (TMC)
  // ============================================
  // La TMC est calculée en fonction de :
  // - La puissance en kW (pour le montant de base)
  // - L'âge du véhicule (dégressivité)
  // - Les émissions CO2 (éco-malus en Wallonie)
  // ⚠️ IMPORTANT : La TMC n'utilise PAS les CV fiscaux

  // 1. CALCUL TMC DE BASE (selon puissance en kW uniquement)
  let tmcBase = 0;

  if (puissanceKw <= 70) {
    tmcBase = 61.5;
  } else if (puissanceKw <= 85) {
    tmcBase = 123.0;
  } else if (puissanceKw <= 100) {
    tmcBase = 495.0;
  } else if (puissanceKw <= 110) {
    tmcBase = 867.0;
  } else if (puissanceKw <= 120) {
    tmcBase = 1239.0;
  } else if (puissanceKw <= 155) {
    tmcBase = 2478.0;
  } else {
    tmcBase = 4957.0;
  }

  // 2. APPLICATION DE LA DÉGRESSIVITÉ (Réduction selon l'âge)
  let tauxReduction = 100; // Pourcentage (100% = plein tarif)
  let tmcFinal = 0;
  let isForfait = false;

  if (age <= 1) {
    tauxReduction = 100;
    tmcFinal = tmcBase;
  } else if (age <= 2) {
    tauxReduction = 90;
    tmcFinal = tmcBase * 0.9;
  } else if (age <= 3) {
    tauxReduction = 80;
    tmcFinal = tmcBase * 0.8;
  } else if (age <= 4) {
    tauxReduction = 70;
    tmcFinal = tmcBase * 0.7;
  } else if (age <= 5) {
    tauxReduction = 60;
    tmcFinal = tmcBase * 0.6;
  } else if (age <= 6) {
    tauxReduction = 55;
    tmcFinal = tmcBase * 0.55;
  } else if (age <= 7) {
    tauxReduction = 50;
    tmcFinal = tmcBase * 0.5;
  } else if (age <= 8) {
    tauxReduction = 45;
    tmcFinal = tmcBase * 0.45;
  } else if (age <= 9) {
    tauxReduction = 40;
    tmcFinal = tmcBase * 0.4;
  } else if (age <= 10) {
    tauxReduction = 35;
    tmcFinal = tmcBase * 0.35;
  } else if (age <= 11) {
    tauxReduction = 30;
    tmcFinal = tmcBase * 0.3;
  } else if (age <= 12) {
    tauxReduction = 25;
    tmcFinal = tmcBase * 0.25;
  } else if (age <= 13) {
    tauxReduction = 20;
    tmcFinal = tmcBase * 0.2;
  } else if (age <= 14) {
    tauxReduction = 15;
    tmcFinal = tmcBase * 0.15;
  } else if (age <= 15) {
    tauxReduction = 10;
    tmcFinal = tmcBase * 0.1;
  } else {
    // Plus de 15 ans : Forfait minimum
    tauxReduction = 0;
    tmcFinal = 61.5;
    isForfait = true;
  }

  // 3. ÉCO-MALUS (Wallonie uniquement, sauf véhicules > 30 ans)
  let ecoMalus = 0;

  if (!isAncetre && region === "wallonie") {
    if (co2 >= 146 && co2 <= 155) {
      ecoMalus = 100;
    } else if (co2 >= 156 && co2 <= 165) {
      ecoMalus = 175;
    } else if (co2 >= 166 && co2 <= 175) {
      ecoMalus = 250;
    } else if (co2 >= 176 && co2 <= 185) {
      ecoMalus = 350;
    } else if (co2 >= 186 && co2 <= 195) {
      ecoMalus = 450;
    } else if (co2 >= 196 && co2 <= 205) {
      ecoMalus = 600;
    } else if (co2 >= 206 && co2 <= 215) {
      ecoMalus = 850;
    } else if (co2 >= 216 && co2 <= 225) {
      ecoMalus = 1200;
    } else if (co2 >= 226 && co2 <= 235) {
      ecoMalus = 1600;
    } else if (co2 >= 236 && co2 <= 245) {
      ecoMalus = 2000;
    } else if (co2 > 245) {
      ecoMalus = 2500;
    }
  }

  // ============================================
  // PARTIE 2 : TAXE DE CIRCULATION (ANNUELLE)
  // ============================================
  // La Taxe de Circulation est calculée EXCLUSIVEMENT en fonction des CV Fiscaux.
  // ⚠️ CRITIQUE : Les CV Fiscaux sont basés sur la CYLINDRÉE (en cm³), 
  // et NON sur la puissance DIN (kW ou CH).
  // 
  // Formule belge : CV Fiscaux = f(cylindrée, carburant, norme Euro)
  // Exemple : 2.0L essence = ~11 CV fiscaux (pas basé sur les 200 CH de puissance)
  //
  // ⚠️ INTERDIT : Ne jamais utiliser puissanceKw, puissanceCv ou une conversion
  // pour calculer la Taxe de Circulation. Utiliser UNIQUEMENT cvFiscaux.
  
  // Barème approximatif Wallonie/Bruxelles 2025
  let taxeCirculation = 0;
  const cvFiscauxNum = cvFiscaux || 0; // Utilisation EXCLUSIVE de cvFiscaux (basé sur cylindrée)
  
  if (cvFiscauxNum <= 4) {
    taxeCirculation = 100;
  } else if (cvFiscauxNum <= 6) {
    taxeCirculation = 200;
  } else if (cvFiscauxNum <= 8) {
    taxeCirculation = 300;
  } else if (cvFiscauxNum === 9) {
    taxeCirculation = 350;
  } else if (cvFiscauxNum === 10) {
    taxeCirculation = 400;
  } else if (cvFiscauxNum === 11) {
    taxeCirculation = 500;
  } else if (cvFiscauxNum === 12) {
    taxeCirculation = 600;
  } else if (cvFiscauxNum === 13) {
    taxeCirculation = 700;
  } else if (cvFiscauxNum === 14) {
    taxeCirculation = 850;
  } else if (cvFiscauxNum === 15) {
    taxeCirculation = 1000;
  } else if (cvFiscauxNum === 16) {
    taxeCirculation = 1200;
  } else if (cvFiscauxNum === 17) {
    taxeCirculation = 1400;
  } else if (cvFiscauxNum === 18) {
    taxeCirculation = 1600;
  } else if (cvFiscauxNum === 19) {
    taxeCirculation = 1800;
  } else if (cvFiscauxNum === 20) {
    taxeCirculation = 2000;
  } else {
    // 20+ CV : Calcul progressif
    taxeCirculation = 2000 + (cvFiscauxNum - 20) * 150;
  }

  // ============================================
  // RÉSUMÉ DES DEUX TAXES (SÉPARATION STRICTE)
  // ============================================
  // TMC (Taxe de Mise en Circulation) :
  //   - Utilise : puissanceKw, age, co2
  //   - Payée : Une seule fois à l'immatriculation
  //
  // Taxe de Circulation (Annuelle) :
  //   - Utilise : cvFiscaux UNIQUEMENT (basé sur cylindrée)
  //   - Payée : Chaque année tant que le véhicule est immatriculé
  //   - ⚠️ Ne dépend PAS de la puissance DIN (kW/CH)

  // 5. TOTAL À PAYER À L'ACHAT (TMC uniquement)
  const totalAchat = tmcFinal + ecoMalus;

  // 6. DÉTERMINATION DE LA COULEUR (Taxation)
  let taxColor = "text-green-600";
  let taxLabel = "Peu taxé";
  let taxIcon = <TrendingDown size={28} className="text-green-600" />;

  if (totalAchat > 2000) {
    taxColor = "text-red-600";
    taxLabel = "Fortement taxé";
    taxIcon = <TrendingUp size={28} className="text-red-600" />;
  } else if (totalAchat > 1000) {
    taxColor = "text-orange-600";
    taxLabel = "Moyennement taxé";
    taxIcon = <AlertCircle size={28} className="text-orange-600" />;
  }

  return (
    <div className={`bg-gradient-to-br ${
      region === "wallonie" 
        ? "from-blue-50 to-white border-blue-200" 
        : "from-slate-50 to-white border-slate-200"
    } rounded-3xl p-8 shadow-2xl border-2`}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-14 h-14 bg-gradient-to-br ${
          region === "wallonie"
            ? "from-blue-100 to-blue-200"
            : "bg-slate-200"
        } rounded-2xl flex items-center justify-center`}>
          {region === "wallonie" ? taxIcon : <AlertCircle className="text-slate-600" size={28} />}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
            Calculateur Fiscal Belge
          </h3>
          <p className="text-xs text-slate-600">
            {region === "wallonie" 
              ? "Estimation TMC (Taxe de Mise en Circulation) 2025"
              : "Système complexe (Formule Verte)"}
          </p>
        </div>
      </div>

      {/* Sélecteur Région - TOUJOURS VISIBLE */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-900 mb-3">
          Ma Région
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRegion("wallonie")}
            className={`p-4 rounded-2xl border-4 transition-all font-bold ${
              region === "wallonie"
                ? "border-blue-600 bg-blue-50 text-blue-900"
                : "border-slate-300 text-slate-700 hover:border-slate-400"
            }`}
          >
            🇧🇪 Wallonie / Bruxelles
          </button>
          <button
            type="button"
            onClick={() => setRegion("flandre")}
            className={`p-4 rounded-2xl border-4 transition-all font-bold ${
              region === "flandre"
                ? "border-blue-600 bg-blue-50 text-blue-900"
                : "border-slate-300 text-slate-700 hover:border-slate-400"
            }`}
          >
            🇧🇪 Flandre
          </button>
        </div>
      </div>

      {/* Contenu conditionnel selon la région */}
      {region === "wallonie" ? (
        <>
          {/* Informations sur le Véhicule */}
          <div className="bg-white rounded-2xl p-6 mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 font-medium">Puissance</span>
              <span className="text-sm font-black text-slate-900">
                {puissanceKw.toFixed(1)} kW ({puissanceCv} CH)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 font-medium">CV Fiscaux</span>
              <span className="text-sm font-black text-blue-600">
                {cvFiscauxNum} CV
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600 font-medium">Émissions CO2</span>
              <span className="text-sm font-black text-slate-900">{co2} g/km</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span className="text-sm text-slate-600 font-medium">Âge du véhicule</span>
              <span className="text-sm font-black text-blue-600">
                {age} {age === 1 ? "an" : "ans"}
                {isAncetre && " (Collection)"}
              </span>
            </div>
            {!isForfait && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600 font-medium">Taux de réduction</span>
                <span className="text-sm font-black text-green-600">
                  -{100 - tauxReduction}%
                </span>
              </div>
            )}
          </div>

          {/* Détail du Calcul */}
          <div className="space-y-3 mb-6">
            {/* TMC Base */}
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-blue-900 mb-1">TMC DE BASE</p>
                  {!isForfait && (
                    <p className="text-xs text-blue-700">
                      {tmcBase.toFixed(2)} € × {tauxReduction}%
                    </p>
                  )}
                  {isForfait && (
                    <div className="flex items-center gap-2 mt-1">
                      <Award size={16} className="text-green-600" />
                      <p className="text-xs font-bold text-green-700">TMC Minimum !</p>
                    </div>
                  )}
                </div>
                <p className="text-2xl font-black text-blue-900">
                  {tmcFinal.toFixed(2)} €
                </p>
              </div>
            </div>

            {/* Éco-Malus */}
            {ecoMalus > 0 && (
              <div className="bg-red-50 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-red-900 mb-1">ÉCO-MALUS</p>
                    <p className="text-xs text-red-700">CO2 &gt; 146 g/km</p>
                  </div>
                  <p className="text-2xl font-black text-red-900">
                    +{ecoMalus.toFixed(2)} €
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Total à Payer */}
          <div className={`bg-gradient-to-r ${
            totalAchat > 2000
              ? "from-red-100 to-red-50 border-red-600"
              : totalAchat > 1000
              ? "from-orange-100 to-orange-50 border-orange-600"
              : "from-green-100 to-green-50 border-green-600"
          } rounded-2xl p-6 border-4 mb-4`}>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold text-slate-900">COÛT MISE EN ROUTE</p>
              <p className={`text-xs font-bold ${taxColor}`}>{taxLabel}</p>
            </div>
            <p className={`text-4xl font-black ${taxColor}`}>
              {totalAchat.toFixed(2)} €
            </p>
            <p className="text-xs text-slate-600 mt-2">
              TMC + Éco-Malus (à payer une fois)
            </p>
          </div>

          {/* Taxe Annuelle */}
          <div className="bg-slate-100 rounded-2xl p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-900 mb-1">
                  TAXE DE CIRCULATION (Annuelle)
                </p>
                <p className="text-xs text-slate-600">
                  Basée sur {cvFiscauxNum} CV fiscaux (cylindrée)
                </p>
                <p className="text-xs text-slate-500 mt-1">À payer chaque année</p>
              </div>
              <p className="text-xl font-black text-slate-900">
                ~{taxeCirculation} €/an
              </p>
            </div>
          </div>

          {/* Info Complémentaire */}
          <div className="mt-6 bg-blue-50/50 p-4 rounded-2xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-blue-700">💡 Dégressivité appliquée :</strong> En
                  Belgique, la TMC diminue de 10% par an (max -90% après 15 ans). Les véhicules de
                  plus de 15 ans paient le forfait minimum de 61,50 €. Les véhicules de collection
                  (30+ ans) sont exemptés d'éco-malus.
                </p>
                <p className="text-xs text-slate-700 leading-relaxed mt-2">
                  <strong className="text-blue-700">📋 Séparation des taxes :</strong> La TMC utilise la puissance (kW) et l'âge. 
                  La Taxe de Circulation utilise uniquement les CV fiscaux (basés sur la cylindrée, pas la puissance DIN).
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Message Flandre */}
          <div className="bg-orange-50 border-2 border-orange-600 rounded-2xl p-6 mb-4">
            <p className="text-orange-900 font-bold mb-3">
              ⚠️ Calcul complexe en Flandre
            </p>
            <p className="text-sm text-orange-800 leading-relaxed">
              La Flandre utilise une "formule verte" complexe basée sur les émissions WLTP, la norme
              Euro, et d'autres critères. Pour une estimation précise, consultez{" "}
              <a
                href="https://belastingen.vlaanderen.be"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold"
              >
                le site officiel flamand
              </a>
              .
            </p>
            <p className="text-sm text-orange-800 mt-3">
              <strong>Âge du véhicule :</strong> {age} {age === 1 ? "an" : "ans"}
            </p>
          </div>

          {/* Info Complémentaire Flandre */}
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200">
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-blue-700">💡 Info :</strong> RedZone se concentre sur la
              Wallonie et Bruxelles pour des calculs précis. La Flandre nécessite des données WLTP
              spécifiques non disponibles dans cette version.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
