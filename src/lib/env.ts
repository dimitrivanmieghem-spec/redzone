/**
 * RedZone - Validation des Variables d'Environnement
 * 
 * Ce module valide que toutes les variables d'environnement critiques sont présentes
 * au démarrage de l'application. Si une variable manque, l'application refuse de démarrer.
 * 
 * Utilisation :
 * import { env } from '@/lib/env';
 * const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
 */

import { z } from 'zod';

/**
 * Schéma de validation pour les variables d'environnement
 * Zod valide automatiquement les types et la présence des variables
 */
const envSchema = z.object({
  // Variables Supabase (obligatoires)
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL doit être une URL valide')
    .min(1, 'NEXT_PUBLIC_SUPABASE_URL ne peut pas être vide'),
  
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY ne peut pas être vide')
    .startsWith('eyJ', 'NEXT_PUBLIC_SUPABASE_ANON_KEY doit commencer par "eyJ" (JWT valide)'),
  
  // Variables optionnelles pour les fonctionnalités admin
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .startsWith('eyJ', 'SUPABASE_SERVICE_ROLE_KEY doit commencer par "eyJ" (JWT valide)')
    .optional(),
  
  // Variables optionnelles (avec valeurs par défaut si besoin)
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
});

/**
 * Type TypeScript dérivé du schéma Zod
 * Permet d'avoir l'autocomplétion et la sécurité de type
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Fonction de validation et parsing des variables d'environnement
 * 
 * Cette fonction est exécutée une seule fois au chargement du module.
 * Si la validation échoue, l'application crash immédiatement avec un message d'erreur clair.
 * 
 * @throws {z.ZodError} Si une variable d'environnement est manquante ou invalide
 */
function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => {
        const path = issue.path.join('.');
        return `  - ${path}: ${issue.message}`;
      }).join('\n');

      const errorMessage = `
╔═══════════════════════════════════════════════════════════════╗
║  ERREUR : Variables d'environnement manquantes ou invalides  ║
╚═══════════════════════════════════════════════════════════════╝

Les variables d'environnement suivantes doivent être définies :

${missingVars}

Vérifiez que votre fichier .env.local contient toutes les variables nécessaires :

NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon

Pour plus d'informations, consultez : docs/setup/ENV_SETUP.md
      `.trim();

      console.error(errorMessage);
      throw new Error('Configuration invalide - Variables d\'environnement manquantes');
    }
    throw error;
  }
}

/**
 * Objet contenant toutes les variables d'environnement validées
 * 
 * ⚠️ IMPORTANT : Cet objet est créé au chargement du module.
 * Si la validation échoue, l'application ne démarrera pas.
 * 
 * Utilisation :
 * import { env } from '@/lib/env';
 * const url = env.NEXT_PUBLIC_SUPABASE_URL;
 */
export const env = validateEnv();

/**
 * Vérification supplémentaire pour le mode développement
 * Affiche un avertissement si les variables semblent être des valeurs de test
 */
if (env.NODE_ENV === 'development') {
  if (env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') || 
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder')) {
    console.warn('⚠️  ATTENTION : Les variables d\'environnement semblent être des valeurs de test.');
    console.warn('   Assurez-vous d\'utiliser les vraies valeurs en production.');
  }
}

