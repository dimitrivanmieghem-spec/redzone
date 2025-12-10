-- ========================================
-- REDZONE - AJOUT DES COLONNES MANQUANTES
-- ========================================
-- Ce script ajoute les colonnes manquantes à la table vehicules
-- Copiez-collez ce script dans le SQL Editor de Supabase

-- ========================================
-- 1. AJOUT DE cv_fiscaux (Chevaux fiscaux)
-- ========================================
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

-- ========================================
-- 2. AJOUT DE car_pass_url (Lien Car-Pass)
-- ========================================
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

-- ========================================
-- 3. AJOUT DE is_manual_model (Modèle manuel)
-- ========================================
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

-- ========================================
-- 4. VÉRIFICATION
-- ========================================
-- Vérifier que les colonnes ont été ajoutées
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'vehicules'
  AND column_name IN ('cv_fiscaux', 'car_pass_url', 'is_manual_model')
ORDER BY column_name;

-- Message de confirmation
DO $$ 
BEGIN
  RAISE NOTICE 'Migration terminée : Colonnes cv_fiscaux, car_pass_url et is_manual_model ajoutées à la table vehicules';
END $$;

