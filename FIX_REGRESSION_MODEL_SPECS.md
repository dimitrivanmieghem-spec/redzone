# 🔧 CORRECTIF : Régression Formulaire de Création d'Annonce

## 🐛 **PROBLÈME IDENTIFIÉ**

Après l'application des correctifs de sécurité RLS, le formulaire de création d'annonce (`/sell`) ne remplit plus automatiquement les champs techniques (Puissance, CO2, CV fiscaux, etc.) lors de la sélection d'un modèle.

**Symptômes :**
- Sélection d'un modèle (ex: Golf 7R) → Les champs techniques restent vides
- Le calculateur de taxes ne fonctionne plus automatiquement
- Erreurs silencieuses dans la console (pas de message d'erreur visible)

---

## 🔍 **CAUSE RACINE**

**Table concernée :** `model_specs_db`

**Problème RLS :** La politique `"Admins can manage model specs"` utilisait `FOR ALL`, ce qui peut entrer en conflit avec la politique SELECT publique. Quand RLS est activé avec des politiques conflictuelles, Supabase peut bloquer l'accès même si une politique publique existe.

**Fichiers concernés :**
- `src/lib/supabase/modelSpecs.ts` - Fonctions de récupération des specs
- `src/app/sell/page.tsx` - Formulaire de création d'annonce
- `supabase/create_model_specs_db_table.sql` - Script de création de la table

---

## ✅ **SOLUTION APPLIQUÉE**

### **1. Script SQL de Correctif**

**Fichier :** `supabase/fix_model_specs_rls.sql`

**Actions :**
1. ✅ Supprime les politiques existantes qui peuvent entrer en conflit
2. ✅ Recrée une politique SELECT publique explicite : `"Public can view active model specs"`
3. ✅ Sépare les politiques admin en INSERT, UPDATE, DELETE (au lieu de FOR ALL)
4. ✅ Ajoute des vérifications de diagnostic

**À exécuter dans Supabase SQL Editor :**
```sql
-- Copier-coller le contenu de supabase/fix_model_specs_rls.sql
```

### **2. Amélioration du Logging**

**Fichier modifié :** `src/lib/supabase/modelSpecs.ts`

**Améliorations :**
- ✅ Détection spécifique des erreurs RLS (code `PGRST116`)
- ✅ Messages d'erreur plus explicites avec hints
- ✅ Logging des paramètres (type, brand, model) pour diagnostic

**Fonctions améliorées :**
- `getBrands()` - Meilleur logging des erreurs RLS
- `getModels()` - Meilleur logging des erreurs RLS
- `getModelSpecs()` - Logging détaillé avec diagnostic RLS

---

## 📋 **INSTRUCTIONS DE CORRECTION**

### **Étape 1 : Exécuter le Script SQL**

1. Ouvrez votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu de `supabase/fix_model_specs_rls.sql`
4. Cliquez sur **Run** (ou F5)
5. Vérifiez les messages de diagnostic dans les résultats

**Résultat attendu :**
```
✅ La table model_specs_db existe.
✅ Lecture publique OK
✅ Modification admin OK
```

### **Étape 2 : Vérifier les Politiques**

Exécutez cette requête pour vérifier que les politiques sont correctes :

```sql
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'model_specs_db'
ORDER BY cmd, policyname;
```

**Résultat attendu :**
- `Public can view active model specs` (cmd: SELECT)
- `Admins can insert model specs` (cmd: INSERT)
- `Admins can update model specs` (cmd: UPDATE)
- `Admins can delete model specs` (cmd: DELETE)

### **Étape 3 : Tester la Lecture Publique**

Exécutez cette requête pour tester que la lecture publique fonctionne :

```sql
-- Test en tant qu'utilisateur anonyme
SELECT 
  marque,
  modele,
  ch,
  kw,
  cv_fiscaux
FROM model_specs_db
WHERE is_active = true
LIMIT 5;
```

**Résultat attendu :** La requête doit retourner des résultats sans erreur.

### **Étape 4 : Tester le Formulaire**

1. Allez sur `/sell`
2. Sélectionnez un type de véhicule (ex: Voiture)
3. Sélectionnez une marque (ex: Volkswagen)
4. Sélectionnez un modèle (ex: Golf 7R)
5. **Vérifiez que les champs se remplissent automatiquement :**
   - Puissance (ch)
   - Puissance (kW)
   - CV fiscaux
   - CO2
   - Cylindrée
   - Moteur
   - Transmission

### **Étape 5 : Vérifier la Console**

Ouvrez la console du navigateur (F12) et vérifiez :
- ✅ Pas d'erreurs RLS (code `PGRST116`)
- ✅ Pas d'erreurs "permission denied"
- ✅ Si erreur, le message doit indiquer clairement le problème

---

## 🔍 **DIAGNOSTIC SI LE PROBLÈME PERSISTE**

### **Vérifier que la Table Existe et Contient des Données**

```sql
-- Vérifier l'existence de la table
SELECT COUNT(*) FROM model_specs_db;

-- Vérifier qu'il y a des specs actives
SELECT COUNT(*) FROM model_specs_db WHERE is_active = true;

-- Vérifier un modèle spécifique
SELECT * FROM model_specs_db 
WHERE marque = 'Volkswagen' 
  AND modele = 'Golf 7R' 
  AND type = 'car'
  AND is_active = true;
```

### **Vérifier les Politiques RLS**

```sql
-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'model_specs_db';

-- Vérifier toutes les politiques
SELECT * FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'model_specs_db';
```

### **Tester l'Accès en Tant Qu'Utilisateur Anonyme**

Dans Supabase SQL Editor, exécutez en tant qu'utilisateur anonyme :

```sql
-- Simuler une requête anonyme
SET ROLE anon;
SELECT COUNT(*) FROM model_specs_db WHERE is_active = true;
RESET ROLE;
```

**Si cette requête échoue :** Les politiques RLS ne sont pas correctement configurées.

---

## 📝 **NOTES IMPORTANTES**

### **Sécurité**

✅ **Lecture publique autorisée** : La table `model_specs_db` contient uniquement des données de référence techniques (puissance, CO2, etc.). Ces données ne sont pas sensibles et doivent être accessibles publiquement pour que le formulaire fonctionne.

✅ **Modification restreinte** : Seuls les administrateurs peuvent modifier/ajouter/supprimer des specs, ce qui est correct.

### **Performance**

- Les requêtes sont optimisées avec des index sur `marque`, `modele`, `type`, et `is_active`
- Les fonctions utilisent un système de retry (2 tentatives) pour gérer les erreurs temporaires

### **Fallback**

Si la table `model_specs_db` est vide ou inaccessible, le formulaire fonctionne toujours mais sans pré-remplissage automatique. L'utilisateur peut saisir manuellement les données.

---

## ✅ **CHECKLIST DE VÉRIFICATION**

- [ ] Script SQL `fix_model_specs_rls.sql` exécuté dans Supabase
- [ ] Politiques RLS vérifiées (4 politiques : SELECT, INSERT, UPDATE, DELETE)
- [ ] Test de lecture publique réussi (requête anonyme)
- [ ] Formulaire `/sell` testé avec un modèle existant
- [ ] Champs techniques se remplissent automatiquement
- [ ] Pas d'erreurs dans la console du navigateur
- [ ] Calculateur de taxes fonctionne correctement

---

## 🚀 **DÉPLOIEMENT**

Après avoir appliqué le correctif SQL dans Supabase, les modifications de code (`modelSpecs.ts`) seront automatiquement déployées via Netlify lors du prochain push Git.

**Aucune action supplémentaire requise** - Le correctif SQL est la seule étape manuelle nécessaire.

---

## 📞 **SUPPORT**

Si le problème persiste après avoir appliqué ce correctif :

1. Vérifiez les logs Supabase (Dashboard > Logs)
2. Vérifiez la console du navigateur pour les erreurs détaillées
3. Exécutez les requêtes de diagnostic ci-dessus
4. Vérifiez que la table contient bien des données (`SELECT COUNT(*) FROM model_specs_db`)

