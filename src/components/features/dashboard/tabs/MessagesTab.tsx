"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { getUserConversations, markConversationAsRead } from "@/lib/supabase/conversations";
import { getMessages } from "@/lib/supabase/messages";
import { sendMessageWithNotification } from "@/app/actions/messages";
import type { Conversation } from "@/lib/supabase/conversations";
import type { Message } from "@/lib/supabase/messages";
import ConversationsList from "@/components/features/messages/ConversationsList";
import MessageThread from "@/components/features/messages/MessageThread";
import MessageInput from "@/components/features/messages/MessageInput";

export default function MessagesTab() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isInitialConversationsLoad, setIsInitialConversationsLoad] = useState(true);

  // Récupérer la conversation depuis l'URL si présente
  useEffect(() => {
    const conversationParam = searchParams.get("conversation");
    if (conversationParam) {
      setSelectedConversationId(conversationParam);
    }
  }, [searchParams]);

  // Charger les conversations (premier chargement uniquement, pas de polling)
  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      try {
        setIsLoadingConversations(true);
        const convos = await getUserConversations();
        setConversations(convos);
        
        // Si une conversation est dans l'URL et n'est pas encore sélectionnée, la sélectionner
        const conversationParam = searchParams.get("conversation");
        if (conversationParam && !selectedConversationId) {
          setSelectedConversationId(conversationParam);
        }
      } catch (error) {
        console.error("Erreur chargement conversations:", error);
        const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement des conversations";
        // Vérifier si c'est une erreur de table manquante
        if (errorMessage.includes("does not exist") || errorMessage.includes("relation") || errorMessage.includes("table")) {
          showToast("Les tables de messagerie n'existent pas encore. Veuillez exécuter le script SQL dans Supabase.", "error");
        } else {
          showToast(errorMessage, "error");
        }
      } finally {
        setIsLoadingConversations(false);
        setIsInitialConversationsLoad(false);
      }
    };

    loadConversations();
  }, [user, searchParams, selectedConversationId, showToast]);

  // Charger les messages de la conversation sélectionnée (premier chargement uniquement)
  useEffect(() => {
    if (!selectedConversationId || !user) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const msgs = await getMessages(selectedConversationId);
        setMessages(msgs);
        
        // Marquer la conversation comme lue (seulement si on a des messages)
        if (msgs.length > 0) {
          await markConversationAsRead(selectedConversationId);
        }
      } catch (error) {
        console.error("Erreur chargement messages:", error);
        const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement des messages";
        if (errorMessage.includes("does not exist") || errorMessage.includes("relation") || errorMessage.includes("table")) {
          showToast("Les tables de messagerie n'existent pas encore. Veuillez exécuter le script SQL dans Supabase.", "error");
        }
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedConversationId, user, showToast]);

  // Souscription Supabase Realtime pour les nouveaux messages de la conversation active (optimisation)
  useEffect(() => {
    if (!selectedConversationId || !user) return;

    const supabase = createClient();
    
    // Souscrire aux changements sur la table messages pour cette conversation
    const channel = supabase
      .channel(`messages-${selectedConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversationId}`, // Seulement les messages de cette conversation
        },
        async (payload: any) => {
          const newMessage = payload.new as any;
          
          // Récupérer le profil de l'expéditeur pour le nouveau message
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", newMessage.sender_id)
            .maybeSingle();
          
          // Construire l'objet Message complet
          const message: Message = {
            id: newMessage.id,
            conversation_id: newMessage.conversation_id,
            sender_id: newMessage.sender_id,
            content: newMessage.content,
            created_at: newMessage.created_at,
            is_read: newMessage.is_read || false,
            read_at: newMessage.read_at || null,
            sender: senderProfile || undefined,
          };
          
          // Ajouter le nouveau message à l'état local (sans recharger toute la liste)
          setMessages((prevMessages) => {
            // Éviter les doublons (si le message existe déjà)
            if (prevMessages.some((m) => m.id === message.id)) {
              return prevMessages;
            }
            // Ajouter le nouveau message en gardant l'ordre chronologique
            return [...prevMessages, message].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          });
          
          // Si c'est un message de l'autre personne (pas de nous), marquer la conversation comme lue
          if (newMessage.sender_id !== user.id) {
            await markConversationAsRead(selectedConversationId);
          }
          
          // Recharger la liste des conversations pour mettre à jour le dernier message
          const convos = await getUserConversations();
          setConversations(convos);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, user]);

  // Souscription globale pour mettre à jour la liste des conversations quand un nouveau message arrive
  // (même si ce n'est pas dans la conversation active)
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    
    // Souscrire à tous les nouveaux messages pour mettre à jour la liste des conversations
    const channel = supabase
      .channel('all-user-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload: any) => {
          const newMessage = payload.new as any;
          
          // Vérifier si ce message appartient à une conversation de l'utilisateur
          // On recharge les conversations pour mettre à jour le dernier message et le compteur non lu
          const convos = await getUserConversations();
          setConversations(convos);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    // Mettre à jour l'URL sans recharger la page
    router.replace(`/dashboard?tab=messages&conversation=${conversationId}`, { scroll: false });
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    try {
      const result = await sendMessageWithNotification(selectedConversationId, content);
      if (!result.success) {
        throw new Error(result.error || "Erreur lors de l'envoi");
      }

      // Le message sera automatiquement ajouté via Realtime, donc pas besoin de recharger les messages
      // La liste des conversations sera aussi mise à jour via Realtime
      
      // Afficher un toast de succès
      showToast("Message envoyé avec succès", "success");
    } catch (error) {
      console.error("Erreur envoi message:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'envoi du message";
      showToast(errorMessage, "error");
      throw error; // Re-throw pour que MessageInput puisse gérer l'erreur
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
          Messages
        </h1>
        <p className="text-slate-400">
          Communiquez avec les vendeurs en toute sécurité
        </p>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex h-[600px]">
          {/* Liste des conversations */}
          <div className="w-full md:w-80 border-r border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Conversations</h2>
              <p className="text-xs text-neutral-400 mt-1">
                {conversations.length} conversation{conversations.length > 1 ? "s" : ""}
              </p>
            </div>
            <ConversationsList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              isLoading={isLoadingConversations}
            />
          </div>

          {/* Zone de conversation */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header de la conversation */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    {selectedConversation.vehicle && (
                      <div className="flex-1">
                        <h3 className="font-bold text-white">
                          {selectedConversation.vehicle.brand} {selectedConversation.vehicle.model}
                        </h3>
                        <p className="text-sm text-neutral-400">
                          Avec {selectedConversation.buyer_id === user?.id 
                            ? (selectedConversation.seller?.full_name || "le vendeur")
                            : (selectedConversation.buyer?.full_name || "l'acheteur")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thread de messages */}
                <MessageThread messages={messages} isLoading={isLoadingMessages} />

                {/* Zone de saisie */}
                <MessageInput onSend={handleSendMessage} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={48} className="text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-300 font-medium mb-2">Sélectionnez une conversation</p>
                  <p className="text-sm text-neutral-500">
                    Ou contactez un vendeur depuis une annonce
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

