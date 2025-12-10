"use client";

import { CheckCircle, Heart, MessageCircle, Zap, MapPin, Car } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";
import { useFavorites } from "@/contexts/FavoritesContext";
import { analyzePrice, formatPriceDifference } from "@/lib/priceUtils";
import { Vehicule } from "@/lib/supabase/types";
import { calculatePowerToWeightRatio } from "@/lib/vehicleUtils";

interface CarCardProps {
  car?: Vehicule;
  vehicule?: Vehicule;
  allVehicules?: Vehicule[];
}

function getEuroNormColor(normeEuro: string): string {
  const colors: Record<string, string> = {
    euro6d: "bg-green-100 text-green-800",
    euro6b: "bg-blue-100 text-blue-800",
    euro5: "bg-blue-100 text-yellow-800",
    euro4: "bg-orange-100 text-orange-800",
    euro3: "bg-red-100 text-red-800",
    euro2: "bg-red-200 text-red-900",
    euro1: "bg-red-300 text-red-950",
  };
  return colors[normeEuro] || "bg-slate-100 text-slate-800";
}

function formatEuroNorm(normeEuro: string): string {
  return normeEuro.replace("euro", "Euro ").toUpperCase();
}

function formatCarburant(carburant: string): string {
  const carburantMap: Record<string, string> = {
    essence: "Essence",
    e85: "E85 (Éthanol)",
    lpg: "LPG (GPL)",
  };
  return carburantMap[carburant] || carburant;
}

export default function CarCard({ car, vehicule, allVehicules = [] }: CarCardProps) {
  const vehicle = vehicule || car;
  
  // Vérification de sécurité : si vehicle est null/undefined, ne rien afficher
  if (!vehicle || !vehicle.id) {
    return null;
  }

  // Vérifications de sécurité pour les champs obligatoires
  if (
    typeof vehicle.prix !== 'number' || 
    isNaN(vehicle.prix) ||
    typeof vehicle.annee !== 'number' || 
    isNaN(vehicle.annee) ||
    typeof vehicle.km !== 'number' || 
    isNaN(vehicle.km)
  ) {
    console.warn('CarCard: Données incomplètes pour le véhicule', vehicle.id, {
      prix: vehicle.prix,
      annee: vehicle.annee,
      km: vehicle.km,
    });
    return null;
  }

  const currentYear = new Date().getFullYear();
  const isNew = vehicle.annee && vehicle.annee >= currentYear - 1;
  const { showToast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const favorite = isFavorite(vehicle.id);

  // Analyse de prix (si allVehicules fourni)
  const priceAnalysis = allVehicules.length > 0 ? analyzePrice(vehicle, allVehicules) : null;

  // Ratio poids/puissance
  const powerToWeightRatio = calculatePowerToWeightRatio(vehicle.poids_kg || undefined, vehicle.puissance || 0);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(vehicle.id);
    
    if (favorite) {
      showToast("Voiture retirée des favoris", "info");
    } else {
      showToast("Voiture ajoutée aux favoris ❤️", "success");
    }
  };

  return (
    <div className="shadow-2xl shadow-slate-200/50 border-0 rounded-3xl overflow-hidden hover:shadow-3xl hover:scale-[1.02] transition-all duration-300 bg-white group relative">
      {/* Badge Nouveau avec effet glassmorphism */}
      {isNew && (
        <div className="absolute top-4 left-4 z-10 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl hover:scale-105 transition-transform">
          🆕 Nouveau
        </div>
      )}

      {/* Badge Analyse de Prix */}
      {!isNew && priceAnalysis && (
        <div className={`absolute top-4 left-4 z-10 ${priceAnalysis.colorBg}/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-xl border-2 ${
          priceAnalysis.label === "Super Affaire" ? "border-green-400" :
          priceAnalysis.label === "Prix Élevé" ? "border-orange-400" :
          "border-blue-400"
        }`}>
          <p className={`text-xs font-black ${priceAnalysis.color} flex items-center gap-1.5`}>
            {priceAnalysis.label === "Super Affaire" && "🟢"}
            {priceAnalysis.label === "Prix Élevé" && "🟠"}
            {priceAnalysis.label === "Prix Correct" && "🔵"}
            <span>{formatPriceDifference(priceAnalysis.difference)}</span>
          </p>
        </div>
      )}

      {/* Badge WhatsApp */}
      <div className="absolute bottom-4 right-4 z-10 w-12 h-12 bg-green-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-xl border-2 border-white hover:scale-110 transition-all group">
        <MessageCircle size={20} className="text-white" />
        <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap font-bold shadow-xl">
            💬 WhatsApp disponible
          </div>
        </div>
      </div>

      {/* Bouton Favoris */}
      <button
        onClick={handleToggleFavorite}
        className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/90 backdrop-blur-md hover:bg-white rounded-full flex items-center justify-center shadow-xl transition-all hover:scale-110"
        aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        <Heart
          size={22}
          className={`transition-colors ${
            favorite
              ? "fill-red-500 text-red-500"
              : "text-slate-900 hover:text-red-500"
          }`}
        />
      </button>

      <Link href={`/cars/${vehicle.id}`} className="block">
        {/* Photo agrandie */}
        <div className="h-64 bg-gradient-to-br from-slate-100 to-slate-200 w-full relative">
          {vehicle.image ? (
            <Image
              src={vehicle.image}
              alt={`${vehicle.marque || 'Véhicule'} ${vehicle.modele || ''}`}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                // Fallback si l'image ne charge pas
                e.currentTarget.src = '/placeholder-car.jpg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <Car size={48} />
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-extrabold text-xl tracking-tight text-slate-900">
              {vehicle.marque || 'N/A'} {vehicle.modele || ''}
            </h4>
            <span className="font-black text-2xl tracking-tight text-blue-600">
              {vehicle.prix ? vehicle.prix.toLocaleString("fr-BE") : 'N/A'} €
            </span>
          </div>
          <p className="text-slate-700 text-sm mb-5 font-medium">
            {vehicle.annee || 'N/A'} • {vehicle.km ? vehicle.km.toLocaleString("fr-BE") : 'N/A'} km •{" "}
            {vehicle.carburant ? formatCarburant(vehicle.carburant) : 'N/A'}
            {vehicle.ville && (
              <span className="text-slate-500">
                {" • "}
                <MapPin size={12} className="inline mr-1" />
                {vehicle.ville}
              </span>
            )}
          </p>
          <div className="flex gap-2 flex-wrap">
            {vehicle.car_pass && (
              <span className="bg-green-100/80 backdrop-blur-sm text-green-700 text-xs px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg border border-green-200">
                <CheckCircle size={16} className="text-green-600" />
                Car-Pass
              </span>
            )}
            {vehicle.norme_euro && (
              <span
                className={`text-xs px-3 py-2 rounded-full font-bold shadow-md backdrop-blur-sm ${getEuroNormColor(
                  vehicle.norme_euro
                )}`}
              >
                {formatEuroNorm(vehicle.norme_euro)}
              </span>
            )}
            {powerToWeightRatio && (
              <span 
                className="bg-slate-800 text-white text-xs px-3 py-2 rounded-full font-bold shadow-lg flex items-center gap-1.5"
                title="Rapport poids/puissance - Plus c'est bas, plus c'est sportif !"
              >
                <Zap size={14} className="text-yellow-400" />
                {powerToWeightRatio} kg/ch
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
