/**
 * RedZone - Validation et Sanitization des Données
 * Protection contre injection, XSS, et données malformées
 */

/**
 * Sanitize une chaîne de caractères (supprime les balises HTML dangereuses)
 */
export function sanitizeString(input: string, maxLength: number = 10000): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // Limiter la longueur
  let sanitized = input.slice(0, maxLength);

  // Échapper les caractères HTML dangereux
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");

  // Supprimer les scripts et événements JavaScript
  sanitized = sanitized.replace(
    /javascript:|on\w+\s*=/gi,
    ""
  );

  return sanitized.trim();
}

/**
 * Valider une URL
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    // Vérifier que c'est HTTP ou HTTPS
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }
    // Vérifier la longueur
    if (url.length > 2048) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Valider un email
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Valider un numéro de téléphone belge
 */
export function validateBelgianPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") {
    return false;
  }

  // Format: +32XXXXXXXXX ou 32XXXXXXXXX
  const phoneRegex = /^\+?32\d{8,9}$/;
  const cleaned = phone.replace(/\s/g, "");
  return phoneRegex.test(cleaned);
}

/**
 * Valider un nombre positif
 */
export function validatePositiveNumber(
  value: string | number,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): boolean {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Valider une année
 */
export function validateYear(year: string | number): boolean {
  const currentYear = new Date().getFullYear();
  const num = typeof year === "string" ? parseInt(year) : year;
  return !isNaN(num) && num >= 1900 && num <= currentYear + 1;
}

/**
 * Valider les données d'un véhicule avant insertion
 */
export interface VehiculeValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateVehiculeData(data: {
  marque?: string;
  modele?: string;
  prix?: string | number;
  annee?: string | number;
  km?: string | number;
  description?: string;
  car_pass_url?: string;
  contact_email?: string;
  telephone?: string;
  contact_methods?: string[];
}): VehiculeValidationResult {
  const errors: string[] = [];

  // Validation marque
  if (data.marque) {
    const sanitized = sanitizeString(data.marque, 100);
    if (sanitized.length < 2 || sanitized.length > 100) {
      errors.push("La marque doit contenir entre 2 et 100 caractères");
    }
  }

  // Validation modèle
  if (data.modele) {
    const sanitized = sanitizeString(data.modele, 100);
    if (sanitized.length < 1 || sanitized.length > 100) {
      errors.push("Le modèle doit contenir entre 1 et 100 caractères");
    }
  }

  // Validation prix
  if (data.prix !== undefined) {
    if (!validatePositiveNumber(data.prix, 1, 10000000)) {
      errors.push("Le prix doit être un nombre positif entre 1 et 10.000.000 €");
    }
  }

  // Validation année
  if (data.annee !== undefined) {
    if (!validateYear(data.annee)) {
      errors.push("L'année doit être entre 1900 et l'année prochaine");
    }
  }

  // Validation kilométrage
  if (data.km !== undefined) {
    if (!validatePositiveNumber(data.km, 0, 10000000)) {
      errors.push("Le kilométrage doit être un nombre positif entre 0 et 10.000.000 km");
    }
  }

  // Validation description
  if (data.description) {
    const sanitized = sanitizeString(data.description, 5000);
    if (sanitized.length > 5000) {
      errors.push("La description ne peut pas dépasser 5000 caractères");
    }
  }

  // Validation URL Car-Pass
  if (data.car_pass_url) {
    if (!validateUrl(data.car_pass_url)) {
      errors.push("L'URL Car-Pass n'est pas valide (doit être http:// ou https://)");
    }
  }

  // Validation email de contact
  if (data.contact_email) {
    if (!validateEmail(data.contact_email)) {
      errors.push("L'email de contact n'est pas valide");
    }
  }

  // Validation téléphone
  if (data.telephone) {
    if (!validateBelgianPhone(data.telephone)) {
      errors.push("Le numéro de téléphone doit être au format belge (+32XXXXXXXXX)");
    }
  }

  // Validation méthodes de contact
  if (data.contact_methods) {
    const validMethods = ["whatsapp", "email", "tel"];
    const invalidMethods = data.contact_methods.filter(
      (m) => !validMethods.includes(m)
    );
    if (invalidMethods.length > 0) {
      errors.push(
        `Méthodes de contact invalides: ${invalidMethods.join(", ")}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizer les données d'un véhicule avant insertion
 */
export function sanitizeVehiculeData(data: {
  marque?: string | null;
  modele?: string | null;
  description?: string | null;
  architecture_moteur?: string | null;
  moteur?: string | null;
  [key: string]: any;
}): typeof data {
  const sanitized = { ...data };

  if (sanitized.marque && typeof sanitized.marque === "string") {
    sanitized.marque = sanitizeString(sanitized.marque, 100);
  }

  if (sanitized.modele && typeof sanitized.modele === "string") {
    sanitized.modele = sanitizeString(sanitized.modele, 100);
  }

  if (sanitized.description && typeof sanitized.description === "string") {
    sanitized.description = sanitizeString(sanitized.description, 5000);
  }

  if (sanitized.architecture_moteur && typeof sanitized.architecture_moteur === "string") {
    sanitized.architecture_moteur = sanitizeString(
      sanitized.architecture_moteur,
      100
    );
  }

  if (sanitized.moteur && typeof sanitized.moteur === "string") {
    sanitized.moteur = sanitizeString(sanitized.moteur, 100);
  }

  return sanitized;
}

