"use server";

// Octane98 - Server Actions pour les Recherches Sauvegardées

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "../server";
import { saveSearch, deleteSavedSearch, toggleSavedSearch } from "../savedSearches";
import type { SavedSearchInsert } from "../savedSearches";

/**
 * Sauvegarder une recherche (créer une alerte Sentinelle)
 * Utilise le client serveur pour vérifier l'authentification
 */
export async function saveSearchAction(search: SavedSearchInsert & { name?: string }): Promise<string> {
  const supabase = await createServerClient();
  
  // Vérifier l'authentification avec getUser()
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("Vous devez être connecté pour créer une alerte");
  }

  const searchId = await saveSearch({
    ...search,
    name: search.name || undefined,
  });

  // Invalider le cache
  revalidatePath("/recherche");
  revalidatePath("/dashboard");

  return searchId;
}

/**
 * Supprimer une recherche sauvegardée
 */
export async function deleteSavedSearchAction(searchId: string): Promise<void> {
  const supabase = await createServerClient();
  
  // Vérifier l'authentification avec getUser()
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("Vous devez être connecté pour supprimer une alerte");
  }

  await deleteSavedSearch(searchId);

  // Invalider le cache
  revalidatePath("/recherche");
  revalidatePath("/dashboard");
}

/**
 * Activer/Désactiver une recherche sauvegardée
 */
export async function toggleSavedSearchAction(searchId: string, isActive: boolean): Promise<void> {
  const supabase = await createServerClient();
  
  // Vérifier l'authentification avec getUser()
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error("Vous devez être connecté pour modifier une alerte");
  }

  await toggleSavedSearch(searchId, isActive);

  // Invalider le cache
  revalidatePath("/recherche");
  revalidatePath("/dashboard");
}

