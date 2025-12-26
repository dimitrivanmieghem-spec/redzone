// Octane98 - Recherche optimisée côté serveur

import { createClient } from "./client";
import { Vehicule } from "./types";

export interface SearchFilters {
  marque?: string;
  modele?: string;
  prixMin?: number;
  prixMax?: number;
  anneeMin?: number;
  anneeMax?: number;
  kmMax?: number;
  type?: string[];
  carburants?: string[];
  transmissions?: string[];
  carrosseries?: string[];
  normeEuro?: string;
  carPassOnly?: boolean;
  architectures?: string[];
  admissions?: string[];
  couleurExterieure?: string[];
  couleurInterieure?: string[];
  nombrePlaces?: string[];
  // Nouveaux filtres techniques
  architectureMoteur?: string[];
  puissanceMin?: number;
  puissanceMax?: number;
  drivetrain?: string[];
  topSpeedMin?: number;
  topSpeedMax?: number;
}

export type SortOption = "prix_asc" | "prix_desc" | "annee_desc" | "km_asc";

/**
 * Rechercher des véhicules avec filtres côté serveur (optimisé)
 */
export async function searchVehicules(
  filters: SearchFilters,
  sortBy: SortOption = "annee_desc",
  retries = 2
): Promise<Vehicule[]> {
  const supabase = createClient();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Construire la requête de base
      let query = supabase
        .from("vehicles")
        .select("*")
        .eq("status", "active"); // Seulement les actifs

      // Appliquer les filtres simples
      if (filters.marque) {
        query = query.eq("brand", filters.marque); // Exact match pour la marque
      }

      if (filters.modele) {
        query = query.ilike("model", `%${filters.modele}%`);
      }

      if (filters.prixMin !== undefined) {
        query = query.gte("price", filters.prixMin);
      }

      if (filters.prixMax !== undefined) {
        query = query.lte("price", filters.prixMax);
      }

      if (filters.anneeMin !== undefined) {
        query = query.gte("year", filters.anneeMin);
      }

      if (filters.anneeMax !== undefined) {
        query = query.lte("year", filters.anneeMax);
      }

      if (filters.kmMax !== undefined) {
        query = query.lte("mileage", filters.kmMax);
      }

      // Filtres avec IN (tableaux)
      if (filters.type && filters.type.length > 0) {
        query = query.in("type", filters.type);
      }

      if (filters.carburants && filters.carburants.length > 0) {
        query = query.in("fuel_type", filters.carburants);
      }

      if (filters.transmissions && filters.transmissions.length > 0) {
        query = query.in("transmission", filters.transmissions);
      }

      if (filters.carrosseries && filters.carrosseries.length > 0) {
        query = query.in("body_type", filters.carrosseries);
      }

      if (filters.normeEuro) {
        query = query.eq("euro_standard", filters.normeEuro);
      }

      if (filters.carPassOnly) {
        query = query.eq("car_pass", true);
      }

      // Filtres passionnés
      if (filters.architectures && filters.architectures.length > 0) {
        query = query.in("engine_architecture", filters.architectures);
      }

      if (filters.architectureMoteur && filters.architectureMoteur.length > 0) {
        query = query.in("engine_architecture", filters.architectureMoteur);
      }

      if (filters.admissions && filters.admissions.length > 0) {
        query = query.in("admission", filters.admissions);
      }

      if (filters.couleurExterieure && filters.couleurExterieure.length > 0) {
        query = query.in("interior_color", filters.couleurExterieure); // Note: Vérifier si colonne existe
      }

      if (filters.couleurInterieure && filters.couleurInterieure.length > 0) {
        query = query.in("interior_color", filters.couleurInterieure);
      }

      if (filters.nombrePlaces && filters.nombrePlaces.length > 0) {
        // Convertir les strings en nombres pour la comparaison
        const placesNumbers = filters.nombrePlaces.map((p) => parseInt(p));
        query = query.in("seats_count", placesNumbers);
      }

      // Nouveaux filtres techniques
      if (filters.puissanceMin !== undefined) {
        query = query.gte("power_hp", filters.puissanceMin);
      }

      if (filters.puissanceMax !== undefined) {
        query = query.lte("power_hp", filters.puissanceMax);
      }

      if (filters.drivetrain && filters.drivetrain.length > 0) {
        query = query.in("drivetrain", filters.drivetrain);
      }

      if (filters.topSpeedMin !== undefined) {
        query = query.gte("top_speed", filters.topSpeedMin);
      }

      if (filters.topSpeedMax !== undefined) {
        query = query.lte("top_speed", filters.topSpeedMax);
      }

      // Appliquer le tri
      switch (sortBy) {
        case "prix_asc":
          query = query.order("price", { ascending: true });
          break;
        case "prix_desc":
          query = query.order("price", { ascending: false });
          break;
        case "annee_desc":
          query = query.order("year", { ascending: false });
          break;
        case "km_asc":
          query = query.order("mileage", { ascending: true });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data as Vehicule[]) || [];
    } catch (err) {
      console.error(`Erreur recherche véhicules (tentative ${attempt + 1}/${retries + 1}):`, err);
      if (attempt === retries) {
        // Dernière tentative échouée, retourner un tableau vide
        return [];
      }
      // Attendre un peu avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  return [];
}
