"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
  isLoading?: boolean;
}

export default function SaveSearchModal({ isOpen, onClose, onSave, isLoading }: SaveSearchModalProps) {
  const [name, setName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave(name.trim());
    setName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-2xl font-black text-white">Sauvegarder la recherche</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X size={20} className="text-neutral-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-bold text-neutral-300 mb-2">
              Nom de la recherche
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Porsche 911 sous 100k€"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-neutral-800 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 text-white placeholder:text-neutral-500 disabled:opacity-50"
              autoFocus
            />
            <p className="text-xs text-neutral-500 mt-2">
              Donnez un nom à votre recherche pour la retrouver facilement
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 border border-white/10 text-white font-bold rounded-xl transition-all disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

