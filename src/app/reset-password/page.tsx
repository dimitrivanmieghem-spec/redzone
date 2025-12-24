"use client";

import { Loader2, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import AuthLayout from "@/components/AuthLayout";

// Désactiver le prerendering pour cette page
export const dynamic = 'force-dynamic';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Vérifier si on a les paramètres nécessaires
    // Note: Le token est déjà vérifié dans auth/callback, donc si on arrive ici, c'est valide
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    
    // Si pas de token mais qu'on est arrivé ici via auth/callback, c'est OK
    // Supabase a déjà vérifié le token et créé la session
    if (tokenHash && type && type !== "recovery") {
      showToast("Lien de réinitialisation invalide", "error");
      router.push("/login");
    }
  }, [searchParams, showToast, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      showToast("Veuillez remplir tous les champs", "error");
      return;
    }

    if (password.length < 8) {
      showToast("Le mot de passe doit contenir au moins 8 caractères", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Les mots de passe ne correspondent pas", "error");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      showToast("Mot de passe réinitialisé avec succès !", "success");
      
      // Rediriger vers login après 2 secondes
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      console.error("Erreur réinitialisation mot de passe:", error);
      const errorMessage = error?.message || "Erreur lors de la réinitialisation";
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="text-green-400" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                Mot de passe réinitialisé !
              </h2>
              <p className="text-neutral-400">
                Redirection vers la page de connexion...
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              Se connecter maintenant
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        {/* Titre */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            Nouveau mot de passe
          </h2>
          <p className="text-neutral-400">
            Choisissez un nouveau mot de passe sécurisé
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nouveau mot de passe */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-bold text-neutral-300 mb-3"
            >
              Nouveau mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={20} className="text-neutral-500" />
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                required
                minLength={8}
                className="w-full pl-12 pr-4 py-4 bg-neutral-800/50 border border-white/10 rounded-xl text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all"
              />
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Le mot de passe doit contenir au moins 8 caractères
            </p>
          </div>

          {/* Confirmation mot de passe */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-bold text-neutral-300 mb-3"
            >
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={20} className="text-neutral-500" />
              </div>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le mot de passe"
                required
                minLength={8}
                className="w-full pl-12 pr-4 py-4 bg-neutral-800/50 border border-white/10 rounded-xl text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all"
              />
            </div>
          </div>

          {/* Bouton Réinitialiser */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-500 disabled:cursor-not-allowed text-white font-black py-4 px-8 rounded-xl transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Réinitialisation...
              </>
            ) : (
              "Réinitialiser le mot de passe"
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="animate-spin text-red-600" size={32} />
          </div>
        </div>
      </AuthLayout>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
