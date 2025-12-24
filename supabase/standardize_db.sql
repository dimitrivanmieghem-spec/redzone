-- ========================================
-- STANDARDIZATION SCRIPT: French to English
-- ========================================
-- 📅 Date: 2025-01-XX
-- 🎯 Objective: Rename table `vehicules` to `vehicles` and all French column names to English
-- 
-- ⚠️ WARNING: This is a CRITICAL migration. Backup your database before running!
-- 
-- Execution order:
-- 1. Run this script on your Supabase instance
-- 2. Update all TypeScript code to use new column names
-- 3. Test thoroughly before deploying
-- ========================================

-- Start transaction for safety
BEGIN;

-- ========================================
-- STEP 1: Check if table exists and rename it
-- ========================================

DO $$
BEGIN
  -- Check if vehicules table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicules') THEN
    -- Check if vehicles table already exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
      RAISE EXCEPTION 'Table "vehicles" already exists. Cannot rename "vehicules". Please resolve this manually.';
    ELSE
      -- Rename table
      ALTER TABLE public.vehicules RENAME TO vehicles;
      RAISE NOTICE 'Table "vehicules" renamed to "vehicles"';
    END IF;
  ELSIF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
    RAISE EXCEPTION 'Neither "vehicules" nor "vehicles" table exists. Please create the table first.';
  ELSE
    RAISE NOTICE 'Table "vehicles" already exists, skipping rename';
  END IF;
END $$;

-- ========================================
-- STEP 2: Drop old indexes (will recreate with new names)
-- ========================================

DROP INDEX IF EXISTS idx_vehicules_user_id;
DROP INDEX IF EXISTS idx_vehicules_status;
DROP INDEX IF EXISTS idx_vehicules_type;
DROP INDEX IF EXISTS idx_vehicules_marque;
DROP INDEX IF EXISTS idx_vehicules_modele;
DROP INDEX IF EXISTS idx_vehicules_prix;
DROP INDEX IF EXISTS idx_vehicules_annee;
DROP INDEX IF EXISTS idx_vehicules_created_at;
DROP INDEX IF EXISTS idx_vehicules_edit_token;

-- ========================================
-- STEP 3: Rename columns from French to English
-- ========================================

-- Basic information columns
ALTER TABLE vehicles RENAME COLUMN marque TO brand;
ALTER TABLE vehicles RENAME COLUMN modele TO model;
ALTER TABLE vehicles RENAME COLUMN annee TO year;
ALTER TABLE vehicles RENAME COLUMN km TO mileage;
ALTER TABLE vehicles RENAME COLUMN carburant TO fuel_type;
ALTER TABLE vehicles RENAME COLUMN carrosserie TO body_type;
ALTER TABLE vehicles RENAME COLUMN puissance TO power_hp;
ALTER TABLE vehicles RENAME COLUMN etat TO condition;
ALTER TABLE vehicles RENAME COLUMN norme_euro TO euro_standard;

-- Technical columns
ALTER TABLE vehicles RENAME COLUMN architecture_moteur TO engine_architecture;
ALTER TABLE vehicles RENAME COLUMN cv_fiscaux TO fiscal_horsepower;

-- Advanced filters
ALTER TABLE vehicles RENAME COLUMN couleur_interieure TO interior_color;
ALTER TABLE vehicles RENAME COLUMN nombre_places TO seats_count;

-- Location columns
ALTER TABLE vehicles RENAME COLUMN code_postal TO postal_code;
ALTER TABLE vehicles RENAME COLUMN ville TO city;

-- Contact columns
ALTER TABLE vehicles RENAME COLUMN telephone TO phone;

-- Guest email (rename for consistency)
ALTER TABLE vehicles RENAME COLUMN email_contact TO guest_email;

-- ========================================
-- STEP 4: Recreate indexes with new column names
-- ========================================

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_vehicles_model ON vehicles(model);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(prix); -- prix stays as is (already English-like)
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON vehicles(year);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON vehicles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_edit_token ON vehicles(edit_token) WHERE edit_token IS NOT NULL;

-- ========================================
-- STEP 5: Drop old RLS policies (will recreate with new table name)
-- ========================================

DROP POLICY IF EXISTS "Public can view active vehicules" ON vehicles;
DROP POLICY IF EXISTS "Users can view own vehicules" ON vehicles;
DROP POLICY IF EXISTS "Admins can view all vehicules" ON vehicles;
DROP POLICY IF EXISTS "Authenticated users can create vehicules" ON vehicles;
DROP POLICY IF EXISTS "Guests can create vehicules" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicules" ON vehicles;
DROP POLICY IF EXISTS "Admins can update all vehicules" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicules" ON vehicles;
DROP POLICY IF EXISTS "Admins can delete all vehicules" ON vehicles;

-- ========================================
-- STEP 6: Recreate RLS policies with correct table name
-- ========================================

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- SELECT policies
CREATE POLICY "Public can view active vehicles"
  ON vehicles FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can view own vehicles"
  ON vehicles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vehicles"
  ON vehicles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- INSERT policies
CREATE POLICY "Authenticated users can create vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id
  );

CREATE POLICY "Guests can create vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL AND
    user_id IS NULL
  );

-- UPDATE policies
CREATE POLICY "Users can update own vehicles"
  ON vehicles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

-- DELETE policies
CREATE POLICY "Users can delete own vehicles"
  ON vehicles FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all vehicles"
  ON vehicles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- STEP 7: Verification
-- ========================================

DO $$
DECLARE
  table_exists BOOLEAN;
  column_count INTEGER;
BEGIN
  -- Check if vehicles table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'vehicles'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table "vehicles" does not exist after migration!';
  END IF;

  -- Check if key columns exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'brand') THEN
    RAISE EXCEPTION 'Column "brand" not found after migration!';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'model') THEN
    RAISE EXCEPTION 'Column "model" not found after migration!';
  END IF;

  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '✅ Table "vehicles" exists with English column names';
  RAISE NOTICE '⚠️  Remember to update your TypeScript code to use the new column names';
END $$;

-- Commit transaction
COMMIT;

-- ========================================
-- MAPPING REFERENCE (for code updates)
-- ========================================
-- 
-- Table: vehicules -> vehicles
-- 
-- Columns renamed:
--   marque -> brand
--   modele -> model
--   annee -> year
--   km -> mileage
--   carburant -> fuel_type
--   carrosserie -> body_type
--   puissance -> power_hp
--   etat -> condition
--   norme_euro -> euro_standard
--   architecture_moteur -> engine_architecture
--   cv_fiscaux -> fiscal_horsepower
--   couleur_interieure -> interior_color
--   nombre_places -> seats_count
--   code_postal -> postal_code
--   ville -> city
--   telephone -> phone
--   email_contact -> guest_email
-- 
-- Columns that stayed the same (already English):
--   id, created_at, user_id, type, prix, transmission, description, status,
--   is_email_verified, verification_code, verification_code_expires_at,
--   edit_token, audio_file, history, car_pass_url, is_manual_model,
--   contact_email, contact_methods, co2, poids_kg, zero_a_cent, admission,
--   car_pass, image, images
-- ========================================

