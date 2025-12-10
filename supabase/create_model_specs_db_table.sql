-- ========================================
-- REDZONE - TABLE MODEL_SPECS_DB (MIGRATION FUTURE)
-- ========================================
-- Ce script crée la table pour migrer la base de données statique vehicleData.ts
-- vers Supabase si le fichier devient trop volumineux (> 400 Ko)
-- 
-- ⚠️ PLAN DE MIGRATION : Ne pas exécuter tant que vehicleData.ts < 400 Ko
-- Ce script est une sauvegarde pour une migration future si nécessaire
-- Copiez-collez ce script dans le SQL Editor de Supabase uniquement si besoin

-- ========================================
-- 1. CRÉATION DE LA TABLE model_specs_db
-- ========================================
CREATE TABLE IF NOT EXISTS public.model_specs_db (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Identification du véhicule
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('car', 'moto')),
  
  -- Spécifications techniques
  kw NUMERIC(6, 2) NOT NULL,              -- Puissance en kilowatts
  ch NUMERIC(6, 2) NOT NULL,              -- Puissance en chevaux DIN
  cv_fiscaux INTEGER NOT NULL,            -- Chevaux fiscaux (pour taxe annuelle belge)
  co2 NUMERIC(6, 2),                      -- Émissions CO2 en g/km (NULL si N/A pour anciens modèles)
  cylindree INTEGER NOT NULL,             -- Cylindrée en cc
  moteur TEXT NOT NULL,                   -- Architecture moteur (ex: "L6 Bi-Turbo", "V8 Atmo")
  transmission TEXT NOT NULL CHECK (transmission IN ('Manuelle', 'Automatique', 'Séquentielle')),
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT true,         -- Pour désactiver des modèles obsolètes
  source TEXT DEFAULT 'vehicleData.ts',   -- Origine des données
  
  -- Contrainte d'unicité : une marque + modèle + type = unique
  CONSTRAINT unique_marque_modele_type UNIQUE (marque, modele, type)
);

-- ========================================
-- 2. INDEX POUR PERFORMANCES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_model_specs_marque ON model_specs_db(marque);
CREATE INDEX IF NOT EXISTS idx_model_specs_modele ON model_specs_db(modele);
CREATE INDEX IF NOT EXISTS idx_model_specs_type ON model_specs_db(type);
CREATE INDEX IF NOT EXISTS idx_model_specs_active ON model_specs_db(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_model_specs_marque_modele ON model_specs_db(marque, modele);

-- ========================================
-- 3. TRIGGER POUR updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_model_specs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_model_specs_updated_at ON model_specs_db;
CREATE TRIGGER trigger_update_model_specs_updated_at
  BEFORE UPDATE ON model_specs_db
  FOR EACH ROW
  EXECUTE FUNCTION update_model_specs_updated_at();

-- ========================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE model_specs_db ENABLE ROW LEVEL SECURITY;

-- Policy : Lecture publique (tous peuvent lire les specs)
DROP POLICY IF EXISTS "Anyone can view model specs" ON model_specs_db;
CREATE POLICY "Anyone can view model specs"
  ON model_specs_db FOR SELECT
  USING (is_active = true);

-- Policy : Seuls les admins peuvent modifier
DROP POLICY IF EXISTS "Admins can manage model specs" ON model_specs_db;
CREATE POLICY "Admins can manage model specs"
  ON model_specs_db FOR ALL
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
-- 5. FONCTION D'IMPORT EN MASSE (UTILITAIRE)
-- ========================================
-- Cette fonction peut être utilisée pour importer les données depuis vehicleData.ts
-- Exemple d'utilisation (à adapter selon le format JSON) :
/*
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission)
VALUES
  ('BMW', 'M3 (E30)', 'car', 143, 195, 12, NULL, 2302, 'L6 Atmo', 'Manuelle'),
  ('Porsche', '911 Carrera (964)', 'car', 184, 250, 15, NULL, 3600, 'Flat-6 Atmo', 'Manuelle'),
  -- ... etc
ON CONFLICT (marque, modele, type) DO UPDATE SET
  kw = EXCLUDED.kw,
  ch = EXCLUDED.ch,
  cv_fiscaux = EXCLUDED.cv_fiscaux,
  co2 = EXCLUDED.co2,
  cylindree = EXCLUDED.cylindree,
  moteur = EXCLUDED.moteur,
  transmission = EXCLUDED.transmission,
  updated_at = NOW();
*/

-- ========================================
-- 6. VÉRIFICATION
-- ========================================
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'model_specs_db'
ORDER BY ordinal_position;

-- ========================================
-- NOTES DE MIGRATION
-- ========================================
-- Pour migrer vehicleData.ts vers cette table :
-- 1. Convertir VEHICLE_DB en JSON
-- 2. Parser le JSON et générer des INSERT statements
-- 3. Exécuter les INSERT dans Supabase
-- 4. Modifier getModelSpecs() pour interroger Supabase au lieu du fichier statique
-- 5. Mettre en cache les résultats côté client pour éviter trop de requêtes

