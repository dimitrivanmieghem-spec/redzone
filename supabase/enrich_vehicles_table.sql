-- ========================================
-- REDZONE - ENRICHISSEMENT TABLE VEHICLES
-- ========================================
-- Script pour ajouter les champs manquants pour :
-- 1. Calcul des taxes belges (Wallonie/Flandre)
-- 2. Véhicules sportifs (données techniques avancées)
-- Ce script est idempotent : il peut être exécuté plusieurs fois sans erreur

-- ========================================
-- PHASE 1 : CHAMPS CRITIQUES POUR LES TAXES
-- ========================================

-- 1. Cylindrée en cm³ (OBLIGATOIRE pour calcul CV fiscaux)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'displacement_cc') THEN
    ALTER TABLE vehicles ADD COLUMN displacement_cc INTEGER;
    COMMENT ON COLUMN vehicles.displacement_cc IS 'Cylindrée en cm³ - Nécessaire pour calculer les CV fiscaux belges';
  END IF;
END $$;

-- 2. CO2 WLTP (RECOMMANDÉ pour Flandre)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'co2_wltp') THEN
    ALTER TABLE vehicles ADD COLUMN co2_wltp INTEGER;
    COMMENT ON COLUMN vehicles.co2_wltp IS 'Émissions CO2 en g/km (norme WLTP) - Utilisé pour calcul taxes Flandre';
  END IF;
END $$;

-- 3. Date de première immatriculation (RECOMMANDÉ)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'first_registration_date') THEN
    ALTER TABLE vehicles ADD COLUMN first_registration_date DATE;
    COMMENT ON COLUMN vehicles.first_registration_date IS 'Date de première immatriculation - Plus précis que year pour dégressivité';
  END IF;
END $$;

-- 4. Hybride (RECOMMANDÉ)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'is_hybrid') THEN
    ALTER TABLE vehicles ADD COLUMN is_hybrid BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN vehicles.is_hybrid IS 'Véhicule hybride - Réduction taxes Flandre (50%)';
  END IF;
END $$;

-- 5. Électrique (RECOMMANDÉ)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'is_electric') THEN
    ALTER TABLE vehicles ADD COLUMN is_electric BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN vehicles.is_electric IS 'Véhicule électrique - Exemption taxes Flandre';
  END IF;
END $$;

-- 6. Région d'immatriculation (OPTIONNEL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'region_of_registration') THEN
    ALTER TABLE vehicles ADD COLUMN region_of_registration TEXT CHECK (region_of_registration IN ('wallonie', 'flandre', 'bruxelles'));
    COMMENT ON COLUMN vehicles.region_of_registration IS 'Région d''immatriculation - Permet pré-remplir calculateur taxes';
  END IF;
END $$;

-- ========================================
-- PHASE 2 : CHAMPS POUR VÉHICULES SPORTIFS
-- ========================================

-- 7. Transmission (RWD/FWD/AWD) (RECOMMANDÉ)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'drivetrain') THEN
    ALTER TABLE vehicles ADD COLUMN drivetrain TEXT CHECK (drivetrain IN ('RWD', 'FWD', 'AWD', '4WD'));
    COMMENT ON COLUMN vehicles.drivetrain IS 'Type de transmission - RWD (Propulsion), FWD (Traction), AWD/4WD (4x4)';
  END IF;
END $$;

-- 8. Vitesse maximale (OPTIONNEL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'top_speed') THEN
    ALTER TABLE vehicles ADD COLUMN top_speed INTEGER;
    COMMENT ON COLUMN vehicles.top_speed IS 'Vitesse maximale en km/h';
  END IF;
END $$;

-- 9. Couple en Nm (OPTIONNEL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'torque_nm') THEN
    ALTER TABLE vehicles ADD COLUMN torque_nm INTEGER;
    COMMENT ON COLUMN vehicles.torque_nm IS 'Couple moteur en Newton-mètres (Nm)';
  END IF;
END $$;

-- 10. Configuration moteur (OPTIONNEL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'engine_configuration') THEN
    ALTER TABLE vehicles ADD COLUMN engine_configuration TEXT;
    COMMENT ON COLUMN vehicles.engine_configuration IS 'Configuration moteur - V6, V8, V12, I4, I6, Boxer, W12, etc.';
  END IF;
END $$;

-- 11. Nombre de cylindres (OPTIONNEL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'number_of_cylinders') THEN
    ALTER TABLE vehicles ADD COLUMN number_of_cylinders INTEGER;
    COMMENT ON COLUMN vehicles.number_of_cylinders IS 'Nombre de cylindres';
  END IF;
END $$;

-- 12. Régime de rupture (OPTIONNEL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'redline_rpm') THEN
    ALTER TABLE vehicles ADD COLUMN redline_rpm INTEGER;
    COMMENT ON COLUMN vehicles.redline_rpm IS 'Régime de rupture en tr/min';
  END IF;
END $$;

-- 13. Édition limitée (OPTIONNEL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'limited_edition') THEN
    ALTER TABLE vehicles ADD COLUMN limited_edition BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN vehicles.limited_edition IS 'Édition limitée - Critère de rareté';
  END IF;
END $$;

-- 14. Nombre d'exemplaires produits (OPTIONNEL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'number_produced') THEN
    ALTER TABLE vehicles ADD COLUMN number_produced INTEGER;
    COMMENT ON COLUMN vehicles.number_produced IS 'Nombre d''exemplaires produits - Pour modèles rares';
  END IF;
END $$;

-- 15. Héritage sportif (OPTIONNEL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'racing_heritage') THEN
    ALTER TABLE vehicles ADD COLUMN racing_heritage TEXT;
    COMMENT ON COLUMN vehicles.racing_heritage IS 'Héritage sportif - Ex: "Le Mans Winner", "F1 Technology"';
  END IF;
END $$;

-- 16. Modifications (OPTIONNEL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'modifications') THEN
    ALTER TABLE vehicles ADD COLUMN modifications TEXT[];
    COMMENT ON COLUMN vehicles.modifications IS 'Liste des modifications - Ex: ["Stage 2", "Exhaust", "Suspension"]';
  END IF;
END $$;

-- 17. Prêt pour circuit (OPTIONNEL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'track_ready') THEN
    ALTER TABLE vehicles ADD COLUMN track_ready BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN vehicles.track_ready IS 'Véhicule préparé pour la piste';
  END IF;
END $$;

-- 18. Garantie restante (OPTIONNEL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'warranty_remaining') THEN
    ALTER TABLE vehicles ADD COLUMN warranty_remaining INTEGER;
    COMMENT ON COLUMN vehicles.warranty_remaining IS 'Garantie restante en mois';
  END IF;
END $$;

-- 19. Nombre d'entretiens (OPTIONNEL)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'service_history_count') THEN
    ALTER TABLE vehicles ADD COLUMN service_history_count INTEGER;
    COMMENT ON COLUMN vehicles.service_history_count IS 'Nombre d''entretiens documentés';
  END IF;
END $$;

-- ========================================
-- INDEX POUR PERFORMANCES
-- ========================================

-- Index sur displacement_cc (pour filtres)
CREATE INDEX IF NOT EXISTS idx_vehicles_displacement_cc ON vehicles(displacement_cc) WHERE displacement_cc IS NOT NULL;

-- Index sur drivetrain (pour filtres)
CREATE INDEX IF NOT EXISTS idx_vehicles_drivetrain ON vehicles(drivetrain) WHERE drivetrain IS NOT NULL;

-- Index sur limited_edition (pour filtres)
CREATE INDEX IF NOT EXISTS idx_vehicles_limited_edition ON vehicles(limited_edition) WHERE limited_edition = TRUE;

-- Index sur track_ready (pour filtres)
CREATE INDEX IF NOT EXISTS idx_vehicles_track_ready ON vehicles(track_ready) WHERE track_ready = TRUE;

-- ========================================
-- FONCTION : CALCUL AUTOMATIQUE CV FISCAUX
-- ========================================
-- Cette fonction calcule les CV fiscaux belges à partir de la cylindrée, carburant et norme Euro
-- Formule simplifiée (à adapter selon la formule officielle belge exacte)

CREATE OR REPLACE FUNCTION calculate_fiscal_horsepower(
  p_displacement_cc INTEGER,
  p_fuel_type TEXT,
  p_euro_standard TEXT
) RETURNS INTEGER AS $$
DECLARE
  cv_fiscaux INTEGER;
  base_cv NUMERIC;
BEGIN
  -- Vérifier que la cylindrée est fournie
  IF p_displacement_cc IS NULL OR p_displacement_cc <= 0 THEN
    RETURN NULL;
  END IF;

  -- Calcul de base selon la cylindrée (formule simplifiée)
  -- Formule belge approximative : CV = (cylindrée / 100) * coefficient
  -- Coefficient varie selon carburant et norme Euro
  
  base_cv := (p_displacement_cc::NUMERIC / 100.0);
  
  -- Ajustements selon carburant
  IF p_fuel_type = 'essence' OR p_fuel_type = 'e85' THEN
    base_cv := base_cv * 1.0; -- Coefficient essence
  ELSIF p_fuel_type = 'lpg' THEN
    base_cv := base_cv * 0.9; -- Légère réduction LPG
  END IF;
  
  -- Ajustements selon norme Euro (simplifié)
  -- Les normes Euro récentes peuvent avoir des coefficients différents
  IF p_euro_standard LIKE 'euro6%' THEN
    base_cv := base_cv * 1.0; -- Pas de modification
  ELSIF p_euro_standard LIKE 'euro5%' THEN
    base_cv := base_cv * 1.05; -- Légère augmentation
  ELSIF p_euro_standard LIKE 'euro4%' OR p_euro_standard LIKE 'euro3%' THEN
    base_cv := base_cv * 1.1; -- Augmentation pour anciennes normes
  END IF;
  
  -- Arrondir à l'entier supérieur
  cv_fiscaux := CEIL(base_cv);
  
  -- Valeur minimale de 4 CV
  IF cv_fiscaux < 4 THEN
    cv_fiscaux := 4;
  END IF;
  
  RETURN cv_fiscaux;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_fiscal_horsepower IS 'Calcule les CV fiscaux belges à partir de la cylindrée, carburant et norme Euro';

-- ========================================
-- TRIGGER : MISE À JOUR AUTOMATIQUE CV FISCAUX
-- ========================================
-- Met à jour automatiquement fiscal_horsepower quand displacement_cc, fuel_type ou euro_standard change

CREATE OR REPLACE FUNCTION update_fiscal_horsepower()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer les CV fiscaux si displacement_cc est fourni
  IF NEW.displacement_cc IS NOT NULL AND NEW.displacement_cc > 0 THEN
    NEW.fiscal_horsepower := calculate_fiscal_horsepower(
      NEW.displacement_cc,
      NEW.fuel_type,
      NEW.euro_standard
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_update_fiscal_horsepower ON vehicles;

-- Créer le trigger
CREATE TRIGGER trigger_update_fiscal_horsepower
  BEFORE INSERT OR UPDATE OF displacement_cc, fuel_type, euro_standard ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_fiscal_horsepower();

COMMENT ON TRIGGER trigger_update_fiscal_horsepower ON vehicles IS 'Met à jour automatiquement fiscal_horsepower quand displacement_cc, fuel_type ou euro_standard change';

-- ========================================
-- VUE : VÉHICULES AVEC DONNÉES COMPLÈTES
-- ========================================
-- Vue pour identifier les véhicules avec toutes les données nécessaires pour les taxes

CREATE OR REPLACE VIEW vehicles_complete_tax_data AS
SELECT
  id,
  brand,
  model,
  year,
  price,
  displacement_cc,
  co2_wltp,
  co2,
  fiscal_horsepower,
  fuel_type,
  euro_standard,
  first_registration_date,
  is_hybrid,
  is_electric,
  region_of_registration,
  -- Score de complétude (0-100)
  CASE
    WHEN displacement_cc IS NOT NULL AND co2 IS NOT NULL AND fiscal_horsepower IS NOT NULL THEN 100
    WHEN displacement_cc IS NOT NULL AND co2 IS NOT NULL THEN 80
    WHEN displacement_cc IS NOT NULL THEN 60
    WHEN co2 IS NOT NULL THEN 40
    ELSE 0
  END AS tax_data_completeness_score
FROM vehicles
WHERE status = 'active';

COMMENT ON VIEW vehicles_complete_tax_data IS 'Vue des véhicules actifs avec score de complétude des données fiscales';

-- ========================================
-- VUE : VÉHICULES SPORTIFS ENRICHIS
-- ========================================
-- Vue pour identifier les véhicules avec données sportives complètes

CREATE OR REPLACE VIEW vehicles_sport_complete AS
SELECT
  id,
  brand,
  model,
  year,
  price,
  power_hp,
  torque_nm,
  top_speed,
  zero_a_cent,
  drivetrain,
  engine_configuration,
  number_of_cylinders,
  redline_rpm,
  limited_edition,
  number_produced,
  racing_heritage,
  track_ready,
  -- Score de complétude (0-100)
  (
    CASE WHEN power_hp IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN torque_nm IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN top_speed IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN zero_a_cent IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN drivetrain IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN engine_configuration IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN number_of_cylinders IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN redline_rpm IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN limited_edition IS NOT NULL THEN 5 ELSE 0 END +
    CASE WHEN racing_heritage IS NOT NULL THEN 5 ELSE 0 END
  ) AS sport_data_completeness_score
FROM vehicles
WHERE status = 'active';

COMMENT ON VIEW vehicles_sport_complete IS 'Vue des véhicules actifs avec score de complétude des données sportives';

-- ========================================
-- FIN DU SCRIPT
-- ========================================
-- Ce script a ajouté tous les champs nécessaires pour :
-- 1. Le calcul précis des taxes belges (Wallonie/Flandre)
-- 2. L'enrichissement des données pour véhicules sportifs
-- 3. Le calcul automatique des CV fiscaux
-- 4. Des vues pour identifier les véhicules incomplets

