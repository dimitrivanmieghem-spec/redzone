"use client";

import { Check, Shield, MapPin, AlertTriangle, Building2 } from "lucide-react";
import MediaManager from "@/components/MediaManager";
import { Turnstile } from "@marsidev/react-turnstile";
import { useToast } from "@/components/ui/Toast";

interface Step3MediaProps {
  formData: {
    marque: string;
    modele: string;
    prix: string;
    annee: string;
    km: string;
    puissance: string;
    description: string;
    photos: string[];
    audioUrl: string | null;
    carPassUrl: string;
    codePostal: string;
    ville: string;
    contactEmail: string;
    telephone: string;
    contactMethods: string[];
    history: string[];
    tvaNumber: string;
    garageName: string;
    garageAddress: string;
  };
  onUpdate: (updates: Partial<Step3MediaProps["formData"]>) => void;
  onHistoryToggle: (item: string) => void;
  user: { id: string; email: string; role: string } | null;
  isEffectivelyBanned: boolean;
  isSubmitting: boolean;
  turnstileToken: string | null;
  onTurnstileTokenChange: (token: string | null) => void;
  fieldErrors: Record<string, string>;
  onFieldErrorClear: (field: string) => void;
}

export default function Step3Media({
  formData,
  onUpdate,
  onHistoryToggle,
  user,
  isEffectivelyBanned,
  isSubmitting,
  turnstileToken,
  onTurnstileTokenChange,
  fieldErrors,
  onFieldErrorClear,
}: Step3MediaProps) {
  const { showToast } = useToast();

  return (
    <div className="space-y-8">
      {/* Section 3 : La Galerie (Card) */}
      <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6 md:p-8">
        <h2 className="text-2xl font-black text-white mb-2 tracking-wide">
          La Galerie
        </h2>
        <p className="text-slate-300 mb-6 font-light">
          Photos, son et histoire du véhicule
        </p>

        {/* RÉCAPITULATIF DE L'ANNONCE */}
        <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-2 border-red-600 rounded-3xl p-8 shadow-2xl">
          <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <Check className="text-red-500" size={28} />
            Récapitulatif de votre annonce
          </h3>

          <div className="bg-slate-800/50 rounded-2xl p-6 space-y-4 border border-white/10">
            {/* Titre */}
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">TITRE</p>
              <p className="text-2xl font-black text-white">
                {formData.marque} {formData.modele}
              </p>
            </div>

            {/* Prix */}
            <div>
              <p className="text-xs font-bold text-slate-400 mb-1">PRIX</p>
              <p className="text-3xl font-black text-red-500">
                {parseFloat(formData.prix).toLocaleString("fr-BE")} €
              </p>
            </div>

            {/* Détails */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-xs font-bold text-slate-400">ANNÉE</p>
                <p className="text-lg font-bold text-white">{formData.annee}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">KM</p>
                <p className="text-lg font-bold text-white">
                  {parseInt(formData.km).toLocaleString("fr-BE")} km
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">PUISSANCE</p>
                <p className="text-lg font-bold text-white">{formData.puissance} ch</p>
              </div>
            </div>
          </div>

          {/* L'Histoire */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs font-bold text-slate-400 mb-2 tracking-wide">L&apos;HISTOIRE</p>
            <p className="text-sm text-slate-300 leading-relaxed line-clamp-4 font-light">
              {formData.description}
            </p>
          </div>
        </div>
      </div>

      {/* Localisation - Où voir le véhicule ? */}
      <div>
        <label className="block text-sm font-bold text-white mb-4 flex items-center gap-2">
          <MapPin size={20} className="text-red-500" />
          Où voir le véhicule ? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Code Postal */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Code Postal <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.codePostal}
              onChange={(e) => onUpdate({ codePostal: e.target.value })}
              placeholder="Ex: 5000, 7181"
              required
              maxLength={4}
              pattern="[0-9]{4}"
              className="w-full px-4 py-4 bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/20 transition-all text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-2">Format: 4 chiffres (ex: 5000)</p>
          </div>

          {/* Ville */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Ville <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.ville}
              onChange={(e) => onUpdate({ ville: e.target.value })}
              placeholder="Ex: Namur, Liège, Bruxelles"
              required
              className="w-full px-4 py-4 bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/20 transition-all text-white placeholder:text-slate-500"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-2">
          <MapPin size={14} className="text-slate-400" />
          Cette information permettra aux acheteurs de localiser votre véhicule sur une carte.
        </p>
      </div>

      {/* Module Média Pro (Photos & Audio) */}
      <MediaManager
        photos={formData.photos}
        audioUrl={formData.audioUrl}
        onPhotosChange={(newPhotos) => {
          onUpdate({ photos: newPhotos });
        }}
        onAudioChange={(newAudioUrl) => {
          onUpdate({ audioUrl: newAudioUrl });
        }}
        userId={user?.id || null}
        disabled={isEffectivelyBanned || isSubmitting}
      />

      {/* Car-Pass URL */}
      <div data-field="carPassUrl">
        <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Shield size={20} className="text-green-600" />
          Lien Car-Pass (URL) <span className="text-xs font-normal text-slate-400">(Optionnel)</span>
        </label>
        <input
          type="url"
          value={formData.carPassUrl}
          onChange={(e) => {
            onUpdate({ carPassUrl: e.target.value });
            if (fieldErrors.carPassUrl) {
              onFieldErrorClear("carPassUrl");
            }
          }}
          placeholder="https://www.car-pass.be/..."
          className={`w-full p-4 bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium transition-all placeholder:text-slate-500 ${
            fieldErrors.carPassUrl
              ? "border-red-600 bg-red-900/20"
              : ""
          }`}
        />
        {fieldErrors.carPassUrl ? (
          <div className="mt-2 p-3 bg-red-900/20 border-2 border-red-600/40 rounded-xl">
            <p className="text-sm font-bold text-red-300 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-400" />
              {fieldErrors.carPassUrl}
            </p>
            <p className="text-xs text-red-400 mt-2 ml-6">
              Format attendu : <code className="bg-red-900/30 px-2 py-1 rounded text-red-200">https://www.car-pass.be/...</code> ou <code className="bg-red-900/30 px-2 py-1 rounded text-red-200">http://www.car-pass.be/...</code>
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mt-2 font-light">
            🔒 Plus sécurisé qu'un upload de fichier. Partagez le lien vers votre Car-Pass en ligne.
          </p>
        )}
      </div>

      {/* Vos Coordonnées */}
      <div className="mt-8 pt-8 border-t-2 border-white/10">
        <h3 className="text-xl font-black text-white mb-6 tracking-wide">
          Vos coordonnées
        </h3>

        {/* Email de contact */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-white mb-3">
            Email de contact {!user && <span className="text-red-600">*</span>}
            {user && <span className="text-xs font-normal text-slate-400">(Optionnel - utilisera {user.email} par défaut)</span>}
          </label>
          <input
            type="email"
            value={formData.contactEmail}
            onChange={(e) => onUpdate({ contactEmail: e.target.value })}
            placeholder={user ? user.email : "votre@email.be"}
            required={!user}
            className="w-full p-4 bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
          />
          <p className="text-xs text-slate-400 mt-2">
            {user 
              ? "Cet email sera visible par les acheteurs intéressés. Si vide, votre email de compte sera utilisé."
              : "⚠️ Email obligatoire pour les invités. Cet email sera visible par les acheteurs intéressés."
            }
          </p>
        </div>

        {/* Téléphone */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-white mb-3">
            Téléphone {formData.contactMethods.includes('whatsapp') || formData.contactMethods.includes('tel') ? <span className="text-red-500">*</span> : <span className="text-xs font-normal text-slate-400">(Optionnel)</span>}
          </label>
          <input
            type="tel"
            value={formData.telephone}
            onChange={(e) => {
              // Format automatique belge +32
              let value = e.target.value.replace(/\D/g, '');
              if (value.startsWith('32')) {
                value = '+' + value;
              } else if (value && !value.startsWith('+')) {
                value = '+32' + value;
              }
              onUpdate({ telephone: value });
            }}
            placeholder="+32 471 23 45 67"
            required={formData.contactMethods.includes('whatsapp') || formData.contactMethods.includes('tel')}
            className="w-full p-4 bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
          />
          <p className="text-xs text-slate-400 mt-2">
            Format belge : +32 XXX XX XX XX
          </p>
        </div>

        {/* Préférences de contact */}
        <div>
          <label className="block text-sm font-bold text-white mb-3">
            Préférences de contact *
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-300 hover:border-red-400 transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={formData.contactMethods.includes('email')}
                onChange={(e) => {
                  if (e.target.checked) {
                    onUpdate({ contactMethods: [...formData.contactMethods, 'email'] });
                  } else {
                    onUpdate({ contactMethods: formData.contactMethods.filter(m => m !== 'email') });
                  }
                }}
                className="w-5 h-5 text-red-600 rounded border-2 border-slate-400 focus:ring-red-600"
              />
              <div className="flex-1">
                <span className="font-bold text-white">Accepter les contacts par Email</span>
                <p className="text-xs text-slate-400">Les acheteurs pourront vous envoyer un email</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-300 hover:border-green-400 transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={formData.contactMethods.includes('whatsapp')}
                onChange={(e) => {
                  if (e.target.checked) {
                    onUpdate({ contactMethods: [...formData.contactMethods, 'whatsapp'] });
                  } else {
                    onUpdate({ contactMethods: formData.contactMethods.filter(m => m !== 'whatsapp') });
                  }
                }}
                className="w-5 h-5 text-green-600 rounded border-2 border-slate-400 focus:ring-green-600"
              />
              <div className="flex-1">
                <span className="font-bold text-white">Accepter les contacts par WhatsApp</span>
                <p className="text-xs text-slate-400">Nécessite un numéro de téléphone</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-300 hover:border-red-400 transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={formData.contactMethods.includes('tel')}
                onChange={(e) => {
                  if (e.target.checked) {
                    onUpdate({ contactMethods: [...formData.contactMethods, 'tel'] });
                  } else {
                    onUpdate({ contactMethods: formData.contactMethods.filter(m => m !== 'tel') });
                  }
                }}
                className="w-5 h-5 text-red-600 rounded border-2 border-slate-400 focus:ring-red-600"
              />
              <div className="flex-1">
                <span className="font-bold text-white">Accepter les appels téléphoniques</span>
                <p className="text-xs text-slate-400">Nécessite un numéro de téléphone</p>
              </div>
            </label>
          </div>
          {formData.contactMethods.length === 0 && (
            <p className="text-sm text-red-600 font-medium mt-2">
              ⚠️ Veuillez sélectionner au moins une méthode de contact.
            </p>
          )}
        </div>
      </div>

      {/* Champs Professionnels (si role === 'pro') */}
      {user?.role === "pro" && (
        <div className="bg-gradient-to-br from-red-950/30 to-red-900/20 border-2 border-red-600/30 rounded-3xl p-8 shadow-xl">
          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
            <Building2 size={28} className="text-red-600" />
            Informations Professionnelles
          </h3>
          <div className="space-y-6">
            {/* Nom du Garage */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Nom du Garage *
              </label>
              <input
                type="text"
                value={formData.garageName}
                onChange={(e) => onUpdate({ garageName: e.target.value })}
                placeholder="Ex: Garage Auto Premium"
                required={user.role === "pro"}
                className="w-full px-4 py-4 bg-slate-800 border-2 border-slate-600 rounded-2xl focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/20 transition-all text-white"
              />
            </div>

            {/* Numéro de TVA */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Numéro de TVA (BE) *
              </label>
              <input
                type="text"
                value={formData.tvaNumber}
                onChange={(e) => onUpdate({ tvaNumber: e.target.value })}
                placeholder="Ex: BE0123456789"
                required={user.role === "pro"}
                pattern="BE[0-9]{10}"
                className="w-full px-4 py-4 bg-slate-800 border-2 border-slate-600 rounded-2xl focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/20 transition-all text-white"
              />
              <p className="text-xs text-slate-400 mt-2">
                Format: BE suivi de 10 chiffres
              </p>
            </div>

            {/* Adresse du Garage */}
            <div>
              <label className="block text-sm font-bold text-white mb-3">
                Adresse du Garage
              </label>
              <textarea
                value={formData.garageAddress}
                onChange={(e) => onUpdate({ garageAddress: e.target.value })}
                placeholder="Rue, Numéro, Code postal, Ville"
                rows={3}
                className="w-full px-4 py-4 bg-slate-800 border-2 border-slate-600 rounded-2xl focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/20 transition-all resize-y text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Historique */}
      <div>
        <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Shield size={20} className="text-red-600" />
          Transparence & Historique (Optionnel)
        </label>
        <div className="space-y-3">
          {[
            "Carnet d'entretien complet",
            "Factures disponibles",
            "Véhicule non accidenté",
            "Origine Belgique",
            "2 clés disponibles",
          ].map((item) => {
            const isSelected = formData.history.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => onHistoryToggle(item)}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${
                  isSelected
                    ? "border-green-600 bg-green-50"
                    : "border-slate-300 hover:border-slate-400 bg-slate-800/50"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                    isSelected
                      ? "bg-green-600 border-green-600"
                      : "border-slate-400"
                  }`}
                >
                  {isSelected && (
                    <Check size={16} className="text-white" />
                  )}
                </div>
                <span className={`font-medium ${
                  isSelected 
                    ? "text-green-900" 
                    : "text-white"
                }`}>
                  {item}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CAPTCHA Turnstile - Uniquement pour les invités */}
      {!user && (
        <div className="mt-8 pt-8 border-t-2 border-slate-200">
          <label className="block text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Shield size={20} className="text-red-600" />
            Vérification anti-robot <span className="text-red-600">*</span>
          </label>
          <div className="flex justify-center">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
              onSuccess={(token) => {
                onTurnstileTokenChange(token);
              }}
              onError={() => {
                onTurnstileTokenChange(null);
                showToast("Erreur lors de la vérification anti-robot", "error");
              }}
              onExpire={() => {
                onTurnstileTokenChange(null);
              }}
              options={{
                theme: "light",
                size: "normal",
              }}
            />
          </div>
          {!turnstileToken && (
            <p className="text-xs text-red-600 mt-3 text-center font-medium">
              ⚠️ Veuillez compléter la vérification anti-robot pour continuer
            </p>
          )}
          {turnstileToken && (
            <p className="text-xs text-green-600 mt-3 text-center font-medium flex items-center justify-center gap-2">
              <Check size={14} />
              Vérification réussie
            </p>
          )}
        </div>
      )}
    </div>
  );
}

