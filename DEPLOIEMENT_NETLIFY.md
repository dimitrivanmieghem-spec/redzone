# 🚀 GUIDE DE DÉPLOIEMENT NETLIFY
**RedZone - Déploiement en production sur Netlify**

---

## 📋 CHECKLIST AVANT DÉPLOIEMENT

### ✅ 1. Audit Complet Effectué
- [x] Audit des pages publiques
- [x] Audit des pages utilisateur
- [x] Audit des portails admin et modérateur
- [x] Audit de la sécurité
- [x] Vérification des fonctionnalités

### ⚠️ 2. Actions Critiques à Effectuer

#### A. Implémenter le Système des 500 Premiers Membres Fondateurs
- [ ] Exécuter `supabase/implement_founder_system.sql`
- [ ] Vérifier que la colonne `is_founder` existe
- [ ] Tester l'attribution automatique

#### B. Nettoyer les Données de Test
- [ ] Exécuter `supabase/cleanup_test_data.sql`
- [ ] Vérifier que seuls les comptes admin et modérateur restent
- [ ] Vérifier qu'il n'y a aucune annonce

#### C. Créer les Comptes Admin et Modérateur
- [ ] Créer votre compte admin
- [ ] Créer le compte modérateur de votre ami
- [ ] Exécuter `supabase/create_admin_moderator_accounts.sql`
- [ ] Vérifier les accès

#### D. Configurer les Variables d'Environnement
- [ ] Configurer toutes les variables dans Netlify
- [ ] Vérifier les clés secrètes

---

## 🔧 CONFIGURATION NETLIFY

### Étape 1 : Créer le Projet sur Netlify

1. Allez sur [netlify.com](https://netlify.com)
2. Connectez votre repository GitHub/GitLab
3. Configurez le build :
   - **Build command :** `npm run build`
   - **Publish directory :** `.next`
   - **Node version :** `18.x` ou `20.x`

### Étape 2 : Configurer les Variables d'Environnement

Dans Netlify Dashboard > Site Settings > Environment Variables, ajoutez :

```env
# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Site URL (OBLIGATOIRE)
NEXT_PUBLIC_SITE_URL=https://votre-site.netlify.app

# Cloudflare Turnstile (OBLIGATOIRE pour /sell)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxx

# Cron Jobs (Optionnel mais recommandé)
SENTINELLE_SECRET_KEY=xxx
CLEANUP_SECRET_KEY=xxx

# Email (Si utilisé pour vérification)
SMTP_HOST=xxx
SMTP_PORT=xxx
SMTP_USER=xxx
SMTP_PASSWORD=xxx
```

**⚠️ IMPORTANT :**
- Utilisez les valeurs de **PRODUCTION** (pas de localhost)
- Vérifiez que `NEXT_PUBLIC_SITE_URL` correspond à votre domaine Netlify
- Gardez les clés secrètes en sécurité

### Étape 3 : Configurer le Domaine

1. Allez dans Site Settings > Domain Management
2. Ajoutez votre domaine personnalisé (ex: `redzone.be`)
3. Configurez les DNS selon les instructions Netlify

### Étape 4 : Configurer les Headers de Sécurité

Créez un fichier `netlify.toml` à la racine :

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com;"

[[headers]]
  for = "/api/*"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
```

### Étape 5 : Configurer les Redirections

Dans `netlify.toml` :

```toml
[[redirects]]
  from = "/admin/dashboard"
  to = "/admin?tab=dashboard"
  status = 301

[[redirects]]
  from = "/admin/moderation"
  to = "/admin?tab=moderation"
  status = 301
```

---

## 🔒 SÉCURITÉ PRODUCTION

### 1. Vérifier les Variables d'Environnement

**Variables à NE JAMAIS exposer :**
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (si utilisée)
- ❌ `SENTINELLE_SECRET_KEY` (utilisée uniquement par les cron jobs)
- ❌ `CLEANUP_SECRET_KEY` (utilisée uniquement par les cron jobs)
- ❌ `SMTP_PASSWORD`

**Variables publiques (OK) :**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `NEXT_PUBLIC_SITE_URL`
- ✅ `NEXT_PUBLIC_TURNSTILE_SITE_KEY`

### 2. Vérifier les Routes Publiques

**Routes qui doivent être publiques :**
- ✅ `/` (homepage)
- ✅ `/search`
- ✅ `/cars/[id]`
- ✅ `/tribune`
- ✅ `/recits`
- ✅ `/garage/[userId]`
- ✅ `/login`
- ✅ `/register`
- ✅ `/legal/*`

**Routes qui doivent être protégées :**
- ✅ `/dashboard`
- ✅ `/favorites`
- ✅ `/sell`
- ✅ `/admin/*`

### 3. Vérifier RLS dans Supabase

Exécutez `supabase/verify_rls_policies.sql` et vérifiez qu'il n'y a pas de warnings.

---

## 🧪 TESTS POST-DÉPLOIEMENT

### Test 1 : Accès Public
1. Visitez `https://votre-site.netlify.app`
2. Vérifiez que la page d'accueil s'affiche
3. Vérifiez que la recherche fonctionne
4. Vérifiez qu'une annonce peut être consultée

### Test 2 : Inscription
1. Créez un compte test
2. Vérifiez que l'email de confirmation est envoyé
3. Vérifiez que le badge "Membre Fondateur" est attribué (si < 500)
4. Vérifiez que vous pouvez vous connecter

### Test 3 : Publication d'Annonce
1. Connectez-vous
2. Allez sur `/sell`
3. Publiez une annonce de test
4. Vérifiez qu'elle apparaît en statut "pending"

### Test 4 : Accès Admin
1. Connectez-vous avec votre compte admin
2. Vérifiez que vous pouvez accéder à `/admin`
3. Vérifiez que vous pouvez valider/rejeter des annonces
4. Vérifiez que toutes les sections sont accessibles

### Test 5 : Accès Modérateur
1. Connectez-vous avec le compte modérateur
2. Vérifiez que vous pouvez accéder à `/admin`
3. Vérifiez que vous pouvez modérer
4. Vérifiez que vous NE pouvez PAS accéder aux sections admin-only

### Test 6 : Communication
1. Créez deux comptes (acheteur et vendeur)
2. Publiez une annonce avec le compte vendeur
3. Connectez-vous avec le compte acheteur
4. Consultez l'annonce
5. Contactez le vendeur (email, WhatsApp, messages)
6. Vérifiez que la conversation est créée
7. Vérifiez que les notifications fonctionnent

---

## 📊 MONITORING POST-DÉPLOIEMENT

### 1. Vérifier les Logs

**Dans Netlify :**
- Allez dans Site > Functions > Logs
- Vérifiez qu'il n'y a pas d'erreurs

**Dans Supabase :**
- Allez dans Logs > Postgres Logs
- Vérifiez qu'il n'y a pas d'erreurs SQL

### 2. Vérifier les Cron Jobs

**Vercel Cron (si utilisé) :**
- Vérifiez que les cron jobs sont actifs
- Vérifiez les logs d'exécution

**Supabase Cron (si utilisé) :**
- Vérifiez que les cron jobs sont configurés
- Vérifiez les logs d'exécution

### 3. Vérifier les Performances

- Utilisez Google PageSpeed Insights
- Vérifiez les Core Web Vitals
- Vérifiez le temps de chargement

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
- Vérifiez que les clés secrètes sont configurées
- Vérifiez que les routes API sont accessibles
- Vérifiez les logs dans Netlify/Vercel

---

## ✅ CHECKLIST FINALE

Avant de considérer le déploiement comme terminé :

- [ ] Toutes les variables d'environnement sont configurées
- [ ] Le système des 500 premiers membres fondateurs est implémenté
- [ ] Les données de test sont nettoyées
- [ ] Les comptes admin et modérateur sont créés
- [ ] Tous les tests post-déploiement passent
- [ ] Les logs ne montrent pas d'erreurs
- [ ] Les performances sont acceptables
- [ ] Le site est accessible publiquement
- [ ] Les fonctionnalités principales fonctionnent

---

**Statut :** ⚠️ **EN ATTENTE DES ACTIONS CRITIQUES**  
**Prochaines étapes :** Exécuter les scripts SQL et configurer Netlify

