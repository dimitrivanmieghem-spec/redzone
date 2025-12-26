"use server";

// Octane98 - Système d'alertes automatiques pour les recherches sauvegardées (Sentinelle)
// Cette fonction doit être appelée périodiquement (cron job, edge function, etc.)

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/supabase/notifications-server";
import { searchVehicules } from "@/lib/supabase/search";

/**
 * Vérifier toutes les recherches sauvegardées actives et envoyer des notifications
 * Cette fonction doit être appelée périodiquement (ex: toutes les heures)
 */
export async function checkSentinelleAlerts(): Promise<{ processed: number; notified: number }> {
  try {
    const supabase = await createClient();

    // Récupérer toutes les recherches actives
    const { data: savedSearches, error: searchesError } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("is_active", true);

    if (searchesError || !savedSearches) {
      console.error("Erreur récupération recherches:", searchesError);
      return { processed: 0, notified: 0 };
    }

    let notifiedCount = 0;

    // Pour chaque recherche, vérifier s'il y a de nouveaux véhicules
    for (const search of savedSearches) {
      try {
        // Convertir la recherche sauvegardée en filtres de recherche
        const filters = {
          marque: search.marque || undefined,
          modele: search.modele || undefined,
          prixMin: search.prix_min || undefined,
          prixMax: search.prix_max || undefined,
          anneeMin: search.annee_min || undefined,
          anneeMax: search.annee_max || undefined,
          kmMax: search.km_max || undefined,
          type: search.type && search.type.length > 0 ? search.type : undefined,
          carburants: search.carburants && search.carburants.length > 0 ? search.carburants : undefined,
          transmissions: search.transmissions && search.transmissions.length > 0 ? search.transmissions : undefined,
          carrosseries: search.carrosseries && search.carrosseries.length > 0 ? search.carrosseries : undefined,
          normeEuro: search.norme_euro || undefined,
          carPassOnly: search.car_pass_only || false,
          architectures: search.architectures && search.architectures.length > 0 ? search.architectures : undefined,
          admissions: search.admissions && search.admissions.length > 0 ? search.admissions : undefined,
          couleurExterieure: search.couleur_exterieure && search.couleur_exterieure.length > 0 ? search.couleur_exterieure : undefined,
          couleurInterieure: search.couleur_interieure && search.couleur_interieure.length > 0 ? search.couleur_interieure : undefined,
          nombrePlaces: search.nombre_places && search.nombre_places.length > 0 ? search.nombre_places : undefined,
        };

        // Rechercher les véhicules correspondants (trier par année décroissante pour avoir les plus récents en premier)
        const matchingVehicles = await searchVehicules(filters, "annee_desc");

        if (matchingVehicles.length === 0) {
          continue; // Pas de véhicules correspondants
        }

        // Filtrer seulement les véhicules créés après la dernière notification
        const lastNotifiedAt = search.last_notified_at 
          ? new Date(search.last_notified_at)
          : new Date(search.created_at);

        const newVehicles = matchingVehicles.filter((vehicle) => {
          const vehicleDate = new Date(vehicle.created_at);
          return vehicleDate > lastNotifiedAt;
        });

        if (newVehicles.length === 0) {
          continue; // Pas de nouveaux véhicules
        }

        // Construire le message de notification
        const vehicleCount = newVehicles.length;
        const vehicleText = vehicleCount === 1 ? "véhicule" : "véhicules";
        const searchName = search.name || "Votre recherche";
        
        let message = `${vehicleCount} nouveau${vehicleCount > 1 ? "x" : ""} ${vehicleText} correspond${vehicleCount > 1 ? "ent" : ""} à "${searchName}" !\n\n`;
        
        // Ajouter les détails des véhicules (max 3)
        const vehiclesToShow = newVehicles.slice(0, 3);
        vehiclesToShow.forEach((vehicle, index) => {
          message += `${index + 1}. ${vehicle.brand} ${vehicle.model} - ${vehicle.price?.toLocaleString("fr-BE")}€\n`;
        });
        
        if (newVehicles.length > 3) {
          message += `\n... et ${newVehicles.length - 3} autre${newVehicles.length - 3 > 1 ? "s" : ""} véhicule${newVehicles.length - 3 > 1 ? "s" : ""}`;
        }

        // Construire l'URL de recherche avec les filtres
        const searchParams = new URLSearchParams();
        if (search.marque) searchParams.set("marque", search.marque);
        if (search.modele) searchParams.set("modele", search.modele);
        if (search.prix_min) searchParams.set("prixMin", search.prix_min.toString());
        if (search.prix_max) searchParams.set("prixMax", search.prix_max.toString());
        if (search.annee_min) searchParams.set("anneeMin", search.annee_min.toString());
        if (search.annee_max) searchParams.set("anneeMax", search.annee_max.toString());
        if (search.km_max) searchParams.set("mileageMax", search.km_max.toString());
        if (search.carburants && search.carburants.length > 0) searchParams.set("carburant", search.carburants.join(','));
        if (search.transmissions && search.transmissions.length > 0) searchParams.set("transmission", search.transmissions.join(','));
        if (search.carrosseries && search.carrosseries.length > 0) searchParams.set("carrosserie", search.carrosseries.join(','));
        if (search.norme_euro) searchParams.set("normeEuro", search.norme_euro);
        if (search.car_pass_only) searchParams.set("carPassOnly", "true");
        if (search.architectures && search.architectures.length > 0) searchParams.set("engineArchitecture", search.architectures.join(','));
        if (search.admissions && search.admissions.length > 0) searchParams.set("admission", search.admissions.join(','));
        if (search.couleur_exterieure && search.couleur_exterieure.length > 0) searchParams.set("exteriorColor", search.couleur_exterieure.join(','));
        if (search.couleur_interieure && search.couleur_interieure.length > 0) searchParams.set("interiorColor", search.couleur_interieure.join(','));
        if (search.nombre_places && search.nombre_places.length > 0) searchParams.set("seatsCount", search.nombre_places.join(','));
        const searchUrl = `/search?${searchParams.toString()}`;

        // Créer la notification
        await createNotification(
          search.user_id,
          `🔔 Nouveaux véhicules pour "${searchName}"`,
          message,
          "info",
          searchUrl,
          {
            action: "sentinelle_alert",
            search_id: search.id,
            vehicle_count: newVehicles.length,
            vehicle_ids: newVehicles.map(v => v.id),
          }
        );

        // Mettre à jour last_notified_at
        await supabase
          .from("saved_searches")
          .update({ last_notified_at: new Date().toISOString() })
          .eq("id", search.id);

        notifiedCount++;
      } catch (error) {
        console.error(`Erreur traitement recherche ${search.id}:`, error);
        // Continuer avec la recherche suivante
      }
    }

    return { processed: savedSearches.length, notified: notifiedCount };
  } catch (error) {
    console.error("Erreur checkSentinelleAlerts:", error);
    return { processed: 0, notified: 0 };
  }
}

