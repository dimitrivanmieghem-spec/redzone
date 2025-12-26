// Octane98 - Statistiques pour les professionnels

import { createClient } from "./client";

export interface ProStats {
  activeVehicles: number;
  totalFavorites: number;
  totalViews: number; // Pour le futur avec vehicle_stats
  pendingVehicles: number;
  rejectedVehicles: number;
}

/**
 * Récupérer les statistiques d'un professionnel
 * @param userId - ID de l'utilisateur (owner_id dans vehicles)
 * @returns Statistiques du pro
 */
export async function getProStats(userId: string): Promise<ProStats> {
  const supabase = createClient();

  try {
    // Compter les véhicules actifs
    const { count: activeCount, error: activeError } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("status", "active");

    if (activeError) {
      console.error("Erreur count véhicules actifs:", activeError);
    }

    // Compter les véhicules en attente
    const { count: pendingCount, error: pendingError } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("status", "pending");

    if (pendingError) {
      console.error("Erreur count véhicules pending:", pendingError);
    }

    // Compter les véhicules rejetés
    const { count: rejectedCount, error: rejectedError } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("status", "rejected");

    if (rejectedError) {
      console.error("Erreur count véhicules rejected:", rejectedError);
    }

    // Récupérer tous les IDs des véhicules du pro
    const { data: vehiclesData, error: vehiclesError } = await supabase
      .from("vehicles")
      .select("id")
      .eq("owner_id", userId);

    if (vehiclesError) {
      console.error("Erreur récupération véhicules:", vehiclesError);
    }

    const vehicleIds = vehiclesData?.map((v: { id: string }) => v.id) || [];

    // Compter le total des favoris reçus par les véhicules du pro
    let totalFavorites = 0;
    if (vehicleIds.length > 0) {
      // Supabase ne supporte pas .in() avec un tableau vide
      const { count: favoritesCount, error: favoritesError } = await supabase
        .from("favorites")
        .select("*", { count: "exact", head: true })
        .in("vehicle_id", vehicleIds);

      if (favoritesError) {
        console.error("Erreur count favoris:", favoritesError);
      } else {
        totalFavorites = favoritesCount || 0;
      }
    }

    // Compter le total des vues (pour le futur avec vehicle_stats)
    // Pour l'instant, retourner 0 car la table n'existe pas encore
    let totalViews = 0;
    // TODO: Une fois vehicle_stats créée, décommenter :
    // if (vehicleIds.length > 0) {
    //   const { data: viewsData, error: viewsError } = await supabase
    //     .from("vehicle_stats")
    //     .select("view_count")
    //     .in("vehicle_id", vehicleIds);
    //   if (!viewsError && viewsData) {
    //     totalViews = viewsData.reduce((sum, stat) => sum + (stat.view_count || 0), 0);
    //   }
    // }

    return {
      activeVehicles: activeCount || 0,
      totalFavorites: totalFavorites,
      totalViews: totalViews,
      pendingVehicles: pendingCount || 0,
      rejectedVehicles: rejectedCount || 0,
    };
  } catch (error) {
    console.error("Erreur récupération stats pro:", error);
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      activeVehicles: 0,
      totalFavorites: 0,
      totalViews: 0,
      pendingVehicles: 0,
      rejectedVehicles: 0,
    };
  }
}

