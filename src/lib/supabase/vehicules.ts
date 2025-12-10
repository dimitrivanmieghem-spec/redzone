// RedZone - Actions Supabase pour les Véhicules

import { createClient } from "./client";
import { Vehicule, VehiculeInsert, VehiculeUpdate } from "./types";
import { validateVehiculeData, sanitizeVehiculeData } from "../validation";

/**
 * Créer un nouveau véhicule
 * @param vehicule - Données du véhicule
 * @param userId - ID de l'utilisateur
 * @returns ID du véhicule créé
 */
export async function createVehicule(
  vehicule: Omit<VehiculeInsert, "id" | "user_id" | "status" | "created_at">,
  userId: string
): Promise<string> {
  // Validation des données
  const validation = validateVehiculeData({
    marque: vehicule.marque,
    modele: vehicule.modele,
    prix: vehicule.prix,
    annee: vehicule.annee,
    km: vehicule.km,
    description: vehicule.description || undefined,
    car_pass_url: vehicule.car_pass_url || undefined,
    contact_email: vehicule.contact_email || undefined,
    telephone: vehicule.telephone || undefined,
    contact_methods: vehicule.contact_methods || undefined,
  });

  if (!validation.isValid) {
    throw new Error(
      `Données invalides: ${validation.errors.join(", ")}`
    );
  }

  // Sanitization des données
  const sanitized = sanitizeVehiculeData(vehicule);

  const supabase = createClient();

  const { data, error } = await supabase
    .from("vehicules")
    .insert({
      ...sanitized,
      user_id: userId,
      status: "pending", // Toujours en attente par défaut
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Erreur création véhicule: ${error.message}`);
  }

  return data.id;
}

/**
 * Mettre à jour un véhicule
 * @param id - ID du véhicule
 * @param updates - Champs à mettre à jour
 */
export async function updateVehicule(
  id: string,
  updates: VehiculeUpdate
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("vehicules")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur mise à jour: ${error.message}`);
  }
}

/**
 * Supprimer un véhicule
 * @param id - ID du véhicule
 */
export async function deleteVehicule(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("vehicules").delete().eq("id", id);

  if (error) {
    throw new Error(`Erreur suppression: ${error.message}`);
  }
}

/**
 * Récupérer tous les véhicules (avec filtres)
 * @param filters - Filtres optionnels
 * @returns Liste des véhicules
 */
export async function getVehicules(filters?: {
  status?: "pending" | "active" | "rejected";
  type?: "car" | "moto";
  limit?: number;
}): Promise<Vehicule[]> {
  const supabase = createClient();

  let query = supabase
    .from("vehicules")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur récupération: ${error.message}`);
  }

  return (data as Vehicule[]) || [];
}

/**
 * Récupérer un véhicule par ID
 * @param id - ID du véhicule
 * @returns Véhicule ou null
 */
export async function getVehiculeById(id: string): Promise<Vehicule | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("vehicules")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erreur récupération véhicule:", error);
    return null;
  }

  return data as Vehicule;
}

/**
 * Approuver un véhicule (admin uniquement)
 * @param id - ID du véhicule
 */
export async function approveVehicule(id: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("vehicules")
    .update({ status: "active" })
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur approbation: ${error.message}`);
  }
}

/**
 * Rejeter un véhicule (admin uniquement)
 * @param id - ID du véhicule
 */
export async function rejectVehicule(id: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("vehicules")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur rejet: ${error.message}`);
  }
}

/**
 * Récupérer les véhicules avec pagination (admin)
 * @param page - Numéro de page (commence à 1)
 * @param pageSize - Nombre d'éléments par page
 * @param filters - Filtres optionnels
 * @returns Liste des véhicules et total
 */
export async function getVehiculesPaginated(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: "pending" | "active" | "rejected";
    type?: "car" | "moto";
  }
): Promise<{ data: Vehicule[]; total: number }> {
  const supabase = createClient();

  let query = supabase
    .from("vehicules")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erreur récupération paginée: ${error.message}`);
  }

  return {
    data: (data as Vehicule[]) || [],
    total: count || 0,
  };
}

