-- ========================================
-- OCTANE98 - FIX SITE_SETTINGS TABLE
-- ========================================
-- Script SQL idempotent pour créer/configurer la table site_settings
-- Résout l'erreur 406 + RLS Violation lors du chargement des réglages
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- ========================================

-- ========================================
-- 1. CRÉATION DE LA TABLE SITE_SETTINGS
-- ========================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_settings') THEN
    CREATE TABLE site_settings (
      id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Réglages généraux
      banner_message TEXT DEFAULT 'Bienvenue sur Octane98',
      maintenance_mode BOOLEAN DEFAULT false,
      tva_rate NUMERIC(5, 2) DEFAULT 21.00,
      site_name TEXT DEFAULT 'Octane98',
      site_description TEXT DEFAULT 'Le sanctuaire du moteur thermique',
      home_title TEXT DEFAULT 'Le Sanctuaire du Moteur Thermique',
      
      -- Contrainte : une seule ligne de réglages
      CONSTRAINT single_site_settings CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
    );

    -- Index pour les performances
    CREATE INDEX idx_site_settings_id ON site_settings(id);

    -- Trigger pour mettre à jour updated_at automatiquement
    CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_update_site_settings_updated_at
      BEFORE UPDATE ON site_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_site_settings_updated_at();

    RAISE NOTICE 'Table site_settings créée avec succès';
  ELSE
    RAISE NOTICE 'Table site_settings existe déjà';
  END IF;
END $$;

-- ========================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Activer RLS
ALTER TABLE IF EXISTS site_settings ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent (pour éviter les conflits)
DROP POLICY IF EXISTS "Public can view site settings" ON site_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON site_settings;
DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;
DROP POLICY IF EXISTS "site_settings_public_read" ON site_settings;

-- Créer la politique de lecture publique (CRITIQUE pour éviter l'erreur 406)
CREATE POLICY "Enable read access for all users"
  ON public.site_settings
  FOR SELECT
  TO public
  USING (true);

-- Politique d'écriture : Seuls les admins peuvent modifier
DROP POLICY IF EXISTS "Admins can update site settings" ON site_settings;
CREATE POLICY "Admins can update site settings"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique d'insertion : Seuls les admins peuvent insérer
DROP POLICY IF EXISTS "Admins can insert site settings" ON site_settings;
CREATE POLICY "Admins can insert site settings"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Accorder les permissions SELECT
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT ON public.site_settings TO authenticated;

-- Accorder les permissions UPDATE/INSERT aux admins (via RLS)
GRANT UPDATE ON public.site_settings TO authenticated;
GRANT INSERT ON public.site_settings TO authenticated;

-- Commentaires pour documentation
COMMENT ON TABLE site_settings IS 'Réglages globaux du site Octane98 - Lecture publique, modification admin uniquement';
COMMENT ON POLICY "Enable read access for all users" ON site_settings IS 'Permet la lecture publique de site_settings pour tous les utilisateurs (anon et authenticated) - CRITIQUE pour éviter l''erreur 406';

-- ========================================
-- 3. INSERTION D'UNE LIGNE PAR DÉFAUT
-- ========================================
-- CRITIQUE : Insérer une ligne avec l'ID fixe pour éviter l'erreur 406 sur .single()

INSERT INTO site_settings (
  id,
  banner_message,
  maintenance_mode,
  tva_rate,
  site_name,
  site_description,
  home_title
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Bienvenue sur Octane98',
  false,
  21.00,
  'Octane98',
  'Le sanctuaire du moteur thermique',
  'Le Sanctuaire du Moteur Thermique'
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 4. VÉRIFICATION FINALE
-- ========================================

DO $$ 
DECLARE
  table_exists BOOLEAN;
  policy_exists BOOLEAN;
  default_row_exists BOOLEAN;
BEGIN
  -- Vérifier si la table existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'site_settings'
  ) INTO table_exists;
  
  -- Vérifier si la politique existe
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'site_settings' 
    AND policyname = 'Enable read access for all users'
  ) INTO policy_exists;
  
  -- Vérifier si la ligne par défaut existe
  SELECT EXISTS (
    SELECT 1 FROM site_settings 
    WHERE id = '00000000-0000-0000-0000-000000000000'::uuid
  ) INTO default_row_exists;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OCTANE98 - FIX SITE_SETTINGS COMPLÉTÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Table site_settings : %', CASE WHEN table_exists THEN 'CRÉÉE' ELSE 'MANQUANTE' END;
  RAISE NOTICE '✅ Politique RLS publique : %', CASE WHEN policy_exists THEN 'CRÉÉE' ELSE 'MANQUANTE' END;
  RAISE NOTICE '✅ Ligne par défaut : %', CASE WHEN default_row_exists THEN 'PRÉSENTE' ELSE 'MANQUANTE' END;
  RAISE NOTICE '✅ Permissions SELECT accordées à anon et authenticated';
  RAISE NOTICE '========================================';
END $$;

