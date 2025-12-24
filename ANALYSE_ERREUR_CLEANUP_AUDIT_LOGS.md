# 🔍 Analyse de l'erreur `cleanup_old_audit_logs()`

## ❌ Erreur rencontrée

```
ERROR: 42P13: cannot change return type of existing function
HINT: Use DROP FUNCTION cleanup_old_audit_logs() first.
```

## 🔎 Origine du problème

### **Conflit de définitions**

La fonction `cleanup_old_audit_logs()` est définie dans **deux scripts SQL différents** avec des **types de retour différents** :

1. **`supabase/create_audit_logs_table.sql`** (ligne 97) :
   ```sql
   CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
   RETURNS void AS $$
   ```
   - Type de retour : `void` (ne retourne rien)

2. **`supabase/cleanup_expired_data.sql`** (ligne 12) :
   ```sql
   CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
   RETURNS TABLE(deleted_count BIGINT) AS $$
   ```
   - Type de retour : `TABLE(deleted_count BIGINT)` (retourne le nombre d'enregistrements supprimés)

### **Pourquoi PostgreSQL refuse le changement ?**

PostgreSQL ne permet **pas** de changer le type de retour d'une fonction existante avec `CREATE OR REPLACE FUNCTION`. C'est une limitation de sécurité pour éviter de casser le code qui dépend de la signature de la fonction.

## 📊 Impact sur le code

### **1. Fonction `cleanup_all_expired_data()`**

Dans `supabase/cleanup_expired_data.sql` (ligne 194) :
```sql
SELECT deleted_count INTO audit_count FROM cleanup_old_audit_logs();
```

**Impact** : Si la fonction retourne `void` au lieu de `TABLE(deleted_count BIGINT)`, cette ligne **échouera** avec une erreur de type.

### **2. Route API `/api/cleanup-expired-data`**

Dans `src/app/api/cleanup-expired-data/route.ts` (ligne 57) :
```typescript
const { data, error } = await supabase.rpc("cleanup_all_expired_data");
```

**Impact** : Si `cleanup_all_expired_data()` échoue à cause du changement de type, la route API retournera une erreur 500.

### **3. Cron job de nettoyage automatique**

Si un cron job est configuré pour appeler `/api/cleanup-expired-data`, il échouera également.

## ✅ Solution appliquée

### **Uniformisation du type de retour**

**Décision** : Utiliser `RETURNS TABLE(deleted_count BIGINT)` car :
1. ✅ Compatible avec `cleanup_all_expired_data()`
2. ✅ Permet de connaître le nombre d'enregistrements supprimés
3. ✅ Plus utile pour le monitoring et les logs

### **Modifications apportées**

1. **`supabase/create_audit_logs_table.sql`** :
   - ✅ Changé `RETURNS void` → `RETURNS TABLE(deleted_count BIGINT)`
   - ✅ Ajouté une vérification pour supprimer l'ancienne fonction si elle existe avec un type différent
   - ✅ Ajouté `GET DIAGNOSTICS` pour compter les enregistrements supprimés
   - ✅ Ajouté `RETURN QUERY SELECT deleted_count_var;`

2. **`supabase/cleanup_expired_data.sql`** :
   - ✅ Ajouté une vérification pour s'assurer que la table `audit_logs` existe avant d'exécuter le nettoyage
   - ✅ Retourne `0` si la table n'existe pas (au lieu de planter)

## 📋 Ordre d'exécution recommandé

Pour éviter les erreurs, exécutez les scripts dans cet ordre :

1. **D'abord** : `supabase/create_audit_logs_table.sql`
   - Crée la table `audit_logs`
   - Crée la fonction `cleanup_old_audit_logs()` avec le bon type de retour

2. **Ensuite** : `supabase/cleanup_expired_data.sql`
   - Crée/remplace toutes les fonctions de nettoyage
   - La fonction `cleanup_old_audit_logs()` sera remplacée par la version compatible

## 🔧 Scripts corrigés

Les deux scripts sont maintenant **idempotents** (peuvent être exécutés plusieurs fois sans erreur) et **compatibles** entre eux.

## ⚠️ Action requise

Si vous avez déjà exécuté `cleanup_expired_data.sql` avant `create_audit_logs_table.sql`, vous pouvez :

1. **Option A** : Exécuter le script corrigé `create_audit_logs_table.sql` qui supprimera automatiquement l'ancienne fonction si nécessaire

2. **Option B** : Supprimer manuellement l'ancienne fonction :
   ```sql
   DROP FUNCTION IF EXISTS cleanup_old_audit_logs();
   ```
   Puis exécuter `create_audit_logs_table.sql`

## ✅ Vérification

Pour vérifier que tout fonctionne :

```sql
-- Vérifier que la fonction existe avec le bon type
SELECT 
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'cleanup_old_audit_logs';

-- Tester la fonction
SELECT * FROM cleanup_old_audit_logs();

-- Tester la fonction principale
SELECT * FROM cleanup_all_expired_data();
```

## 📝 Conclusion

- ✅ **Problème identifié** : Conflit de types de retour entre deux scripts
- ✅ **Impact analysé** : Risque de casser `cleanup_all_expired_data()` et la route API
- ✅ **Solution appliquée** : Uniformisation avec `RETURNS TABLE(deleted_count BIGINT)`
- ✅ **Scripts corrigés** : Les deux scripts sont maintenant compatibles et idempotents

