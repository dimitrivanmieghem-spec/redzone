-- ========================================
-- REDZONE - CORRECTIF RLS TABLE model_specs_db
-- ========================================
-- Ce script corrige les politiques RLS pour permettre la lecture publique
-- des spécifications de véhicules (nécessaire pour le formulaire de création d'annonce)
-- 
-- ⚠️ PROBLÈME : Après les correctifs de sécurité, la table model_specs_db
-- n'est plus accessible publiquement, ce qui empêche le pré-remplissage automatique
-- des champs techniques dans le formulaire.
--
-- ✅ SOLUTION : S'assurer que la lecture publique (SELECT) est autorisée
-- pour tous les utilisateurs (même non connectés) sur les specs actives.

-- ========================================
-- 1. DIAGNOSTIC : Vérifier l'état actuel
-- ========================================

-- Vérifier si la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'model_specs_db'
  ) THEN
    RAISE NOTICE '⚠️ La table model_specs_db n''existe pas !';
    RAISE NOTICE 'Exécutez d''abord le script create_model_specs_db_table.sql';
  ELSE
    RAISE NOTICE '✅ La table model_specs_db existe.';
  END IF;
END $$;

-- Vérifier si RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'model_specs_db';

-- Afficher les politiques existantes
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'model_specs_db'
ORDER BY policyname;

-- ========================================
-- 2. CORRECTIF : Recréer les politiques correctement
-- ========================================

-- S'assurer que RLS est activé
ALTER TABLE model_specs_db ENABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les politiques existantes pour repartir de zéro
DROP POLICY IF EXISTS "Anyone can view model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Admins can manage model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Public can view active model specs" ON model_specs_db;

-- ========================================
-- 3. CRÉER LES POLITIQUES CORRECTEMENT
-- ========================================

-- Politique 1 : LECTURE PUBLIQUE (SELECT) - PRIORITÉ 1
-- Permet à TOUS (même non connectés) de lire les specs actives
-- Cette politique doit être la première pour garantir l'accès public
CREATE POLICY "Public can view active model specs"
  ON model_specs_db FOR SELECT
  USING (is_active = true);

-- Politique 2 : MODIFICATION ADMIN (INSERT, UPDATE, DELETE) - PRIORITÉ 2
-- Permet uniquement aux admins de modifier les specs
-- Utilise FOR INSERT, UPDATE, DELETE (pas FOR ALL) pour éviter les conflits
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
-- 4. VÉRIFICATION POST-CORRECTIF
-- ========================================

-- Afficher les nouvelles politiques
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' AND qual LIKE '%is_active%' THEN '✅ Lecture publique OK'
    WHEN cmd IN ('INSERT', 'UPDATE', 'DELETE') AND qual LIKE '%admin%' THEN '✅ Modification admin OK'
    ELSE '❓ À vérifier'
  END AS status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'model_specs_db'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
    ELSE 5
  END,
  policyname;

-- Test de lecture publique (devrait retourner des résultats si la table contient des données)
-- Exécutez cette requête en tant qu'utilisateur anonyme pour tester
SELECT 
  COUNT(*) AS total_specs,
  COUNT(*) FILTER (WHERE is_active = true) AS active_specs
FROM model_specs_db;

-- ========================================
-- 5. NOTES IMPORTANTES
-- ========================================

-- ⚠️ Si la table est vide, vous devez importer les données depuis vehicleData.ts
-- Voir le script create_model_specs_db_table.sql pour un exemple d'import

-- ✅ Après ce correctif, les fonctions suivantes devraient fonctionner :
-- - getBrands() : Récupère les marques
-- - getModels() : Récupère les modèles
-- - getModelSpecs() : Récupère les specs complètes (utilisé dans le formulaire)

-- ========================================
-- ✅ CORRECTIF APPLIQUÉ
-- ========================================

