// Octane98 - Utilitaires de Retry pour les Requêtes Supabase
// Gère les erreurs réseau temporaires avec retry automatique

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 seconde
  maxDelay: 10000, // 10 secondes max
  backoffMultiplier: 2,
  retryableErrors: [
    "network",
    "timeout",
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "Failed to fetch",
    "NetworkError",
    "Network request failed",
  ],
};

/**
 * Vérifie si une erreur est récupérable (peut être réessayée)
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message || error.toString() || "";
  const errorCode = error.code || "";

  // Vérifier les codes d'erreur réseau
  if (errorCode && ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND"].includes(errorCode)) {
    return true;
  }

  // Vérifier les messages d'erreur
  const lowerMessage = errorMessage.toLowerCase();
  return DEFAULT_OPTIONS.retryableErrors.some((retryable) =>
    lowerMessage.includes(retryable.toLowerCase())
  );
}

/**
 * Attend un délai avec backoff exponentiel
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Exécute une fonction avec retry automatique en cas d'erreur réseau
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Si ce n'est pas la dernière tentative et que l'erreur est récupérable
      if (attempt < opts.maxRetries && isRetryableError(error)) {
        // Calculer le délai avec backoff exponentiel
        const delayMs = Math.min(
          opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
          opts.maxDelay
        );

        console.warn(
          `Tentative ${attempt + 1}/${opts.maxRetries + 1} échouée, nouvelle tentative dans ${delayMs}ms...`,
          error.message || error
        );

        await delay(delayMs);
        continue;
      }

      // Si l'erreur n'est pas récupérable ou c'est la dernière tentative, throw
      throw error;
    }
  }

  // Ne devrait jamais arriver ici, mais au cas où
  throw lastError;
}

/**
 * Wrapper pour les requêtes Supabase avec retry automatique
 */
export async function supabaseQueryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  try {
    const result = await withRetry(async () => {
      const result = await queryFn();
      // Si c'est une erreur Supabase mais pas une erreur réseau, ne pas retry
      if (result.error && !isRetryableError(result.error)) {
        throw result.error;
      }
      return result;
    }, options);

    return result;
  } catch (error) {
    return { data: null, error };
  }
}

