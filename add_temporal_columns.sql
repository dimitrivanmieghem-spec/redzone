-- =========================================
-- AJOUT COLONNES TEMPORELLES À model_specs_db
-- =========================================
-- Ajout des colonnes pour différencier les générations de véhicules
-- year_start, year_end, generation
-- =========================================

DO $$
BEGIN
  -- 1. Année de début de production (nullable)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'model_specs_db'
      AND column_name = 'year_start'
  ) THEN
    ALTER TABLE model_specs_db ADD COLUMN year_start INTEGER;
    COMMENT ON COLUMN model_specs_db.year_start IS 'Année de début de production du modèle';
  END IF;

  -- 2. Année de fin de production (nullable, null = modèle actuel)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'model_specs_db'
      AND column_name = 'year_end'
  ) THEN
    ALTER TABLE model_specs_db ADD COLUMN year_end INTEGER;
    COMMENT ON COLUMN model_specs_db.year_end IS 'Année de fin de production (null = modèle actuel)';
  END IF;

  -- 3. Génération/Phase (nullable, ex: 'Mk7 Phase 1')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'model_specs_db'
      AND column_name = 'generation'
  ) THEN
    ALTER TABLE model_specs_db ADD COLUMN generation TEXT;
    COMMENT ON COLUMN model_specs_db.generation IS 'Génération ou phase du modèle (ex: Mk7 Phase 1, Facelift)';
  END IF;

  RAISE NOTICE '✅ Colonnes temporelles ajoutées avec succès à model_specs_db';
END $$;

-- =========================================
-- INDEX POUR PERFORMANCES
-- =========================================

-- Index sur year_start pour filtrage rapide
CREATE INDEX IF NOT EXISTS idx_model_specs_db_year_start
ON model_specs_db(year_start) WHERE year_start IS NOT NULL;

-- Index sur year_end pour filtrage rapide
CREATE INDEX IF NOT EXISTS idx_model_specs_db_year_end
ON model_specs_db(year_end) WHERE year_end IS NOT NULL;

-- Index composite pour optimiser les requêtes génération + années
CREATE INDEX IF NOT EXISTS idx_model_specs_db_generation_years
ON model_specs_db(generation, year_start, year_end);

-- =========================================
-- EXEMPLES DE DONNÉES (À ADAPTER SELON VOS BESOINS)
-- =========================================
-- Ces exemples montrent comment différencier les générations
-- Décommentez et adaptez selon vos données existantes

/*
-- Volkswagen Golf 7 - Différenciation des phases
UPDATE model_specs_db
SET year_start = 2012, year_end = 2016, generation = 'Mk7 Phase 1'
WHERE marque ILIKE 'Volkswagen'
  AND modele ILIKE '%Golf 7%'
  AND (year_start IS NULL OR year_start = 2012);

UPDATE model_specs_db
SET year_start = 2016, year_end = 2020, generation = 'Mk7 Phase 2'
WHERE marque ILIKE 'Volkswagen'
  AND modele ILIKE '%Golf 7%'
  AND (year_start IS NULL OR year_start = 2016);

-- Porsche 911 - Différenciation des générations
UPDATE model_specs_db
SET year_start = 2011, year_end = 2016, generation = '991.1'
WHERE marque ILIKE 'Porsche'
  AND modele ILIKE '%911%'
  AND (year_start IS NULL OR year_start BETWEEN 2011 AND 2016);

UPDATE model_specs_db
SET year_start = 2016, year_end = 2023, generation = '991.2'
WHERE marque ILIKE 'Porsche'
  AND modele ILIKE '%911%'
  AND (year_start IS NULL OR year_start BETWEEN 2016 AND 2023);
*/

-- =========================================
-- VÉRIFICATION
-- =========================================

-- Vérifier que les colonnes ont été ajoutées
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'model_specs_db'
  AND column_name IN ('year_start', 'year_end', 'generation')
ORDER BY column_name;

-- =========================================
-- INSTRUCTIONS
-- =========================================
-- 1. Exécuter ce script dans Supabase SQL Editor
-- 2. Vérifier que les colonnes sont ajoutées avec la requête ci-dessus
-- 3. Mettre à jour les données existantes avec les bonnes années/générations
-- 4. Tester le filtrage temporel dans l'application
-- =========================================
