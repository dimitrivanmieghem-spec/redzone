"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getBrands, getModels, VehicleType } from "@/lib/supabase/modelSpecs";

interface UseModelDataOptions {
  type?: VehicleType;
  autoLoad?: boolean;
}

interface UseModelDataReturn {
  // Marques
  brands: string[];
  loadingBrands: boolean;
  errorBrands: string | null;
  refetchBrands: () => Promise<void>;
  
  // Modèles
  models: string[];
  loadingModels: boolean;
  errorModels: string | null;
  refetchModels: (brand: string) => Promise<void>;
  
  // Helpers
  isReady: boolean;
}

/**
 * Hook robuste pour charger les marques et modèles depuis Supabase
 * Résout les problèmes de chargement/hydratation avec gestion d'état claire
 */
export function useModelData(options: UseModelDataOptions = {}): UseModelDataReturn {
  const { type = 'car', autoLoad = true } = options;
  
  // États pour les marques
  const [brands, setBrands] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [errorBrands, setErrorBrands] = useState<string | null>(null);
  
  // États pour les modèles
  const [models, setModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [errorModels, setErrorModels] = useState<string | null>(null);
  
  // Refs pour éviter les race conditions
  const brandsAbortRef = useRef<AbortController | null>(null);
  const modelsAbortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const previousBrandsRef = useRef<string[]>([]);
  
  // Fonction pour charger les marques
  const refetchBrands = useCallback(async () => {
    // Annuler la requête précédente si elle existe
    if (brandsAbortRef.current) {
      brandsAbortRef.current.abort();
    }
    
    const abortController = new AbortController();
    brandsAbortRef.current = abortController;
    
    setLoadingBrands(true);
    setErrorBrands(null);
    
    try {
      const fetchedBrands = await getBrands(type);
      
      // Vérifier si la requête a été annulée
      if (abortController.signal.aborted || !isMountedRef.current) {
        return;
      }
      
      if (fetchedBrands.length === 0 && previousBrandsRef.current.length > 0) {
        console.warn(`[useModelData] Aucune marque récupérée, conservation des données précédentes`);
        setBrands(previousBrandsRef.current);
      } else {
        setBrands(fetchedBrands);
        previousBrandsRef.current = fetchedBrands;
      }
      
    } catch (err) {
      if (abortController.signal.aborted || !isMountedRef.current) {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement des marques';
      setErrorBrands(errorMessage);
      console.error(`[useModelData] Erreur chargement marques:`, err);
      
      // En cas d'erreur, garder les données précédentes si disponibles
      if (previousBrandsRef.current.length > 0) {
        console.warn(`[useModelData] Conservation des données précédentes en cas d'erreur`);
        setBrands(previousBrandsRef.current);
      } else {
        setBrands([]);
      }
    } finally {
      if (!abortController.signal.aborted && isMountedRef.current) {
        setLoadingBrands(false);
      }
    }
  }, [type]);
  
  // Fonction pour charger les modèles
  const refetchModels = useCallback(async (brand: string) => {
    if (!brand || brand.trim() === '') {
      setModels([]);
      setErrorModels(null);
      return;
    }
    
    // Annuler la requête précédente si elle existe
    if (modelsAbortRef.current) {
      modelsAbortRef.current.abort();
    }
    
    const abortController = new AbortController();
    modelsAbortRef.current = abortController;
    
    setLoadingModels(true);
    setErrorModels(null);
    
    try {
      const fetchedModels = await getModels(type, brand);
      
      // Vérifier si la requête a été annulée
      if (abortController.signal.aborted || !isMountedRef.current) {
        return;
      }
      
      setModels(fetchedModels);
    } catch (err) {
      if (abortController.signal.aborted || !isMountedRef.current) {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement des modèles';
      setErrorModels(errorMessage);
      console.error(`[useModelData] Erreur chargement modèles:`, err);
      setModels([]);
    } finally {
      if (!abortController.signal.aborted && isMountedRef.current) {
        setLoadingModels(false);
      }
    }
  }, [type]);
  
  // Charger les marques au montage si autoLoad est activé
  useEffect(() => {
    if (autoLoad) {
      // Petit délai pour s'assurer que le composant est bien monté
      // et que le client Supabase est initialisé
      const timer = setTimeout(() => {
        refetchBrands();
      }, 100);
      
      return () => {
        clearTimeout(timer);
        if (brandsAbortRef.current) {
          brandsAbortRef.current.abort();
        }
      };
    }
  }, [autoLoad, refetchBrands]);
  
  // Cleanup au démontage
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (brandsAbortRef.current) {
        brandsAbortRef.current.abort();
      }
      if (modelsAbortRef.current) {
        modelsAbortRef.current.abort();
      }
    };
  }, []);
  
  // Calculer si les données sont prêtes
  const isReady = !loadingBrands && brands.length > 0 && errorBrands === null;
  
  return {
    brands,
    loadingBrands,
    errorBrands,
    refetchBrands,
    models,
    loadingModels,
    errorModels,
    refetchModels,
    isReady,
  };
}

/**
 * Hook spécialisé pour charger les marques et modèles pour les deux types (car + moto)
 */
export function useAllModelData(autoLoad: boolean = true) {
  const carData = useModelData({ type: 'car', autoLoad });
  const motoData = useModelData({ type: 'moto', autoLoad });
  
  // Combiner les marques (dédoublonnées)
  const allBrands = Array.from(new Set([...carData.brands, ...motoData.brands])).sort();
  
  // Charger les modèles pour une marque donnée (essayer car puis moto)
  const loadModelsForBrand = useCallback(async (brand: string) => {
    if (!brand) {
      return [];
    }
    
    try {
      const [carModels, motoModels] = await Promise.all([
        getModels('car', brand),
        getModels('moto', brand)
      ]);
      
      // Priorité aux voitures, sinon motos
      return carModels.length > 0 ? carModels : motoModels;
    } catch (err) {
      console.error(`[useAllModelData] Erreur chargement modèles:`, err);
      return [];
    }
  }, []);
  
  return {
    brands: allBrands,
    loadingBrands: carData.loadingBrands || motoData.loadingBrands,
    errorBrands: carData.errorBrands || motoData.errorBrands,
    loadModelsForBrand,
    isReady: carData.isReady && motoData.isReady,
  };
}

