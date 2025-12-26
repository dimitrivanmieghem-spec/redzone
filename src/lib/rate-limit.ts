/**
 * Octane98 - Rate Limiting
 * Protection contre les attaques par force brute et abus
 */

// Store en mémoire (en production, utiliser Redis ou une base de données)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // Fenêtre de temps en millisecondes
  maxRequests: number; // Nombre maximum de requêtes
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Vérifier le rate limit pour une clé (IP, userId, etc.)
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = { windowMs: 15 * 60 * 1000, maxRequests: 5 }
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Si pas de record ou si la fenêtre est expirée, créer un nouveau record
  if (!record || now > record.resetTime) {
    const resetTime = now + options.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime,
    };
  }

  // Si la limite est atteinte
  if (record.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  // Incrémenter le compteur
  record.count++;
  rateLimitStore.set(key, record);

  return {
    allowed: true,
    remaining: options.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Nettoyer les anciens records (appeler périodiquement)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Nettoyer toutes les 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

/**
 * Obtenir l'IP depuis une requête Next.js
 */
export function getClientIP(request: Request): string {
  // Essayer plusieurs headers (pour les proxies, load balancers, etc.)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback (ne devrait jamais arriver en production)
  return "unknown";
}

