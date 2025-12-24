# 🚀 GUIDE DE DÉPLOIEMENT FINAL - NETLIFY
**RedZone - Déploiement en production**

---

## ✅ PRÉPARATION AVANT DÉPLOIEMENT

### 1. Vérifier les Variables d'Environnement

**Exécutez le script de vérification :**
```bash
npm run verify-env
```

**Ce script vérifie :**
- ✅ Que `.env.local` existe
- ✅ Que `.env.local` est dans `.gitignore`
- ✅ Que toutes les variables obligatoires sont présentes
- ✅ Que les valeurs ne sont pas des placeholders
- ✅ Que les URLs sont en HTTPS (pas localhost)
- ✅ Que les clés secrètes sont sécurisées

**Si le script détecte des erreurs :**
- Corrigez-les dans `.env.local`
- Réexécutez `npm run verify-env`

---

### 2. Exécuter les Scripts SQL dans Supabase

**⚠️ IMPORTANT :** Exécutez ces scripts dans l'ordre :

#### A. Système des 500 Premiers Membres
```sql
-- Fichier : supabase/implement_founder_system.sql
-- Exécutez dans Supabase Dashboard > SQL Editor
```

#### B. Nettoyage des Données de Test
```sql
-- Fichier : supabase/cleanup_test_data.sql
-- ⚠️ ATTENTION : Supprime définitivement les données de test
-- Faites une sauvegarde avant !
```

#### C. Création des Comptes Admin/Moderator
```sql
-- Fichier : supabase/create_admin_moderator_accounts.sql
-- Modifiez les emails avant d'exécuter
```

**Vérification :**
```sql
-- Vérifier les comptes
SELECT id, email, role, is_founder 
FROM profiles 
WHERE role IN ('admin', 'moderator');

-- Vérifier qu'il n'y a pas d'annonces
SELECT COUNT(*) FROM vehicles;
```

---

### 3. Build de Production

**Vérifier que le build fonctionne :**
```bash
npm run build
```

**Si le build échoue :**
- Corrigez les erreurs
- Réexécutez `npm run build`

---

## 🔧 CONFIGURATION NETLIFY

### Étape 1 : Variables d'Environnement

**Dans Netlify Dashboard > Site Settings > Environment Variables :**

**Variables OBLIGATOIRES :**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://votre-site.netlify.app
```

**Variables RECOMMANDÉES :**
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x...
SENTINELLE_SECRET_KEY=votre-cle-secrete-32-caracteres-minimum
CLEANUP_SECRET_KEY=votre-autre-cle-secrete-32-caracteres-minimum
```

**Variables OPTIONNELLES :**
```env
RESEND_API_KEY=re_...
ADMIN_EMAIL=votre-email@example.com
MODERATOR_EMAIL=moderateur-email@example.com
```

**⚠️ IMPORTANT :**
- Utilisez les **mêmes valeurs** que dans votre `.env.local`
- Vérifiez que `NEXT_PUBLIC_SITE_URL` correspond à votre domaine Netlify
- Les clés secrètes doivent être longues (32+ caractères) et aléatoires

---

### Étape 2 : Configuration du Build

**Netlify détecte automatiquement Next.js**, mais vérifiez :

**Build settings :**
- **Build command :** `npm run build`
- **Publish directory :** `.next`
- **Node version :** `20.x` (déjà configuré dans `netlify.toml`)

**Le fichier `netlify.toml` est déjà configuré avec :**
- ✅ Headers de sécurité
- ✅ Cache pour les assets
- ✅ Redirections pour les routes admin

---

### Étape 3 : Déclencher le Déploiement

**Option 1 : Déploiement Automatique (Recommandé)**
```bash
# Commiter et pousser les changements
git add .
git commit -m "Préparation déploiement production"
git push origin main
```

Netlify déploiera automatiquement.

**Option 2 : Déploiement Manuel**
- Allez dans Netlify Dashboard > Deploys
- Cliquez sur "Trigger deploy" > "Deploy site"

---

## 🧪 TESTS POST-DÉPLOIEMENT

### Test 1 : Accès Public
- [ ] Visitez `https://votre-site.netlify.app`
- [ ] La page d'accueil s'affiche
- [ ] La recherche fonctionne
- [ ] Une annonce peut être consultée

### Test 2 : Inscription
- [ ] Créez un compte test
- [ ] Le badge "Membre Fondateur" est attribué (si < 500)
- [ ] Vous pouvez vous connecter

### Test 3 : Publication d'Annonce
- [ ] Connectez-vous
- [ ] Allez sur `/sell`
- [ ] Publiez une annonce de test
- [ ] Elle apparaît en statut "pending"

### Test 4 : Accès Admin
- [ ] Connectez-vous avec votre compte admin
- [ ] Le badge "ADMIN" est visible dans la navbar
- [ ] Cliquez sur le badge pour accéder à `/admin`
- [ ] Vous pouvez valider/rejeter des annonces
- [ ] Toutes les sections sont accessibles

### Test 5 : Accès Modérateur
- [ ] Connectez-vous avec le compte modérateur
- [ ] Vous pouvez accéder à `/admin`
- [ ] Vous pouvez modérer
- [ ] Vous NE pouvez PAS accéder aux sections admin-only

### Test 6 : Communication
- [ ] Créez deux comptes (acheteur et vendeur)
- [ ] Publiez une annonce avec le compte vendeur
- [ ] Connectez-vous avec le compte acheteur
- [ ] Consultez l'annonce
- [ ] Contactez le vendeur (email, WhatsApp, messages)
- [ ] La conversation est créée
- [ ] Les notifications fonctionnent

---

## 🔍 VÉRIFICATION DES LOGS

### Dans Netlify :
- Allez dans Site > Functions > Logs
- Vérifiez qu'il n'y a pas d'erreurs

### Dans Supabase :
- Allez dans Logs > Postgres Logs
- Vérifiez qu'il n'y a pas d'erreurs SQL

---

## ⚙️ CONFIGURATION DES CRON JOBS

**Note :** Netlify ne supporte pas nativement les cron jobs comme Vercel.

**Solution : Utiliser un service externe**

1. **Créez un compte sur [cron-job.org](https://cron-job.org) ou [EasyCron](https://www.easycron.com)**

2. **Configurez le cron job pour Sentinelle (toutes les heures) :**
   - **URL :** `https://votre-site.netlify.app/api/sentinelle/check`
   - **Méthode :** GET
   - **Headers :** `Authorization: Bearer VOTRE_SENTINELLE_SECRET_KEY`
   - **Schedule :** `0 * * * *` (toutes les heures)

3. **Configurez le cron job pour Cleanup (le 1er de chaque mois) :**
   - **URL :** `https://votre-site.netlify.app/api/cleanup-expired-data`
   - **Méthode :** GET
   - **Headers :** `Authorization: Bearer VOTRE_CLEANUP_SECRET_KEY`
   - **Schedule :** `0 0 1 * *` (le 1er de chaque mois à minuit)

**Alternative : Utiliser Supabase Cron (si disponible)**
- Configurez les cron jobs directement dans Supabase Dashboard
- Utilisez les fonctions SQL pour appeler les endpoints

---

## 🐛 PROBLÈMES COURANTS

### Problème 1 : Erreur "Supabase URL not found"
**Solution :**
- Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` est bien configuré dans Netlify
- Vérifiez que la variable commence par `https://`

### Problème 2 : Erreur "Invalid API key"
**Solution :**
- Vérifiez que `NEXT_PUBLIC_SUPABASE_ANON_KEY` est bien configuré
- Vérifiez que c'est la clé ANON (pas la service role key)

### Problème 3 : Les images ne se chargent pas
**Solution :**
- Vérifiez que les URLs Supabase Storage sont correctes
- Vérifiez les politiques RLS du bucket `files`

### Problème 4 : Les cron jobs ne fonctionnent pas
**Solution :**
- Configurez un service externe (voir section ci-dessus)
- Vérifiez que les clés secrètes sont configurées
- Vérifiez que les routes API sont accessibles

---

## ✅ CHECKLIST FINALE

Avant de considérer le déploiement comme terminé :

- [ ] Script de vérification exécuté avec succès (`npm run verify-env`)
- [ ] Scripts SQL exécutés dans Supabase
- [ ] Build réussi (`npm run build`)
- [ ] Variables d'environnement configurées dans Netlify
- [ ] Déploiement réussi
- [ ] Tous les tests post-déploiement passent
- [ ] Les logs ne montrent pas d'erreurs
- [ ] Les performances sont acceptables
- [ ] Le site est accessible publiquement
- [ ] Les fonctionnalités principales fonctionnent
- [ ] Les cron jobs sont configurés (si nécessaire)

---

## 📝 COMMANDES RAPIDES

```bash
# Vérifier les variables d'environnement
npm run verify-env

# Build de production
npm run build

# Vérifier et build (tout en un)
npm run pre-deploy

# Lancer le serveur de production localement
npm run start
```

---

**Statut :** ✅ **PRÊT POUR LE DÉPLOIEMENT**  
**Prochaine étape :** Exécutez `npm run verify-env` puis suivez ce guide

