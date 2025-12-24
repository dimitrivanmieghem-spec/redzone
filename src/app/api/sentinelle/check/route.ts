import { NextResponse } from "next/server";
import { checkSentinelleAlerts } from "@/app/actions/sentinelle-alerts";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
// Import dynamique pour éviter les problèmes avec next/headers dans le bundle client

/**
 * Route API pour vérifier les alertes Sentinelle
 * Cette route peut être appelée par un cron job (ex: Vercel Cron, Supabase Edge Function)
 * 
 * Exemple d'utilisation avec Vercel Cron :
 * Dans vercel.json :
 * {
 *   "crons": [{
 *     "path": "/api/sentinelle/check",
 *     "schedule": "0 * * * *"  // Toutes les heures
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Rate limiting pour protéger contre les abus
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(`sentinelle_check_${clientIP}`, {
      windowMs: 60 * 60 * 1000, // 1 heure
      maxRequests: 10, // 10 requêtes par heure
    });

    if (!rateLimit.allowed) {
      // Logger la tentative bloquée
      const { logAuditEventServer } = await import("@/lib/supabase/audit-logs");
      await logAuditEventServer({
        action_type: "unauthorized_access",
        resource_type: "api",
        resource_id: "/api/sentinelle/check",
        description: `Tentative d'accès bloquée par rate limiting (IP: ${clientIP})`,
        status: "blocked",
        metadata: { ip: clientIP, endpoint: "/api/sentinelle/check" },
      }, request);

      return NextResponse.json(
        { 
          error: "Too many requests",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Vérifier une clé secrète pour sécuriser l'endpoint (optionnel)
    const authHeader = request.headers.get("authorization");
    const secretKey = process.env.SENTINELLE_SECRET_KEY;
    
    if (secretKey && authHeader !== `Bearer ${secretKey}`) {
      // Logger la tentative non autorisée
      const { logAuditEventServer } = await import("@/lib/supabase/audit-logs");
      await logAuditEventServer({
        action_type: "unauthorized_access",
        resource_type: "api",
        resource_id: "/api/sentinelle/check",
        description: `Tentative d'accès non autorisée (mauvaise clé secrète)`,
        status: "blocked",
        metadata: { ip: clientIP, endpoint: "/api/sentinelle/check" },
      }, request);

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await checkSentinelleAlerts();

    return NextResponse.json({
      success: true,
      processed: result.processed,
      notified: result.notified,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur checkSentinelleAlerts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

