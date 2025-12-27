import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * API Route pour l'inscription à la waiting list
 * Utilise la SUPABASE_SERVICE_ROLE_KEY pour contourner les politiques RLS
 */
export async function POST(request: NextRequest) {
  try {
    // Récupération des données JSON
    const { email } = await request.json();

    // Validation de base
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: "Adresse email invalide" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    console.log("[API Subscribe] 🚀 Début inscription:", {
      email: normalizedEmail,
      timestamp: new Date().toISOString(),
    });

    // Vérification des variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("[API Subscribe] ❌ Variables d'environnement manquantes");
      return NextResponse.json(
        { success: false, error: "Configuration serveur invalide" },
        { status: 500 }
      );
    }

    // Création du client admin avec la service role key
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Insertion dans la table waiting_list
    const { error: insertError } = await supabase
      .from("waiting_list")
      .insert({
        email: normalizedEmail,
        source: "website",
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
    console.error("[API Subscribe] ❌ ERREUR CRITIQUE:", {
      error: error?.message || "Erreur inconnue",
      stack: error?.stack,
    });

    return NextResponse.json(
      { success: false, error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}