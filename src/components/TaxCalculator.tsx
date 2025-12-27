"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, AlertCircle, Info, Award } from "lucide-react";

interface TaxCalculatorProps {
  puissanceKw?: number;
  puissanceCv?: number;
  cvFiscaux?: number; // Chevaux fiscaux (pour taxe annuelle)
  co2?: number; // CO2 NEDC (pour Wallonie)
  co2Wltp?: number; // CO2 WLTP (pour Flandre) - PRIORITAIRE si disponible
  carburant?: string; // Optionnel (non utilisé dans les calculs mais utile pour l'affichage)
  annee?: number; // Optionnel car le composant peut gérer sa propre valeur par défaut
  firstRegistrationDate?: string; // Date de première immatriculation (plus précis que year)
  isHybrid?: boolean; // Véhicule hybride (réduction Flandre)
  isElectric?: boolean; // Véhicule électrique (exemption Flandre)
}

export default function TaxCalculator({
  puissanceKw = 0,
  puissanceCv = 0,
  cvFiscaux = 0,
  co2 = 0,
  co2Wltp,
  carburant = "essence",
  annee,
  firstRegistrationDate,
  isHybrid = false,
  isElectric = false,
}: TaxCalculatorProps) {
  // État interne auto-géré pour les inputs utilisateur
  const [formData, setFormData] = useState({
    puissanceKw: 0,
    co2: 0,
    cvFiscaux: 0,
    annee: new Date().getFullYear(),
    carburant: "essence" as string
  });

  // Gestionnaire de changement pour les inputs
  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  type Region = "wallonie" | "flandre";
  const [region, setRegion] = useState<Region>("wallonie");

  // Calcul de l'âge du véhicule (utiliser firstRegistrationDate si disponible, sinon annee prop ou formData)
  const currentYear = new Date().getFullYear();
  const registrationYear = firstRegistrationDate
    ? new Date(firstRegistrationDate).getFullYear()
    : (annee || formData.annee);
  const age = Math.max(0, currentYear - registrationYear);
  const isAncetre = age >= 30; // Véhicule de collection (30+ ans)

  // Utiliser CO2 WLTP pour Flandre si disponible, sinon CO2 NEDC (prop ou formData)
  const co2ForFlandre = co2Wltp || (co2 || formData.co2);

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

  if ((puissanceKw || formData.puissanceKw) <= 70) {
    tmcBase = 61.5;
  } else if ((puissanceKw || formData.puissanceKw) <= 85) {
    tmcBase = 123.0;
  } else if ((puissanceKw || formData.puissanceKw) <= 100) {
    tmcBase = 495.0;
  } else if ((puissanceKw || formData.puissanceKw) <= 110) {
    tmcBase = 867.0;
  } else if ((puissanceKw || formData.puissanceKw) <= 120) {
    tmcBase = 1239.0;
  } else if ((puissanceKw || formData.puissanceKw) <= 155) {
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
  // Utiliser CO2 NEDC pour Wallonie (co2), CO2 WLTP pour Flandre (co2Wltp)
  let ecoMalus = 0;
  const co2ForWallonie = co2 || formData.co2; // Wallonie utilise NEDC

  if (!isAncetre && region === "wallonie") {
    if (co2ForWallonie >= 146 && co2ForWallonie <= 155) {
      ecoMalus = 100;
    } else if (co2ForWallonie >= 156 && co2ForWallonie <= 165) {
      ecoMalus = 175;
    } else if (co2ForWallonie >= 166 && co2ForWallonie <= 175) {
      ecoMalus = 250;
    } else if (co2ForWallonie >= 176 && co2ForWallonie <= 185) {
      ecoMalus = 350;
    } else if (co2ForWallonie >= 186 && co2ForWallonie <= 195) {
      ecoMalus = 450;
    } else if (co2ForWallonie >= 196 && co2ForWallonie <= 205) {
      ecoMalus = 600;
    } else if (co2ForWallonie >= 206 && co2ForWallonie <= 215) {
      ecoMalus = 850;
    } else if (co2ForWallonie >= 216 && co2ForWallonie <= 225) {
      ecoMalus = 1200;
    } else if (co2ForWallonie >= 226 && co2ForWallonie <= 235) {
      ecoMalus = 1600;
    } else if (co2ForWallonie >= 236 && co2ForWallonie <= 245) {
      ecoMalus = 2000;
    } else if (co2ForWallonie > 245) {
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
  const cvFiscauxNum = cvFiscaux || formData.cvFiscaux || 0; // Utilisation EXCLUSIVE de cvFiscaux (basé sur cylindrée)
  
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
    <div className={`bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/10`}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-14 h-14 bg-gradient-to-br ${
          region === "wallonie"
            ? "from-blue-900/30 to-blue-800/30"
            : "bg-slate-800"
        } rounded-2xl flex items-center justify-center border border-white/10`}>
          {region === "wallonie" ? taxIcon : <AlertCircle className="text-slate-400" size={28} />}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-black text-white tracking-tight mb-1">
            Calculateur Fiscal Belge
          </h3>
          <p className="text-xs text-slate-400">
            {region === "wallonie" 
              ? "Estimation TMC (Taxe de Mise en Circulation) 2025"
              : "Système complexe (Formule Verte)"}
          </p>
        </div>
      </div>

      {/* Sélecteur Région - TOUJOURS VISIBLE */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-white mb-3">
          Ma Région
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setRegion("wallonie")}
            className={`p-4 rounded-2xl border-4 transition-all font-bold ${
              region === "wallonie"
                ? "border-blue-500 bg-blue-900/30 text-blue-300"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
            }`}
          >
            🇧🇪 Wallonie / Bruxelles
          </button>
          <button
            type="button"
            onClick={() => setRegion("flandre")}
            className={`p-4 rounded-2xl border-4 transition-all font-bold ${
              region === "flandre"
                ? "border-blue-500 bg-blue-900/30 text-blue-300"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
            }`}
          >
            🇧🇪 Flandre
          </button>
        </div>
      </div>

      {/* Formulaire d'entrée - Design Pro */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10">
        <h4 className="text-lg font-bold text-white mb-4">Paramètres du véhicule</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Puissance (kW) */}
          <div>
            <label htmlFor="calc-puissance" className="block text-sm font-bold text-white mb-3">
              Puissance (kW)
            </label>
            <input
              type="number"
              id="calc-puissance"
              min="0"
              step="0.1"
              value={formData.puissanceKw || ""}
              onChange={(e) => handleInputChange("puissanceKw", parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-600 bg-slate-800 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-white font-medium placeholder:text-slate-400"
              placeholder="Ex: 150"
            />
            <p className="text-xs text-slate-400 mt-2">
              Puissance électrique ou thermique en kilowatts
            </p>
          </div>

          {/* CO2 */}
          <div>
            <label htmlFor="calc-co2" className="block text-sm font-bold text-white mb-3">
              Émissions CO₂ (g/km)
            </label>
            <input
              type="number"
              id="calc-co2"
              min="0"
              step="1"
              value={formData.co2 || ""}
              onChange={(e) => handleInputChange("co2", parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-600 bg-slate-800 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-white font-medium placeholder:text-slate-400"
              placeholder="Ex: 150"
            />
            <p className="text-xs text-slate-400 mt-2">
              Valeur NEDC (cycle normalisé européen)
            </p>
          </div>

          {/* CV Fiscaux */}
          <div>
            <label htmlFor="calc-cv" className="block text-sm font-bold text-white mb-3">
              Chevaux Fiscaux (CV)
            </label>
            <input
              type="number"
              id="calc-cv"
              min="0"
              step="1"
              value={formData.cvFiscaux || ""}
              onChange={(e) => handleInputChange("cvFiscaux", parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-600 bg-slate-800 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-white font-medium placeholder:text-slate-400"
              placeholder="Ex: 11"
            />
            <p className="text-xs text-slate-400 mt-2">
              ⚠️ <strong>Important :</strong> Basé sur la cylindrée (cm³), pas sur la puissance
            </p>
          </div>

          {/* Année */}
          <div>
            <label htmlFor="calc-annee" className="block text-sm font-bold text-white mb-3">
              Année du véhicule
            </label>
            <input
              type="number"
              id="calc-annee"
              min="1900"
              max={new Date().getFullYear() + 1}
              value={formData.annee}
              onChange={(e) => handleInputChange("annee", parseInt(e.target.value) || new Date().getFullYear())}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-600 bg-slate-800 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-white font-medium"
              placeholder="2020"
            />
            <p className="text-xs text-slate-400 mt-2">
              Année de première immatriculation
            </p>
          </div>
        </div>
      </div>

      {/* Contenu conditionnel selon la région */}
      {region === "wallonie" ? (
        <>
          {/* Informations sur le Véhicule */}
          <div className="bg-slate-800 rounded-2xl p-6 mb-6 space-y-3 border border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400 font-medium">Puissance</span>
              <span className="text-sm font-black text-white">
                {(puissanceKw || formData.puissanceKw).toFixed(1)} kW ({Math.round((puissanceKw || formData.puissanceKw) * 1.3596)} CH)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400 font-medium">CV Fiscaux</span>
              <span className="text-sm font-black text-blue-400">
                {cvFiscauxNum} CV
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400 font-medium">Émissions CO2</span>
              <span className="text-sm font-black text-white">{(co2 || formData.co2)} g/km</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-700 pt-3">
              <span className="text-sm text-slate-400 font-medium">Âge du véhicule</span>
              <span className="text-sm font-black text-blue-400">
                {age} {age === 1 ? "an" : "ans"}
                {isAncetre && " (Collection)"}
              </span>
            </div>
            {!isForfait && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400 font-medium">Taux de réduction</span>
                <span className="text-sm font-black text-green-400">
                  -{100 - tauxReduction}%
                </span>
              </div>
            )}
          </div>

          {/* Détail du Calcul */}
          <div className="space-y-3 mb-6">
            {/* TMC Base */}
            <div className="bg-blue-900/20 rounded-2xl p-4 border border-blue-500/30">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-blue-300 mb-1">TMC DE BASE</p>
                  {!isForfait && (
                    <p className="text-xs text-blue-400">
                      {tmcBase.toFixed(2)} € × {tauxReduction}%
                    </p>
                  )}
                  {isForfait && (
                    <div className="flex items-center gap-2 mt-1">
                      <Award size={16} className="text-green-400" />
                      <p className="text-xs font-bold text-green-400">TMC Minimum !</p>
                    </div>
                  )}
                </div>
                <p className="text-2xl font-black text-blue-300">
                  {tmcFinal.toFixed(2)} €
                </p>
              </div>
            </div>

            {/* Éco-Malus */}
            {ecoMalus > 0 && (
              <div className="bg-red-900/20 rounded-2xl p-4 border border-red-500/30">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-red-300 mb-1">ÉCO-MALUS</p>
                    <p className="text-xs text-red-400">CO2 &gt; 146 g/km</p>
                  </div>
                  <p className="text-2xl font-black text-red-300">
                    +{ecoMalus.toFixed(2)} €
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Total à Payer */}
          <div className={`bg-gradient-to-r rounded-2xl p-6 border-4 mb-4 ${
            totalAchat > 2000
              ? "from-red-900/30 to-red-800/30 border-red-500"
              : totalAchat > 1000
              ? "from-orange-900/30 to-orange-800/30 border-orange-500"
              : "from-green-900/30 to-green-800/30 border-green-500"
          }`}>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold text-white">COÛT MISE EN ROUTE</p>
              <p className={`text-xs font-bold ${taxColor}`}>{taxLabel}</p>
            </div>
            <p className={`text-4xl font-black ${
              totalAchat > 2000 ? "text-red-400" : totalAchat > 1000 ? "text-orange-400" : "text-green-400"
            }`}>
              {totalAchat.toFixed(2)} €
            </p>
            <p className="text-xs text-slate-400 mt-2">
              TMC + Éco-Malus (à payer une fois)
            </p>
          </div>

          {/* Taxe Annuelle */}
          <div className="bg-slate-800 rounded-2xl p-4 border border-white/10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-white mb-1">
                  TAXE DE CIRCULATION (Annuelle)
                </p>
                <p className="text-xs text-slate-400">
                  Basée sur {cvFiscauxNum} CV fiscaux (cylindrée)
                </p>
                <p className="text-xs text-slate-500 mt-1">À payer chaque année</p>
              </div>
              <p className="text-xl font-black text-white">
                ~{taxeCirculation} €/an
              </p>
            </div>
          </div>

          {/* Info Complémentaire */}
          <div className="mt-6 bg-blue-900/20 p-4 rounded-2xl border border-blue-500/30">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-blue-400">💡 Dégressivité appliquée :</strong> En
                  Belgique, la TMC diminue de 10% par an (max -90% après 15 ans). Les véhicules de
                  plus de 15 ans paient le forfait minimum de 61,50 €. Les véhicules de collection
                  (30+ ans) sont exemptés d'éco-malus.
                </p>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">
                  <strong className="text-blue-400">📋 Séparation des taxes :</strong> La TMC utilise la puissance (kW) et l'âge. 
                  La Taxe de Circulation utilise uniquement les CV fiscaux (basés sur la cylindrée, pas la puissance DIN).
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Message Flandre */}
          <div className="bg-orange-900/20 border-2 border-orange-500 rounded-2xl p-6 mb-4">
            <p className="text-orange-300 font-bold mb-3">
              ⚠️ Calcul complexe en Flandre
            </p>
            <p className="text-sm text-orange-300 leading-relaxed">
              La Flandre utilise une "formule verte" complexe basée sur les émissions WLTP, la norme
              Euro, et d'autres critères. Pour une estimation précise, consultez{" "}
              <a
                href="https://belastingen.vlaanderen.be"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-orange-400 hover:text-orange-300"
              >
                le site officiel flamand
              </a>
              .
            </p>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-orange-300">
                <strong>Âge du véhicule :</strong> {age} {age === 1 ? "an" : "ans"}
                {firstRegistrationDate && (
                  <span className="text-xs text-orange-400 ml-2">(Date précise utilisée)</span>
                )}
              </p>
              {co2Wltp ? (
                <p className="text-sm text-green-400">
                  ✓ CO2 WLTP disponible : {co2Wltp} g/km
                </p>
              ) : (
                <p className="text-sm text-orange-400">
                  ⚠️ CO2 WLTP non disponible (utilise NEDC : {(co2 || formData.co2)} g/km)
                </p>
              )}
              {isHybrid && (
                <p className="text-sm text-green-400">
                  ✓ Véhicule hybride : Réduction de 50% sur la taxe annuelle
                </p>
              )}
              {isElectric && (
                <p className="text-sm text-green-400">
                  ✓ Véhicule électrique : Taxe annuelle = 0 €
                </p>
              )}
            </div>
          </div>

          {/* Info Complémentaire Flandre */}
          <div className="bg-blue-900/20 p-4 rounded-2xl border border-blue-500/30">
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-blue-400">💡 Info :</strong> Octane98 se concentre sur la
              Wallonie et Bruxelles pour des calculs précis. La Flandre nécessite des données WLTP
              spécifiques. {co2Wltp ? "Les données WLTP sont disponibles pour ce véhicule." : "Les données WLTP ne sont pas encore disponibles pour ce véhicule."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
