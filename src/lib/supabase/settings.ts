// RedZone - Actions Supabase pour les Réglages Site

import { createClient } from "./client";
import { requireAdmin } from "./auth-utils";

export interface SiteSettings {
  id: string;
  created_at: string;
  updated_at: string;
  banner_message: string;
  maintenance_mode: boolean;
  tva_rate: number;
  site_name: string;
  site_description: string;
  home_title?: string; // Titre H1 de la page d'accueil
}

export interface SiteSettingsUpdate {
  banner_message?: string;
  maintenance_mode?: boolean;
  tva_rate?: number;
  site_name?: string;
  site_description?: string;
  home_title?: string; // Titre H1 de la page d'accueil
}

/**
 * Récupérer les réglages du site
 * @returns Réglages du site
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", "00000000-0000-0000-0000-000000000000")
    .single();

  if (error) {
    console.error("Erreur récupération réglages:", error);
    return null;
  }

  return data as SiteSettings;
}

/**
 * Mettre à jour les réglages du site (admin uniquement)
 * @param updates - Champs à mettre à jour
 */
export async function updateSiteSettings(
  updates: SiteSettingsUpdate
): Promise<void> {
  // Vérification admin côté code (défense en profondeur)
  await requireAdmin();
  
  const supabase = createClient();

  const { error } = await supabase
    .from("site_settings")
    .update(updates)
    .eq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    throw new Error(`Erreur mise à jour réglages: ${error.message}`);
  }
}

/**
 * Récupérer les stats admin
 * @returns Stats admin
 */
export async function getAdminStats(): Promise<{
  total_vehicles: number;
  pending_vehicles: number;
  active_vehicles: number;
  rejected_vehicles: number;
  total_users: number;
} | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_admin_stats");

  if (error) {
    console.error("Erreur récupération stats:", error);
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0] as {
    total_vehicles: number;
    pending_vehicles: number;
    active_vehicles: number;
    rejected_vehicles: number;
    total_users: number;
  };
}

