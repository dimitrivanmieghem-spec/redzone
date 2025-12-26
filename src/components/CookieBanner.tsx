"use client";

import { useState, useEffect } from "react";
import { Cookie, X, Settings, CheckCircle, Shield } from "lucide-react";
import Link from "next/link";
import { useCookieConsent, CookieConsent } from "@/contexts/CookieConsentContext";

export default function CookieBanner() {
  const { hasResponded, acceptAll, rejectAll, setCustomConsent } = useCookieConsent();
  const [showCustomize, setShowCustomize] = useState(false);
  const [shouldShow, setShouldShow] = useState(false); // État local pour éviter l'hydratation
  const [customSettings, setCustomSettings] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  // Vérifier après l'hydratation si on doit afficher le bandeau
  useEffect(() => {
    // Attendre que le composant soit monté côté client
    if (typeof window !== "undefined") {
      // Vérifier directement dans localStorage pour éviter les problèmes d'hydratation
      const consentKey = "octane98_cookie_consent";
      const consentDateKey = "octane98_cookie_consent_date";
      const storedConsent = localStorage.getItem(consentKey);
      const storedDate = localStorage.getItem(consentDateKey);

      if (storedConsent && storedDate) {
        const consentDate = new Date(storedDate);
        const now = new Date();
        const monthsDiff = (now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        
        // Si le consentement est valide (< 6 mois), ne pas afficher
        if (monthsDiff < 6) {
          setShouldShow(false);
          return;
        }
      }
      
      // Si pas de consentement ou expiré, afficher le bandeau
      setShouldShow(!hasResponded);
    }
  }, [hasResponded]);

  // Ne pas afficher le bandeau si l'utilisateur a déjà répondu ou si on ne doit pas l'afficher
  if (!shouldShow || hasResponded) {
    return null;
  }

  const handleCustomize = () => {
    setShowCustomize(true);
  };

  const handleSaveCustom = () => {
    try {
      setCustomConsent(customSettings);
      setShowCustomize(false);
      setShouldShow(false); // Faire disparaître immédiatement
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des préférences:", error);
    }
  };

  const handleCloseCustomize = () => {
    setShowCustomize(false);
  };

  const handleAcceptAll = () => {
    try {
      acceptAll();
      setShouldShow(false); // Faire disparaître immédiatement
    } catch (error) {
      console.error("Erreur lors de l'acceptation:", error);
    }
  };

  const handleRejectAll = () => {
    try {
      rejectAll();
      setShouldShow(false); // Faire disparaître immédiatement
    } catch (error) {
      console.error("Erreur lors du rejet:", error);
    }
  };

  return (
    <>
      {/* Bandeau principal */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t-2 border-slate-200 shadow-2xl animate-in slide-in-from-bottom duration-500">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Icône et texte */}
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Cookie size={24} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">
                  🍪 Respect de votre vie privée
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Nous utilisons des cookies pour améliorer votre expérience et analyser notre trafic. 
                  Les cookies essentiels sont nécessaires au fonctionnement du site. 
                  Vous pouvez accepter, refuser ou personnaliser vos préférences.{" "}
                  <Link href="/legal/privacy" className="text-red-600 hover:text-red-700 font-bold underline">
                    En savoir plus
                  </Link>
                </p>
              </div>
            </div>

            {/* Boutons d'action - ÉGALITÉ DE VISIBILITÉ */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Bouton Personnaliser */}
              <button
                type="button"
                onClick={handleCustomize}
                className="px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 font-bold rounded-full hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2 hover:scale-105 shadow-lg whitespace-nowrap"
              >
                <Settings size={18} />
                Personnaliser
              </button>

              {/* Bouton Tout refuser / Continuer sans accepter */}
              <button
                type="button"
                onClick={handleRejectAll}
                className="px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-full hover:bg-slate-100 transition-all hover:scale-105 shadow-lg whitespace-nowrap"
              >
                Continuer sans accepter
              </button>

              {/* Bouton Tout accepter */}
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 hover:scale-105 shadow-xl whitespace-nowrap"
              >
                <CheckCircle size={18} />
                Tout accepter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modale de personnalisation */}
      {showCustomize && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <Settings size={24} className="text-red-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Gérer mes préférences cookies
                </h2>
              </div>
              <button
                onClick={handleCloseCustomize}
                className="w-10 h-10 hover:bg-slate-100 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={24} className="text-slate-600" />
              </button>
            </div>

            {/* Corps */}
            <div className="p-6 space-y-6">
              {/* Explication */}
              <div className="bg-red-50 p-4 rounded-2xl">
                <p className="text-sm text-slate-700">
                  <strong>🔒 Votre vie privée est importante.</strong> Vous avez le contrôle total sur les cookies que nous utilisons. 
                  Les cookies essentiels sont toujours actifs car nécessaires au fonctionnement du site.
                </p>
              </div>

              {/* Cookies Essentiels (Toujours actifs) */}
              <div className="bg-green-50 border-2 border-green-200 p-6 rounded-2xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield size={24} className="text-green-600" />
                      <h3 className="text-lg font-black text-slate-900">Cookies Essentiels</h3>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">
                      Nécessaires au fonctionnement du site (authentification, panier, sécurité).
                      <strong> Ces cookies ne peuvent pas être désactivés.</strong>
                    </p>
                    <p className="text-xs text-slate-600">
                      Exemples : Session utilisateur, préférences de langue, sécurité CSRF
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <div className="w-16 h-8 bg-green-500 rounded-full flex items-center px-1">
                      <div className="w-6 h-6 bg-white rounded-full translate-x-8 shadow-lg" />
                    </div>
                    <p className="text-xs text-green-700 font-bold mt-1 text-center">ACTIF</p>
                  </div>
                </div>
              </div>

              {/* Cookies Analytiques */}
              <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl hover:border-red-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 mb-2">Cookies Analytiques</h3>
                    <p className="text-sm text-slate-700 mb-2">
                      Nous permettent de comprendre comment vous utilisez le site pour l&apos;améliorer (pages visitées, temps de navigation).
                    </p>
                    <p className="text-xs text-slate-600">
                      Exemples : Google Analytics (anonymisé), statistiques de trafic
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <button
                      type="button"
                      onClick={() => setCustomSettings(prev => ({ ...prev, analytics: !prev.analytics }))}
                      className={`relative w-16 h-8 rounded-full transition-colors duration-200 ${
                        customSettings.analytics ? "bg-red-600" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 shadow-lg ${
                          customSettings.analytics ? "translate-x-8" : ""
                        }`}
                      />
                    </button>
                    <p className="text-xs font-bold mt-1 text-center">
                      {customSettings.analytics ? (
                        <span className="text-red-600">ACTIF</span>
                      ) : (
                        <span className="text-slate-500">INACTIF</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cookies Marketing */}
              <div className="bg-white border-2 border-slate-200 p-6 rounded-2xl hover:border-red-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 mb-2">Cookies Marketing</h3>
                    <p className="text-sm text-slate-700 mb-2">
                      Utilisés pour afficher des publicités pertinentes et mesurer l&apos;efficacité de nos campagnes.
                    </p>
                    <p className="text-xs text-slate-600">
                      Exemples : Facebook Pixel, Google Ads, Remarketing
                    </p>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <button
                      type="button"
                      onClick={() => setCustomSettings(prev => ({ ...prev, marketing: !prev.marketing }))}
                      className={`relative w-16 h-8 rounded-full transition-colors duration-200 ${
                        customSettings.marketing ? "bg-red-600" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 shadow-lg ${
                          customSettings.marketing ? "translate-x-8" : ""
                        }`}
                      />
                    </button>
                    <p className="text-xs font-bold mt-1 text-center">
                      {customSettings.marketing ? (
                        <span className="text-red-600">ACTIF</span>
                      ) : (
                        <span className="text-slate-500">INACTIF</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lien politique de confidentialité */}
              <div className="text-center">
                <Link
                  href="/legal/privacy"
                  className="text-sm text-red-600 hover:text-red-700 font-bold underline"
                >
                  Consulter notre politique de confidentialité complète
                </Link>
              </div>
            </div>

            {/* Footer avec boutons */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 rounded-b-3xl flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCloseCustomize}
                className="flex-1 px-6 py-3 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-full hover:bg-slate-100 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveCustom}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all flex items-center justify-center gap-2 shadow-xl"
              >
                <CheckCircle size={20} />
                Enregistrer mes préférences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

