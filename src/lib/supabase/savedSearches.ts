// RedZone - Gestion des Recherches Sauvegardées (Alertes Sentinelle)

import { createClient } from "./client";

export interface SavedSearch {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  marque?: string | null;
  modele?: string | null;
  prix_min?: number | null;
  prix_max?: number | null;
  annee_min?: number | null;
  annee_max?: number | null;
  km_max?: number | null;
  type?: string[] | null;
  carburants?: string[] | null;
  transmissions?: string[] | null;
  carrosseries?: string[] | null;
  norme_euro?: string | null;
  car_pass_only?: boolean | null;
  architectures?: string[] | null;
  admissions?: string[] | null;
  couleur_exterieure?: string[] | null;
  couleur_interieure?: string[] | null;
  nombre_places?: string[] | null;
  name?: string | null;
  is_active?: boolean | null;
  last_notified_at?: string | null;
}

export interface SavedSearchInsert {
  marque?: string | null;
  modele?: string | null;
  prix_min?: number | null;
  prix_max?: number | null;
  annee_min?: number | null;
  annee_max?: number | null;
  km_max?: number | null;
  type?: string[] | null;
  carburants?: string[] | null;
  transmissions?: string[] | null;
  carrosseries?: string[] | null;
  norme_euro?: string | null;
  car_pass_only?: boolean | null;
  architectures?: string[] | null;
  admissions?: string[] | null;
  couleur_exterieure?: string[] | null;
  couleur_interieure?: string[] | null;
  nombre_places?: string[] | null;
  name?: string | null;
  is_active?: boolean | null;
}

/**
 * Sauvegarder une recherche (créer une alerte Sentinelle)
 */
export async function saveSearch(search: SavedSearchInsert): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Vous devez être connecté pour sauvegarder une recherche");
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      ...search,
      user_id: user.id,
      is_active: search.is_active ?? true,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Erreur sauvegarde recherche:", error);
    throw new Error(`Erreur sauvegarde recherche: ${error.message}`);
  }

  return data.id;
}

/**
 * Récupérer toutes les recherches sauvegardées d'un utilisateur
 */
export async function getSavedSearches(): Promise<SavedSearch[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur récupération recherches:", error);
    throw new Error(`Erreur récupération recherches: ${error.message}`);
  }

  return (data as SavedSearch[]) || [];
}

/**
 * Supprimer une recherche sauvegardée
 */
export async function deleteSavedSearch(searchId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("saved_searches")
    .delete()
    .eq("id", searchId);

  if (error) {
    throw new Error(`Erreur suppression recherche: ${error.message}`);
  }
}

/**
 * Activer/Désactiver une recherche sauvegardée
 */
export async function toggleSavedSearch(searchId: string, isActive: boolean): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("saved_searches")
    .update({ is_active: isActive })
    .eq("id", searchId);

  if (error) {
    throw new Error(`Erreur mise à jour recherche: ${error.message}`);
  }
}

