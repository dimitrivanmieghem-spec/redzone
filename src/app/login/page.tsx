"use client";

import { Loader2, Lock, Mail, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import AuthLayout from "@/components/AuthLayout";

// Désactiver le prerendering pour cette page
export const dynamic = 'force-dynamic';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Gérer les messages d'erreur depuis l'URL (callback d'email)
  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error && message) {
      showToast(decodeURIComponent(message), "error");
      // Nettoyer l'URL
      router.replace("/login");
    }
  }, [searchParams, showToast, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation simple
    if (!formData.email || !formData.password) {
      showToast("Veuillez remplir tous les champs", "error");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        // Logger la tentative de connexion échouée
        try {
          const { logFailedLogin } = await import("@/lib/supabase/audit-logs-client");
          await logFailedLogin(formData.email, error.message);
        } catch (logError) {
          // Ne pas bloquer l'erreur de connexion en cas d'erreur de logging
          console.error("Erreur lors du logging d'audit:", logError);
        }
        throw error;
      }

      if (!data?.user || !data?.session) {
        throw new Error("Erreur de connexion : session non créée");
      }

      // Logger la connexion réussie
      try {
        const { logAuditEvent } = await import("@/lib/supabase/audit-logs-client");
        await logAuditEvent({
          action_type: "login_attempt",
          user_id: data.user.id,
          user_email: data.user.email || undefined,
          description: "Connexion réussie",
          status: "success",
        });
      } catch (logError) {
        // Ne pas bloquer la connexion en cas d'erreur de logging
        console.error("Erreur lors du logging d'audit:", logError);
      }

      showToast("Connexion réussie !", "success");

      // Attendre un peu pour que les cookies soient bien mis à jour et que les contextes soient initialisés
      await new Promise(resolve => setTimeout(resolve, 300));

      // Utiliser router.push au lieu de window.location.assign pour éviter les problèmes avec les extensions
      // et permettre une navigation plus fluide avec Next.js
      const redirectUrl = searchParams.get("redirect") || "/dashboard";
      
      // Valider que l'URL de redirection est sécurisée (commence par /)
      if (redirectUrl.startsWith("/") && !redirectUrl.startsWith("//")) {
        try {
          // Utiliser router.push pour une navigation Next.js native
          await router.push(redirectUrl);
          // Forcer un refresh après un court délai pour s'assurer que la session est bien chargée
          setTimeout(() => {
            router.refresh();
          }, 100);
        } catch (navError) {
          console.error("Erreur navigation:", navError);
          // En cas d'erreur, rediriger vers le dashboard
          router.push("/dashboard");
        }
      } else {
        // En cas d'URL invalide, rediriger vers le dashboard par défaut
        router.push("/dashboard");
      }
      
      setIsLoading(false);
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      const errorMessage = error?.message || "Erreur de connexion";
      showToast(errorMessage, "error");
      setIsLoading(false); // Réactiver le bouton en cas d'erreur
    }
    // Note: setIsLoading(false) n'est pas dans finally car on redirige en cas de succès
  };

  return (
    <AuthLayout>
      {/* Formulaire */}
      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        {/* Titre */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            Bienvenue sur RedZone
          </h2>
          <p className="text-slate-400">Connectez-vous à votre compte</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Message d'erreur depuis l'URL (si présent) */}
          {searchParams.get("error") && searchParams.get("message") && (
            <div className="bg-red-900/20 border-2 border-red-600/50 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-400 text-sm font-medium">
                {decodeURIComponent(searchParams.get("message") || "")}
              </p>
            </div>
          )}

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
                value={formData.email}
                onChange={handleInputChange}
                placeholder="votre@email.be"
                required
                className="w-full pl-12 pr-4 py-4 bg-neutral-800/50 border border-white/10 rounded-xl text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all"
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label
                htmlFor="password"
                className="block text-sm font-bold text-neutral-300"
              >
                Mot de passe
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
              >
                Oublié ?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={20} className="text-neutral-500" />
              </div>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
                className="w-full pl-12 pr-4 py-4 bg-neutral-800/50 border border-white/10 rounded-xl text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all"
              />
            </div>
          </div>

          {/* Bouton Se connecter */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-500 disabled:cursor-not-allowed text-white font-black py-4 px-8 rounded-xl transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </button>

          {/* Séparateur */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-neutral-900/50 text-neutral-400 font-medium">
                Pas encore de compte ?
              </span>
            </div>
          </div>

          {/* Bouton Créer un compte */}
          <Link
            href="/register"
            className="w-full border-2 border-white/20 text-white font-bold py-4 px-6 rounded-xl transition-all hover:bg-white/10 hover:border-white/30 flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            Créer un compte
          </Link>
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

export default function LoginPage() {
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
      <LoginContent />
    </Suspense>
  );
}
