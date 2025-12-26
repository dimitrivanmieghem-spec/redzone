# 🧹 GUIDE DE NETTOYAGE - .env.local

## 📋 **VOTRE .env.local ACTUEL**

Pour vérifier quelles variables vous avez actuellement, ouvrez votre fichier `.env.local` et comparez avec ce guide.

---

## ✅ **VARIABLES À GARDER (Minimum requis)**

### **1. Obligatoires (2 variables)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Action** : ✅ **GARDER** - Essentiel pour que le site fonctionne

### **2. Recommandées pour développement (2 variables supplémentaires)**
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
**Action** : ✅ **GARDER** si vous utilisez les scripts de test (`create-test-users.ts`)

---

## ⚙️ **VARIABLES OPTIONNELLES (À garder seulement si vous les utilisez)**

### **3. `NEXT_PUBLIC_TURNSTILE_SITE_KEY`**
**Utilité** : CAPTCHA Cloudflare Turnstile sur le formulaire de vente
**Action** : 
- ✅ **GARDER** si vous avez une clé Turnstile réelle
- ❌ **SUPPRIMER** si vous êtes d'accord avec la clé de test par défaut

### **4. `RESEND_API_KEY`**
**Utilité** : Envoi d'emails de vérification (annonces invitées, tickets support)
**Action** : 
- ✅ **GARDER** si vous voulez tester l'envoi d'emails
- ❌ **SUPPRIMER** si vous êtes en développement local (le code fonctionne sans, en mode simulation)

### **5. `ADMIN_EMAIL`**
**Utilité** : Email pour recevoir les tickets de support
**Action** : 
- ✅ **GARDER** si vous voulez personnaliser l'email (actuellement: `admin@octane98.be`)
- ❌ **SUPPRIMER** si vous êtes d'accord avec le fallback dans le code

---

## 🗑️ **VARIABLES À SUPPRIMER (Si présentes)**

### **Variables obsolètes ou inutilisées**
Si vous voyez ces variables dans votre `.env.local`, vous pouvez les supprimer :
- `NEXT_PUBLIC_*` avec des noms différents de ceux listés ci-dessus
- Variables de services non utilisés (ex: `STRIPE_*`, `SENDGRID_*`, etc.)
- Variables de test ou de développement temporaires

---

## 📝 **MODÈLE DE .env.local PROPRE (Développement Local)**

### **Version Minimale (2 variables)**
```env
# ============================================
# REDZONE - Configuration Minimale
# ============================================

# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Version Recommandée (4 variables)**
```env
# ============================================
# REDZONE - Configuration Recommandée (Local)
# ============================================

# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (OPTIONNEL - Pour scripts de test)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL du site (OPTIONNEL - Pour redirections)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### **Version Complète (Toutes les fonctionnalités)**
```env
# ============================================
# REDZONE - Configuration Complète
# ============================================

# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (OPTIONNEL - Pour scripts de test)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL du site (OPTIONNEL)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# CAPTCHA Turnstile (OPTIONNEL - Clé de test par défaut si absente)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=votre-clé-turnstile

# Email Resend (OPTIONNEL - Mode simulation si absente)
RESEND_API_KEY=re_votre-clé-resend

# Email Admin (OPTIONNEL - Fallback: admin@octane98.be)
ADMIN_EMAIL=admin@octane98.be
```

---

## 🔒 **VÉRIFICATIONS DE SÉCURITÉ**

### ✅ **Checklist**

1. **Aucune clé sensible n'a le préfixe `NEXT_PUBLIC_`** (sauf celles conçues pour être publiques)
   - ✅ `NEXT_PUBLIC_SUPABASE_URL` - OK (URL publique)
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - OK (clé publique)
   - ✅ `NEXT_PUBLIC_SITE_URL` - OK (URL publique)
   - ✅ `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - OK (clé publique CAPTCHA)
   - ❌ `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` - ⚠️ **DANGER** (ne doit jamais avoir `NEXT_PUBLIC_`)
   - ❌ `NEXT_PUBLIC_RESEND_API_KEY` - ⚠️ **DANGER** (ne doit jamais avoir `NEXT_PUBLIC_`)

2. **Le fichier `.env.local` est bien dans `.gitignore`** ✅ (vérifié)

3. **Aucune clé n'est commitée dans Git** ✅ (`.env.local` est ignoré)

---

## 🎯 **ACTION RECOMMANDÉE**

### **Pour un développement local propre :**

1. **Gardez uniquement ces 4 variables** :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

2. **Supprimez les autres variables** si vous ne les utilisez pas :
   - `RESEND_API_KEY` (si vous ne testez pas les emails)
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (si vous êtes d'accord avec la clé de test)
   - `ADMIN_EMAIL` (si vous êtes d'accord avec le fallback)

3. **Vérifiez qu'aucune variable sensible n'a le préfixe `NEXT_PUBLIC_`** (sauf celles listées ci-dessus)

---

## 📊 **RÉSUMÉ**

| Variable | Garder ? | Raison |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Oui | Obligatoire |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Oui | Obligatoire |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Oui | Pour scripts de test |
| `NEXT_PUBLIC_SITE_URL` | ✅ Oui | Recommandé |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ⚙️ Optionnel | Clé de test par défaut |
| `RESEND_API_KEY` | ⚙️ Optionnel | Mode simulation si absente |
| `ADMIN_EMAIL` | ⚙️ Optionnel | Fallback dans le code |

**Total recommandé : 4 variables** (2 obligatoires + 2 recommandées)

