#!/usr/bin/env tsx
/**
 * Script de déploiement entièrement automatisé RedZone
 * Fait tout ce qui peut être fait automatiquement et guide pour le reste
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';
import * as readline from 'readline';

interface Step {
  name: string;
  automated: boolean;
  command?: string;
  manual?: string[];
  check?: () => boolean;
}

const steps: Step[] = [];

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command: string, silent = false): string {
  try {
    return execSync(command, { 
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit',
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
    } as any);
  } catch (error: any) {
    if (!silent) {
      log(`❌ Erreur: ${error.message}`, 'red');
    }
    throw error;
  }
}

function execSafe(command: string, silent = false): { success: boolean; output?: string } {
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'pipe',
      shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
    } as any);
    return { success: true, output };
  } catch (error: any) {
    return { success: false };
  }
}

function checkGitRepo(): boolean {
  const result = execSafe('git rev-parse --git-dir', true);
  return result.success;
}

function checkGitRemote(): boolean {
  const result = execSafe('git remote -v', true);
  if (!result.success) return false;
  return result.output?.includes('origin') || false;
}

function checkGitInstalled(): boolean {
  const result = execSafe('git --version', true);
  return result.success;
}

function checkNodeModules(): boolean {
  return existsSync(resolve(process.cwd(), 'node_modules'));
}

function checkEnvFile(): boolean {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return false;
  
  const content = readFileSync(envPath, 'utf-8');
  return content.includes('NEXT_PUBLIC_SUPABASE_URL') && 
         content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Fonction prompt supprimée - utilisation directe de readline dans le code

async function main() {
  log('\n🚀 Déploiement Automatique RedZone\n', 'bold');
  log('='.repeat(60), 'cyan');
  log('Ce script va automatiser tout ce qui peut l\'être', 'blue');
  log('='.repeat(60), 'cyan');
  log('');

  // ÉTAPE 1 : Vérifier les prérequis
  log('📋 ÉTAPE 1 : Vérification des prérequis\n', 'bold');

  const checks = [
    { name: 'Node.js installé', check: () => {
      const result = execSafe('node --version', true);
      return result.success;
    }, required: true},
    { name: 'npm installé', check: () => {
      const result = execSafe('npm --version', true);
      return result.success;
    }, required: true},
    { name: 'Git installé', check: checkGitInstalled, required: false},
    { name: 'Dépendances installées', check: checkNodeModules, required: true},
    { name: 'Repository Git initialisé', check: checkGitRepo, required: false},
  ];

  let allPassed = true;
  let criticalFailed = false;
  
  for (const { name, check, required = true } of checks) {
    if (check()) {
      log(`✅ ${name}`, 'green');
    } else {
      if (required) {
        log(`❌ ${name} (requis)`, 'red');
        criticalFailed = true;
      } else {
        log(`⚠️  ${name} (optionnel)`, 'yellow');
      }
      allPassed = false;
    }
  }

  if (criticalFailed) {
    log('\n❌ Des prérequis critiques manquent. Installation automatique...\n', 'red');
    
    if (!checkNodeModules()) {
      log('📦 Installation des dépendances npm...', 'blue');
      try {
        exec('npm install');
      } catch (error) {
        log('❌ Échec de l\'installation des dépendances', 'red');
        process.exit(1);
      }
    }
  } else if (!allPassed) {
    log('\n⚠️  Certains prérequis optionnels manquent. Installation automatique...\n', 'yellow');
    
    if (!checkNodeModules()) {
      log('📦 Installation des dépendances npm...', 'blue');
      try {
        exec('npm install');
      } catch (error) {
        log('⚠️  Échec de l\'installation, mais continuons...', 'yellow');
      }
    }

    // Git est optionnel - ne pas faire échouer le script
    if (!checkGitInstalled()) {
      log('\n⚠️  Git n\'est pas installé ou pas dans le PATH', 'yellow');
      log('💡 Vous pouvez :', 'cyan');
      log('   1. Installer Git : https://git-scm.com/download/win', 'cyan');
      log('   2. Ou continuer sans Git (vous devrez pousser manuellement)', 'cyan');
      log('');
    } else if (!checkGitRepo()) {
      log('📦 Initialisation du repository Git...', 'blue');
      try {
        exec('git init');
        exec('git add .');
        exec('git commit -m "Initial commit - RedZone"');
      } catch (error) {
        log('⚠️  Échec de l\'initialisation Git, mais continuons...', 'yellow');
        log('💡 Vous pouvez initialiser Git manuellement plus tard', 'cyan');
      }
    }
  }

  log('\n✅ Prérequis vérifiés\n', 'green');

  // ÉTAPE 2 : Vérifier le build
  log('🔨 ÉTAPE 2 : Vérification du build\n', 'bold');
  
  try {
    log('Compilation du projet...', 'blue');
    exec('npm run build', true);
    log('✅ Build réussi !\n', 'green');
  } catch (error) {
    log('❌ Build échoué. Corrigez les erreurs avant de continuer.\n', 'red');
    process.exit(1);
  }

  // ÉTAPE 3 : Configuration Git (optionnel)
  log('📤 ÉTAPE 3 : Configuration Git\n', 'bold');

  if (!checkGitInstalled()) {
    log('⚠️  Git n\'est pas disponible sur ce système\n', 'yellow');
    log('💡 Pour utiliser Git (recommandé) :', 'cyan');
    log('   1. Installez Git : https://git-scm.com/download/win', 'cyan');
    log('   2. Redémarrez votre terminal', 'cyan');
    log('   3. Relancez ce script\n', 'cyan');
    log('⚠️  Continuons sans Git - vous devrez pousser manuellement vers GitHub\n', 'yellow');
  } else if (!checkGitRemote()) {
    log('⚠️  Aucun remote Git configuré.\n', 'yellow');
    log('Pour automatiser complètement, vous devez :\n', 'blue');
    log('1. Créer un dépôt sur GitHub (github.com/new)', 'cyan');
    log('2. Exécuter ces commandes :\n', 'cyan');
    log('   git remote add origin https://github.com/VOTRE_USERNAME/redzone.git', 'yellow');
    log('   git branch -M main', 'yellow');
    log('   git push -u origin main\n', 'yellow');
    
    try {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const setupRemote = await new Promise<string>((resolve) => {
        readline.question('Voulez-vous configurer le remote maintenant ? (y/N): ', (answer: string) => {
          readline.close();
          resolve(answer);
        });
      });

      if (setupRemote.toLowerCase() === 'y') {
        const readline2 = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const repoUrl = await new Promise<string>((resolve) => {
          readline2.question('URL du dépôt GitHub (ex: https://github.com/user/redzone.git): ', (answer: string) => {
            readline2.close();
            resolve(answer);
          });
        });

        if (repoUrl) {
          try {
            exec(`git remote add origin ${repoUrl}`);
            exec('git branch -M main');
            log('✅ Remote Git configuré\n', 'green');
          } catch (error) {
            log('⚠️  Erreur lors de la configuration. Configurez manuellement.\n', 'yellow');
          }
        }
      }
    } catch (error) {
      log('⚠️  Impossible de configurer le remote interactivement. Configurez manuellement.\n', 'yellow');
    }
  } else {
    log('✅ Remote Git déjà configuré\n', 'green');
  }

  // ÉTAPE 4 : Générer les instructions Vercel
  log('🌐 ÉTAPE 4 : Configuration Vercel\n', 'bold');
  
  const vercelInstructions = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CONFIGURATION VERCEL (5 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Allez sur https://vercel.com et connectez-vous avec GitHub

2. Cliquez sur "Add New..." → "Project"

3. Sélectionnez votre dépôt "redzone"

4. Configurez les variables d'environnement :
   
   Dans "Environment Variables", ajoutez :
   
   ┌─────────────────────────────────────┬────────────────────────────────────┐
   │ Variable                            │ Valeur                             │
   ├─────────────────────────────────────┼────────────────────────────────────┤
   │ NEXT_PUBLIC_SUPABASE_URL            │ https://xxxxx.supabase.co          │
   │ NEXT_PUBLIC_SUPABASE_ANON_KEY       │ eyJhbGciOiJIUzI1NiIsInR5cCI6...    │
   │ NEXT_PUBLIC_SITE_URL                │ https://redzone.vercel.app        │
   └─────────────────────────────────────┴────────────────────────────────────┘

5. Cliquez sur "Deploy"

6. Attendez 2-3 minutes

7. Votre site sera en ligne ! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  log(vercelInstructions, 'cyan');

  // ÉTAPE 5 : Générer les instructions Supabase
  log('\n🗄️  ÉTAPE 5 : Configuration Supabase\n', 'bold');
  
  const supabaseInstructions = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  MIGRATIONS SUPABASE (10 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dans Supabase Dashboard → SQL Editor, exécutez dans l'ordre :

1. supabase/create_articles_table.sql
2. supabase/create_comments_table.sql
3. supabase/create_app_logs_table.sql
4. supabase/create_model_specs_db_table.sql
5. supabase/add_advanced_filters.sql
6. supabase/add_location_fields.sql
7. supabase/extend_articles_for_ugc.sql
8. supabase/add_professional_roles.sql
9. supabase/admin_extensions.sql

Ensuite :
- Créez un bucket "files" dans Storage → Buckets
- Configurez les Redirect URLs dans Settings → API :
  * https://votre-site.vercel.app/auth/callback
  * https://votre-site.vercel.app/login

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  log(supabaseInstructions, 'cyan');

  // ÉTAPE 6 : Push vers GitHub (si possible)
  log('\n📤 ÉTAPE 6 : Push vers GitHub\n', 'bold');

  if (!checkGitInstalled()) {
    log('⚠️  Git n\'est pas disponible - étape ignorée\n', 'yellow');
    log('💡 Pour pousser vers GitHub plus tard :', 'cyan');
    log('   1. Installez Git', 'cyan');
    log('   2. Exécutez : git push origin main\n', 'cyan');
  } else if (checkGitRemote()) {
    try {
      // Vérifier s'il y a des changements
      const statusResult = execSafe('git status --porcelain', true);
      
      if (statusResult.success && statusResult.output?.trim()) {
        log('📝 Changements détectés. Commit automatique...', 'blue');
        try {
          exec('git add .');
          exec('git commit -m "Auto-deploy: ' + new Date().toISOString() + '"');
        } catch (error) {
          log('⚠️  Commit échoué, mais continuons...', 'yellow');
        }
      }

      log('📤 Push vers GitHub...', 'blue');
      try {
        exec('git push origin main');
        log('✅ Code poussé vers GitHub\n', 'green');
        log('💡 Si GitHub Actions est configuré, le déploiement se fera automatiquement !\n', 'cyan');
      } catch (error) {
        log('⚠️  Push échoué. Poussez manuellement avec: git push origin main\n', 'yellow');
      }
    } catch (error) {
      log('⚠️  Erreur lors du push. Poussez manuellement avec: git push origin main\n', 'yellow');
    }
  } else {
    log('⚠️  Remote Git non configuré. Poussez manuellement après configuration.\n', 'yellow');
  }

  // Résumé final
  log('\n' + '='.repeat(60), 'cyan');
  log('✅ AUTOMATISATION TERMINÉE', 'green');
  log('='.repeat(60), 'cyan');
  log('');
  log('📋 Actions restantes (manuelles) :', 'bold');
  log('');
  log('1. ✅ Build vérifié et réussi', 'green');
  log('2. ⏳ Configurer Vercel (voir instructions ci-dessus)', 'yellow');
  log('3. ⏳ Exécuter les migrations Supabase (voir instructions ci-dessus)', 'yellow');
  log('4. ⏳ Configurer les variables d\'environnement dans Vercel', 'yellow');
  log('');
  log('💡 Une fois Vercel configuré, votre site sera en ligne !', 'cyan');
  log('');
  log('📚 Pour plus d\'infos, consultez:', 'blue');
  log('   - QUICK_START_DEPLOY.md (déploiement rapide)', 'cyan');
  log('   - AUTOMATED_DEPLOYMENT.md (automatisation complète)', 'cyan');
  log('');
}

main().catch((error) => {
  log(`\n❌ Erreur fatale: ${error.message}`, 'red');
  process.exit(1);
});

