// RedZone - Fonctions pour gérer les favoris dans la base de données
// Migration depuis localStorage vers Supabase

import { createClient } from "./client";

/**
 * Ajouter un véhicule aux favoris
 */
export async function addFavorite(vehicleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Vous devez être connecté pour ajouter aux favoris" };
    }

    const { error } = await supabase
      .from("favorites")
      .insert({
        user_id: user.id,
        vehicle_id: vehicleId,
      });

    if (error) {
      // Si l'erreur est due à une contrainte unique, le favori existe déjà
      if (error.code === "23505") {
        return { success: true }; // Déjà en favoris, considérer comme succès
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

/**
 * Retirer un véhicule des favoris
 */
export async function removeFavorite(vehicleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("vehicle_id", vehicleId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

/**
 * Vérifier si un véhicule est en favoris
 */
export async function isFavorite(vehicleId: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("vehicle_id", vehicleId)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Récupérer tous les favoris d'un utilisateur
 */
export async function getUserFavorites(): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("vehicle_id")
      .eq("user_id", user.id);

    if (error || !data) {
      return [];
    }

    return data.map((f) => f.vehicle_id);
  } catch (error) {
    return [];
  }
}

/**
 * Migrer les favoris du localStorage vers la base de données
 * À appeler une fois lors de la connexion
 */
export async function migrateFavoritesFromLocalStorage(): Promise<{ success: boolean; migrated: number }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, migrated: 0 };
    }

    // Récupérer les favoris du localStorage
    const storedFavorites = localStorage.getItem("certicar_favorites");
    if (!storedFavorites) {
      return { success: true, migrated: 0 };
    }

    let favoriteIds: string[] = [];
    try {
      favoriteIds = JSON.parse(storedFavorites);
    } catch {
      return { success: true, migrated: 0 };
    }

    if (!Array.isArray(favoriteIds) || favoriteIds.length === 0) {
      return { success: true, migrated: 0 };
    }

    // Vérifier quels favoris n'existent pas déjà en DB
    const { data: existingFavorites } = await supabase
      .from("favorites")
      .select("vehicle_id")
      .eq("user_id", user.id)
      .in("vehicle_id", favoriteIds);

    const existingIds = new Set(existingFavorites?.map((f) => f.vehicle_id) || []);
    const newFavorites = favoriteIds.filter((id) => !existingIds.has(id));

    if (newFavorites.length === 0) {
      // Supprimer le localStorage après migration réussie
      localStorage.removeItem("certicar_favorites");
      return { success: true, migrated: 0 };
    }

    // Insérer les nouveaux favoris
    const favoritesToInsert = newFavorites.map((vehicleId) => ({
      user_id: user.id,
      vehicle_id: vehicleId,
    }));

    const { error } = await supabase
      .from("favorites")
      .insert(favoritesToInsert);

    if (error) {
      console.error("Erreur migration favoris:", error);
      return { success: false, migrated: 0 };
    }

    // Supprimer le localStorage après migration réussie
    localStorage.removeItem("certicar_favorites");

    return { success: true, migrated: newFavorites.length };
  } catch (error) {
    console.error("Erreur migration favoris:", error);
    return { success: false, migrated: 0 };
  }
}

