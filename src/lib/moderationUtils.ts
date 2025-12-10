// RedZone - Système d'Auto-Modération "Le Videur"

/**
 * Liste noire de mots interdits (véhicules non-sportifs)
 * Insensible à la casse
 */
export const BLACKLIST_WORDS = [
  // Diesel
  "diesel",
  "tdi",
  "dci",
  "hdi",
  "cdti",
  "crdi",
  "jtd",
  "d4d",
  "dti",
  
  // Utilitaires
  "utilitaire",
  "camionnette",
  "fourgon",
  "van",
  "transporter",
  "cargo",
  
  // Familiales
  "7 places",
  "7places",
  "sept places",
  "monovolume",
  "monospace",
  "ludospace",
  "familiale",
  
  // Modèles Diesel BMW
  "116d",
  "118d",
  "120d",
  "180d",
  "218d",
  "220d",
  "318d",
  "320d",
  "520d",
  "x1 18d",
  "x3 20d",
  
  // Modèles Diesel Audi
  "a1 tdi",
  "a3 tdi",
  "a4 tdi",
  "a6 tdi",
  "q3 tdi",
  "q5 tdi",
  
  // Modèles Diesel Mercedes
  "a 180 d",
  "c 220 d",
  "e 220 d",
  "glc 220 d",
  
  // Électriques non-sportives
  "zoe",
  "leaf",
  "id.3",
  "id.4",
  "e-up",
  "twingo electric",
  
  // Citadines de base
  "clio dci",
  "208 hdi",
  "polo tdi",
  "corsa cdti",
  "fiesta tdci",
  "yaris hybrid",
];

/**
 * Détecte si un texte contient des mots interdits
 * @param text - Texte à analyser (description, modèle, etc.)
 * @returns { isBlocked: boolean, detectedWords: string[] }
 */
export function detectBlacklistedWords(text: string): {
  isBlocked: boolean;
  detectedWords: string[];
} {
  if (!text) {
    return { isBlocked: false, detectedWords: [] };
  }

  const lowerText = text.toLowerCase();
  const detectedWords: string[] = [];

  for (const word of BLACKLIST_WORDS) {
    // Vérifier si le mot est présent (avec des frontières de mots)
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(lowerText)) {
      detectedWords.push(word);
    }
  }

  return {
    isBlocked: detectedWords.length > 0,
    detectedWords,
  };
}

/**
 * Vérifie si un véhicule passe la modération automatique
 * @param marque - Marque du véhicule
 * @param modele - Modèle du véhicule
 * @param description - Description du véhicule
 * @returns { isAllowed: boolean, reason: string, detectedWords: string[] }
 */
export function checkVehicleModeration(
  marque: string,
  modele: string,
  description: string
): {
  isAllowed: boolean;
  reason: string;
  detectedWords: string[];
} {
  // Vérifier le modèle
  const modeleCheck = detectBlacklistedWords(modele);
  if (modeleCheck.isBlocked) {
    return {
      isAllowed: false,
      reason: "Modèle non-autorisé détecté",
      detectedWords: modeleCheck.detectedWords,
    };
  }

  // Vérifier la description
  const descriptionCheck = detectBlacklistedWords(description);
  if (descriptionCheck.isBlocked) {
    return {
      isAllowed: false,
      reason: "Mots interdits dans la description",
      detectedWords: descriptionCheck.detectedWords,
    };
  }

  // Tout est OK
  return {
    isAllowed: true,
    reason: "Véhicule conforme",
    detectedWords: [],
  };
}

/**
 * Messages d'alerte selon le type de détection
 */
export const MODERATION_MESSAGES = {
  diesel: "⛔ Hop là ! RedZone est réservé aux sportives ESSENCE uniquement. Les diesels ne sont pas acceptés.",
  utilitaire: "⛔ Hop là ! RedZone est réservé aux sportives. Les utilitaires ne sont pas acceptés.",
  familiale: "⛔ Hop là ! RedZone est dédié aux voitures de sport et plaisir. Les familiales ne correspondent pas à notre concept.",
  electric: "⛔ Hop là ! RedZone célèbre le moteur thermique. Les électriques ne sont pas acceptées.",
  generic: "⛔ Hop là ! RedZone est réservé aux sportives. Ce véhicule ne semble pas correspondre à notre concept.",
};

/**
 * Génère un message d'alerte personnalisé selon les mots détectés
 */
export function getModerationMessage(detectedWords: string[]): string {
  if (detectedWords.length === 0) {
    return "";
  }

  // Diesel détecté
  if (detectedWords.some((w) => ["diesel", "tdi", "dci", "hdi", "cdti", "crdi", "jtd", "d4d"].includes(w))) {
    return MODERATION_MESSAGES.diesel;
  }

  // Utilitaire détecté
  if (detectedWords.some((w) => ["utilitaire", "camionnette", "fourgon", "van"].includes(w))) {
    return MODERATION_MESSAGES.utilitaire;
  }

  // Familiale détectée
  if (detectedWords.some((w) => ["7 places", "monovolume", "monospace", "familiale"].includes(w))) {
    return MODERATION_MESSAGES.familiale;
  }

  // Électrique non-sportive
  if (detectedWords.some((w) => ["zoe", "leaf", "id.3", "id.4", "e-up"].includes(w))) {
    return MODERATION_MESSAGES.electric;
  }

  // Message générique
  return MODERATION_MESSAGES.generic;
}

