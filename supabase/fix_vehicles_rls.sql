-- ========================================
-- CORRECTION DES POLITIQUES RLS - TABLE VEHICULES
-- ========================================
-- 📅 Date: 2025-01-XX
-- 🎯 Objectif: Corriger les politiques RLS pour permettre l'insertion d'annonces
-- 
-- ⚠️ PROBLÈME IDENTIFIÉ:
-- La politique INSERT pour la table `vehicules` n'autorise pas correctement
-- les utilisateurs authentifiés à créer des annonces.
--
-- 🔧 SOLUTION:
-- - Réactiver RLS si désactivé
-- - Supprimer les anciennes politiques (éviter doublons)
-- - Recréer les politiques INSERT, SELECT, UPDATE, DELETE
-- ========================================

-- Activation de RLS sur la table vehicules
ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;

-- ========================================
-- NETTOYAGE : Suppression des anciennes politiques
-- ========================================

DROP POLICY IF EXISTS "Public can view active vehicules" ON vehicules;
DROP POLICY IF EXISTS "Users can view own vehicules" ON vehicules;
DROP POLICY IF EXISTS "Admins can view all vehicules" ON vehicules;
DROP POLICY IF EXISTS "Authenticated users can create vehicules" ON vehicules;
DROP POLICY IF EXISTS "Guests can create vehicules" ON vehicules;
DROP POLICY IF EXISTS "Users can update own vehicules" ON vehicules;
DROP POLICY IF EXISTS "Admins can update all vehicules" ON vehicules;
DROP POLICY IF EXISTS "Users can delete own vehicules" ON vehicules;
DROP POLICY IF EXISTS "Admins can delete all vehicules" ON vehicules;

-- ========================================
-- POLITIQUES SELECT (Lecture)
-- ========================================

-- 1. Le public peut voir les annonces actives (pour le site)
CREATE POLICY "Public can view active vehicules"
  ON vehicules FOR SELECT
  USING (status = 'active');

-- 2. Les utilisateurs peuvent voir leurs propres annonces (quel que soit le statut)
CREATE POLICY "Users can view own vehicules"
  ON vehicules FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Les admins peuvent voir toutes les annonces
CREATE POLICY "Admins can view all vehicules"
  ON vehicules FOR SELECT
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
--    avec leur propre user_id
CREATE POLICY "Authenticated users can create vehicules"
  ON vehicules FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id
  );

-- 2. Les invités (non authentifiés) peuvent créer des annonces
--    avec user_id = NULL (pour les annonces invitées)
--    Note: Cette politique nécessite que auth.uid() soit NULL
CREATE POLICY "Guests can create vehicules"
  ON vehicules FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL AND
    user_id IS NULL
  );

-- ========================================
-- POLITIQUES UPDATE (Modification)
-- ========================================

-- 1. Les utilisateurs peuvent modifier leurs propres annonces
CREATE POLICY "Users can update own vehicules"
  ON vehicules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Les admins peuvent modifier toutes les annonces
CREATE POLICY "Admins can update all vehicules"
  ON vehicules FOR UPDATE
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
CREATE POLICY "Users can delete own vehicules"
  ON vehicules FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Les admins peuvent supprimer toutes les annonces
CREATE POLICY "Admins can delete all vehicules"
  ON vehicules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- VÉRIFICATION FINALE
-- ========================================

-- Vérifier que RLS est activé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'vehicules'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS n''est pas activé sur la table vehicules';
  END IF;
  
  RAISE NOTICE '✅ RLS activé sur vehicules';
  RAISE NOTICE '✅ Politiques recréées avec succès';
END $$;

-- ========================================
-- NOTE SUR LES INVITÉS (NON AUTHENTIFIÉS)
-- ========================================
-- 
-- ⚠️ ATTENTION: Supabase RLS par défaut bloque les requêtes 
-- des utilisateurs non authentifiés (auth.uid() IS NULL).
-- 
-- Pour permettre aux invités de créer des annonces, il y a deux options:
-- 
-- 1. OPTION RECOMMANDÉE: Utiliser une Server Action (Server-Side)
--    - Les Server Actions s'exécutent avec les privilèges du service_role
--    - Elles peuvent bypasser RLS si nécessaire
--    - C'est la méthode la plus sécurisée
-- 
-- 2. OPTION ALTERNATIVE: Créer une fonction SECURITY DEFINER
--    - Permet d'exécuter avec des privilèges élevés
--    - Moins sécurisé mais peut être nécessaire selon l'architecture
-- 
-- La politique "Guests can create vehicules" ci-dessus peut ne pas 
-- fonctionner directement depuis le client si Supabase bloque les 
-- requêtes non authentifiées. Vérifiez que vos Server Actions utilisent
-- createServerClient() avec le service_role si nécessaire.

