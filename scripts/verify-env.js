#!/usr/bin/env node
/**
 * RedZone - Script de Vérification des Variables d'Environnement
 * 
 * Ce script vérifie que toutes les variables d'environnement sont correctement configurées
 * avant le déploiement en production.
 * 
 * Usage:
 *   node scripts/verify-env.js
 *   npm run verify-env
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Résultats de la vérification
const results = {
  errors: [],
  warnings: [],
  success: [],
};

// Vérifier que .env.local existe
function checkEnvFileExists() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    error('.env.local n\'existe pas');
    results.errors.push('Le fichier .env.local est manquant');
    return false;
  }
  
  success('.env.local existe');
  results.success.push('.env.local existe');
  return true;
}

// Vérifier que .env.local est dans .gitignore
function checkGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    warning('.gitignore n\'existe pas');
    results.warnings.push('.gitignore manquant');
    return false;
  }
  
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  
  if (!gitignoreContent.includes('.env.local')) {
    error('.env.local n\'est PAS dans .gitignore');
    results.errors.push('.env.local doit être dans .gitignore');
    return false;
  }
  
  success('.env.local est dans .gitignore');
  results.success.push('.env.local est protégé par .gitignore');
  return true;
}

// Lire et parser .env.local
function readEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const content = fs.readFileSync(envPath, 'utf-8');
  
  const env = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Ignorer les commentaires et les lignes vides
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    // Parser KEY=VALUE
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  }
  
  return env;
}

// Vérifier les variables obligatoires
function checkRequiredVariables(env) {
  const required = [
    {
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      validator: (value) => {
        if (!value) return 'est manquante';
        if (!value.startsWith('https://')) return 'doit commencer par https://';
        if (value.includes('localhost') || value.includes('127.0.0.1')) {
          return 'ne doit pas contenir localhost ou 127.0.0.1';
        }
        if (!value.includes('.supabase.co')) return 'doit être une URL Supabase valide (.supabase.co)';
        if (value.includes('placeholder') || value.includes('votre-projet') || value.includes('xxx')) {
          return 'ne doit pas être un placeholder';
        }
        return null;
      },
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      validator: (value) => {
        if (!value) return 'est manquante';
        if (!value.startsWith('eyJ')) return 'doit commencer par eyJ (JWT valide)';
        if (value.length < 100) return 'semble trop courte pour être une clé valide';
        if (value.includes('placeholder') || value.includes('xxx') || value.includes('your-key')) {
          return 'ne doit pas être un placeholder';
        }
        return null;
      },
    },
  ];
  
  for (const { key, validator } of required) {
    const value = env[key];
    const error = validator(value);
    
    if (error) {
      error(`${key}: ${error}`);
      results.errors.push(`${key}: ${error}`);
    } else {
      success(`${key}: OK`);
      results.success.push(`${key} est valide`);
    }
  }
}

// Vérifier les variables recommandées
function checkRecommendedVariables(env) {
  const recommended = [
    {
      key: 'NEXT_PUBLIC_SITE_URL',
      validator: (value) => {
        if (!value) return 'est manquante (recommandée pour production)';
        if (!value.startsWith('https://')) return 'doit commencer par https://';
        if (value.includes('localhost') || value.includes('127.0.0.1')) {
          return 'ne doit pas contenir localhost';
        }
        return null;
      },
    },
    {
      key: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      validator: (value) => {
        if (!value) return 'est manquante (recommandée pour /sell)';
        if (value === '1x00000000000000000000AA') return 'utilise la clé de test par défaut';
        if (!value.startsWith('0x')) return 'doit commencer par 0x (clé publique)';
        return null;
      },
    },
    {
      key: 'SENTINELLE_SECRET_KEY',
      validator: (value) => {
        if (!value) return 'est manquante (recommandée pour cron jobs)';
        if (value.length < 32) return 'doit faire au moins 32 caractères';
        if (value === 'test' || value === 'secret' || value === 'xxx') {
          return 'ne doit pas être une valeur de test';
        }
        return null;
      },
    },
    {
      key: 'CLEANUP_SECRET_KEY',
      validator: (value) => {
        if (!value) return 'est manquante (recommandée pour cron jobs)';
        if (value.length < 32) return 'doit faire au moins 32 caractères';
        if (value === 'test' || value === 'secret' || value === 'xxx') {
          return 'ne doit pas être une valeur de test';
        }
        if (env.SENTINELLE_SECRET_KEY && value === env.SENTINELLE_SECRET_KEY) {
          return 'ne doit pas être identique à SENTINELLE_SECRET_KEY';
        }
        return null;
      },
    },
  ];
  
  for (const { key, validator } of recommended) {
    const value = env[key];
    const error = validator(value);
    
    if (error) {
      warning(`${key}: ${error}`);
      results.warnings.push(`${key}: ${error}`);
    } else {
      success(`${key}: OK`);
      results.success.push(`${key} est valide`);
    }
  }
}

// Vérifier les variables interdites
function checkForbiddenVariables(env) {
  const forbidden = [
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      reason: 'est trop sensible et ne doit jamais être dans .env.local',
    },
  ];
  
  for (const { key, reason } of forbidden) {
    if (env[key]) {
      error(`${key}: ${reason}`);
      results.errors.push(`${key}: ${reason}`);
    }
  }
  
  // Vérifier les valeurs interdites
  const forbiddenValues = ['localhost', '127.0.0.1', 'placeholder', 'xxx', 'test', 'secret'];
  
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === 'string') {
      for (const forbiddenValue of forbiddenValues) {
        if (value.toLowerCase().includes(forbiddenValue) && 
            !key.includes('TURNSTILE') && // Exception pour la clé de test Turnstile
            !key.includes('SITE_URL') || value.startsWith('https://')) { // Exception si c'est une URL valide
          // Vérifier si c'est vraiment un problème
          if (value.includes('localhost') && !value.startsWith('https://')) {
            error(`${key}: contient "${forbiddenValue}" (valeur interdite en production)`);
            results.errors.push(`${key}: contient une valeur interdite`);
            break;
          }
        }
      }
    }
  }
}

// Fonction principale
function main() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  Vérification des Variables d\'Environnement - RedZone       ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝\n', 'cyan');
  
  // Vérifier que .env.local existe
  if (!checkEnvFileExists()) {
    log('\n❌ Vérification échouée : .env.local manquant\n', 'red');
    process.exit(1);
  }
  
  // Vérifier .gitignore
  checkGitignore();
  
  // Lire .env.local
  info('Lecture de .env.local...\n');
  const env = readEnvFile();
  
  log('📋 Variables trouvées :', 'blue');
  Object.keys(env).forEach(key => {
    if (key.includes('KEY') || key.includes('PASSWORD') || key.includes('SECRET')) {
      log(`   ${key}=*** (masquée)`, 'cyan');
    } else {
      log(`   ${key}=${env[key]}`, 'cyan');
    }
  });
  log('');
  
  // Vérifier les variables obligatoires
  log('🔍 Vérification des variables obligatoires...', 'blue');
  checkRequiredVariables(env);
  log('');
  
  // Vérifier les variables recommandées
  log('🔍 Vérification des variables recommandées...', 'blue');
  checkRecommendedVariables(env);
  log('');
  
  // Vérifier les variables interdites
  log('🔍 Vérification des variables interdites...', 'blue');
  checkForbiddenVariables(env);
  log('');
  
  // Résumé
  log('╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RÉSUMÉ DE LA VÉRIFICATION                                    ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝\n', 'cyan');
  
  if (results.errors.length === 0 && results.warnings.length === 0) {
    success('✅ Toutes les vérifications sont passées avec succès !');
    log('\n🚀 Votre configuration est prête pour le déploiement.\n', 'green');
    process.exit(0);
  }
  
  if (results.errors.length > 0) {
    error(`❌ ${results.errors.length} erreur(s) détectée(s) :`);
    results.errors.forEach(err => log(`   • ${err}`, 'red'));
    log('\n⚠️  Vous devez corriger ces erreurs avant le déploiement.\n', 'red');
    process.exit(1);
  }
  
  if (results.warnings.length > 0) {
    warning(`⚠️  ${results.warnings.length} avertissement(s) :`);
    results.warnings.forEach(warn => log(`   • ${warn}`, 'yellow'));
    log('\n💡 Ces avertissements ne bloquent pas le déploiement, mais sont recommandés.\n', 'yellow');
    process.exit(0);
  }
}

// Exécuter le script
main();

