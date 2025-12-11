-- ========================================
-- CORRECTIF URGENT : Lecture publique model_specs_db
-- ========================================
-- Ce script permet à TOUS (même non connectés) de lire les specs techniques
-- Nécessaire pour le pré-remplissage automatique du formulaire de création d'annonce

-- ========================================
-- 1. ACTIVER RLS (si pas déjà fait)
-- ========================================
ALTER TABLE model_specs_db ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. SUPPRIMER LES ANCIENNES POLITIQUES (nettoyage)
-- ========================================
DROP POLICY IF EXISTS "Anyone can view model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Public can view active model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Admins can manage model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Admins can insert model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Admins can update model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Admins can delete model specs" ON model_specs_db;

-- ========================================
-- 3. CRÉER LA POLITIQUE DE LECTURE PUBLIQUE (CRITIQUE)
-- ========================================
-- Cette politique permet à TOUS (même utilisateurs anonymes) de lire les specs actives
CREATE POLICY "Public can read active model specs"
  ON model_specs_db FOR SELECT
  USING (is_active = true);

-- ========================================
-- 4. CRÉER LES POLITIQUES ADMIN (modification uniquement)
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
-- 5. VÉRIFICATION
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
SELECT COUNT(*) AS total_specs_actives
FROM model_specs_db
WHERE is_active = true;

-- ========================================
-- ✅ CORRECTIF APPLIQUÉ
-- ========================================
-- La table model_specs_db est maintenant accessible en lecture publique
-- Le formulaire de création d'annonce devrait fonctionner correctement

