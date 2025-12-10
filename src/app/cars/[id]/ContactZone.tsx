"use client";

import { MessageCircle, Mail, Phone, Shield } from "lucide-react";

interface ContactZoneProps {
  marque: string;
  modele: string;
  prix: number;
  telephone?: string | null;
  contactEmail?: string | null;
  contactMethods?: string[] | null;
}

export default function ContactZone({
  marque,
  modele,
  prix,
  telephone,
  contactEmail,
  contactMethods = ['email'], // Par défaut, email est toujours disponible
}: ContactZoneProps) {
  // Normaliser les méthodes de contact
  const methods = contactMethods && contactMethods.length > 0 ? contactMethods : ['email'];
  const hasWhatsApp = methods.includes('whatsapp') && telephone;
  const hasEmail = methods.includes('email') && contactEmail;
  const hasTel = methods.includes('tel') && telephone;

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

  // Compter les méthodes disponibles
  const availableMethods = [hasWhatsApp, hasEmail, hasTel].filter(Boolean).length;

  if (availableMethods === 0) {
    // Fallback : au moins l'email doit être disponible
    return (
      <div>
        <a
          href={`mailto:contact@redzone.be?subject=${emailSubject}&body=${emailBody}`}
          className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black py-5 px-6 rounded-full transition-all hover:scale-105 shadow-2xl shadow-red-600/50 flex items-center justify-center gap-3 text-lg"
        >
          <Mail size={24} />
          Contacter le vendeur
        </a>
        <div className="mt-4 flex items-center justify-center gap-2 text-slate-600 text-sm">
          <Shield size={16} className="text-red-600" />
          <span className="font-medium">
            <strong className="text-red-700">Contact sécurisé</strong> via RedZone
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Boutons de contact */}
      <div className={`grid gap-3 ${availableMethods === 1 ? 'grid-cols-1' : availableMethods === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        {/* Bouton WhatsApp */}
        {hasWhatsApp && (
          <a
            href={whatsappUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black py-4 px-6 rounded-full transition-all hover:scale-105 shadow-xl shadow-green-600/50 flex items-center justify-center gap-3"
          >
            <MessageCircle size={20} />
            WhatsApp
          </a>
        )}

        {/* Bouton Email */}
        {hasEmail && (
          <a
            href={emailUrl!}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black py-4 px-6 rounded-full transition-all hover:scale-105 shadow-xl shadow-slate-900/50 flex items-center justify-center gap-3"
          >
            <Mail size={20} />
            Envoyer un Email
          </a>
        )}

        {/* Bouton Téléphone */}
        {hasTel && (
          <a
            href={telUrl!}
            className="bg-white border-2 border-slate-900 hover:bg-slate-50 text-slate-900 font-black py-4 px-6 rounded-full transition-all hover:scale-105 shadow-xl flex items-center justify-center gap-3"
          >
            <Phone size={20} />
            Appeler
          </a>
        )}
      </div>

      {/* Mention Rassurante */}
      <div className="flex items-center justify-center gap-2 text-slate-600 text-sm">
        <Shield size={16} className="text-green-600" />
        <span className="font-medium">
          <strong className="text-green-700">Direct & Sécurisé</strong> • Réponse rapide
        </span>
      </div>
    </div>
  );
}

