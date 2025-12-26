"use client";

import { MessageCircle, Shield } from "lucide-react";

interface WhatsAppButtonProps {
  marque: string;
  modele: string;
  prix: number;
}

export default function WhatsAppButton({ marque, modele, prix }: WhatsAppButtonProps) {
  // Numéro fictif pour la démo (à remplacer par le vrai numéro du vendeur)
  const phoneNumber = "32471234567"; // Format: code pays + numéro (sans +)
  
  // Message pré-rempli
  const message = encodeURIComponent(
    `Bonjour ! 👋\n\n` +
    `Je suis intéressé(e) par votre ${marque} ${modele} vue sur Octane98.\n\n` +
    `Prix affiché : ${prix.toLocaleString("fr-BE")} €\n\n` +
    `Pourrions-nous en discuter ?\n\n` +
    `Merci ! 🏁`
  );

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  const handleClick = () => {
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black py-5 px-6 rounded-full transition-all hover:scale-105 shadow-2xl shadow-green-600/50 flex items-center justify-center gap-3 text-lg"
      >
        <MessageCircle size={24} />
        Discuter sur WhatsApp
      </button>

      {/* Mention Rassurante */}
      <div className="mt-4 flex items-center justify-center gap-2 text-slate-600 text-sm">
        <Shield size={16} className="text-green-600" />
        <span className="font-medium">
          <strong className="text-green-700">Direct & Sécurisé</strong> • Réponse rapide
        </span>
      </div>

      {/* Info Vendeur (Optionnel) */}
      <div className="mt-6 bg-green-50 p-4 rounded-2xl border-2 border-green-200">
        <p className="text-xs text-green-800 text-center leading-relaxed">
          💬 <strong>Le vendeur est joignable sur WhatsApp</strong> pour toute question ou visite.
          Pas de frais, pas d&apos;intermédiaire.
        </p>
      </div>
    </div>
  );
}

