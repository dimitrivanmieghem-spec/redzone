# ⚡ Déploiement Ultra-Rapide RedZone

## 🎯 En 3 étapes (5 minutes)

### 1️⃣ Préparer Supabase (2 min)

```bash
# Dans Supabase Dashboard → SQL Editor, exécutez dans l'ordre :
# - create_articles_table.sql
# - create_comments_table.sql  
# - create_app_logs_table.sql
# - create_model_specs_db_table.sql
# - add_advanced_filters.sql
# - add_location_fields.sql
# - extend_articles_for_ugc.sql
# - add_professional_roles.sql
# - admin_extensions.sql
```

### 2️⃣ Pousser sur GitHub (1 min)

```bash
git init
git add .
git commit -m "Ready for production"
git remote add origin https://github.com/VOTRE_USERNAME/redzone.git
git push -u origin main
```

### 3️⃣ Déployer sur Vercel (2 min)

1. Allez sur [vercel.com](https://vercel.com) → **Add New Project**
2. Importez votre dépôt GitHub
3. Ajoutez les variables d'environnement :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (après le premier déploiement)
4. Cliquez **Deploy**

**✅ C'est tout ! Votre site est en ligne.**

---

## 🤖 Pour automatiser les prochains déploiements

### Option A : GitHub Actions (Recommandé)

1. Configurez les secrets GitHub (voir `AUTOMATED_DEPLOYMENT.md`)
2. Chaque `git push origin main` déploie automatiquement

### Option B : Script de déploiement

```bash
# Première fois : configurer Vercel CLI
npm run setup-vercel

# Ensuite, pour déployer :
npm run deploy
```

---

## 📋 Vérification rapide

```bash
# Vérifier que tout est prêt
npm run check-deploy
```

---

**🎉 Votre site est maintenant en ligne !**

Pour plus de détails, consultez `AUTOMATED_DEPLOYMENT.md`

