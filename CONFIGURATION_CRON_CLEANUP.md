# ⚙️ CONFIGURATION DU CRON JOB DE NETTOYAGE AUTOMATIQUE
**RedZone - Guide de configuration du nettoyage automatique des données expirées**

---

## ✅ CONFIGURATION DÉJÀ EFFECTUÉE

### 1. Route API Créée ✅
- **Fichier :** `src/app/api/cleanup-expired-data/route.ts`
- **Fonctionnalités :**
  - ✅ Protection par clé secrète (optionnelle)
  - ✅ Appel de la fonction SQL `cleanup_all_expired_data()`
  - ✅ Logging des erreurs et succès
  - ✅ Retour des statistiques de nettoyage

### 2. Cron Job Configuré dans Vercel ✅
- **Fichier :** `vercel.json`
- **Configuration :**
  ```json
  {
    "crons": [
      {
        "path": "/api/cleanup-expired-data",
        "schedule": "0 0 1 * *"
      }
    ]
  }
  ```
- **Fréquence :** Le 1er de chaque mois à minuit (00:00 UTC)

---

## 📋 ACTIONS REQUISES

### Étape 1 : Exécuter le Script SQL

1. Ouvrez **Supabase Dashboard** > **SQL Editor**
2. Copiez-collez le contenu de `supabase/cleanup_expired_data.sql`
3. Cliquez sur **Run** pour exécuter le script
4. Vérifiez qu'il n'y a pas d'erreurs

**Vérification :**
```sql
-- Vérifier que la fonction existe
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'cleanup_all_expired_data';
```

---

### Étape 2 : Configurer la Variable d'Environnement (Recommandé)

**Pour sécuriser l'endpoint :**

1. Ouvrez **Vercel Dashboard** > Votre projet > **Settings** > **Environment Variables**
2. Ajoutez une nouvelle variable :
   - **Name :** `CLEANUP_SECRET_KEY`
   - **Value :** Générez une clé secrète forte (ex: avec `openssl rand -hex 32`)
   - **Environments :** Production, Preview, Development

**Génération d'une clé secrète :**
```bash
# Sur Linux/Mac
openssl rand -hex 32

# Sur Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Note :** Si vous ne configurez pas cette variable, l'endpoint sera accessible sans authentification (non recommandé en production).

---

### Étape 3 : Vérifier le Déploiement

1. Déployez votre application sur Vercel
2. Vérifiez que le cron job apparaît dans **Vercel Dashboard** > **Settings** > **Cron Jobs**
3. Vous devriez voir :
   - **Path :** `/api/cleanup-expired-data`
   - **Schedule :** `0 0 1 * *`
   - **Status :** Active

---

## 🧪 TESTER LE NETTOYAGE MANUELLEMENT

### Test via l'API (avec clé secrète)

```bash
# Remplacer YOUR_SECRET_KEY par votre clé secrète
curl -X GET "https://votre-domaine.com/api/cleanup-expired-data" \
  -H "Authorization: Bearer YOUR_SECRET_KEY"
```

### Test via Supabase SQL Editor

```sql
-- Exécuter la fonction directement
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
  "timestamp": "2025-12-01T00:00:00.000Z"
}
```

---

## 📊 MONITORING

### Vérifier les Logs

**Dans Vercel :**
1. Allez dans **Vercel Dashboard** > Votre projet > **Logs**
2. Filtrez par `/api/cleanup-expired-data`
3. Vérifiez les exécutions mensuelles

**Dans Supabase :**
1. Allez dans **Supabase Dashboard** > **Logs** > **Postgres Logs**
2. Recherchez les appels à `cleanup_all_expired_data()`

**Dans l'application :**
- Les logs sont enregistrés dans la table `app_logs`
- Recherchez les entrées avec le message "Nettoyage automatique des données expirées effectué avec succès"

---

## 🔧 CONFIGURATION ALTERNATIVE : SUPABASE CRON

Si vous préférez utiliser Supabase Cron au lieu de Vercel Cron :

### Option 1 : Via Supabase Dashboard (Interface Graphique)

1. Allez dans **Supabase Dashboard** > **Database** > **Cron Jobs**
2. Cliquez sur **New Cron Job**
3. Configurez :
   - **Name :** `cleanup_expired_data`
   - **Schedule :** `0 0 1 * *` (le 1er de chaque mois)
   - **Command :** 
     ```sql
     SELECT * FROM cleanup_all_expired_data();
     ```
   - **Enabled :** ✅

### Option 2 : Via SQL

```sql
-- Créer le cron job dans Supabase
SELECT cron.schedule(
  'cleanup-expired-data',           -- Nom du job
  '0 0 1 * *',                      -- Schedule (1er de chaque mois)
  $$SELECT * FROM cleanup_all_expired_data();$$
);
```

**Pour supprimer le cron job Vercel si vous utilisez Supabase :**
- Retirez l'entrée du cron job dans `vercel.json`

---

## ⚠️ IMPORTANT

### Sécurité

- ✅ **Toujours configurer `CLEANUP_SECRET_KEY` en production**
- ✅ **Ne jamais exposer l'endpoint publiquement sans authentification**
- ✅ **Vérifier les logs régulièrement pour détecter les tentatives d'accès non autorisées**

### Performance

- ⚠️ **Le nettoyage peut prendre du temps** si beaucoup de données à supprimer
- ⚠️ **Exécuter pendant les heures creuses** (déjà configuré : minuit)
- ⚠️ **Surveiller les performances** lors des premières exécutions

### Sauvegarde

- ✅ **Faire une sauvegarde avant le premier nettoyage** (si vous avez des données importantes)
- ✅ **Tester d'abord en environnement de staging**

---

## 📅 CALENDRIER D'EXÉCUTION

Le cron job s'exécute :
- **Fréquence :** Mensuel
- **Jour :** Le 1er de chaque mois
- **Heure :** 00:00 UTC
- **Prochaine exécution :** Le 1er du mois prochain à minuit UTC

**Exemples :**
- 1er janvier 2026 à 00:00 UTC
- 1er février 2026 à 00:00 UTC
- 1er mars 2026 à 00:00 UTC
- etc.

---

## ✅ CHECKLIST DE VÉRIFICATION

- [ ] Script SQL `cleanup_expired_data.sql` exécuté dans Supabase
- [ ] Fonction `cleanup_all_expired_data()` créée et testée
- [ ] Variable d'environnement `CLEANUP_SECRET_KEY` configurée dans Vercel
- [ ] Cron job visible dans Vercel Dashboard > Settings > Cron Jobs
- [ ] Test manuel effectué avec succès
- [ ] Logs vérifiés après le premier nettoyage automatique

---

**Statut :** ✅ **CONFIGURÉ ET PRÊT**  
**Prochaine exécution :** Le 1er du mois prochain à minuit UTC

