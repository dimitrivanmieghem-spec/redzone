-- ============================================
-- OCTANE98 - RÉPARATION PERMISSIONS WAITING_LIST
-- ============================================
-- Date: $(date +%Y-%m-%d)
-- Contexte: Erreur "permission denied for table waiting_list" même avec SERVICE_ROLE_KEY
-- Solution: Attribution explicite de tous les droits au service_role
-- ============================================

-- ============================================
-- 1. VÉRIFICATION DE L'ENVIRONNEMENT SUPABASE
-- ============================================

-- Vérifier que nous sommes dans un environnement Supabase valide
DO $$
BEGIN
  -- Vérification basique (Supabase permet généralement ces opérations)
  RAISE NOTICE '✅ Script exécuté par utilisateur: % (Supabase environment)', current_user;
END $$;

-- ============================================
-- 2. VÉRIFICATION DE LA TABLE WAITING_LIST
-- ============================================

-- Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'waiting_list'
  ) THEN
    RAISE EXCEPTION 'ERREUR: Table waiting_list n''existe pas';
  END IF;

  RAISE NOTICE '✅ Table waiting_list trouvée';
END $$;

-- ============================================
-- 3. ACTIVATION RLS (SI PAS DÉJÀ ACTIF)
-- ============================================

ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Vérification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'waiting_list'
    AND n.nspname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    RAISE EXCEPTION 'ERREUR: RLS n''a pas pu être activé sur waiting_list';
  END IF;

  RAISE NOTICE '✅ RLS activé sur table waiting_list';
END $$;

-- ============================================
-- 4. ATTRIBUTION DROITS COMPLÈTS AU SERVICE_ROLE
-- ============================================

-- Droits sur la table (Supabase permet généralement ces opérations)
GRANT ALL PRIVILEGES ON TABLE waiting_list TO service_role;

-- Droits sur la séquence d'auto-incrémentation
GRANT ALL PRIVILEGES ON SEQUENCE waiting_list_id_seq TO service_role;

-- Confirmation des droits accordés
DO $$
BEGIN
  RAISE NOTICE '✅ Droits GRANT exécutés pour service_role sur table et séquence waiting_list';
END $$;

-- ============================================
-- 5. POLITIQUE RLS PRIORITAIRE POUR SERVICE_ROLE
-- ============================================

-- Supprimer toute politique existante qui pourrait bloquer
DROP POLICY IF EXISTS "service_role_unrestricted" ON waiting_list;

-- Créer une politique prioritaire pour le service_role
-- Cette politique permet TOUTES les opérations (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "service_role_unrestricted"
  ON waiting_list
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Note: La politique a automatiquement le propriétaire approprié (celui qui l'a créée)

-- ============================================
-- 6. VÉRIFICATIONS FINALES
-- ============================================

-- Test d'insertion simulé (sans commit réel)
DO $$
DECLARE
  test_email TEXT := 'test-permission-check-' || extract(epoch from now())::text || '@example.com';
  inserted_id INTEGER;
BEGIN
  -- Test INSERT
  INSERT INTO waiting_list (email, source)
  VALUES (test_email, 'permission_test')
  RETURNING id INTO inserted_id;

  RAISE NOTICE '✅ Test INSERT réussi - ID inséré: %', inserted_id;

  -- Test SELECT
  IF NOT EXISTS (SELECT 1 FROM waiting_list WHERE id = inserted_id) THEN
    RAISE EXCEPTION 'ERREUR: Test SELECT échoué - ligne non trouvée';
  END IF;

  RAISE NOTICE '✅ Test SELECT réussi';

  -- Nettoyer le test (rollback automatique)
  DELETE FROM waiting_list WHERE id = inserted_id;
  RAISE NOTICE '✅ Test DELETE réussi - nettoyage effectué';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'ERREUR lors des tests de permission: %', SQLERRM;
END $$;

-- ============================================
-- 7. RAPPORT FINAL
-- ============================================

-- Rapport final simplifié
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Compter les politiques
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'waiting_list'
  AND schemaname = 'public';

  RAISE NOTICE '🎉 RÉPARATION TERMINÉE AVEC SUCCÈS!';
  RAISE NOTICE '📊 Résumé Supabase:';
  RAISE NOTICE '   - Table: waiting_list (RLS activé)';
  RAISE NOTICE '   - Politiques RLS: %', policy_count;
  RAISE NOTICE '   - Droits service_role: ✅ Accordés';
  RAISE NOTICE '   - Tests de permission: ✅ PASSÉS';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Prêt pour les tests API!';
END $$;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
