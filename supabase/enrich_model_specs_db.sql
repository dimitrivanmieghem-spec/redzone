-- ========================================
-- ENRICHISSEMENT TABLE model_specs_db
-- ========================================
-- Ajout de colonnes pour pré-remplissage automatique amélioré
-- Vitesse max, Drivetrain (RWD/FWD/AWD), CO2 WLTP, Couleur standard
-- ========================================

DO $$ 
BEGIN
  -- 1. Vitesse maximale (km/h) - OPTIONNEL mais utile pour pré-remplissage
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'model_specs_db' 
      AND column_name = 'top_speed'
  ) THEN
    ALTER TABLE model_specs_db ADD COLUMN top_speed INTEGER;
    COMMENT ON COLUMN model_specs_db.top_speed IS 'Vitesse maximale en km/h (optionnel)';
  END IF;

  -- 2. Type de transmission (Drivetrain) - RWD/FWD/AWD
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'model_specs_db' 
      AND column_name = 'drivetrain'
  ) THEN
    ALTER TABLE model_specs_db ADD COLUMN drivetrain TEXT CHECK (drivetrain IN ('RWD', 'FWD', 'AWD', '4WD'));
    COMMENT ON COLUMN model_specs_db.drivetrain IS 'Type de transmission: RWD (Propulsion), FWD (Traction), AWD/4WD (4x4)';
  END IF;

  -- 3. CO2 WLTP (pour calcul taxes Flandre) - OPTIONNEL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'model_specs_db' 
      AND column_name = 'co2_wltp'
  ) THEN
    ALTER TABLE model_specs_db ADD COLUMN co2_wltp NUMERIC(6, 2);
    COMMENT ON COLUMN model_specs_db.co2_wltp IS 'Émissions CO2 en g/km (norme WLTP) - Utilisé pour calcul taxes Flandre';
  END IF;

  -- 4. Carrosserie par défaut - Suggérer depuis la base si disponible
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'model_specs_db' 
      AND column_name = 'default_carrosserie'
  ) THEN
    ALTER TABLE model_specs_db ADD COLUMN default_carrosserie TEXT;
    COMMENT ON COLUMN model_specs_db.default_carrosserie IS 'Type de carrosserie par défaut (suggestion)';
  END IF;

  -- 5. Couleur extérieure standard - OPTIONNEL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'model_specs_db' 
      AND column_name = 'default_color'
  ) THEN
    ALTER TABLE model_specs_db ADD COLUMN default_color TEXT;
    COMMENT ON COLUMN model_specs_db.default_color IS 'Couleur extérieure standard (suggestion)';
  END IF;

  -- 6. Nombre de places standard - OPTIONNEL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'model_specs_db' 
      AND column_name = 'default_seats'
  ) THEN
    ALTER TABLE model_specs_db ADD COLUMN default_seats INTEGER;
    COMMENT ON COLUMN model_specs_db.default_seats IS 'Nombre de places standard (suggestion)';
  END IF;

  RAISE NOTICE '✅ Colonnes ajoutées avec succès à model_specs_db';
END $$;

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_model_specs_db_drivetrain ON model_specs_db(drivetrain) WHERE drivetrain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_model_specs_db_top_speed ON model_specs_db(top_speed) WHERE top_speed IS NOT NULL;

-- ========================================
-- MISE À JOUR DES DONNÉES EXISTANTES (Exemples pour véhicules sportifs courants)
-- ========================================
-- Note: Ces données peuvent être enrichies manuellement ou via un import CSV
-- Ces exemples sont basés sur des données publiques connues

-- Exemples pour quelques modèles sportifs populaires (à enrichir progressivement)
-- Porsche 911 GT3 RS (exemple)
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 312,
  co2_wltp = 308,
  default_carrosserie = 'Coupé',
  default_seats = 2
WHERE marque ILIKE 'Porsche' 
  AND modele ILIKE '%911%GT3%RS%'
  AND type = 'car';

-- Porsche 911 Turbo S (exemple)
UPDATE model_specs_db 
SET 
  drivetrain = 'AWD',
  top_speed = 330,
  co2_wltp = 276,
  default_carrosserie = 'Coupé',
  default_seats = 4
WHERE marque ILIKE 'Porsche' 
  AND modele ILIKE '%911%Turbo%S%'
  AND type = 'car';

-- BMW M3 (exemple - modèle récent)
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 250, -- Limité électroniquement, peut être augmenté
  co2_wltp = 225,
  default_carrosserie = 'Berline',
  default_seats = 5
WHERE marque ILIKE 'BMW' 
  AND modele ILIKE '%M3%'
  AND type = 'car';

-- Ferrari 488 GTB (exemple)
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 330,
  co2_wltp = 260,
  default_carrosserie = 'Coupé',
  default_seats = 2
WHERE marque ILIKE 'Ferrari' 
  AND modele ILIKE '%488%GTB%'
  AND type = 'car';

-- Lamborghini Huracán (exemple)
UPDATE model_specs_db 
SET 
  drivetrain = 'AWD',
  top_speed = 325,
  co2_wltp = 278,
  default_carrosserie = 'Coupé',
  default_seats = 2
WHERE marque ILIKE 'Lamborghini' 
  AND modele ILIKE '%Huracán%'
  AND type = 'car';

-- Audi R8 (exemple)
UPDATE model_specs_db 
SET 
  drivetrain = 'AWD',
  top_speed = 331,
  co2_wltp = 287,
  default_carrosserie = 'Coupé',
  default_seats = 2
WHERE marque ILIKE 'Audi' 
  AND modele ILIKE '%R8%'
  AND type = 'car';

-- Mercedes-AMG GT (exemple)
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 318,
  co2_wltp = 269,
  default_carrosserie = 'Coupé',
  default_seats = 2
WHERE marque ILIKE 'Mercedes%' 
  AND (modele ILIKE '%AMG%GT%' OR modele ILIKE '%AMG GT%')
  AND type = 'car';

-- McLaren 720S (exemple)
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 341,
  co2_wltp = 249,
  default_carrosserie = 'Coupé',
  default_seats = 2
WHERE marque ILIKE 'McLaren' 
  AND modele ILIKE '%720S%'
  AND type = 'car';

-- ========================================
-- ENRICHISSEMENT MASSIF - VÉHICULES SPORTIFS POPULAIRES
-- ========================================
-- Données basées sur les spécifications officielles des constructeurs
-- Note: Ces UPDATE utilisent ILIKE pour être tolérants aux variations d'écriture

-- BMW M4 / M4 Competition
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 250,
  co2_wltp = 230,
  default_carrosserie = 'Coupé',
  default_seats = 4,
  default_color = 'Blanc Alpine'
WHERE marque ILIKE 'BMW' 
  AND (modele ILIKE '%M4%' OR modele ILIKE '%M4 Competition%')
  AND type = 'car';

-- BMW M5 / M5 Competition
UPDATE model_specs_db 
SET 
  drivetrain = 'AWD',
  top_speed = 305,
  co2_wltp = 265,
  default_carrosserie = 'Berline',
  default_seats = 5,
  default_color = 'Blanc Alpine'
WHERE marque ILIKE 'BMW' 
  AND (modele ILIKE '%M5%' OR modele ILIKE '%M5 Competition%')
  AND type = 'car';

-- Porsche 911 Carrera
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 293,
  co2_wltp = 240,
  default_carrosserie = 'Coupé',
  default_seats = 4,
  default_color = 'Blanc Carrara'
WHERE marque ILIKE 'Porsche' 
  AND modele ILIKE '%911%'
  AND modele NOT ILIKE '%GT3%'
  AND modele NOT ILIKE '%Turbo%'
  AND type = 'car';

-- Porsche Cayman / 718 Cayman
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 285,
  co2_wltp = 215,
  default_carrosserie = 'Coupé',
  default_seats = 2,
  default_color = 'Rouge Guards'
WHERE marque ILIKE 'Porsche' 
  AND (modele ILIKE '%Cayman%' OR modele ILIKE '%718%')
  AND type = 'car';

-- Porsche Boxster / 718 Boxster
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 277,
  co2_wltp = 210,
  default_carrosserie = 'Cabriolet',
  default_seats = 2,
  default_color = 'Rouge Guards'
WHERE marque ILIKE 'Porsche' 
  AND (modele ILIKE '%Boxster%' OR modele ILIKE '%718 Boxster%')
  AND type = 'car';

-- Audi RS3
UPDATE model_specs_db 
SET 
  drivetrain = 'AWD',
  top_speed = 290,
  co2_wltp = 208,
  default_carrosserie = 'Berline',
  default_seats = 5,
  default_color = 'Noir Mythos'
WHERE marque ILIKE 'Audi' 
  AND modele ILIKE '%RS3%'
  AND type = 'car';

-- Audi RS4
UPDATE model_specs_db 
SET 
  drivetrain = 'AWD',
  top_speed = 280,
  co2_wltp = 228,
  default_carrosserie = 'Break',
  default_seats = 5,
  default_color = 'Noir Mythos'
WHERE marque ILIKE 'Audi' 
  AND modele ILIKE '%RS4%'
  AND type = 'car';

-- Audi RS5
UPDATE model_specs_db 
SET 
  drivetrain = 'AWD',
  top_speed = 280,
  co2_wltp = 223,
  default_carrosserie = 'Coupé',
  default_seats = 4,
  default_color = 'Noir Mythos'
WHERE marque ILIKE 'Audi' 
  AND modele ILIKE '%RS5%'
  AND type = 'car';

-- Audi RS6
UPDATE model_specs_db 
SET 
  drivetrain = 'AWD',
  top_speed = 305,
  co2_wltp = 276,
  default_carrosserie = 'Break',
  default_seats = 5,
  default_color = 'Noir Mythos'
WHERE marque ILIKE 'Audi' 
  AND modele ILIKE '%RS6%'
  AND type = 'car';

-- Mercedes-AMG C63
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 290,
  co2_wltp = 230,
  default_carrosserie = 'Berline',
  default_seats = 5,
  default_color = 'Noir Obsidienne'
WHERE marque ILIKE 'Mercedes%' 
  AND modele ILIKE '%AMG C63%'
  AND type = 'car';

-- Mercedes-AMG E63
UPDATE model_specs_db 
SET 
  drivetrain = 'AWD',
  top_speed = 300,
  co2_wltp = 254,
  default_carrosserie = 'Berline',
  default_seats = 5,
  default_color = 'Noir Obsidienne'
WHERE marque ILIKE 'Mercedes%' 
  AND modele ILIKE '%AMG E63%'
  AND type = 'car';

-- Mercedes-AMG S63
UPDATE model_specs_db 
SET 
  drivetrain = 'AWD',
  top_speed = 290,
  co2_wltp = 265,
  default_carrosserie = 'Berline',
  default_seats = 5,
  default_color = 'Noir Obsidienne'
WHERE marque ILIKE 'Mercedes%' 
  AND modele ILIKE '%AMG S63%'
  AND type = 'car';

-- Lamborghini Aventador
UPDATE model_specs_db 
SET 
  drivetrain = 'AWD',
  top_speed = 350,
  co2_wltp = 370,
  default_carrosserie = 'Coupé',
  default_seats = 2,
  default_color = 'Jaune Giallo Orion'
WHERE marque ILIKE 'Lamborghini' 
  AND modele ILIKE '%Aventador%'
  AND type = 'car';

-- Lamborghini Urus
UPDATE model_specs_db 
SET 
  drivetrain = 'AWD',
  top_speed = 305,
  co2_wltp = 325,
  default_carrosserie = 'SUV',
  default_seats = 5,
  default_color = 'Noir Nero Noctis'
WHERE marque ILIKE 'Lamborghini' 
  AND modele ILIKE '%Urus%'
  AND type = 'car';

-- Ferrari F8 Tributo
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 340,
  co2_wltp = 292,
  default_carrosserie = 'Coupé',
  default_seats = 2,
  default_color = 'Rouge Rosso Scuderia'
WHERE marque ILIKE 'Ferrari' 
  AND modele ILIKE '%F8%'
  AND type = 'car';

-- Ferrari Roma
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 320,
  co2_wltp = 265,
  default_carrosserie = 'Coupé',
  default_seats = 2,
  default_color = 'Rouge Rosso Scuderia'
WHERE marque ILIKE 'Ferrari' 
  AND modele ILIKE '%Roma%'
  AND type = 'car';

-- McLaren 570S
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 328,
  co2_wltp = 249,
  default_carrosserie = 'Coupé',
  default_seats = 2,
  default_color = 'Orange Volcano'
WHERE marque ILIKE 'McLaren' 
  AND modele ILIKE '%570S%'
  AND type = 'car';

-- McLaren 600LT
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 328,
  co2_wltp = 276,
  default_carrosserie = 'Coupé',
  default_seats = 2,
  default_color = 'Orange Volcano'
WHERE marque ILIKE 'McLaren' 
  AND modele ILIKE '%600LT%'
  AND type = 'car';

-- Aston Martin Vantage
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 314,
  co2_wltp = 280,
  default_carrosserie = 'Coupé',
  default_seats = 2,
  default_color = 'Vert British Racing Green'
WHERE marque ILIKE 'Aston Martin' 
  AND modele ILIKE '%Vantage%'
  AND type = 'car';

-- Aston Martin DB11
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 335,
  co2_wltp = 265,
  default_carrosserie = 'Coupé',
  default_seats = 4,
  default_color = 'Vert British Racing Green'
WHERE marque ILIKE 'Aston Martin' 
  AND modele ILIKE '%DB11%'
  AND type = 'car';

-- Lotus Emira
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 290,
  co2_wltp = 195,
  default_carrosserie = 'Coupé',
  default_seats = 2,
  default_color = 'Jaune Hethel Yellow'
WHERE marque ILIKE 'Lotus' 
  AND modele ILIKE '%Emira%'
  AND type = 'car';

-- Lotus Evora
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 280,
  co2_wltp = 200,
  default_carrosserie = 'Coupé',
  default_seats = 2,
  default_color = 'Jaune Hethel Yellow'
WHERE marque ILIKE 'Lotus' 
  AND modele ILIKE '%Evora%'
  AND type = 'car';

-- Ford Mustang GT
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 250,
  co2_wltp = 245,
  default_carrosserie = 'Coupé',
  default_seats = 4,
  default_color = 'Rouge Race Red'
WHERE marque ILIKE 'Ford' 
  AND modele ILIKE '%Mustang%GT%'
  AND type = 'car';

-- Chevrolet Corvette
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 312,
  co2_wltp = 312,
  default_carrosserie = 'Coupé',
  default_seats = 2,
  default_color = 'Rouge Torch Red'
WHERE marque ILIKE 'Chevrolet' 
  AND modele ILIKE '%Corvette%'
  AND type = 'car';

-- Nissan GT-R
UPDATE model_specs_db 
SET 
  drivetrain = 'AWD',
  top_speed = 315,
  co2_wltp = 294,
  default_carrosserie = 'Coupé',
  default_seats = 4,
  default_color = 'Argent Premium Silver'
WHERE marque ILIKE 'Nissan' 
  AND modele ILIKE '%GT-R%'
  AND type = 'car';

-- Toyota Supra
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 250,
  co2_wltp = 181,
  default_carrosserie = 'Coupé',
  default_seats = 2,
  default_color = 'Rouge Renaissance Red'
WHERE marque ILIKE 'Toyota' 
  AND modele ILIKE '%Supra%'
  AND type = 'car';

-- Alpine A110
UPDATE model_specs_db 
SET 
  drivetrain = 'RWD',
  top_speed = 250,
  co2_wltp = 138,
  default_carrosserie = 'Coupé',
  default_seats = 2,
  default_color = 'Bleu Alpine Blue'
WHERE marque ILIKE 'Alpine' 
  AND modele ILIKE '%A110%'
  AND type = 'car';

-- ========================================
-- INSTRUCTIONS POUR ENRICHIR LA BASE
-- ========================================
-- 1. Enrichir progressivement via l'interface admin
-- 2. Import CSV depuis des sources fiables (fiches techniques constructeurs)
-- 3. API externe si disponible (à intégrer dans le code admin)
-- 4. Sources recommandées :
--    - Sites officiels constructeurs
--    - Spécifications techniques publiques
--    - Bases de données automobiles fiables
-- ========================================

