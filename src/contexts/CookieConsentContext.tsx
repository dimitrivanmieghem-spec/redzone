"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface CookieConsent {
  necessary: boolean; // Toujours true (cookies essentiels)
  analytics: boolean;
  marketing: boolean;
}

interface CookieConsentContextType {
  consent: CookieConsent | null;
  hasResponded: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  setCustomConsent: (consent: CookieConsent) => void;
  resetConsent: () => void; // Pour le lien "Gestion des cookies"
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const CONSENT_KEY = "octane98_cookie_consent";
const CONSENT_DATE_KEY = "octane98_cookie_consent_date";
const CONSENT_DURATION_MONTHS = 6;

// Fonction pour charger le consentement initial depuis localStorage
function loadInitialConsent(): { consent: CookieConsent | null; hasResponded: boolean } {
  if (typeof window === "undefined") {
    return { consent: null, hasResponded: false };
  }

  const storedConsent = localStorage.getItem(CONSENT_KEY);
  const storedDate = localStorage.getItem(CONSENT_DATE_KEY);

  if (storedConsent && storedDate) {
    const consentDate = new Date(storedDate);
    const now = new Date();
    const monthsDiff = (now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

    // Vérifier si le consentement est encore valide (< 6 mois)
    if (monthsDiff < CONSENT_DURATION_MONTHS) {
      const parsedConsent = JSON.parse(storedConsent) as CookieConsent;
      return { consent: parsedConsent, hasResponded: true };
    } else {
      // Consentement expiré, le supprimer
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem(CONSENT_DATE_KEY);
    }
  }

  return { consent: null, hasResponded: false };
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const initialState = loadInitialConsent();
  const [consent, setConsent] = useState<CookieConsent | null>(initialState.consent);
  const [hasResponded, setHasResponded] = useState(initialState.hasResponded);

  const saveConsent = (newConsent: CookieConsent) => {
    try {
      setConsent(newConsent);
      setHasResponded(true);
      if (typeof window !== "undefined") {
        localStorage.setItem(CONSENT_KEY, JSON.stringify(newConsent));
        localStorage.setItem(CONSENT_DATE_KEY, new Date().toISOString());
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du consentement:", error);
    }
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  };

  const rejectAll = () => {
    saveConsent({
      necessary: true, // Les cookies essentiels sont toujours acceptés
      analytics: false,
      marketing: false,
    });
  };

  const setCustomConsent = (newConsent: CookieConsent) => {
    saveConsent({
      ...newConsent,
      necessary: true, // Force toujours necessary à true
    });
  };

  const resetConsent = () => {
    localStorage.removeItem(CONSENT_KEY);
    localStorage.removeItem(CONSENT_DATE_KEY);
    setConsent(null);
    setHasResponded(false);
  };

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        hasResponded,
        acceptAll,
        rejectAll,
        setCustomConsent,
        resetConsent,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  }
  return context;
}

