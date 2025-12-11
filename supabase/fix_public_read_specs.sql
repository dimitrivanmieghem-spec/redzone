-- ========================================
-- CORRECTIF URGENT : Lecture publique model_specs_db
-- ========================================
-- Ce script permet à TOUS (même non connectés) de lire les specs techniques
-- Nécessaire pour le pré-remplissage automatique du formulaire /sell

-- ========================================
-- 1. VÉRIFIER QUE LA TABLE EXISTE
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'model_specs_db'
  ) THEN
    RAISE EXCEPTION '❌ La table model_specs_db n''existe pas !';
  END IF;
END $$;

-- ========================================
-- 2. ACTIVER RLS (si pas déjà fait)
-- ========================================
ALTER TABLE model_specs_db ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. SUPPRIMER TOUTES LES ANCIENNES POLITIQUES
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
-- 4. CRÉER LA POLITIQUE DE LECTURE PUBLIQUE (CRITIQUE)
-- ========================================
-- Cette politique permet à TOUS (même utilisateurs anonymes) de lire les specs actives
CREATE POLICY "Public Read Specs"
  ON model_specs_db FOR SELECT
  USING (is_active = true);

-- ========================================
-- 5. CRÉER LES POLITIQUES ADMIN (modification uniquement)
-- ========================================
-- Seuls les admins peuvent modifier/ajouter/supprimer
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
-- 6. VÉRIFICATION
-- ========================================
-- Afficher les politiques créées
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Lecture publique'
    WHEN cmd IN ('INSERT', 'UPDATE', 'DELETE') THEN '✅ Modification admin'
    ELSE '❓'
  END AS description
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'model_specs_db'
ORDER BY cmd;

-- Test de lecture publique (devrait fonctionner même sans être connecté)
SELECT 
  'Test lecture publique' AS test,
  COUNT(*) AS nombre_specs_actives
FROM model_specs_db
WHERE is_active = true;

-- ========================================
-- ✅ CORRECTIF APPLIQUÉ
-- ========================================
-- La table model_specs_db est maintenant accessible en lecture publique
-- Le formulaire /sell devrait fonctionner correctement

