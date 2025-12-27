"use client";

/**
 * ⚠️ VÉRIFICATION DU TRIGGER SQL
 * 
 * Pour vérifier que le trigger handle_new_user() fonctionne correctement dans Supabase,
 * exécutez ce script dans le SQL Editor :
 * 
 * ```sql
 * -- Vérifier que le trigger existe
 * SELECT tgname, tgtype, tgenabled 
 * FROM pg_trigger 
 * WHERE tgname = 'on_auth_user_created';
 * 
 * -- Vérifier la fonction
 * SELECT proname, prosrc 
 * FROM pg_proc 
 * WHERE proname = 'handle_new_user';
 * 
 * -- Si le trigger n'existe pas, exécutez ceci :
 * CREATE OR REPLACE FUNCTION public.handle_new_user()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   INSERT INTO public.profiles (id, email, full_name, role)
 *   VALUES (
 *     NEW.id,
 *     NEW.email,
 *     COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
 *     'user'
 *   )
 *   ON CONFLICT (id) DO NOTHING;
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 * 
 * CREATE TRIGGER on_auth_user_created
 *   AFTER INSERT ON auth.users
 *   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
 * ```
 */

import { Loader2, Lock, Mail, User, UserPlus, CheckCircle, ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import AuthLayout from "@/components/AuthLayout";
import { registerSchema, type RegisterFormData } from "@/lib/validation/registerSchema";
import { ZodError } from "zod";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
    accountType: "particulier",
    vatNumber: "",
    acceptTerms: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Effacer l'erreur du champ modifié
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAccountTypeChange = (type: "particulier" | "pro") => {
    setFormData((prev) => ({
      ...prev,
      accountType: type,
      // Réinitialiser le numéro de TVA si on passe à particulier
      ...(type === "particulier" && { vatNumber: "" }),
    }));
    // Effacer l'erreur du champ vatNumber si elle existe
    if (fieldErrors.vatNumber) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.vatNumber;
        return newErrors;
      });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (otpCode.length !== 6 && otpCode.length !== 8) {
      showToast("Le code doit contenir 6 ou 8 chiffres", "error");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: userEmail,
        token: otpCode,
        type: 'email'
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        showToast("Email vérifié avec succès ! 🎉", "success");
        router.refresh();
        setTimeout(() => {
          router.push("/dashboard");
        }, 500);
      }
    } catch (err: any) {
      console.error("Erreur vérification OTP:", err);
      let errorMessage = "Code invalide ou expiré";

      if (err?.message) {
        if (err.message.includes("invalid")) {
          errorMessage = "Code invalide";
        } else if (err.message.includes("expired")) {
          errorMessage = "Code expiré, veuillez en demander un nouveau";
        }
      }

      showToast(errorMessage, "error");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      // Validation avec Zod
      const validatedData = registerSchema.parse(formData);

      // 1. Appel Supabase avec OTP (code à 6/8 chiffres)
      const fullName = `${validatedData.firstName} ${validatedData.lastName}`.trim();

      const { data, error: supabaseError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            first_name: validatedData.firstName,
            last_name: validatedData.lastName,
            full_name: fullName,
            role: validatedData.accountType,
            vat_number: validatedData.vatNumber || null,
          },
        },
      });

      // 2. Gestion d'erreur immédiate
      if (supabaseError) {
        throw supabaseError;
      }

      // 3. Créer le profil si l'utilisateur existe
      if (data.user) {
        const profileData: {
          id: string;
          email: string;
          full_name: string;
          role: string;
          vat_number?: string | null;
        } = {
          id: data.user.id,
          email: validatedData.email,
          full_name: fullName,
          role: validatedData.accountType,
        };

        // Ajouter le numéro de TVA si l'utilisateur est un Pro
        if (validatedData.accountType === "pro" && validatedData.vatNumber) {
          profileData.vat_number = validatedData.vatNumber.trim();
        }

        // Tenter d'insérer le profil. Si le trigger SQL a déjà créé le profil,
        // on ignore l'erreur de conflit (code 23505) car c'est normal.
        const { error: profileError } = await supabase
          .from("profiles")
          .insert(profileData)
          .select()
          .single();

        // Code 23505 = violation de contrainte unique (le profil existe déjà via le trigger)
        if (profileError) {
          if (profileError.code === '23505') {
            // Le trigger SQL a déjà créé le profil, c'est OK
            console.log("Profil créé par le trigger SQL, insertion ignorée");
          } else {
            console.warn("Erreur création profil:", profileError);
          }
        }
        
        // Logger la création de compte (que le profil soit créé par le trigger ou manuellement)
        if (!profileError || profileError.code === '23505') {
          // Logger la création de compte
          try {
            const { logAuditEvent } = await import("@/lib/supabase/audit-logs-client");
            await logAuditEvent({
              action_type: "data_modification",
              user_id: data.user.id,
              user_email: validatedData.email,
              resource_type: "profile",
              resource_id: data.user.id,
              description: "Création de compte utilisateur",
              status: "success",
              metadata: { accountType: validatedData.accountType },
            });
          } catch (logError) {
            console.error("Erreur lors du logging d'audit:", logError);
          }
        }
      }

      // 4. Gestion du succès : Si pas de session, c'est que l'OTP doit être saisi
      if (!data.session) {
        // Code OTP envoyé par email
        setUserEmail(validatedData.email);
        setPendingVerification(true);
        showToast("Code de vérification envoyé ! Vérifiez votre boîte mail.", "success");
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
      
      // Gestion des erreurs Zod
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((error) => {
          if (error.path.length > 0) {
            errors[error.path[0] as string] = error.message;
          }
        });
        setFieldErrors(errors);
        const firstError = err.issues[0];
        showToast(firstError?.message || "Veuillez corriger les erreurs du formulaire", "error");
        return;
      }
      
      let errorMessage = "Une erreur est survenue lors de la création du compte";
      
      if (err?.message) {
        if (err.message.includes("already registered") || err.message.includes("already exists") || err.message.includes("User already registered")) {
          errorMessage = "Cet email est déjà utilisé";
        } else if (err.message.includes("password") || err.message.includes("Password")) {
          errorMessage = "Le mot de passe ne respecte pas les critères de sécurité";
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
        <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          {/* Icône de succès */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-600/20 border-2 border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-400" size={40} />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
              Vérifiez votre boîte mail
            </h2>
            <p className="text-neutral-400 text-lg">
              Un code de vérification a été envoyé à
            </p>
            <p className="text-yellow-400 font-bold text-xl mt-2 break-all">
              {userEmail}
            </p>
          </div>

          {/* Formulaire OTP */}
          <form onSubmit={handleVerifyOtp} className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-white/10">
            <div className="text-center mb-4">
              <p className="text-white text-sm mb-4">
                Saisissez le code à 6 ou 8 chiffres reçu par email
              </p>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Uniquement chiffres
                  if (value.length <= 8) {
                    setOtpCode(value);
                  }
                }}
                placeholder="123456"
                maxLength={8}
                className="w-full max-w-xs mx-auto text-center text-2xl font-mono tracking-widest bg-neutral-900/50 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600"
                required
                disabled={isVerifyingOtp}
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingOtp || otpCode.length < 6}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-400 disabled:to-green-500 disabled:cursor-not-allowed text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-900/20 hover:shadow-green-900/40 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              {isVerifyingOtp ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  Vérifier le code
                </>
              )}
            </button>
          </form>

          {/* Instructions */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 text-neutral-300">
              <div className="flex-shrink-0 w-6 h-6 bg-red-600/20 border border-red-500/40 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-red-400 text-xs font-bold">1</span>
              </div>
              <p className="text-sm">Vérifiez votre boîte de réception (et les spams si nécessaire)</p>
            </div>
            <div className="flex items-start gap-3 text-neutral-300">
              <div className="flex-shrink-0 w-6 h-6 bg-red-600/20 border border-red-500/40 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-red-400 text-xs font-bold">2</span>
              </div>
              <p className="text-sm">Saisissez le code de 6 ou 8 chiffres dans le champ ci-dessus</p>
            </div>
            <div className="flex items-start gap-3 text-neutral-300">
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
            <p className="text-xs text-neutral-500">
              Vous n&apos;avez pas reçu le code ? Vérifiez vos spams ou{" "}
              <button
                onClick={() => setPendingVerification(false)}
                className="text-yellow-400 hover:text-yellow-300 underline font-medium"
              >
                réessayez l&apos;inscription
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
      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
        {/* Titre */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            Créer un compte
          </h2>
          <p className="text-neutral-400">Rejoignez Octane98 en quelques clics</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Prénom & Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-sm font-bold text-neutral-300 mb-3"
              >
                Prénom *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={20} className="text-neutral-500" />
                </div>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Jean"
                  required
                  disabled={isLoading}
                  className={`w-full pl-12 pr-4 py-4 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    fieldErrors.firstName ? "border-red-500" : "border-white/10"
                  }`}
                />
              </div>
              {fieldErrors.firstName && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.firstName}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-bold text-neutral-300 mb-3"
              >
                Nom *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Dupont"
                required
                disabled={isLoading}
                className={`w-full px-4 py-4 bg-neutral-800/50 border rounded-xl text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  fieldErrors.lastName ? "border-red-500" : "border-white/10"
                }`}
              />
              {fieldErrors.lastName && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-bold text-neutral-300 mb-3"
            >
              Email *
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
                disabled={isLoading}
                className={`w-full pl-12 pr-4 py-4 bg-neutral-800/50 border rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  fieldErrors.email ? "border-red-500" : "border-white/10"
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Confirmer Email */}
          <div>
            <label
              htmlFor="confirmEmail"
              className="block text-sm font-bold text-neutral-300 mb-3"
            >
              Confirmer l&apos;email *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={20} className="text-neutral-500" />
              </div>
              <input
                type="email"
                id="confirmEmail"
                name="confirmEmail"
                value={formData.confirmEmail}
                onChange={handleInputChange}
                placeholder="votre@email.be"
                required
                disabled={isLoading}
                className={`w-full pl-12 pr-4 py-4 bg-neutral-800/50 border rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  fieldErrors.confirmEmail ? "border-red-500" : "border-white/10"
                }`}
              />
            </div>
            {fieldErrors.confirmEmail && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.confirmEmail}</p>
            )}
          </div>

          {/* Type de compte */}
          <div>
            <label className="block text-sm font-bold text-neutral-300 mb-3">
              Type de compte *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleAccountTypeChange("particulier")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  formData.accountType === "particulier"
                    ? "border-red-600 bg-red-600/20"
                    : "border-white/10 bg-neutral-800/50 hover:border-white/20"
                }`}
                disabled={isLoading}
              >
                <div className="font-bold text-white mb-1">Particulier</div>
                <div className="text-xs text-neutral-400">Vente personnelle</div>
              </button>
              <button
                type="button"
                onClick={() => handleAccountTypeChange("pro")}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  formData.accountType === "pro"
                    ? "border-red-600 bg-red-600/20"
                    : "border-white/10 bg-neutral-800/50 hover:border-white/20"
                }`}
                disabled={isLoading}
              >
                <div className="font-bold text-white mb-1 flex items-center gap-2">
                  <Building2 size={16} />
                  Professionnel
                </div>
                <div className="text-xs text-neutral-400">Garage / Concessionnaire</div>
              </button>
            </div>
          </div>

          {/* Numéro de TVA (conditionnel) */}
          {formData.accountType === "pro" && (
            <div>
              <label
                htmlFor="vatNumber"
                className="block text-sm font-bold text-neutral-300 mb-3"
              >
                Numéro de TVA * <span className="text-neutral-500 font-normal">(Format: BE0123456789)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building2 size={20} className="text-neutral-500" />
                </div>
                <input
                  type="text"
                  id="vatNumber"
                  name="vatNumber"
                  value={formData.vatNumber || ""}
                  onChange={(e) => {
                    // Convertir en majuscules et supprimer les espaces
                    const cleaned = e.target.value.replace(/\s/g, "").toUpperCase();
                    setFormData((prev) => ({
                      ...prev,
                      vatNumber: cleaned,
                    }));
                    // Effacer l'erreur du champ modifié
                    if (fieldErrors.vatNumber) {
                      setFieldErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.vatNumber;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="BE0123456789"
                  required={formData.accountType === "pro"}
                  disabled={isLoading}
                  className={`w-full pl-12 pr-4 py-4 bg-neutral-800/50 border rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase ${
                    fieldErrors.vatNumber ? "border-red-500" : "border-white/10"
                  }`}
                  maxLength={12}
                />
              </div>
              {fieldErrors.vatNumber && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.vatNumber}</p>
              )}
              <p className="text-xs text-neutral-400 mt-2">
                Format belge requis : BE suivi de 10 chiffres
              </p>
            </div>
          )}

          {/* Mot de passe */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-bold text-neutral-300 mb-3"
            >
              Mot de passe * <span className="text-neutral-500 font-normal">(min. 8 caractères, 1 chiffre, 1 majuscule, 1 caractère spécial)</span>
            </label>
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
                minLength={8}
                disabled={isLoading}
                className={`w-full pl-12 pr-4 py-4 bg-neutral-800/50 border rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  fieldErrors.password ? "border-red-500" : "border-white/10"
                }`}
              />
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>
            )}
            <div className="mt-2 space-y-1">
              <p className="text-xs text-neutral-400">
                ✓ Minimum 8 caractères
              </p>
              <p className="text-xs text-neutral-400">
                ✓ Au moins 1 chiffre (0-9)
              </p>
              <p className="text-xs text-neutral-400">
                ✓ Au moins 1 majuscule (A-Z)
              </p>
              <p className="text-xs text-neutral-400">
                ✓ Au moins 1 caractère spécial (!@#$%^&*...)
              </p>
            </div>
          </div>

          {/* Confirmer mot de passe */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-bold text-neutral-300 mb-3"
            >
              Confirmer le mot de passe *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={20} className="text-neutral-500" />
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
                className={`w-full pl-12 pr-4 py-4 bg-neutral-800/50 border rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  fieldErrors.confirmPassword ? "border-red-500" : "border-white/10"
                }`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-red-400 mt-1">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {/* Affichage erreur */}
          {error && (
            <div className="bg-red-900/20 border-2 border-red-600/50 rounded-xl p-4">
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Case à cocher CGU (Obligatoire - Conformité RGPD) */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
              required
              className="mt-1 w-5 h-5 rounded border-white/20 bg-neutral-800/50 text-red-600 focus:ring-2 focus:ring-red-600/50 focus:ring-offset-2 focus:ring-offset-neutral-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label
              htmlFor="acceptTerms"
              className="text-sm text-neutral-300 leading-relaxed cursor-pointer"
            >
              J&apos;accepte les{" "}
              <Link
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-500 hover:text-red-400 underline font-medium transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Conditions Générales d&apos;Utilisation
              </Link>
              {" "}et la{" "}
              <Link
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-500 hover:text-red-400 underline font-medium transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Politique de Confidentialité
              </Link>
              {" "}*
            </label>
          </div>
          {fieldErrors.acceptTerms && (
            <p className="text-xs text-red-400 mt-1">{fieldErrors.acceptTerms}</p>
          )}

          {/* Bouton Créer un compte */}
          <button
            type="submit"
            disabled={isLoading || !formData.acceptTerms}
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
              <span className="px-4 bg-neutral-900/50 text-neutral-400 font-medium">
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
      </div>
    </AuthLayout>
  );
}
