// RedZone - Client Supabase (Browser)
// REFACTORING: Gestion gracieuse des erreurs d'authentification

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createClient() {
  // Utiliser les variables d'environnement validées
  // Si elles sont manquantes, l'application aura crashé au démarrage (via env.ts)
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Créer le client avec options par défaut
  // Les erreurs de session manquante seront gérées dans les composants qui utilisent le client
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
}

