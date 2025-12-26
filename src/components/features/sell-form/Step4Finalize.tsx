"use client";

import { Mail } from "lucide-react";

interface Step4FinalizeProps {
  contactEmail: string;
  verificationCode: string;
  onVerificationCodeChange: (code: string) => void;
  onVerify: () => void;
  isVerifying: boolean;
}

export default function Step4Finalize({
  contactEmail,
  verificationCode,
  onVerificationCodeChange,
  onVerify,
  isVerifying,
}: Step4FinalizeProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-white mb-2 tracking-tight flex items-center gap-2">
          <Mail size={28} className="text-red-600" />
          Vérification de votre email
        </h2>
        <p className="text-slate-400 mb-6">
          Un code de vérification à 6 chiffres vous a été envoyé à <strong>{contactEmail}</strong>
        </p>
      </div>

      <div className="bg-gradient-to-br from-red-950/30 to-red-900/20 border-2 border-red-600/30 rounded-3xl p-8 shadow-xl">
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-4">
              <Mail size={40} className="text-white" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">
              Vérifiez votre boîte email
            </h3>
            <p className="text-slate-300">
              Entrez le code à 6 chiffres reçu par email pour confirmer votre annonce.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-3">
              Code de vérification <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={verificationCode}
              onChange={(e) => {
                // Limiter à 6 chiffres
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                onVerificationCodeChange(value);
              }}
              placeholder="123456"
              maxLength={6}
              className="w-full p-6 text-center text-3xl font-black tracking-widest bg-slate-800 border-4 border-slate-600 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-3 text-center font-light">
              {verificationCode.length}/6 chiffres
            </p>
          </div>

          <div className="bg-amber-900/20 border-2 border-amber-600/40 rounded-xl p-4">
            <p className="text-sm text-amber-300 font-light">
              ⚠️ <strong>Code expiré ?</strong> Le code est valide pendant 15 minutes. Si vous ne l'avez pas reçu, vérifiez vos spams ou contactez le support.
            </p>
          </div>

          <button
            type="button"
            onClick={onVerify}
            disabled={isVerifying || verificationCode.length !== 6}
            className={`w-full py-4 rounded-full font-black text-lg transition-all shadow-2xl ${
              isVerifying || verificationCode.length !== 6
                ? "bg-slate-400 cursor-not-allowed text-white opacity-60"
                : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:scale-105 shadow-red-600/50 active:scale-95"
            }`}
          >
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white inline-block mr-2" />
                Vérification...
              </>
            ) : (
              <>
                ✓ Vérifier le code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

