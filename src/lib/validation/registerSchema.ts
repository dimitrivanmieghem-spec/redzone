/**
 * Octane98 - Schéma de Validation pour l'Inscription
 * Utilise Zod pour valider les données du formulaire d'inscription
 */

import { z } from "zod";

/**
 * Schéma de validation pour l'inscription
 */
export const registerSchema = z
  .object({
    // Identité
    firstName: z
      .string()
      .min(1, "Le prénom est obligatoire")
      .max(50, "Le prénom ne peut pas dépasser 50 caractères")
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes"),

    lastName: z
      .string()
      .min(1, "Le nom est obligatoire")
      .max(50, "Le nom ne peut pas dépasser 50 caractères")
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes"),

    // Email avec confirmation
    email: z
      .string()
      .min(1, "L'email est obligatoire")
      .email("Format d'email invalide")
      .max(255, "L'email ne peut pas dépasser 255 caractères"),

    confirmEmail: z
      .string()
      .min(1, "La confirmation de l'email est obligatoire"),

    // Mot de passe renforcé
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/[0-9]/, "Le mot de passe doit contenir au moins 1 chiffre")
      .regex(/[A-Z]/, "Le mot de passe doit contenir au moins 1 majuscule")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Le mot de passe doit contenir au moins 1 caractère spécial (!@#$%^&*...)")
      .max(128, "Le mot de passe ne peut pas dépasser 128 caractères"),

    confirmPassword: z
      .string()
      .min(1, "La confirmation du mot de passe est obligatoire"),

    // Type de compte
    accountType: z.enum(["particulier", "pro"], {
      message: "Le type de compte doit être 'particulier' ou 'pro'",
    }),

    // Numéro de TVA (conditionnel)
    vatNumber: z
      .string()
      .optional()
      .refine(
        (val) => {
          // Si vide ou undefined, c'est valide (sera validé conditionnellement)
          if (!val || val.trim() === "") return true;
          // Format belge : BE + 10 chiffres (ex: BE0123456789)
          // Accepter avec ou sans espaces, convertir en majuscules
          const cleaned = val.replace(/\s/g, "").toUpperCase();
          const belgianVatRegex = /^BE[0-9]{10}$/;
          return belgianVatRegex.test(cleaned);
        },
        {
          message: "Le numéro de TVA doit être au format belge (BE0123456789)",
        }
      ),

    // Acceptation des CGU (obligatoire pour conformité RGPD)
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: "Vous devez accepter les conditions d'utilisation et la politique de confidentialité",
      }),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: "Les emails ne correspondent pas",
    path: ["confirmEmail"],
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // Si accountType est 'pro', vatNumber est obligatoire
      if (data.accountType === "pro") {
        return data.vatNumber && data.vatNumber.trim().length > 0;
      }
      return true; // Si particulier, vatNumber est optionnel
    },
    {
      message: "Le numéro de TVA est obligatoire pour les comptes professionnels",
      path: ["vatNumber"],
    }
  );

/**
 * Type TypeScript dérivé du schéma
 */
export type RegisterFormData = z.infer<typeof registerSchema>;

