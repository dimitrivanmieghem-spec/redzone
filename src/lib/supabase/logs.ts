// RedZone - Système de Logging pour Monitoring

import { createClient } from "./client";

export type LogLevel = "error" | "info" | "warning";

export interface LogEntry {
  level: LogLevel;
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Logger une entrée dans la table app_logs
 * @param entry - Données du log
 */
export async function logToDatabase(entry: LogEntry): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase.from("app_logs").insert({
      level: entry.level,
      message: entry.message,
      user_id: entry.userId || null,
      metadata: entry.metadata || {},
    });

    if (error) {
      // Ne pas throw pour éviter les boucles infinies de logging
      console.error("Erreur lors de l'écriture du log:", error);
    }
  } catch (error) {
    // Fallback silencieux pour éviter les crashes
    console.error("Erreur critique lors du logging:", error);
  }
}

/**
 * Logger une erreur
 */
export async function logError(
  message: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  console.error(`[ERROR] ${message}`, metadata || {});
  await logToDatabase({
    level: "error",
    message,
    userId,
    metadata,
  });
}

/**
 * Logger une information
 */
export async function logInfo(
  message: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  console.log(`[INFO] ${message}`, metadata || {});
  await logToDatabase({
    level: "info",
    message,
    userId,
    metadata,
  });
}

/**
 * Logger un avertissement
 */
export async function logWarning(
  message: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  console.warn(`[WARNING] ${message}`, metadata || {});
  await logToDatabase({
    level: "warning",
    message,
    userId,
    metadata,
  });
}

