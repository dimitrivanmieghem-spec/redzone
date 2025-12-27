"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * API Route alternative pour l'inscription à la waiting list
 * Utilise le client admin (SERVICE_ROLE_KEY) pour contourner les politiques RLS
 *
 * Cette approche garantit que TOUTE la logique reste côté serveur
 */
export async function POST(request: NextRequest) {
  try {
    // Récupération des données du formulaire
    const { email } = await request.json();

    // Validation basique
    if (!email || !email.includes("@")) {
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

    // Vérification explicite de la variable d'environnement
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[API Subscribe] ❌ SUPABASE_SERVICE_ROLE_KEY manquante");
      return NextResponse.json(
        {
          success: false,
          error: "Configuration serveur invalide. Contactez le support.",
          code: "ENV_MISSING"
        },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();

    // Insertion avec client admin (contourne RLS)
    const { error: insertError } = await supabase
      .from("waiting_list")
      .insert({
        email: normalizedEmail,
        source: "website",
      });

    if (insertError) {
      // Gestion des doublons
      if (insertError.code === "23505") {
        console.log("[API Subscribe] Email déjà présent (doublon):", normalizedEmail);
        return NextResponse.json({
          success: false,
          error: "Vous êtes déjà inscrit à la liste !",
          code: "23505",
          isDuplicate: true
        });
      }

      console.error("[API Subscribe] ERREUR insertion:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: insertError.message || "Erreur lors de l'inscription",
          code: insertError.code
        },
        { status: 500 }
      );
    }

    console.log("[API Subscribe] ✅ Inscription réussie:", normalizedEmail);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[API Subscribe] ❌ ERREUR CRITIQUE:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Erreur lors de l'inscription"
      },
      { status: 500 }
    );
  }
}
