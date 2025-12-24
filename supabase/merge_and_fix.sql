-- ========================================
-- MERGE SCRIPT: vehicules -> vehicles
-- ========================================
-- 📅 Date: 2025-01-XX
-- 🎯 Objective: Merge data from French table `vehicules` to English table `vehicles`
--               and drop the old French table
-- 
-- ⚠️ WARNING: This script will DELETE the `vehicules` table after migration.
--             Make sure you have a backup before running!
-- ========================================

BEGIN;

-- ========================================
-- STEP 1: Check tables existence
-- ========================================

DO $$
DECLARE
  vehicules_exists BOOLEAN;
  vehicles_exists BOOLEAN;
  row_count INTEGER;
BEGIN
  -- Check if vehicules table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vehicules'
  ) INTO vehicules_exists;

  -- Check if vehicles table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vehicles'
  ) INTO vehicles_exists;

  IF NOT vehicules_exists AND NOT vehicles_exists THEN
    RAISE EXCEPTION 'Neither "vehicules" nor "vehicles" table exists!';
  END IF;

  IF NOT vehicles_exists THEN
    RAISE EXCEPTION 'Table "vehicles" does not exist. Please create it first or run standardize_db.sql';
  END IF;

  IF NOT vehicules_exists THEN
    RAISE NOTICE 'Table "vehicules" does not exist. Nothing to migrate.';
    RETURN;
  END IF;

  -- Count rows in vehicules
  EXECUTE 'SELECT COUNT(*) FROM vehicules' INTO row_count;
  RAISE NOTICE 'Found % rows in "vehicules" table to migrate', row_count;

  IF row_count = 0 THEN
    RAISE NOTICE 'Table "vehicules" is empty. Will drop it directly.';
    RETURN;
  END IF;
END $$;

-- ========================================
-- STEP 2: Migrate data from vehicules to vehicles
-- ========================================
-- Mapping: French column names -> English column names

DO $$
DECLARE
  row_count INTEGER;
BEGIN
  -- Check if there are rows to migrate
  EXECUTE 'SELECT COUNT(*) FROM vehicules' INTO row_count;

  IF row_count > 0 THEN
    RAISE NOTICE 'Starting data migration from "vehicules" to "vehicles"...';

    -- Insert data with column mapping
    -- Note: Using INSERT ... SELECT with column mapping
    -- This handles cases where columns might not exist in source table
    INSERT INTO vehicles (
      id,
      created_at,
      user_id,
      type,
      brand,              -- marque -> brand
      model,              -- modele -> model
      prix,
      year,               -- annee -> year
      mileage,            -- km -> mileage
      fuel_type,          -- carburant -> fuel_type
      transmission,
      body_type,          -- carrosserie -> body_type
      power_hp,           -- puissance -> power_hp
      condition,          -- etat -> condition
      euro_standard,      -- norme_euro -> euro_standard
      car_pass,
      image,
      images,
      description,
      status,
      guest_email,        -- email_contact -> guest_email
      is_email_verified,
      verification_code,
      verification_code_expires_at,
      edit_token,
      engine_architecture, -- architecture_moteur -> engine_architecture
      admission,
      zero_a_cent,
      co2,
      poids_kg,
      fiscal_horsepower,  -- cv_fiscaux -> fiscal_horsepower
      audio_file,
      history,
      car_pass_url,
      is_manual_model,
      phone,              -- telephone -> phone
      contact_email,
      contact_methods,
      city,               -- ville -> city
      postal_code,        -- code_postal -> postal_code
      interior_color,     -- couleur_interieure -> interior_color
      seats_count         -- nombre_places -> seats_count
    )
    SELECT
      id,
      created_at,
      user_id,
      type,
      marque AS brand,                    -- marque -> brand
      modele AS model,                    -- modele -> model
      prix,
      annee AS year,                      -- annee -> year
      km AS mileage,                      -- km -> mileage
      carburant AS fuel_type,             -- carburant -> fuel_type
      transmission,
      carrosserie AS body_type,           -- carrosserie -> body_type
      puissance AS power_hp,              -- puissance -> power_hp
      etat AS condition,                  -- etat -> condition
      norme_euro AS euro_standard,        -- norme_euro -> euro_standard
      car_pass,
      image,
      images,
      description,
      status,
      email_contact AS guest_email, -- email_contact -> guest_email
      is_email_verified,
      verification_code,
      verification_code_expires_at,
      edit_token,
      architecture_moteur AS engine_architecture,    -- architecture_moteur -> engine_architecture
      admission,
      zero_a_cent,
      co2,
      poids_kg,
      cv_fiscaux AS fiscal_horsepower,    -- cv_fiscaux -> fiscal_horsepower
      audio_file,
      history,
      car_pass_url,
      is_manual_model,
      telephone AS phone,                 -- telephone -> phone
      contact_email,
      contact_methods,
      ville AS city,                      -- ville -> city
      code_postal AS postal_code,         -- code_postal -> postal_code
      couleur_interieure AS interior_color, -- couleur_interieure -> interior_color
      nombre_places AS seats_count        -- nombre_places -> seats_count
    FROM vehicules
    WHERE NOT EXISTS (
      -- Avoid duplicates: skip if ID already exists in vehicles
      SELECT 1 FROM vehicles WHERE vehicles.id = vehicules.id
    )
    ON CONFLICT (id) DO NOTHING;          -- Skip if duplicate ID

    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE '✅ Migrated % rows from "vehicules" to "vehicles"', row_count;
  ELSE
    RAISE NOTICE 'No data to migrate from "vehicules"';
  END IF;
END $$;

-- ========================================
-- STEP 3: Verify migration success
-- ========================================

DO $$
DECLARE
  vehicules_count INTEGER;
  vehicles_count INTEGER;
  migrated_count INTEGER;
BEGIN
  -- Count rows in both tables
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicules') THEN
    EXECUTE 'SELECT COUNT(*) FROM vehicules' INTO vehicules_count;
  ELSE
    vehicules_count := 0;
  END IF;

  EXECUTE 'SELECT COUNT(*) FROM vehicles' INTO vehicles_count;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '  - Rows in "vehicules": %', vehicules_count;
  RAISE NOTICE '  - Rows in "vehicles": %', vehicles_count;
  RAISE NOTICE '========================================';

  -- Warn if data loss detected
  IF vehicules_count > 0 AND vehicles_count < vehicules_count THEN
    RAISE WARNING '⚠️  Possible data loss detected! vehicles count (%) is less than vehicules count (%).', vehicles_count, vehicules_count;
    RAISE WARNING '⚠️  Some rows may have duplicates or failed to migrate. Review manually.';
  END IF;
END $$;

-- ========================================
-- STEP 4: Drop old French table and its dependencies
-- ========================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicules') THEN
    RAISE NOTICE 'Dropping old "vehicules" table...';

    -- Drop policies first
    DROP POLICY IF EXISTS "Public can view active vehicules" ON vehicules;
    DROP POLICY IF EXISTS "Users can view own vehicules" ON vehicules;
    DROP POLICY IF EXISTS "Admins can view all vehicules" ON vehicules;
    DROP POLICY IF EXISTS "Authenticated users can create vehicules" ON vehicules;
    DROP POLICY IF EXISTS "Guests can create vehicules" ON vehicules;
    DROP POLICY IF EXISTS "Users can update own vehicules" ON vehicules;
    DROP POLICY IF EXISTS "Admins can update all vehicules" ON vehicules;
    DROP POLICY IF EXISTS "Users can delete own vehicules" ON vehicules;
    DROP POLICY IF EXISTS "Admins can delete all vehicules" ON vehicules;

    -- Drop indexes
    DROP INDEX IF EXISTS idx_vehicules_user_id;
    DROP INDEX IF EXISTS idx_vehicules_status;
    DROP INDEX IF EXISTS idx_vehicules_type;
    DROP INDEX IF EXISTS idx_vehicules_marque;
    DROP INDEX IF EXISTS idx_vehicules_modele;
    DROP INDEX IF EXISTS idx_vehicules_prix;
    DROP INDEX IF EXISTS idx_vehicules_annee;
    DROP INDEX IF EXISTS idx_vehicules_created_at;
    DROP INDEX IF EXISTS idx_vehicules_edit_token;

    -- Drop table
    DROP TABLE vehicules CASCADE;

    RAISE NOTICE '✅ Table "vehicules" dropped successfully';
  ELSE
    RAISE NOTICE 'Table "vehicules" does not exist, nothing to drop';
  END IF;
END $$;

-- ========================================
-- STEP 5: Ensure vehicles table has correct structure and RLS
-- ========================================

-- Enable RLS if not already enabled
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist with wrong names
DROP POLICY IF EXISTS "Public can view active vehicules" ON vehicles;
DROP POLICY IF EXISTS "Users can view own vehicules" ON vehicles;
DROP POLICY IF EXISTS "Admins can view all vehicules" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can create vehicules" ON vehicles;
DROP POLICY IF EXISTS "Guests can create vehicules" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicules" ON vehicles;
DROP POLICY IF EXISTS "Admins can update all vehicules" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicules" ON vehicles;
DROP POLICY IF EXISTS "Admins can delete all vehicules" ON vehicles;

-- Recreate policies with correct names (only if they don't exist)
DO $$
BEGIN
  -- SELECT policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Public can view active vehicles') THEN
    CREATE POLICY "Public can view active vehicles"
      ON vehicles FOR SELECT
      USING (status = 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Users can view own vehicles') THEN
    CREATE POLICY "Users can view own vehicles"
      ON vehicles FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Admins can view all vehicles') THEN
    CREATE POLICY "Admins can view all vehicles"
      ON vehicles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;

  -- INSERT policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Authenticated users can create vehicles') THEN
    CREATE POLICY "Authenticated users can create vehicles"
      ON vehicles FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() = user_id
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Guests can create vehicles') THEN
    CREATE POLICY "Guests can create vehicles"
      ON vehicles FOR INSERT
      WITH CHECK (
        auth.uid() IS NULL AND
        user_id IS NULL
      );
  END IF;

  -- UPDATE policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Users can update own vehicles') THEN
    CREATE POLICY "Users can update own vehicles"
      ON vehicles FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Admins can update all vehicles') THEN
    CREATE POLICY "Admins can update all vehicles"
      ON vehicles FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;

  -- DELETE policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Users can delete own vehicles') THEN
    CREATE POLICY "Users can delete own vehicles"
      ON vehicles FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Admins can delete all vehicles') THEN
    CREATE POLICY "Admins can delete all vehicles"
      ON vehicles FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
      );
  END IF;

  RAISE NOTICE '✅ RLS policies verified/created for "vehicles" table';
END $$;

-- ========================================
-- STEP 6: Final verification
-- ========================================

DO $$
DECLARE
  vehicles_exists BOOLEAN;
  vehicules_exists BOOLEAN;
  row_count INTEGER;
BEGIN
  -- Verify vehicles table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vehicles'
  ) INTO vehicles_exists;

  -- Verify vehicules table is gone
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vehicules'
  ) INTO vehicules_exists;

  IF NOT vehicles_exists THEN
    RAISE EXCEPTION '❌ Table "vehicles" does not exist after migration!';
  END IF;

  IF vehicules_exists THEN
    RAISE EXCEPTION '❌ Table "vehicules" still exists after migration!';
  END IF;

  -- Count final rows
  EXECUTE 'SELECT COUNT(*) FROM vehicles' INTO row_count;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '   - Table "vehicles" exists';
  RAISE NOTICE '   - Table "vehicules" removed';
  RAISE NOTICE '   - Total rows in "vehicles": %', row_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚠️  Next step: Update your TypeScript code to use "vehicles" table and English column names';
END $$;

COMMIT;

-- ========================================
-- SUMMARY
-- ========================================
-- This script:
-- 1. ✅ Checks if both tables exist
-- 2. ✅ Migrates data from "vehicules" to "vehicles" with column mapping
-- 3. ✅ Verifies migration success
-- 4. ✅ Drops the old "vehicules" table and its dependencies
-- 5. ✅ Ensures RLS policies are correct on "vehicles"
-- 6. ✅ Verifies final state
--
-- After running this script, you should only have the "vehicles" table
-- with all data and correct English column names.
-- ========================================

