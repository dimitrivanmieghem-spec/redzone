-- ========================================
-- REDZONE - CORRECTIFS DE SÉCURITÉ CRITIQUES
-- ========================================
-- Script pour corriger les failles de sécurité identifiées dans l'audit
-- Exécutez ce script dans Supabase SQL Editor
-- 
-- ⚠️ IMPORTANT : Exécutez ce script APRÈS avoir vérifié votre configuration actuelle

-- ========================================
-- 1. CORRECTION TABLE PROFILES (CRITIQUE)
-- ========================================

-- Supprimer la politique trop permissive
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- Option A : Seuls les utilisateurs connectés peuvent voir les profils
-- (Masque les emails aux visiteurs non connectés)
CREATE POLICY "Authenticated users can view profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Option B : Si vous voulez que tout le monde voie les noms mais pas les emails complets
-- Décommentez cette section et commentez l'Option A ci-dessus
/*
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

-- Politique pour la vue (lecture publique)
GRANT SELECT ON public_profiles TO anon, authenticated;
*/

-- S'assurer que la politique INSERT est correcte
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ========================================
-- 2. VÉRIFIER LES CORRECTIFS STORAGE (CRITIQUE)
-- ========================================

-- Vérifier si la politique trop permissive existe encore
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can view files'
  ) THEN
    RAISE NOTICE '⚠️ ATTENTION : La politique "Anyone can view files" existe encore !';
    RAISE NOTICE 'Exécutez le script security_fixes.sql pour corriger le storage.';
  ELSE
    RAISE NOTICE '✅ La politique storage est correcte.';
  END IF;
END $$;

-- ========================================
-- 3. VÉRIFIER LES CORRECTIFS VEHICULES (MOYEN)
-- ========================================

-- Vérifier si la politique restrictive existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'vehicules' 
    AND policyname = 'Users can update own pending vehicles'
  ) THEN
    RAISE NOTICE '✅ La politique véhicules est correcte.';
  ELSE
    RAISE NOTICE '⚠️ ATTENTION : La politique restrictive pour véhicules n''existe pas !';
    RAISE NOTICE 'Exécutez le script security_fixes.sql pour corriger.';
    
    -- Appliquer le correctif automatiquement
    DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicules;
    
    CREATE POLICY "Users can update own pending vehicles"
      ON vehicules FOR UPDATE
      USING (
        auth.uid() = user_id 
        AND status = 'pending'  -- ⚠️ IMPORTANT : Seulement les véhicules en attente
      )
      WITH CHECK (
        auth.uid() = user_id 
        AND status = 'pending'  -- Empêcher de changer le statut
      );
    
    RAISE NOTICE '✅ Correctif appliqué automatiquement.';
  END IF;
END $$;

-- ========================================
-- 4. CORRECTION TABLE COMMENTS (OPTIONNEL)
-- ========================================

-- Permettre aux utilisateurs de supprimer leurs commentaires approuvés
DROP POLICY IF EXISTS "Users can delete own pending comments" ON comments;

-- Nouvelle politique : Les utilisateurs peuvent supprimer leurs propres commentaires (tous statuts)
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- 5. VÉRIFICATION FINALE
-- ========================================

-- Afficher toutes les politiques RLS pour vérification
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%auth.uid()%' OR qual LIKE '%auth.role()%' THEN '✅ Sécurisé'
    WHEN qual = 'true' THEN '⚠️ Permissif'
    ELSE '❓ À vérifier'
  END AS security_level
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'vehicules', 'comments', 'articles', 'app_logs', 'site_settings')
ORDER BY tablename, policyname;

-- ========================================
-- ✅ CORRECTIFS APPLIQUÉS
-- ========================================

