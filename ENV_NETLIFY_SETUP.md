# 🌐 CONFIGURATION NETLIFY - PRODUCTION

## 📋 **OBJECTIF**

Ce guide vous explique comment configurer les variables d'environnement dans Netlify pour votre site en production (https://redzone2.netlify.app).

**⚠️ IMPORTANT** : Ne configurez Netlify que lorsque votre site est **100% fonctionnel en local**.

---

## 🎯 **VARIABLES OBLIGATOIRES (Minimum pour Production)**

Ces variables sont **essentielles** pour que le site fonctionne en production :

### 1. `NEXT_PUBLIC_SUPABASE_URL`
- **Valeur** : Votre URL Supabase (ex: `https://abcdefgh.supabase.co`)
- **Où trouver** : Dashboard Supabase → Settings → API → Project URL

### 2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Valeur** : Votre clé Anon publique (commence par `eyJ...`)
- **Où trouver** : Dashboard Supabase → Settings → API → Anon (public) key

### 3. `NEXT_PUBLIC_SITE_URL`
- **Valeur** : `https://redzone2.netlify.app` (votre URL Netlify)
- **Utilité** : Pour les redirections d'email et les métadonnées Open Graph

---

## ⚙️ **VARIABLES OPTIONNELLES (Fonctionnalités avancées)**

Ces variables activent des fonctionnalités supplémentaires :

### 4. `SUPABASE_SERVICE_ROLE_KEY` (Optionnel)
- **Valeur** : Votre clé Service Role (commence par `eyJ...`)
- **Où trouver** : Dashboard Supabase → Settings → API → Service Role (secret) key
- **⚠️ SÉCURITÉ** : Cette clé est critique. Ne l'utilisez que dans des Server Actions sécurisées.
- **Quand l'ajouter** : Si vous avez des Server Actions qui nécessitent un accès admin

### 5. `RESEND_API_KEY` (Optionnel)
- **Valeur** : Votre clé API Resend (commence par `re_...`)
- **Où trouver** : [Dashboard Resend](https://resend.com/api-keys)
- **Utilité** : Pour envoyer de vrais emails (vérification, tickets support)
- **Quand l'ajouter** : Si vous voulez activer l'envoi d'emails en production

### 6. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Optionnel)
- **Valeur** : Votre clé publique Turnstile
- **Où trouver** : [Cloudflare Turnstile Dashboard](https://www.cloudflare.com/products/turnstile/)
- **Utilité** : CAPTCHA réel sur le formulaire de vente (anti-spam)
- **Quand l'ajouter** : Si vous voulez un CAPTCHA réel (au lieu de la clé de test)

### 7. `ADMIN_EMAIL` (Optionnel)
- **Valeur** : `dimitri.vanmieghem@gmail.com` (ou votre email)
- **Utilité** : Email pour recevoir les tickets de support
- **Quand l'ajouter** : Si vous voulez personnaliser l'email (fallback: `dimitri@gmail.com`)

---

## 📝 **CONFIGURATION DANS NETLIFY**

### **Étape 1 : Accéder aux Variables d'Environnement**

1. Allez sur [Netlify Dashboard](https://app.netlify.com)
2. Sélectionnez votre site (`redzone2`)
3. **Site settings** → **Environment variables**

### **Étape 2 : Ajouter les Variables**

Cliquez sur **"Add a variable"** et ajoutez une par une :

#### **Minimum Requis (3 variables) :**

```
NEXT_PUBLIC_SUPABASE_URL = https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL = https://redzone2.netlify.app
```

#### **Recommandé (4 variables) :**

```
NEXT_PUBLIC_SUPABASE_URL = https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL = https://redzone2.netlify.app
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Complet (Toutes les fonctionnalités) :**

```
NEXT_PUBLIC_SUPABASE_URL = https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL = https://redzone2.netlify.app
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY = re_votre-clé-resend
NEXT_PUBLIC_TURNSTILE_SITE_KEY = votre-clé-turnstile
ADMIN_EMAIL = dimitri.vanmieghem@gmail.com
```

### **Étape 3 : Déployer**

Après avoir ajouté les variables :

1. **Trigger a new deploy** (ou poussez un commit)
2. Netlify va reconstruire le site avec les nouvelles variables
3. Vérifiez que le site fonctionne : https://redzone2.netlify.app

---

## 🔒 **SÉCURITÉ - RÈGLES D'OR**

### ✅ **Sécurisées (Peuvent être publiques)**
- `NEXT_PUBLIC_SUPABASE_URL` - URL publique
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clé publique (protégée par RLS)
- `NEXT_PUBLIC_SITE_URL` - URL publique
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Clé publique CAPTCHA

### 🔴 **Critiques (Ne JAMAIS exposer au client)**
- `SUPABASE_SERVICE_ROLE_KEY` - ⚠️ **TRÈS DANGEREUSE** si compromise
- `RESEND_API_KEY` - ⚠️ Permet d'envoyer des emails

### 📋 **Checklist Sécurité**

- [ ] ✅ Aucune clé sensible n'a le préfixe `NEXT_PUBLIC_` (sauf celles conçues pour être publiques)
- [ ] ✅ `SUPABASE_SERVICE_ROLE_KEY` n'est utilisée que dans des Server Actions sécurisées
- [ ] ✅ `RESEND_API_KEY` n'est jamais exposée au client
- [ ] ✅ Les variables sont stockées uniquement dans Netlify (pas dans le code)

---

## 🔄 **SÉPARATION LOCAL vs PRODUCTION**

### **Local (.env.local)**
```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### **Production (Netlify)**
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://redzone2.netlify.app
RESEND_API_KEY=re_...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
ADMIN_EMAIL=dimitri.vanmieghem@gmail.com
```

**Note** : Les mêmes clés Supabase peuvent être utilisées en local et en production (c'est normal).

---

## ✅ **VÉRIFICATION POST-DÉPLOIEMENT**

Après avoir configuré Netlify, vérifiez que :

1. ✅ Le site se charge : https://redzone2.netlify.app
2. ✅ La connexion fonctionne (essayez de vous connecter)
3. ✅ Les redirections fonctionnent (après inscription, etc.)
4. ✅ Les emails sont envoyés (si `RESEND_API_KEY` est configurée)
5. ✅ Le CAPTCHA fonctionne (si `NEXT_PUBLIC_TURNSTILE_SITE_KEY` est configurée)

---

## 🐛 **DÉPANNAGE**

### **Le site ne se charge pas**
- Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont correctes
- Vérifiez les logs de build dans Netlify

### **Les redirections ne fonctionnent pas**
- Vérifiez que `NEXT_PUBLIC_SITE_URL` est bien `https://redzone2.netlify.app` (pas `http://localhost:3000`)

### **Les emails ne sont pas envoyés**
- Vérifiez que `RESEND_API_KEY` est configurée dans Netlify
- Vérifiez les logs Resend dans le dashboard

### **Le CAPTCHA ne fonctionne pas**
- Vérifiez que `NEXT_PUBLIC_TURNSTILE_SITE_KEY` est configurée
- Vérifiez que la clé correspond au domaine `redzone2.netlify.app`

---

## 📚 **RESSOURCES**

- [Documentation Netlify - Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Documentation Supabase - API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Documentation Resend - API Keys](https://resend.com/docs/api-reference/introduction)
- [Documentation Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)

