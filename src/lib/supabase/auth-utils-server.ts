// Octane98 - Utilitaires d'authentification (SERVER SIDE ONLY)
// Ce fichier utilise next/headers et ne doit JAMAIS être importé dans des Client Components

import { createClient as createServerClient } from "./server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Email admin de secours (fallback)
const ADMIN_FALLBACK_EMAIL = "admin@octane98.be";

/**
 * Vérifier si l'utilisateur actuel est administrateur (version serveur)
 * @param supabase - Client Supabase serveur (optionnel, créé automatiquement si non fourni)
 * @returns true si l'utilisateur est admin, false sinon
 */
export async function isAdminServer(supabase?: SupabaseClient): Promise<boolean> {
  const client = supabase || await createServerClient();
  
  const { data: { user }, error: userError } = await client.auth.getUser();
  
  if (userError) {
    console.error("❌ [isAdminServer] Erreur récupération user:", userError);
    return false;
  }
  
  if (!user) {
    return false;
  }
  
  // Fallback : vérifier l'email si c'est l'admin de secours
  if (user.email === ADMIN_FALLBACK_EMAIL) {
    return true;
  }
  
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();
  
  if (profileError) {
    console.error("[isAdminServer] Erreur récupération profil:", profileError);
    return false;
  }
  
  return profile?.role === "admin";
}

/**
 * Vérifier si l'utilisateur actuel est administrateur et lever une erreur si ce n'est pas le cas
 * @param supabase - Client Supabase serveur (optionnel, créé automatiquement si non fourni)
 * @throws Error si l'utilisateur n'est pas admin
 */
export async function requireAdmin(supabase?: SupabaseClient): Promise<void> {
  const isUserAdmin = supabase 
    ? await isAdminServer(supabase)
    : await isAdminServer();
  
  if (!isUserAdmin) {
    // Récupérer l'email de l'utilisateur pour le message d'erreur
    const client = supabase || await createServerClient();
    const { data: { user } } = await client.auth.getUser();
    const email = user?.email || "inconnu";
    
    console.error("[requireAdmin] Accès refusé pour:", email);
    throw new Error(`Accès refusé - Administrateur uniquement (Email: ${email})`);
  }
}

