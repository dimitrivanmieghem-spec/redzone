// Octane98 - Fonctions pour récupérer les profils publics

import { createClient } from "./client";
import type { UserRole } from "@/lib/permissions";

export interface PublicProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  garage_name: string | null;
  garage_description: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  bio: string | null;
}

/**
 * Récupérer un profil public par ID
 * @param userId - ID de l'utilisateur
 * @returns Profil public ou null
 */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, avatar_url, garage_name, garage_description, website, address, city, postal_code, phone, bio")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as PublicProfile;
}

/**
 * Récupérer plusieurs profils publics par IDs
 * @param userIds - Liste d'IDs d'utilisateurs
 * @returns Map des profils (userId -> profile)
 */
export async function getPublicProfiles(userIds: string[]): Promise<Map<string, PublicProfile>> {
  const supabase = createClient();

  if (userIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, avatar_url, garage_name, garage_description, website, address, city, postal_code, phone, bio")
    .in("id", userIds);

  if (error || !data) {
    return new Map();
  }

  const profilesMap = new Map<string, PublicProfile>();
  data.forEach((profile: any) => {
    profilesMap.set(profile.id, profile as PublicProfile);
  });

  return profilesMap;
}

