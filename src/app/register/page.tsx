"use client";

import { Loader2, Lock, Mail, User, UserPlus, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import AuthLayout from "@/components/AuthLayout";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
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
    setError(null);

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

      // 1. Appel Supabase avec emailRedirectTo
      const fullName = `${formData.prenom} ${formData.nom}`.trim();
      
      // Déterminer l'URL de redirection : priorité à NEXT_PUBLIC_SITE_URL (production)
      // Ne jamais utiliser localhost pour les emails de confirmation
      let siteUrl: string;
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        // Utiliser la variable d'environnement de production (Netlify)
        siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
      } else if (typeof window !== "undefined" && window.location.origin && !window.location.origin.includes("localhost")) {
        // Utiliser window.location.origin seulement si ce n'est PAS localhost
        siteUrl = window.location.origin;
      } else {
        // Fallback vers l'URL de production par défaut
        siteUrl = "https://redzone2.netlify.app";
      }
      
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
          data: {
            first_name: formData.prenom,
            last_name: formData.nom,
            full_name: fullName,
            role: formData.role,
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
          role: formData.role,
        });

        if (profileError) {
          console.warn("Erreur création profil (peut déjà exister):", profileError);
        }
      }

      // 4. Gestion du succès : Si pas de session, c'est que l'email doit être confirmé
      if (!data.session) {
        // Email de confirmation envoyé
        setUserEmail(formData.email);
        setPendingVerification(true);
        showToast("Email de confirmation envoyé ! Vérifiez votre boîte mail.", "success");
      } else {
        // Session créée (peu probable si Confirm Email est activé, mais on gère le cas)
        showToast("Compte créé avec succès ! 🎉", "success");
        router.refresh();
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      }
    } catch (err: any) {
      console.error("Erreur Inscription:", err);
      
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
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Si en attente de vérification, afficher le message de confirmation
  if (pendingVerification) {
    return (
      <AuthLayout>
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          {/* Icône de succès */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-600/20 border-2 border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-400" size={40} />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
              Vérifiez votre boîte mail
            </h2>
            <p className="text-slate-400 text-lg">
              Un lien de confirmation a été envoyé à
            </p>
            <p className="text-yellow-400 font-bold text-xl mt-2 break-all">
              {userEmail}
            </p>
          </div>

          {/* Message principal */}
          <div className="bg-gradient-to-r from-yellow-500/10 via-yellow-600/10 to-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-6 mb-6">
            <p className="text-white text-center leading-relaxed">
              Cliquez sur le lien dans l&apos;email pour activer votre compte{" "}
              <span className="font-bold text-yellow-400">Membre Fondateur</span>.
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 text-slate-300">
              <div className="flex-shrink-0 w-6 h-6 bg-red-600/20 border border-red-500/40 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-red-400 text-xs font-bold">1</span>
              </div>
              <p className="text-sm">Vérifiez votre boîte de réception (et les spams si nécessaire)</p>
            </div>
            <div className="flex items-start gap-3 text-slate-300">
              <div className="flex-shrink-0 w-6 h-6 bg-red-600/20 border border-red-500/40 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-red-400 text-xs font-bold">2</span>
              </div>
              <p className="text-sm">Cliquez sur le lien de confirmation dans l&apos;email</p>
            </div>
            <div className="flex items-start gap-3 text-slate-300">
              <div className="flex-shrink-0 w-6 h-6 bg-red-600/20 border border-red-500/40 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-red-400 text-xs font-bold">3</span>
              </div>
              <p className="text-sm">Vous serez automatiquement connecté et redirigé vers votre dashboard</p>
            </div>
          </div>

          {/* Bouton Retour à la connexion */}
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black py-4 px-8 rounded-xl transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:scale-[1.02]"
          >
            <ArrowLeft size={20} />
            Retour à la connexion
          </Link>

          {/* Message d'aide */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Vous n&apos;avez pas reçu l&apos;email ? Vérifiez vos spams ou{" "}
              <button
                onClick={() => setPendingVerification(false)}
                className="text-yellow-400 hover:text-yellow-300 underline font-medium"
              >
                réessayez
              </button>
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Formulaire */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        {/* Titre */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            Créer un compte
          </h2>
          <p className="text-slate-400">Rejoignez RedZone en quelques clics</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Prénom & Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prenom"
                className="block text-sm font-bold text-slate-300 mb-3"
              >
                Prénom *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={20} className="text-slate-500" />
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
                  className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="nom"
                className="block text-sm font-bold text-slate-300 mb-3"
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
                className="w-full px-4 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-bold text-slate-300 mb-3"
            >
              Email *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={20} className="text-slate-500" />
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
                className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Type de compte */}
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3">
              Type de compte *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, role: "particulier" }))}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  formData.role === "particulier"
                    ? "border-red-600 bg-red-600/20"
                    : "border-white/10 bg-slate-800/50 hover:border-white/20"
                }`}
                disabled={isLoading}
              >
                <div className="font-bold text-white mb-1">Particulier</div>
                <div className="text-xs text-slate-400">Vente personnelle</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, role: "pro" }))}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  formData.role === "pro"
                    ? "border-red-600 bg-red-600/20"
                    : "border-white/10 bg-slate-800/50 hover:border-white/20"
                }`}
                disabled={isLoading}
              >
                <div className="font-bold text-white mb-1">Professionnel</div>
                <div className="text-xs text-slate-400">Garage / Concessionnaire</div>
              </button>
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-bold text-slate-300 mb-3"
            >
              Mot de passe * <span className="text-slate-500 font-normal">(min. 6 caractères)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={20} className="text-slate-500" />
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
                className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-bold text-slate-300 mb-3"
            >
              Confirmer le mot de passe *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={20} className="text-slate-500" />
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
                className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Affichage erreur */}
          {error && (
            <div className="bg-red-900/20 border-2 border-red-600/50 rounded-xl p-4">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Bouton Créer un compte */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-500 disabled:cursor-not-allowed text-white font-black py-4 px-8 rounded-xl transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Créer mon compte
              </>
            )}
          </button>

          {/* Séparateur */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-900/50 text-slate-400 font-medium">
                Déjà un compte ?
              </span>
            </div>
          </div>

          {/* Bouton Connexion */}
          <Link
            href="/login"
            className="w-full border-2 border-white/20 text-white font-bold py-4 px-6 rounded-xl transition-all hover:bg-white/10 hover:border-white/30 flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            Se connecter
          </Link>
        </form>

        {/* Message RGPD */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            🔒 En créant un compte, vous acceptez nos conditions d&apos;utilisation et notre politique de confidentialité
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
