# 🔑 GUIDE POUR OBTENIR LES CLÉS MANQUANTES
**RedZone - Où trouver/générer les clés nécessaires**

---

## 1. 🔵 NEXT_PUBLIC_TURNSTILE_SITE_KEY (Cloudflare Turnstile)

### Qu'est-ce que c'est ?
Cloudflare Turnstile est un service de protection anti-bot pour les formulaires (utilisé sur `/sell`).

### Comment l'obtenir ?

#### Étape 1 : Créer un compte Cloudflare (si vous n'en avez pas)
1. Allez sur [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Créez un compte gratuit

#### Étape 2 : Accéder à Turnstile
1. Connectez-vous à votre dashboard Cloudflare
2. Allez dans **Security** > **Turnstile** (ou directement [https://dash.cloudflare.com/?to=/:account/turnstile](https://dash.cloudflare.com/?to=/:account/turnstile))

#### Étape 3 : Créer un site
1. Cliquez sur **"Add Site"** ou **"Create"**
2. Remplissez :
   - **Site name** : `RedZone` (ou le nom de votre choix)
   - **Domain** : Votre domaine Netlify (ex: `redzone.netlify.app`)
   - **Widget mode** : `Managed` (recommandé)
3. Cliquez sur **"Create"**

#### Étape 4 : Récupérer les clés
Après la création, vous verrez :
- **Site Key** (clé publique) → C'est votre `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- **Secret Key** (clé secrète) → **NE PAS** mettre dans `.env.local` (utilisée uniquement côté serveur si nécessaire)

**Exemple :**
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAABkMYinukE1nzBx
```

**⚠️ Note :** Pour le développement local, vous pouvez utiliser la clé de test :
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```
Mais en production, utilisez votre vraie clé Cloudflare.

---

## 2. 🔐 SENTINELLE_SECRET_KEY (Clé secrète à générer)

### Qu'est-ce que c'est ?
Une clé secrète que vous créez vous-même pour protéger l'endpoint `/api/sentinelle/check` contre les accès non autorisés.

### Comment la générer ?

#### Option 1 : En ligne de commande (Linux/Mac)
```bash
openssl rand -hex 32
```

#### Option 2 : En ligne de commande (Windows PowerShell)
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

#### Option 3 : Générateur en ligne
- Allez sur [https://randomkeygen.com/](https://randomkeygen.com/)
- Utilisez "CodeIgniter Encryption Keys" (64 caractères)
- Ou "Fort Knox Password" (32+ caractères)

#### Option 4 : Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Exemple de clé générée :**
```env
SENTINELLE_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**⚠️ Important :**
- La clé doit faire au moins **32 caractères**
- Utilisez des caractères aléatoires (pas de mots de passe simples)
- Gardez cette clé secrète (ne la partagez pas)

---

## 3. 🔐 CLEANUP_SECRET_KEY (Clé secrète à générer)

### Qu'est-ce que c'est ?
Une clé secrète que vous créez vous-même pour protéger l'endpoint `/api/cleanup-expired-data` contre les accès non autorisés.

### Comment la générer ?

**Même méthode que pour `SENTINELLE_SECRET_KEY`** (voir section 2 ci-dessus).

**⚠️ Important :**
- La clé doit être **différente** de `SENTINELLE_SECRET_KEY`
- La clé doit faire au moins **32 caractères**
- Utilisez des caractères aléatoires

**Exemple de clé générée :**
```env
CLEANUP_SECRET_KEY=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8t7
```

---

## 📝 RÉSUMÉ - Configuration Complète

Une fois que vous avez toutes les clés, votre `.env.local` devrait ressembler à :

```env
# Supabase (OBLIGATOIRE)
NEXT_PUBLIC_SUPABASE_URL=https://ehjkapbqofperdtycykb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Site URL (OBLIGATOIRE pour production)
NEXT_PUBLIC_SITE_URL=https://votre-site.netlify.app

# Cloudflare Turnstile (RECOMMANDÉ)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAABkMYinukE1nzBx

# Clés secrètes pour cron jobs (RECOMMANDÉ)
SENTINELLE_SECRET_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
CLEANUP_SECRET_KEY=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8t7

# ⚠️ NE PAS INCLURE :
# SUPABASE_SERVICE_ROLE_KEY (trop sensible)
```

---

## ✅ VÉRIFICATION

Après avoir ajouté toutes les clés, exécutez :

```bash
npm run verify-env
```

Le script devrait maintenant passer sans erreur (seulement des avertissements si certaines variables optionnelles manquent).

---

## 🚀 CONFIGURATION NETLIFY

**N'oubliez pas :** Après avoir configuré votre `.env.local`, vous devez aussi configurer les **mêmes variables** dans Netlify Dashboard :

1. Allez dans **Site Settings** > **Environment Variables**
2. Ajoutez toutes les variables de votre `.env.local`
3. **Important :** Utilisez les mêmes valeurs (sauf `NEXT_PUBLIC_SITE_URL` qui doit être votre URL Netlify)

---

## 💡 CONSEILS

### Pour le développement local :
- Vous pouvez utiliser la clé Turnstile de test : `1x00000000000000000000AA`
- Les clés secrètes peuvent être des valeurs de test courtes (mais changez-les en production)

### Pour la production :
- Utilisez votre vraie clé Turnstile Cloudflare
- Utilisez des clés secrètes longues et aléatoires (32+ caractères)
- Ne partagez jamais vos clés secrètes

---

**Besoin d'aide ?** Consultez `GUIDE_DEPLOIEMENT_FINAL.md` pour plus de détails.

