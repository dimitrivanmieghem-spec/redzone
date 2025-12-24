"use server";

// RedZone - Server Actions pour les Réglages Site (Admin)

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "../server";
import { requireAdmin } from "../auth-utils-server";
import type { SiteSettingsUpdate } from "../settings";

/**
 * Mettre à jour les réglages du site (admin uniquement)
 * @param updates - Champs à mettre à jour
 */
export async function updateSiteSettings(
  updates: SiteSettingsUpdate
): Promise<void> {
  // Vérification admin avec le client serveur
  const supabase = await createServerClient();
  await requireAdmin(supabase);
  
  const context = 'updateSiteSettings';
  const table = 'site_settings';
  const settingsId = '00000000-0000-0000-0000-000000000000';
  
  const { error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", settingsId);

  if (error) {
    console.error(`❌ [${context}] Erreur mise à jour:`, error);
    throw new Error(`Erreur mise à jour réglages: ${error.message}`);
  }

  // Invalider le cache
  revalidatePath('/', 'layout');
  revalidatePath("/admin/settings");
  revalidatePath("/");
}

