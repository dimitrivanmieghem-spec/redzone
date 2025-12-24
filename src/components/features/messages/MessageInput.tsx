"use client";

import { useState, KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { showToast } = useToast();

  const handleSend = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSend(trimmedContent);
      setContent("");
    } catch (error) {
      console.error("Erreur envoi message:", error);
      showToast("Erreur lors de l'envoi du message", "error");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-white/10 p-4">
      <div className="flex items-end gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tapez votre message... (Entrée pour envoyer, Maj+Entrée pour nouvelle ligne)"
          disabled={disabled || isSending}
          className="flex-1 min-h-[60px] max-h-[200px] bg-neutral-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 resize-none transition-all"
          rows={1}
          style={{
            resize: "vertical",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!content.trim() || isSending || disabled}
          className="w-12 h-12 bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 disabled:hover:scale-100 shadow-lg"
        >
          {isSending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
      <p className="text-xs text-neutral-500 mt-2">
        {content.length}/5000 caractères
      </p>
    </div>
  );
}

