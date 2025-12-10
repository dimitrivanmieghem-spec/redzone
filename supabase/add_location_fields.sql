-- ========================================
-- REDZONE - AJOUT DES CHAMPS DE LOCALISATION
-- ========================================
-- Ce script ajoute les colonnes ville et code_postal à la table vehicules
-- Copiez-collez ce script dans le SQL Editor de Supabase

-- ========================================
-- 1. AJOUT DE ville (Ville)
-- ========================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'ville'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN ville TEXT;
    
    COMMENT ON COLUMN vehicules.ville IS 'Ville où se trouve le véhicule (ex: Namur, Liège, Bruxelles)';
  END IF;
END $$;

-- ========================================
-- 2. AJOUT DE code_postal (Code Postal)
-- ========================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'code_postal'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN code_postal TEXT;
    
    COMMENT ON COLUMN vehicules.code_postal IS 'Code postal belge (ex: 5000, 7181)';
  END IF;
END $$;

-- ========================================
-- 3. INDEX POUR RECHERCHES PAR LOCALISATION
-- ========================================
CREATE INDEX IF NOT EXISTS idx_vehicules_ville ON vehicules(ville);
CREATE INDEX IF NOT EXISTS idx_vehicules_code_postal ON vehicules(code_postal);

-- ========================================
-- 4. VÉRIFICATION
-- ========================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'vehicules'
  AND column_name IN ('ville', 'code_postal')
ORDER BY ordinal_position;

