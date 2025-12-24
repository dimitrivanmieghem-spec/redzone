-- ========================================
-- REDZONE - VÉRIFICATION DES POLITIQUES RLS
-- ========================================
-- Script pour vérifier et améliorer les politiques RLS (Row Level Security)
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase

-- ========================================
-- 1. VÉRIFIER QUE RLS EST ACTIVÉ SUR TOUTES LES TABLES SENSIBLES
-- ========================================

DO $$
DECLARE
  table_record RECORD;
  tables_without_rls TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('spatial_ref_sys') -- Exclure les tables système
  LOOP
    -- Vérifier si RLS est activé
    IF NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
      AND c.relname = table_record.tablename
      AND c.relrowsecurity = true
    ) THEN
      tables_without_rls := array_append(tables_without_rls, table_record.tablename);
    END IF;
  END LOOP;

  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE WARNING 'Tables sans RLS activé: %', array_to_string(tables_without_rls, ', ');
  ELSE
    RAISE NOTICE '✅ Toutes les tables ont RLS activé';
  END IF;
END $$;

-- ========================================
-- 2. VÉRIFIER LES POLITIQUES RLS PAR TABLE
-- ========================================

-- Fonction pour lister les politiques d'une table
CREATE OR REPLACE FUNCTION list_table_policies(table_name TEXT)
RETURNS TABLE (
  policy_name TEXT,
  policy_cmd TEXT,
  policy_roles TEXT[],
  policy_using TEXT,
  policy_with_check TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pol.polname::TEXT,
    CASE pol.polcmd
      WHEN 'r' THEN 'SELECT'
      WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE'
      WHEN 'd' THEN 'DELETE'
      ELSE 'ALL'
    END::TEXT,
    COALESCE(
      (SELECT array_agg(rolname::TEXT)
       FROM pg_roles
       WHERE oid = ANY(pol.polroles)),
      ARRAY['public']::TEXT[]
    ),
    pg_get_expr(pol.polqual, pol.polrelid)::TEXT,
    pg_get_expr(pol.polwithcheck, pol.polrelid)::TEXT
  FROM pg_policy pol
  JOIN pg_class pc ON pc.oid = pol.polrelid
  JOIN pg_namespace pn ON pn.oid = pc.relnamespace
  WHERE pn.nspname = 'public'
  AND pc.relname = table_name;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3. VÉRIFIER LES POLITIQUES DU STORAGE
-- ========================================

-- Vérifier que le bucket 'files' existe et a des politiques RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'files'
  ) THEN
    RAISE NOTICE '✅ Bucket "files" existe';
    
    -- Vérifier les politiques du storage
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE '%files%'
    ) THEN
      RAISE NOTICE '✅ Politiques RLS existent pour le storage';
    ELSE
      RAISE WARNING '⚠️ Aucune politique RLS trouvée pour le storage.objects';
    END IF;
  ELSE
    RAISE WARNING '⚠️ Bucket "files" n''existe pas';
  END IF;
END $$;

-- ========================================
-- 4. CRÉER DES POLITIQUES MANQUANTES (SI NÉCESSAIRE)
-- ========================================

-- Activer RLS sur les tables critiques si ce n'est pas déjà fait
DO $$
BEGIN
  -- Table profiles
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS activé sur profiles';
  END IF;

  -- Table vehicules
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vehicules') THEN
    ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS activé sur vehicules';
  END IF;

  -- Table messages
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS activé sur messages';
  END IF;

  -- Table conversations
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS activé sur conversations';
  END IF;

  -- Table favorites
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'favorites') THEN
    ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS activé sur favorites';
  END IF;

  -- Table saved_searches
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'saved_searches') THEN
    ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS activé sur saved_searches';
  END IF;

  -- Table audit_logs
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE '✅ RLS activé sur audit_logs';
  END IF;
END $$;

-- ========================================
-- 5. RAPPORT FINAL
-- ========================================

SELECT 
  'Vérification RLS terminée' AS status,
  NOW() AS checked_at;

