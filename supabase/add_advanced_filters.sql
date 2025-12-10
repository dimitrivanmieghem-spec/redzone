-- ========================================
-- REDZONE - AJOUT DES FILTRES AVANCÉS
-- ========================================
-- Ce script ajoute les colonnes nécessaires pour les filtres ultra-spécialisés
-- Copiez-collez ce script dans le SQL Editor de Supabase

-- ========================================
-- 1. AJOUT DE couleur_interieure
-- ========================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'couleur_interieure'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN couleur_interieure TEXT;
    
    COMMENT ON COLUMN vehicules.couleur_interieure IS 'Couleur de l''intérieur (Noir, Rouge, Cuir Beige, Alcantara, etc.)';
  END IF;
END $$;

-- ========================================
-- 2. AJOUT DE nombre_places
-- ========================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'nombre_places'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN nombre_places INTEGER;
    
    COMMENT ON COLUMN vehicules.nombre_places IS 'Nombre de places (2, 4, 5, etc.)';
  END IF;
END $$;

-- ========================================
-- 3. VÉRIFICATION
-- ========================================
-- Vérifier que les colonnes ont été ajoutées
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'vehicules'
  AND column_name IN ('couleur_interieure', 'nombre_places', 'carrosserie', 'architecture_moteur', 'admission')
ORDER BY column_name;

