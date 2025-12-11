// RedZone - Fonctions Admin pour CRUD model_specs_db

import { createClient } from "./client";
import { requireAdmin } from "./auth-utils";

export interface ModelSpec {
  id: string;
  created_at: string;
  updated_at: string;
  marque: string;
  modele: string;
  type: "car" | "moto";
  kw: number;
  ch: number;
  cv_fiscaux: number;
  co2: number | null;
  cylindree: number;
  moteur: string;
  transmission: "Manuelle" | "Automatique" | "Séquentielle";
  is_active: boolean;
  source?: string;
}

export interface ModelSpecInsert {
  marque: string;
  modele: string;
  type: "car" | "moto";
  kw: number;
  ch: number;
  cv_fiscaux: number;
  co2?: number | null;
  cylindree: number;
  moteur: string;
  transmission: "Manuelle" | "Automatique" | "Séquentielle";
  is_active?: boolean;
  source?: string;
}

export interface ModelSpecUpdate {
  marque?: string;
  modele?: string;
  type?: "car" | "moto";
  kw?: number;
  ch?: number;
  cv_fiscaux?: number;
  co2?: number | null;
  cylindree?: number;
  moteur?: string;
  transmission?: "Manuelle" | "Automatique" | "Séquentielle";
  is_active?: boolean;
  source?: string;
}

/**
 * Récupérer tous les modèles (admin uniquement)
 */
export async function getAllModelSpecs(): Promise<ModelSpec[]> {
  await requireAdmin();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("model_specs_db")
    .select("*")
    .order("marque")
    .order("modele");

  if (error) {
    throw new Error(`Erreur récupération modèles: ${error.message}`);
  }

  return (data as ModelSpec[]) || [];
}

/**
 * Récupérer un modèle par ID (admin uniquement)
 */
export async function getModelSpecById(id: string): Promise<ModelSpec | null> {
  await requireAdmin();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("model_specs_db")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Erreur récupération modèle: ${error.message}`);
  }

  return data as ModelSpec | null;
}

/**
 * Créer un nouveau modèle (admin uniquement)
 */
export async function createModelSpec(spec: ModelSpecInsert): Promise<ModelSpec> {
  await requireAdmin();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("model_specs_db")
    .insert({
      ...spec,
      is_active: spec.is_active ?? true,
      source: spec.source || "admin",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur création modèle: ${error.message}`);
  }

  return data as ModelSpec;
}

/**
 * Mettre à jour un modèle (admin uniquement)
 */
export async function updateModelSpec(
  id: string,
  updates: ModelSpecUpdate
): Promise<ModelSpec> {
  await requireAdmin();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("model_specs_db")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur mise à jour modèle: ${error.message}`);
  }

  return data as ModelSpec;
}

/**
 * Supprimer un modèle (admin uniquement)
 */
export async function deleteModelSpec(id: string): Promise<void> {
  await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase
    .from("model_specs_db")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur suppression modèle: ${error.message}`);
  }
}

