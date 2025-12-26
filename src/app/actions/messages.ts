"use server";

// Octane98 - Server Actions pour les messages (avec notifications)

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/supabase/notifications-server";

/**
 * Envoyer un message et créer une notification pour le destinataire
 */
export async function sendMessageWithNotification(
  conversationId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Vous devez être connecté" };
    }

    // Vérifier que l'utilisateur a accès à cette conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("buyer_id, seller_id, vehicle_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (!conversation || (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)) {
      return { success: false, error: "Vous n'avez pas accès à cette conversation" };
    }

    // Déterminer le destinataire
    const recipientId = conversation.buyer_id === user.id ? conversation.seller_id : conversation.buyer_id;

    // Valider le contenu
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return { success: false, error: "Le message ne peut pas être vide" };
    }
    if (trimmedContent.length > 5000) {
      return { success: false, error: "Le message ne peut pas dépasser 5000 caractères" };
    }

    // Créer le message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: trimmedContent,
      })
      .select()
      .single();

    if (messageError || !message) {
      return { success: false, error: messageError?.message || "Erreur lors de l'envoi du message" };
    }

    // Récupérer les infos du véhicule pour la notification
    let vehicleName = "ce véhicule";
    if (conversation.vehicle_id) {
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("brand, model")
        .eq("id", conversation.vehicle_id)
        .maybeSingle();
      
      if (vehicle && vehicle.brand && vehicle.model) {
        vehicleName = `${vehicle.brand} ${vehicle.model}`;
      }
    }

    // Créer une notification pour le destinataire
    const notificationTitle = "Nouveau message";
    const notificationMessage = `Vous avez reçu un message concernant ${vehicleName}`;
    const notificationLink = `/dashboard?tab=messages&conversation=${conversationId}`;

    await createNotification(
      recipientId,
      notificationTitle,
      notificationMessage,
      "info",
      notificationLink,
      {
        conversation_id: conversationId,
        message_id: message.id,
      }
    );

    return { success: true };
  } catch (error) {
    console.error("Erreur sendMessageWithNotification:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

