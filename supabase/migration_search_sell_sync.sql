-- ========================================
-- OCTANE98 - Migration Search ↔ Sell Synchronisation
-- Phase 1 : Harmonisation Critiques
-- Date: 2025-01-XX
-- ========================================
-- 
-- Cette migration ajoute les colonnes manquantes identifiées dans l'audit
-- pour améliorer la synchronisation entre le formulaire de vente et la recherche
--
-- ========================================

-- ========================================
-- 1. NOUVELLES COLONNES POUR CRITÈRES PASSIONNÉS
-- ========================================

-- Carnet d'entretien à jour
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS service_history_complete BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN vehicles.service_history_complete IS 'Indique si le véhicule a un historique d''entretien complet et à jour';

-- Échappement sport
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS exhaust_system TEXT;

ALTER TABLE vehicles
  ADD CONSTRAINT check_exhaust_system 
  CHECK (exhaust_system IS NULL OR exhaust_system IN ('Stock', 'Après-marché', 'Système valvetronic', 'Full custom'));

COMMENT ON COLUMN vehicles.exhaust_system IS 'Type d''échappement : Stock, Après-marché, Système valvetronic, Full custom';

-- Certificat d'authenticité (URL)
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS authenticity_certificate_url TEXT;

COMMENT ON COLUMN vehicles.authenticity_certificate_url IS 'URL vers le certificat d''authenticité pour les éditions limitées ou véhicules de collection';

-- Historique de circuit
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS track_history TEXT;

COMMENT ON COLUMN vehicles.track_history IS 'Historique d''utilisation sur circuit (description textuelle optionnelle)';

-- ========================================
-- 2. INDEX POUR OPTIMISER LES RECHERCHES
-- ========================================

-- Index pour service_history_complete (filtre fréquent)
CREATE INDEX IF NOT EXISTS idx_vehicles_service_history_complete 
  ON vehicles(service_history_complete) 
  WHERE status = 'active' AND service_history_complete = TRUE;

-- Index pour exhaust_system (filtre passionnés)
CREATE INDEX IF NOT EXISTS idx_vehicles_exhaust_system 
  ON vehicles(exhaust_system) 
  WHERE status = 'active' AND exhaust_system IS NOT NULL;

-- Index pour limited_edition (existant mais vérification)
CREATE INDEX IF NOT EXISTS idx_vehicles_limited_edition 
  ON vehicles(limited_edition) 
  WHERE status = 'active' AND limited_edition = TRUE;

-- Index pour engine_architecture (optimiser recherche par architecture)
CREATE INDEX IF NOT EXISTS idx_vehicles_engine_architecture 
  ON vehicles(engine_architecture) 
  WHERE status = 'active' AND engine_architecture IS NOT NULL;

-- Index composite pour filtres combinés (puissance + architecture)
CREATE INDEX IF NOT EXISTS idx_vehicles_power_architecture 
  ON vehicles(power_hp, engine_architecture) 
  WHERE status = 'active' AND power_hp IS NOT NULL AND engine_architecture IS NOT NULL;

-- ========================================
-- 3. VÉRIFICATION DES CONTRAINTES EXISTANTES
-- ========================================

-- Vérifier que drivetrain accepte bien '4WD'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.check_constraints 
    WHERE constraint_name = 'vehicles_drivetrain_check'
    AND check_clause LIKE '%4WD%'
  ) THEN
    -- Retirer l'ancienne contrainte si elle existe
    ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_drivetrain_check;
    
    -- Ajouter la nouvelle contrainte avec 4WD
    ALTER TABLE vehicles
      ADD CONSTRAINT vehicles_drivetrain_check 
      CHECK (drivetrain IS NULL OR drivetrain IN ('RWD', 'FWD', 'AWD', '4WD'));
  END IF;
END $$;

-- Vérifier que euro_standard accepte toutes les valeurs nécessaires
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.check_constraints 
    WHERE constraint_name = 'vehicles_euro_standard_check'
    AND check_clause LIKE '%euro3%'
  ) THEN
    -- Retirer l'ancienne contrainte si elle existe
    ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_euro_standard_check;
    
    -- Ajouter la nouvelle contrainte avec toutes les normes
    ALTER TABLE vehicles
      ADD CONSTRAINT vehicles_euro_standard_check 
      CHECK (euro_standard IS NULL OR euro_standard IN ('euro3', 'euro4', 'euro5', 'euro6b', 'euro6d'));
  END IF;
END $$;

-- ========================================
-- 4. COMMENTAIRES SUR LES COLONNES EXISTANTES (Documentation)
-- ========================================

COMMENT ON COLUMN vehicles.engine_architecture IS 'Architecture moteur : L4, L5, L6, V6, V8, V10, V12, Flat-6, Moteur Rotatif';
COMMENT ON COLUMN vehicles.drivetrain IS 'Type de transmission : RWD (Propulsion), FWD (Traction), AWD (4x4), 4WD (4x4)';
COMMENT ON COLUMN vehicles.euro_standard IS 'Norme Euro : euro3, euro4, euro5, euro6b, euro6d';
COMMENT ON COLUMN vehicles.power_hp IS 'Puissance en chevaux (ch) - Utilisé pour les filtres de recherche';
COMMENT ON COLUMN vehicles.top_speed IS 'Vitesse maximale en km/h - Utilisé pour les filtres de recherche';

-- ========================================
-- 5. MIGRATION DES DONNÉES EXISTANTES (si nécessaire)
-- ========================================

-- Mettre à jour les véhicules existants avec euro_standard = NULL vers 'euro6d' par défaut
UPDATE vehicles
SET euro_standard = 'euro6d'
WHERE euro_standard IS NULL
  AND created_at >= NOW() - INTERVAL '1 year'; -- Seulement les récents pour éviter d'écraser des données volontaires

-- ========================================
-- FIN DE LA MIGRATION
-- ========================================

-- Vérification finale
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'vehicles'
  AND column_name IN (
    'service_history_complete',
    'exhaust_system',
    'authenticity_certificate_url',
    'track_history',
    'engine_architecture',
    'drivetrain',
    'euro_standard',
    'power_hp',
    'top_speed'
  )
ORDER BY column_name;

