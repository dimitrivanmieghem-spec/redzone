// Octane98 - Utilitaires Techniques Automobiles

import { Vehicule } from "./supabase/types";

/**
 * Calcule le ratio poids/puissance (kg/ch)
 * Plus le chiffre est bas, plus c'est sportif !
 * @param poids_kg - Poids à vide en kg
 * @param puissance - Puissance en chevaux
 * @returns Ratio formaté (ex: "3.18")
 */
export function calculatePowerToWeightRatio(
  poids_kg?: number,
  power_hp?: number
): string | null {
  if (!poids_kg || !power_hp || power_hp === 0) return null;
  const ratio = poids_kg / power_hp;
  return ratio.toFixed(2);
}

/**
 * Retourne une évaluation du ratio poids/puissance
 * @param ratio - Ratio en kg/ch
 * @returns { label, color, description }
 */
export function evaluatePowerToWeightRatio(ratio: number): {
  label: string;
  color: string;
  bgColor: string;
  description: string;
} {
  if (ratio < 3) {
    return {
      label: "Fusée 🚀",
      color: "text-red-600",
      bgColor: "bg-red-100",
      description: "Rapport poids/puissance exceptionnel ! Performances de supercar.",
    };
  } else if (ratio < 5) {
    return {
      label: "Très sportif 🏁",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      description: "Excellent rapport poids/puissance. Sensations garanties !",
    };
  } else if (ratio < 7) {
    return {
      label: "Sportif ⚡",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      description: "Bon rapport poids/puissance. Dynamique au volant.",
    };
  } else {
    return {
      label: "Correct 🚗",
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      description: "Rapport poids/puissance standard.",
    };
  }
}

/**
 * Calcule le Trust Score (Score de Confiance) de 0 à 100
 * @param vehicule - Véhicule à évaluer
 * @returns Score de 0 à 100
 */
export function calculateTrustScore(vehicule: Vehicule): number {
  let score = 0;

  // +20 pts si Car-Pass
  if (vehicule.car_pass) {
    score += 20;
  }

  // +20 pts si Carnet complet dans l'historique
  if (vehicule.history?.includes("Carnet complet") || 
      vehicule.history?.includes("Carnet d'entretien complet")) {
    score += 20;
  }

  // +10 pts si description longue (> 100 caractères)
  if (vehicule.description && vehicule.description.length > 100) {
    score += 10;
  }

  // +10 pts par photo (max 30 pts = 3 photos)
  const photoCount = vehicule.images?.length || (vehicule.image ? 1 : 0);
  score += Math.min(photoCount * 10, 30);

  // +10 pts si historique complet (3+ éléments)
  if (vehicule.history && vehicule.history.length >= 3) {
    score += 10;
  }

  // +10 pts si fichier audio (preuve sonorité)
  if (vehicule.audio_file) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Retourne l'évaluation du Trust Score
 * @param score - Score de 0 à 100
 * @returns { label, color, bgColor, message }
 */
export function evaluateTrustScore(score: number): {
  label: string;
  color: string;
  bgColor: string;
  ringColor: string;
  message: string;
  icon: string;
} {
  if (score >= 80) {
    return {
      label: "Excellente confiance",
      color: "text-green-700",
      bgColor: "bg-green-100",
      ringColor: "ring-green-600",
      message: "✅ Annonce complète et transparente. Toutes les garanties sont présentes !",
      icon: "🏆",
    };
  } else if (score >= 60) {
    return {
      label: "Bonne confiance",
      color: "text-blue-700",
      bgColor: "bg-blue-100",
      ringColor: "ring-blue-600",
      message: "✓ Annonce détaillée avec de bonnes garanties. Contactez le vendeur pour plus d'infos.",
      icon: "✅",
    };
  } else if (score >= 40) {
    return {
      label: "Confiance moyenne",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
      ringColor: "ring-orange-600",
      message: "⚠️ Annonce partielle. Demandez plus de détails et de photos au vendeur.",
      icon: "⚠️",
    };
  } else {
    return {
      label: "Confiance faible",
      color: "text-red-700",
      bgColor: "bg-red-100",
      ringColor: "ring-red-600",
      message: "❌ Annonce peu détaillée. Posez beaucoup de questions avant d'acheter !",
      icon: "⛔",
    };
  }
}

/**
 * Génère la description détaillée du Trust Score
 * @param vehicule - Véhicule à évaluer
 * @returns Liste des points de confiance
 */
export function getTrustScoreBreakdown(vehicule: Vehicule): {
  label: string;
  value: number;
  max: number;
  achieved: boolean;
}[] {
  const breakdown = [];

  // Car-Pass
  breakdown.push({
    label: "Car-Pass officiel",
    value: vehicule.car_pass ? 20 : 0,
    max: 20,
    achieved: vehicule.car_pass,
  });

  // Carnet d'entretien
  const hasCarnet = vehicule.history?.some(h => 
    h.includes("Carnet") || h.includes("carnet")
  ) || false;
  breakdown.push({
    label: "Carnet d'entretien complet",
    value: hasCarnet ? 20 : 0,
    max: 20,
    achieved: hasCarnet,
  });

  // Description
  const hasDescription = vehicule.description && vehicule.description.length > 100;
  breakdown.push({
    label: "Description détaillée (100+ caractères)",
    value: hasDescription ? 10 : 0,
    max: 10,
    achieved: !!hasDescription,
  });

  // Photos
  const photoCount = vehicule.images?.length || (vehicule.image ? 1 : 0);
  const photoPoints = Math.min(photoCount * 10, 30);
  breakdown.push({
    label: `Photos (${photoCount}/3+)`,
    value: photoPoints,
    max: 30,
    achieved: photoCount >= 3,
  });

  // Historique
  const historyCount = vehicule.history?.length || 0;
  const hasHistory = historyCount >= 3;
  breakdown.push({
    label: `Historique transparent (${historyCount}/3+ preuves)`,
    value: hasHistory ? 10 : 0,
    max: 10,
    achieved: hasHistory,
  });

  // Audio
  breakdown.push({
    label: "Sonorité moteur (fichier audio)",
    value: vehicule.audio_file ? 10 : 0,
    max: 10,
    achieved: !!vehicule.audio_file,
  });

  return breakdown;
}

