"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

export default function BetaBadge() {
  const [isVisible, setIsVisible] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  // Vérifier si l'utilisateur a déjà fermé le badge
  useEffect(() => {
    const isDismissed = localStorage.getItem("betaBadgeDismissed");
    if (isDismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("betaBadgeDismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 w-64 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl border-2 border-red-600" style={{ animation: 'fadeIn 0.2s ease-in-out forwards' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="space-y-2">
              <p className="text-sm font-bold text-white">
                Site en développement actif
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Des bugs peuvent survenir. Un problème ? Contactez :{" "}
                <a
                  href="mailto:admin@octane98.be"
                  className="text-red-500 hover:text-red-400 font-bold underline"
                >
                  l&apos;administrateur
                </a>
              </p>
            </div>
          </div>
          {/* Flèche vers le bas */}
          <div className="absolute bottom-0 right-6 transform translate-y-full">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-red-600"></div>
          </div>
        </div>
      )}

      {/* Badge principal */}
      <div
        className="relative group"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full shadow-2xl shadow-red-600/50 hover:shadow-red-600/70 transition-all duration-300 hover:scale-110 cursor-pointer border-2 border-red-800">
          <span className="text-lg">🚧</span>
          <span className="font-black text-sm tracking-tight">BETA v0.1</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="ml-1 p-0.5 hover:bg-red-800 rounded-full transition-colors"
            aria-label="Fermer le badge BETA"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

