// RedZone - Actions Supabase pour les Réglages Site
// REFACTORING: Gestion d'erreur exhaustive avec logging détaillé

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
  home_title?: string;
}

export interface SiteSettingsUpdate {
  banner_message?: string;
  maintenance_mode?: boolean;
  tva_rate?: number;
  site_name?: string;
  site_description?: string;
  home_title?: string;
}

/**
 * Log une erreur de manière exhaustive pour le diagnostic
 */
function logError(
  context: string,
  table: string,
  operation: string,
  error: any,
  params?: Record<string, any>
) {
  const errorDetails = {
    context,
    table,
    operation,
    timestamp: new Date().toISOString(),
    error: {
      message: error?.message || 'Pas de message',
      code: error?.code || 'Pas de code',
      details: error?.details || null,
      hint: error?.hint || null,
      statusCode: error?.statusCode || null,
    },
    params: params || {},
    rawError: error ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2) : '{}',
  };

  console.error(`❌ [${context}] Erreur ${operation} sur ${table}:`, errorDetails);

  // Détection spécifique des erreurs RLS
  const errorMessage = String(error?.message || '').toLowerCase();
  const errorCode = String(error?.code || '');

  if (
    errorCode === 'PGRST116' ||
    errorMessage.includes('permission denied') ||
    errorMessage.includes('rls') ||
    errorMessage.includes('row-level security') ||
    errorMessage.includes('new row violates row-level security')
  ) {
    console.error(`🔒 [${context}] BLOQUAGE RLS DÉTECTÉ sur ${table}`);
    console.error(`   → Vérifiez que la politique "public_read_settings" existe`);
    console.error(`   → Code erreur: ${errorCode}`);
  }
}

/**
 * Récupérer les réglages du site
 * @returns Réglages du site ou null en cas d'erreur
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  const context = 'getSiteSettings';
  const table = 'site_settings';
  const operation = 'SELECT *';
  const settingsId = '00000000-0000-0000-0000-000000000000';
  
  const supabase = createClient();

  try {
    console.log(`🔍 [${context}] Récupération des réglages (id: ${settingsId})`);
    
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", settingsId)
      .single();

    if (error) {
      logError(context, table, operation, error, { settingsId });
      return null;
    }

    if (!data) {
      console.warn(`⚠️ [${context}] Aucune donnée retournée (data = null)`);
      return null;
    }

    // Validation des champs requis
    if (
      typeof data.banner_message !== 'string' ||
      typeof data.maintenance_mode !== 'boolean' ||
      typeof data.tva_rate !== 'number'
    ) {
      console.error(`❌ [${context}] Données invalides retournées:`, data);
      return null;
    }

    console.log(`✅ [${context}] Réglages récupérés:`, {
      maintenance_mode: data.maintenance_mode,
      tva_rate: data.tva_rate,
      site_name: data.site_name
    });

    return data as SiteSettings;
  } catch (err) {
    logError(context, table, operation, err, { settingsId });
    return null;
  }
}

/**
 * Mettre à jour les réglages du site (admin uniquement)
 * @param updates - Champs à mettre à jour
 * @throws Error si la mise à jour échoue
 */
export async function updateSiteSettings(
  updates: SiteSettingsUpdate
): Promise<void> {
  const context = 'updateSiteSettings';
  const table = 'site_settings';
  const operation = 'UPDATE';
  const settingsId = '00000000-0000-0000-0000-000000000000';
  
  // Vérification admin côté code (défense en profondeur)
  try {
    await requireAdmin();
  } catch (err) {
    console.error(`❌ [${context}] Accès refusé: utilisateur non admin`);
    throw new Error('Accès refusé: droits administrateur requis');
  }
  
  const supabase = createClient();

  try {
    console.log(`🔍 [${context}] Mise à jour des réglages:`, updates);
    
    const { error } = await supabase
      .from(table)
      .update(updates)
      .eq("id", settingsId);

    if (error) {
      logError(context, table, operation, error, { settingsId, updates });
      throw new Error(`Erreur mise à jour réglages: ${error.message}`);
    }

    console.log(`✅ [${context}] Réglages mis à jour avec succès`);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Accès refusé')) {
      throw err;
    }
    logError(context, table, operation, err, { settingsId, updates });
    throw new Error(`Erreur mise à jour réglages: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
  }
}

/**
 * Récupérer les stats admin
 * @returns Stats admin ou null en cas d'erreur
 */
export async function getAdminStats(): Promise<{
  total_vehicles: number;
  pending_vehicles: number;
  active_vehicles: number;
  rejected_vehicles: number;
  total_users: number;
} | null> {
  const context = 'getAdminStats';
  const operation = 'RPC get_admin_stats';
  
  const supabase = createClient();

  try {
    console.log(`🔍 [${context}] Récupération des stats admin`);
    
    const { data, error } = await supabase.rpc("get_admin_stats");

    if (error) {
      const errorDetails = {
        context,
        operation,
        timestamp: new Date().toISOString(),
        error: {
          message: error?.message || 'Pas de message',
          code: error?.code || 'Pas de code',
          details: error?.details || null,
          hint: error?.hint || null,
        },
        rawError: error ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2) : '{}',
      };
      
      console.error(`❌ [${context}] Erreur RPC:`, errorDetails);
      return null;
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn(`⚠️ [${context}] Aucune donnée retournée ou tableau vide`);
      return null;
    }

    const stats = data[0];
    
    // Validation des champs
    if (
      typeof stats.total_vehicles !== 'number' ||
      typeof stats.pending_vehicles !== 'number' ||
      typeof stats.active_vehicles !== 'number'
    ) {
      console.error(`❌ [${context}] Données invalides retournées:`, stats);
      return null;
    }

    console.log(`✅ [${context}] Stats récupérées:`, {
      total_vehicles: stats.total_vehicles,
      active_vehicles: stats.active_vehicles,
      pending_vehicles: stats.pending_vehicles
    });

    return stats as {
      total_vehicles: number;
      pending_vehicles: number;
      active_vehicles: number;
      rejected_vehicles: number;
      total_users: number;
    };
  } catch (err) {
    const errorDetails = {
      context,
      operation,
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Erreur inconnue',
      rawError: err ? JSON.stringify(err, Object.getOwnPropertyNames(err), 2) : '{}',
    };
    
    console.error(`❌ [${context}] Exception:`, errorDetails);
    return null;
  }
}
