// Octane98 - Fonctions pour récupérer les specs de véhicules depuis Supabase
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
  // Nouveaux champs pour pré-remplissage amélioré
  top_speed?: number | null; // Vitesse maximale en km/h
  drivetrain?: 'RWD' | 'FWD' | 'AWD' | '4WD' | null; // Type de transmission
  co2_wltp?: number | null; // CO2 WLTP pour taxes Flandre
  default_color?: string | null; // Couleur extérieure standard
  default_seats?: number | null; // Nombre de places standard
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
  
  // Utiliser le système de retry avec timeout
  const { supabaseQueryWithRetry } = await import("./retry-utils");
  
  try {
    const { data, error } = await supabaseQueryWithRetry(
      async () => {
        const query = supabase
          .from(table)
          .select('marque')
          .eq('type', type)
          .eq('is_active', true);
        
        // Ajouter un timeout de 8 secondes (réduit pour éviter les blocages)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Timeout: La requête prend trop de temps")), 8000);
        });
        
        const queryPromise = query;
        return await Promise.race([queryPromise, timeoutPromise]);
      },
      { maxRetries: retries, initialDelay: 1000 }
    );

    if (error) {
      logError(context, table, operation, error, { type });
      return [];
    }

    if (!data || !Array.isArray(data)) {
      console.warn(`⚠️ [${context}] Aucune donnée retournée (data = null ou pas un tableau)`);
      return [];
    }

    // Extraire les marques uniques et trier
    const uniqueBrands = Array.from(new Set(data.map((item: any) => item.marque).filter(Boolean)));
    const sortedBrands = uniqueBrands.sort();
    
    return sortedBrands;
  } catch (err) {
    logError(context, table, operation, err, { type });
    return [];
  }
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
  
  // Utiliser le système de retry avec timeout
  const { supabaseQueryWithRetry } = await import("./retry-utils");
  
  try {
    const { data, error } = await supabaseQueryWithRetry(
      async () => {
        // Utiliser ilike pour la casse (tolérant aux différences de casse)
        // Cela permet de matcher "Abarth" avec "abarth" ou "ABARTH"
        const query = supabase
          .from(table)
          .select('modele')
          .eq('type', type)
          .ilike('marque', brand.trim())
          .eq('is_active', true)
          .order('modele');
        
        // Ajouter un timeout de 8 secondes (réduit pour éviter les blocages)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Timeout: La requête prend trop de temps")), 8000);
        });
        
        const queryPromise = query;
        return await Promise.race([queryPromise, timeoutPromise]);
      },
      { maxRetries: retries, initialDelay: 1000 }
    );

    if (error) {
      logError(context, table, operation, error, { type, brand });
      console.error(`❌ [${context}] Erreur lors de la récupération des modèles pour ${brand} (${type}):`, error);
      return [];
    }

    if (!data || !Array.isArray(data)) {
      console.warn(`⚠️ [${context}] Aucune donnée retournée (data = null ou pas un tableau) pour ${brand} (${type})`);
      return [];
    }

    const models = data.map((item: any) => item.modele).filter(Boolean);
    
    if (models.length === 0) {
      console.warn(`⚠️ [${context}] Aucun modèle trouvé pour la marque "${brand}" (type: ${type}). Vérifiez que la marque existe dans model_specs_db avec la même casse.`);
    } else {
      console.log(`✅ [${context}] ${models.length} modèle(s) trouvé(s) pour ${brand} (${type}):`, models.slice(0, 5), models.length > 5 ? '...' : '');
    }
    
    return models;
  } catch (err) {
    logError(context, table, operation, err, { type, brand });
    return [];
  }
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

    const uniqueBrands = Array.from(new Set(data.map((item: any) => item.marque).filter(Boolean))) as string[];
    const sortedBrands = uniqueBrands.sort();
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

    const models = data.map((item: any) => item.modele).filter(Boolean) as string[];
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
  
  // Utiliser le système de retry avec timeout
  const { supabaseQueryWithRetry } = await import("./retry-utils");
  
  try {
    const { data: initialData, error } = await supabaseQueryWithRetry(
      async () => {
        // Tentative 1 : Recherche avec ILIKE (plus tolérant pour les espaces et caractères spéciaux)
        // On évite .eq() qui peut causer des erreurs 400 avec les espaces dans les valeurs
        // Inclure les nouveaux champs pour pré-remplissage amélioré
        const query = supabase
          .from(table)
          .select('kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats')
          .eq('type', type)
          .ilike('marque', brand.trim())
          .ilike('modele', model.trim())
          .eq('is_active', true)
          .limit(1);
        
        // Ajouter un timeout de 8 secondes
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Timeout: La requête prend trop de temps")), 8000);
        });
        
        const queryPromise = query.maybeSingle();
        return await Promise.race([queryPromise, timeoutPromise]);
      },
      { maxRetries: 2, initialDelay: 1000 }
    );

    if (error) {
      logError(context, table, operation, error, { type, brand, model });
      return null;
    }

    let data = initialData;

    if (!data) {
      // Si pas trouvé avec ILIKE, essayer avec recherche exacte
      const hasSpaces = model.includes(' ') || brand.includes(' ');
      
      if (!hasSpaces) {
        const { data: dataExact, error: errorExact } = await supabase
          .from(table)
          .select('kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats')
          .eq('type', type)
          .eq('marque', brand.trim())
          .eq('modele', model.trim())
          .eq('is_active', true)
          .maybeSingle();
        
        if (!errorExact && dataExact) {
          data = dataExact;
        }
      }
      
      // Si toujours pas trouvé, essayer recherche partielle
      if (!data) {
        const { data: dataPartial, error: errorPartial } = await supabase
          .from(table)
          .select('kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats, marque, modele')
          .eq('type', type)
          .eq('is_active', true)
          .ilike('marque', `%${brand.trim()}%`);
        
        if (!errorPartial && dataPartial && dataPartial.length > 0) {
          // Chercher le meilleur match
          const modelNormalized = model.replace(/\s+/g, '').toLowerCase();
          const brandNormalized = brand.replace(/\s+/g, '').toLowerCase();
          
          const bestMatch = dataPartial.find((item: any) => {
            const itemModelNormalized = item.modele?.replace(/\s+/g, '').toLowerCase() || '';
            const itemMarqueNormalized = item.marque?.replace(/\s+/g, '').toLowerCase() || '';
            
            const modelMatch = itemModelNormalized.includes(modelNormalized) || modelNormalized.includes(itemModelNormalized);
            const brandMatch = itemMarqueNormalized.includes(brandNormalized) || brandNormalized.includes(itemMarqueNormalized);
            
            return modelMatch && brandMatch;
          });
          
          if (bestMatch) {
            data = bestMatch;
          }
        }
      }
      
      if (!data) {
        console.warn(`⚠️ [${context}] Aucune spec trouvée pour ${brand} ${model} (${type})`);
        return null;
      }
    }

    // Validation des données requises
    if (!data || typeof data !== 'object' || typeof (data as any).kw !== 'number' || typeof (data as any).ch !== 'number' || typeof (data as any).cv_fiscaux !== 'number') {
      console.error(`❌ [${context}] Données invalides retournées:`, data);
      return null;
    }

    const specData = data as any;

    return {
      kw: specData.kw,
      ch: specData.ch,
      cv_fiscaux: specData.cv_fiscaux,
      co2: specData.co2,
      cylindree: specData.cylindree,
      moteur: specData.moteur,
      transmission: specData.transmission as 'Manuelle' | 'Automatique' | 'Séquentielle',
      default_carrosserie: specData.default_carrosserie || null,
      top_speed: specData.top_speed ? parseInt(String(specData.top_speed)) : null,
      drivetrain: (specData.drivetrain as 'RWD' | 'FWD' | 'AWD' | '4WD') || null,
      co2_wltp: specData.co2_wltp ? parseFloat(String(specData.co2_wltp)) : null,
      default_color: specData.default_color || null,
      default_seats: specData.default_seats ? parseInt(String(specData.default_seats)) : null,
    };
  } catch (err) {
    logError(context, table, operation, err, { type, brand, model });
    return null;
  }
}
