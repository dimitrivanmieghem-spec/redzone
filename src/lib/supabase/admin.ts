// RedZone - Client Supabase Admin (Service Role)
// ⚠️ ATTENTION : Ce client utilise la SERVICE_ROLE_KEY et contourne toutes les politiques RLS
// Utiliser UNIQUEMENT pour les opérations critiques nécessitant des privilèges élevés

import { createClient } from "@supabase/supabase-js";

/**
 * Créer un client Supabase avec les privilèges admin (service_role)
 * Ce client peut :
 * - Supprimer des utilisateurs auth
 * - Contourner les politiques RLS
 * - Accéder à toutes les données sans restriction
 * 
 * ⚠️ NE JAMAIS utiliser ce client dans des Client Components
 * ⚠️ Utiliser uniquement dans des Server Actions ou API Routes
 */
import { env } from "@/lib/env";

export function createAdminClient() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY est manquante. Cette variable est requise pour le client admin. " +
      "Vérifiez SUPABASE_SERVICE_ROLE_KEY dans .env.local"
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

