// RedZone - Fonctions pour récupérer les specs de véhicules depuis Supabase

import { createClient } from "./client";

export interface VehicleSpecs {
  kw: number;
  ch: number;
  cv_fiscaux: number;
  co2: number | null;
  cylindree: number;
  moteur: string;
  transmission: 'Manuelle' | 'Automatique' | 'Séquentielle';
  default_carrosserie?: string | null; // Carrosserie par défaut du modèle
}

export type VehicleType = 'car' | 'moto';

/**
 * Récupère toutes les marques disponibles pour un type de véhicule
 * @param type - Type de véhicule ('car' ou 'moto')
 * @returns Liste des marques triées
 */
export async function getBrands(type: VehicleType = 'car', retries = 2): Promise<string[]> {
  const supabase = createClient();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('model_specs_db')
        .select('marque')
        .eq('type', type)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      // Extraire les marques uniques et trier
      const uniqueBrands = Array.from(new Set(data?.map(item => item.marque) || []));
      return uniqueBrands.sort();
    } catch (err) {
      console.error(`Erreur récupération marques (tentative ${attempt + 1}/${retries + 1}):`, err);
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

/**
 * Récupère tous les modèles pour une marque et un type donnés
 * @param type - Type de véhicule ('car' ou 'moto')
 * @param brand - Nom de la marque
 * @returns Liste des modèles triés
 */
export async function getModels(type: VehicleType, brand: string, retries = 2): Promise<string[]> {
  if (!brand) return [];

  const supabase = createClient();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase
        .from('model_specs_db')
        .select('modele')
        .eq('type', type)
        .eq('marque', brand)
        .eq('is_active', true)
        .order('modele');

      if (error) {
        throw error;
      }

      return data?.map(item => item.modele) || [];
    } catch (err) {
      console.error(`Erreur récupération modèles (tentative ${attempt + 1}/${retries + 1}):`, err);
      if (attempt === retries) {
        return [];
      }
      // Attendre un peu avant de réessayer
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  return [];
}

/**
 * Recherche des marques par terme de recherche (pour auto-complétion)
 * @param type - Type de véhicule
 * @param searchTerm - Terme de recherche
 * @returns Liste des marques correspondantes
 */
export async function searchBrands(type: VehicleType, searchTerm: string): Promise<string[]> {
  if (!searchTerm || searchTerm.length < 2) {
    return await getBrands(type);
  }

  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('model_specs_db')
    .select('marque')
    .eq('type', type)
    .eq('is_active', true)
    .ilike('marque', `%${searchTerm}%`);

  if (error) {
    console.error('Erreur recherche marques:', error);
    return [];
  }

  const uniqueBrands = Array.from(new Set(data?.map(item => item.marque) || []));
  return uniqueBrands.sort();
}

/**
 * Recherche des modèles par terme de recherche (pour auto-complétion)
 * @param type - Type de véhicule
 * @param brand - Marque
 * @param searchTerm - Terme de recherche
 * @returns Liste des modèles correspondants
 */
export async function searchModels(
  type: VehicleType,
  brand: string,
  searchTerm: string
): Promise<string[]> {
  if (!brand) return [];
  if (!searchTerm || searchTerm.length < 2) {
    return await getModels(type, brand);
  }

  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('model_specs_db')
    .select('modele')
    .eq('type', type)
    .eq('marque', brand)
    .eq('is_active', true)
    .ilike('modele', `%${searchTerm}%`)
    .order('modele');

  if (error) {
    console.error('Erreur recherche modèles:', error);
    return [];
  }

  return data?.map(item => item.modele) || [];
}

/**
 * Récupère les spécifications complètes d'un modèle
 * @param type - Type de véhicule
 * @param brand - Marque
 * @param model - Modèle
 * @returns Spécifications du véhicule ou null
 */
export async function getModelSpecs(
  type: VehicleType,
  brand: string,
  model: string
): Promise<VehicleSpecs | null> {
  if (!brand || !model) return null;

  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('model_specs_db')
    .select('kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie')
    .eq('type', type)
    .eq('marque', brand)
    .eq('modele', model)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    kw: data.kw,
    ch: data.ch,
    cv_fiscaux: data.cv_fiscaux,
    co2: data.co2,
    cylindree: data.cylindree,
    moteur: data.moteur,
    transmission: data.transmission as 'Manuelle' | 'Automatique' | 'Séquentielle',
    default_carrosserie: data.default_carrosserie || null,
  };
}

