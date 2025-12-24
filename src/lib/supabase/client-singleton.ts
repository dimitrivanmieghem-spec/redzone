// RedZone - Client Supabase Singleton (Browser)
// Évite la création multiple de clients et les problèmes de connexion

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Crée ou réutilise un client Supabase singleton
 * Évite les problèmes de connexion multiples avec Netlify/serverless
 */
export function createClient() {
  // Réutiliser le client existant s'il existe
  if (clientInstance) {
    return clientInstance;
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Créer le client avec options optimisées
  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    global: {
      // Timeout réduit à 6 secondes pour éviter les blocages
      // Utiliser AbortController pour un meilleur contrôle
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 secondes max
        
        return fetch(url, {
          ...options,
          signal: options.signal 
            ? (() => {
                // Si un signal est déjà fourni, créer un signal combiné
                const combinedController = new AbortController();
                const abort = () => combinedController.abort();
                options.signal?.addEventListener('abort', abort);
                controller.signal.addEventListener('abort', abort);
                return combinedController.signal;
              })()
            : controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      },
    },
    db: {
      schema: "public",
    },
  });

  return clientInstance;
}

/**
 * Réinitialise le client (utile en cas d'erreur de connexion)
 */
export function resetClient() {
  clientInstance = null;
}

