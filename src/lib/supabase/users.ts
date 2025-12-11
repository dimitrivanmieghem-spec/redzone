// RedZone - Actions Supabase pour la Gestion des Utilisateurs (Admin)

import { createClient } from "./client";
import { requireAdmin } from "./auth-utils";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: "particulier" | "pro" | "admin";
  is_banned: boolean;
  created_at: string;
  avatar_url: string | null;
}

export interface UserWithVehicles extends UserProfile {
  vehicles_count: number;
}

/**
 * Récupérer tous les utilisateurs (admin uniquement)
 * @returns Liste des utilisateurs
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erreur récupération utilisateurs: ${error.message}`);
  }

  return (data as UserProfile[]) || [];
}

/**
 * Récupérer un utilisateur avec le nombre de véhicules
 * @param userId - ID de l'utilisateur
 * @returns Utilisateur avec statistiques
 */
export async function getUserWithVehicles(
  userId: string
): Promise<UserWithVehicles | null> {
  const supabase = createClient();

  // Récupérer le profil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return null;
  }

  // Compter les véhicules
  const { count, error: countError } = await supabase
    .from("vehicules")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    ...(profile as UserProfile),
    vehicles_count: count || 0,
  };
}

/**
 * Bannir/Débannir un utilisateur (admin uniquement)
 * @param userId - ID de l'utilisateur
 * @param isBanned - True pour bannir, false pour débannir
 */
export async function toggleUserBan(
  userId: string,
  isBanned: boolean
): Promise<void> {
  // Vérification admin côté code (défense en profondeur)
  await requireAdmin();
  
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_banned: isBanned })
    .eq("id", userId);

  if (error) {
    throw new Error(`Erreur modification statut: ${error.message}`);
  }
}

/**
 * Récupérer les véhicules d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Liste des véhicules
 */
export async function getUserVehicles(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("vehicules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erreur récupération véhicules: ${error.message}`);
  }

  return data || [];
}

/**
 * Mettre à jour le rôle d'un utilisateur (admin uniquement)
 * @param userId - ID de l'utilisateur
 * @param newRole - Nouveau rôle ('particulier' | 'pro' | 'admin')
 */
export async function updateUserRole(
  userId: string,
  newRole: "particulier" | "pro" | "admin"
): Promise<void> {
  // Vérification admin côté code (défense en profondeur)
  await requireAdmin();
  
  const supabase = createClient();
  
  // Vérifier que l'utilisateur n'essaie pas de modifier son propre rôle
  const { data: { user } } = await supabase.auth.getUser();
  if (user && user.id === userId) {
    throw new Error("Vous ne pouvez pas modifier votre propre rôle");
  }

  // Vérifier qu'on ne modifie pas un autre admin (protection)
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (targetUser?.role === "admin" && newRole !== "admin") {
    // Protection : ne pas permettre de dégrader un autre admin
    throw new Error("Vous ne pouvez pas modifier le rôle d'un autre administrateur");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) {
    throw new Error(`Erreur modification rôle: ${error.message}`);
  }
}

