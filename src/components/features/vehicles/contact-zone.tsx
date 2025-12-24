"use client";

import { MessageCircle, Mail, Phone, Shield, Send, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getOrCreateConversation } from "@/lib/supabase/conversations";
import { useToast } from "@/components/ui/Toast";
import { useState } from "react";

interface ContactZoneProps {
  vehicleId: string;
  ownerId: string; // ID du vendeur (owner_id du véhicule)
  marque: string;
  modele: string;
  prix: number;
  telephone?: string | null;
  contactEmail?: string | null;
  contactMethods?: string[] | null;
}

export default function ContactZone({
  vehicleId,
  ownerId,
  marque,
  modele,
  prix,
  telephone,
  contactEmail,
  contactMethods = ['email'],
}: ContactZoneProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [isStartingConversation, setIsStartingConversation] = useState(false);

  // Normaliser les méthodes de contact
  const methods = contactMethods && contactMethods.length > 0 ? contactMethods : ['email'];
  const hasWhatsApp = methods.includes('whatsapp') && telephone;
  const hasEmail = methods.includes('email') && contactEmail;
  const hasTel = methods.includes('tel') && telephone;
  const canSendMessage = user && user.id !== ownerId; // L'utilisateur connecté ne peut pas se contacter lui-même

  // Formater le numéro pour WhatsApp (enlever + et espaces)
  const formatPhoneForWhatsApp = (phone: string) => {
    return phone.replace(/\D/g, '');
  };

  // Message WhatsApp pré-rempli
  const whatsappMessage = encodeURIComponent(
    `Bonjour ! 👋\n\n` +
    `Je suis intéressé(e) par votre ${marque} ${modele} vue sur RedZone.\n\n` +
    `Prix affiché : ${prix.toLocaleString("fr-BE")} €\n\n` +
    `Pourrions-nous en discuter ?\n\n` +
    `Merci ! 🏁`
  );

  // Email pré-rempli
  const emailSubject = encodeURIComponent(`Intéressé par votre ${marque} ${modele} sur RedZone`);
  const emailBody = encodeURIComponent(
    `Bonjour,\n\n` +
    `Je suis intéressé(e) par votre ${marque} ${modele} vue sur RedZone.\n\n` +
    `Prix affiché : ${prix.toLocaleString("fr-BE")} €\n\n` +
    `Pourrions-nous en discuter ?\n\n` +
    `Merci,\n\n` +
    `Cordialement`
  );

  const whatsappUrl = hasWhatsApp 
    ? `https://wa.me/${formatPhoneForWhatsApp(telephone!)}?text=${whatsappMessage}`
    : null;

  const emailUrl = hasEmail 
    ? `mailto:${contactEmail}?subject=${emailSubject}&body=${emailBody}`
    : null;

  const telUrl = hasTel 
    ? `tel:${telephone}`
    : null;

  // Gérer le clic sur "Envoyer un message"
  const handleSendMessage = async () => {
    if (!user) {
      showToast("Vous devez être connecté pour envoyer un message", "error");
      router.push("/login");
      return;
    }

    if (user.id === ownerId) {
      showToast("Vous ne pouvez pas vous contacter vous-même", "error");
      return;
    }

    try {
      setIsStartingConversation(true);
      const result = await getOrCreateConversation(vehicleId, ownerId);
      
      if (!result.success || !result.conversation) {
        const errorMsg = result.error || "Erreur lors de la création de la conversation";
        // Vérifier si c'est une erreur de table manquante
        if (errorMsg.includes("does not exist") || errorMsg.includes("relation") || errorMsg.includes("table")) {
          showToast("Les tables de messagerie n'existent pas encore. Veuillez exécuter le script SQL dans Supabase.", "error");
        } else {
          showToast(errorMsg, "error");
        }
        return;
      }

      // Rediriger vers le dashboard avec la conversation ouverte
      router.push(`/dashboard?tab=messages&conversation=${result.conversation.id}`);
      showToast("Conversation ouverte", "success");
    } catch (error) {
      console.error("Erreur création conversation:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'ouverture de la conversation";
      if (errorMessage.includes("does not exist") || errorMessage.includes("relation") || errorMessage.includes("table")) {
        showToast("Les tables de messagerie n'existent pas encore. Veuillez exécuter le script SQL dans Supabase.", "error");
      } else {
        showToast(errorMessage, "error");
      }
    } finally {
      setIsStartingConversation(false);
    }
  };

  // Compter les méthodes disponibles (y compris le message si possible)
  const availableMethods = [hasWhatsApp, hasEmail, hasTel, canSendMessage].filter(Boolean).length;

  if (availableMethods === 0) {
    // Fallback : au moins l'email doit être disponible
    return (
      <div className="space-y-4">
        <a
          href={`mailto:dimitri.vanmieghem@gmail.com?subject=${emailSubject}&body=${emailBody}`}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black py-5 px-6 rounded-2xl transition-all hover:scale-105 shadow-2xl shadow-red-600/50 flex items-center justify-center gap-3 text-lg"
        >
          <Mail size={24} />
          Contacter l&apos;administrateur
        </a>
        <div className="flex items-center justify-center gap-2 text-neutral-400 text-sm">
          <Shield size={16} className="text-red-600" />
          <span className="font-medium">
            <strong className="text-red-600">Contact sécurisé</strong> via RedZone
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bouton Message (prioritaire si utilisateur connecté) */}
      {canSendMessage && (
        <button
          onClick={handleSendMessage}
          disabled={isStartingConversation}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-neutral-700 disabled:to-neutral-700 disabled:cursor-not-allowed text-white font-black py-5 px-6 rounded-2xl transition-all hover:scale-105 disabled:hover:scale-100 shadow-2xl shadow-red-600/50 flex items-center justify-center gap-3 text-lg"
        >
          {isStartingConversation ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Ouverture...
            </>
          ) : (
            <>
              <MessageSquare size={24} />
              Envoyer un message
            </>
          )}
        </button>
      )}

      {/* Autres boutons de contact */}
      {(hasWhatsApp || hasEmail || hasTel) && (
        <div className={`grid gap-3 ${availableMethods === 2 ? 'grid-cols-1' : availableMethods === 3 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
          {/* Bouton WhatsApp */}
          {hasWhatsApp && (
            <a
              href={whatsappUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black py-4 px-6 rounded-2xl transition-all hover:scale-105 shadow-xl shadow-green-600/50 flex items-center justify-center gap-3"
            >
              <MessageCircle size={20} />
              WhatsApp
            </a>
          )}

          {/* Bouton Email */}
          {hasEmail && (
            <a
              href={emailUrl!}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-black py-4 px-6 rounded-2xl transition-all hover:scale-105 shadow-xl shadow-neutral-900/50 flex items-center justify-center gap-3 border border-white/10"
            >
              <Mail size={20} />
              Email
            </a>
          )}

          {/* Bouton Téléphone */}
          {hasTel && (
            <a
              href={telUrl!}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-black py-4 px-6 rounded-2xl transition-all hover:scale-105 shadow-xl shadow-neutral-900/50 flex items-center justify-center gap-3 border border-white/10"
            >
              <Phone size={20} />
              Appeler
            </a>
          )}
        </div>
      )}

      {/* Mention Rassurante */}
      <div className="flex items-center justify-center gap-2 text-neutral-400 text-sm pt-2">
        <Shield size={16} className="text-red-600" />
        <span className="font-medium">
          <strong className="text-red-600">Sécurisé</strong> via RedZone • Réponse rapide garantie
        </span>
      </div>
    </div>
  );
}
