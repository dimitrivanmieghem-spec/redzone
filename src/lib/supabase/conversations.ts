// RedZone - Fonctions pour gérer les conversations (Client Components)

import { createClient } from "./client";

export interface Conversation {
  id: string;
  vehicle_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  buyer_last_read_at: string | null;
  seller_last_read_at: string | null;
  // Relations jointes (optionnelles)
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    price: number;
    image: string;
  };
  buyer?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  seller?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  unread_count?: number;
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
}

/**
 * Créer ou récupérer une conversation
 * Si une conversation existe déjà pour ce couple (buyer, seller, vehicle), la retourne
 * Sinon, en crée une nouvelle
 */
export async function getOrCreateConversation(
  vehicleId: string,
  sellerId: string
): Promise<{ success: boolean; conversation: Conversation | null; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, conversation: null, error: "Vous devez être connecté" };
    }

    // Chercher une conversation existante
    const { data: existingConversation, error: findError } = await supabase
      .from("conversations")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .eq("buyer_id", user.id)
      .eq("seller_id", sellerId)
      .maybeSingle(); // Utiliser maybeSingle au lieu de single pour éviter les erreurs si pas trouvé

    if (existingConversation && !findError) {
      // Conversation existante trouvée
      return { success: true, conversation: existingConversation as Conversation };
    }

    // Vérifier que l'utilisateur n'essaie pas de se contacter lui-même
    if (user.id === sellerId) {
      return { success: false, conversation: null, error: "Vous ne pouvez pas créer une conversation avec vous-même" };
    }

    // Créer une nouvelle conversation
    const { data: newConversation, error: createError } = await supabase
      .from("conversations")
      .insert({
        vehicle_id: vehicleId,
        buyer_id: user.id,
        seller_id: sellerId,
      })
      .select()
      .single();

    if (createError || !newConversation) {
      console.error("Erreur création conversation:", createError);
      return { success: false, conversation: null, error: createError?.message || "Erreur lors de la création de la conversation" };
    }

    return { success: true, conversation: newConversation as Conversation };
  } catch (error) {
    console.error("Erreur getOrCreateConversation:", error);
    return { success: false, conversation: null, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

/**
 * Récupérer toutes les conversations de l'utilisateur connecté
 */
export async function getUserConversations(): Promise<Conversation[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    // Récupérer les conversations où l'utilisateur est buyer ou seller (sans relations pour éviter les erreurs)
    const { data: conversations, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Erreur récupération conversations:", error);
      return [];
    }

    if (!conversations || conversations.length === 0) {
      return [];
    }

    // Récupérer les véhicules et profils séparément pour éviter les erreurs de relations
    const vehicleIds = [...new Set(conversations.map(c => c.vehicle_id))];
    const userIds = [...new Set([
      ...conversations.map(c => c.buyer_id),
      ...conversations.map(c => c.seller_id),
    ])];

    // Récupérer les véhicules
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, brand, model, price, image")
      .in("id", vehicleIds);

    // Récupérer les profils
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    // Créer des maps pour accès rapide
    const vehiclesMap = new Map((vehicles || []).map(v => [v.id, v]));
    const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

    // Pour chaque conversation, récupérer le dernier message et le nombre de non-lus
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        // Récupérer le dernier message
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Compter les messages non lus pour cet utilisateur
        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id) // Seulement les messages de l'autre personne
          .eq("is_read", false);

        return {
          ...conv,
          vehicle: vehiclesMap.get(conv.vehicle_id),
          buyer: profilesMap.get(conv.buyer_id),
          seller: profilesMap.get(conv.seller_id),
          last_message: lastMessage || undefined,
          unread_count: unreadCount || 0,
        } as Conversation;
      })
    );

    return conversationsWithDetails;
  } catch (error) {
    console.error("Erreur getUserConversations:", error);
    return [];
  }
}

/**
 * Récupérer une conversation par ID
 */
export async function getConversationById(conversationId: string): Promise<Conversation | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }

    const { data: conversation, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .maybeSingle();

    if (error || !conversation) {
      console.error("Erreur récupération conversation:", error);
      return null;
    }

    // Récupérer les données liées séparément
    const [vehicleResult, buyerResult, sellerResult] = await Promise.all([
      supabase.from("vehicles").select("id, brand, model, price, image").eq("id", conversation.vehicle_id).maybeSingle(),
      supabase.from("profiles").select("id, full_name, avatar_url").eq("id", conversation.buyer_id).maybeSingle(),
      supabase.from("profiles").select("id, full_name, avatar_url").eq("id", conversation.seller_id).maybeSingle(),
    ]);

    return {
      ...conversation,
      vehicle: vehicleResult.data || undefined,
      buyer: buyerResult.data || undefined,
      seller: sellerResult.data || undefined,
    } as Conversation;
  } catch (error) {
    console.error("Erreur getConversationById:", error);
    return null;
  }
}

/**
 * Marquer une conversation comme lue (mettre à jour buyer_last_read_at ou seller_last_read_at)
 */
export async function markConversationAsRead(conversationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Vous devez être connecté" };
    }

    // Récupérer la conversation pour déterminer si l'utilisateur est buyer ou seller
    const { data: conversation } = await supabase
      .from("conversations")
      .select("buyer_id, seller_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (!conversation) {
      return { success: false, error: "Conversation introuvable" };
    }

    const isBuyer = conversation.buyer_id === user.id;
    const updateField = isBuyer ? "buyer_last_read_at" : "seller_last_read_at";

    const { error } = await supabase
      .from("conversations")
      .update({ [updateField]: new Date().toISOString() })
      .eq("id", conversationId);

    if (error) {
      console.error("Erreur mise à jour conversation:", error);
      return { success: false, error: error.message };
    }

    // Marquer aussi tous les messages comme lus
    await supabase
      .from("messages")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id); // Seulement les messages de l'autre personne

    return { success: true };
  } catch (error) {
    console.error("Erreur markConversationAsRead:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
