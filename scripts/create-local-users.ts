#!/usr/bin/env tsx
/**
 * RedZone - Script de Création de Comptes de Test (Local Only)
 * 
 * Ce script crée deux utilisateurs de test pour le développement local :
 * - Un compte Particulier (test.particulier@redzone.local)
 * - Un compte Professionnel (test.pro@redzone.local)
 * 
 * Les utilisateurs sont créés avec email auto-validé et profils complets.
 * 
 * Usage: npx tsx scripts/create-local-users.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Charger les variables d'environnement depuis .env.local
const envPath = resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

// Couleurs pour la console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================
// VÉRIFICATION STRICTE DES VARIABLES
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Vérifier SUPABASE_SERVICE_ROLE_KEY en premier (critique)
if (!serviceRoleKey) {
  log("\n❌ Erreur: La clé SUPABASE_SERVICE_ROLE_KEY est requise dans .env.local pour générer les utilisateurs admin.", "red");
  log("\n💡 Vérifications:", "yellow");
  log("   1. Le nom de la variable doit être EXACTEMENT: SUPABASE_SERVICE_ROLE_KEY", "reset");
  log("   2. Pas d'espaces autour du signe =", "reset");
  log("   3. Récupérez la Service Role Key dans Supabase Dashboard > Settings > API", "reset");
  log("\n   Exemple dans .env.local:", "yellow");
  log("   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "reset");
  process.exit(1);
}

if (!supabaseUrl) {
  log("\n❌ Erreur: NEXT_PUBLIC_SUPABASE_URL n'est pas défini dans .env.local", "red");
  log("💡 Ajoutez cette ligne dans .env.local:", "yellow");
  log("   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co", "reset");
  process.exit(1);
}

// Créer le client admin Supabase
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface LocalUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  accountType: "particulier" | "pro";
  vatNumber?: string;
}

const localUsers: LocalUser[] = [
  {
    email: "test.particulier@redzone.local",
    password: "Password123!",
    firstName: "Jean",
    lastName: "Local",
    accountType: "particulier",
  },
  {
    email: "test.pro@redzone.local",
    password: "Password123!",
    firstName: "Garage",
    lastName: "Local",
    accountType: "pro",
    vatNumber: "BE0000000000",
  },
];

async function updateExistingProfile(
  email: string,
  fullName: string,
  accountType: "particulier" | "pro"
): Promise<void> {
  try {
    // Récupérer l'ID de l'utilisateur depuis auth.users
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      log(`   ⚠️  Impossible de lister les utilisateurs: ${listError.message}`, "yellow");
      return;
    }

    const user = users.users.find((u) => u.email === email);
    if (!user) {
      return;
    }

    // Mettre à jour le profil
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        email: email,
        full_name: fullName,
        role: accountType,
      })
      .eq("id", user.id);

    if (updateError) {
      if (updateError.message?.includes("profiles_role_check")) {
        log(`   ⚠️  La contrainte profiles_role_check n'accepte pas '${accountType}'`, "yellow");
        log(`   💡 Exécutez le script SQL: supabase/add_professional_roles.sql dans Supabase`, "yellow");
      } else {
        log(`   ⚠️  Erreur mise à jour profil existant: ${updateError.message}`, "yellow");
      }
    } else {
      log(`   ✅ Profil existant mis à jour`, "green");
    }
  } catch (error: any) {
    log(`   ⚠️  Erreur lors de la mise à jour du profil existant: ${error.message}`, "yellow");
  }
}

async function createLocalUser(user: LocalUser): Promise<void> {
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  log(`\n📝 Création de l'utilisateur: ${user.email}`, "cyan");

  try {
    // Utiliser admin.createUser avec email_confirm: true
    // IMPORTANT: Mettre 'role' dans user_metadata pour que le trigger le lise
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Auto-valider l'email (CRUCIAL)
      user_metadata: {
        firstName: user.firstName,
        lastName: user.lastName,
        full_name: fullName,
        accountType: user.accountType,
        role: user.accountType, // Le trigger lit 'role' depuis user_metadata
        ...(user.vatNumber && { vatNumber: user.vatNumber }),
      },
    });

    // Gérer les erreurs (utilisateur existe déjà)
    if (authError) {
      // Erreur 400 ou 422 = utilisateur existe déjà
      if (
        authError.status === 400 ||
        authError.status === 422 ||
        authError.message?.includes("already registered") ||
        authError.message?.includes("already exists") ||
        authError.message?.includes("User already registered")
      ) {
        log(`   ✅ L'utilisateur ${user.email} existe déjà`, "green");
        // Mettre à jour le profil existant si possible
        await updateExistingProfile(user.email, fullName, user.accountType);
        return;
      }
      // Autre erreur = on la propage
      throw authError;
    }

    if (!authUser.user) {
      throw new Error("Utilisateur créé mais user est null");
    }

    log(`   ✅ Utilisateur créé avec succès (ID: ${authUser.user.id})`, "green");

    // Attendre un peu que le trigger crée le profil (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mettre à jour le profil (le trigger l'a peut-être créé avec 'particulier' par défaut)
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        email: user.email,
        full_name: fullName,
        role: user.accountType,
      })
      .eq("id", authUser.user.id);

    if (updateError) {
      // Si l'erreur est due à la contrainte, on affiche un message d'avertissement
      if (updateError.message?.includes("profiles_role_check")) {
        log(`   ⚠️  La contrainte profiles_role_check n'accepte pas '${user.accountType}'`, "yellow");
        log(`   💡 Exécutez le script SQL: supabase/add_professional_roles.sql dans Supabase`, "yellow");
        log(`   ✅ Le profil existe mais avec un rôle par défaut. Vous pouvez le mettre à jour manuellement.`, "green");
      } else {
        log(`   ⚠️  Erreur mise à jour profil: ${updateError.message}`, "yellow");
      }
    } else {
      log(`   ✅ Profil mis à jour dans profiles`, "green");
    }

    // Afficher le résumé
    log(`\n   📋 Résumé:`, "cyan");
    log(`      Email: ${user.email}`, "reset");
    log(`      Nom: ${fullName}`, "reset");
    log(`      Type: ${user.accountType}`, "reset");
    if (user.vatNumber) {
      log(`      TVA: ${user.vatNumber}`, "reset");
    }
    log(`      Password: ${user.password}`, "reset");
    log(`      ✅ Compte prêt à l'emploi !`, "green");
  } catch (error: any) {
    log(`   ❌ Erreur lors de la création: ${error.message}`, "red");
    
    // Si l'utilisateur existe déjà, on continue
    if (
      error.status === 400 ||
      error.status === 422 ||
      error.message?.includes("already registered") ||
      error.message?.includes("already exists") ||
      error.message?.includes("User already registered")
    ) {
      log(`   ✅ L'utilisateur ${user.email} existe déjà`, "green");
      return;
    }
    
    // Sinon, on propage l'erreur
    throw error;
  }
}

async function main() {
  log("\n🚀 RedZone - Création des Comptes de Test (Local)", "bold");
  log("=".repeat(50), "cyan");

  try {
    // Vérifier la connexion à Supabase
    log("\n🔌 Vérification de la connexion à Supabase...", "cyan");
    const { data: healthCheck, error: healthError } = await supabaseAdmin
      .from("profiles")
      .select("count")
      .limit(1);

    if (healthError && !healthError.message.includes("permission denied")) {
      throw new Error(`Impossible de se connecter à Supabase: ${healthError.message}`);
    }

    log("✅ Connexion à Supabase réussie", "green");

    // Créer chaque utilisateur de test
    for (const user of localUsers) {
      await createLocalUser(user);
    }

    log("\n" + "=".repeat(50), "cyan");
    log("✅ Script terminé avec succès !", "green");
    log("\n📝 Comptes de test créés :", "cyan");
    log("   • test.particulier@redzone.local (Particulier)", "reset");
    log("   • test.pro@redzone.local (Professionnel)", "reset");
    log("\n💡 Vous pouvez maintenant vous connecter avec ces comptes sur /login", "yellow");
  } catch (error: any) {
    log(`\n❌ ERREUR FATALE: ${error.message}`, "red");
    if (error.stack) {
      log(`\nStack trace:`, "red");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Exécuter le script
main();

