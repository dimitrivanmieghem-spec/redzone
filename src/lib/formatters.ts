/**
 * Utilitaires de formatage centralisés
 * Utilisés dans toute l'application pour un formatage cohérent
 */

/**
 * Formate un prix en euros (format belge)
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || isNaN(price)) return 'N/A';
  return new Intl.NumberFormat('fr-BE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return new Intl.NumberFormat('fr-BE').format(num);
}

/**
 * Formate une date (format belge)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    return new Intl.DateTimeFormat('fr-BE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date));
  } catch {
    return 'N/A';
  }
}

/**
 * Formate une date courte (JJ/MM/AAAA)
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    return new Intl.DateTimeFormat('fr-BE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  } catch {
    return 'N/A';
  }
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    return new Intl.DateTimeFormat('fr-BE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  } catch {
    return 'N/A';
  }
}

/**
 * Formate la norme Euro (ex: "euro6d" -> "Euro 6d")
 */
export function formatEuroNorm(norm: string | null | undefined): string {
  if (!norm) return 'N/A';
  return norm.replace(/euro/gi, 'Euro ').toUpperCase().trim();
}

/**
 * Formate le type de carburant
 */
export function formatCarburant(carburant: string | null | undefined): string {
  if (!carburant) return 'N/A';
  const carburantMap: Record<string, string> = {
    essence: 'Essence',
    e85: 'E85 (Ethanol)',
    lpg: 'LPG',
    diesel: 'Diesel',
  };
  return carburantMap[carburant.toLowerCase()] || carburant;
}

/**
 * Formate le type de transmission
 */
export function formatTransmission(transmission: string | null | undefined): string {
  if (!transmission) return 'N/A';
  const transmissionMap: Record<string, string> = {
    manuelle: 'Manuelle',
    automatique: 'Automatique',
    sequentielle: 'Séquentielle',
  };
  return transmissionMap[transmission.toLowerCase()] || transmission;
}

/**
 * Formate le type de carrosserie
 */
export function formatCarrosserie(carrosserie: string | null | undefined): string {
  if (!carrosserie) return 'N/A';
  // Capitaliser la première lettre
  return carrosserie.charAt(0).toUpperCase() + carrosserie.slice(1).toLowerCase();
}

/**
 * Formate un nombre de kilomètres
 */
export function formatMileage(mileage: number | null | undefined): string {
  if (mileage === null || mileage === undefined || isNaN(mileage)) return 'N/A';
  return `${formatNumber(mileage)} km`;
}

/**
 * Formate une puissance en chevaux
 */
export function formatPower(power: number | null | undefined): string {
  if (power === null || power === undefined || isNaN(power)) return 'N/A';
  return `${formatNumber(power)} ch`;
}

/**
 * Formate un temps relatif (ex: "il y a 2 heures")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  
  try {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
    return formatDateShort(date);
  } catch {
    return 'N/A';
  }
}
