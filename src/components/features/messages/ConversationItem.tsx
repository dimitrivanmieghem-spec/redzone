"use client";

import Image from "next/image";
import { Conversation } from "@/lib/supabase/conversations";
import { Car, User } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  currentUserId: string;
}

// Helper function pour formater "il y a X minutes/heures/jours"
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "À l'instant";
  if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)} j`;
  
  return date.toLocaleDateString("fr-BE", { day: "numeric", month: "short" });
}

export default function ConversationItem({
  conversation,
  isSelected,
  onClick,
  currentUserId,
}: ConversationItemProps) {
  const isBuyer = conversation.buyer_id === currentUserId;
  const otherUser = isBuyer ? conversation.seller : conversation.buyer;
  const vehicle = conversation.vehicle;
  const unreadCount = conversation.unread_count || 0;
  const lastMessage = conversation.last_message;

  // Déterminer le nom à afficher
  const displayName = otherUser?.full_name || "Utilisateur";
  const avatarUrl = otherUser?.avatar_url || null;
  const vehicleName = vehicle ? `${vehicle.brand} ${vehicle.model}` : "Véhicule";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl transition-all hover:bg-neutral-800/50 ${
        isSelected ? "bg-red-600/20 border-2 border-red-600/50" : "border border-white/5"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10">
              <Image
                src={avatarUrl}
                alt={displayName}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-neutral-800 border-2 border-white/10 flex items-center justify-center">
              <User size={24} className="text-neutral-400" />
            </div>
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className={`font-bold text-sm truncate ${unreadCount > 0 ? "text-white" : "text-neutral-300"}`}>
              {displayName}
            </h4>
            {lastMessage && (
              <span className="text-xs text-neutral-500 flex-shrink-0">
                {formatTimeAgo(new Date(lastMessage.created_at))}
              </span>
            )}
          </div>

          {/* Véhicule */}
          <div className="flex items-center gap-1.5 mb-2">
            <Car size={12} className="text-neutral-500" />
            <span className="text-xs text-neutral-400 truncate">{vehicleName}</span>
          </div>

          {/* Dernier message */}
          {lastMessage && (
            <p className={`text-xs truncate ${unreadCount > 0 ? "text-neutral-200 font-medium" : "text-neutral-500"}`}>
              {lastMessage.content}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

