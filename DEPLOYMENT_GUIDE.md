# 🚀 Guide de Déploiement RedZone - Vercel

## 📋 Prérequis

- ✅ Compte GitHub (gratuit)
- ✅ Compte Vercel (gratuit)
- ✅ Compte Supabase (gratuit jusqu'à 500 MB)
- ✅ Projet buildé avec succès (`npm run build`)

---

## 🔐 ÉTAPE 1 : Préparation Supabase (Base de Données)

### 1.1. Vérifier votre projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre projet RedZone
3. Notez ces informations (vous en aurez besoin) :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **Anon Key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (⚠️ SECRET)

### 1.2. Exécuter les migrations SQL

Dans l'interface Supabase → **SQL Editor**, exécutez dans l'ordre :

1. `supabase/create_articles_table.sql`
2. `supabase/create_comments_table.sql`
3. `supabase/create_app_logs_table.sql`
4. `supabase/create_model_specs_db_table.sql`
5. `supabase/add_advanced_filters.sql`
6. `supabase/add_location_fields.sql`
7. `supabase/extend_articles_for_ugc.sql`
8. `supabase/add_professional_roles.sql`
9. `supabase/admin_extensions.sql`

**💡 Astuce** : Vérifiez que toutes les tables existent dans **Table Editor**.

### 1.3. Configurer les Storage Buckets

1. Allez dans **Storage** → **Buckets**
2. Créez un bucket nommé `files` (public)
3. Configurez les politiques RLS si nécessaire

### 1.4. Vérifier les RLS (Row Level Security)

Assurez-vous que les politiques RLS sont actives sur toutes les tables sensibles.

---

## 📦 ÉTAPE 2 : Préparer le Code (GitHub)

### 2.1. Créer un dépôt GitHub

```bash
# Dans votre terminal, à la racine du projet
git init
git add .
git commit -m "Initial commit - RedZone ready for production"

# Créez un nouveau dépôt sur GitHub, puis :
git remote add origin https://github.com/VOTRE_USERNAME/redzone.git
git branch -M main
git push -u origin main
```

### 2.2. Créer un fichier `.gitignore` (si absent)

Assurez-vous que `.gitignore` contient :

```
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local
.env

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

---

## 🌐 ÉTAPE 3 : Déploiement sur Vercel

### 3.1. Créer un compte Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **Sign Up**
3. Connectez-vous avec votre compte **GitHub**

### 3.2. Importer le projet

1. Dans le dashboard Vercel, cliquez sur **Add New...** → **Project**
2. Sélectionnez votre dépôt GitHub `redzone`
3. Vercel détectera automatiquement Next.js

### 3.3. Configurer les variables d'environnement

**⚠️ CRITIQUE** : Avant de déployer, configurez ces variables dans **Settings** → **Environment Variables** :

#### Variables Publiques (NEXT_PUBLIC_*)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_SITE_URL` | URL de votre site (après déploiement) | `https://redzone.vercel.app` |

#### Variables Secrètes (Optionnelles - pour scripts admin)

| Variable | Description | Quand l'utiliser |
|----------|-------------|------------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase | Uniquement si vous avez des scripts admin qui nécessitent de bypasser RLS |

**🔒 Sécurité** :
- ✅ Les variables `NEXT_PUBLIC_*` sont accessibles côté client (c'est normal)
- ✅ **NE JAMAIS** exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
- ✅ Utilisez `SUPABASE_SERVICE_ROLE_KEY` uniquement dans des API routes server-side

### 3.4. Configurer le Build

Vercel détecte automatiquement Next.js, mais vérifiez :

- **Framework Preset** : `Next.js`
- **Build Command** : `npm run build` (par défaut)
- **Output Directory** : `.next` (par défaut)
- **Install Command** : `npm install` (par défaut)

### 3.5. Déployer

1. Cliquez sur **Deploy**
2. Attendez 2-3 minutes
3. Votre site sera disponible sur `https://redzone-xxxxx.vercel.app`

---

## ✅ ÉTAPE 4 : Configuration Post-Déploiement

### 4.1. Mettre à jour NEXT_PUBLIC_SITE_URL

1. Dans Vercel → **Settings** → **Environment Variables**
2. Mettez à jour `NEXT_PUBLIC_SITE_URL` avec l'URL réelle de votre site
3. Redéployez (Vercel le fait automatiquement)

### 4.2. Configurer un domaine personnalisé (Optionnel)

1. Dans Vercel → **Settings** → **Domains**
2. Ajoutez votre domaine (ex: `redzone.be`)
3. Suivez les instructions DNS
4. Vercel génère un certificat SSL automatiquement

### 4.3. Configurer Supabase pour la production

Dans Supabase → **Settings** → **API** :

1. Ajoutez votre URL Vercel dans **Site URL** : `https://redzone.vercel.app`
2. Ajoutez les **Redirect URLs** :
   - `https://redzone.vercel.app/auth/callback`
   - `https://redzone.vercel.app/login`

---

## 🔒 ÉTAPE 5 : Sécurité et Vérifications

### 5.1. Vérifier les variables d'environnement

✅ Toutes les variables `NEXT_PUBLIC_*` sont définies  
✅ Aucune clé secrète n'est exposée côté client  
✅ Les variables sont définies pour **Production**, **Preview**, et **Development**

### 5.2. Tester l'authentification

1. Allez sur `https://votre-site.vercel.app/login`
2. Créez un compte de test
3. Vérifiez que la connexion fonctionne
4. Testez la déconnexion

### 5.3. Tester les routes protégées

1. Essayez d'accéder à `/dashboard` sans être connecté → doit rediriger vers `/login`
2. Connectez-vous et accédez à `/dashboard` → doit fonctionner
3. Testez `/admin/dashboard` sans être admin → doit rediriger vers `/`

### 5.4. Vérifier les fonctionnalités principales

- ✅ Page d'accueil charge correctement
- ✅ Recherche fonctionne
- ✅ Affichage des annonces
- ✅ Formulaire de vente
- ✅ Upload d'images (Storage Supabase)

---

## 🚨 ÉTAPE 6 : Monitoring et Maintenance

### 6.1. Activer les logs Vercel

1. Dans Vercel → **Deployments** → Cliquez sur un déploiement
2. Onglet **Functions** pour voir les logs server-side
3. Onglet **Logs** pour les erreurs

### 6.2. Surveiller Supabase

1. Dashboard Supabase → **Logs** pour voir les requêtes
2. **Database** → **Table Editor** pour vérifier les données
3. **Storage** pour vérifier les uploads

### 6.3. Configurer les alertes (Optionnel)

- Vercel envoie des emails en cas d'échec de déploiement
- Supabase peut envoyer des alertes si la base dépasse les limites

---

## 📝 Checklist Finale

Avant de considérer le déploiement comme terminé :

- [ ] Toutes les migrations SQL sont exécutées
- [ ] Toutes les variables d'environnement sont configurées
- [ ] Le build passe sans erreur (`npm run build`)
- [ ] Le site est accessible sur Vercel
- [ ] L'authentification fonctionne
- [ ] Les routes protégées sont sécurisées
- [ ] Les images s'uploadent correctement
- [ ] Le formulaire de vente fonctionne
- [ ] Le responsive mobile fonctionne
- [ ] Les logs sont accessibles

---

## 🔄 Mises à jour Futures

Pour mettre à jour le site après déploiement :

```bash
# 1. Faire vos modifications localement
git add .
git commit -m "Description des changements"
git push origin main

# 2. Vercel déploie automatiquement !
```

Vercel détecte automatiquement les push sur `main` et redéploie.

---

## 🆘 Dépannage

### Erreur : "Failed to fetch" ou erreurs Supabase

**Cause** : Variables d'environnement manquantes ou incorrectes  
**Solution** : Vérifiez dans Vercel → Settings → Environment Variables

### Erreur : "Unauthorized" sur les routes admin

**Cause** : RLS Supabase trop restrictif ou rôle utilisateur incorrect  
**Solution** : Vérifiez les politiques RLS et le rôle dans la table `profiles`

### Images ne s'affichent pas

**Cause** : Bucket Supabase non configuré ou URL incorrecte  
**Solution** : Vérifiez que le bucket `files` existe et est public

### Build échoue sur Vercel

**Cause** : Erreur TypeScript ou dépendance manquante  
**Solution** : Vérifiez les logs de build dans Vercel, testez localement avec `npm run build`

---

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## ✨ Félicitations !

Votre site RedZone est maintenant en ligne et prêt à accueillir vos utilisateurs ! 🎉

