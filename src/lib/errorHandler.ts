/**
 * Gestionnaire d'erreurs centralisé
 * Fournit des utilitaires pour gérer les erreurs de manière cohérente
 */

export interface ErrorResult<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

/**
 * Wrapper pour les fonctions async avec gestion d'erreur
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage: string = 'Une erreur est survenue'
): Promise<ErrorResult<T>> {
  try {
    const data = await fn();
    return { data, error: null, success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : errorMessage;
    console.error(errorMessage, error);
    return { data: null, error: errorMsg, success: false };
  }
}

/**
 * Log une erreur de manière cohérente
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[${context}]`, {
    error: errorMessage,
    stack: errorStack,
    ...additionalInfo,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Crée un message d'erreur user-friendly
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    // Messages d'erreur spécifiques
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Problème de connexion. Vérifiez votre connexion internet.';
    }
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return 'Vous n\'avez pas les permissions nécessaires.';
    }
    if (error.message.includes('not found')) {
      return 'Ressource introuvable.';
    }
    if (error.message.includes('validation')) {
      return 'Les données saisies ne sont pas valides.';
    }
    
    return error.message;
  }
  
  return 'Une erreur inattendue est survenue.';
}
