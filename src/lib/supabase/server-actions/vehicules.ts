"use server";

// Octane98 - Server Actions pour les Véhicules avec revalidation globale du cache

import { revalidatePath } from "next/cache";
import { createClient } from "../server";
import { 
  approveVehicule as approveVehiculeBase, 
  rejectVehicule as rejectVehiculeBase,
  createVehicule as createVehiculeBase,
  updateVehicule as updateVehiculeBase,
  deleteVehicule as deleteVehiculeBase,
  getVehiculeById
} from "../vehicules";
import type { VehiculeInsert, VehiculeUpdate } from "../types";
import { createNotification } from "../notifications-server";
import { notifyNewVehicleToModerate, notifySimilarVehicle, notifyPriceDrop, notifyFavoriteVehicleDeleted } from "../notifications-helpers";

/**
 * Invalider TOUT le cache du site (cascade complète)
 */
function invalidateAllCache() {
  // Invalider le layout racine (invalide toutes les pages)
  revalidatePath('/', 'layout');
  // Invalider les pages spécifiques pour être sûr
  revalidatePath("/");
  revalidatePath("/recherche"); // Page de recherche
  revalidatePath("/search"); // Alias pour compatibilité
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/cars");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/users");
  // Invalider aussi les routes dynamiques
  revalidatePath("/cars", "page"); // Toutes les pages /cars/[id]
}

/**
 * Créer un véhicule (avec revalidation globale)
 * IMPORTANT: Utilise le client serveur pour avoir les bonnes permissions RLS
 */
export async function createVehicule(
  vehicule: Omit<VehiculeInsert, "id" | "user_id" | "status" | "created_at" | "guest_email">,
  userId: string | null = null,
  guestEmail: string | null = null
): Promise<string> {
  // Créer le client serveur pour avoir les bonnes permissions RLS
  const supabase = await createClient();
  
  // Passer le client serveur à createVehiculeBase
  const id = await createVehiculeBase(vehicule, userId, guestEmail, supabase);
  
  // Notifier les admins/moderators d'une nouvelle annonce à modérer
  await notifyNewVehicleToModerate(id, {
    brand: vehicule.brand || "Véhicule",
    model: vehicule.model || "",
  });
  
  // Invalider tout le cache pour que la nouvelle annonce apparaisse partout
  invalidateAllCache();
  
  return id;
}

/**
 * Mettre à jour un véhicule (avec revalidation globale)
 * IMPORTANT: Utilise le client serveur pour avoir les bonnes permissions RLS
 */
export async function updateVehicule(
  id: string,
  updates: VehiculeUpdate
): Promise<void> {
  // Créer le client serveur pour avoir les bonnes permissions RLS
  const supabase = await createClient();
  
  // Récupérer le véhicule avant mise à jour pour détecter les changements
  const oldVehicule = await getVehiculeById(id);
  
  // Passer le client serveur à updateVehiculeBase
  await updateVehiculeBase(id, updates, supabase);
  
  // Détecter les changements et notifier si nécessaire
  if (oldVehicule) {
    // Notification de modification de prix
    if (updates.price && updates.price !== oldVehicule.price) {
      const priceDiff = updates.price - oldVehicule.price;
      const priceDiffPercent = ((priceDiff / oldVehicule.price) * 100).toFixed(1);
      
      // Notifier le propriétaire
      if (oldVehicule.owner_id) {
        await createNotification(
          oldVehicule.owner_id,
          "Prix modifié",
          `Le prix de votre ${oldVehicule.brand} ${oldVehicule.model} a été modifié de ${oldVehicule.price.toLocaleString("fr-BE")}€ à ${updates.price.toLocaleString("fr-BE")}€ (${priceDiff > 0 ? '+' : ''}${priceDiffPercent}%)`,
          "info",
          `/cars/${id}`,
          { vehicule_id: id, action: "price_update", old_price: oldVehicule.price, new_price: updates.price }
        );
      }
      
      // Si le prix baisse, notifier les utilisateurs qui ont ce véhicule en favoris
      if (updates.price < oldVehicule.price) {
        await notifyPriceDrop(
          id,
          oldVehicule.price,
          updates.price,
          {
            brand: oldVehicule.brand,
            model: oldVehicule.model,
          }
        );
      }
    }
  }
  
  // Invalider tout le cache
  invalidateAllCache();
}

/**
 * Supprimer un véhicule (avec revalidation globale)
 */
export async function deleteVehicule(id: string): Promise<void> {
  // Récupérer les infos du véhicule avant suppression pour les notifications
  const vehicule = await getVehiculeById(id);
  
  await deleteVehiculeBase(id);
  
  // Notifier le propriétaire
  if (vehicule && vehicule.owner_id) {
    await createNotification(
      vehicule.owner_id,
      "Annonce supprimée",
      `Votre annonce ${vehicule.brand} ${vehicule.model} a été supprimée.`,
      "info",
      "/dashboard",
      { vehicule_id: id, action: "delete" }
    );
  }
  
  // Notifier les utilisateurs qui ont ce véhicule en favoris
  if (vehicule) {
    await notifyFavoriteVehicleDeleted(id, {
      brand: vehicule.brand,
      model: vehicule.model,
    });
  }
  
  // Invalider tout le cache
  invalidateAllCache();
}

/**
 * Approuver un véhicule (avec revalidation globale)
 */
export async function approveVehicule(id: string) {
  // Créer le client serveur pour avoir les bonnes permissions RLS
  const supabase = await createClient();
  
  // Récupérer les infos du véhicule avant validation pour la notification
  const vehicule = await getVehiculeById(id);
  
  // Passer le client serveur pour avoir les bonnes permissions RLS
  await approveVehiculeBase(id, supabase);
  
  // Créer une notification pour le propriétaire du véhicule
  if (vehicule && vehicule.owner_id) {
    await createNotification(
      vehicule.owner_id,
      "Annonce validée ✓",
      `Votre ${vehicule.brand || 'véhicule'} ${vehicule.model || ''} est maintenant en ligne dans le Showroom !`,
      "success",
      `/cars/${id}`,
      { vehicule_id: id, action: "approve" }
    );
  }
  
  // Notifier les propriétaires de véhicules similaires
  if (vehicule) {
    await notifySimilarVehicle(id, {
      brand: vehicule.brand,
      model: vehicule.model,
    });
  }
  
  // Invalider tout le cache pour que l'annonce apparaisse sur l'accueil
  invalidateAllCache();
  
  return { success: true };
}

/**
 * Rejeter un véhicule (avec revalidation globale)
 * @param id - ID du véhicule
 * @param rejectionReason - Motif du refus (optionnel)
 */
export async function rejectVehicule(id: string, rejectionReason?: string) {
  // Créer le client serveur pour avoir les bonnes permissions RLS
  const supabase = await createClient();
  
  // Récupérer les infos du véhicule avant rejet pour la notification
  const vehicule = await getVehiculeById(id);
  
  // Passer le client serveur pour avoir les bonnes permissions RLS
  await rejectVehiculeBase(id, rejectionReason, supabase);

  // Créer une notification pour le propriétaire du véhicule
  if (vehicule && vehicule.owner_id) {
    const reasonText = rejectionReason ? ` Motif : ${rejectionReason}` : "";
    await createNotification(
      vehicule.owner_id,
      "Annonce refusée",
      `Votre annonce pour ${vehicule.brand || 'véhicule'} ${vehicule.model || ''} a été refusée.${reasonText}`,
      "error",
      `/dashboard`, // Rediriger vers le dashboard pour voir ses annonces
      { vehicule_id: id, action: "reject", rejection_reason: rejectionReason || null }
    );
  }

  // Invalider tout le cache
  invalidateAllCache();

  return { success: true };
}

/**
 * Sauvegarder un véhicule (CREATE ou UPDATE selon la présence d'un ID)
 * @param vehiculeId - ID du véhicule (null pour création, string pour mise à jour)
 * @param vehicule - Données du véhicule
 * @param userId - ID de l'utilisateur (optionnel si invité)
 * @param guestEmail - Email de l'invité (obligatoire si userId est null)
 * @returns ID du véhicule
 */
export async function saveVehicle(
  vehiculeId: string | null,
  vehicule: Omit<VehiculeInsert, "id" | "user_id" | "status" | "created_at" | "guest_email">,
  userId: string | null = null,
  guestEmail: string | null = null
): Promise<string> {
  // Créer le client serveur pour avoir les bonnes permissions RLS
  const supabase = await createClient();
  
  // Si vehiculeId existe, c'est une mise à jour
  if (vehiculeId) {
    // Utiliser directement les colonnes anglaises (VehiculeUpdate utilise maintenant les colonnes anglaises)
    const updates: VehiculeUpdate = {
      type: vehicule.type,
      brand: vehicule.brand,
      model: vehicule.model,
      price: vehicule.price,
      year: vehicule.year,
      mileage: vehicule.mileage,
      fuel_type: vehicule.fuel_type,
      transmission: vehicule.transmission,
      body_type: vehicule.body_type,
      power_hp: vehicule.power_hp,
      condition: vehicule.condition,
      euro_standard: vehicule.euro_standard,
      car_pass: vehicule.car_pass,
      image: vehicule.image,
      images: vehicule.images,
      description: vehicule.description,
      engine_architecture: vehicule.engine_architecture,
      admission: vehicule.admission,
      zero_a_cent: vehicule.zero_a_cent,
      co2: vehicule.co2,
      poids_kg: vehicule.poids_kg,
      fiscal_horsepower: vehicule.fiscal_horsepower,
      audio_file: vehicule.audio_file,
      history: vehicule.history,
      car_pass_url: vehicule.car_pass_url,
      is_manual_model: vehicule.is_manual_model,
      phone: vehicule.phone,
      contact_email: vehicule.contact_email,
      contact_methods: vehicule.contact_methods,
      city: vehicule.city,
      postal_code: vehicule.postal_code,
      interior_color: vehicule.interior_color,
      seats_count: vehicule.seats_count,
      // Nouveaux champs pour taxes
      displacement_cc: (vehicule as any).displacement_cc,
      co2_wltp: (vehicule as any).co2_wltp,
      first_registration_date: (vehicule as any).first_registration_date,
      is_hybrid: (vehicule as any).is_hybrid,
      is_electric: (vehicule as any).is_electric,
      region_of_registration: (vehicule as any).region_of_registration,
      // Nouveaux champs pour véhicules sportifs
      drivetrain: (vehicule as any).drivetrain,
      top_speed: (vehicule as any).top_speed,
      torque_nm: (vehicule as any).torque_nm,
      engine_configuration: (vehicule as any).engine_configuration,
      number_of_cylinders: (vehicule as any).number_of_cylinders,
      redline_rpm: (vehicule as any).redline_rpm,
      limited_edition: (vehicule as any).limited_edition,
      number_produced: (vehicule as any).number_produced,
      racing_heritage: (vehicule as any).racing_heritage,
      modifications: (vehicule as any).modifications,
      track_ready: (vehicule as any).track_ready,
      warranty_remaining: (vehicule as any).warranty_remaining,
      service_history_count: (vehicule as any).service_history_count,
    };

    // Passer le client serveur pour avoir les bonnes permissions RLS
    await updateVehiculeBase(vehiculeId, updates, supabase);
    return vehiculeId;
  } else {
    // Sinon, c'est une création
    // Passer le client serveur pour avoir les bonnes permissions RLS
    return await createVehiculeBase(vehicule, userId, guestEmail, supabase);
  }
}

