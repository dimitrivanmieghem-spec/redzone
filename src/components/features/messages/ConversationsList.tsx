"use client";

import { Conversation } from "@/lib/supabase/conversations";
import ConversationItem from "./ConversationItem";
import { Loader2, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ConversationsListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  isLoading?: boolean;
}

export default function ConversationsList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  isLoading,
}: ConversationsListProps) {
  const { user } = useAuth();

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="animate-spin text-red-600 mx-auto mb-4" size={32} />
          <p className="text-neutral-400">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} className="text-neutral-400" />
          </div>
          <p className="text-neutral-300 font-medium mb-2">Aucune conversation</p>
          <p className="text-sm text-neutral-500">
            Contactez un vendeur depuis une annonce pour commencer
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedConversationId === conversation.id}
          onClick={() => onSelectConversation(conversation.id)}
          currentUserId={user.id}
        />
      ))}
    </div>
  );
}

