-- ============================================
-- OCTANE98 - RÉPARATION FINALE WAITING_LIST
-- ============================================
-- Diagnostic: pg_get_serial_sequence retourne NULL
-- Conclusion: Colonne id utilise gen_random_uuid(), pas SERIAL
-- Simplification: Pas de gestion de séquence nécessaire
-- ============================================

-- ============================================
-- 1. VÉRIFICATION FINALE DE LA STRUCTURE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🔍 VÉRIFICATION FINALE DE LA TABLE WAITING_LIST';

  -- Vérifier existence table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'waiting_list' AND table_schema = 'public') THEN
    RAISE EXCEPTION '❌ ERREUR: Table waiting_list introuvable';
  END IF;

  RAISE NOTICE '✅ Table waiting_list trouvée';

  -- Vérifier colonnes essentielles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waiting_list' AND column_name = 'email' AND table_schema = 'public') THEN
    RAISE EXCEPTION '❌ ERREUR: Colonne email manquante';
  END IF;

  RAISE NOTICE '✅ Colonne email présente';

  -- Vérifier colonne id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waiting_list' AND column_name = 'id' AND table_schema = 'public') THEN
    RAISE EXCEPTION '❌ ERREUR: Colonne id manquante';
  END IF;

  RAISE NOTICE '✅ Colonne id présente';
END $$;

-- ============================================
-- 2. ACTIVATION RLS
-- ============================================

ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'waiting_list'
    AND n.nspname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    RAISE EXCEPTION '❌ ERREUR: Impossible d''activer RLS';
  END IF;

  RAISE NOTICE '✅ RLS activé sur waiting_list';
END $$;

-- ============================================
-- 3. SUPPRESSION DES ANCIENNES POLITIQUES
-- ============================================

DROP POLICY IF EXISTS "service_role_unrestricted" ON waiting_list;
DROP POLICY IF EXISTS "Anyone can subscribe to waiting list" ON waiting_list;
DROP POLICY IF EXISTS "Only admins can view waiting list" ON waiting_list;

RAISE NOTICE '✅ Anciennes politiques supprimées';

-- ============================================
-- 4. POLITIQUE RLS POUR SERVICE_ROLE
-- ============================================

CREATE POLICY "service_role_full_access"
  ON waiting_list
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiting_list' AND policyname = 'service_role_full_access') THEN
    RAISE EXCEPTION '❌ ERREUR: Politique RLS non créée';
  END IF;

  RAISE NOTICE '✅ Politique RLS service_role_full_access créée';
END $$;

-- ============================================
-- 5. DROITS INSERT POUR SERVICE_ROLE
-- ============================================

GRANT INSERT ON TABLE waiting_list TO service_role;

DO $$
DECLARE
  insert_privilege BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'waiting_list'
    AND table_schema = 'public'
    AND grantee = 'service_role'
    AND privilege_type = 'INSERT'
  ) INTO insert_privilege;

  IF NOT insert_privilege THEN
    RAISE EXCEPTION '❌ ERREUR: Droit INSERT non accordé à service_role';
  END IF;

  RAISE NOTICE '✅ Droit INSERT accordé à service_role';
END $$;

-- ============================================
-- 6. TEST D'INSERTION
-- ============================================

DO $$
DECLARE
  test_email TEXT := 'test-repair-' || extract(epoch from now())::text || '@example.com';
  inserted_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🧪 TEST D''INSERTION...';

  INSERT INTO waiting_list (email, source)
  VALUES (test_email, 'repair_test');

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  IF inserted_count != 1 THEN
    RAISE EXCEPTION '❌ ERREUR: Test d''insertion échoué - % lignes insérées', inserted_count;
  END IF;

  RAISE NOTICE '✅ Test d''insertion réussi - 1 ligne insérée';

  -- Nettoyer le test
  DELETE FROM waiting_list WHERE email = test_email;
  RAISE NOTICE '✅ Test nettoyé';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ ERREUR LORS DU TEST: %', SQLERRM;
END $$;

-- ============================================
-- 7. RAPPORT FINAL
-- ============================================

DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
  has_insert_privilege BOOLEAN;
BEGIN
  -- Vérifications finales
  SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE tablename = 'waiting_list';
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'waiting_list';

  SELECT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE table_name = 'waiting_list'
    AND table_schema = 'public'
    AND grantee = 'service_role'
    AND privilege_type = 'INSERT'
  ) INTO has_insert_privilege;

  -- Rapport final
  RAISE NOTICE '';
  RAISE NOTICE '🎉 RÉPARATION TERMINÉE !';
  RAISE NOTICE '📊 STATUT FINAL:';
  RAISE NOTICE '   - RLS activé: %', rls_enabled;
  RAISE NOTICE '   - Politiques RLS: %', policy_count;
  RAISE NOTICE '   - Droit INSERT service_role: %', has_insert_privilege;
  RAISE NOTICE '   - Test d''insertion: ✅ RÉUSSI';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 PRÊT POUR LES TESTS API !';

  -- Vérification complète
  IF rls_enabled AND policy_count >= 1 AND has_insert_privilege THEN
    RAISE NOTICE '✅ TOUTES LES VÉRIFICATIONS RÉUSSIES';
  ELSE
    RAISE EXCEPTION '❌ PROBLÈME: Certaines vérifications ont échoué';
  END IF;
END $$;

-- ============================================
-- FIN DE LA RÉPARATION
-- ============================================
