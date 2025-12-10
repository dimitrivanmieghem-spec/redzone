"use client";

import { ArrowLeft, Loader2, Lock, Mail, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "particulier" as "particulier" | "pro",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null); // Reset des erreurs précédentes

    try {
      // Validation des champs
      if (!formData.prenom || !formData.nom || !formData.email || !formData.password || !formData.confirmPassword) {
        throw new Error("Veuillez remplir tous les champs");
      }

      // Vérification que les mots de passe correspondent
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Les mots de passe ne correspondent pas");
      }

      // Validation du mot de passe (minimum 6 caractères)
      if (formData.password.length < 6) {
        throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      }

      // 1. Appel Supabase
      const fullName = `${formData.prenom} ${formData.nom}`.trim();
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.prenom,
            last_name: formData.nom,
            full_name: fullName,
          },
        },
      });

      // 2. Gestion d'erreur immédiate
      if (supabaseError) {
        throw supabaseError;
      }

      // 3. Créer le profil si l'utilisateur existe
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: formData.email,
          full_name: fullName,
          role: formData.role, // Utiliser le rôle choisi
        });

        if (profileError) {
          console.warn("Erreur création profil (peut déjà exister):", profileError);
          // Ne pas bloquer si le profil existe déjà
        }
      }

      // 4. Succès -> Redirection
      if (data.session) {
        showToast("Compte créé avec succès ! 🎉", "success");
        // Rafraîchir la session pour mettre à jour la Navbar
        router.refresh();
        // Rediriger vers le dashboard
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      } else {
        // Cas rare : Compte créé mais pas de session (ex: confirmation requise malgré tout)
        showToast("Vérifiez vos emails pour confirmer votre compte.", "info");
        // Rediriger quand même vers la page de login
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Erreur Inscription:", err);
      
      // Affiche l'erreur à l'utilisateur
      let errorMessage = "Une erreur est survenue lors de la création du compte";
      
      if (err?.message) {
        if (err.message.includes("already registered") || err.message.includes("already exists") || err.message.includes("User already registered")) {
          errorMessage = "Cet email est déjà utilisé";
        } else if (err.message.includes("password") || err.message.includes("Password")) {
          errorMessage = "Le mot de passe est trop faible (minimum 6 caractères)";
        } else if (err.message.includes("email") || err.message.includes("Email")) {
          errorMessage = "Format d'email invalide";
        } else {
          errorMessage = err.message;
        }
      }
      
      showToast(errorMessage, "error");
      setError(errorMessage); // Affiche aussi en texte rouge sous le bouton
    } finally {
      // 5. DÉBLOCAGE OBLIGATOIRE
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50/50 via-white to-red-100/30 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-200/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-300/20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Bouton Retour */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-700 hover:text-red-600 mb-8 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          <span>Retour à l&apos;accueil</span>
        </Link>

        {/* Carte d'inscription FLOTTANTE */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-red-900/20 p-10 border border-white">
          {/* Logo et Titre */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-600/40">
              <UserPlus size={36} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
              Créer un compte
            </h1>
            <p className="text-slate-700 text-lg">
              Rejoignez RedZone en quelques clics
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSignUp} className="space-y-6">
            {/* Prénom & Nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="prenom"
                  className="block text-sm font-bold text-slate-900 mb-3"
                >
                  Prénom *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={20} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    id="prenom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    placeholder="Jean"
                    required
                    disabled={isLoading}
                    className="w-full pl-12 pr-4 py-4 shadow-xl shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="nom"
                  className="block text-sm font-bold text-slate-900 mb-3"
                >
                  Nom *
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  placeholder="Dupont"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-4 shadow-xl shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold text-slate-900 mb-3"
              >
                Email *
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
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 shadow-xl shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Type de compte */}
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Type de compte *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: "particulier" }))}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${
                    formData.role === "particulier"
                      ? "border-green-600 bg-green-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  disabled={isLoading}
                >
                  <div className="font-bold text-slate-900 mb-1">Particulier</div>
                  <div className="text-xs text-slate-600">Vente personnelle</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: "pro" }))}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${
                    formData.role === "pro"
                      ? "border-green-600 bg-green-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  disabled={isLoading}
                >
                  <div className="font-bold text-slate-900 mb-1">Professionnel</div>
                  <div className="text-xs text-slate-600">Garage / Concessionnaire</div>
                </button>
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-bold text-slate-900 mb-3"
              >
                Mot de passe * <span className="text-slate-600 font-normal">(min. 6 caractères)</span>
              </label>
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
                  minLength={6}
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 shadow-xl shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-bold text-slate-900 mb-3"
              >
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full pl-12 pr-4 py-4 shadow-xl shadow-slate-100/50 border-0 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Affichage erreur */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 animate-in slide-in-from-top">
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Bouton Créer un compte */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:from-green-400 disabled:to-emerald-500 disabled:cursor-not-allowed text-white font-black py-5 px-8 rounded-full transition-all shadow-2xl shadow-green-600/30 hover:shadow-green-600/50 hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-3 text-lg tracking-tight"
            >
              {isLoading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <UserPlus size={24} />
                  Créer mon compte
                </>
              )}
            </button>

            {/* Séparateur */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/90 text-slate-700 font-medium">
                  Déjà un compte ?
                </span>
              </div>
            </div>

            {/* Bouton Connexion */}
            <Link
              href="/login"
              className="w-full border-2 border-slate-900 text-slate-900 font-bold py-4 px-6 rounded-full transition-all hover:bg-slate-900 hover:text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 tracking-tight"
            >
              Se connecter
            </Link>
          </form>

          {/* Message RGPD */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-600">
              🔒 En créant un compte, vous acceptez nos conditions d&apos;utilisation et notre politique de confidentialité
            </p>
          </div>
        </div>

        {/* Avantages */}
        <div className="mt-8 bg-white/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl shadow-slate-200/50 border border-white/50">
          <h3 className="text-lg font-black text-slate-900 mb-5 text-center tracking-tight">
            Pourquoi rejoindre RedZone ?
          </h3>
          <ul className="space-y-3 text-sm text-slate-700">
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</span>
              <span>Publiez vos annonces gratuitement</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</span>
              <span>Accès à des milliers d&apos;acheteurs</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</span>
              <span>Outils de gestion performants</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">✓</span>
              <span>Support client réactif</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
