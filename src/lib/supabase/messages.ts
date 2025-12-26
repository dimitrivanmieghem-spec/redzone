// Octane98 - Fonctions pour gérer les messages (Client Components)

import { createClient } from "./client";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  // Relations jointes (optionnelles)
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Récupérer tous les messages d'une conversation
 */
export async function getMessages(conversationId: string): Promise<Message[]> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return [];
    }

    // Vérifier que l'utilisateur a accès à cette conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("buyer_id, seller_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (!conversation || (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)) {
      return [];
    }

    // Récupérer les messages sans relation pour éviter les erreurs
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erreur récupération messages:", error);
      return [];
    }

    if (!messages || messages.length === 0) {
      return [];
    }

    // Récupérer les profils des expéditeurs séparément
    const senderIds = [...new Set(messages.map((m: any) => m.sender_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", senderIds);

    // Créer un map pour accès rapide
    const profilesMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

    // Combiner les données
    return messages.map((msg: any) => {
      const profile = profilesMap.get(msg.sender_id);
      return {
        ...msg,
        sender: profile,
      };
    }) as Message[];
  } catch (error) {
    console.error("Erreur getMessages:", error);
    return [];
  }
}

/**
 * Envoyer un message dans une conversation
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<{ success: boolean; message: Message | null; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, message: null, error: "Vous devez être connecté" };
    }

    // Vérifier que l'utilisateur a accès à cette conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("buyer_id, seller_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (!conversation || (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)) {
      return { success: false, message: null, error: "Vous n'avez pas accès à cette conversation" };
    }

    // Valider le contenu
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      return { success: false, message: null, error: "Le message ne peut pas être vide" };
    }
    if (trimmedContent.length > 5000) {
      return { success: false, message: null, error: "Le message ne peut pas dépasser 5000 caractères" };
    }

    // Créer le message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: trimmedContent,
      })
      .select()
      .single();

    if (error || !message) {
      console.error("Erreur création message:", error);
      return { success: false, message: null, error: error?.message || "Erreur lors de l'envoi du message" };
    }

    // Récupérer le profil de l'expéditeur
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    return { 
      success: true, 
      message: {
        ...message,
        sender: senderProfile || undefined,
      } as Message 
    };
  } catch (error) {
    console.error("Erreur sendMessage:", error);
    return { success: false, message: null, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

/**
 * Marquer un message comme lu
 */
export async function markMessageAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: "Vous devez être connecté" };
    }

    const { error } = await supabase
      .from("messages")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) {
      console.error("Erreur marquage message:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur markMessageAsRead:", error);
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}
