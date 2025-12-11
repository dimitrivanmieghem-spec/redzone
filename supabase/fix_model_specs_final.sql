-- ========================================
-- CORRECTIF FINAL : Lecture publique model_specs_db
-- ========================================
-- Ce script garantit que la table model_specs_db est accessible
-- en lecture publique pour le pré-remplissage du formulaire

-- ========================================
-- ÉTAPE 1 : Vérifier que la table existe
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'model_specs_db'
  ) THEN
    RAISE EXCEPTION '❌ La table model_specs_db n''existe pas ! Exécutez d''abord create_model_specs_db_table.sql';
  END IF;
END $$;

-- ========================================
-- ÉTAPE 2 : Activer RLS
-- ========================================
ALTER TABLE model_specs_db ENABLE ROW LEVEL SECURITY;

-- ========================================
-- ÉTAPE 3 : Supprimer toutes les politiques existantes
-- ========================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'model_specs_db'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON model_specs_db', pol.policyname);
    RAISE NOTICE 'Politique supprimée: %', pol.policyname;
  END LOOP;
END $$;

-- ========================================
-- ÉTAPE 4 : CRÉER LA POLITIQUE DE LECTURE PUBLIQUE (CRITIQUE)
-- ========================================
-- Cette politique permet à TOUS (même utilisateurs anonymes) de lire les specs actives
CREATE POLICY "Public can read active model specs"
  ON model_specs_db FOR SELECT
  USING (is_active = true);

-- ========================================
-- ÉTAPE 5 : Créer les politiques admin (modification uniquement)
-- ========================================
CREATE POLICY "Admins can insert model specs"
  ON model_specs_db FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update model specs"
  ON model_specs_db FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete model specs"
  ON model_specs_db FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- ÉTAPE 6 : VÉRIFICATION
-- ========================================
-- Afficher le résumé
SELECT 
  '✅ CORRECTIF APPLIQUÉ' AS status,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'model_specs_db' AND cmd = 'SELECT') AS policies_select,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'model_specs_db' AND cmd IN ('INSERT', 'UPDATE', 'DELETE')) AS policies_admin,
  (SELECT COUNT(*) FROM model_specs_db WHERE is_active = true) AS specs_actives;

-- Test de lecture publique
SELECT 
  'Test lecture publique' AS test,
  COUNT(*) AS nombre_specs_actives
FROM model_specs_db
WHERE is_active = true;

-- ========================================
-- ✅ FIN
-- ========================================
-- Si le test ci-dessus retourne un nombre > 0, la lecture publique fonctionne.
-- Le formulaire devrait maintenant pré-remplir automatiquement les champs.

