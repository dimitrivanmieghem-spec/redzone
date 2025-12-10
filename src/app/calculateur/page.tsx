"use client";

import { useState } from "react";
import { Calculator, Info } from "lucide-react";
import TaxCalculator from "@/components/TaxCalculator";

export default function CalculateurPage() {
  const [region, setRegion] = useState<"wallonie" | "flandre">("wallonie");
  const [annee, setAnnee] = useState<number>(new Date().getFullYear());
  const [puissanceKw, setPuissanceKw] = useState<number>(0);
  const [co2, setCo2] = useState<number>(0);
  const [cvFiscaux, setCvFiscaux] = useState<number>(0);
  const [carburant, setCarburant] = useState<string>("essence");

  // Conversion kW vers CV (1 kW ≈ 1.36 CV) - UNIQUEMENT pour l'affichage
  const puissanceCv = Math.round(puissanceKw * 1.3596);

  // ⚠️ IMPORTANT : Les CV fiscaux sont basés sur la CYLINDRÉE (cm³), 
  // et NON sur la puissance DIN (kW ou CH).
  // Les CV fiscaux doivent être saisis directement par l'utilisateur
  // ou provenir de la carte grise du véhicule.

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl mb-6 shadow-2xl shadow-red-600/40">
            <Calculator size={40} className="text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
            Calculateur Fiscal Belge
          </h1>
          <p className="text-xl text-slate-700 max-w-2xl mx-auto">
            Estimez gratuitement la <span className="font-bold text-red-600">Taxe de Mise en Circulation (TMC)</span> et la{" "}
            <span className="font-bold text-red-600">Taxe de Circulation</span> pour votre véhicule en Belgique.
          </p>
          <p className="text-sm text-slate-500 mt-3">
            💡 Aucune inscription requise • Calcul en temps réel • 100% gratuit
          </p>
        </div>

        {/* Contenu principal : Formulaire + Calculateur */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire d'entrée (Gauche) */}
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-100/50 border-0 p-8">
            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">
              Informations du véhicule
            </h2>

            <div className="space-y-6">
              {/* Région */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-3">
                  Région
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

              {/* Année */}
              <div>
                <label htmlFor="annee" className="block text-sm font-bold text-slate-900 mb-3">
                  Année du véhicule
                </label>
                <input
                  type="number"
                  id="annee"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={annee}
                  onChange={(e) => setAnnee(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 text-slate-900 font-medium"
                  placeholder="2020"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Année de première immatriculation
                </p>
              </div>

              {/* Puissance (kW) */}
              <div>
                <label htmlFor="puissanceKw" className="block text-sm font-bold text-slate-900 mb-3">
                  Puissance (kW)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="puissanceKw"
                    min="0"
                    step="0.1"
                    value={puissanceKw || ""}
                    onChange={(e) => setPuissanceKw(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 text-slate-900 font-medium"
                    placeholder="150"
                  />
                  {puissanceKw > 0 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600">
                      ≈ {puissanceCv} CH
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Puissance en kilowatts (kW). 1 kW ≈ 1.36 CH
                </p>
              </div>

              {/* CO2 */}
              <div>
                <label htmlFor="co2" className="block text-sm font-bold text-slate-900 mb-3">
                  Émissions CO₂ (g/km)
                </label>
                <input
                  type="number"
                  id="co2"
                  min="0"
                  step="1"
                  value={co2 || ""}
                  onChange={(e) => setCo2(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 text-slate-900 font-medium"
                  placeholder="150"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Émissions de CO₂ en grammes par kilomètre (g/km)
                </p>
              </div>

              {/* CV Fiscaux */}
              <div>
                <label htmlFor="cvFiscaux" className="block text-sm font-bold text-slate-900 mb-3">
                  Chevaux Fiscaux (CV) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  id="cvFiscaux"
                  min="0"
                  step="1"
                  value={cvFiscaux || ""}
                  onChange={(e) => setCvFiscaux(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 text-slate-900 font-medium"
                  placeholder="11"
                />
                <p className="text-xs text-slate-500 mt-2">
                  ⚠️ <strong>Important :</strong> Les CV fiscaux sont basés sur la <strong>cylindrée</strong> (cm³), 
                  et <strong>NON</strong> sur la puissance DIN (kW ou CH). 
                  Trouvez cette valeur sur votre carte grise.
                </p>
              </div>

              {/* Carburant */}
              <div>
                <label htmlFor="carburant" className="block text-sm font-bold text-slate-900 mb-3">
                  Type de carburant
                </label>
                <select
                  id="carburant"
                  value={carburant}
                  onChange={(e) => setCarburant(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 text-slate-900 font-medium"
                >
                  <option value="essence">Essence</option>
                  <option value="e85">E85 (Éthanol)</option>
                  <option value="lpg">LPG (GPL)</option>
                </select>
                <p className="text-xs text-red-600 mt-2 font-bold">
                  🏁 RedZone = Sportives thermiques uniquement
                </p>
              </div>

              {/* Info complémentaire */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      <strong className="text-blue-700">💡 Astuce :</strong> Vous trouverez ces informations sur la{" "}
                      <strong>carte grise</strong> de votre véhicule ou dans les{" "}
                      <strong>spécifications techniques</strong> du constructeur.
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed mt-2">
                      <strong className="text-blue-700">📋 Séparation des taxes :</strong> La TMC utilise la puissance (kW) et l'âge. 
                      La Taxe de Circulation utilise uniquement les CV fiscaux (basés sur la cylindrée).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculateur (Droite) */}
          <div>
            {puissanceKw > 0 && annee > 0 && cvFiscaux > 0 ? (
              <TaxCalculator
                puissanceKw={puissanceKw}
                puissanceCv={puissanceCv}
                cvFiscaux={cvFiscaux}
                co2={co2}
                carburant={carburant}
                annee={annee}
              />
            ) : (
              <div className="bg-white rounded-3xl shadow-2xl shadow-slate-100/50 border-0 p-12 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calculator size={40} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Remplissez le formulaire
                </h3>
                <p className="text-slate-600">
                  Entrez les informations de votre véhicule à gauche pour voir le calcul des taxes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section d'information supplémentaire */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-3xl p-8 shadow-xl">
            <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">
              📋 Comment ça marche ?
            </h3>
            <div className="space-y-4 text-slate-700">
              <p>
                <strong className="text-red-600">1. TMC (Taxe de Mise en Circulation) :</strong> Taxe unique payée lors de l&apos;immatriculation d&apos;un véhicule en Belgique. Elle dépend de la puissance (kW), de l&apos;âge du véhicule (dégressivité) et des émissions CO₂ (éco-malus en Wallonie).
              </p>
              <p>
                <strong className="text-red-600">2. Taxe de Circulation :</strong> Taxe annuelle basée <strong>EXCLUSIVEMENT</strong> sur les chevaux fiscaux (CV) du véhicule. 
                Les CV fiscaux sont calculés à partir de la <strong>cylindrée</strong> (cm³), et non de la puissance DIN (kW ou CH). 
                Elle doit être payée chaque année tant que le véhicule est immatriculé.
              </p>
              <p>
                <strong className="text-red-600">3. Dégressivité :</strong> En Belgique, la TMC diminue progressivement avec l&apos;âge du véhicule. Après 15 ans, le forfait minimum de 61,50 € s&apos;applique.
              </p>
              <p className="text-sm text-slate-600 mt-4">
                ⚠️ <strong>Note :</strong> Ce calculateur fournit une estimation. Les montants réels peuvent varier selon votre situation spécifique. Consultez toujours les autorités compétentes pour des informations officielles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

