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
  // Configuration spécifique pour Chrome (gestion des cookies et extensions)
  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      // Configuration spécifique pour Chrome
      storage: typeof window !== "undefined" ? {
        getItem: (key: string) => {
          try {
            // Essayer localStorage d'abord
            return localStorage.getItem(key);
          } catch (e) {
            // Fallback sur sessionStorage si localStorage bloqué (extensions Chrome)
            try {
              return sessionStorage.getItem(key);
            } catch {
              return null;
            }
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
          } catch (e) {
            // Fallback sur sessionStorage si localStorage bloqué
            try {
              sessionStorage.setItem(key, value);
            } catch {
              console.warn("[Supabase] Impossible de stocker la session (extensions Chrome?)");
            }
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          } catch {
            // Ignorer les erreurs de suppression
          }
        },
      } : undefined,
    },
    global: {
      // Timeout augmenté à 12 secondes pour gérer les connexions lentes
      // Utiliser AbortController pour un meilleur contrôle
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 secondes max (augmenté pour connexions lentes)
        
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

