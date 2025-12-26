// Octane98 - Constantes pour les véhicules
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
 * SOURCE DE VÉRITÉ UNIQUE - Utiliser cette constante partout
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
 * Types de transmission (drivetrain)
 * SOURCE DE VÉRITÉ UNIQUE - Utiliser cette constante partout
 */
export const DRIVETRAIN_TYPES = [
  'RWD',
  'FWD',
  'AWD',
  '4WD',
] as const;

export type DrivetrainType = typeof DRIVETRAIN_TYPES[number];

/**
 * Mapping des drivetrains vers des labels lisibles
 */
export const DRIVETRAIN_LABELS: Record<DrivetrainType, string> = {
  'RWD': 'RWD (Propulsion)',
  'FWD': 'FWD (Traction)',
  'AWD': 'AWD (4x4)',
  '4WD': '4WD (4x4)',
};

/**
 * Architectures moteur disponibles
 * SOURCE DE VÉRITÉ UNIQUE - Utiliser cette constante partout
 */
export const ENGINE_ARCHITECTURE_TYPES = [
  'L4',
  'L5',
  'L6',
  'V6',
  'V8',
  'V10',
  'V12',
  'Flat-6',
  'Moteur Rotatif',
] as const;

export type EngineArchitectureType = typeof ENGINE_ARCHITECTURE_TYPES[number];

/**
 * Mapping des architectures moteur vers des labels détaillés
 */
export const ENGINE_ARCHITECTURE_LABELS: Record<EngineArchitectureType, { label: string; subtitle: string }> = {
  'L4': { label: 'L4', subtitle: '4 cyl. ligne' },
  'L5': { label: 'L5', subtitle: '5 cyl. ligne' },
  'L6': { label: 'L6', subtitle: '6 cyl. ligne' },
  'V6': { label: 'V6', subtitle: '' },
  'V8': { label: 'V8', subtitle: '' },
  'V10': { label: 'V10', subtitle: '' },
  'V12': { label: 'V12', subtitle: '' },
  'Flat-6': { label: 'Flat-6', subtitle: 'Boxer 6' },
  'Moteur Rotatif': { label: 'Rotatif', subtitle: '' },
};

/**
 * Normes Euro disponibles
 * SOURCE DE VÉRITÉ UNIQUE - Utiliser cette constante partout
 */
export const EURO_STANDARDS = [
  { value: 'euro3', label: 'Euro 3' },
  { value: 'euro4', label: 'Euro 4' },
  { value: 'euro5', label: 'Euro 5' },
  { value: 'euro6b', label: 'Euro 6b' },
  { value: 'euro6d', label: 'Euro 6d' },
] as const;

export type EuroStandard = typeof EURO_STANDARDS[number]['value'];

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

