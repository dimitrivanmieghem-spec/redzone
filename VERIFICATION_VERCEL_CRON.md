# ✅ VÉRIFICATION DE LA CONFIGURATION VERCEL
**RedZone - Guide de vérification du cron job de nettoyage automatique**

---

## 📋 CHECKLIST DE VÉRIFICATION

### ✅ 1. Variable d'Environnement (DÉJÀ CONFIGURÉE)

**Statut :** ✅ **CONFIGURÉE**

D'après votre capture d'écran, la variable `CLEANUP_SECRET_KEY` est bien configurée :
- ✅ **Nom :** `CLEANUP_SECRET_KEY`
- ✅ **Environnements :** Production, Preview, Development
- ✅ **Statut :** "Updated just now"

**Vérification :**
1. Allez dans **Vercel Dashboard** > Votre projet > **Settings** > **Environment Variables**
2. Vérifiez que `CLEANUP_SECRET_KEY` apparaît bien
3. Vérifiez qu'elle est activée pour **Production, Preview, et Development**

---

### ✅ 2. Configuration du Cron Job dans vercel.json

**Fichier :** `vercel.json`

**Configuration attendue :**
```json
{
  "crons": [
    {
      "path": "/api/sentinelle/check",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cleanup-expired-data",
      "schedule": "0 0 1 * *"
    }
  ]
}
```

**Vérification :**
1. Ouvrez le fichier `vercel.json` dans votre projet
2. Vérifiez qu'il contient bien les deux cron jobs
3. Vérifiez que le schedule est `"0 0 1 * *"` (1er de chaque mois à minuit)

---

### ✅ 3. Route API Créée

**Fichier :** `src/app/api/cleanup-expired-data/route.ts`

**Vérification :**
1. Vérifiez que le fichier existe dans votre projet
2. Vérifiez qu'il contient bien :
   - La vérification de la clé secrète
   - L'appel à `supabase.rpc("cleanup_all_expired_data")`
   - Le logging des erreurs et succès

---

### ✅ 4. Script SQL Exécuté dans Supabase

**Fichier :** `supabase/cleanup_expired_data.sql`

**Action requise :**
1. Ouvrez **Supabase Dashboard** > **SQL Editor**
2. Vérifiez que la fonction `cleanup_all_expired_data()` existe :

```sql
-- Vérifier que la fonction existe
SELECT routine_name, routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'cleanup_all_expired_data';
```

**Si la fonction n'existe pas :**
1. Copiez-collez le contenu de `supabase/cleanup_expired_data.sql`
2. Exécutez le script dans Supabase SQL Editor
3. Vérifiez qu'il n'y a pas d'erreurs

---

## 🔍 VÉRIFICATION DANS VERCEL DASHBOARD

### Étape 1 : Vérifier les Cron Jobs

1. Allez dans **Vercel Dashboard** > Votre projet
2. Cliquez sur **Settings** (en haut à droite)
3. Dans le menu de gauche, cliquez sur **Cron Jobs**
4. Vous devriez voir **2 cron jobs** :
   - ✅ `/api/sentinelle/check` - Schedule: `0 * * * *` (toutes les heures)
   - ✅ `/api/cleanup-expired-data` - Schedule: `0 0 1 * *` (1er de chaque mois)

**Si le cron job n'apparaît pas :**
- Vérifiez que `vercel.json` est bien commité et déployé
- Attendez quelques minutes après le déploiement
- Vérifiez que le fichier `vercel.json` est à la racine du projet

---

### Étape 2 : Vérifier les Variables d'Environnement

1. Allez dans **Vercel Dashboard** > Votre projet > **Settings**
2. Cliquez sur **Environment Variables** dans le menu de gauche
3. Vérifiez que `CLEANUP_SECRET_KEY` est bien présente
4. Vérifiez qu'elle est activée pour **Production, Preview, Development**

**✅ DÉJÀ FAIT** - D'après votre capture d'écran, c'est correctement configuré.

---

### Étape 3 : Tester l'Endpoint Manuellement

**Option 1 : Via cURL (Terminal)**

```bash
# Remplacer YOUR_SECRET_KEY par la valeur de CLEANUP_SECRET_KEY
# Remplacer votre-domaine.com par votre domaine Vercel
curl -X GET "https://votre-domaine.com/api/cleanup-expired-data" \
  -H "Authorization: Bearer YOUR_SECRET_KEY"
```

**Option 2 : Via Supabase SQL Editor (Plus simple)**

1. Ouvrez **Supabase Dashboard** > **SQL Editor**
2. Exécutez :
```sql
SELECT * FROM cleanup_all_expired_data();
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Nettoyage automatique effectué avec succès",
  "data": {
    "audit_logs_deleted": 0,
    "profiles_deleted": 0,
    "vehicules_deleted": 0,
    "notifications_deleted": 0,
    "saved_searches_deleted": 0,
    "app_logs_deleted": 0
  },
  "timestamp": "2025-12-XX..."
}
```

---

## 🚨 PROBLÈMES COURANTS ET SOLUTIONS

### Problème 1 : Le cron job n'apparaît pas dans Vercel

**Solutions :**
1. Vérifiez que `vercel.json` est à la racine du projet (pas dans un sous-dossier)
2. Vérifiez que le fichier est bien commité dans Git
3. Redéployez le projet sur Vercel
4. Attendez 2-3 minutes après le déploiement

---

### Problème 2 : Erreur 401 (Unauthorized)

**Cause :** La clé secrète n'est pas correctement passée ou configurée.

**Solutions :**
1. Vérifiez que `CLEANUP_SECRET_KEY` est bien configurée dans Vercel
2. Vérifiez que la variable est activée pour l'environnement (Production/Preview/Development)
3. Redéployez le projet après avoir ajouté/modifié la variable

**Note :** Vercel ajoute automatiquement la clé secrète dans le header `Authorization: Bearer ...` lors des appels cron, donc vous n'avez rien à faire de plus.

---

### Problème 3 : Erreur 500 (Fonction SQL non trouvée)

**Cause :** La fonction `cleanup_all_expired_data()` n'existe pas dans Supabase.

**Solution :**
1. Exécutez le script `supabase/cleanup_expired_data.sql` dans Supabase SQL Editor
2. Vérifiez que la fonction existe avec la requête SQL ci-dessus

---

### Problème 4 : Le cron job ne s'exécute pas

**Vérifications :**
1. Vérifiez que le cron job est bien visible dans Vercel Dashboard > Settings > Cron Jobs
2. Vérifiez que le schedule est correct : `0 0 1 * *`
3. Attendez le 1er du mois prochain (le cron job s'exécute le 1er de chaque mois)
4. Vérifiez les logs dans Vercel Dashboard > Logs pour voir les tentatives d'exécution

---

## 📊 MONITORING ET LOGS

### Vérifier les Logs dans Vercel

1. Allez dans **Vercel Dashboard** > Votre projet
2. Cliquez sur **Logs** dans le menu de gauche
3. Filtrez par `/api/cleanup-expired-data`
4. Vous verrez les exécutions du cron job (une fois par mois)

### Vérifier les Logs dans Supabase

1. Allez dans **Supabase Dashboard** > **Logs** > **Postgres Logs**
2. Recherchez les appels à `cleanup_all_expired_data()`

### Vérifier les Logs dans l'Application

Les logs sont enregistrés dans la table `app_logs` :
```sql
SELECT * FROM app_logs 
WHERE message LIKE '%Nettoyage automatique%'
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ RÉCAPITULATIF DE LA CONFIGURATION

### Ce qui est déjà fait ✅

- ✅ Variable d'environnement `CLEANUP_SECRET_KEY` configurée dans Vercel
- ✅ Route API créée : `src/app/api/cleanup-expired-data/route.ts`
- ✅ Cron job configuré dans `vercel.json`
- ✅ Documentation créée

### Ce qui reste à faire ⚠️

1. **Exécuter le script SQL** dans Supabase (si pas déjà fait)
   - Fichier : `supabase/cleanup_expired_data.sql`
   - Action : Copier-coller dans Supabase SQL Editor > Exécuter

2. **Vérifier le cron job dans Vercel Dashboard**
   - Allez dans Settings > Cron Jobs
   - Vérifiez que `/api/cleanup-expired-data` apparaît avec le schedule `0 0 1 * *`

3. **Tester l'endpoint** (optionnel mais recommandé)
   - Via Supabase SQL Editor : `SELECT * FROM cleanup_all_expired_data();`
   - Ou via cURL avec la clé secrète

---

## 🎯 PROCHAINES ÉTAPES

1. **Exécutez le script SQL** dans Supabase (si pas déjà fait)
2. **Vérifiez le cron job** dans Vercel Dashboard > Settings > Cron Jobs
3. **Testez l'endpoint** manuellement pour vérifier que tout fonctionne
4. **Attendez le 1er du mois prochain** pour voir le cron job s'exécuter automatiquement

---

**Statut actuel :** ✅ **CONFIGURATION COMPLÈTE**  
**Action requise :** Exécuter le script SQL dans Supabase (si pas déjà fait)  
**Prochaine exécution automatique :** Le 1er du mois prochain à minuit UTC

