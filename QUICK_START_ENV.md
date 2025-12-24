# ⚡ GUIDE RAPIDE - Configuration .env.local

## 🎯 **ACTION IMMÉDIATE**

Pour nettoyer votre `.env.local` et vous concentrer sur le développement local, gardez **uniquement ces 4 variables** :

```env
# ============================================
# REDZONE - Configuration Locale (Minimum)
# ============================================

# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key (Pour scripts de test)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL du site (Local)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🗑️ **SUPPRIMEZ CES VARIABLES** (Pas nécessaires en local)

- ❌ `RESEND_API_KEY` → Les emails fonctionnent en mode simulation
- ❌ `NEXT_PUBLIC_TURNSTILE_SITE_KEY` → Clé de test par défaut
- ❌ `ADMIN_EMAIL` → Fallback dans le code

## ✅ **VÉRIFICATION**

1. Ouvrez votre `.env.local`
2. Gardez uniquement les 4 variables ci-dessus
3. Supprimez les autres
4. Redémarrez le serveur : `npm run dev`

## 📚 **DOCUMENTATION COMPLÈTE**

- **`ENV_LOCAL_SETUP.md`** → Guide détaillé pour le développement local
- **`ENV_NETLIFY_SETUP.md`** → Guide pour configurer Netlify (plus tard)
- **`ENV_AUDIT.md`** → Audit complet de toutes les variables

## 🔄 **PROCHAINES ÉTAPES**

1. ✅ Nettoyez votre `.env.local` (4 variables)
2. ✅ Testez que tout fonctionne en local
3. ⏳ Plus tard : Configurez Netlify avec `ENV_NETLIFY_SETUP.md`

