-- =========================================
-- MIGRATION SÛRE : AJOUT COLONNES TEMPORELLES À model_specs_db
-- Vérifie l'existence avant d'ajouter (Safe Migration)
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
    RAISE NOTICE '✅ Colonne year_start ajoutée à model_specs_db';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne year_start existe déjà dans model_specs_db';
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
    RAISE NOTICE '✅ Colonne year_end ajoutée à model_specs_db';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne year_end existe déjà dans model_specs_db';
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
    RAISE NOTICE '✅ Colonne generation ajoutée à model_specs_db';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne generation existe déjà dans model_specs_db';
  END IF;

  -- 4. Index pour les performances (si les colonnes existent)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'model_specs_db'
      AND column_name = 'year_start'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_model_specs_db_year_start ON model_specs_db(year_start) WHERE year_start IS NOT NULL;
    RAISE NOTICE '✅ Index idx_model_specs_db_year_start créé ou existant';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'model_specs_db'
      AND column_name = 'year_end'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_model_specs_db_year_end ON model_specs_db(year_end) WHERE year_end IS NOT NULL;
    RAISE NOTICE '✅ Index idx_model_specs_db_year_end créé ou existant';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'model_specs_db'
      AND column_name = 'generation'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_model_specs_db_generation ON model_specs_db(generation) WHERE generation IS NOT NULL;
    RAISE NOTICE '✅ Index idx_model_specs_db_generation créé ou existant';
  END IF;

  RAISE NOTICE '🎉 Migration temporelle terminée avec succès pour model_specs_db';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Erreur lors de la migration temporelle: %', SQLERRM;
END $$;
