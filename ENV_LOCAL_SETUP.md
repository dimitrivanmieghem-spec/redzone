# 🏠 CONFIGURATION .env.local - DÉVELOPPEMENT LOCAL

## 📋 **OBJECTIF**

Ce guide vous permet de configurer un `.env.local` **minimal et propre** pour le développement local uniquement. Les variables pour la production (Netlify) seront configurées directement dans le dashboard Netlify plus tard.

---

## ✅ **VERSION MINIMALE (Recommandée pour Local)**

Créez ou modifiez votre fichier `.env.local` à la racine du projet avec **uniquement** ces 4 variables :

```env
# ============================================
# REDZONE - Configuration Locale (Minimum)
# ============================================

# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (Pour scripts de test uniquement)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL du site (Pour redirections locales)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Total : 4 variables** ✅

---

## 🗑️ **VARIABLES À SUPPRIMER (Pour le développement local)**

Ces variables ne sont **pas nécessaires** en développement local. Supprimez-les de votre `.env.local` :

### ❌ **Variables à supprimer :**

1. **`RESEND_API_KEY`**
   - **Raison** : Les emails fonctionnent en mode simulation en local (pas d'envoi réel)
   - **Quand l'ajouter** : Uniquement en production (Netlify) si vous voulez envoyer de vrais emails

2. **`NEXT_PUBLIC_TURNSTILE_SITE_KEY`**
   - **Raison** : Une clé de test par défaut est utilisée automatiquement
   - **Quand l'ajouter** : Uniquement en production (Netlify) si vous voulez un CAPTCHA réel

3. **`ADMIN_EMAIL`**
   - **Raison** : Un fallback existe dans le code (`admin@octane98.be`)
   - **Quand l'ajouter** : Uniquement si vous voulez personnaliser l'email admin

---

## 📝 **STRUCTURE RECOMMANDÉE**

Votre `.env.local` devrait ressembler à ça :

```env
# ============================================
# REDZONE - Configuration Locale
# ============================================
# Ce fichier est pour le développement LOCAL uniquement
# Les variables de production sont configurées dans Netlify
# ============================================

# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (Pour scripts de test)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL du site (Local)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## ✅ **VÉRIFICATION**

Après avoir nettoyé votre `.env.local`, vérifiez que :

1. ✅ Le site démarre sans erreur : `npm run dev`
2. ✅ La connexion à Supabase fonctionne (essayez de vous connecter)
3. ✅ Les scripts de test fonctionnent : `npx tsx scripts/create-test-users.ts`
4. ✅ Aucune variable inutile n'est présente

---

## 🔄 **REDÉMARRAGE**

Après modification de `.env.local`, **redémarrez toujours le serveur** :

```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
```

---

## 📚 **PROCHAINES ÉTAPES**

Une fois que votre site fonctionne **100% en local**, vous pourrez configurer Netlify pour la production. Voir `ENV_NETLIFY_SETUP.md` pour plus de détails.

---

## ⚠️ **IMPORTANT**

- ✅ `.env.local` est déjà dans `.gitignore` (sécurisé)
- ✅ Ne commitez **JAMAIS** ce fichier
- ✅ Les variables avec `NEXT_PUBLIC_` sont exposées au client (c'est normal)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` ne doit **JAMAIS** avoir le préfixe `NEXT_PUBLIC_`

