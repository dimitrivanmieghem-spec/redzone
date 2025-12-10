# 🚀 Déploiement Automatique RedZone

## ⚡ Déploiement en UNE commande

```bash
npm run auto-deploy
```

**C'est tout !** Le script va :
- ✅ Vérifier tous les prérequis
- ✅ Installer les dépendances si nécessaire
- ✅ Initialiser Git si nécessaire
- ✅ Vérifier que le build passe
- ✅ Vous guider pour les étapes manuelles (Vercel, Supabase)
- ✅ Pousser vers GitHub si configuré

---

## 📋 Ce qui est automatisé

### ✅ Automatique (fait par le script)
- Vérification des prérequis (Node.js, npm, Git)
- Installation des dépendances
- Initialisation Git
- Vérification du build
- Commit automatique des changements
- Push vers GitHub (si remote configuré)

### ⏳ Manuel (le script vous guide)
- Création du dépôt GitHub (1 clic)
- Configuration Vercel (5 min)
- Exécution des migrations Supabase (10 min)
- Configuration des variables d'environnement

---

## 🎯 Utilisation

### Première fois

```bash
# 1. Lancer le script
npm run auto-deploy

# 2. Suivre les instructions affichées
# Le script vous dira exactement quoi faire pour chaque étape manuelle
```

### Déploiements suivants

```bash
# Juste cette commande, tout le reste est automatique !
npm run auto-deploy
```

---

## 🔄 Workflow Complet

```
┌─────────────────────────────────────────────────────────┐
│  npm run auto-deploy                                     │
│                                                          │
│  ✅ Vérifie prérequis                                    │
│  ✅ Installe dépendances                                 │
│  ✅ Vérifie le build                                     │
│  ✅ Commit automatique                                    │
│  ✅ Push vers GitHub                                     │
│                                                          │
│  📋 Affiche instructions pour :                          │
│     • Configuration Vercel                               │
│     • Migrations Supabase                                │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Vous suivez les instructions (5-10 min)               │
│                                                          │
│  • Créer dépôt GitHub (1 clic)                          │
│  • Configurer Vercel (5 min)                             │
│  • Exécuter migrations SQL (10 min)                     │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  🎉 Site en ligne !                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🆘 Dépannage

### Erreur : "tsx not found"

```bash
npm install
```

### Erreur : "Build failed"

Le script s'arrêtera et vous montrera les erreurs. Corrigez-les et relancez.

### Erreur : "Git remote not found"

Le script vous guidera pour configurer le remote GitHub.

---

## 📚 Documentation Complète

- **QUICK_START_DEPLOY.md** - Guide rapide (5 min)
- **AUTOMATED_DEPLOYMENT.md** - Automatisation complète avec GitHub Actions
- **DEPLOYMENT_GUIDE.md** - Guide détaillé étape par étape

---

## ✨ Avantages

1. **Simplicité** : Une seule commande
2. **Sécurité** : Vérifications automatiques avant déploiement
3. **Guidage** : Instructions claires pour les étapes manuelles
4. **Rapidité** : Automatise tout ce qui peut l'être
5. **Fiabilité** : Moins d'erreurs humaines

---

**🎉 Lancez `npm run auto-deploy` et suivez les instructions !**

