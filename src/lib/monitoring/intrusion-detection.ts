/**
 * Octane98 - Détection d'Intrusion
 * Système de monitoring pour détecter les tentatives d'intrusion et activités suspectes
 * 
 * IMPORTANT : Ce fichier est utilisé côté serveur uniquement (middleware, API routes)
 */

import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export interface IntrusionAlert {
  type: "brute_force" | "suspicious_activity" | "unauthorized_access" | "rate_limit_exceeded";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  ipAddress: string;
  metadata?: Record<string, any>;
}

/**
 * Détecter une tentative de force brute (plusieurs échecs de connexion)
 */
export async function detectBruteForce(
  email: string,
  ipAddress: string,
  request?: Request
): Promise<boolean> {
  // Vérifier le rate limit pour cette IP
  const rateLimit = checkRateLimit(`login_${ipAddress}`, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 tentatives max
  });

  if (!rateLimit.allowed) {
    // Tentative de force brute détectée
    const { logUnauthorizedAccess } = await import("@/lib/supabase/audit-logs-client");
    await logUnauthorizedAccess(
      "authentication",
      email,
      `Tentative de force brute détectée (IP: ${ipAddress})`,
      ipAddress
    );

    // Logger une alerte critique (côté serveur)
    const { logAuditEventServer } = await import("@/lib/supabase/audit-logs");
    await logAuditEventServer({
      action_type: "unauthorized_access",
      resource_type: "authentication",
      description: `Tentative de force brute détectée - IP bloquée temporairement`,
      ip_address: ipAddress,
      status: "blocked",
      metadata: {
        email,
        ipAddress,
        type: "brute_force",
        severity: "high",
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      },
    }, request);

    return true; // Force brute détectée
  }

  return false; // Pas de force brute
}

/**
 * Détecter une activité suspecte (accès répétés à des routes protégées)
 */
export async function detectSuspiciousActivity(
  pathname: string,
  ipAddress: string,
  request?: Request
): Promise<boolean> {
  // Vérifier le rate limit pour cette IP sur cette route
  const rateLimit = checkRateLimit(`suspicious_${ipAddress}_${pathname}`, {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 tentatives max
  });

  if (!rateLimit.allowed) {
    // Activité suspecte détectée
    const { logAuditEventServer } = await import("@/lib/supabase/audit-logs");
    await logAuditEventServer({
      action_type: "unauthorized_access",
      resource_type: "route",
      resource_id: pathname,
      description: `Activité suspecte détectée - Accès répétés à ${pathname}`,
      ip_address: ipAddress,
      status: "blocked",
      metadata: {
        pathname,
        ipAddress,
        type: "suspicious_activity",
        severity: "medium",
      },
    }, request);

    return true; // Activité suspecte détectée
  }

  return false; // Pas d'activité suspecte
}

/**
 * Générer une alerte d'intrusion
 */
export async function generateIntrusionAlert(
  alert: IntrusionAlert,
  request?: Request
): Promise<void> {
  // Logger l'alerte dans les logs d'audit (import dynamique pour éviter les problèmes avec next/headers)
  const { logAuditEventServer } = await import("@/lib/supabase/audit-logs");
  await logAuditEventServer({
    action_type: "unauthorized_access",
    resource_type: "security",
    description: alert.description,
    ip_address: alert.ipAddress,
    status: "blocked",
    metadata: {
      ...alert.metadata,
      alertType: alert.type,
      severity: alert.severity,
    },
  }, request);

  // En production, vous pourriez aussi :
  // - Envoyer un email aux administrateurs pour les alertes critiques
  // - Envoyer une notification Slack/Discord
  // - Intégrer avec un système de monitoring externe (Sentry, Datadog, etc.)

  if (alert.severity === "critical" || alert.severity === "high") {
    // Logger également dans app_logs pour visibilité
    try {
      const { logError } = await import("@/lib/supabase/logs");
      await logError(
        `[INTRUSION] ${alert.description}`,
        undefined,
        {
          type: alert.type,
          severity: alert.severity,
          ipAddress: alert.ipAddress,
          ...alert.metadata,
        }
      );
    } catch (error) {
      console.error("Erreur lors du logging d'intrusion:", error);
    }
  }
}

/**
 * Vérifier si une IP est bloquée (blacklist)
 * En production, cette liste pourrait être stockée en base de données
 */
const BLACKLISTED_IPS = new Set<string>();

export function isIPBlacklisted(ipAddress: string): boolean {
  return BLACKLISTED_IPS.has(ipAddress);
}

export function addToBlacklist(ipAddress: string): void {
  BLACKLISTED_IPS.add(ipAddress);
}

export function removeFromBlacklist(ipAddress: string): void {
  BLACKLISTED_IPS.delete(ipAddress);
}

