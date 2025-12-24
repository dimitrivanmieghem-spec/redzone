# 📋 ACTIONS MANUELLES REQUISES POUR LE DÉPLOIEMENT
**RedZone - Guide des actions manuelles avant et après déploiement**

---

## ⚠️ AVANT LE DÉPLOIEMENT

### 1. Exécuter les Scripts SQL dans Supabase

#### A. Système des 500 Premiers Membres Fondateurs
**Fichier :** `supabase/implement_founder_system.sql`

**Action :**
1. Ouvrez le SQL Editor dans Supabase Dashboard
2. Copiez-collez le contenu de `supabase/implement_founder_system.sql`
3. Exécutez le script
4. Vérifiez qu'il n'y a pas d'erreurs

**Vérification :**
```sql
-- Vérifier que la colonne is_founder existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'is_founder';

-- Vérifier le nombre de membres fondateurs
SELECT COUNT(*) as founder_count 
FROM profiles 
WHERE is_founder = true;
```

---

#### B. Nettoyage des Données de Test
**Fichier :** `supabase/cleanup_test_data.sql`

**⚠️ ATTENTION :** Ce script supprime définitivement les données de test !

**Action :**
1. **FAIRE UNE SAUVEGARDE** de votre base de données avant d'exécuter ce script
2. Ouvrez le SQL Editor dans Supabase Dashboard
3. Copiez-collez le contenu de `supabase/cleanup_test_data.sql`
4. Exécutez le script
5. Vérifiez les résultats dans les messages NOTICE

**Vérification :**
```sql
-- Vérifier qu'il ne reste que les comptes admin et modérateur
SELECT role, COUNT(*) as count, STRING_AGG(email, ', ') as emails
FROM profiles
GROUP BY role
ORDER BY role;

-- Vérifier qu'il n'y a aucune annonce
SELECT COUNT(*) as total_vehicles FROM vehicles;
```

---

#### C. Création des Comptes Admin et Modérateur
**Fichier :** `supabase/create_admin_moderator_accounts.sql`

**Action :**
1. **Créer votre compte admin :**
   - Allez sur `/register` ou créez-le via Supabase Dashboard > Authentication > Users
   - Notez l'email et l'ID utilisateur

2. **Créer le compte modérateur :**
   - Créez le compte pour votre ami modérateur
   - Notez l'email et l'ID utilisateur

3. **Exécuter le script SQL :**
   - Ouvrez le SQL Editor dans Supabase Dashboard
   - Modifiez les lignes avec vos emails/IDs réels :
     ```sql
     -- Remplacez 'votre-email@example.com' par votre email admin
     -- Remplacez 'moderateur-email@example.com' par l'email du modérateur
     ```
   - Exécutez le script

**Vérification :**
```sql
-- Vérifier que les rôles sont correctement attribués
SELECT id, email, role, is_founder 
FROM profiles 
WHERE role IN ('admin', 'moderator');
```

---

### 2. Configurer les Variables d'Environnement dans Netlify

**Dans Netlify Dashboard > Site Settings > Environment Variables, ajoutez :**

#### Variables OBLIGATOIRES :
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# Site URL (remplacez par votre domaine Netlify)
NEXT_PUBLIC_SITE_URL=https://votre-site.netlify.app
```

#### Variables RECOMMANDÉES :
```env
# Cloudflare Turnstile (pour /sell)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=xxx

# Cron Jobs (pour Sentinelle et nettoyage automatique)
SENTINELLE_SECRET_KEY=xxx
CLEANUP_SECRET_KEY=xxx
```

#### Variables OPTIONNELLES :
```env
# Email (si utilisé pour vérification)
SMTP_HOST=xxx
SMTP_PORT=xxx
SMTP_USER=xxx
SMTP_PASSWORD=xxx
```

**⚠️ IMPORTANT :**
- Utilisez les valeurs de **PRODUCTION** (pas de localhost)
- Vérifiez que `NEXT_PUBLIC_SITE_URL` correspond à votre domaine Netlify
- Gardez les clés secrètes en sécurité (ne les partagez pas)

---

### 3. Connecter le Repository à Netlify

**Action :**
1. Allez sur [netlify.com](https://netlify.com)
2. Connectez votre repository GitHub/GitLab
3. Netlify détectera automatiquement Next.js
4. Les paramètres de build sont déjà configurés dans `netlify.toml`

**Vérification :**
- Le build doit se lancer automatiquement
- Vérifiez les logs de build pour détecter les erreurs

---

### 4. Configurer le Domaine (Optionnel)

**Action :**
1. Allez dans Netlify Dashboard > Site Settings > Domain Management
2. Ajoutez votre domaine personnalisé (ex: `redzone.be`)
3. Configurez les DNS selon les instructions Netlify

---

## ✅ APRÈS LE DÉPLOIEMENT

### 1. Tests Post-Déploiement

#### Test 1 : Accès Public
- [ ] Visitez `https://votre-site.netlify.app`
- [ ] Vérifiez que la page d'accueil s'affiche
- [ ] Vérifiez que la recherche fonctionne
- [ ] Vérifiez qu'une annonce peut être consultée

#### Test 2 : Inscription
- [ ] Créez un compte test
- [ ] Vérifiez que le badge "Membre Fondateur" est attribué (si < 500)
- [ ] Vérifiez que vous pouvez vous connecter

#### Test 3 : Publication d'Annonce
- [ ] Connectez-vous
- [ ] Allez sur `/sell`
- [ ] Publiez une annonce de test
- [ ] Vérifiez qu'elle apparaît en statut "pending"

#### Test 4 : Accès Admin
- [ ] Connectez-vous avec votre compte admin
- [ ] Vérifiez que le badge "ADMIN" est visible dans la navbar
- [ ] Cliquez sur le badge pour accéder à `/admin`
- [ ] Vérifiez que vous pouvez valider/rejeter des annonces
- [ ] Vérifiez que toutes les sections sont accessibles

#### Test 5 : Accès Modérateur
- [ ] Connectez-vous avec le compte modérateur
- [ ] Vérifiez que vous pouvez accéder à `/admin`
- [ ] Vérifiez que vous pouvez modérer
- [ ] Vérifiez que vous NE pouvez PAS accéder aux sections admin-only

#### Test 6 : Communication
- [ ] Créez deux comptes (acheteur et vendeur)
- [ ] Publiez une annonce avec le compte vendeur
- [ ] Connectez-vous avec le compte acheteur
- [ ] Consultez l'annonce
- [ ] Contactez le vendeur (email, WhatsApp, messages)
- [ ] Vérifiez que la conversation est créée
- [ ] Vérifiez que les notifications fonctionnent

---

### 2. Vérifier les Logs

**Dans Netlify :**
- Allez dans Site > Functions > Logs
- Vérifiez qu'il n'y a pas d'erreurs

**Dans Supabase :**
- Allez dans Logs > Postgres Logs
- Vérifiez qu'il n'y a pas d'erreurs SQL

---

### 3. Vérifier les Cron Jobs

**Note :** Netlify ne supporte pas nativement les cron jobs comme Vercel. Vous devrez :

**Option 1 : Utiliser un service externe (recommandé)**
- Utilisez [cron-job.org](https://cron-job.org) ou [EasyCron](https://www.easycron.com)
- Configurez des requêtes HTTP vers :
  - `https://votre-site.netlify.app/api/sentinelle/check` (toutes les heures)
  - `https://votre-site.netlify.app/api/cleanup-expired-data` (le 1er de chaque mois)
- Ajoutez l'en-tête `Authorization: Bearer YOUR_SECRET_KEY`

**Option 2 : Utiliser Supabase Cron (si disponible)**
- Configurez les cron jobs directement dans Supabase
- Utilisez les fonctions SQL pour appeler les endpoints

---

### 4. Vérifier les Performances

- [ ] Utilisez Google PageSpeed Insights
- [ ] Vérifiez les Core Web Vitals
- [ ] Vérifiez le temps de chargement

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
- Configurez un service externe (voir section 3 ci-dessus)
- Vérifiez que les clés secrètes sont configurées
- Vérifiez que les routes API sont accessibles

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
- [ ] Les cron jobs sont configurés (si nécessaire)

---

**Statut :** ✅ **PRÊT POUR LE DÉPLOIEMENT**  
**Prochaines étapes :** Exécuter les scripts SQL → Configurer Netlify → Déployer → Tester

