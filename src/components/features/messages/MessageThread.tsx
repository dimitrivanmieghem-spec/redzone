"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Message } from "@/lib/supabase/messages";
import { User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface MessageThreadProps {
  messages: Message[];
  isLoading?: boolean;
}

// Helper function pour formater "il y a X minutes/heures/jours"
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
  
  return date.toLocaleDateString("fr-BE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function MessageThread({ messages, isLoading }: MessageThreadProps) {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-neutral-400">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-400 mb-2">Aucun message</p>
          <p className="text-sm text-neutral-500">Soyez le premier à écrire !</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwnMessage = message.sender_id === user?.id;
        const sender = message.sender;
        const senderName = sender?.full_name || "Utilisateur";
        const senderAvatar = sender?.avatar_url || null;

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${isOwnMessage ? "justify-end" : "justify-start"}`}
          >
            {/* Avatar (seulement pour les messages de l'autre personne) */}
            {!isOwnMessage && (
              <div className="flex-shrink-0">
                {senderAvatar ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                    <Image
                      src={senderAvatar}
                      alt={senderName}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center">
                    <User size={16} className="text-neutral-400" />
                  </div>
                )}
              </div>
            )}

            {/* Message */}
            <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? "items-end" : "items-start"}`}>
              {!isOwnMessage && (
                <span className="text-xs text-neutral-400 mb-1">{senderName}</span>
              )}
              <div
                className={`rounded-2xl px-4 py-2 ${
                  isOwnMessage
                    ? "bg-red-600 text-white"
                    : "bg-neutral-800 text-neutral-100 border border-white/10"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              </div>
              <span className="text-xs text-neutral-500 mt-1">
                {formatTimeAgo(new Date(message.created_at))}
              </span>
            </div>

            {/* Avatar (seulement pour nos propres messages) */}
            {isOwnMessage && (
              <div className="flex-shrink-0">
                {user?.avatar ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center">
                    <User size={16} className="text-neutral-400" />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

