"use server";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Inscrit un email à la waiting list via Server Action
 * Utilise le client admin (SERVICE_ROLE_KEY) pour contourner les politiques RLS
 * 
 * @param email - Email normalisé (trim + lowercase)
 * @returns Résultat de l'inscription avec gestion des doublons
 */
export async function subscribeToWaitingList(
  email: string
): Promise<{
  success: boolean;
  error?: string;
  code?: string;
  isDuplicate?: boolean;
}> {
  // Validation basique
  if (!email || !email.includes("@")) {
    return {
      success: false,
      error: "Adresse email invalide",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Log de debug pour diagnostic
  console.log("[Subscribe Action] 🚀 Début inscription:", {
    email: normalizedEmail,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    timestamp: new Date().toISOString(),
  });

  try {
    // Vérification explicite de la variable d'environnement avant d'appeler createAdminClient
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[Subscribe Action] ❌ SUPABASE_SERVICE_ROLE_KEY manquante dans les variables d'environnement");
      return {
        success: false,
        error: "Configuration serveur invalide. Contactez le support.",
        code: "ENV_MISSING",
      };
    }

    const supabase = createAdminClient();

    // Insérer dans la base de données avec client admin (contourne RLS)
    const { error: insertError } = await supabase
      .from("waiting_list")
      .insert({
        email: normalizedEmail,
        source: "website",
      });

    if (insertError) {
      // Gestion spécifique des doublons (code 23505 = violation contrainte unique)
      if (insertError.code === "23505") {
        console.log("[Subscribe Action] Email déjà présent (doublon):", normalizedEmail);
        return {
          success: false,
          error: "Vous êtes déjà inscrit à la liste !",
          code: "23505",
          isDuplicate: true,
        };
      }

      // Autre erreur
      console.error("[Subscribe Action] ERREUR insertion waiting_list:", {
        email: normalizedEmail,
        error: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      });

      return {
        success: false,
        error: insertError.message || "Erreur lors de l'inscription",
        code: insertError.code,
      };
    }

    // Succès
    console.log("[Subscribe Action] ✅ Inscription réussie:", {
      email: normalizedEmail,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
    };
  } catch (error: any) {
    // Erreur inattendue (exception non gérée)
    console.error("[Subscribe Action] ❌ ERREUR CRITIQUE inscription:", {
      email: normalizedEmail,
      error: error?.message || "Erreur inconnue",
      stack: error?.stack,
    });

    return {
      success: false,
      error: error?.message || "Erreur lors de l'inscription",
    };
  }
}

