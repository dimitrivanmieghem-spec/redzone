// RedZone - Client Supabase (Browser)
// REFACTORING: Gestion gracieuse des erreurs d'authentification

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Vérification des variables d'environnement
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ [Supabase Client] Variables d'environnement manquantes:", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    });
    throw new Error(
      "Variables d'environnement Supabase manquantes. Vérifiez .env.local"
    );
  }

  try {
    // Créer le client avec options par défaut
    // Les erreurs de session manquante seront gérées dans les composants qui utilisent le client
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });

    return client;
  } catch (error: any) {
    console.error("❌ [Supabase Client] Erreur lors de la création du client:", {
      error: error?.message || error,
      name: error?.name,
      stack: error?.stack,
    });
    
    // Si c'est une erreur de configuration, on la propage
    if (error?.message?.includes("environment") || error?.message?.includes("missing")) {
      throw error;
    }
    
    // Pour les autres erreurs, on crée quand même un client (il pourra échouer plus tard)
    // mais au moins on ne crash pas l'application
    console.warn("⚠️ [Supabase Client] Création du client avec gestion d'erreur dégradée");
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
}

