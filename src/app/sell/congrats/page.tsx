"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CongratsPage() {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    // Déclencher l'animation après le montage du composant
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Animation de validation */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div
              className={`w-24 h-24 bg-green-100 rounded-full flex items-center justify-center transition-all duration-700 ${
                isAnimated
                  ? "scale-100 opacity-100"
                  : "scale-0 opacity-0"
              }`}
            >
              <CheckCircle
                size={64}
                className={`text-green-500 transition-all duration-500 ${
                  isAnimated
                    ? "scale-100 rotate-0 opacity-100"
                    : "scale-0 rotate-180 opacity-0"
                }`}
                style={{
                  transitionDelay: isAnimated ? "0.2s" : "0s",
                }}
              />
            </div>
            {/* Cercle animé avec effet ping */}
            {isAnimated && (
              <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-75" />
            )}
            {/* Cercle statique */}
            {isAnimated && (
              <div className="absolute inset-0 rounded-full border-4 border-green-500 opacity-20" />
            )}
          </div>
        </div>

        {/* Titre */}
        <h1
          className={`text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 transition-all duration-500 ${
            isAnimated
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: isAnimated ? "0.4s" : "0s" }}
        >
          Annonce soumise avec succès !
        </h1>

        {/* Texte rassurant */}
        <p
          className={`text-slate-900 text-lg mb-4 leading-relaxed transition-all duration-500 ${
            isAnimated
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: isAnimated ? "0.6s" : "0s" }}
        >
          Votre annonce a bien été reçue et est en cours de vérification.
        </p>

        {/* Message de modération */}
        <div
          className={`bg-red-50 border border-red-200 rounded-2xl p-4 mb-8 transition-all duration-500 ${
            isAnimated
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: isAnimated ? "0.7s" : "0s" }}
        >
          <p className="text-sm text-red-800">
            <span className="font-semibold">🕐 En attente de validation</span>
            <br />
            Votre annonce sera visible en ligne après vérification par notre équipe. 
            Vous recevrez un email de confirmation dans les 24h.
          </p>
        </div>

        {/* Bouton Retour */}
        <Link
          href="/"
          className={`inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-xl hover:shadow-md ${
            isAnimated
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: isAnimated ? "0.8s" : "0s" }}
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}

