// RedZone - Utilitaires d'authentification (CLIENT SIDE ONLY)
// Ce fichier ne doit JAMAIS importer next/headers ou le client serveur

import { createClient } from "./client";

// Email admin de secours (fallback)
const ADMIN_FALLBACK_EMAIL = "dimitri.vanmieghem@gmail.com";

/**
 * Vérifier si l'utilisateur actuel est administrateur (version client)
 * @returns true si l'utilisateur est admin, false sinon
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }
  
  // Fallback : vérifier l'email si c'est l'admin de secours
  if (user.email === ADMIN_FALLBACK_EMAIL) {
    return true;
  }
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();
  
  if (error) {
    console.error("[isAdmin] Erreur récupération profil:", error);
    return false;
  }
  
  return profile?.role === "admin";
}

/**
 * Vérifier si l'utilisateur actuel est authentifié
 * @returns true si l'utilisateur est connecté, false sinon
 */
export async function isAuthenticated(): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
}

/**
 * Vérifier si l'utilisateur actuel est authentifié et lever une erreur si ce n'est pas le cas
 * @throws Error si l'utilisateur n'est pas authentifié
 */
export async function requireAuth(): Promise<void> {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    throw new Error("Accès refusé - Authentification requise");
  }
}

