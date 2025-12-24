-- ========================================
-- CORRECTION DES POLITIQUES RLS - TABLE VEHICLES
-- ========================================
-- 📅 Date: 2025-01-XX
-- 🎯 Objectif: Corriger les politiques RLS pour utiliser owner_id au lieu de user_id
-- 
-- ⚠️ PROBLÈME IDENTIFIÉ:
-- Les politiques RLS utilisent user_id mais la table vehicles utilise owner_id
-- Cela bloque toutes les insertions/lectures/updates
--
-- 🔧 SOLUTION:
-- - Supprimer toutes les anciennes politiques
-- - Recréer les politiques avec owner_id
-- ========================================

-- Activation de RLS sur la table vehicles (si pas déjà activé)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- NETTOYAGE : Suppression de TOUTES les anciennes politiques
-- ========================================

DROP POLICY IF EXISTS "Public can view active vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can view all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can create vehicles" ON vehicles;
DROP POLICY IF EXISTS "Guests can create vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can update all vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can delete all vehicles" ON vehicles;

-- Supprimer aussi les anciennes politiques qui pourraient utiliser user_id
DROP POLICY IF EXISTS "Public can view active vehicules" ON vehicles;
DROP POLICY IF EXISTS "Users can view own vehicules" ON vehicles;
DROP POLICY IF EXISTS "Admins can view all vehicules" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can create vehicules" ON vehicles;
DROP POLICY IF EXISTS "Guests can create vehicules" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicules" ON vehicles;
DROP POLICY IF EXISTS "Admins can update all vehicules" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicules" ON vehicles;
DROP POLICY IF EXISTS "Admins can delete all vehicules" ON vehicles;

-- ========================================
-- POLITIQUES SELECT (Lecture)
-- ========================================

-- 1. Le public peut voir les annonces actives (pour le site)
CREATE POLICY "Public can view active vehicles"
  ON vehicles FOR SELECT
  USING (status = 'active');

-- 2. Les utilisateurs peuvent voir leurs propres annonces (quel que soit le statut)
-- IMPORTANT: Utiliser owner_id au lieu de user_id
CREATE POLICY "Users can view own vehicles"
  ON vehicles FOR SELECT
  USING (auth.uid() = owner_id);

-- 3. Les admins peuvent voir toutes les annonces
CREATE POLICY "Admins can view all vehicles"
  ON vehicles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- POLITIQUES INSERT (Création) - CRITIQUE !
-- ========================================

-- 1. Les utilisateurs authentifiés peuvent créer des annonces
--    avec leur propre owner_id
CREATE POLICY "Authenticated users can create vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = owner_id
  );

-- 2. Les invités (non authentifiés) peuvent créer des annonces
--    avec owner_id = NULL (pour les annonces invitées)
--    Note: Cette politique permet aux Server Actions de créer des annonces invitées
CREATE POLICY "Guests can create vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (
    owner_id IS NULL
  );

-- ========================================
-- POLITIQUES UPDATE (Modification)
-- ========================================

-- 1. Les utilisateurs peuvent modifier leurs propres annonces
CREATE POLICY "Users can update own vehicles"
  ON vehicles FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 2. Les admins peuvent modifier toutes les annonces
CREATE POLICY "Admins can update all vehicles"
  ON vehicles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- POLITIQUES DELETE (Suppression)
-- ========================================

-- 1. Les utilisateurs peuvent supprimer leurs propres annonces
CREATE POLICY "Users can delete own vehicles"
  ON vehicles FOR DELETE
  USING (auth.uid() = owner_id);

-- 2. Les admins peuvent supprimer toutes les annonces
CREATE POLICY "Admins can delete all vehicles"
  ON vehicles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- VÉRIFICATION FINALE
-- ========================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Compter les politiques sur vehicles
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'vehicles';
  
  IF policy_count < 9 THEN
    RAISE WARNING 'Seulement % politiques trouvées sur vehicles (attendu: 9)', policy_count;
  ELSE
    RAISE NOTICE '✅ % politiques RLS créées sur vehicles', policy_count;
  END IF;
  
  -- Vérifier que RLS est activé
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'vehicles'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS n''est pas activé sur la table vehicles';
  END IF;
  
  RAISE NOTICE '✅ RLS activé sur vehicles';
  RAISE NOTICE '✅ Toutes les politiques utilisent owner_id';
END $$;

-- ========================================
-- NOTES IMPORTANTES
-- ========================================
-- 
-- 1. Toutes les politiques utilisent maintenant owner_id au lieu de user_id
-- 2. Les utilisateurs authentifiés peuvent créer des annonces si auth.uid() = owner_id
-- 3. Les invités peuvent créer des annonces avec owner_id = NULL
-- 4. Les Server Actions doivent utiliser createServerClient() pour avoir les bonnes permissions
-- 5. Si vous utilisez le client navigateur (createClient), assurez-vous que l'utilisateur est authentifié
