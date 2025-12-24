"use client";

import { X, Car, TrendingUp, Gauge, Calendar, MapPin } from "lucide-react";
import type { Vehicule } from "@/lib/supabase/types";
import Image from "next/image";
import Link from "next/link";

interface VehicleComparisonModalProps {
  vehicles: Vehicule[];
  isOpen: boolean;
  onClose: () => void;
}

export default function VehicleComparisonModal({
  vehicles,
  isOpen,
  onClose,
}: VehicleComparisonModalProps) {
  if (!isOpen || vehicles.length === 0) return null;

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "N/A";
    return `${price.toLocaleString("fr-BE")} €`;
  };

  const formatMileage = (mileage: number | null | undefined) => {
    if (!mileage) return "N/A";
    return `${mileage.toLocaleString("fr-BE")} km`;
  };

  const formatYear = (year: number | null | undefined) => {
    if (!year) return "N/A";
    return year.toString();
  };

  const formatPower = (power: number | null | undefined) => {
    if (!power) return "N/A";
    return `${power} ch`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-3xl border border-neutral-800 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Car size={24} className="text-red-600" />
            Comparaison de véhicules
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-neutral-800 rounded-2xl p-4 border border-neutral-700"
              >
                {/* Image */}
                <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden">
                  {vehicle.image ? (
                    <Image
                      src={vehicle.image}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
                      <Car size={48} className="text-neutral-500" />
                    </div>
                  )}
                </div>

                {/* Titre */}
                <h3 className="text-lg font-bold mb-2">
                  {vehicle.brand} {vehicle.model}
                </h3>

                {/* Prix */}
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-red-600" />
                  <span className="text-xl font-black text-red-600">
                    {formatPrice(vehicle.price)}
                  </span>
                </div>

                {/* Détails */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-neutral-400" />
                    <span className="text-neutral-300">
                      Année : <strong>{formatYear(vehicle.year)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gauge size={14} className="text-neutral-400" />
                    <span className="text-neutral-300">
                      Kilométrage : <strong>{formatMileage(vehicle.mileage)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car size={14} className="text-neutral-400" />
                    <span className="text-neutral-300">
                      Puissance : <strong>{formatPower(vehicle.power_hp)}</strong>
                    </span>
                  </div>
                  {vehicle.city && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-neutral-400" />
                      <span className="text-neutral-300">{vehicle.city}</span>
                    </div>
                  )}
                </div>

                {/* Lien vers détail */}
                <Link
                  href={`/cars/${vehicle.id}`}
                  className="mt-4 block w-full text-center py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  Voir les détails
                </Link>
              </div>
            ))}
          </div>

          {/* Tableau comparatif */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-800">
                  <th className="text-left p-4 font-bold text-neutral-300">Critère</th>
                  {vehicles.map((vehicle) => (
                    <th key={vehicle.id} className="text-left p-4 font-bold text-neutral-300">
                      {vehicle.brand} {vehicle.model}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-800">
                  <td className="p-4 font-medium text-neutral-400">Prix</td>
                  {vehicles.map((vehicle) => (
                    <td key={vehicle.id} className="p-4 text-white font-bold">
                      {formatPrice(vehicle.price)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="p-4 font-medium text-neutral-400">Année</td>
                  {vehicles.map((vehicle) => (
                    <td key={vehicle.id} className="p-4 text-white">
                      {formatYear(vehicle.year)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="p-4 font-medium text-neutral-400">Kilométrage</td>
                  {vehicles.map((vehicle) => (
                    <td key={vehicle.id} className="p-4 text-white">
                      {formatMileage(vehicle.mileage)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="p-4 font-medium text-neutral-400">Puissance</td>
                  {vehicles.map((vehicle) => (
                    <td key={vehicle.id} className="p-4 text-white">
                      {formatPower(vehicle.power_hp)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="p-4 font-medium text-neutral-400">Carburant</td>
                  {vehicles.map((vehicle) => (
                    <td key={vehicle.id} className="p-4 text-white">
                      {vehicle.fuel_type || "N/A"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="p-4 font-medium text-neutral-400">Transmission</td>
                  {vehicles.map((vehicle) => (
                    <td key={vehicle.id} className="p-4 text-white">
                      {vehicle.transmission || "N/A"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium text-neutral-400">Carrosserie</td>
                  {vehicles.map((vehicle) => (
                    <td key={vehicle.id} className="p-4 text-white">
                      {vehicle.body_type || "N/A"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-800 flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

