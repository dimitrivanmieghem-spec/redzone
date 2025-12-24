/**
 * RedZone - Système de Logs d'Audit RGPD (Client)
 * Version client pour les composants React
 * 
 * IMPORTANT : Ce fichier ne doit être utilisé QUE dans les composants clients
 */

import { createClient } from "./client";

export type AuditActionType =
  | "data_access"           // Accès aux données personnelles
  | "data_export"          // Export des données (RGPD)
  | "data_deletion"        // Suppression de données (droit à l'oubli)
  | "data_modification"    // Modification de données
  | "login_attempt"        // Tentative de connexion
  | "failed_login"         // Échec de connexion
  | "password_reset"       // Réinitialisation de mot de passe
  | "profile_update"       // Mise à jour du profil
  | "unauthorized_access"  // Tentative d'accès non autorisé
  | "data_export_request"; // Demande d'export de données

export interface AuditLogEntry {
  user_id?: string | null;
  user_email?: string | null;
  action_type: AuditActionType;
  resource_type?: string; // Ex: 'profile', 'vehicule', 'message', 'favorite'
  resource_id?: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  status?: "success" | "failed" | "blocked";
  error_message?: string;
}

/**
 * Logger un événement d'audit (côté client)
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createClient();
    
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    // Récupérer l'IP et le User-Agent depuis le navigateur (si disponible)
    const ipAddress = entry.ip_address || "unknown";
    const userAgent = entry.user_agent || (typeof navigator !== "undefined" ? navigator.userAgent : "unknown");

    const { error } = await supabase.from("audit_logs").insert({
      user_id: entry.user_id || user?.id || null,
      user_email: entry.user_email || user?.email || null,
      action_type: entry.action_type,
      resource_type: entry.resource_type || null,
      resource_id: entry.resource_id || null,
      description: entry.description,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: entry.metadata || {},
      status: entry.status || "success",
      error_message: entry.error_message || null,
    });

    if (error) {
      // Ne pas throw pour éviter les boucles infinies
      // Si la table n'existe pas (PGRST116), afficher un message informatif
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.warn(
          "[Audit] Table audit_logs n'existe pas. " +
          "Veuillez exécuter le script SQL dans supabase/create_audit_logs_table.sql " +
          "pour créer la table. Voir SETUP_AUDIT_LOGS.md pour les instructions."
        );
      } else {
        console.error("[Audit] Erreur lors de l'écriture du log:", error);
      }
    }
  } catch (error) {
    // Fallback silencieux pour éviter les crashes
    // Les erreurs de table manquante sont normales si la table n'a pas encore été créée
    console.warn("[Audit] Erreur lors du logging (table peut-être absente):", error);
  }
}

/**
 * Logger un accès aux données personnelles
 */
export async function logDataAccess(
  resourceType: string,
  resourceId: string,
  description: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    action_type: "data_access",
    resource_type: resourceType,
    resource_id: resourceId,
    description,
    metadata,
  });
}

/**
 * Logger une tentative de connexion échouée
 */
export async function logFailedLogin(
  email: string,
  reason: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    action_type: "failed_login",
    user_email: email,
    description: `Tentative de connexion échouée: ${reason}`,
    ip_address: ipAddress,
    status: "failed",
    metadata: { email, reason },
  });
}

/**
 * Logger une tentative d'accès non autorisé
 */
export async function logUnauthorizedAccess(
  resourceType: string,
  resourceId: string,
  reason: string,
  ipAddress?: string
): Promise<void> {
  await logAuditEvent({
    action_type: "unauthorized_access",
    resource_type: resourceType,
    resource_id: resourceId,
    description: `Tentative d'accès non autorisé: ${reason}`,
    ip_address: ipAddress,
    status: "blocked",
    metadata: { resourceType, resourceId, reason },
  });
}

/**
 * Logger une demande d'export de données (RGPD)
 */
export async function logDataExportRequest(
  userId: string,
  userEmail: string
): Promise<void> {
  await logAuditEvent({
    action_type: "data_export_request",
    user_id: userId,
    user_email: userEmail,
    description: `Demande d'export des données personnelles (RGPD)`,
    metadata: { userId, userEmail },
  });
}

/**
 * Logger une suppression de données (droit à l'oubli RGPD)
 */
export async function logDataDeletion(
  userId: string,
  userEmail: string,
  resourceType: string,
  resourceId: string
): Promise<void> {
  await logAuditEvent({
    action_type: "data_deletion",
    user_id: userId,
    user_email: userEmail,
    resource_type: resourceType,
    resource_id: resourceId,
    description: `Suppression de données (droit à l'oubli RGPD)`,
    metadata: { userId, userEmail, resourceType, resourceId },
  });
}

