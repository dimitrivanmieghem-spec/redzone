"use client";

import { Lock, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin } = useAuth();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!password) {
      showToast("Veuillez entrer le mot de passe", "error");
      return;
    }

    setIsLoading(true);

    try {
      await loginAdmin(password);
      setIsLoading(false);
      showToast("Connexion réussie 🔐", "success");
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 500);
    } catch {
      setIsLoading(false);
      showToast("Mot de passe incorrect", "error");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo Admin */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-600/50 hover:scale-105 transition-transform">
            <Shield size={40} className="text-slate-900" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            Back-Office Admin
          </h1>
          <p className="text-slate-400 text-sm">
            Accès réservé aux administrateurs
          </p>
        </div>

        {/* Carte de connexion */}
        <div className="bg-slate-800 shadow-xl shadow-slate-100/50 border-0 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Champ mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-200 mb-2"
              >
                Mot de passe administrateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-900" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 shadow-xl shadow-slate-100/50 border-0 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-slate-500"
                />
              </div>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-yellow-600 disabled:cursor-not-allowed text-slate-900 font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-red-600/30 hover:shadow-red-600/50 flex items-center justify-center gap-2 hover:scale-105 transition-transform"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Accéder au Back-Office
                </>
              )}
            </button>
          </form>

          {/* Warning sécurité */}
          <div className="mt-6 p-4 bg-red-900/20 border border-red-800/50 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-400 mb-1">
                  Zone sécurisée
                </h3>
                <p className="text-xs text-red-300">
                  Cet espace est réservé exclusivement aux administrateurs.
                  Toute tentative d&apos;accès non autorisée sera enregistrée.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dev info (à retirer en production) */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-900">
            Dev Mode: Mot de passe = <code className="bg-slate-800 px-2 py-1 rounded text-red-500">admin123</code>
          </p>
        </div>
      </div>
    </main>
  );
}

