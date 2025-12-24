// RedZone - Algorithme d'Analyse de Prix Intelligent

import { Vehicule } from "./supabase/types";

export interface PriceAnalysis {
  label: "Super Affaire" | "Prix Correct" | "Prix Élevé";
  color: string;
  colorBg: string;
  difference: number; // Différence en € par rapport à la moyenne
  percentageDiff: number; // Différence en %
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  sampleSize: number; // Nombre de véhicules similaires
  position: number; // Position de 0 à 100 (pour la jauge)
}

/**
 * Analyse le prix d'un véhicule par rapport au marché
 * @param vehicule - Le véhicule à analyser
 * @param allVehicules - Tous les véhicules disponibles
 * @returns Objet d'analyse avec label, couleur, différence, etc.
 */
export function analyzePrice(
  vehicule: Vehicule,
  allVehicules: Vehicule[]
): PriceAnalysis | null {
  // Filtrer les véhicules du même modèle (actifs uniquement)
  const similarVehicules = allVehicules.filter(
    (v) =>
      v.id !== vehicule.id && // Exclure le véhicule actuel
      v.status === "active" && // Uniquement les actifs
      v.model === vehicule.model && // Même modèle (anglais)
      v.brand === vehicule.brand // Même marque (anglais)
  );

  // Besoin d'au moins 2 véhicules similaires pour faire une analyse
  if (similarVehicules.length < 2) {
    return null;
  }

  // Calculer les statistiques
  const prices = similarVehicules.map((v) => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  // Calculer la différence
  const difference = vehicule.price - averagePrice;
  const percentageDiff = (difference / averagePrice) * 100;

  // Calculer la position pour la jauge (0-100)
  const position =
    maxPrice > minPrice
      ? ((vehicule.price - minPrice) / (maxPrice - minPrice)) * 100
      : 50;

  // Déterminer le label et la couleur
  let label: "Super Affaire" | "Prix Correct" | "Prix Élevé";
  let color: string;
  let colorBg: string;

  if (percentageDiff <= -5) {
    // 5% ou plus sous la moyenne
    label = "Super Affaire";
    color = "text-green-700";
    colorBg = "bg-green-100";
  } else if (percentageDiff >= 5) {
    // 5% ou plus au-dessus de la moyenne
    label = "Prix Élevé";
    color = "text-orange-700";
    colorBg = "bg-orange-100";
  } else {
    // Dans la fourchette ±5%
    label = "Prix Correct";
    color = "text-blue-700";
    colorBg = "bg-blue-100";
  }

  return {
    label,
    color,
    colorBg,
    difference,
    percentageDiff,
    averagePrice,
    minPrice,
    maxPrice,
    sampleSize: similarVehicules.length,
    position,
  };
}

/**
 * Formatte un prix en euros avec séparateurs
 * @param price - Prix en euros
 * @returns Prix formaté (ex: "25.000 €")
 */
export function formatPrice(price: number): string {
  return price.toLocaleString("fr-BE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + " €";
}

/**
 * Formatte une différence de prix avec signe
 * @param difference - Différence en euros
 * @returns Différence formatée (ex: "-1.500 €" ou "+2.000 €")
 */
export function formatPriceDifference(difference: number): string {
  const sign = difference >= 0 ? "+" : "";
  return sign + difference.toLocaleString("fr-BE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }) + " €";
}

/**
 * Formatte un pourcentage avec signe
 * @param percentage - Pourcentage
 * @returns Pourcentage formaté (ex: "-5%" ou "+10%")
 */
export function formatPercentage(percentage: number): string {
  const sign = percentage >= 0 ? "+" : "";
  return sign + percentage.toFixed(1) + "%";
}

/**
 * Génère un texte explicatif pour l'analyse de prix
 * @param analysis - Résultat de l'analyse
 * @param vehicule - Le véhicule analysé
 * @returns Texte explicatif complet
 */
export function getPriceAnalysisText(
  analysis: PriceAnalysis,
  vehicule: Vehicule
): string {
  const percentText = formatPercentage(analysis.percentageDiff);
  const diffText = formatPriceDifference(analysis.difference);
  
  if (analysis.label === "Super Affaire") {
    return `Ce véhicule est ${Math.abs(analysis.percentageDiff).toFixed(1)}% moins cher que la moyenne des ${vehicule.model} actuellement en vente sur RedZone (${diffText} sous la cote).`;
  } else if (analysis.label === "Prix Élevé") {
    return `Ce véhicule est ${Math.abs(analysis.percentageDiff).toFixed(1)}% plus cher que la moyenne des ${vehicule.model} actuellement en vente sur RedZone (${diffText} au-dessus de la cote).`;
  } else {
    return `Ce véhicule est au prix du marché (${percentText} par rapport à la moyenne des ${vehicule.model} en vente sur RedZone).`;
  }
}

