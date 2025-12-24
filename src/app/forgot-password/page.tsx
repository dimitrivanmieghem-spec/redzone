"use client";

import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast("Veuillez entrer votre adresse email", "error");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Déterminer l'URL de redirection pour le reset
      let siteUrl: string;
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      } else if (typeof window !== "undefined" && window.location.origin && !window.location.origin.includes("localhost")) {
        siteUrl = window.location.origin;
      } else {
        siteUrl = "https://redzone2.netlify.app";
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?type=recovery&next=/reset-password`,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      showToast("Email de réinitialisation envoyé !", "success");
    } catch (error: any) {
      console.error("Erreur réinitialisation mot de passe:", error);
      const errorMessage = error?.message || "Erreur lors de l'envoi de l'email";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        {/* Titre */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            Réinitialiser le mot de passe
          </h2>
          <p className="text-neutral-400">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {isSuccess ? (
          <div className="space-y-6">
            <div className="bg-green-900/20 border-2 border-green-600/50 rounded-xl p-6 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-400" size={32} />
              </div>
              <div className="text-center">
                <p className="text-green-400 font-bold text-lg mb-2">
                  Email envoyé !
                </p>
                <p className="text-neutral-300 text-sm">
                  Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black py-4 px-8 rounded-xl transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:scale-[1.02] flex items-center justify-center gap-3"
            >
              <ArrowLeft size={20} />
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-neutral-300 mb-3"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-neutral-500" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.be"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-neutral-800/50 border border-white/10 rounded-xl text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all"
                />
              </div>
            </div>

            {/* Bouton Envoyer */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-500 disabled:cursor-not-allowed text-white font-black py-4 px-8 rounded-xl transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:scale-[1.02] flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Envoyer le lien de réinitialisation"
              )}
            </button>

            {/* Retour à la connexion */}
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-neutral-400 hover:text-red-400 font-medium transition-colors"
              >
                <ArrowLeft size={16} />
                Retour à la connexion
              </Link>
            </div>
          </form>
        )}

        {/* Message sécurité */}
        <div className="mt-6 text-center">
          <p className="text-xs text-neutral-500">
            🔒 Vos données sont protégées conformément au RGPD
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}

