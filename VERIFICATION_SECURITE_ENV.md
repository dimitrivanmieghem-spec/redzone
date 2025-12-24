# 🔒 VÉRIFICATION DE SÉCURITÉ - VARIABLES D'ENVIRONNEMENT
**RedZone - Checklist de sécurité avant déploiement**

---

## ⚠️ IMPORTANT : CE FICHIER NE DOIT PAS CONTENIR DE VRAIES VALEURS

Ce guide vous aide à vérifier que votre `.env.local` est sécurisé avant le déploiement.

---

## 📋 CHECKLIST DE SÉCURITÉ

### ✅ 1. VÉRIFIER QUE LE FICHIER EST IGNORÉ PAR GIT

**Vérification :**
```bash
# Vérifier que .env.local est dans .gitignore
cat .gitignore | grep .env
```

**Résultat attendu :**
```
.env*
.env.local
.env.development.local
.env.test.local
.env.production.local
```

**⚠️ Si `.env.local` n'est PAS dans `.gitignore` :**
- Ajoutez-le immédiatement
- Vérifiez qu'il n'a jamais été commité : `git log --all --full-history -- .env.local`
- Si commité, changez TOUTES les valeurs sensibles

---

### ✅ 2. VARIABLES OBLIGATOIRES POUR LA PRODUCTION

#### A. Variables Supabase (OBLIGATOIRES)

```env
# ✅ DOIT être présent
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Vérifications :**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` commence par `https://`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` se termine par `.supabase.co` (pas `.supabase.in` pour la prod)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` commence par `eyJ` (JWT)
- [ ] **PAS de `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`** (trop sensible)

**⚠️ PROBLÈMES DE SÉCURITÉ :**
- ❌ URL avec `localhost` ou `127.0.0.1`
- ❌ Clé de test ou placeholder (`your-key-here`, `xxx`, etc.)
- ❌ Service Role Key au lieu d'Anon Key

---

#### B. Site URL (OBLIGATOIRE pour production)

```env
# ✅ DOIT être présent pour la production
NEXT_PUBLIC_SITE_URL=https://votre-site.netlify.app
```

**Vérifications :**
- [ ] `NEXT_PUBLIC_SITE_URL` commence par `https://`
- [ ] `NEXT_PUBLIC_SITE_URL` correspond à votre domaine Netlify
- [ ] **PAS de `localhost:3000`** pour la production

**⚠️ PROBLÈMES DE SÉCURITÉ :**
- ❌ `http://localhost:3000` (doit être HTTPS en production)
- ❌ URL de développement en production

---

### ✅ 3. VARIABLES RECOMMANDÉES

#### A. Cloudflare Turnstile (pour `/sell`)

```env
# ✅ Recommandé pour protéger le formulaire de vente
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAABkMYinukE1nzBx
```

**Vérifications :**
- [ ] Clé commence par `0x` (clé publique)
- [ ] Clé correspond à votre site Cloudflare
- [ ] **PAS de clé secrète** (`TURNSTILE_SECRET_KEY` ne doit PAS être dans `.env.local`)

**⚠️ PROBLÈMES DE SÉCURITÉ :**
- ❌ Clé secrète exposée (doit être uniquement côté serveur)
- ❌ Clé de test en production

---

#### B. Clés Secrètes pour Cron Jobs

```env
# ✅ Recommandé pour sécuriser les cron jobs
SENTINELLE_SECRET_KEY=votre-cle-secrete-aleatoire-ici
CLEANUP_SECRET_KEY=votre-autre-cle-secrete-aleatoire-ici
```

**Vérifications :**
- [ ] Clés sont longues (minimum 32 caractères)
- [ ] Clés sont aléatoires (pas de mots de passe simples)
- [ ] Clés sont différentes l'une de l'autre
- [ ] **PAS de valeurs par défaut** (`test`, `secret`, `123456`, etc.)

**⚠️ PROBLÈMES DE SÉCURITÉ :**
- ❌ Clés courtes ou prévisibles
- ❌ Clés identiques pour les deux endpoints
- ❌ Clés commitées dans le code

**Génération de clés sécurisées :**
```bash
# Linux/Mac
openssl rand -hex 32

# Ou en ligne
# https://randomkeygen.com/
```

---

### ✅ 4. VARIABLES OPTIONNELLES

#### A. Configuration Email (SMTP)

```env
# Optionnel - seulement si vous utilisez l'envoi d'emails
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=votre-email@example.com
SMTP_PASSWORD=votre-mot-de-passe-securise
```

**Vérifications :**
- [ ] `SMTP_PASSWORD` est un mot de passe fort
- [ ] **PAS de mot de passe en clair** si possible (utilisez des secrets managers)
- [ ] Port 587 (TLS) ou 465 (SSL) - pas 25 (non sécurisé)

**⚠️ PROBLÈMES DE SÉCURITÉ :**
- ❌ Mot de passe faible
- ❌ Port 25 (non sécurisé)
- ❌ Credentials exposés

---

## 🚨 VALEURS À NE JAMAIS UTILISER EN PRODUCTION

### ❌ Valeurs de Développement

```env
# ❌ NE JAMAIS utiliser en production
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SENTINELLE_SECRET_KEY=test
CLEANUP_SECRET_KEY=secret
```

### ❌ Placeholders

```env
# ❌ NE JAMAIS utiliser en production
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-ici
SENTINELLE_SECRET_KEY=xxx
```

### ❌ Valeurs de Test

```env
# ❌ NE JAMAIS utiliser en production
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-key-123
SENTINELLE_SECRET_KEY=dev-secret
```

---

## ✅ CHECKLIST COMPLÈTE AVANT DÉPLOIEMENT

### Variables Obligatoires
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - URL de production (https://xxx.supabase.co)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé Anon (commence par eyJ)
- [ ] `NEXT_PUBLIC_SITE_URL` - URL de production (https://votre-site.netlify.app)

### Variables Recommandées
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Clé publique Turnstile
- [ ] `SENTINELLE_SECRET_KEY` - Clé secrète (32+ caractères aléatoires)
- [ ] `CLEANUP_SECRET_KEY` - Clé secrète (32+ caractères aléatoires)

### Variables Optionnelles
- [ ] `SMTP_HOST` - Si envoi d'emails
- [ ] `SMTP_PORT` - 587 ou 465
- [ ] `SMTP_USER` - Email SMTP
- [ ] `SMTP_PASSWORD` - Mot de passe SMTP fort

### Sécurité
- [ ] `.env.local` est dans `.gitignore`
- [ ] Aucune valeur de test ou placeholder
- [ ] Aucune URL localhost
- [ ] Toutes les URLs sont en HTTPS
- [ ] Clés secrètes sont longues et aléatoires
- [ ] Pas de Service Role Key exposée

---

## 🔍 VÉRIFICATION AUTOMATIQUE

### Script de Vérification (à exécuter avant déploiement)

```bash
# Vérifier que .env.local existe
if [ ! -f .env.local ]; then
  echo "❌ ERREUR: .env.local n'existe pas"
  exit 1
fi

# Vérifier que .env.local est dans .gitignore
if ! grep -q ".env.local" .gitignore; then
  echo "❌ ERREUR: .env.local n'est pas dans .gitignore"
  exit 1
fi

# Vérifier les variables obligatoires
if ! grep -q "NEXT_PUBLIC_SUPABASE_URL=https://" .env.local; then
  echo "❌ ERREUR: NEXT_PUBLIC_SUPABASE_URL manquant ou invalide"
  exit 1
fi

if ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ" .env.local; then
  echo "❌ ERREUR: NEXT_PUBLIC_SUPABASE_ANON_KEY manquant ou invalide"
  exit 1
fi

if ! grep -q "NEXT_PUBLIC_SITE_URL=https://" .env.local; then
  echo "⚠️  AVERTISSEMENT: NEXT_PUBLIC_SITE_URL manquant (recommandé pour production)"
fi

# Vérifier qu'il n'y a pas de localhost
if grep -q "localhost" .env.local; then
  echo "❌ ERREUR: localhost détecté dans .env.local (ne pas utiliser en production)"
  exit 1
fi

# Vérifier qu'il n'y a pas de placeholders
if grep -q "votre-projet\|xxx\|test\|secret\|placeholder" .env.local; then
  echo "❌ ERREUR: Placeholders détectés dans .env.local"
  exit 1
fi

echo "✅ Vérification réussie"
```

---

## 📝 EXEMPLE DE .env.local SÉCURISÉ

```env
# RedZone - Configuration Production
# ⚠️ NE JAMAIS COMMITER CE FICHIER

# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDAwMDAwMCwiZXhwIjoxOTU1NTYwMDAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Site URL (OBLIGATOIRE pour production)
NEXT_PUBLIC_SITE_URL=https://redzone.netlify.app

# Cloudflare Turnstile (RECOMMANDÉ)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAABkMYinukE1nzBx

# Clés Secrètes pour Cron Jobs (RECOMMANDÉ)
SENTINELLE_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
CLEANUP_SECRET_KEY=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4

# Email SMTP (OPTIONNEL - seulement si utilisé)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=noreply@redzone.be
# SMTP_PASSWORD=your-secure-password-here
```

---

## 🚨 EN CAS DE PROBLÈME

### Si vous avez commité `.env.local` par erreur :

1. **Changez IMMÉDIATEMENT toutes les valeurs sensibles :**
   - Régénérez les clés Supabase
   - Changez les mots de passe
   - Régénérez les clés secrètes

2. **Supprimez le fichier de l'historique Git :**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env.local" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push (⚠️ Attention : coordonnez avec votre équipe) :**
   ```bash
   git push origin --force --all
   ```

---

## ✅ RÉSUMÉ

**Avant de déployer sur Netlify :**

1. ✅ Vérifiez que `.env.local` est dans `.gitignore`
2. ✅ Vérifiez que toutes les valeurs sont de production (pas de localhost)
3. ✅ Vérifiez que les clés secrètes sont longues et aléatoires
4. ✅ Configurez les mêmes variables dans Netlify Dashboard
5. ✅ **NE COMMITEZ JAMAIS `.env.local`**

---

**Statut :** ⚠️ **VÉRIFIEZ VOTRE `.env.local` AVANT LE DÉPLOIEMENT**  
**Prochaine étape :** Configurer les variables dans Netlify Dashboard

