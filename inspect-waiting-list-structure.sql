-- ============================================
-- OCTANE98 - INSPECTION STRUCTURE WAITING_LIST
-- ============================================
-- Date: $(date +%Y-%m-%d)
-- Mission: Diagnostic complet avant réparation
-- Type: LECTURE SEULE - Aucune modification
-- ============================================

-- ============================================
-- 1. LOCALISATION DE LA TABLE
-- ============================================

-- Vérifier l'existence et l'emplacement de la table
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'waiting_list'
ORDER BY schemaname;

-- ============================================
-- 2. STRUCTURE DÉTAILLÉE DE LA TABLE
-- ============================================

-- Colonnes, types, contraintes
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_name = 'waiting_list'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 3. CONTRAINTES ET INDEX
-- ============================================

-- Contraintes de table
SELECT
  conname as constraint_name,
  contype as constraint_type,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'waiting_list'::regclass;

-- Index existants
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'waiting_list';

-- ============================================
-- 4. POLITIQUES RLS (ROW LEVEL SECURITY)
-- ============================================

-- État RLS de la table
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'waiting_list';

-- Politiques RLS détaillées
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'waiting_list';

-- ============================================
-- 5. PRIVILÈGES (GRANTS) PAR RÔLE
-- ============================================

-- Privilèges pour le rôle service_role
SELECT
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'waiting_list'
  AND table_schema = 'public'
  AND grantee = 'service_role'
ORDER BY privilege_type;

-- Privilèges pour le rôle anon
SELECT
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'waiting_list'
  AND table_schema = 'public'
  AND grantee = 'anon'
ORDER BY privilege_type;

-- Privilèges pour le rôle authenticated
SELECT
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_name = 'waiting_list'
  AND table_schema = 'public'
  AND grantee = 'authenticated'
ORDER BY privilege_type;

-- ============================================
-- 6. SÉQUENCES ASSOCIÉES
-- ============================================

-- Séquence liée à la colonne id (si elle existe)
SELECT
  pg_get_serial_sequence('waiting_list', 'id') as sequence_name;

-- Si une séquence est trouvée, vérifier ses propriétés
DO $$
DECLARE
  seq_name TEXT;
BEGIN
  SELECT pg_get_serial_sequence('waiting_list', 'id') INTO seq_name;

  IF seq_name IS NOT NULL THEN
    RAISE NOTICE 'Séquence détectée: %', seq_name;

    -- Propriétés de la séquence
    EXECUTE format('
      SELECT
        sequence_name,
        data_type,
        start_value,
        increment,
        maximum_value,
        minimum_value,
        cycle_option
      FROM information_schema.sequences
      WHERE sequence_name = %L
    ', split_part(seq_name, '.', 2));

    -- Privilèges sur la séquence pour service_role
    EXECUTE format('
      SELECT
        grantee,
        privilege_type,
        is_grantable
      FROM information_schema.role_usage_grants
      WHERE object_name = %L
        AND object_schema = %L
        AND grantee = %L
    ', split_part(seq_name, '.', 2), split_part(seq_name, '.', 1), 'service_role');

  ELSE
    RAISE NOTICE 'Aucune séquence trouvée pour waiting_list.id';
  END IF;
END $$;

-- ============================================
-- 7. DONNÉES DE TEST (ANALYSE)
-- ============================================

-- Nombre total d'enregistrements
SELECT
  COUNT(*) as total_records,
  COUNT(DISTINCT email) as unique_emails,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM waiting_list;

-- Échantillon des données récentes (sans exposer les emails)
SELECT
  LEFT(email, 3) || '***' || RIGHT(email, 10) as masked_email,
  source,
  created_at
FROM waiting_list
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 8. COMPARAISON AVEC LE CODE APPLICATION
-- ============================================

-- Rappel du payload envoyé par l'application
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== RAPPEL DU PAYLOAD APPLICATION ===';
  RAISE NOTICE 'L''application envoie:';
  RAISE NOTICE '  - email: string (normalisé en lowercase, trim)';
  RAISE NOTICE '  - source: "website" (valeur fixe)';
  RAISE NOTICE '';
  RAISE NOTICE 'Colonnes attendues dans la table:';
  RAISE NOTICE '  - id: auto-généré (séquence)';
  RAISE NOTICE '  - email: NOT NULL';
  RAISE NOTICE '  - source: valeur par défaut "website"';
  RAISE NOTICE '  - created_at: auto-généré (NOW())';
END $$;

-- ============================================
-- 9. RAPPORT DE DIAGNOSTIC
-- ============================================

DO $$
DECLARE
  table_exists BOOLEAN := FALSE;
  rls_enabled BOOLEAN := FALSE;
  policy_count INTEGER := 0;
  service_privileges TEXT := '';
  seq_accessible BOOLEAN := FALSE;
BEGIN
  -- Vérifications de base
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'waiting_list' AND table_schema = 'public'
  ) INTO table_exists;

  IF table_exists THEN
    SELECT rowsecurity INTO rls_enabled
    FROM pg_tables
    WHERE tablename = 'waiting_list';

    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'waiting_list';

    SELECT string_agg(privilege_type, ', ') INTO service_privileges
    FROM information_schema.role_table_grants
    WHERE table_name = 'waiting_list'
      AND table_schema = 'public'
      AND grantee = 'service_role';
  END IF;

  -- Rapport final
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RAPPORT DE DIAGNOSTIC - WAITING_LIST';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table existe: %', table_exists;
  RAISE NOTICE 'RLS activé: %', rls_enabled;
  RAISE NOTICE 'Nombre de politiques RLS: %', policy_count;
  RAISE NOTICE 'Privilèges service_role: %', COALESCE(service_privileges, 'AUCUN');

  IF NOT table_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ PROBLÈME: Table waiting_list introuvable';
    RAISE NOTICE '   Solution: Créer la table d''abord';
  ELSIF NOT rls_enabled THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  AVERTISSEMENT: RLS non activé sur waiting_list';
    RAISE NOTICE '   Cela peut expliquer les erreurs de permission';
  ELSIF policy_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  AVERTISSEMENT: Aucune politique RLS définie';
    RAISE NOTICE '   Le service_role peut ne pas avoir accès en lecture/écriture';
  ELSIF service_privileges = '' THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ PROBLÈME: Aucun privilège pour service_role';
    RAISE NOTICE '   C''est probablement la cause de "permission denied"';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ Configuration semble correcte';
    RAISE NOTICE '   Vérifier les logs détaillés ci-dessus pour confirmation';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- FIN DU SCRIPT D'INSPECTION
-- ============================================
