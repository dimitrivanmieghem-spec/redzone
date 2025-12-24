"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { getUserFavorites, addFavorite as addFavoriteDB, removeFavorite as removeFavoriteDB, migrateFavoritesFromLocalStorage } from "@/lib/supabase/favorites";

interface FavoritesContextType {
  favorites: string[];
  addFavorite: (id: string) => Promise<void>;
  removeFavorite: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  isFavorite: (id: string) => boolean;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = "certicar_favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isUpdatingRef = useRef(false); // Ref pour éviter les rechargements pendant les mises à jour (ne déclenche pas de re-render)

  // Charger les favoris depuis la base de données ou localStorage
  useEffect(() => {
    const loadFavorites = async () => {
      // Ne pas recharger si on est en train de mettre à jour
      if (isUpdatingRef.current) return;
      
      try {
        setIsLoading(true);
        
        if (user) {
          // Utilisateur connecté : charger depuis la DB et migrer depuis localStorage si nécessaire
          const dbFavorites = await getUserFavorites();
          setFavorites(dbFavorites);
          
          // Migrer les favoris du localStorage vers la DB (une seule fois)
          const migrationResult = await migrateFavoritesFromLocalStorage();
          if (migrationResult.success && migrationResult.migrated > 0) {
            // Recharger après migration
            const updatedFavorites = await getUserFavorites();
            setFavorites(updatedFavorites);
          }
        } else {
          // Utilisateur non connecté : utiliser localStorage (fallback)
          try {
            const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY);
            if (storedFavorites) {
              setFavorites(JSON.parse(storedFavorites));
            }
          } catch (error) {
            console.error("Erreur lors du chargement des favoris localStorage:", error);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des favoris:", error);
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [user]); // Ne charger que quand l'utilisateur change

  // Sauvegarder les favoris dans le localStorage si non connecté (fallback)
  useEffect(() => {
    if (isInitialized && !user) {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error("Erreur lors de la sauvegarde des favoris:", error);
      }
    }
  }, [favorites, isInitialized, user]);

  const addFavorite = async (id: string) => {
    // Éviter les doublons
    if (favorites.includes(id)) return;
    
    isUpdatingRef.current = true;
    
    // Mise à jour optimiste
    setFavorites((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });

    try {
      if (user) {
        // Sauvegarder dans la DB
        const result = await addFavoriteDB(id);
        if (!result.success) {
          // Rollback en cas d'erreur
          setFavorites((prev) => prev.filter((favId) => favId !== id));
          console.error("Erreur ajout favori:", result.error);
          throw new Error(result.error || "Erreur lors de l'ajout du favori");
        }
      }
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const removeFavorite = async (id: string) => {
    isUpdatingRef.current = true;
    
    // Mise à jour optimiste
    setFavorites((prev) => prev.filter((favId) => favId !== id));

    try {
      if (user) {
        // Supprimer de la DB
        const result = await removeFavoriteDB(id);
        if (!result.success) {
          // Rollback en cas d'erreur
          setFavorites((prev) => {
            if (prev.includes(id)) return prev;
            return [...prev, id];
          });
          console.error("Erreur suppression favori:", result.error);
          throw new Error(result.error || "Erreur lors de la suppression du favori");
        }
      }
    } finally {
      isUpdatingRef.current = false;
    }
  };

  const toggleFavorite = async (id: string) => {
    // Vérifier l'état actuel et exécuter l'action appropriée
    // addFavorite et removeFavorite gèrent déjà la mise à jour optimiste
    const isCurrentlyFavorite = favorites.includes(id);
    
    if (isCurrentlyFavorite) {
      await removeFavorite(id);
    } else {
      await addFavorite(id);
    }
  };

  const isFavorite = (id: string) => {
    return favorites.includes(id);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        isLoading,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}

