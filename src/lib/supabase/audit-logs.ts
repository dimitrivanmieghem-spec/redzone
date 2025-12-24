/**
 * RedZone - Système de Logs d'Audit RGPD (Serveur)
 * Version serveur pour les Server Components, Server Actions, et Route Handlers
 * 
 * IMPORTANT : Ce fichier ne doit être utilisé QUE côté serveur
 * Pour les composants clients, utilisez audit-logs-client.ts
 */

import { createClient } from "./server";

// Réexporter les types depuis le fichier client pour compatibilité
export type {
  AuditActionType,
  AuditLogEntry,
} from "./audit-logs-client";

import type { AuditLogEntry } from "./audit-logs-client";

/**
 * Logger un événement d'audit (côté serveur)
 * Utilise les headers de la requête pour récupérer l'IP et le User-Agent
 * IMPORTANT : Cette fonction ne peut être utilisée que dans des Server Components, Server Actions, ou Route Handlers
 */
export async function logAuditEventServer(
  entry: AuditLogEntry,
  request?: Request
): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    
    // Extraire l'IP et le User-Agent depuis la requête
    let ipAddress = entry.ip_address || "unknown";
    let userAgent = entry.user_agent || "unknown";
    
    if (request) {
      // Essayer plusieurs headers pour l'IP (pour les proxies, load balancers, etc.)
      const forwarded = request.headers.get("x-forwarded-for");
      if (forwarded) {
        ipAddress = forwarded.split(",")[0].trim();
      } else {
        const realIP = request.headers.get("x-real-ip");
        if (realIP) {
          ipAddress = realIP;
        }
      }
      
      userAgent = request.headers.get("user-agent") || "unknown";
    }

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
      console.error("[Audit Server] Erreur lors de l'écriture du log:", error);
    }
  } catch (error) {
    console.error("[Audit Server] Erreur critique lors du logging:", error);
  }
}


