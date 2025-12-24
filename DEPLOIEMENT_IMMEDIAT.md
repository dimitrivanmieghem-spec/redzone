# 🚀 DÉPLOIEMENT IMMÉDIAT SUR NETLIFY
**RedZone - Guide rapide de déploiement**

---

## ✅ ÉTAT ACTUEL

- ✅ Variables d'environnement vérifiées
- ✅ Build réussi
- ✅ Configuration Netlify prête (`netlify.toml`)

---

## 🚀 OPTION 1 : DÉPLOIEMENT AUTOMATIQUE (Recommandé)

### Si votre repository est déjà connecté à Netlify :

**1. Commiter et pousser les changements :**
```bash
git add .
git commit -m "Préparation déploiement production - Améliorations et sécurité"
git push origin main
```

**2. Netlify déploiera automatiquement !**

Vérifiez le déploiement dans Netlify Dashboard > Deploys

---

## 🔧 OPTION 2 : DÉPLOIEMENT VIA NETLIFY CLI

### Si vous préférez utiliser la ligne de commande :

**1. Installer Netlify CLI (si pas déjà fait) :**
```bash
npm install -g netlify-cli
```

**2. Se connecter à Netlify :**
```bash
netlify login
```

**3. Lier le site (si pas déjà fait) :**
```bash
netlify link
```

**4. Déployer :**
```bash
npm run deploy-netlify
```

Ou manuellement :
```bash
netlify deploy --prod
```

---

## ⚙️ CONFIGURATION DES VARIABLES D'ENVIRONNEMENT

**⚠️ IMPORTANT :** Avant que le site fonctionne, configurez les variables dans Netlify :

1. Allez dans **Netlify Dashboard** > **Site Settings** > **Environment Variables**
2. Ajoutez toutes les variables de votre `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://ehjkapbqofperdtycykb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
NEXT_PUBLIC_SITE_URL=https://redzone2.netlify.app
NEXT_PUBLIC_TURNSTILE_SITE_KEY=votre-cle-turnstile
SENTINELLE_SECRET_KEY=votre-cle-secrete-sentinelle
CLEANUP_SECRET_KEY=votre-cle-secrete-cleanup
```

**⚠️ Note :** Utilisez les **mêmes valeurs** que dans votre `.env.local`

---

## 📋 CHECKLIST POST-DÉPLOIEMENT

Après le déploiement, testez :

- [ ] Page d'accueil accessible
- [ ] Recherche fonctionne
- [ ] Inscription/Connexion fonctionne
- [ ] Publication d'annonce fonctionne
- [ ] Accès admin fonctionne
- [ ] Accès modérateur fonctionne

---

## 🐛 EN CAS DE PROBLÈME

### Le site ne se charge pas :
- Vérifiez les variables d'environnement dans Netlify Dashboard
- Vérifiez les logs dans Netlify Dashboard > Functions > Logs

### Erreur "Supabase URL not found" :
- Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` est bien configuré
- Vérifiez que la variable commence par `https://`

### Erreur "Invalid API key" :
- Vérifiez que `NEXT_PUBLIC_SUPABASE_ANON_KEY` est bien configuré
- Vérifiez que c'est la clé ANON (pas la service role key)

---

**Prêt à déployer ?** Exécutez les commandes ci-dessus ! 🚀

