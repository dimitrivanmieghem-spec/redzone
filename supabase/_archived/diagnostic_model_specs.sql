-- ========================================
-- DIAGNOSTIC : Vérification table model_specs_db
-- ========================================
-- Ce script vérifie que la table existe, contient des données
-- et que les politiques RLS sont correctement configurées

-- ========================================
-- 1. VÉRIFIER L'EXISTENCE DE LA TABLE
-- ========================================
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'model_specs_db'
    ) THEN '✅ Table model_specs_db existe'
    ELSE '❌ Table model_specs_db N''EXISTE PAS'
  END AS status_table;

-- ========================================
-- 2. VÉRIFIER RLS ET POLITIQUES
-- ========================================
SELECT 
  tablename,
  rowsecurity AS rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS activé'
    ELSE '❌ RLS DÉSACTIVÉ'
  END AS status_rls
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'model_specs_db';

-- Afficher toutes les politiques
SELECT 
  policyname,
  cmd,
  qual,
  CASE 
    WHEN cmd = 'SELECT' AND qual LIKE '%is_active%' THEN '✅ Lecture publique OK'
    WHEN cmd = 'SELECT' THEN '⚠️ Lecture publique - À vérifier'
    WHEN cmd IN ('INSERT', 'UPDATE', 'DELETE') THEN '✅ Modification admin'
    ELSE '❓'
  END AS status
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'model_specs_db'
ORDER BY cmd;

-- ========================================
-- 3. VÉRIFIER LES DONNÉES
-- ========================================
-- Compter le total de specs
SELECT 
  COUNT(*) AS total_specs,
  COUNT(*) FILTER (WHERE is_active = true) AS specs_actives,
  COUNT(*) FILTER (WHERE is_active = false) AS specs_inactives
FROM model_specs_db;

-- Vérifier un modèle spécifique (exemple: Golf 7R)
SELECT 
  marque,
  modele,
  type,
  ch,
  kw,
  cv_fiscaux,
  co2,
  cylindree,
  moteur,
  transmission,
  is_active
FROM model_specs_db
WHERE marque ILIKE '%volkswagen%' 
  AND modele ILIKE '%golf%'
  AND type = 'car'
ORDER BY modele
LIMIT 10;

-- ========================================
-- 4. TEST DE LECTURE PUBLIQUE
-- ========================================
-- Cette requête devrait fonctionner même en tant qu'utilisateur anonyme
SELECT 
  'Test lecture publique' AS test,
  COUNT(*) AS nombre_specs_actives
FROM model_specs_db
WHERE is_active = true;

-- ========================================
-- 5. VÉRIFIER LES COLONNES REQUISES
-- ========================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'model_specs_db'
  AND column_name IN ('marque', 'modele', 'type', 'ch', 'kw', 'cv_fiscaux', 'co2', 'cylindree', 'moteur', 'transmission', 'is_active', 'default_carrosserie')
ORDER BY ordinal_position;

-- ========================================
-- 6. RÉSUMÉ DIAGNOSTIC
-- ========================================
SELECT 
  'DIAGNOSTIC COMPLET' AS titre,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'model_specs_db')
      THEN '✅ Table existe'
    ELSE '❌ Table manquante'
  END AS table_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'model_specs_db' AND rowsecurity = true
    ) THEN '✅ RLS activé'
    ELSE '❌ RLS désactivé'
  END AS rls_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'model_specs_db' 
        AND cmd = 'SELECT'
        AND qual LIKE '%is_active%'
    ) THEN '✅ Politique SELECT publique existe'
    ELSE '❌ Politique SELECT publique manquante'
  END AS policy_status,
  (SELECT COUNT(*) FROM model_specs_db WHERE is_active = true) AS specs_actives_count;

