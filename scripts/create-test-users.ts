#!/usr/bin/env tsx
/**
 * RedZone - Script de Création de Comptes de Test
 * 
 * Ce script crée deux utilisateurs de test pré-configurés :
 * - Un compte Particulier (test.particulier@redzone.be)
 * - Un compte Professionnel (test.pro@redzone.be)
 * 
 * Les utilisateurs sont créés avec email auto-validé et profils complets.
 * 
 * Usage: npx tsx scripts/create-test-users.ts
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
import { existsSync, readFileSync } from "fs";
if (!existsSync(envPath)) {
  log(`❌ ERREUR: Le fichier .env.local n'existe pas à: ${envPath}`, "red");
  log("💡 Créez le fichier .env.local à la racine du projet", "yellow");
  process.exit(1);
}

// Lire le contenu brut du fichier pour diagnostic
try {
  const envContent = readFileSync(envPath, "utf-8");
  const hasServiceRoleKey = envContent.includes("SERVICE_ROLE");
  const hasSupabaseUrl = envContent.includes("NEXT_PUBLIC_SUPABASE_URL");
  
  log(`\n📄 Analyse du fichier .env.local:`, "cyan");
  log(`   Fichier trouvé: ✅`, "green");
  log(`   Contient "SERVICE_ROLE": ${hasServiceRoleKey ? "✅ Oui" : "❌ Non"}`, hasServiceRoleKey ? "green" : "red");
  log(`   Contient "NEXT_PUBLIC_SUPABASE_URL": ${hasSupabaseUrl ? "✅ Oui" : "❌ Non"}`, hasSupabaseUrl ? "green" : "red");
  
  // Chercher toutes les variantes possibles du nom
  const possibleNames = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_KEY",
    "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
  ];
  
  const foundNames = possibleNames.filter(name => envContent.includes(name));
  if (foundNames.length > 0) {
    log(`\n   Variables similaires trouvées:`, "cyan");
    foundNames.forEach(name => {
      log(`   - ${name}`, "yellow");
    });
    if (!foundNames.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      log(`\n   ⚠️  ATTENTION: Le nom exact doit être "SUPABASE_SERVICE_ROLE_KEY"`, "yellow");
      log(`   Vous avez peut-être utilisé: ${foundNames[0]}`, "yellow");
    }
  }
} catch (error) {
  log(`   ⚠️  Impossible de lire le fichier .env.local`, "yellow");
}

// Vérifier les variables d'environnement requises
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Diagnostic amélioré
log(`\n🔍 Diagnostic des variables d'environnement:`, "cyan");
log(`   Fichier chargé: ${envPath}`, "reset");
log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "✅ Défini" : "❌ Manquant"}`, supabaseUrl ? "green" : "red");
log(`   SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? "✅ Défini" : "❌ Manquant"}`, serviceRoleKey ? "green" : "red");

// Afficher toutes les variables SUPABASE pour debug (sans afficher les valeurs)
const supabaseVars = Object.keys(process.env).filter(key => key.includes("SUPABASE"));
if (supabaseVars.length > 0) {
  log(`\n📋 Variables SUPABASE trouvées dans .env.local:`, "cyan");
  supabaseVars.forEach(key => {
    const value = process.env[key];
    const isDefined = value && value.trim().length > 0;
    log(`   ${key}: ${isDefined ? "✅ Défini" : "❌ Vide"}`, isDefined ? "green" : "red");
  });
}

if (!supabaseUrl) {
  log("\n❌ ERREUR: NEXT_PUBLIC_SUPABASE_URL n'est pas défini dans .env.local", "red");
  log("💡 Ajoutez cette ligne dans .env.local:", "yellow");
  log("   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co", "reset");
  process.exit(1);
}

if (!serviceRoleKey) {
  log("\n❌ ERREUR: SUPABASE_SERVICE_ROLE_KEY n'est pas défini dans .env.local", "red");
  log("💡 Vérifications:", "yellow");
  log("   1. Le nom de la variable doit être EXACTEMENT: SUPABASE_SERVICE_ROLE_KEY", "reset");
  log("   2. Pas d'espaces autour du signe =", "reset");
  log("   3. Pas de guillemets autour de la valeur (sauf si nécessaire)", "reset");
  log("   4. Récupérez la Service Role Key dans Supabase Dashboard > Settings > API", "reset");
  log("\n   Exemple de format correct dans .env.local:", "yellow");
  log("   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "reset");
  process.exit(1);
}

// Créer le client admin Supabase
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  accountType: "particulier" | "pro";
  vatNumber?: string;
}

const testUsers: TestUser[] = [
  {
    email: "test.particulier@redzone.be",
    password: "Password123!",
    firstName: "Jean",
    lastName: "Testeur",
    accountType: "particulier",
  },
  {
    email: "test.pro@redzone.be",
    password: "Password123!",
    firstName: "Garage",
    lastName: "RedZone",
    accountType: "pro",
    vatNumber: "BE0123456789",
  },
];

async function createTestUser(user: TestUser): Promise<void> {
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  log(`\n📝 Création de l'utilisateur: ${user.email}`, "cyan");

  try {
    // 1. Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.some((u) => u.email === user.email);

    if (userExists) {
      log(`⚠️  Utilisateur déjà existant: ${user.email}`, "yellow");
      log(`   → Passons au suivant...`, "yellow");
      return;
    }

    // 2. Créer l'utilisateur avec email auto-validé
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Auto-valider l'email (pas besoin de confirmer par email)
      user_metadata: {
        first_name: user.firstName,
        last_name: user.lastName,
        full_name: fullName,
        role: user.accountType, // Utiliser 'role' pour être cohérent avec le schéma
        accountType: user.accountType, // Garder aussi accountType pour compatibilité
        ...(user.vatNumber && { vat_number: user.vatNumber }),
      },
    });

    if (authError) {
      throw authError;
    }

    if (!authUser.user) {
      throw new Error("Utilisateur créé mais user est null");
    }

    log(`   ✅ Utilisateur créé dans auth.users (ID: ${authUser.user.id})`, "green");

    // 3. Créer ou mettre à jour le profil dans la table profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: authUser.user.id,
          email: user.email,
          full_name: fullName,
          role: user.accountType,
        },
        {
          onConflict: "id",
        }
      );

    if (profileError) {
      // Si le profil existe déjà (créé par le trigger), on le met à jour
      log(`   ⚠️  Erreur création profil (peut déjà exister): ${profileError.message}`, "yellow");
      
      // Essayer de mettre à jour
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          email: user.email,
          full_name: fullName,
          role: user.accountType,
        })
        .eq("id", authUser.user.id);

      if (updateError) {
        log(`   ❌ Erreur mise à jour profil: ${updateError.message}`, "red");
      } else {
        log(`   ✅ Profil mis à jour dans profiles`, "green");
      }
    } else {
      log(`   ✅ Profil créé dans profiles`, "green");
    }

    // 4. Afficher le résumé
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
    if (error.message?.includes("already registered") || error.message?.includes("already exists")) {
      log(`   ⚠️  L'utilisateur existe peut-être déjà. Passons au suivant...`, "yellow");
    } else {
      throw error;
    }
  }
}

async function main() {
  log("\n🚀 RedZone - Création des Comptes de Test", "bold");
  log("=" .repeat(50), "cyan");

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
    for (const user of testUsers) {
      await createTestUser(user);
    }

    log("\n" + "=".repeat(50), "cyan");
    log("✅ Script terminé avec succès !", "green");
    log("\n📝 Comptes de test créés :", "cyan");
    log("   • test.particulier@redzone.be (Particulier)", "reset");
    log("   • test.pro@redzone.be (Professionnel)", "reset");
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

