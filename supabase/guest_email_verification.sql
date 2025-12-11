-- ========================================
-- REDZONE - SÉCURISATION FORMULAIRE GUEST
-- ========================================
-- Ce script ajoute les colonnes nécessaires pour la vérification email
-- des annonces déposées par des invités (sans compte)
-- 
-- Copiez-collez ce script dans le SQL Editor de Supabase

-- ========================================
-- 1. AJOUT DES COLONNES DE VÉRIFICATION EMAIL
-- ========================================
DO $$ 
BEGIN
  -- Colonne pour stocker l'email de contact (pour les invités)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'email_contact'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN email_contact TEXT;
    
    COMMENT ON COLUMN vehicules.email_contact IS 'Email de contact pour les invités (obligatoire pour vérification)';
  END IF;

  -- Colonne pour indiquer si l'email est vérifié
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'is_email_verified'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE;
    
    COMMENT ON COLUMN vehicules.is_email_verified IS 'True si l''email a été vérifié via le code de validation';
  END IF;

  -- Colonne pour stocker le code de vérification (6 chiffres)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'verification_code'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN verification_code TEXT;
    
    COMMENT ON COLUMN vehicules.verification_code IS 'Code de vérification à 6 chiffres envoyé par email (hashé)';
  END IF;

  -- Colonne pour stocker la date d'expiration du code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'verification_code_expires_at'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN verification_code_expires_at TIMESTAMP WITH TIME ZONE;
    
    COMMENT ON COLUMN vehicules.verification_code_expires_at IS 'Date d''expiration du code de vérification (15 minutes)';
  END IF;
END $$;

-- ========================================
-- 2. MODIFIER LE CHECK DU STATUT
-- ========================================
-- Ajouter le nouveau statut 'waiting_email_verification'
DO $$ 
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  ALTER TABLE vehicules DROP CONSTRAINT IF EXISTS vehicules_status_check;
  
  -- Ajouter la nouvelle contrainte avec le nouveau statut
  ALTER TABLE vehicules 
  ADD CONSTRAINT vehicules_status_check 
  CHECK (status IN ('pending', 'active', 'rejected', 'waiting_email_verification', 'pending_validation'));
END $$;

-- ========================================
-- 3. INDEX POUR PERFORMANCES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_vehicules_email_contact ON vehicules(email_contact);
CREATE INDEX IF NOT EXISTS idx_vehicules_is_email_verified ON vehicules(is_email_verified);
CREATE INDEX IF NOT EXISTS idx_vehicules_verification_code ON vehicules(verification_code);

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
  AND column_name IN ('email_contact', 'is_email_verified', 'verification_code', 'verification_code_expires_at')
ORDER BY column_name;

