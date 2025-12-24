# 🔐 AUDIT DES VARIABLES D'ENVIRONNEMENT - RedZone

## 📋 **RÉSUMÉ EXÉCUTIF**

Ce document liste toutes les variables d'environnement utilisées dans RedZone, leur utilité, leur niveau de sécurité et si elles sont nécessaires en développement local.

---

## ✅ **VARIABLES OBLIGATOIRES** (Minimum requis pour faire fonctionner le site)

### 1. `NEXT_PUBLIC_SUPABASE_URL`
- **Type** : Obligatoire ✅
- **Utilité** : URL de votre projet Supabase (ex: `https://abcdefgh.supabase.co`)
- **Utilisée dans** : Tous les clients Supabase (browser, server, admin)
- **Sécurité** : ⚠️ **PUBLIQUE** - Cette variable est exposée au client (préfixe `NEXT_PUBLIC_`)
- **Risque** : Faible - C'est juste une URL publique
- **Action** : ✅ **GARDER** - Essentiel

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Type** : Obligatoire ✅
- **Utilité** : Clé publique Anon de Supabase (commence par `eyJ...`)
- **Utilisée dans** : Tous les clients Supabase (browser, server)
- **Sécurité** : ⚠️ **PUBLIQUE** - Cette variable est exposée au client (préfixe `NEXT_PUBLIC_`)
- **Risque** : Faible - C'est une clé publique conçue pour être exposée. Elle est protégée par les politiques RLS de Supabase.
- **Action** : ✅ **GARDER** - Essentiel

---

## 🔧 **VARIABLES OPTIONNELLES** (Fonctionnalités avancées)

### 3. `SUPABASE_SERVICE_ROLE_KEY`
- **Type** : Optionnel (uniquement pour scripts admin) ⚙️
- **Utilité** : Clé admin Supabase pour bypasser RLS (création de comptes de test, opérations admin)
- **Utilisée dans** : 
  - `scripts/create-test-users.ts` (création de comptes de test)
  - `src/lib/supabase/admin.ts` (opérations admin)
- **Sécurité** : 🔴 **CRITIQUE** - Cette clé donne accès complet à la base de données (bypass RLS)
- **Risque** : **TRÈS ÉLEVÉ** - Si cette clé est compromise, un attaquant peut :
  - Lire/modifier/supprimer toutes les données
  - Créer/supprimer des utilisateurs
  - Contourner toutes les politiques de sécurité
- **Action** : 
  - ✅ **GARDER** si vous utilisez les scripts de test (`create-test-users.ts`)
  - ⚠️ **NE JAMAIS COMMITER** dans Git (déjà dans `.gitignore`)
  - ⚠️ **NE JAMAIS EXPOSER** au client (pas de `NEXT_PUBLIC_`)
- **Recommandation** : Utilisez-la uniquement en local pour les scripts. En production, utilisez-la uniquement dans des Server Actions sécurisées.

### 4. `NEXT_PUBLIC_SITE_URL`
- **Type** : Optionnel (fallback: `"https://redzone.be"`) ⚙️
- **Utilité** : URL du site pour les redirections d'email et les métadonnées Open Graph
- **Utilisée dans** :
  - `src/app/layout.tsx` (métadonnées Open Graph)
  - `src/app/register/page.tsx` (redirection après inscription)
  - `src/app/cars/[id]/page.tsx` (partage de liens)
- **Sécurité** : ⚠️ **PUBLIQUE** - Exposée au client
- **Risque** : Aucun - C'est juste une URL
- **Action** : 
  - ✅ **GARDER** si vous voulez personnaliser l'URL (ex: `https://redzone2.netlify.app`)
  - ❌ **SUPPRIMER** si vous êtes d'accord avec le fallback `"https://redzone.be"`
- **Valeur recommandée en local** : `http://localhost:3000` ou votre URL Netlify

### 5. `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- **Type** : Optionnel (clé de test par défaut) ⚙️
- **Utilité** : Clé publique Cloudflare Turnstile pour le CAPTCHA sur le formulaire de vente
- **Utilisée dans** : `src/app/sell/page.tsx` (protection anti-spam)
- **Sécurité** : ⚠️ **PUBLIQUE** - Clé publique CAPTCHA (conçue pour être exposée)
- **Risque** : Aucun - C'est une clé publique
- **Action** : 
  - ✅ **GARDER** si vous voulez activer le CAPTCHA réel (obtenez une clé sur [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/))
  - ❌ **SUPPRIMER** si vous êtes d'accord avec la clé de test par défaut (`"1x00000000000000000000AA"`)
- **Note** : La clé de test fonctionne en développement mais ne bloque pas les bots en production.

### 6. `RESEND_API_KEY`
- **Type** : Optionnel (mode simulation si absente) ⚙️
- **Utilité** : Clé API Resend pour envoyer des emails de vérification
- **Utilisée dans** :
  - `src/lib/emailVerification.ts` (vérification email pour annonces invitées)
  - `src/app/actions/tickets.ts` (support tickets)
- **Sécurité** : 🔴 **SENSIBLE** - Clé API privée (ne doit jamais être exposée au client)
- **Risque** : Moyen - Si compromise, un attaquant peut envoyer des emails en votre nom
- **Action** : 
  - ✅ **GARDER** si vous voulez envoyer de vrais emails
  - ❌ **SUPPRIMER** si vous êtes en développement local (le code fonctionne en mode simulation)
- **Note** : En développement, les emails sont simulés (pas d'envoi réel) si cette clé est absente.

### 7. `ADMIN_EMAIL`
- **Type** : Optionnel (fallback: `"dimitri@gmail.com"`) ⚙️
- **Utilité** : Email de l'administrateur pour recevoir les tickets de support
- **Utilisée dans** : `src/app/actions/tickets.ts`
- **Sécurité** : ⚠️ **PUBLIQUE** - Email visible dans le code (fallback)
- **Risque** : Aucun - C'est juste un email
- **Action** : 
  - ✅ **GARDER** si vous voulez personnaliser l'email admin
  - ❌ **SUPPRIMER** si vous êtes d'accord avec `"dimitri@gmail.com"` (déjà dans le code)

---

## 🗑️ **VARIABLES OBSOLÈTES** (À supprimer si présentes)

Aucune variable obsolète détectée dans le code actuel.

---

## 📝 **CONFIGURATION MINIMALE RECOMMANDÉE (Développement Local)**

Pour faire fonctionner le site en local avec toutes les fonctionnalités de base :

```env
# ============================================
# REDZONE - Configuration Minimale (Local)
# ============================================

# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (OPTIONNEL - Uniquement pour scripts de test)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL du site (OPTIONNEL - Fallback: "https://redzone.be")
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Total : 2-4 variables** (selon vos besoins)

---

## 📝 **CONFIGURATION COMPLÈTE (Production)**

Pour activer toutes les fonctionnalités (emails, CAPTCHA, etc.) :

```env
# ============================================
# REDZONE - Configuration Complète
# ============================================

# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (OPTIONNEL - Uniquement pour scripts admin)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL du site (OPTIONNEL)
NEXT_PUBLIC_SITE_URL=https://redzone2.netlify.app

# CAPTCHA Cloudflare Turnstile (OPTIONNEL)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=votre-clé-turnstile

# Email Resend (OPTIONNEL - Pour envoi d'emails)
RESEND_API_KEY=re_votre-clé-resend

# Email Admin (OPTIONNEL)
ADMIN_EMAIL=dimitri.vanmieghem@gmail.com
```

**Total : 2-7 variables** (selon vos besoins)

---

## 🔒 **SÉCURITÉ - RÈGLES D'OR**

### ✅ **SÉCURISÉES** (Peuvent être exposées au client)
- `NEXT_PUBLIC_SUPABASE_URL` - URL publique
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé publique (protégée par RLS)
- `NEXT_PUBLIC_SITE_URL` - URL publique
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Clé publique CAPTCHA

### 🔴 **CRITIQUES** (Ne JAMAIS exposer au client)
- `SUPABASE_SERVICE_ROLE_KEY` - ⚠️ **TRÈS DANGEREUSE** si compromise
- `RESEND_API_KEY` - ⚠️ Permet d'envoyer des emails
- `ADMIN_EMAIL` - ⚠️ Information sensible (mais moins critique)

### 📋 **CHECKLIST SÉCURITÉ**

- [ ] ✅ `.env.local` est dans `.gitignore` (vérifié)
- [ ] ✅ Aucune clé sensible n'a le préfixe `NEXT_PUBLIC_` (sauf celles conçues pour être publiques)
- [ ] ✅ `SUPABASE_SERVICE_ROLE_KEY` n'est utilisée que dans des scripts ou Server Actions
- [ ] ✅ `RESEND_API_KEY` n'est jamais exposée au client
- [ ] ✅ Les clés sont stockées localement uniquement (pas commitées)

---

## 🎯 **RECOMMANDATIONS POUR VOTRE .env.local**

### **En Développement Local :**

**Minimum requis (2 variables)** :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Recommandé (4 variables)** :
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### **Variables à supprimer si vous ne les utilisez pas :**

- ❌ `RESEND_API_KEY` - Si vous ne testez pas l'envoi d'emails
- ❌ `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Si vous êtes d'accord avec la clé de test
- ❌ `ADMIN_EMAIL` - Si vous êtes d'accord avec le fallback `"dimitri@gmail.com"`

---

## 📊 **TABLEAU RÉCAPITULATIF**

| Variable | Obligatoire | Sécurité | Utilisée dans | Peut supprimer ? |
|----------|-------------|----------|---------------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Oui | ⚠️ Publique | Partout | ❌ Non |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Oui | ⚠️ Publique | Partout | ❌ Non |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚙️ Scripts | 🔴 Critique | Scripts admin | ✅ Oui (si pas de scripts) |
| `NEXT_PUBLIC_SITE_URL` | ⚙️ Optionnel | ⚠️ Publique | Layout, Register | ✅ Oui (fallback existe) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ⚙️ Optionnel | ⚠️ Publique | Sell page | ✅ Oui (clé test par défaut) |
| `RESEND_API_KEY` | ⚙️ Optionnel | 🔴 Sensible | Email verification | ✅ Oui (mode simulation) |
| `ADMIN_EMAIL` | ⚙️ Optionnel | ⚠️ Publique | Tickets | ✅ Oui (fallback existe) |

---

## ✅ **CONCLUSION**

**Minimum absolu pour faire fonctionner le site : 2 variables**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Recommandé pour développement local : 4 variables**
- Les 2 ci-dessus +
- `SUPABASE_SERVICE_ROLE_KEY` (pour les scripts de test)
- `NEXT_PUBLIC_SITE_URL` (pour les redirections correctes)

**Toutes les autres variables sont optionnelles** et peuvent être supprimées si vous n'utilisez pas les fonctionnalités correspondantes.

