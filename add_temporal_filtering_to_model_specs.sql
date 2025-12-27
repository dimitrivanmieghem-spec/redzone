-- =========================================
-- AJOUT FILTRAGE TEMPOREL À model_specs_db
-- =========================================
-- Ajout des colonnes pour différencier les générations :
-- year_start, year_end, generation
-- =========================================

DO $$
BEGIN
  -- 1. Année de début de production (obligatoire pour filtrage)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'model_specs_db'
      AND column_name = 'year_start'
  ) THEN
    ALTER TABLE model_specs_db ADD COLUMN year_start INTEGER;
    COMMENT ON COLUMN model_specs_db.year_start IS 'Année de début de production (obligatoire pour filtrage génération)';
  END IF;

  -- 2. Année de fin de production (null = modèle actuel)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'model_specs_db'
      AND column_name = 'year_end'
  ) THEN
    ALTER TABLE model_specs_db ADD COLUMN year_end INTEGER;
    COMMENT ON COLUMN model_specs_db.year_end IS 'Année de fin de production (null = modèle actuel)';
  END IF;

  -- 3. Génération/Phase (ex: 'Mk7 Phase 1', 'Facelift', 'Pre-Facelift')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'model_specs_db'
      AND column_name = 'generation'
  ) THEN
    ALTER TABLE model_specs_db ADD COLUMN generation TEXT;
    COMMENT ON COLUMN model_specs_db.generation IS 'Génération ou phase (ex: Mk7 Phase 1, Facelift, 991.2)';
  END IF;

  RAISE NOTICE '✅ Colonnes temporelles ajoutées avec succès à model_specs_db';
END $$;

-- =========================================
-- INDEX POUR PERFORMANCES
-- =========================================

-- Index sur year_start (filtrage fréquent)
CREATE INDEX IF NOT EXISTS idx_model_specs_db_year_start ON model_specs_db(year_start) WHERE year_start IS NOT NULL;

-- Index sur year_end (filtrage fréquent)
CREATE INDEX IF NOT EXISTS idx_model_specs_db_year_end ON model_specs_db(year_end) WHERE year_end IS NOT NULL;

-- Index composite pour filtrage génération + année
CREATE INDEX IF NOT EXISTS idx_model_specs_db_generation_years ON model_specs_db(generation, year_start, year_end);

-- =========================================
-- EXEMPLES DE MISE À JOUR DES DONNÉES EXISTANTES
-- =========================================
-- Ces exemples montrent comment différencier les générations
-- À adapter selon vos données réelles

-- Volkswagen Golf 7 (exemple de différenciation génération)
-- Golf 7 Phase 1 (2012-2016)
UPDATE model_specs_db
SET
  year_start = 2012,
  year_end = 2016,
  generation = 'Mk7 Phase 1'
WHERE marque ILIKE 'Volkswagen'
  AND modele ILIKE '%Golf 7%'
  AND type = 'car'
  AND (year_start IS NULL OR year_start = 2012);

-- Golf 7 Phase 2 / Facelift (2016-2020)
UPDATE model_specs_db
SET
  year_start = 2016,
  year_end = 2020,
  generation = 'Mk7 Phase 2'
WHERE marque ILIKE 'Volkswagen'
  AND modele ILIKE '%Golf 7%'
  AND type = 'car'
  AND (year_start IS NULL OR year_start = 2016);

-- Golf 8 (nouvelle génération, 2019-présent)
UPDATE model_specs_db
SET
  year_start = 2019,
  year_end = NULL, -- NULL = modèle actuel
  generation = 'Mk8'
WHERE marque ILIKE 'Volkswagen'
  AND modele ILIKE '%Golf 8%'
  AND type = 'car';

-- Porsche 911 (différenciation par génération)
-- 911 Type 991.1 (2011-2016)
UPDATE model_specs_db
SET
  year_start = 2011,
  year_end = 2016,
  generation = '991.1'
WHERE marque ILIKE 'Porsche'
  AND modele ILIKE '%911%'
  AND type = 'car'
  AND (year_start IS NULL OR year_start BETWEEN 2011 AND 2016);

-- 911 Type 991.2 (2016-2023)
UPDATE model_specs_db
SET
  year_start = 2016,
  year_end = 2023,
  generation = '991.2'
WHERE marque ILIKE 'Porsche'
  AND modele ILIKE '%911%'
  AND type = 'car'
  AND (year_start IS NULL OR year_start BETWEEN 2016 AND 2023);

-- =========================================
-- VÉRIFICATION
-- =========================================

-- Compter les modèles avec données temporelles
DO $$
DECLARE
  total_count INTEGER;
  with_temporal_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM model_specs_db WHERE is_active = true;
  SELECT COUNT(*) INTO with_temporal_count FROM model_specs_db WHERE year_start IS NOT NULL AND is_active = true;

  RAISE NOTICE '📊 État du filtrage temporel:';
  RAISE NOTICE '   Total modèles actifs: %', total_count;
  RAISE NOTICE '   Modèles avec données temporelles: %', with_temporal_count;
  RAISE NOTICE '   Complétude: %%%', ROUND((with_temporal_count::numeric / NULLIF(total_count, 0)) * 100, 1);
END $$;

-- =========================================
-- INSTRUCTIONS D'UTILISATION
-- =========================================
--
-- 1. Exécuter ce script dans Supabase SQL Editor
-- 2. Vérifier que les colonnes ont été ajoutées
-- 3. Mettre à jour les données existantes avec les bonnes années/générations
-- 4. Tester le filtrage dans l'interface admin
--
-- Pour différencier Golf 7R 2014 vs 2021 :
-- - 2014: generation = 'Mk7 Phase 1', year_start = 2012, year_end = 2016
-- - 2021: generation = 'Mk7 Phase 2', year_start = 2016, year_end = 2020
-- =========================================
