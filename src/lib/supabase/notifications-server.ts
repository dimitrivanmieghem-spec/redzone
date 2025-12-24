// RedZone - Fonctions pour les Notifications (Server Actions uniquement)
// ⚠️ Ce fichier utilise le client serveur et ne doit PAS être importé dans des Client Components

import { createClient } from "./server";

/**
 * Créer une notification pour un utilisateur
 * ⚠️ SERVER ONLY - À utiliser uniquement dans Server Actions
 * @param userId - ID de l'utilisateur destinataire
 * @param title - Titre de la notification
 * @param message - Message de la notification
 * @param type - Type de notification ('info', 'success', 'error')
 * @param link - Lien optionnel (ex: '/cars/{id}')
 * @param metadata - Métadonnées supplémentaires (optionnel)
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: "info" | "success" | "error" = "info",
  link?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      link: link || null,
      is_read: false,
      metadata: metadata || {},
    });

    if (error) {
      // Ne pas throw pour éviter de faire échouer les actions principales
      console.error("Erreur lors de la création de la notification:", error);
    }
  } catch (error) {
    // Fallback silencieux pour éviter les crashes
    console.error("Erreur critique lors de la création de la notification:", error);
  }
}

