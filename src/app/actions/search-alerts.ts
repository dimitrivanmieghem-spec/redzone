"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Créer une alerte de recherche pour l'utilisateur connecté
 * @param criteria - Les critères de recherche au format JSONB
 * @returns { success: boolean, error?: string, alertId?: string }
 */
export async function createSearchAlert(criteria: Record<string, any>) {
  try {
    const supabase = await createClient();

    // Vérifier que l'utilisateur est connecté
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Vous devez être connecté pour créer une alerte",
      };
    }

    // Nettoyer les critères : supprimer les valeurs vides
    const cleanedCriteria: Record<string, any> = {};
    for (const [key, value] of Object.entries(criteria)) {
      // Ignorer les valeurs vides, null, undefined, tableaux vides
      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0) &&
        !(typeof value === "boolean" && value === false && key !== "carPassOnly")
      ) {
        cleanedCriteria[key] = value;
      }
    }

    // Vérifier qu'il y a au moins un critère
    if (Object.keys(cleanedCriteria).length === 0) {
      return {
        success: false,
        error: "Veuillez définir au moins un critère de recherche",
      };
    }

    // Insérer l'alerte
    const { data, error } = await supabase
      .from("search_alerts")
      .insert({
        user_id: user.id,
        criteria: cleanedCriteria,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Erreur création alerte:", error);
      return {
        success: false,
        error: error.message || "Erreur lors de la création de l'alerte",
      };
    }

    // Revalider la page pour mettre à jour les alertes affichées
    revalidatePath("/dashboard");
    revalidatePath("/search");

    return {
      success: true,
      alertId: data.id,
    };
  } catch (error: any) {
    console.error("Erreur création alerte:", error);
    return {
      success: false,
      error: error?.message || "Erreur inconnue lors de la création de l'alerte",
    };
  }
}

