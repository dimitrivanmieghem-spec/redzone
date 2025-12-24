# 🔧 Correction de la fonction RPC get_admin_stats

## ⚠️ Problème

L'erreur suivante apparaît dans la console :
```
POST https://...supabase.co/rest/v1/rpc/get_admin_stats 404 (Not Found)
RPC Error: relation "vehicules" does not exist
```

## ✅ Solution

La fonction RPC `get_admin_stats` n'existe pas dans Supabase ou référence la mauvaise table (`vehicules` au lieu de `vehicles`).

## 📋 Instructions

1. **Ouvrez Supabase Dashboard** → **SQL Editor**

2. **Exécutez le script** `supabase/create_get_admin_stats.sql`

   Ce script :
   - Supprime l'ancienne fonction si elle existe
   - Crée la fonction RPC `get_admin_stats()` qui utilise la table `vehicles` (correcte)
   - Vérifie que l'utilisateur est admin ou moderator
   - Retourne les statistiques : total_vehicles, pending_vehicles, active_vehicles, rejected_vehicles, total_users

3. **Vérifiez que la fonction existe** :
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'get_admin_stats';
   ```

4. **Testez la fonction** (en tant qu'admin) :
   ```sql
   SELECT * FROM get_admin_stats();
   ```

## 📍 Pages impactées

Cette fonction est utilisée dans :
- `/admin/dashboard` - Affiche les statistiques
- `/admin/moderation` - (import supprimé, non utilisé)
- `/admin/page` - Affiche les statistiques

## 🔍 Vérification

Après avoir exécuté le script, les erreurs 404 et "relation vehicules does not exist" devraient disparaître.

