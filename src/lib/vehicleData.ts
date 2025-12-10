// RedZone - Constantes pour les véhicules
// Garantit la cohérence entre le formulaire de vente et la recherche

/**
 * Couleurs extérieures disponibles
 */
export const EXTERIOR_COLORS = [
  'Noir',
  'Blanc',
  'Gris/Argent',
  'Bleu',
  'Rouge',
  'Vert',
  'Jaune',
  'Orange',
  'Brun/Beige',
  'Violet',
  'Autre',
] as const;

export type ExteriorColor = typeof EXTERIOR_COLORS[number];

/**
 * Couleurs intérieures disponibles
 */
export const INTERIOR_COLORS = [
  'Cuir Noir',
  'Cuir Beige/Sable',
  'Cuir Rouge',
  'Cuir Brun/Tabac',
  'Alcantara',
  'Tissu/Velours',
  'Mixte',
] as const;

export type InteriorColor = typeof INTERIOR_COLORS[number];

/**
 * Types de carrosserie disponibles
 */
export const CARROSSERIE_TYPES = [
  'Coupé',
  'Cabriolet/Roadster',
  'Berline',
  'Break',
  'Hatchback (Compacte)',
  'Targa',
  'SUV',
] as const;

export type CarrosserieType = typeof CARROSSERIE_TYPES[number];

/**
 * Mapping des couleurs extérieures vers des codes couleur CSS/hex
 */
export const EXTERIOR_COLOR_HEX: Record<ExteriorColor, string> = {
  'Noir': '#000000',
  'Blanc': '#FFFFFF',
  'Gris/Argent': '#808080',
  'Bleu': '#0066CC',
  'Rouge': '#DC2626',
  'Vert': '#00AA00',
  'Jaune': '#FFD700',
  'Orange': '#FF6600',
  'Brun/Beige': '#8B4513',
  'Violet': '#800080',
  'Autre': '#CCCCCC',
};

/**
 * Mapping des couleurs intérieures vers des codes couleur CSS/hex (pour affichage)
 */
export const INTERIOR_COLOR_HEX: Record<InteriorColor, string> = {
  'Cuir Noir': '#1A1A1A',
  'Cuir Beige/Sable': '#F5E6D3',
  'Cuir Rouge': '#8B0000',
  'Cuir Brun/Tabac': '#654321',
  'Alcantara': '#2C2C2C',
  'Tissu/Velours': '#4A4A4A',
  'Mixte': '#808080',
};

