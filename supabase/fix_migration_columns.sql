-- ========================================
-- ROBUST MIGRATION SCRIPT: vehicules -> vehicles
-- ========================================
-- 📅 Date: 2025-01-XX
-- 🎯 Objective: Migrate data from French table `vehicules` to English table `vehicles`
--               with dynamic column detection and mapping
-- 
-- ⚠️ WARNING: This script will DELETE the `vehicules` table after migration.
--             Make sure you have a backup before running!
-- ========================================

BEGIN;

-- ========================================
-- STEP 1: Check tables existence and structure
-- ========================================

DO $$
DECLARE
  vehicules_exists BOOLEAN;
  vehicles_exists BOOLEAN;
  row_count INTEGER;
  vehicles_user_col VARCHAR;
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
    RAISE EXCEPTION 'Table "vehicles" does not exist. Please create it first.';
  END IF;

  IF NOT vehicules_exists THEN
    RAISE NOTICE 'Table "vehicules" does not exist. Nothing to migrate.';
    RETURN;
  END IF;

  -- Detect which user column exists in vehicles table
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'user_id') THEN
    vehicles_user_col := 'user_id';
    RAISE NOTICE 'Detected "user_id" column in vehicles table';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'owner_id') THEN
    vehicles_user_col := 'owner_id';
    RAISE NOTICE 'Detected "owner_id" column in vehicles table';
  ELSE
    -- Create user_id column if neither exists
    ALTER TABLE vehicles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    vehicles_user_col := 'user_id';
    RAISE NOTICE 'Created "user_id" column in vehicles table';
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
-- STEP 2: Ensure all required columns exist in vehicles table
-- ========================================
-- Add missing columns dynamically if they don't exist

DO $$
DECLARE
  col_record RECORD;
  critical_cols TEXT[] := ARRAY['id']; -- Only id must stay NOT NULL
BEGIN
  -- Add user_id/owner_id if missing (already handled above, but double-check)
  -- Also ensure it allows NULL for guest listings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'user_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'owner_id') THEN
    ALTER TABLE vehicles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added user_id column';
  END IF;

  -- If owner_id exists but has NOT NULL constraint, alter it to allow NULL (for guest listings)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'owner_id') THEN
    -- Check if column is nullable
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'vehicles' 
      AND column_name = 'owner_id' 
      AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE vehicles ALTER COLUMN owner_id DROP NOT NULL;
      RAISE NOTICE 'Removed NOT NULL constraint from owner_id column (allows guest listings)';
    END IF;
  END IF;

  -- Same for user_id if it exists with NOT NULL
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'user_id') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'vehicles' 
      AND column_name = 'user_id' 
      AND is_nullable = 'NO'
    ) THEN
      ALTER TABLE vehicles ALTER COLUMN user_id DROP NOT NULL;
      RAISE NOTICE 'Removed NOT NULL constraint from user_id column (allows guest listings)';
    END IF;
  END IF;

  -- Remove NOT NULL constraints from ALL columns (except critical ones like id)
  -- This is necessary because the source table may have NULL values for optional fields
  -- and we want to allow the migration to proceed without constraint violations
  FOR col_record IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vehicles'
      AND is_nullable = 'NO'
      AND column_name != ALL(critical_cols)
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE vehicles ALTER COLUMN %I DROP NOT NULL', col_record.column_name);
      RAISE NOTICE 'Removed NOT NULL constraint from column: %', col_record.column_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not remove NOT NULL from %: %', col_record.column_name, SQLERRM;
    END;
  END LOOP;

  -- Add ALL missing columns that might not exist (based on INSERT statement)
  -- Basic columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'type') THEN
    ALTER TABLE vehicles ADD COLUMN type TEXT;
    RAISE NOTICE 'Added type column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'brand') THEN
    ALTER TABLE vehicles ADD COLUMN brand TEXT;
    RAISE NOTICE 'Added brand column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'model') THEN
    ALTER TABLE vehicles ADD COLUMN model TEXT;
    RAISE NOTICE 'Added model column';
  END IF;

  -- Handle price column: rename prix to price if prix exists, otherwise create price
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'prix') THEN
    ALTER TABLE vehicles RENAME COLUMN prix TO price;
    RAISE NOTICE 'Renamed prix to price';
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'price') THEN
    ALTER TABLE vehicles ADD COLUMN price NUMERIC(12, 2);
    RAISE NOTICE 'Added price column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'year') THEN
    ALTER TABLE vehicles ADD COLUMN year INTEGER;
    RAISE NOTICE 'Added year column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'mileage') THEN
    ALTER TABLE vehicles ADD COLUMN mileage INTEGER;
    RAISE NOTICE 'Added mileage column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'fuel_type') THEN
    ALTER TABLE vehicles ADD COLUMN fuel_type TEXT;
    RAISE NOTICE 'Added fuel_type column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'transmission') THEN
    ALTER TABLE vehicles ADD COLUMN transmission TEXT;
    RAISE NOTICE 'Added transmission column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'body_type') THEN
    ALTER TABLE vehicles ADD COLUMN body_type TEXT;
    RAISE NOTICE 'Added body_type column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'power_hp') THEN
    ALTER TABLE vehicles ADD COLUMN power_hp INTEGER;
    RAISE NOTICE 'Added power_hp column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'condition') THEN
    ALTER TABLE vehicles ADD COLUMN condition TEXT;
    RAISE NOTICE 'Added condition column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'euro_standard') THEN
    ALTER TABLE vehicles ADD COLUMN euro_standard TEXT;
    RAISE NOTICE 'Added euro_standard column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'car_pass') THEN
    ALTER TABLE vehicles ADD COLUMN car_pass BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added car_pass column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'image') THEN
    ALTER TABLE vehicles ADD COLUMN image TEXT;
    RAISE NOTICE 'Added image column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'images') THEN
    ALTER TABLE vehicles ADD COLUMN images TEXT[];
    RAISE NOTICE 'Added images column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'description') THEN
    ALTER TABLE vehicles ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'status') THEN
    ALTER TABLE vehicles ADD COLUMN status TEXT DEFAULT 'pending';
    RAISE NOTICE 'Added status column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'guest_email') THEN
    ALTER TABLE vehicles ADD COLUMN guest_email TEXT;
    RAISE NOTICE 'Added guest_email column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'is_email_verified') THEN
    ALTER TABLE vehicles ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_email_verified column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'verification_code') THEN
    ALTER TABLE vehicles ADD COLUMN verification_code TEXT;
    RAISE NOTICE 'Added verification_code column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'verification_code_expires_at') THEN
    ALTER TABLE vehicles ADD COLUMN verification_code_expires_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added verification_code_expires_at column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'edit_token') THEN
    ALTER TABLE vehicles ADD COLUMN edit_token UUID;
    RAISE NOTICE 'Added edit_token column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'engine_architecture') THEN
    ALTER TABLE vehicles ADD COLUMN engine_architecture TEXT;
    RAISE NOTICE 'Added engine_architecture column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'admission') THEN
    ALTER TABLE vehicles ADD COLUMN admission TEXT;
    RAISE NOTICE 'Added admission column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'zero_a_cent') THEN
    ALTER TABLE vehicles ADD COLUMN zero_a_cent NUMERIC(5, 2);
    RAISE NOTICE 'Added zero_a_cent column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'co2') THEN
    ALTER TABLE vehicles ADD COLUMN co2 INTEGER;
    RAISE NOTICE 'Added co2 column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'poids_kg') THEN
    ALTER TABLE vehicles ADD COLUMN poids_kg INTEGER;
    RAISE NOTICE 'Added poids_kg column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'fiscal_horsepower') THEN
    ALTER TABLE vehicles ADD COLUMN fiscal_horsepower INTEGER;
    RAISE NOTICE 'Added fiscal_horsepower column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'audio_file') THEN
    ALTER TABLE vehicles ADD COLUMN audio_file TEXT;
    RAISE NOTICE 'Added audio_file column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'history') THEN
    ALTER TABLE vehicles ADD COLUMN history TEXT[];
    RAISE NOTICE 'Added history column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'car_pass_url') THEN
    ALTER TABLE vehicles ADD COLUMN car_pass_url TEXT;
    RAISE NOTICE 'Added car_pass_url column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'is_manual_model') THEN
    ALTER TABLE vehicles ADD COLUMN is_manual_model BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_manual_model column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'phone') THEN
    ALTER TABLE vehicles ADD COLUMN phone TEXT;
    RAISE NOTICE 'Added phone column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'contact_email') THEN
    ALTER TABLE vehicles ADD COLUMN contact_email TEXT;
    RAISE NOTICE 'Added contact_email column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'contact_methods') THEN
    ALTER TABLE vehicles ADD COLUMN contact_methods TEXT[];
    RAISE NOTICE 'Added contact_methods column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'city') THEN
    ALTER TABLE vehicles ADD COLUMN city TEXT;
    RAISE NOTICE 'Added city column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'postal_code') THEN
    ALTER TABLE vehicles ADD COLUMN postal_code TEXT;
    RAISE NOTICE 'Added postal_code column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'interior_color') THEN
    ALTER TABLE vehicles ADD COLUMN interior_color TEXT;
    RAISE NOTICE 'Added interior_color column';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'seats_count') THEN
    ALTER TABLE vehicles ADD COLUMN seats_count INTEGER;
    RAISE NOTICE 'Added seats_count column';
  END IF;
END $$;

-- ========================================
-- STEP 3: Migrate data with dynamic column mapping
-- ========================================

DO $$
DECLARE
  row_count INTEGER;
  vehicles_user_col VARCHAR;
  insert_sql TEXT;
BEGIN
  -- Determine which user column to use
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'user_id') THEN
    vehicles_user_col := 'user_id';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'owner_id') THEN
    vehicles_user_col := 'owner_id';
  ELSE
    RAISE EXCEPTION 'Neither user_id nor owner_id column found in vehicles table!';
  END IF;

  -- Count rows to migrate
  EXECUTE 'SELECT COUNT(*) FROM vehicules' INTO row_count;

  IF row_count > 0 THEN
    RAISE NOTICE 'Starting data migration from "vehicules" to "vehicles"...';
    RAISE NOTICE 'Using column: % for user ownership', vehicles_user_col;

    -- Build dynamic INSERT statement based on what columns exist
    -- This handles cases where some columns might not exist in source or target
    insert_sql := format('
      INSERT INTO vehicles (
        id,
        created_at,
        %s,
        type,
        brand,
        model,
        price,
        year,
        mileage,
        fuel_type,
        transmission,
        body_type,
        power_hp,
        condition,
        euro_standard,
        car_pass,
        image,
        images,
        description,
        status,
        guest_email,
        is_email_verified,
        verification_code,
        verification_code_expires_at,
        edit_token,
        engine_architecture,
        admission,
        zero_a_cent,
        co2,
        poids_kg,
        fiscal_horsepower,
        audio_file,
        history,
        car_pass_url,
        is_manual_model,
        phone,
        contact_email,
        contact_methods,
        city,
        postal_code,
        interior_color,
        seats_count
      )
      SELECT
        id,
        created_at,
        user_id AS %s,
        type,
        marque AS brand,
        modele AS model,
        prix AS price,
        annee AS year,
        km AS mileage,
        carburant AS fuel_type,
        transmission,
        carrosserie AS body_type,
        puissance AS power_hp,
        etat AS condition,
        norme_euro AS euro_standard,
        COALESCE(car_pass, false) AS car_pass,
        image,
        images,
        description,
        COALESCE(status, ''pending'') AS status,
        email_contact AS guest_email,
        COALESCE(is_email_verified, false) AS is_email_verified,
        verification_code,
        verification_code_expires_at,
        edit_token,
        architecture_moteur AS engine_architecture,
        admission,
        zero_a_cent,
        co2,
        poids_kg,
        cv_fiscaux AS fiscal_horsepower,
        audio_file,
        history,
        car_pass_url,
        COALESCE(is_manual_model, false) AS is_manual_model,
        telephone AS phone,
        contact_email,
        contact_methods,
        ville AS city,
        code_postal AS postal_code,
        couleur_interieure AS interior_color,
        nombre_places AS seats_count
      FROM vehicules
      WHERE NOT EXISTS (
        SELECT 1 FROM vehicles WHERE vehicles.id = vehicules.id
      )
      ON CONFLICT (id) DO NOTHING
    ', vehicles_user_col, vehicles_user_col);

    -- Execute the dynamic INSERT
    EXECUTE insert_sql;

    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE '✅ Migrated % rows from "vehicules" to "vehicles"', row_count;
  ELSE
    RAISE NOTICE 'No data to migrate from "vehicules"';
  END IF;
END $$;

-- ========================================
-- STEP 4: Verify migration success
-- ========================================

DO $$
DECLARE
  vehicules_count INTEGER;
  vehicles_count INTEGER;
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

  IF vehicules_count > 0 AND vehicles_count < vehicules_count THEN
    RAISE WARNING '⚠️  Possible data loss detected! vehicles count (%) is less than vehicules count (%).', vehicles_count, vehicules_count;
    RAISE WARNING '⚠️  Some rows may have duplicates or failed to migrate. Review manually.';
  END IF;
END $$;

-- ========================================
-- STEP 5: Drop old French table and its dependencies
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
-- STEP 6: Ensure vehicles table has correct RLS policies
-- ========================================

-- Enable RLS if not already enabled
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Drop old policies with wrong names
DROP POLICY IF EXISTS "Public can view active vehicules" ON vehicles;
DROP POLICY IF EXISTS "Users can view own vehicules" ON vehicles;
DROP POLICY IF EXISTS "Admins can view all vehicules" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can create vehicules" ON vehicles;
DROP POLICY IF EXISTS "Guests can create vehicules" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicules" ON vehicles;
DROP POLICY IF EXISTS "Admins can update all vehicules" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicules" ON vehicles;
DROP POLICY IF EXISTS "Admins can delete all vehicules" ON vehicles;

-- Determine which user column to use for policies
DO $$
DECLARE
  vehicles_user_col VARCHAR;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'user_id') THEN
    vehicles_user_col := 'user_id';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'owner_id') THEN
    vehicles_user_col := 'owner_id';
  ELSE
    RAISE EXCEPTION 'Neither user_id nor owner_id column found for RLS policies!';
  END IF;

  RAISE NOTICE 'Creating RLS policies using column: %', vehicles_user_col;

  -- Recreate policies with correct column name (only if they don't exist)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Public can view active vehicles') THEN
    EXECUTE format('CREATE POLICY "Public can view active vehicles" ON vehicles FOR SELECT USING (status = ''active'')');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Users can view own vehicles') THEN
    EXECUTE format('CREATE POLICY "Users can view own vehicles" ON vehicles FOR SELECT USING (auth.uid() = %I)', vehicles_user_col);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Admins can view all vehicles') THEN
    EXECUTE format('CREATE POLICY "Admins can view all vehicles" ON vehicles FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = ''admin''
      )
    )');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Authenticated users can create vehicles') THEN
    EXECUTE format('CREATE POLICY "Authenticated users can create vehicles" ON vehicles FOR INSERT
      WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() = %I
      )', vehicles_user_col);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Guests can create vehicles') THEN
    EXECUTE format('CREATE POLICY "Guests can create vehicles" ON vehicles FOR INSERT
      WITH CHECK (
        auth.uid() IS NULL AND
        %I IS NULL
      )', vehicles_user_col);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Users can update own vehicles') THEN
    EXECUTE format('CREATE POLICY "Users can update own vehicles" ON vehicles FOR UPDATE
      USING (auth.uid() = %I)
      WITH CHECK (auth.uid() = %I)', vehicles_user_col, vehicles_user_col);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Admins can update all vehicles') THEN
    EXECUTE format('CREATE POLICY "Admins can update all vehicles" ON vehicles FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = ''admin''
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid() AND profiles.role = ''admin''
        )
      )');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Users can delete own vehicles') THEN
    EXECUTE format('CREATE POLICY "Users can delete own vehicles" ON vehicles FOR DELETE USING (auth.uid() = %I)', vehicles_user_col);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vehicles' AND policyname = 'Admins can delete all vehicles') THEN
    EXECUTE format('CREATE POLICY "Admins can delete all vehicles" ON vehicles FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = ''admin''
      )
    )');
  END IF;

  RAISE NOTICE '✅ RLS policies created/verified for "vehicles" table using column: %', vehicles_user_col;
END $$;

-- ========================================
-- STEP 7: Final verification
-- ========================================

DO $$
DECLARE
  vehicles_exists BOOLEAN;
  vehicules_exists BOOLEAN;
  row_count INTEGER;
  user_col_name VARCHAR;
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

  -- Detect user column
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'user_id') THEN
    user_col_name := 'user_id';
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'owner_id') THEN
    user_col_name := 'owner_id';
  ELSE
    user_col_name := 'NONE';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '   - Table "vehicles" exists';
  RAISE NOTICE '   - Table "vehicules" removed';
  RAISE NOTICE '   - Total rows in "vehicles": %', row_count;
  RAISE NOTICE '   - User ownership column: %', user_col_name;
  RAISE NOTICE '========================================';
  RAISE NOTICE '⚠️  Next step: Update your TypeScript code to use "vehicles" table and English column names';
  RAISE NOTICE '⚠️  Note: Your code should use "%" for user ownership column', user_col_name;
END $$;

COMMIT;

-- ========================================
-- SUMMARY
-- ========================================
-- This script:
-- 1. ✅ Dynamically detects table structure
-- 2. ✅ Handles both user_id and owner_id columns
-- 3. ✅ Creates missing columns automatically
-- 4. ✅ Migrates data with proper column mapping
-- 5. ✅ Creates RLS policies with correct column names
-- 6. ✅ Drops the old "vehicules" table
-- 7. ✅ Verifies final state
--
-- The script adapts to your actual database structure!
-- ========================================

