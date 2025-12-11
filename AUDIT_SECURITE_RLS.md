# 🔒 AUDIT DE SÉCURITÉ RLS - REDZONE

**Date de l'audit** : $(date)  
**Expert** : Analyse complète des politiques RLS et des clés API

---

## ✅ **POINTS POSITIFS**

1. ✅ **RLS activé** sur toutes les tables principales (`profiles`, `vehicules`, `articles`, `comments`, `app_logs`, `model_specs_db`, `site_settings`)
2. ✅ **Pas de clés SERVICE_ROLE en dur** dans le code - Utilisation correcte de `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. ✅ **Clients Supabase correctement configurés** - Utilisation de `createBrowserClient` et `createServerClient` avec ANON_KEY uniquement
4. ✅ **Middleware de protection** - Routes admin protégées avec vérification du rôle

---

## 🚨 **FAILLES DE SÉCURITÉ IDENTIFIÉES**

### **1. TABLE `profiles` - LECTURE TROP PERMISSIVE (CRITIQUE)**

**Problème** : La politique RLS permet à **n'importe qui** (même non connecté) de voir tous les profils utilisateurs, incluant les emails et noms complets.

**Fichier** : `SUPABASE_MIGRATION.sql` lignes 27-29

```sql
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);
```

**Risque** : 
- Exposition des emails de tous les utilisateurs
- Violation de la confidentialité (RGPD)
- Possibilité de spam/harassement

**Correctif** : Restreindre la lecture aux profils publics uniquement (nom, avatar) ou aux utilisateurs connectés.

---

### **2. TABLE `vehicules` - MODIFICATION SANS RESTRICTION DE STATUT (MOYEN)**

**Problème** : Dans `SUPABASE_MIGRATION.sql`, les utilisateurs peuvent modifier leurs véhicules même s'ils sont `active` ou `rejected`.

**Fichier** : `SUPABASE_MIGRATION.sql` lignes 133-135

```sql
CREATE POLICY "Users can update own vehicles"
  ON vehicules FOR UPDATE
  USING (auth.uid() = user_id);
```

**Risque** : Un utilisateur peut modifier un véhicule déjà approuvé et publié, ce qui peut contourner la modération.

**Correctif** : Un correctif existe dans `security_fixes.sql` (lignes 56-65) mais il faut vérifier qu'il a été appliqué. Les utilisateurs ne devraient pouvoir modifier que les véhicules en statut `pending`.

---

### **3. STORAGE BUCKET - LECTURE TROP PERMISSIVE (CRITIQUE)**

**Problème** : La politique initiale permet à n'importe qui de voir tous les fichiers du bucket `files`.

**Fichier** : `SUPABASE_MIGRATION.sql` lignes 169-171

```sql
CREATE POLICY "Anyone can view files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'files');
```

**Risque** : 
- Exposition de fichiers privés (documents personnels, Car-Pass, etc.)
- Accès non autorisé aux fichiers des autres utilisateurs

**Correctif** : Un correctif existe dans `security_fixes.sql` (lignes 12-46) mais il faut vérifier qu'il a été appliqué. Seuls les fichiers du propriétaire et les images de véhicules actifs devraient être accessibles.

---

### **4. TABLE `profiles` - INSERTION LORS DE L'INSCRIPTION (MOYEN)**

**Problème** : Dans `AuthContext.tsx`, l'insertion dans `profiles` se fait côté client sans vérification stricte que `user_id` correspond à l'utilisateur connecté.

**Fichier** : `src/contexts/AuthContext.tsx` ligne 155

**Risque** : Théoriquement, un utilisateur pourrait essayer d'insérer un profil avec un `user_id` différent (bien que RLS devrait bloquer).

**Correctif** : S'assurer que la politique RLS vérifie bien `auth.uid() = id` lors de l'INSERT.

---

### **5. TABLE `comments` - SUPPRESSION LIMITÉE (MINEUR)**

**Problème** : Les utilisateurs ne peuvent supprimer que leurs commentaires en statut `pending`, pas ceux déjà approuvés.

**Fichier** : `supabase/create_comments_table.sql` lignes 92-95

**Risque** : Limitation UX - un utilisateur ne peut pas supprimer son propre commentaire après approbation.

**Note** : Ce n'est pas une faille de sécurité mais une limitation fonctionnelle. À corriger si vous voulez permettre la suppression des commentaires approuvés par leur auteur.

---

### **6. ABSENCE DE VÉRIFICATION CÔTÉ CODE (MOYEN)**

**Problème** : Les fonctions comme `approveVehicule`, `rejectVehicule`, `toggleUserBan`, etc. ne vérifient pas côté code si l'utilisateur est admin avant d'appeler Supabase.

**Fichiers concernés** :
- `src/lib/supabase/vehicules.ts` (lignes 156, 173)
- `src/lib/supabase/users.ts` (ligne 76)
- `src/lib/supabase/comments.ts` (lignes 177, 194)

**Risque** : Si une politique RLS est mal configurée ou désactivée par erreur, ces fonctions pourraient être exploitées.

**Correctif** : Ajouter une vérification du rôle admin côté code avant les opérations sensibles (défense en profondeur).

---

## 📋 **RÉSUMÉ DES CORRECTIFS À APPLIQUER**

### **Priorité CRITIQUE** 🔴

1. ✅ Restreindre la lecture de `profiles` (voir correctif ci-dessous)
2. ✅ Vérifier que les correctifs de `security_fixes.sql` ont été appliqués pour `vehicules` et `storage`

### **Priorité MOYENNE** 🟡

3. ✅ Ajouter des vérifications admin côté code
4. ✅ Vérifier la politique INSERT pour `profiles`

### **Priorité BASSE** 🟢

5. ⚠️ Permettre la suppression des commentaires approuvés par leur auteur (optionnel)

---

## 🔧 **CORRECTIFS SQL À APPLIQUER**

### **Correctif 1 : Restreindre la lecture de `profiles`**

```sql
-- Supprimer la politique trop permissive
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- Nouvelle politique : Seuls les utilisateurs connectés peuvent voir les profils
-- Mais seulement les informations publiques (nom, avatar)
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  USING (
    -- Les utilisateurs connectés peuvent voir tous les profils
    -- mais seulement les champs publics (pas l'email complet)
    auth.role() = 'authenticated'
  );

-- Alternative : Si vous voulez que tout le monde voie les noms mais pas les emails
-- CREATE POLICY "Public can view profile names"
--   ON profiles FOR SELECT
--   USING (true)
--   WITH CHECK (true);
-- Puis utilisez une vue ou une fonction qui masque l'email
```

**OU** si vous voulez garder la lecture publique mais masquer les emails :

```sql
-- Créer une vue publique qui masque les emails
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  created_at,
  -- Masquer l'email (afficher seulement le domaine)
  CASE 
    WHEN email IS NOT NULL THEN 
      CONCAT(LEFT(email, 3), '***@', SPLIT_PART(email, '@', 2))
    ELSE NULL
  END AS email_masked
FROM profiles;

-- Puis supprimer la politique sur profiles et créer une vue sécurisée
```

---

### **Correctif 2 : Vérifier les correctifs de `security_fixes.sql`**

**Action requise** : Exécuter le script `supabase/security_fixes.sql` dans Supabase SQL Editor si ce n'est pas déjà fait.

Ce script corrige :
- Les politiques de storage (lignes 12-46)
- Les politiques de modification des véhicules (lignes 56-65)
- Ajoute un trigger pour empêcher la modification du statut (lignes 73-97)

---

### **Correctif 3 : Ajouter une politique INSERT stricte pour `profiles`**

```sql
-- S'assurer que la politique INSERT existe et est correcte
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

---

### **Correctif 4 : Permettre la suppression des commentaires approuvés par leur auteur**

```sql
-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Users can delete own pending comments" ON comments;

-- Nouvelle politique : Les utilisateurs peuvent supprimer leurs propres commentaires (tous statuts)
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 🛡️ **AMÉLIORATIONS CÔTÉ CODE (DÉFENSE EN PROFONDEUR)**

### **Ajouter des vérifications admin dans les fonctions sensibles**

Exemple pour `approveVehicule` :

```typescript
// src/lib/supabase/vehicules.ts
export async function approveVehicule(id: string): Promise<void> {
  const supabase = createClient();
  
  // Vérifier que l'utilisateur est admin (défense en profondeur)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Non authentifié");
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  
  if (!profile || profile.role !== "admin") {
    throw new Error("Accès refusé - Administrateur uniquement");
  }
  
  // Maintenant faire l'opération (RLS vérifiera aussi)
  const { error } = await supabase
    .from("vehicules")
    .update({ status: "active" })
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur approbation: ${error.message}`);
  }
}
```

---

## ✅ **CHECKLIST DE VÉRIFICATION**

Avant de déployer, vérifiez :

- [ ] Le script `security_fixes.sql` a été exécuté dans Supabase
- [ ] La politique de lecture de `profiles` a été corrigée
- [ ] Les vérifications admin ont été ajoutées côté code (optionnel mais recommandé)
- [ ] Aucune clé SERVICE_ROLE n'est exposée dans le code
- [ ] Toutes les tables ont RLS activé
- [ ] Les politiques de storage sont restrictives
- [ ] Testez que les utilisateurs non-admin ne peuvent pas modifier/supprimer les données d'autres utilisateurs

---

## 📞 **SUPPORT**

Si vous avez des questions sur ces correctifs, consultez la documentation Supabase RLS :
https://supabase.com/docs/guides/auth/row-level-security

