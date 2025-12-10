# 🤖 Déploiement Automatisé RedZone

Ce guide explique comment utiliser les scripts automatisés pour déployer RedZone.

---

## 🚀 Méthode 1 : Déploiement Automatique via GitHub Actions (Recommandé)

### Avantages
- ✅ Déploiement automatique à chaque push sur `main`
- ✅ Tests automatiques avant déploiement
- ✅ Pas besoin de Vercel CLI localement
- ✅ Historique des déploiements dans GitHub

### Configuration (Une seule fois)

#### 1. Obtenir les tokens Vercel

1. Allez sur [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Créez un nouveau token (nommez-le "GitHub Actions")
3. Copiez le token

#### 2. Obtenir l'Org ID et Project ID

```bash
# Installez Vercel CLI (une seule fois)
npm install -g vercel

# Connectez-vous
vercel login

# Liez votre projet
vercel link

# Les IDs seront affichés, ou trouvez-les dans .vercel/project.json
```

#### 3. Configurer les secrets GitHub

1. Allez sur votre dépôt GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Ajoutez ces secrets :

| Secret | Description | Où le trouver |
|--------|-------------|---------------|
| `VERCEL_TOKEN` | Token Vercel | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Organisation ID | `.vercel/project.json` après `vercel link` |
| `VERCEL_PROJECT_ID` | Project ID | `.vercel/project.json` après `vercel link` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase | Dashboard Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme | Dashboard Supabase → Settings → API |
| `NEXT_PUBLIC_SITE_URL` | URL du site | `https://redzone.vercel.app` (après premier déploiement) |

#### 4. Activer GitHub Actions

Le workflow est déjà configuré dans `.github/workflows/deploy.yml`. Il se déclenchera automatiquement à chaque push sur `main`.

### Utilisation

```bash
# 1. Faites vos modifications
git add .
git commit -m "Ma nouvelle fonctionnalité"
git push origin main

# 2. C'est tout ! GitHub Actions déploie automatiquement
```

Vous pouvez suivre le déploiement dans **GitHub** → **Actions**.

---

## 🛠️ Méthode 2 : Déploiement Manuel avec Scripts

### Scripts disponibles

#### 1. Vérification pré-déploiement

```bash
npm run check-deploy
```

Vérifie que tout est prêt :
- ✅ Variables d'environnement
- ✅ .gitignore configuré
- ✅ Scripts package.json
- ✅ Migrations SQL présentes

#### 2. Configuration Vercel CLI (première fois)

```bash
npm run setup-vercel
```

Installe Vercel CLI et lie votre projet.

#### 3. Déploiement complet

```bash
npm run deploy
```

Ce script :
1. ✅ Vérifie la branche (avertit si pas sur `main`)
2. ✅ Vérifie les modifications non commitées
3. ✅ Lance le build
4. ✅ Push vers GitHub
5. ✅ Déploie sur Vercel

---

## 📋 Checklist de Configuration Initiale

### Étape 1 : Supabase (10 min)

- [ ] Exécuter toutes les migrations SQL
- [ ] Créer le bucket `files` (Storage)
- [ ] Noter l'URL et les clés API

### Étape 2 : GitHub (5 min)

- [ ] Créer le dépôt GitHub
- [ ] Pousser le code
- [ ] Configurer les secrets GitHub Actions (si méthode 1)

### Étape 3 : Vercel (5 min)

**Option A - Via Dashboard (Recommandé pour débutants)**
- [ ] Créer un compte Vercel
- [ ] Importer le projet depuis GitHub
- [ ] Configurer les variables d'environnement dans le dashboard

**Option B - Via CLI (Pour utilisateurs avancés)**
- [ ] Exécuter `npm run setup-vercel`
- [ ] Configurer les variables d'environnement via `vercel env add`

### Étape 4 : Premier Déploiement

**Avec GitHub Actions :**
```bash
git push origin main
# Attendre que GitHub Actions termine
```

**Avec script manuel :**
```bash
npm run deploy
```

**Avec Vercel CLI directement :**
```bash
vercel --prod
```

---

## 🔄 Workflow de Déploiement Quotidien

### Développement local

```bash
# 1. Créer une branche pour votre fonctionnalité
git checkout -b feature/ma-fonctionnalite

# 2. Développer et tester
npm run dev

# 3. Vérifier que tout fonctionne
npm run build
npm run check-deploy
```

### Déploiement

```bash
# 1. Commiter vos changements
git add .
git commit -m "Description de la fonctionnalité"

# 2. Pousser vers GitHub
git push origin feature/ma-fonctionnalite

# 3. Créer une Pull Request sur GitHub
# (GitHub Actions déploiera automatiquement une preview)

# 4. Après review, merger dans main
# (GitHub Actions déploiera automatiquement en production)
```

---

## 🚨 Dépannage

### Erreur : "Vercel token not found"

**Solution** : Configurez `VERCEL_TOKEN` dans GitHub Secrets (Méthode 1) ou exécutez `vercel login` (Méthode 2)

### Erreur : "Build failed"

**Solution** :
1. Vérifiez les logs dans GitHub Actions ou Vercel
2. Testez localement : `npm run build`
3. Corrigez les erreurs TypeScript/ESLint

### Erreur : "Environment variables missing"

**Solution** : Vérifiez que toutes les variables sont configurées dans :
- Vercel Dashboard → Settings → Environment Variables
- GitHub Secrets (si vous utilisez GitHub Actions)

### Déploiement ne se déclenche pas automatiquement

**Vérifications** :
1. Le workflow `.github/workflows/deploy.yml` existe
2. Les secrets GitHub sont configurés
3. Vous poussez sur la branche `main`

---

## 📊 Monitoring

### GitHub Actions

- **Où** : GitHub → **Actions** → Voir les workflows
- **Quoi** : Logs de build, tests, déploiement

### Vercel Dashboard

- **Où** : [vercel.com/dashboard](https://vercel.com/dashboard)
- **Quoi** : Déploiements, logs, analytics, domaines

### Supabase Dashboard

- **Où** : [supabase.com/dashboard](https://supabase.com/dashboard)
- **Quoi** : Logs de base de données, storage, authentification

---

## 🎯 Résumé : Déploiement en 3 Commandes

```bash
# 1. Vérifier que tout est prêt
npm run check-deploy

# 2. Commiter et pousser
git add . && git commit -m "Update" && git push origin main

# 3. C'est tout ! (GitHub Actions déploie automatiquement)
```

---

## 🔐 Sécurité

### ✅ Bonnes pratiques

- ✅ Ne jamais commiter `.env.local`
- ✅ Utiliser GitHub Secrets pour les tokens
- ✅ Vérifier les variables d'environnement avant chaque déploiement
- ✅ Activer 2FA sur GitHub et Vercel

### ⚠️ À éviter

- ❌ Commiter des clés API
- ❌ Exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
- ❌ Déployer sans tester le build localement

---

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Supabase Deployment Guide](https://supabase.com/docs/guides/hosting)

---

## ✨ Avantages de l'Automatisation

1. **Rapidité** : Déploiement en quelques secondes
2. **Fiabilité** : Tests automatiques avant déploiement
3. **Traçabilité** : Historique complet des déploiements
4. **Sécurité** : Pas de manipulation manuelle des secrets
5. **Collaboration** : Toute l'équipe peut déployer via Git

---

**🎉 Votre pipeline de déploiement est maintenant automatisé !**

