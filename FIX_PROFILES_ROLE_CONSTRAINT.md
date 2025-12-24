# 🔧 FIX : Erreur profiles_role_check

## ❌ **PROBLÈME**

Lors de l'exécution de `scripts/create-local-users.ts`, vous obtenez cette erreur :

```
new row for relation "profiles" violates check constraint "profiles_role_check"
```

Ou lors de l'exécution du script SQL `add_professional_roles.sql` :

```
ERROR: 23514: check constraint "profiles_role_check" of relation "profiles" is violated by some row
```

## 🔍 **CAUSE**

La contrainte `profiles_role_check` dans la table `profiles` n'accepte que les valeurs `'user'` et `'admin'`, mais le script essaie d'insérer `'particulier'` et `'pro'`.

**OU** il y a des lignes existantes avec des valeurs invalides qui empêchent l'ajout de la nouvelle contrainte.

## ✅ **SOLUTION**

Le script SQL a été corrigé pour gérer correctement l'ordre des opérations. Exécutez le script mis à jour :

### **Étape 1 : Ouvrir Supabase SQL Editor**

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. **SQL Editor** → **New query**

### **Étape 2 : Exécuter le Script Corrigé**

Copiez-collez le contenu du fichier `supabase/add_professional_roles.sql` dans l'éditeur.

Le script fait maintenant :
1. ✅ **Affiche les rôles actuels** (pour diagnostic)
2. ✅ **Supprime l'ancienne contrainte** (pour pouvoir modifier les données)
3. ✅ **Met à jour toutes les lignes** (`'user'` → `'particulier'`, `NULL` → `'particulier'`)
4. ✅ **Vérifie qu'il n'y a plus de valeurs invalides**
5. ✅ **Ajoute la nouvelle contrainte** (maintenant que toutes les données sont valides)
6. ✅ **Met à jour le trigger** pour utiliser `'particulier'` par défaut
7. ✅ **Affiche un résumé** des rôles après modification

### **Étape 3 : Vérifier le Résultat**

Le script affiche automatiquement :
- Les rôles avant modification
- Les rôles après modification

Vous devriez voir uniquement `particulier`, `pro`, et `admin` (plus de `user`).

### **Étape 4 : Relancer le Script de Création**

```bash
npx tsx scripts/create-local-users.ts
```

Le script devrait maintenant fonctionner sans erreur ! ✅

---

## 🐛 **SI L'ERREUR PERSISTE**

Si vous obtenez encore l'erreur après avoir exécuté le script SQL, il peut y avoir des lignes avec des valeurs inattendues. Exécutez cette requête pour diagnostiquer :

```sql
-- Voir toutes les valeurs de role dans profiles
SELECT 
  role,
  COUNT(*) as count,
  array_agg(email) as emails
FROM profiles
GROUP BY role
ORDER BY role;
```

Si vous voyez des valeurs autres que `'particulier'`, `'pro'`, `'admin'`, `'user'`, ou `NULL`, vous devrez les corriger manuellement :

```sql
-- Exemple : si vous avez des rôles invalides comme 'test', 'custom', etc.
UPDATE profiles 
SET role = 'particulier' 
WHERE role NOT IN ('particulier', 'pro', 'admin', 'user')
   OR role IS NULL;
```

Puis réexécutez le script `add_professional_roles.sql`.

---

## 📝 **NOTE**

Si vous avez déjà créé des utilisateurs avec l'ancienne contrainte, ils auront le rôle `'user'`. Le script SQL les convertira automatiquement en `'particulier'`.
