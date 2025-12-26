"use client";

import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

interface SellFormNavigationProps {
  currentStep: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isStep1Valid: boolean;
  isStep2Valid: boolean;
  isStep3Valid: boolean;
  isStep4Valid: boolean;
  isSubmitting: boolean;
  moderationCheckAllowed: boolean;
  isEffectivelyBanned: boolean;
  isSimulatingBan: boolean;
  userRole: string | null;
  turnstileToken: string | null;
  user: { role: string } | null;
}

export default function SellFormNavigation({
  currentStep,
  onPrevious,
  onNext,
  onSubmit,
  isStep1Valid,
  isStep2Valid,
  isStep3Valid,
  isStep4Valid,
  isSubmitting,
  moderationCheckAllowed,
  isEffectivelyBanned,
  isSimulatingBan,
  userRole,
  turnstileToken,
  user,
}: SellFormNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-white/10 shadow-2xl z-[90] pointer-events-auto">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        {/* Bouton Précédent - Visible uniquement si étape > 1 */}
        {currentStep > 1 && currentStep <= 4 ? (
          <button
            type="button"
            onClick={onPrevious}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium rounded-full transition-all duration-200"
          >
            <ChevronLeft size={18} />
            Retour
          </button>
        ) : (
          <div className="w-0" />
        )}

        <div className="flex-1" />

        {/* Bouton Suivant - Visible si étape 1, 2 ou 3 */}
        {currentStep < 4 ? (
          <button
            type="button"
            onClick={onNext}
            disabled={
              (currentStep === 1 && !isStep1Valid) ||
              (currentStep === 2 && !isStep2Valid) ||
              (currentStep === 3 && !isStep3Valid)
            }
            className={`flex items-center gap-2 px-8 py-4 rounded-full font-black text-lg transition-all shadow-2xl ${
              (currentStep === 1 && !isStep1Valid) ||
              (currentStep === 2 && !isStep2Valid) ||
              (currentStep === 3 && !isStep3Valid)
                ? "bg-slate-400 cursor-not-allowed text-white opacity-60"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:scale-105 shadow-red-600/50 active:scale-95"
            }`}
          >
            Suivant
            <ChevronRight size={24} />
          </button>
        ) : currentStep === 4 ? (
          <>
            {/* Note BETA - Publication gratuite */}
            <div className="w-full mb-4">
              <div className="bg-red-900/20 border-2 border-red-600/40 rounded-xl p-4">
                <p className="text-sm text-red-300 font-light text-center tracking-wide">
                  ℹ️ Durant la phase Bêta, la publication d&apos;annonces est entièrement gratuite et illimitée.
                </p>
              </div>
            </div>

            {/* Bouton Publier/Enregistrer - Visible uniquement étape 3 */}
            {isEffectivelyBanned && (
              <div className="mb-4 p-4 bg-red-900/20 border-2 border-red-600/40 rounded-xl">
                <p className="text-sm font-bold text-red-300 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {isSimulatingBan && userRole === "admin"
                    ? "Mode test actif : Publication d'annonces désactivée (simulation)"
                    : "Votre compte est suspendu. Vous ne pouvez pas publier d'annonces."}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={onSubmit}
              disabled={
                isSubmitting || 
                !moderationCheckAllowed || 
                !isStep4Valid || 
                (!user && !turnstileToken) || // CAPTCHA requis pour les invités
                isEffectivelyBanned // Bloqué si banni ou en simulation
              }
              className={`flex items-center gap-2 px-8 py-4 rounded-full font-black text-lg transition-all shadow-2xl ${
                isSubmitting || 
                !moderationCheckAllowed || 
                !isStep4Valid || 
                (!user && !turnstileToken) ||
                isEffectivelyBanned
                  ? "bg-slate-400 cursor-not-allowed text-white opacity-60"
                  : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:scale-105 shadow-red-600/50 active:scale-95"
              }`}
              title={
                isEffectivelyBanned
                  ? (isSimulatingBan && userRole === "admin"
                      ? "Mode test actif : Publication d'annonces désactivée (simulation)"
                      : "Votre compte est suspendu. Vous ne pouvez pas publier d'annonces.")
                  : !isStep4Valid 
                  ? "Une annonce de sportive doit avoir au moins une photo pour être validée." 
                  : ""
              }
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white inline-block mr-2" />
                  Publication...
                </>
              ) : (
                <>
                  ✓ Publier l&apos;annonce
                </>
              )}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

