// RedZone - Utilitaires d'authentification et de vérification des rôles

import { createClient } from "./client";

/**
 * Vérifier si l'utilisateur actuel est administrateur
 * @returns true si l'utilisateur est admin, false sinon
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  
  return profile?.role === "admin";
}

/**
 * Vérifier si l'utilisateur actuel est administrateur et lever une erreur si ce n'est pas le cas
 * @throws Error si l'utilisateur n'est pas admin
 */
export async function requireAdmin(): Promise<void> {
  const isUserAdmin = await isAdmin();
  
  if (!isUserAdmin) {
    throw new Error("Accès refusé - Administrateur uniquement");
  }
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

