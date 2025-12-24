// RedZone - Fonctions utilitaires pour créer des notifications typées
// Centralise la logique de création de notifications pour éviter la duplication

import { createNotification } from "./notifications-server";
import { createClient } from "./server";
import type { Vehicule } from "./types";

/**
 * Notifier une baisse de prix sur un véhicule en favoris
 */
export async function notifyPriceDrop(
  vehicleId: string,
  oldPrice: number,
  newPrice: number,
  vehicle: { brand: string; model: string }
): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Récupérer tous les utilisateurs qui ont ce véhicule en favoris
    const { data: favorites, error } = await supabase
      .from("favorites")
      .select("user_id")
      .eq("vehicle_id", vehicleId);
    
    if (error) {
      console.error("Erreur récupération favoris pour notification:", error);
      return;
    }
    
    if (!favorites || favorites.length === 0) {
      return; // Pas de favoris, pas de notification
    }
    
    const priceDrop = oldPrice - newPrice;
    const priceDropPercent = ((priceDrop / oldPrice) * 100).toFixed(1);
    
    // Notifier chaque utilisateur
    const notifications = favorites.map((favorite) =>
      createNotification(
        favorite.user_id,
        "💰 Prix réduit sur un favori !",
        `Le ${vehicle.brand} ${vehicle.model} que vous suivez a baissé de ${priceDrop.toLocaleString("fr-BE")}€ (${priceDropPercent}%) ! Nouveau prix : ${newPrice.toLocaleString("fr-BE")}€`,
        "success",
        `/cars/${vehicleId}`,
        {
          vehicule_id: vehicleId,
          action: "price_drop",
          old_price: oldPrice,
          new_price: newPrice,
          drop_amount: priceDrop,
          drop_percent: parseFloat(priceDropPercent),
        }
      )
    );
    
    await Promise.all(notifications);
  } catch (error) {
    console.error("Erreur notification baisse de prix:", error);
    // Ne pas bloquer si la notification échoue
  }
}

/**
 * Notifier les propriétaires de véhicules similaires qu'un nouveau véhicule a été ajouté
 */
export async function notifySimilarVehicle(
  newVehicleId: string,
  newVehicle: { brand: string; model: string }
): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Récupérer tous les véhicules similaires (même marque et modèle) actifs
    const { data: similarVehicles, error } = await supabase
      .from("vehicles")
      .select("id, owner_id")
      .eq("brand", newVehicle.brand)
      .eq("model", newVehicle.model)
      .eq("status", "active")
      .neq("id", newVehicleId)
      .not("owner_id", "is", null);
    
    if (error) {
      console.error("Erreur récupération véhicules similaires:", error);
      return;
    }
    
    if (!similarVehicles || similarVehicles.length === 0) {
      return; // Pas de véhicules similaires
    }
    
    // Grouper par owner_id pour éviter les doublons
    const uniqueOwners = new Set(
      similarVehicles.map((v) => v.owner_id).filter((id): id is string => id !== null)
    );
    
    // Notifier chaque propriétaire unique
    const notifications = Array.from(uniqueOwners).map((ownerId) =>
      createNotification(
        ownerId,
        "Nouveau véhicule similaire",
        `Un nouveau ${newVehicle.brand} ${newVehicle.model} vient d'être ajouté au Showroom !`,
        "info",
        `/cars/${newVehicleId}`,
        {
          vehicule_id: newVehicleId,
          action: "similar_vehicle",
          brand: newVehicle.brand,
          model: newVehicle.model,
        }
      )
    );
    
    await Promise.all(notifications);
  } catch (error) {
    console.error("Erreur notification véhicule similaire:", error);
    // Ne pas bloquer si la notification échoue
  }
}

/**
 * Notifier les admins et modérateurs d'une nouvelle annonce à modérer
 */
export async function notifyNewVehicleToModerate(
  vehicleId: string,
  vehicle: { brand: string; model: string }
): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Récupérer tous les admins et modérateurs
    const { data: admins, error } = await supabase
      .from("profiles")
      .select("id")
      .in("role", ["admin", "moderator"]);
    
    if (error) {
      console.error("Erreur récupération admins:", error);
      return;
    }
    
    if (!admins || admins.length === 0) {
      return; // Pas d'admins
    }
    
    // Notifier chaque admin/moderator
    const notifications = admins.map((admin) =>
      createNotification(
        admin.id,
        "Nouvelle annonce à modérer",
        `Une nouvelle annonce ${vehicle.brand} ${vehicle.model} attend votre validation.`,
        "info",
        `/admin?tab=moderation`,
        {
          vehicule_id: vehicleId,
          action: "pending_moderation",
          brand: vehicle.brand,
          model: vehicle.model,
        }
      )
    );
    
    await Promise.all(notifications);
  } catch (error) {
    console.error("Erreur notification nouvelle annonce:", error);
    // Ne pas bloquer si la notification échoue
  }
}

/**
 * Notifier les utilisateurs qui ont un véhicule en favoris qu'il a été supprimé
 */
export async function notifyFavoriteVehicleDeleted(
  vehicleId: string,
  vehicle: { brand: string; model: string }
): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Récupérer tous les utilisateurs qui ont ce véhicule en favoris
    const { data: favorites, error } = await supabase
      .from("favorites")
      .select("user_id")
      .eq("vehicle_id", vehicleId);
    
    if (error) {
      console.error("Erreur récupération favoris:", error);
      return;
    }
    
    if (!favorites || favorites.length === 0) {
      return; // Pas de favoris
    }
    
    // Notifier chaque utilisateur
    const notifications = favorites.map((favorite) =>
      createNotification(
        favorite.user_id,
        "Véhicule favori indisponible",
        `Le ${vehicle.brand} ${vehicle.model} que vous suiviez n'est plus disponible.`,
        "info",
        "/favorites",
        {
          vehicule_id: vehicleId,
          action: "favorite_unavailable",
          brand: vehicle.brand,
          model: vehicle.model,
        }
      )
    );
    
    await Promise.all(notifications);
  } catch (error) {
    console.error("Erreur notification véhicule favori supprimé:", error);
    // Ne pas bloquer si la notification échoue
  }
}

