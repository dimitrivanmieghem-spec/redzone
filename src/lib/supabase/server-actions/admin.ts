"use server";

// RedZone - Server Actions pour la Vérification Admin
// Vérifie le statut admin de manière robuste avec fallback

import { createClient as createServerClient } from "../server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Email admin de secours (fallback si la DB est inaccessible)
const ADMIN_FALLBACK_EMAIL = "dimitri.vanmieghem@gmail.com";

/**
 * Vérifier si l'utilisateur actuel est administrateur (Server Action)
 * Cette fonction est robuste et utilise un fallback sur l'email si la DB est inaccessible
 * 
 * @param supabase - Client Supabase serveur (optionnel, créé automatiquement si non fourni)
 * @returns { isAdmin: boolean, email?: string, role?: string }
 */
export async function checkAdminStatus(
  supabase?: SupabaseClient
): Promise<{ isAdmin: boolean; email?: string; role?: string }> {
  try {
    const client = supabase || await createServerClient();

    // Récupérer l'utilisateur auth
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
      // Aucun utilisateur connecté
      return { isAdmin: false };
    }

    const userEmail = user.email;

    // Fallback 1 : Vérifier l'email admin de secours
    if (userEmail === ADMIN_FALLBACK_EMAIL) {
      // Admin de secours détecté par email
      return { isAdmin: true, email: userEmail, role: "admin" };
    }

    // Fallback 2 : Vérifier dans la table profiles
    try {
      const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("role, email")
        .eq("id", user.id)
        .single();

      if (profileError) {
        // Erreur récupération profil
        // Si erreur DB mais email correspond, utiliser le fallback
        if (userEmail === ADMIN_FALLBACK_EMAIL) {
          return { isAdmin: true, email: userEmail, role: "admin" };
        }
        return { isAdmin: false, email: userEmail };
      }

      const isAdmin = profile?.role === "admin";

      return {
        isAdmin,
        email: userEmail,
        role: profile?.role || undefined,
      };
    } catch (dbError: any) {
      console.error("❌ [checkAdminStatus] Erreur DB:", dbError);
      // Si la DB est inaccessible mais l'email correspond, utiliser le fallback
      if (userEmail === ADMIN_FALLBACK_EMAIL) {
        // Fallback email activé (DB inaccessible)
        return { isAdmin: true, email: userEmail, role: "admin" };
      }
      return { isAdmin: false, email: userEmail };
    }
  } catch (error: any) {
    // Erreur globale
    return { isAdmin: false };
  }
}

