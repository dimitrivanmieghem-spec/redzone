-- ========================================
-- CORRECTIF URGENT : RLS model_specs_db
-- ========================================
-- Table : model_specs_db (ligne 200 de modelSpecs.ts)
-- Problème : Blocage RLS silencieux - erreur vide {}

-- ========================================
-- 1. SUPPRIMER TOUTES LES ANCIENNES POLITIQUES
-- ========================================
DROP POLICY IF EXISTS "Public Read Specs" ON model_specs_db;
DROP POLICY IF EXISTS "Public can read active model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Public can view active model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Anyone can view model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Admins can manage model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Admins can insert model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Admins can update model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Admins can delete model specs" ON model_specs_db;

-- ========================================
-- 2. ACTIVER RLS
-- ========================================
ALTER TABLE model_specs_db ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. CRÉER LA POLITIQUE DE LECTURE PUBLIQUE (CRITIQUE)
-- ========================================
-- Autorise SELECT pour anon ET authenticated
CREATE POLICY "Public Read Specs"
  ON model_specs_db FOR SELECT
  USING (is_active = true);

-- ========================================
-- 4. POLITIQUES ADMIN (modification uniquement)
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
-- 5. VÉRIFICATION
-- ========================================
SELECT 
  policyname,
  cmd,
  '✅ Politique créée' AS status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'model_specs_db'
ORDER BY cmd, policyname;

