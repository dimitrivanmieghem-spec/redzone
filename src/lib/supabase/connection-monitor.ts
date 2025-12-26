// Octane98 - Moniteur de Connexion Supabase
// Détecte et gère les problèmes de connexion

import { resetClient } from "./client-singleton";

let connectionCheckInterval: NodeJS.Timeout | null = null;
let lastSuccessfulRequest: number = Date.now();
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;
const CONNECTION_CHECK_INTERVAL = 30000; // 30 secondes

/**
 * Vérifie la santé de la connexion Supabase
 */
export async function checkConnectionHealth(): Promise<boolean> {
  try {
    const { createClient } = await import("./client-singleton");
    const supabase = createClient();
    
    // Faire une requête simple pour vérifier la connexion
    // Timeout augmenté à 8 secondes pour éviter les faux positifs
    const queryResult = await Promise.race([
      supabase.from("profiles").select("id").limit(1),
      new Promise<{ error: any }>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), 8000);
      }),
    ]) as any;
    
    const error = queryResult?.error;

    if (error && error.message?.includes("Timeout")) {
      consecutiveFailures++;
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.warn("⚠️ [ConnectionMonitor] Trop d'échecs consécutifs, réinitialisation du client");
        resetClient();
        consecutiveFailures = 0;
      }
      return false;
    }

    // Connexion OK
    lastSuccessfulRequest = Date.now();
    consecutiveFailures = 0;
    return true;
  } catch (error) {
    console.error("❌ [ConnectionMonitor] Erreur vérification connexion:", error);
    consecutiveFailures++;
    
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.warn("⚠️ [ConnectionMonitor] Trop d'échecs consécutifs, réinitialisation du client");
      resetClient();
      consecutiveFailures = 0;
    }
    
    return false;
  }
}

/**
 * Démarre le monitoring de la connexion
 */
export function startConnectionMonitoring() {
  if (typeof window === "undefined") return; // Seulement côté client
  
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
  }

  connectionCheckInterval = setInterval(() => {
    checkConnectionHealth();
  }, CONNECTION_CHECK_INTERVAL);
}

/**
 * Arrête le monitoring de la connexion
 */
export function stopConnectionMonitoring() {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
}

