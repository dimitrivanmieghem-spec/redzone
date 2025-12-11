// RedZone - Fonctions pour récupérer les specs de véhicules depuis Supabase
// REFACTORING: Gestion d'erreur exhaustive avec logging détaillé

import { createClient } from "./client";

export interface VehicleSpecs {
  kw: number;
  ch: number;
  cv_fiscaux: number;
  co2: number | null;
  cylindree: number;
  moteur: string;
  transmission: 'Manuelle' | 'Automatique' | 'Séquentielle';
  default_carrosserie?: string | null;
}

export type VehicleType = 'car' | 'moto';

/**
 * Log une erreur de manière exhaustive pour le diagnostic
 */
function logError(
  context: string,
  table: string,
  operation: string,
  error: any,
  params?: Record<string, any>
) {
  const errorDetails = {
    context,
    table,
    operation,
    timestamp: new Date().toISOString(),
    error: {
      message: error?.message || 'Pas de message',
      code: error?.code || 'Pas de code',
      details: error?.details || null,
      hint: error?.hint || null,
      statusCode: error?.statusCode || null,
    },
    params: params || {},
    rawError: error ? JSON.stringify(error, Object.getOwnPropertyNames(error), 2) : '{}',
  };

  console.error(`❌ [${context}] Erreur ${operation} sur ${table}:`, errorDetails);

  // Détection spécifique des erreurs RLS
  const errorMessage = String(error?.message || '').toLowerCase();
  const errorCode = String(error?.code || '');

  if (
    errorCode === 'PGRST116' ||
    errorMessage.includes('permission denied') ||
    errorMessage.includes('rls') ||
    errorMessage.includes('row-level security') ||
    errorMessage.includes('new row violates row-level security')
  ) {
    console.error(`🔒 [${context}] BLOQUAGE RLS DÉTECTÉ sur ${table}`);
    console.error(`   → Vérifiez que la politique "public_read_${table}" existe`);
    console.error(`   → Code erreur: ${errorCode}`);
  }
}

/**
 * Récupère toutes les marques disponibles pour un type de véhicule
 * @param type - Type de véhicule ('car' ou 'moto')
 * @returns Liste des marques triées
 */
export async function getBrands(type: VehicleType = 'car', retries = 2): Promise<string[]> {
  const context = 'getBrands';
  const table = 'model_specs_db';
  const operation = 'SELECT marque';
  
  const supabase = createClient();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 [${context}] Tentative ${attempt + 1}/${retries + 1} - Récupération marques (${type})`);
      
      const { data, error } = await supabase
        .from(table)
        .select('marque')
        .eq('type', type)
        .eq('is_active', true);

      if (error) {
        logError(context, table, operation, error, { type, attempt: attempt + 1 });
        throw error;
      }

      if (!data) {
        console.warn(`⚠️ [${context}] Aucune donnée retournée (data = null)`);
        return [];
      }

      // Extraire les marques uniques et trier
      const uniqueBrands = Array.from(new Set(data.map(item => item.marque).filter(Boolean)));
      const sortedBrands = uniqueBrands.sort();
      
      console.log(`✅ [${context}] ${sortedBrands.length} marques récupérées pour ${type}`);
      return sortedBrands;
    } catch (err) {
      logError(context, table, operation, err, { type, attempt: attempt + 1 });
      
      if (attempt === retries) {
        console.error(`❌ [${context}] Toutes les tentatives ont échoué, retour tableau vide`);
        return [];
      }
      
      // Attendre avant de réessayer (backoff exponentiel)
      const delay = 1000 * Math.pow(2, attempt);
      console.log(`⏳ [${context}] Nouvelle tentative dans ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
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
  const context = 'getModels';
  const table = 'model_specs_db';
  const operation = 'SELECT modele';
  
  if (!brand || brand.trim() === '') {
    console.warn(`⚠️ [${context}] Marque vide, retour tableau vide`);
    return [];
  }

  const supabase = createClient();
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 [${context}] Tentative ${attempt + 1}/${retries + 1} - Récupération modèles (${type}, ${brand})`);
      
      const { data, error } = await supabase
        .from(table)
        .select('modele')
        .eq('type', type)
        .eq('marque', brand)
        .eq('is_active', true)
        .order('modele');

      if (error) {
        logError(context, table, operation, error, { type, brand, attempt: attempt + 1 });
        throw error;
      }

      if (!data) {
        console.warn(`⚠️ [${context}] Aucune donnée retournée (data = null)`);
        return [];
      }

      const models = data.map(item => item.modele).filter(Boolean);
      console.log(`✅ [${context}] ${models.length} modèles récupérés pour ${brand} (${type})`);
      return models;
    } catch (err) {
      logError(context, table, operation, err, { type, brand, attempt: attempt + 1 });
      
      if (attempt === retries) {
        console.error(`❌ [${context}] Toutes les tentatives ont échoué, retour tableau vide`);
        return [];
      }
      
      const delay = 1000 * Math.pow(2, attempt);
      console.log(`⏳ [${context}] Nouvelle tentative dans ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
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
  const context = 'searchBrands';
  const table = 'model_specs_db';
  const operation = 'SELECT marque (search)';
  
  if (!searchTerm || searchTerm.length < 2) {
    return await getBrands(type);
  }

  const supabase = createClient();
  
  try {
    console.log(`🔍 [${context}] Recherche marques: "${searchTerm}" (${type})`);
    
    const { data, error } = await supabase
      .from(table)
      .select('marque')
      .eq('type', type)
      .eq('is_active', true)
      .ilike('marque', `%${searchTerm}%`);

    if (error) {
      logError(context, table, operation, error, { type, searchTerm });
      return [];
    }

    if (!data) {
      console.warn(`⚠️ [${context}] Aucune donnée retournée`);
      return [];
    }

    const uniqueBrands = Array.from(new Set(data.map(item => item.marque).filter(Boolean)));
    const sortedBrands = uniqueBrands.sort();
    console.log(`✅ [${context}] ${sortedBrands.length} marques trouvées`);
    return sortedBrands;
  } catch (err) {
    logError(context, table, operation, err, { type, searchTerm });
    return [];
  }
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
  const context = 'searchModels';
  const table = 'model_specs_db';
  const operation = 'SELECT modele (search)';
  
  if (!brand || brand.trim() === '') {
    return [];
  }
  
  if (!searchTerm || searchTerm.length < 2) {
    return await getModels(type, brand);
  }

  const supabase = createClient();
  
  try {
    console.log(`🔍 [${context}] Recherche modèles: "${searchTerm}" (${type}, ${brand})`);
    
    const { data, error } = await supabase
      .from(table)
      .select('modele')
      .eq('type', type)
      .eq('marque', brand)
      .eq('is_active', true)
      .ilike('modele', `%${searchTerm}%`)
      .order('modele');

    if (error) {
      logError(context, table, operation, error, { type, brand, searchTerm });
      return [];
    }

    if (!data) {
      console.warn(`⚠️ [${context}] Aucune donnée retournée`);
      return [];
    }

    const models = data.map(item => item.modele).filter(Boolean);
    console.log(`✅ [${context}] ${models.length} modèles trouvés`);
    return models;
  } catch (err) {
    logError(context, table, operation, err, { type, brand, searchTerm });
    return [];
  }
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
  const context = 'getModelSpecs';
  const table = 'model_specs_db';
  const operation = 'SELECT specs';
  
  if (!brand || brand.trim() === '' || !model || model.trim() === '') {
    console.warn(`⚠️ [${context}] Paramètres invalides:`, { brand, model, type });
    return null;
  }

  const supabase = createClient();
  
  console.log(`🔍 [${context}] Recherche specs: ${brand} ${model} (${type})`);
  
  // Tentative 1 : Recherche avec ILIKE (plus tolérant pour les espaces et caractères spéciaux)
  // On évite .eq() qui peut causer des erreurs 400 avec les espaces dans les valeurs
  // Note: default_carrosserie n'existe pas dans la table, on ne le sélectionne pas
  let { data, error } = await supabase
    .from(table)
    .select('kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission')
    .eq('type', type)
    .ilike('marque', brand.trim())
    .ilike('modele', model.trim())
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  // Si pas trouvé avec ILIKE, essayer avec recherche exacte (mais seulement si pas d'erreur 400)
  if (error) {
    // Si c'est une erreur 400 (Bad Request), c'est probablement dû à un problème d'encodage
    // On détecte ça via le message ou le code
    const isBadRequest = 
      error.message?.includes('400') || 
      error.message?.includes('Bad Request') ||
      error.code === 'PGRST204' ||
      error.code === '22P02'; // Invalid text representation (PostgreSQL)
    
    if (isBadRequest) {
      console.log(`⚠️ [${context}] Erreur 400 détectée (problème d'encodage), passage à la recherche partielle`);
      error = null; // Réinitialiser l'erreur pour continuer
    } else {
      // Pour les autres erreurs, on log et on continue quand même
      console.warn(`⚠️ [${context}] Erreur lors de la recherche ILIKE:`, error.message);
      error = null; // Réinitialiser pour essayer les autres méthodes
    }
  }

  if (!error && !data) {
    console.log(`⚠️ [${context}] Recherche ILIKE: aucun résultat, tentative avec recherche exacte`);
    
    // Essayer avec .eq() mais seulement si les valeurs ne contiennent pas d'espaces problématiques
    const hasSpaces = model.includes(' ') || brand.includes(' ');
    
    if (!hasSpaces) {
      const { data: dataExact, error: errorExact } = await supabase
        .from(table)
        .select('kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission')
        .eq('type', type)
        .eq('marque', brand.trim())
        .eq('modele', model.trim())
        .eq('is_active', true)
        .maybeSingle();
      
      if (!errorExact && dataExact) {
        console.log(`✅ [${context}] Trouvé avec recherche exacte`);
        data = dataExact;
        error = null;
      }
    }
    
    // Si toujours pas trouvé, essayer recherche partielle
    if (!data) {
      console.log(`⚠️ [${context}] Tentative recherche partielle`);
      const modelNormalized = model.replace(/\s+/g, '').toLowerCase();
      const brandNormalized = brand.replace(/\s+/g, '').toLowerCase();
      
      // Pour la recherche partielle, on évite ILIKE avec % qui peut causer des erreurs 400
      // On filtre d'abord par marque exacte (plus rapide), puis on filtre le modèle côté client
      // Si la marque contient des espaces, on essaie quand même .eq() qui devrait fonctionner
      let queryPartial = supabase
        .from(table)
        .select('kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, marque, modele')
        .eq('type', type)
        .eq('is_active', true);
      
      // Essayer de filtrer par marque si possible (même avec espaces, .eq() devrait fonctionner)
      // Si ça échoue, on récupère tout et on filtre côté client
      const { data: dataPartial, error: errorPartial } = await queryPartial.eq('marque', brand.trim());
      
      if (!errorPartial && dataPartial && dataPartial.length > 0) {
        // Chercher le meilleur match
        const bestMatch = dataPartial.find(item => {
          const itemModelNormalized = item.modele?.replace(/\s+/g, '').toLowerCase() || '';
          const itemMarqueNormalized = item.marque?.replace(/\s+/g, '').toLowerCase() || '';
          const brandNormalized = brand.replace(/\s+/g, '').toLowerCase();
          
          // Match sur le modèle ET la marque
          const modelMatch = itemModelNormalized.includes(modelNormalized) || modelNormalized.includes(itemModelNormalized);
          const brandMatch = itemMarqueNormalized.includes(brandNormalized) || brandNormalized.includes(itemMarqueNormalized);
          
          return modelMatch && brandMatch;
        });
        
        if (bestMatch) {
          console.log(`✅ [${context}] Trouvé avec recherche partielle:`, { 
            recherché: `${brand} ${model}`, 
            trouvé: `${bestMatch.marque} ${bestMatch.modele}`
          });
          data = bestMatch;
          error = null;
        }
      }
    }
  }

  if (error) {
    logError(context, table, operation, error, { type, brand, model });
    return null;
  }

  if (!data) {
    console.warn(`⚠️ [${context}] Aucune spec trouvée pour ${brand} ${model} (${type})`);
    return null;
  }

  // Validation des données requises
  if (typeof data.kw !== 'number' || typeof data.ch !== 'number' || typeof data.cv_fiscaux !== 'number') {
    console.error(`❌ [${context}] Données invalides retournées:`, data);
    return null;
  }

  console.log(`✅ [${context}] Specs trouvées:`, {
    ch: data.ch,
    kw: data.kw,
    cv_fiscaux: data.cv_fiscaux,
    co2: data.co2,
    cylindree: data.cylindree
  });

  return {
    kw: data.kw,
    ch: data.ch,
    cv_fiscaux: data.cv_fiscaux,
    co2: data.co2,
    cylindree: data.cylindree,
    moteur: data.moteur,
    transmission: data.transmission as 'Manuelle' | 'Automatique' | 'Séquentielle',
    default_carrosserie: null, // Cette colonne n'existe pas dans model_specs_db
  };
}
