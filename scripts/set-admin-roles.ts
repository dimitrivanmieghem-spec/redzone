#!/usr/bin/env tsx
/**
 * RedZone - Script d'Attribution des Rôles Admin & Modérateur
 * 
 * Ce script met à jour les rôles de deux utilisateurs spécifiques :
 * - dimitri.vanmieghem@gmail.com -> rôle 'admin'
 * - antoine.binias@test.com -> rôle 'moderator' (créé s'il n'existe pas)
 * 
 * Usage: npx tsx scripts/set-admin-roles.ts
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
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Vérifier que le fichier .env.local existe
import { existsSync } from "fs";
if (!existsSync(envPath)) {
  log(`❌ ERREUR: Le fichier .env.local n'existe pas à: ${envPath}`, "red");
  log("💡 Créez le fichier .env.local à la racine du projet", "yellow");
  process.exit(1);
}

// Vérifier les variables d'environnement requises
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  log("\n❌ ERREUR: NEXT_PUBLIC_SUPABASE_URL n'est pas défini dans .env.local", "red");
  process.exit(1);
}

if (!serviceRoleKey) {
  log("\n❌ ERREUR: SUPABASE_SERVICE_ROLE_KEY n'est pas défini dans .env.local", "red");
  log("💡 Récupérez la Service Role Key dans Supabase Dashboard > Settings > API", "yellow");
  process.exit(1);
}

// Créer le client admin Supabase
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface UserRole {
  email: string;
  role: "admin" | "moderator";
  fullName?: string;
  password?: string; // Pour créer le compte s'il n'existe pas
}

const usersToSet: UserRole[] = [
  {
    email: "dimitri.vanmieghem@gmail.com",
    role: "admin",
    fullName: "Dimitri Vanmieghem",
  },
  {
    email: "antoine.binias@test.com",
    role: "moderator",
    fullName: "Antoine Binias",
    password: "Password123!", // Mot de passe par défaut si le compte doit être créé
  },
];

async function setUserRole(userConfig: UserRole): Promise<void> {
  log(`\n📝 Traitement de l'utilisateur: ${userConfig.email}`, "cyan");

  try {
    // 1. Chercher l'utilisateur existant
    const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${listError.message}`);
    }

    const existingUser = usersList?.users?.find((u) => u.email === userConfig.email);

    let userId: string;

    if (!existingUser) {
      // 2. Créer l'utilisateur s'il n'existe pas
      log(`   ⚠️  Utilisateur non trouvé, création en cours...`, "yellow");
      
      if (!userConfig.password) {
        throw new Error(`Aucun mot de passe fourni pour créer le compte ${userConfig.email}`);
      }

      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userConfig.email,
        password: userConfig.password,
        email_confirm: true, // Auto-valider l'email
        user_metadata: {
          full_name: userConfig.fullName || userConfig.email.split("@")[0],
        },
      });

      if (authError) {
        throw authError;
      }

      if (!authUser.user) {
        throw new Error("Utilisateur créé mais user est null");
      }

      userId = authUser.user.id;
      log(`   ✅ Utilisateur créé dans auth.users (ID: ${userId})`, "green");
    } else {
      userId = existingUser.id;
      log(`   ✅ Utilisateur existant trouvé (ID: ${userId})`, "green");
    }

    // 3. Mettre à jour le rôle dans la table profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: userConfig.email,
          full_name: userConfig.fullName || userConfig.email.split("@")[0],
          role: userConfig.role,
        },
        {
          onConflict: "id",
        }
      );

    if (profileError) {
      // Si le profil existe déjà, essayer de le mettre à jour
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          role: userConfig.role,
          email: userConfig.email,
          ...(userConfig.fullName && { full_name: userConfig.fullName }),
        })
        .eq("id", userId);

      if (updateError) {
        throw new Error(`Erreur mise à jour profil: ${updateError.message}`);
      } else {
        log(`   ✅ Profil mis à jour avec le rôle '${userConfig.role}'`, "green");
      }
    } else {
      log(`   ✅ Profil créé/mis à jour avec le rôle '${userConfig.role}'`, "green");
    }

    // 4. Vérifier que le rôle a bien été appliqué
    const { data: profile, error: verifyError } = await supabaseAdmin
      .from("profiles")
      .select("role, email, full_name")
      .eq("id", userId)
      .single();

    if (verifyError) {
      log(`   ⚠️  Erreur lors de la vérification: ${verifyError.message}`, "yellow");
    } else {
      log(`\n   📋 Résumé:`, "cyan");
      log(`      Email: ${profile.email}`, "reset");
      log(`      Nom: ${profile.full_name || "N/A"}`, "reset");
      log(`      Rôle: ${profile.role}`, profile.role === userConfig.role ? "green" : "red");
      if (profile.role === userConfig.role) {
        log(`      ✅ Rôle correctement attribué !`, "green");
      } else {
        log(`      ❌ ATTENTION: Le rôle ne correspond pas !`, "red");
      }
    }
  } catch (error: any) {
    log(`   ❌ Erreur lors du traitement: ${error.message}`, "red");
    if (error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}

async function main() {
  log("\n🚀 RedZone - Attribution des Rôles Admin & Modérateur", "bold");
  log("=".repeat(60), "cyan");

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

    // Vérifier que la contrainte CHECK accepte 'moderator'
    log("\n🔍 Vérification de la contrainte CHECK pour 'moderator'...", "cyan");
    try {
      // Essayer d'insérer un profil de test avec 'moderator' pour vérifier
      const testId = "00000000-0000-0000-0000-000000000000";
      const { error: testError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: testId,
          email: "test-check@example.com",
          role: "moderator",
        })
        .select();

      if (testError && testError.message.includes("violates check constraint")) {
        log("❌ ERREUR: La contrainte CHECK ne permet pas 'moderator'", "red");
        log("💡 Exécutez d'abord le script SQL: supabase/add_moderator_role.sql", "yellow");
        process.exit(1);
      }

      // Supprimer le profil de test
      await supabaseAdmin.from("profiles").delete().eq("id", testId);
      log("✅ La contrainte CHECK accepte 'moderator'", "green");
    } catch (error: any) {
      log(`⚠️  Impossible de vérifier la contrainte: ${error.message}`, "yellow");
      log("💡 Assurez-vous d'avoir exécuté: supabase/add_moderator_role.sql", "yellow");
    }

    // Traiter chaque utilisateur
    for (const user of usersToSet) {
      await setUserRole(user);
    }

    log("\n" + "=".repeat(60), "cyan");
    log("✅ Script terminé avec succès !", "green");
    log("\n📝 Rôles attribués :", "cyan");
    log("   • dimitri.vanmieghem@gmail.com → admin (Super Admin)", "reset");
    log("   • antoine.binias@test.com → moderator (Modérateur/Support)", "reset");
    log("\n💡 Les utilisateurs peuvent maintenant se connecter avec leurs comptes", "yellow");
    log("🔒 Les permissions sont gérées par le middleware et la navigation", "cyan");
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

