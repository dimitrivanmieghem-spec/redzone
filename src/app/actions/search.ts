"use server";

import { createNotification } from "@/lib/supabase/notifications-server";
import { createClient } from "@/lib/supabase/server";
import { saveSearch as saveSearchDB } from "@/lib/supabase/savedSearches";
import type { SavedSearchInsert } from "@/lib/supabase/savedSearches";

/**
 * Sauvegarder une recherche (créer une alerte Sentinelle)
 * Cette fonction sauvegarde réellement la recherche dans saved_searches
 */
export async function saveSearch(
  filters: Record<string, any>,
  searchQuery: string,
  name?: string
): Promise<{ success: boolean; error?: string; searchId?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Vous devez être connecté pour sauvegarder une recherche" };
    }

    // Convertir les filtres de la page search vers le format saved_searches
    const searchData: SavedSearchInsert = {
      name: name || `Recherche ${new Date().toLocaleDateString("fr-BE")}`,
      marque: filters.marque && filters.marque !== "Toutes les marques" ? filters.marque : null,
      modele: filters.modele || null,
      prix_min: filters.prixMin ? parseInt(filters.prixMin) : null,
      prix_max: filters.prixMax ? parseInt(filters.prixMax) : null,
      annee_min: filters.anneeMin ? parseInt(filters.anneeMin) : null,
      annee_max: filters.anneeMax ? parseInt(filters.anneeMax) : null,
      km_max: filters.mileageMax ? parseInt(filters.mileageMax) : null,
      type: filters.type && filters.type.length > 0 ? filters.type : null,
      carburants: filters.carburant ? [filters.carburant] : null,
      transmissions: filters.transmission && filters.transmission.length > 0 ? filters.transmission : null,
      carrosseries: filters.carrosserie && filters.carrosserie.length > 0 ? filters.carrosserie : null,
      norme_euro: filters.normeEuro || null,
      car_pass_only: filters.carPassOnly || false,
      architectures: filters.architectures && filters.architectures.length > 0 ? filters.architectures : null,
      admissions: filters.admissions && filters.admissions.length > 0 ? filters.admissions : null,
      couleur_exterieure: filters.couleurExterieure && filters.couleurExterieure.length > 0 ? filters.couleurExterieure : null,
      couleur_interieure: filters.couleurInterieure && filters.couleurInterieure.length > 0 ? filters.couleurInterieure : null,
      nombre_places: filters.nombrePlaces && filters.nombrePlaces.length > 0 ? filters.nombrePlaces : null,
      is_active: true,
    };

    // Sauvegarder la recherche dans la base de données
    const searchId = await saveSearchDB(searchData);

    // Créer une notification pour confirmer la sauvegarde
    const filterSummary = Object.entries(filters)
      .filter(([_, value]) => value && value !== "" && value !== false && (Array.isArray(value) ? value.length > 0 : true))
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`;
        }
        return `${key}: ${value}`;
      })
      .join(", ");

    const searchDescription = searchQuery
      ? `Recherche: "${searchQuery}"${filterSummary ? ` | Filtres: ${filterSummary}` : ""}`
      : `Filtres: ${filterSummary || "Aucun filtre"}`;

    await createNotification(
      user.id,
      "Alerte Sentinelle créée",
      `Votre recherche "${name || 'Sans nom'}" a été sauvegardée. Vous serez notifié quand de nouveaux véhicules correspondent à vos critères.\n\n${searchDescription}`,
      "success",
      "/dashboard?tab=sentinelle",
      {
        action: "saved_search",
        search_id: searchId,
        filters: filters,
        search_query: searchQuery,
        saved_at: new Date().toISOString(),
      }
    );

    return { success: true, searchId };
  } catch (error) {
    console.error("Erreur sauvegarde recherche:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
