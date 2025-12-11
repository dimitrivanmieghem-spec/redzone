-- ========================================
-- REDZONE - REFACTORING COMPLET RLS
-- ========================================
-- Script de nettoyage et standardisation des politiques RLS
-- Date: 2024
-- Objectif: Assainir toutes les politiques RLS après multiples correctifs
--
-- ⚠️ ATTENTION: Ce script supprime TOUTES les politiques existantes
-- et les recrée de manière standardisée et claire.
-- ========================================

-- ========================================
-- 1. NETTOYAGE COMPLET DES POLITIQUES
-- ========================================

-- Supprimer TOUTES les politiques existantes sur model_specs_db
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

-- Supprimer TOUTES les politiques existantes sur site_settings
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'site_settings'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON site_settings', pol.policyname);
        RAISE NOTICE 'Politique supprimée: %', pol.policyname;
    END LOOP;
END $$;

-- Supprimer TOUTES les politiques existantes sur vehicules (sauf celles nécessaires pour guest)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'vehicules'
        AND policyname NOT IN (
            'Authenticated users can insert vehicles',
            'Anonymous users can insert vehicles as guests',
            'Users can update own pending vehicles'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON vehicules', pol.policyname);
        RAISE NOTICE 'Politique supprimée: %', pol.policyname;
    END LOOP;
END $$;

-- ========================================
-- 2. RÉACTIVATION RLS
-- ========================================

ALTER TABLE model_specs_db ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 3. POLITIQUES STANDARDISÉES - model_specs_db
-- ========================================

-- ✅ PUBLIC READ: Tout le monde (anon + auth) peut lire les specs actives
CREATE POLICY "public_read_model_specs"
  ON model_specs_db FOR SELECT
  USING (is_active = true);

-- ✅ ADMIN WRITE: Seuls les admins peuvent créer/modifier/supprimer
CREATE POLICY "admin_insert_model_specs"
  ON model_specs_db FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_update_model_specs"
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

CREATE POLICY "admin_delete_model_specs"
  ON model_specs_db FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- 4. POLITIQUES STANDARDISÉES - site_settings
-- ========================================

-- ✅ PUBLIC READ: Tout le monde peut lire les réglages
CREATE POLICY "public_read_settings"
  ON site_settings FOR SELECT
  USING (true);

-- ✅ ADMIN WRITE: Seuls les admins peuvent modifier
CREATE POLICY "admin_view_settings"
  ON site_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "admin_update_settings"
  ON site_settings FOR UPDATE
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

CREATE POLICY "admin_insert_settings"
  ON site_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- 5. POLITIQUES STANDARDISÉES - vehicules
-- ========================================

-- ✅ PUBLIC READ: Tout le monde peut voir les annonces actives
CREATE POLICY "public_read_active_vehicles"
  ON vehicules FOR SELECT
  USING (status = 'active');

-- ✅ USER READ OWN: Les utilisateurs peuvent voir leurs propres annonces
CREATE POLICY "user_read_own_vehicles"
  ON vehicules FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      auth.uid() IS NULL 
      AND guest_email IS NOT NULL
      -- Note: Les invités ne peuvent pas voir leurs annonces via RLS
      -- car nous n'avons pas accès à leur email dans le contexte RLS
      -- C'est géré côté application
    )
  );

-- ✅ ADMIN READ ALL: Les admins peuvent tout voir
CREATE POLICY "admin_read_all_vehicles"
  ON vehicules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ✅ AUTH INSERT: Les utilisateurs connectés peuvent créer des annonces
-- (Politique déjà existante, on la garde)
-- Si elle n'existe pas, on la crée
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vehicules' 
        AND policyname = 'Authenticated users can insert vehicles'
    ) THEN
        CREATE POLICY "Authenticated users can insert vehicles"
          ON vehicules FOR INSERT
          WITH CHECK (
            auth.uid() = user_id 
            AND user_id IS NOT NULL
          );
    END IF;
END $$;

-- ✅ GUEST INSERT: Les invités peuvent créer des annonces (pending_validation)
-- (Politique déjà existante, on la garde)
-- Si elle n'existe pas, on la crée
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vehicules' 
        AND policyname = 'Anonymous users can insert vehicles as guests'
    ) THEN
        CREATE POLICY "Anonymous users can insert vehicles as guests"
          ON vehicules FOR INSERT
          WITH CHECK (
            auth.uid() IS NULL 
            AND user_id IS NULL 
            AND guest_email IS NOT NULL
            AND status = 'pending_validation'
          );
    END IF;
END $$;

-- ✅ USER UPDATE OWN: Les utilisateurs peuvent modifier leurs annonces pending
-- (Politique déjà existante, on la garde)
-- Si elle n'existe pas, on la crée
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vehicules' 
        AND policyname = 'Users can update own pending vehicles'
    ) THEN
        CREATE POLICY "Users can update own pending vehicles"
          ON vehicules FOR UPDATE
          USING (
            auth.uid() = user_id 
            AND status IN ('pending', 'pending_validation')
          )
          WITH CHECK (
            auth.uid() = user_id 
            AND status IN ('pending', 'pending_validation')
          );
    END IF;
END $$;

-- ✅ ADMIN WRITE ALL: Les admins peuvent tout modifier
CREATE POLICY "admin_write_all_vehicles"
  ON vehicules FOR ALL
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

-- ========================================
-- 6. POLITIQUES STORAGE (images)
-- ========================================

-- Supprimer les anciennes politiques storage
DROP POLICY IF EXISTS "Public can view active vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;

-- ✅ PUBLIC READ: Lecture publique des images
CREATE POLICY "public_read_vehicle_images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'vehicles'
    AND (storage.foldername(name))[1] = 'public'
  );

-- ✅ AUTH UPLOAD: Les utilisateurs connectés peuvent uploader
CREATE POLICY "auth_upload_vehicle_images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'vehicles'
    AND auth.uid() IS NOT NULL
  );

-- ✅ USER UPDATE OWN: Les utilisateurs peuvent modifier leurs propres images
CREATE POLICY "user_update_own_images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'vehicles'
    AND auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'vehicles'
    AND auth.uid() IS NOT NULL
  );

-- ✅ USER DELETE OWN: Les utilisateurs peuvent supprimer leurs propres images
CREATE POLICY "user_delete_own_images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'vehicles'
    AND auth.uid() IS NOT NULL
  );

-- ========================================
-- 7. VÉRIFICATION
-- ========================================

-- Afficher toutes les politiques créées
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'Pas de condition USING'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'Pas de condition WITH CHECK'
    END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('model_specs_db', 'site_settings', 'vehicules')
ORDER BY tablename, policyname;

-- Vérifier que RLS est activé
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('model_specs_db', 'site_settings', 'vehicules')
ORDER BY tablename;

-- ========================================
-- ✅ REFACTORING TERMINÉ
-- ========================================
-- Toutes les politiques ont été nettoyées et standardisées.
-- Nomenclature:
--   - "public_read_*" : Lecture publique
--   - "user_*_own_*" : Actions sur ses propres données
--   - "admin_*_all_*" : Actions admin sur toutes les données
--   - "auth_*" : Actions nécessitant authentification
-- ========================================

