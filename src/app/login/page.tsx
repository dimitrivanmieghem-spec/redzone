"use client";

import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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

    setIsLoading(true); // Début du chargement

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        throw error; // On envoie l'erreur au catch
      }

      // Si on est là, c'est que c'est bon
      showToast("Connexion réussie !", "success");
      router.refresh(); // Rafraîchir les données serveur
      router.push("/dashboard"); // Redirection

    } catch (error: any) {
      console.error("Erreur Login:", error);
      showToast(error.message || "Erreur de connexion", "error");
    } finally {
      // C'EST LA LIGNE LA PLUS IMPORTANTE :
      setIsLoading(false); // Arrête le spinner quoiqu'il arrive
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-red-100/30 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-red-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-300/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Bouton Retour */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-700 hover:text-red-600 mb-8 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          <span>Retour à l&apos;accueil</span>
        </Link>

        {/* Carte de connexion FLOTTANTE */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-red-900/20 p-10 border border-white">
          {/* Logo et Titre */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-600/40">
              <Lock size={36} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
              Connexion
            </h1>
            <p className="text-slate-700 text-lg">
              Bienvenue sur RedZone
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-slate-900 mb-3"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="votre@email.be"
                  required
                  className="w-full pl-12 pr-4 py-4 shadow-xl shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-600/20 transition-all"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-slate-900"
                >
                  Mot de passe
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-4 shadow-xl shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-600/20 transition-all"
                />
              </div>
            </div>

            {/* Bouton Se connecter */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-500 disabled:cursor-not-allowed text-white font-black py-5 px-8 rounded-full transition-all shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 flex items-center justify-center gap-3 text-lg tracking-tight"
            >
              {isLoading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </button>

            {/* Séparateur */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/90 text-slate-700 font-medium">
                  Pas encore de compte ?
                </span>
              </div>
            </div>

            {/* Bouton Créer un compte */}
            <Link
              href="/register"
              className="w-full border-2 border-slate-900 text-slate-900 font-bold py-4 px-6 rounded-full transition-all hover:bg-slate-900 hover:text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 tracking-tight"
            >
              Créer un compte
            </Link>
          </form>

          {/* Message sécurité */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-600">
              🔒 Vos données sont protégées conformément au RGPD
            </p>
          </div>
        </div>

        {/* Avantages de la connexion */}
        <div className="mt-8 bg-white/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-white/50">
          <h3 className="text-lg font-black text-slate-900 mb-5 text-center tracking-tight">
            Pourquoi créer un compte ?
          </h3>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</span>
              <span>Gérez vos annonces en un clic</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</span>
              <span>Sauvegardez vos favoris</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</span>
              <span>Recevez des alertes personnalisées</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</span>
              <span>Accédez à l&apos;historique</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}

