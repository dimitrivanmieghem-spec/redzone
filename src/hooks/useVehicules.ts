"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Vehicule } from "@/lib/supabase/types";

// Helper function pour convertir les valeurs numériques
function parseNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function useVehicules(filters?: {
  status?: "pending" | "active" | "rejected";
  type?: "car" | "moto";
  marque?: string;
  modele?: string;
  prixMin?: number;
  prixMax?: number;
}) {
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousDataRef = useRef<Vehicule[]>([]); // Garder les données précédentes en cas d'erreur

  useEffect(() => {
    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    async function fetchVehicules() {
      // Créer un nouvel AbortController pour cette requête
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        let query = supabase
          .from("vehicles")
          .select("*")
          .order("created_at", { ascending: false });

        // Filtrer par défaut sur les véhicules actifs si aucun filtre de status n'est spécifié
        if (filters?.status) {
          query = query.eq("status", filters.status);
        } else {
          // Par défaut, ne montrer que les véhicules actifs
          query = query.eq("status", "active");
        }

        // Appliquer les autres filtres (utiliser les noms de colonnes anglais pour Supabase)
        if (filters?.type) {
          query = query.eq("type", filters.type);
        }
        if (filters?.marque) {
          query = query.eq("brand", filters.marque);
        }
        if (filters?.modele) {
          query = query.eq("model", filters.modele);
        }
        if (filters?.prixMin) {
          query = query.gte("price", filters.prixMin);
        }
        if (filters?.prixMax) {
          query = query.lte("price", filters.prixMax);
        }

        const { data, error: fetchError } = await query;

        // Vérifier si la requête a été annulée
        if (abortController.signal.aborted) {
          return;
        }

        if (fetchError) {
          throw fetchError;
        }

        // Utiliser directement les données avec colonnes anglaises (pas de mapping)
        // S'assurer que les valeurs numériques sont bien des nombres
        const newVehicules = ((data || []).map(v => ({
          ...v,
          price: parseNumber(v.price),
          year: parseNumber(v.year),
          mileage: parseNumber(v.mileage),
          power_hp: parseNumber(v.power_hp),
          fiscal_horsepower: parseNumber(v.fiscal_horsepower),
          seats_count: parseNumber(v.seats_count),
        })) as Vehicule[]) || [];
        setVehicules(newVehicules);
        previousDataRef.current = newVehicules; // Sauvegarder les données réussies
      } catch (err) {
        // Vérifier si la requête a été annulée
        if (abortController.signal.aborted) {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : "Erreur de chargement";
        setError(errorMessage);
        console.error("Erreur useVehicules:", err);
        
        // Ne pas vider les données si on a déjà des données précédentes
        // Cela évite que les données disparaissent en cas d'erreur réseau temporaire
        if (previousDataRef.current.length > 0) {
          console.warn("Erreur de chargement, conservation des données précédentes");
          // Garder les données précédentes au lieu de vider
        } else {
          setVehicules([]);
        }
      } finally {
        // Ne mettre isLoading à false que si cette requête n'a pas été annulée
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchVehicules();

    // Cleanup: annuler la requête si le composant est démonté ou si les dépendances changent
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    filters?.status ?? "active", // Utiliser une valeur par défaut pour stabiliser la dépendance
    filters?.type,
    filters?.marque,
    filters?.modele,
    filters?.prixMin,
    filters?.prixMax,
  ]);

  return { vehicules, isLoading, error };
}

export function useVehicule(id: string) {
  const [vehicule, setVehicule] = useState<Vehicule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVehicule() {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        // Utiliser directement les données avec colonnes anglaises (pas de mapping)
        // S'assurer que les valeurs numériques sont bien des nombres
        const mappedVehicule = {
          ...data,
          price: parseNumber(data.price),
          year: parseNumber(data.year),
          mileage: parseNumber(data.mileage),
          power_hp: parseNumber(data.power_hp),
          fiscal_horsepower: parseNumber(data.fiscal_horsepower),
          seats_count: parseNumber(data.seats_count),
        } as Vehicule;
        setVehicule(mappedVehicule);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Véhicule introuvable");
        console.error("Erreur useVehicule:", err);
        setVehicule(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      fetchVehicule();
    }
  }, [id]);

  return { vehicule, isLoading, error };
}

