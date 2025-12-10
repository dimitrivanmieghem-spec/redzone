#!/usr/bin/env tsx
/**
 * Script de vérification pré-déploiement
 * Vérifie que tout est prêt avant le déploiement
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const checks: CheckResult[] = [];

// 1. Vérifier que .env.local existe
const envLocalPath = resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  const envContent = readFileSync(envLocalPath, 'utf-8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  const missingVars = requiredVars.filter(
    (varName) => !envContent.includes(varName)
  );
  
  if (missingVars.length === 0) {
    checks.push({
      name: 'Variables d\'environnement locales',
      status: 'pass',
      message: 'Toutes les variables requises sont présentes',
    });
  } else {
    checks.push({
      name: 'Variables d\'environnement locales',
      status: 'fail',
      message: `Variables manquantes: ${missingVars.join(', ')}`,
    });
  }
} else {
  checks.push({
    name: 'Variables d\'environnement locales',
    status: 'warn',
    message: '.env.local non trouvé (normal si vous utilisez uniquement Vercel)',
  });
}

// 2. Vérifier que le build passe
checks.push({
  name: 'Build Next.js',
  status: 'warn',
  message: 'Exécutez "npm run build" pour vérifier',
});

// 3. Vérifier que .gitignore contient les fichiers sensibles
const gitignorePath = resolve(process.cwd(), '.gitignore');
if (existsSync(gitignorePath)) {
  const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
  const requiredIgnores = ['.env', '.env.local', 'node_modules', '.next'];
  
  const missingIgnores = requiredIgnores.filter(
    (ignore) => !gitignoreContent.includes(ignore)
  );
  
  if (missingIgnores.length === 0) {
    checks.push({
      name: '.gitignore',
      status: 'pass',
      message: 'Fichiers sensibles correctement ignorés',
    });
  } else {
    checks.push({
      name: '.gitignore',
      status: 'fail',
      message: `Éléments manquants: ${missingIgnores.join(', ')}`,
    });
  }
} else {
  checks.push({
    name: '.gitignore',
    status: 'fail',
    message: '.gitignore non trouvé',
  });
}

// 4. Vérifier que package.json existe et contient les scripts nécessaires
const packageJsonPath = resolve(process.cwd(), 'package.json');
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  
  if (packageJson.scripts?.build) {
    checks.push({
      name: 'Scripts package.json',
      status: 'pass',
      message: 'Script build présent',
    });
  } else {
    checks.push({
      name: 'Scripts package.json',
      status: 'fail',
      message: 'Script "build" manquant dans package.json',
    });
  }
} else {
  checks.push({
    name: 'package.json',
    status: 'fail',
    message: 'package.json non trouvé',
  });
}

// 5. Vérifier que les migrations SQL existent
const migrationsPath = resolve(process.cwd(), 'supabase');
if (existsSync(migrationsPath)) {
  const requiredMigrations = [
    'create_articles_table.sql',
    'create_comments_table.sql',
    'create_app_logs_table.sql',
    'create_model_specs_db_table.sql',
  ];
  
  // Vérifier au moins quelques migrations importantes
  const foundMigrations = requiredMigrations.filter((migration) =>
    existsSync(resolve(migrationsPath, migration))
  );
  
  if (foundMigrations.length >= 2) {
    checks.push({
      name: 'Migrations SQL',
      status: 'pass',
      message: `${foundMigrations.length} migrations trouvées`,
    });
  } else {
    checks.push({
      name: 'Migrations SQL',
      status: 'warn',
      message: 'Peu de migrations trouvées, vérifiez le dossier supabase/',
    });
  }
} else {
  checks.push({
    name: 'Migrations SQL',
    status: 'warn',
    message: 'Dossier supabase/ non trouvé',
  });
}

// Afficher les résultats
console.log('\n🔍 Vérification pré-déploiement RedZone\n');
console.log('=' .repeat(50));

checks.forEach((check) => {
  const icon =
    check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
  const color =
    check.status === 'pass'
      ? '\x1b[32m'
      : check.status === 'fail'
      ? '\x1b[31m'
      : '\x1b[33m';
  const reset = '\x1b[0m';
  
  console.log(
    `${icon} ${color}${check.name}${reset}: ${check.message}`
  );
});

console.log('\n' + '='.repeat(50));

const failedChecks = checks.filter((c) => c.status === 'fail');
const warnings = checks.filter((c) => c.status === 'warn');

if (failedChecks.length === 0) {
  console.log('\n✅ Tous les checks critiques sont passés !');
  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} avertissement(s) - à vérifier`);
  }
  console.log('\n🚀 Prêt pour le déploiement !\n');
  process.exit(0);
} else {
  console.log(
    `\n❌ ${failedChecks.length} erreur(s) critique(s) à corriger avant le déploiement\n`
  );
  process.exit(1);
}

