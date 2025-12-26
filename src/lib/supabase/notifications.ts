// Octane98 - Fonctions pour les Notifications (Client Components)
// ⚠️ Ce fichier utilise le client navigateur et peut être importé dans des Client Components
// Pour créer des notifications depuis Server Actions, utilisez notifications-server.ts

import { createClient } from "./client";

/**
 * Récupérer les notifications d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @param unreadOnly - Si true, retourne seulement les notifications non lues
 */
export async function getNotifications(
  userId: string,
  unreadOnly: boolean = false
): Promise<any[]> {
  const supabase = createClient();

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erreur récupération notifications:", error);
    return [];
  }

  return data || [];
}

/**
 * Récupérer toutes les notifications de l'utilisateur connecté
 * @param limit - Nombre maximum de notifications à retourner
 */
export async function getAllNotifications(limit: number = 20): Promise<Notification[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Erreur récupération notifications:", error);
    return [];
  }

  return (data as Notification[]) || [];
}

/**
 * Récupérer le nombre de notifications non lues
 */
export async function getUnreadNotificationsCount(): Promise<number> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return 0;
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Erreur récupération nombre notifications:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Marquer une notification comme lue
 * @param notificationId - ID de la notification
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId);

  if (error) {
    console.error("Erreur mise à jour notification:", error);
  }
}

/**
 * Marquer toutes les notifications comme lues
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    console.error("Erreur mise à jour notifications:", error);
  }
}

/**
 * Supprimer une notification
 * @param notificationId - ID de la notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) {
    console.error("Erreur suppression notification:", error);
  }
}

/**
 * Type de notification
 */
export interface Notification {
  id: string;
  user_id: string;
  type: "info" | "success" | "error";
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
}
