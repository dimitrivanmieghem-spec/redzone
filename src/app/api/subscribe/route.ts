import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * API Route pour l'inscription à la waiting list
 * Utilise la SUPABASE_SERVICE_ROLE_KEY pour contourner les politiques RLS
 */
export async function POST(request: NextRequest) {
  console.log("[API Subscribe] 🔍 Nouvelle requête POST reçue", {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
  });

  // VÉRIFICATION CRITIQUE : Clé de service présente ?
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[API Subscribe] ❌ ERREUR FATALE : SUPABASE_SERVICE_ROLE_KEY manquante !");
    console.error("[API Subscribe] 📋 Variables d'environnement disponibles:", {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
    });
    return NextResponse.json(
      {
        success: false,
        error: "Clé de service manquante - Configuration serveur invalide",
        details: "SUPABASE_SERVICE_ROLE_KEY non trouvée dans les variables d'environnement"
      },
      { status: 500 }
    );
  }

  try {
    // Récupération des données JSON
    let body;
    try {
      body = await request.json();
      console.log("[API Subscribe] 📦 Corps de la requête parsé:", body);
    } catch (parseError) {
      console.error("[API Subscribe] ❌ ERREUR parsing JSON:", parseError);
      return NextResponse.json(
        { success: false, error: "Corps de requête JSON invalide" },
        { status: 400 }
      );
    }

    const { email } = body;

    // Validation de base
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.error("[API Subscribe] ❌ Email invalide:", { email, type: typeof email });
      return NextResponse.json(
        { success: false, error: "Adresse email invalide ou manquante" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    console.log("[API Subscribe] 🚀 Début inscription:", {
      email: normalizedEmail,
      originalLength: email.length,
      normalizedLength: normalizedEmail.length,
      timestamp: new Date().toISOString(),
    });

    // Vérification des variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log("[API Subscribe] 🔧 Variables d'environnement:", {
      supabaseUrlPresent: !!supabaseUrl,
      serviceKeyPresent: !!serviceKey,
      serviceKeyLength: serviceKey?.length,
      serviceKeyPrefix: serviceKey?.substring(0, 10) + "...",
    });

    if (!supabaseUrl) {
      console.error("[API Subscribe] ❌ NEXT_PUBLIC_SUPABASE_URL manquante");
      return NextResponse.json(
        { success: false, error: "URL Supabase manquante" },
        { status: 500 }
      );
    }

    // Création du client admin avec la service role key
    console.log("[API Subscribe] 🔑 Création du client Supabase avec service role...");
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("[API Subscribe] 📝 Tentative d'insertion dans waiting_list...");
    // Insertion dans la table waiting_list
    const { data, error: insertError } = await supabase
      .from("waiting_list")
      .insert({
        email: normalizedEmail,
        source: "website",
      });

    console.log("[API Subscribe] 📊 Résultat de l'insertion:", {
      data,
      error: insertError,
      hasError: !!insertError,
    });

    if (insertError) {
      // Gestion spécifique des doublons (code PostgreSQL 23505)
      if (insertError.code === "23505") {
        console.log("[API Subscribe] Email déjà présent (doublon):", normalizedEmail);
        return NextResponse.json({
          success: false,
          error: "Vous êtes déjà inscrit à la liste !",
          isDuplicate: true
        });
      }

      // Autre erreur
      console.error("[API Subscribe] ERREUR insertion:", {
        email: normalizedEmail,
        error: insertError.message,
        code: insertError.code,
      });

      return NextResponse.json(
        { success: false, error: insertError.message || "Erreur lors de l'inscription" },
        { status: 500 }
      );
    }

    // Succès
    console.log("[API Subscribe] ✅ Inscription réussie:", normalizedEmail);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    // LOG DÉTAILLÉ DE L'ERREUR POUR DIAGNOSTIC
    console.error("=".repeat(80));
    console.error("[API Subscribe] ❌ ERREUR CRITIQUE DÉTECTÉE");
    console.error("=".repeat(80));
    console.error("DÉTAIL ERREUR SERVEUR:", {
      message: error?.message || "Message d'erreur non disponible",
      name: error?.name || "Nom d'erreur non disponible",
      code: error?.code || "Code d'erreur non disponible",
      stack: error?.stack || "Stack trace non disponible",
      timestamp: new Date().toISOString(),
      requestUrl: request.url,
      requestMethod: request.method,
    });

    // Log supplémentaire pour les erreurs Supabase spécifiques
    if (error?.code) {
      console.error("[API Subscribe] 📋 Code d'erreur PostgreSQL/Supabase:", error.code);
    }

    // Log des headers de la requête pour debug
    const headers = Object.fromEntries(request.headers.entries());
    console.error("[API Subscribe] 📋 Headers de la requête:", headers);

    console.error("=".repeat(80));

    // Réponse avec message d'erreur précis
    return NextResponse.json(
      {
        success: false,
        error: `Erreur serveur: ${error?.message || "Erreur inconnue"}`,
        code: error?.code || "UNKNOWN_ERROR",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}