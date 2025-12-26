"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { QRCodeSVG } from "qrcode.react";
import { Vehicule } from "@/lib/supabase/types";
import { Gauge, Zap, GaugeCircle, Fuel, Settings, Car } from "lucide-react";

interface VehicleFlyerProps {
  vehicule: Vehicule;
  garageName?: string | null;
  vehicleUrl: string;
  onPrint?: () => void;
}

export default function VehicleFlyer({
  vehicule,
  garageName,
  vehicleUrl,
  onPrint,
}: VehicleFlyerProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const print = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `${vehicule.brand} ${vehicule.model} - Fiche Véhicule`,
  });

  const handlePrint = () => {
    if (onPrint) onPrint();
    print();
  };

  // Formater le prix
  const formattedPrice = vehicule.price
    ? new Intl.NumberFormat("fr-BE", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(vehicule.price)
    : "Prix sur demande";

  // Formater le kilométrage
  const formattedMileage = vehicule.mileage
    ? new Intl.NumberFormat("fr-BE").format(vehicule.mileage)
    : "N/A";

  // Formater le carburant
  const formatCarburant = (fuel: string | null | undefined) => {
    if (!fuel) return "N/A";
    const map: Record<string, string> = {
      essence: "Essence",
      e85: "E85 (Éthanol)",
      lpg: "LPG (GPL)",
    };
    return map[fuel] || fuel;
  };

  // Formater la transmission
  const formatTransmission = (trans: string | null | undefined) => {
    if (!trans) return "N/A";
    const map: Record<string, string> = {
      manuelle: "Manuelle",
      automatique: "Automatique",
      sequentielle: "Séquentielle",
    };
    return map[trans] || trans;
  };

  return (
    <>
      {/* Bouton d'impression (visible dans l'UI, masqué à l'impression) */}
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-medium text-sm rounded-lg transition-all print:hidden"
        title="Imprimer la fiche véhicule"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        🖨️ Imprimer la Fiche
      </button>

      {/* Contenu à imprimer (caché à l'écran, visible uniquement lors de l'impression) */}
      <div style={{ display: "none" }}>
        <div
          ref={componentRef}
          data-print-content
          className="bg-white text-black p-8"
          style={{
            width: "210mm", // A4 width
            minHeight: "297mm", // A4 height
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          {/* Header avec Logo et Garage */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-black">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                <Gauge className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black tracking-tight">
                  Red<span className="text-red-600">Zone</span>
                </h1>
                <p className="text-xs text-gray-600 font-medium">
                  Le Sanctuaire du Moteur Thermique
                </p>
              </div>
            </div>
            {garageName && (
              <div className="text-right">
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  {garageName}
                </p>
              </div>
            )}
          </div>

          {/* Photo principale (grande) */}
          <div className="mb-8">
            <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden relative">
              {vehicule.image ? (
                <img
                  src={vehicule.image}
                  alt={`${vehicule.brand} ${vehicule.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Car size={64} />
                </div>
              )}
            </div>
          </div>

          {/* Infos Clés (Très gros) */}
          <div className="mb-8 text-center">
            <h2 className="text-5xl font-black text-black mb-2 tracking-tight">
              {vehicule.brand || "N/A"} {vehicule.model || ""}
            </h2>
            <p className="text-3xl font-bold text-gray-700 mb-4">
              {vehicule.year || "N/A"}
            </p>
            <p className="text-6xl font-black text-red-600 mb-6">
              {formattedPrice}
            </p>
          </div>

          {/* Détails avec Icônes */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Puissance */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="text-white" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                  Puissance
                </p>
                <p className="text-2xl font-black text-black">
                  {vehicule.power_hp || "N/A"} <span className="text-lg">CV</span>
                </p>
              </div>
            </div>

            {/* Kilométrage */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <GaugeCircle className="text-white" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                  Kilométrage
                </p>
                <p className="text-2xl font-black text-black">
                  {formattedMileage} <span className="text-lg">km</span>
                </p>
              </div>
            </div>

            {/* Carburant */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Fuel className="text-white" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                  Carburant
                </p>
                <p className="text-2xl font-black text-black">
                  {formatCarburant(vehicule.fuel_type)}
                </p>
              </div>
            </div>

            {/* Transmission */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Settings className="text-white" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                  Boîte
                </p>
                <p className="text-2xl font-black text-black">
                  {formatTransmission(vehicule.transmission)}
                </p>
              </div>
            </div>
          </div>

          {/* QR Code et CTA */}
          <div className="mt-12 pt-8 border-t-2 border-black">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-lg border-2 border-black">
                <QRCodeSVG
                  value={vehicleUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-black mb-2">
                  Scannez pour voir l&apos;historique et plus de photos
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  {vehicleUrl}
                </p>
              </div>
            </div>
          </div>

          {/* Footer discret */}
          <div className="mt-8 pt-6 border-t border-gray-300 text-center">
            <p className="text-xs text-gray-500">
              Fiche générée par Octane98 - www.octane98.be
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

