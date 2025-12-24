import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Route API pour le nettoyage automatique des données expirées
 * Cette route est appelée par un cron job (Vercel Cron ou Supabase Cron)
 * 
 * Exemple d'utilisation avec Vercel Cron :
 * Dans vercel.json :
 * {
 *   "crons": [{
 *     "path": "/api/cleanup-expired-data",
 *     "schedule": "0 0 1 * *"  // Le 1er de chaque mois à minuit
 *   }]
 * }
 * 
 * Sécurité : Protégée par une clé secrète (CLEANUP_SECRET_KEY)
 */
export async function GET(request: Request) {
  try {
    // Vérifier la clé secrète pour sécuriser l'endpoint
    const authHeader = request.headers.get("authorization");
    const secretKey = process.env.CLEANUP_SECRET_KEY;
    
    // Si une clé secrète est configurée, vérifier l'autorisation
    if (secretKey) {
      if (authHeader !== `Bearer ${secretKey}`) {
        // Logger la tentative non autorisée
        try {
          const { logAuditEventServer } = await import("@/lib/supabase/audit-logs");
          const clientIP = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                          request.headers.get("x-real-ip") || 
                          "unknown";
          await logAuditEventServer({
            action_type: "unauthorized_access",
            resource_type: "api",
            resource_id: "/api/cleanup-expired-data",
            description: `Tentative d'accès non autorisée au nettoyage automatique (IP: ${clientIP})`,
            status: "blocked",
            metadata: { ip: clientIP, endpoint: "/api/cleanup-expired-data" },
          }, request);
        } catch (logError) {
          console.error("Erreur lors du logging d'audit:", logError);
        }

        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    // Créer le client Supabase
    const supabase = await createClient();

    // Exécuter la fonction de nettoyage
    const { data, error } = await supabase.rpc("cleanup_all_expired_data");

    if (error) {
      console.error("Erreur lors du nettoyage automatique:", error);
      
      // Logger l'erreur
      try {
        const { logError } = await import("@/lib/supabase/logs");
        await logError(
          "Erreur lors du nettoyage automatique des données expirées",
          undefined,
          { error: error.message, stack: error.stack }
        );
      } catch (logError) {
        console.error("Erreur lors du logging:", logError);
      }

      return NextResponse.json(
        {
          success: false,
          error: error.message || "Erreur lors du nettoyage",
        },
        { status: 500 }
      );
    }

    // Logger le succès
    try {
      const { logInfo } = await import("@/lib/supabase/logs");
      await logInfo(
        "Nettoyage automatique des données expirées effectué avec succès",
        undefined,
        { 
          audit_logs_deleted: data?.[0]?.audit_logs_deleted || 0,
          profiles_deleted: data?.[0]?.profiles_deleted || 0,
          vehicules_deleted: data?.[0]?.vehicules_deleted || 0,
          notifications_deleted: data?.[0]?.notifications_deleted || 0,
          saved_searches_deleted: data?.[0]?.saved_searches_deleted || 0,
          app_logs_deleted: data?.[0]?.app_logs_deleted || 0,
        }
      );
    } catch (logError) {
      console.error("Erreur lors du logging:", logError);
    }

    return NextResponse.json({
      success: true,
      message: "Nettoyage automatique effectué avec succès",
      data: data?.[0] || {},
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur critique lors du nettoyage automatique:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

