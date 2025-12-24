#!/usr/bin/env node
/**
 * RedZone - Script de Déploiement Netlify
 * 
 * Ce script automatise le déploiement sur Netlify
 * 
 * Usage:
 *   node scripts/deploy-to-netlify.js
 *   npm run deploy-netlify
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Couleurs
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

// Vérifier que Netlify CLI est installé
function checkNetlifyCLI() {
  try {
    execSync('netlify --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Fonction principale
function main() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║  RedZone - Déploiement Netlify                               ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════╝\n', 'cyan');

  // Étape 1 : Vérifier les variables d'environnement
  log('📋 Étape 1 : Vérification des variables d\'environnement...', 'blue');
  try {
    execSync('npm run verify-env', { stdio: 'inherit' });
  } catch {
    error('La vérification des variables d\'environnement a échoué');
    log('\n💡 Corrigez les erreurs avant de continuer\n', 'yellow');
    process.exit(1);
  }

  // Étape 2 : Build
  log('\n📋 Étape 2 : Build de production...', 'blue');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    success('Build réussi !');
  } catch {
    error('Le build a échoué');
    process.exit(1);
  }

  // Étape 3 : Vérifier Netlify CLI
  log('\n📋 Étape 3 : Vérification de Netlify CLI...', 'blue');
  if (!checkNetlifyCLI()) {
    warning('Netlify CLI n\'est pas installé');
    info('Installation de Netlify CLI...');
    try {
      execSync('npm install -g netlify-cli', { stdio: 'inherit' });
      success('Netlify CLI installé !');
    } catch {
      error('Impossible d\'installer Netlify CLI');
      log('\n💡 Installez-le manuellement : npm install -g netlify-cli\n', 'yellow');
      process.exit(1);
    }
  } else {
    success('Netlify CLI est installé');
  }

  // Étape 4 : Vérifier si le site est déjà lié
  log('\n📋 Étape 4 : Vérification de la configuration Netlify...', 'blue');
  const netlifyPath = path.join(process.cwd(), '.netlify');
  const statePath = path.join(netlifyPath, 'state.json');
  
  let isLinked = false;
  if (fs.existsSync(statePath)) {
    try {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      if (state.siteId) {
        isLinked = true;
        success(`Site Netlify déjà lié : ${state.siteId}`);
      }
    } catch {
      // Ignorer les erreurs de parsing
    }
  }

  if (!isLinked) {
    warning('Le site n\'est pas encore lié à Netlify');
    log('\n📝 Instructions pour lier le site :', 'yellow');
    log('   1. Exécutez : netlify login', 'cyan');
    log('   2. Exécutez : netlify link', 'cyan');
    log('   3. Ou créez un nouveau site : netlify init\n', 'cyan');
    log('💡 Après avoir lié le site, réexécutez ce script\n', 'yellow');
    process.exit(0);
  }

  // Étape 5 : Déploiement
  log('\n📋 Étape 5 : Déploiement sur Netlify...', 'blue');
  try {
    info('Déploiement en cours...');
    execSync('netlify deploy --prod', { stdio: 'inherit' });
    success('Déploiement réussi !');
  } catch {
    error('Le déploiement a échoué');
    log('\n💡 Vérifiez les erreurs ci-dessus et réessayez\n', 'yellow');
    process.exit(1);
  }

  // Résumé
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'green');
  log('║  ✅ DÉPLOIEMENT RÉUSSI !                                     ║', 'green');
  log('╚═══════════════════════════════════════════════════════════════╝\n', 'green');

  log('📝 Prochaines étapes :', 'yellow');
  log('   1. Vérifiez que les variables d\'environnement sont configurées dans Netlify Dashboard', 'cyan');
  log('   2. Testez votre site en production', 'cyan');
  log('   3. Configurez les cron jobs (voir GUIDE_DEPLOIEMENT_FINAL.md)\n', 'cyan');
}

// Exécuter
main();

