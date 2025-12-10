-- ========================================
-- REDZONE - ADMIN FIX & PERMISSIONS (VERSION SÉCURISÉE)
-- ========================================
-- Ce script est idempotent : peut être exécuté plusieurs fois sans erreur
-- Copiez-collez ce script dans le SQL Editor de Supabase

-- ======================================== 
-- 1. TABLE SITE_SETTINGS
-- ========================================

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Réglages généraux
  banner_message TEXT DEFAULT 'Bienvenue sur RedZone',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  tva_rate NUMERIC(5, 2) DEFAULT 21.00 CHECK (tva_rate >= 0 AND tva_rate <= 100),
  
  -- Métadonnées
  site_name TEXT DEFAULT 'RedZone',
  site_description TEXT DEFAULT 'Le sanctuaire du moteur thermique',
  
  -- Contraintes : Une seule ligne de configuration
  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_site_settings_id ON site_settings(id);

-- Row Level Security
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les politiques existantes pour site_settings
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  -- Supprimer toutes les politiques existantes pour site_settings
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'site_settings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON site_settings', pol.policyname);
  END LOOP;
END $$;

-- Créer les politiques (maintenant qu'elles sont supprimées)
CREATE POLICY "Admins can view settings"
  ON site_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update settings"
  ON site_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert settings"
  ON site_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Données par défaut (si la table est vide)
INSERT INTO site_settings (id, banner_message, maintenance_mode, tva_rate)
VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'Bienvenue sur RedZone', FALSE, 21.00)
ON CONFLICT (id) DO NOTHING;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_updated_at();

-- ========================================
-- 2. POLITIQUE RLS "ADMIN SUPER-USER" POUR VEHICULES
-- ========================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Admins can manage all vehicles" ON vehicules;
DROP POLICY IF EXISTS "Admins can update all vehicles" ON vehicules;
DROP POLICY IF EXISTS "Admins can delete all vehicles" ON vehicules;

-- Politique : Les admins peuvent TOUT faire sur les véhicules
CREATE POLICY "Admins can manage all vehicles"
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
-- 3. FONCTION POUR STATS ADMIN
-- ========================================

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE(
  total_vehicles BIGINT,
  pending_vehicles BIGINT,
  active_vehicles BIGINT,
  rejected_vehicles BIGINT,
  total_users BIGINT
) AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Accès refusé - Administrateur uniquement';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM vehicules)::BIGINT AS total_vehicles,
    (SELECT COUNT(*) FROM vehicules WHERE status = 'pending')::BIGINT AS pending_vehicles,
    (SELECT COUNT(*) FROM vehicules WHERE status = 'active')::BIGINT AS active_vehicles,
    (SELECT COUNT(*) FROM vehicules WHERE status = 'rejected')::BIGINT AS rejected_vehicles,
    (SELECT COUNT(*) FROM profiles)::BIGINT AS total_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. FONCTION POUR COMPTER LES VÉHICULES PAR STATUT
-- ========================================

CREATE OR REPLACE FUNCTION count_vehicles_by_status()
RETURNS TABLE(
  status TEXT,
  count BIGINT
) AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Accès refusé - Administrateur uniquement';
  END IF;

  RETURN QUERY
  SELECT 
    vehicules.status::TEXT,
    COUNT(*)::BIGINT
  FROM vehicules
  GROUP BY vehicules.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 5. AJOUT DES COLONNES MANQUANTES
-- ========================================

-- Ajout de cv_fiscaux (Chevaux fiscaux)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'cv_fiscaux'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN cv_fiscaux INTEGER;
    
    COMMENT ON COLUMN vehicules.cv_fiscaux IS 'Chevaux fiscaux (pour taxe annuelle belge)';
  END IF;
END $$;

-- Ajout de car_pass_url (Lien Car-Pass)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'car_pass_url'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN car_pass_url TEXT;
    
    COMMENT ON COLUMN vehicules.car_pass_url IS 'Lien URL vers le Car-Pass (optionnel)';
  END IF;
END $$;

-- Ajout de is_manual_model (Modèle manuel)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'is_manual_model'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN is_manual_model BOOLEAN DEFAULT FALSE;
    
    COMMENT ON COLUMN vehicules.is_manual_model IS 'True si le modèle a été saisi manuellement (non listé dans la base)';
  END IF;
END $$;

-- Ajout de telephone (Numéro de téléphone)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'telephone'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN telephone TEXT;
    
    COMMENT ON COLUMN vehicules.telephone IS 'Numéro de téléphone du vendeur (format belge +32...)';
  END IF;
END $$;

-- Ajout de contact_email (Email de contact)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'contact_email'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN contact_email TEXT;
    
    COMMENT ON COLUMN vehicules.contact_email IS 'Email de contact (par défaut email du vendeur)';
  END IF;
END $$;

-- Ajout de contact_methods (Méthodes de contact acceptées)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'contact_methods'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN contact_methods TEXT[];
    
    COMMENT ON COLUMN vehicules.contact_methods IS 'Méthodes de contact acceptées: whatsapp, email, tel';
  END IF;
END $$;

-- ========================================
-- 6. VÉRIFICATION
-- ========================================

-- Vérifier que les politiques sont bien créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('vehicules', 'site_settings')
ORDER BY tablename, policyname;

-- Vérifier les données par défaut
SELECT * FROM site_settings;

-- Vérifier les colonnes ajoutées
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'vehicules'
  AND column_name IN ('cv_fiscaux', 'car_pass_url', 'is_manual_model', 'telephone', 'contact_email', 'contact_methods')
ORDER BY column_name;

