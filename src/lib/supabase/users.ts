// Octane98 - Actions Supabase pour la Gestion des Utilisateurs (CLIENT SIDE)
// ⚠️ Ce fichier ne doit JAMAIS importer auth-utils-server ou server.ts
// Les fonctions admin sont dans server-actions/users.ts

import { createClient } from "./client";
import type { UserRole } from "@/lib/permissions";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_banned: boolean;
  ban_reason: string | null;
  ban_until: string | null;
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

  // Compter les véhicules (la table vehicles utilise owner_id au lieu de user_id)
  const { count, error: countError } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("owner_id", userId);

  return {
    ...(profile as UserProfile),
    vehicles_count: count || 0,
  };
}

/**
 * Bannir/Débannir un utilisateur (admin uniquement)
 * ⚠️ DEPRECATED - Utilisez banUser/unbanUser depuis server-actions/users.ts
 * Cette fonction est conservée pour compatibilité mais ne doit plus être utilisée
 */
export async function toggleUserBan(
  userId: string,
  isBanned: boolean
): Promise<void> {
  throw new Error("Cette fonction est dépréciée. Utilisez banUser/unbanUser depuis server-actions/users.ts");
}

/**
 * Récupérer les véhicules d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Liste des véhicules
 */
export async function getUserVehicles(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("owner_id", userId) // La table vehicles utilise owner_id
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erreur récupération véhicules: ${error.message}`);
  }

  // Les données doivent être mappées depuis l'anglais vers le français
  // Mais comme cette fonction retourne `any`, on laisse le mapping au niveau supérieur
  return data || [];
}

/**
 * Mettre à jour le rôle d'un utilisateur (admin uniquement)
 * ⚠️ DEPRECATED - Cette fonction doit être déplacée dans server-actions/users.ts
 * Cette fonction est conservée pour compatibilité mais ne doit plus être utilisée
 */
export async function updateUserRole(
  userId: string,
  newRole: "particulier" | "pro" | "admin"
): Promise<void> {
  throw new Error("Cette fonction est dépréciée. Elle doit être déplacée dans server-actions/users.ts");
}

