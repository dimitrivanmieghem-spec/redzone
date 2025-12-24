"use client";

// RedZone - Contexte de Simulation de Bannissement (Admin uniquement)
// Utilise des cookies pour persister l'état entre les rafraîchissements

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface BanSimulationContextType {
  isSimulatingBan: boolean;
  toggleSimulation: () => void;
  stopSimulation: () => void;
}

const BanSimulationContext = createContext<BanSimulationContextType | undefined>(undefined);

const COOKIE_NAME = "redzone_ban_simulation";

// Fonctions utilitaires pour gérer les cookies
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
  return null;
}

function setCookie(name: string, value: string, days: number = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

export function BanSimulationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isSimulatingBan, setIsSimulatingBan] = useState(false);

  // Charger l'état depuis le cookie au démarrage (seulement si admin)
  useEffect(() => {
    if (user?.role === "admin") {
      const saved = getCookie(COOKIE_NAME);
      if (saved === "true") {
        setIsSimulatingBan(true);
      }
    } else {
      // Si l'utilisateur n'est plus admin, désactiver la simulation
      setIsSimulatingBan(false);
      deleteCookie(COOKIE_NAME);
    }
  }, [user?.role]);

  const toggleSimulation = () => {
    if (user?.role !== "admin") {
      console.warn("⚠️ [BanSimulation] Seuls les admins peuvent activer la simulation");
      return;
    }

    const newState = !isSimulatingBan;
    setIsSimulatingBan(newState);
    
    if (newState) {
      setCookie(COOKIE_NAME, "true", 7); // 7 jours
    } else {
      deleteCookie(COOKIE_NAME);
    }
  };

  const stopSimulation = () => {
    setIsSimulatingBan(false);
    deleteCookie(COOKIE_NAME);
  };

  return (
    <BanSimulationContext.Provider
      value={{
        isSimulatingBan,
        toggleSimulation,
        stopSimulation,
      }}
    >
      {children}
    </BanSimulationContext.Provider>
  );
}

export function useBanSimulation() {
  const context = useContext(BanSimulationContext);
  if (context === undefined) {
    throw new Error("useBanSimulation must be used within a BanSimulationProvider");
  }
  return context;
}
