"use server";

// RedZone - Server Actions pour les messages admin/moderator vers propriétaires

import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/supabase/notifications-server";

/**
 * Créer ou récupérer une conversation entre admin/moderator et un propriétaire de véhicule
 * @param vehicleId - ID du véhicule
 * @param ownerId - ID du propriétaire
 * @param initialMessage - Message initial à envoyer
 * @returns ID de la conversation créée ou récupérée
 */
export async function createAdminConversation(
  vehicleId: string,
  ownerId: string,
  initialMessage: string
): Promise<{ success: boolean; conversationId: string | null; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, conversationId: null, error: "Vous devez être connecté" };
    }

    // Vérifier que l'utilisateur est admin ou moderator
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
      return { success: false, conversationId: null, error: "Accès réservé aux administrateurs et modérateurs" };
    }

    // Vérifier que le véhicule existe et appartient au propriétaire
    const { data: vehicle } = await supabase
      .from("vehicles")
      .select("id, owner_id, brand, model")
      .eq("id", vehicleId)
      .single();

    if (!vehicle) {
      return { success: false, conversationId: null, error: "Véhicule introuvable" };
    }

    if (vehicle.owner_id !== ownerId) {
      return { success: false, conversationId: null, error: "Le véhicule n'appartient pas à cet utilisateur" };
    }

    // Déterminer qui est buyer et seller
    // Admin/Moderator = buyer, Propriétaire = seller
    const buyerId = user.id;
    const sellerId = ownerId;

    // Chercher une conversation existante
    const { data: existingConversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("vehicle_id", vehicleId)
      .eq("buyer_id", buyerId)
      .eq("seller_id", sellerId)
      .maybeSingle();

    let conversationId: string;

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      // Créer une nouvelle conversation
      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          vehicle_id: vehicleId,
          buyer_id: buyerId,
          seller_id: sellerId,
        })
        .select("id")
        .single();

      if (createError || !newConversation) {
        return { success: false, conversationId: null, error: createError?.message || "Erreur lors de la création de la conversation" };
      }

      conversationId = newConversation.id;
    }

    // Envoyer le message initial si fourni
    if (initialMessage.trim()) {
      const { error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: buyerId,
          content: initialMessage.trim(),
        });

      if (messageError) {
        console.error("Erreur envoi message initial:", messageError);
        // Ne pas échouer si le message ne peut pas être envoyé, la conversation existe quand même
      } else {
        // Créer une notification pour le propriétaire
        const vehicleName = vehicle.brand && vehicle.model ? `${vehicle.brand} ${vehicle.model}` : "ce véhicule";
        const senderRole = profile.role === "admin" ? "Administrateur" : "Modérateur";
        
        await createNotification(
          ownerId,
          "Nouveau message",
          `${senderRole} vous a envoyé un message concernant ${vehicleName}`,
          "info",
          `/dashboard?tab=messages&conversation=${conversationId}`,
          {
            conversation_id: conversationId,
            vehicle_id: vehicleId,
            sender_role: profile.role,
          }
        );
      }
    }

    return { success: true, conversationId };
  } catch (error) {
    console.error("Erreur createAdminConversation:", error);
    return { success: false, conversationId: null, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

