-- ========================================
-- REDZONE - FIX PERMISSIONS RLS
-- ========================================
-- Script SQL idempotent pour corriger les permissions RLS
-- Autorise la lecture publique sur les tables référentielles (brands, taxes_rules)
-- Accorde les permissions sur les fonctions RPC (quotas)
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- ========================================

-- ========================================
-- 1. TABLE BRANDS (Lecture Publique)
-- ========================================

-- Activer RLS si pas déjà activé
ALTER TABLE IF EXISTS brands ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent (pour éviter les conflits)
DROP POLICY IF EXISTS "Anyone can view brands" ON brands;
DROP POLICY IF EXISTS "Public Read" ON brands;
DROP POLICY IF EXISTS "brands_public_read" ON brands;

-- Créer la politique de lecture publique
CREATE POLICY "Public Read" 
  ON public.brands 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- Accorder les permissions SELECT
GRANT SELECT ON public.brands TO anon;
GRANT SELECT ON public.brands TO authenticated;

-- Commentaire pour documentation
COMMENT ON POLICY "Public Read" ON brands IS 'Permet la lecture publique de la table brands pour tous les utilisateurs (anon et authenticated)';

-- ========================================
-- 2. TABLE TAXES_RULES (Lecture Publique)
-- ========================================

-- Activer RLS si pas déjà activé
ALTER TABLE IF EXISTS taxes_rules ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent (pour éviter les conflits)
DROP POLICY IF EXISTS "Anyone can view taxes rules" ON taxes_rules;
DROP POLICY IF EXISTS "Public Read" ON taxes_rules;
DROP POLICY IF EXISTS "taxes_rules_public_read" ON taxes_rules;

-- Créer la politique de lecture publique (uniquement pour les règles actives)
CREATE POLICY "Public Read" 
  ON public.taxes_rules 
  FOR SELECT 
  TO anon, authenticated 
  USING (is_active = true);

-- Accorder les permissions SELECT
GRANT SELECT ON public.taxes_rules TO anon;
GRANT SELECT ON public.taxes_rules TO authenticated;

-- Commentaire pour documentation
COMMENT ON POLICY "Public Read" ON taxes_rules IS 'Permet la lecture publique de la table taxes_rules pour tous les utilisateurs (anon et authenticated) - Uniquement les règles actives';

-- ========================================
-- 3. FONCTIONS RPC (Quotas)
-- ========================================
-- Accorder l'exécution aux fonctions RPC pour les quotas

-- Fonction can_create_advert
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'can_create_advert'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.can_create_advert(UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.can_create_advert(UUID) TO anon;
    RAISE NOTICE 'Permissions accordées sur can_create_advert';
  ELSE
    RAISE NOTICE 'Fonction can_create_advert n''existe pas encore';
  END IF;
END $$;

-- Fonction get_user_quota_info
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'get_user_quota_info'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.get_user_quota_info(UUID) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.get_user_quota_info(UUID) TO anon;
    RAISE NOTICE 'Permissions accordées sur get_user_quota_info';
  ELSE
    RAISE NOTICE 'Fonction get_user_quota_info n''existe pas encore';
  END IF;
END $$;

-- ========================================
-- 4. VÉRIFICATION FINALE
-- ========================================

DO $$ 
DECLARE
  brands_policy_exists BOOLEAN;
  taxes_policy_exists BOOLEAN;
  can_create_granted BOOLEAN;
  quota_info_granted BOOLEAN;
BEGIN
  -- Vérifier les politiques
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'brands' 
    AND policyname = 'Public Read'
  ) INTO brands_policy_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'taxes_rules' 
    AND policyname = 'Public Read'
  ) INTO taxes_policy_exists;
  
  -- Vérifier les permissions sur les fonctions
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges
    WHERE routine_schema = 'public'
    AND routine_name = 'can_create_advert'
    AND grantee IN ('authenticated', 'anon')
  ) INTO can_create_granted;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routine_privileges
    WHERE routine_schema = 'public'
    AND routine_name = 'get_user_quota_info'
    AND grantee IN ('authenticated', 'anon')
  ) INTO quota_info_granted;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REDZONE - FIX PERMISSIONS COMPLÉTÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Politique brands : %', CASE WHEN brands_policy_exists THEN 'CRÉÉE' ELSE 'MANQUANTE' END;
  RAISE NOTICE '✅ Politique taxes_rules : %', CASE WHEN taxes_policy_exists THEN 'CRÉÉE' ELSE 'MANQUANTE' END;
  RAISE NOTICE '✅ Permission can_create_advert : %', CASE WHEN can_create_granted THEN 'ACCORDÉE' ELSE 'MANQUANTE' END;
  RAISE NOTICE '✅ Permission get_user_quota_info : %', CASE WHEN quota_info_granted THEN 'ACCORDÉE' ELSE 'MANQUANTE' END;
  RAISE NOTICE '========================================';
END $$;

