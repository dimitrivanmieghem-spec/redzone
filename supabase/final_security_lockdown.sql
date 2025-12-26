-- ========================================
-- REDZONE - FINAL SECURITY LOCKDOWN
-- ========================================
-- 📅 Date: 2025-01-XX
-- 🎯 Objectif: Réactiver le RLS (Row Level Security) sur profiles, notifications et favorites
--               avec des policies sécurisées incluant les droits admin
--
-- ⚠️ IMPORTANT: Ce script est idempotent (peut être exécuté plusieurs fois sans erreur)
--               Il supprime d'abord les anciennes policies pour éviter les conflits
-- ========================================

-- ========================================
-- 1. FONCTION ANTI-RÉCURSION : is_admin()
-- ========================================
-- Cette fonction permet de vérifier les droits admin sans créer de boucle infinie
-- Mode SECURITY DEFINER : s'exécute avec les droits du créateur, pas de l'appelant
-- Évite les problèmes de RLS lors de la vérification du rôle dans profiles

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Vérifier si l'utilisateur actuel est admin
  -- SECURITY DEFINER permet de contourner le RLS sur profiles
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Commentaire pour documentation
COMMENT ON FUNCTION is_admin() IS 
'Vérifie si l''utilisateur actuel est admin. Utilise SECURITY DEFINER pour éviter les boucles RLS.';

-- ========================================
-- 2. TABLE PROFILES
-- ========================================

-- Activer le RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes policies pour éviter les conflits
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON profiles;

-- Policy 1 : LECTURE - Tout utilisateur authentifié peut voir tous les profils
-- (Nécessaire pour l'affichage public des profils utilisateurs)
CREATE POLICY "profiles_select_all_authenticated"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2 : ÉCRITURE - Un utilisateur ne peut modifier QUE son propre profil
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3 : INSERT - Un utilisateur ne peut insérer QUE son propre profil
CREATE POLICY "profiles_insert_own"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 4 : ADMIN - Les admins peuvent tout faire (UPDATE/DELETE sur tous les profils)
CREATE POLICY "profiles_admin_full_access"
  ON profiles
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ========================================
-- 3. TABLE NOTIFICATIONS
-- ========================================

-- Activer le RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes policies pour éviter les conflits
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create all notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can update all notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can delete all notifications" ON notifications;

-- Policy : Un utilisateur ne voit et ne modifie QUE ses propres notifications
-- SELECT : Voir ses propres notifications
CREATE POLICY "notifications_select_own"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT : Créer ses propres notifications (ou admin peut créer pour tous)
CREATE POLICY "notifications_insert_own_or_admin"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR is_admin()
  );

-- UPDATE : Modifier ses propres notifications (ou admin peut modifier toutes)
CREATE POLICY "notifications_update_own_or_admin"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR is_admin()
  );

-- DELETE : Supprimer ses propres notifications (ou admin peut supprimer toutes)
CREATE POLICY "notifications_delete_own_or_admin"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR is_admin()
  );

-- ========================================
-- 4. TABLE FAVORITES
-- ========================================

-- Activer le RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Supprimer toutes les anciennes policies pour éviter les conflits
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
DROP POLICY IF EXISTS "Admins can view all favorites" ON favorites;
DROP POLICY IF EXISTS "Admins can manage all favorites" ON favorites;

-- Policy : Un utilisateur ne voit et ne gère QUE ses propres favoris
-- SELECT : Voir ses propres favoris
CREATE POLICY "favorites_select_own"
  ON favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT : Ajouter ses propres favoris
CREATE POLICY "favorites_insert_own"
  ON favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE : Modifier ses propres favoris (ou admin peut modifier toutes)
-- Note: UPDATE rare sur favorites, mais inclus pour complétude
CREATE POLICY "favorites_update_own_or_admin"
  ON favorites
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR is_admin()
  );

-- DELETE : Supprimer ses propres favoris (ou admin peut supprimer toutes)
CREATE POLICY "favorites_delete_own_or_admin"
  ON favorites
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR is_admin()
  );

-- ========================================
-- 5. VÉRIFICATIONS POST-INSTALLATION
-- ========================================

-- Vérifier que le RLS est bien activé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS non activé sur profiles';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'notifications' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS non activé sur notifications';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'favorites' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS non activé sur favorites';
  END IF;
  
  RAISE NOTICE '✅ RLS activé avec succès sur toutes les tables';
END $$;

-- ========================================
-- FIN DU SCRIPT
-- ========================================
-- ✅ RLS réactivé sur profiles, notifications et favorites
-- ✅ Policies sécurisées avec droits admin via is_admin()
-- ✅ Fonction anti-récursion créée pour éviter les boucles infinies
-- 
-- 📝 NOTES IMPORTANTES:
-- - Les utilisateurs authentifiés peuvent voir tous les profils (nécessaire pour l'affichage public)
-- - Les utilisateurs ne peuvent modifier que leur propre profil
-- - Les admins ont accès complet via la fonction is_admin()
-- - Les notifications et favorites sont strictement privées (user_id = auth.uid())
-- - Les admins peuvent gérer toutes les notifications et favorites si nécessaire
-- ========================================

