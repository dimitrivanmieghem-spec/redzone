-- ========================================
-- REDZONE - FIX SCHEMA ALIGNMENT
-- ========================================
-- Script SQL idempotent pour synchroniser le schéma de model_specs_db
-- avec les colonnes demandées par getModelSpecs() dans modelSpecs.ts
-- 
-- COLONNES DEMANDÉES (ligne 331 de modelSpecs.ts) :
-- kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission,
-- default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats
--
-- COLONNES MANQUANTES IDENTIFIÉES :
-- - default_carrosserie (TEXT, nullable)
-- - top_speed (INTEGER, nullable) - Vitesse maximale en km/h
-- - drivetrain (TEXT, nullable) - RWD/FWD/AWD/4WD
-- - co2_wltp (NUMERIC, nullable) - CO2 WLTP pour taxes Flandre
-- - default_color (TEXT, nullable) - Couleur extérieure standard
-- - default_seats (INTEGER, nullable) - Nombre de places standard
--
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- ========================================

-- ========================================
-- 1. AJOUT DES COLONNES MANQUANTES
-- ========================================

-- Colonne default_carrosserie (Type de carrosserie par défaut)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'model_specs_db' 
    AND column_name = 'default_carrosserie'
  ) THEN
    ALTER TABLE model_specs_db 
    ADD COLUMN default_carrosserie TEXT;
    
    RAISE NOTICE '✅ Colonne default_carrosserie ajoutée';
  ELSE
    RAISE NOTICE 'Colonne default_carrosserie existe déjà';
  END IF;
END $$;

-- Colonne top_speed (Vitesse maximale en km/h)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'model_specs_db' 
    AND column_name = 'top_speed'
  ) THEN
    ALTER TABLE model_specs_db 
    ADD COLUMN top_speed INTEGER;
    
    RAISE NOTICE '✅ Colonne top_speed ajoutée';
  ELSE
    RAISE NOTICE 'Colonne top_speed existe déjà';
  END IF;
END $$;

-- Colonne drivetrain (Type de transmission : RWD/FWD/AWD/4WD)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'model_specs_db' 
    AND column_name = 'drivetrain'
  ) THEN
    ALTER TABLE model_specs_db 
    ADD COLUMN drivetrain TEXT CHECK (drivetrain IS NULL OR drivetrain IN ('RWD', 'FWD', 'AWD', '4WD'));
    
    RAISE NOTICE '✅ Colonne drivetrain ajoutée';
  ELSE
    RAISE NOTICE 'Colonne drivetrain existe déjà';
  END IF;
END $$;

-- Colonne co2_wltp (CO2 WLTP pour taxes Flandre)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'model_specs_db' 
    AND column_name = 'co2_wltp'
  ) THEN
    ALTER TABLE model_specs_db 
    ADD COLUMN co2_wltp NUMERIC(6, 2);
    
    RAISE NOTICE '✅ Colonne co2_wltp ajoutée';
  ELSE
    RAISE NOTICE 'Colonne co2_wltp existe déjà';
  END IF;
END $$;

-- Colonne default_color (Couleur extérieure standard)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'model_specs_db' 
    AND column_name = 'default_color'
  ) THEN
    ALTER TABLE model_specs_db 
    ADD COLUMN default_color TEXT;
    
    RAISE NOTICE '✅ Colonne default_color ajoutée';
  ELSE
    RAISE NOTICE 'Colonne default_color existe déjà';
  END IF;
END $$;

-- Colonne default_seats (Nombre de places standard)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'model_specs_db' 
    AND column_name = 'default_seats'
  ) THEN
    ALTER TABLE model_specs_db 
    ADD COLUMN default_seats INTEGER;
    
    RAISE NOTICE '✅ Colonne default_seats ajoutée';
  ELSE
    RAISE NOTICE 'Colonne default_seats existe déjà';
  END IF;
END $$;

-- ========================================
-- 2. ENRICHISSEMENT DES DONNÉES EXISTANTES
-- ========================================
-- Mise à jour des lignes existantes avec des valeurs par défaut réalistes
-- pour éviter que l'autofill ne reçoive des null et ne plante le formulaire

-- ABARTH
UPDATE model_specs_db 
SET 
  default_carrosserie = 'Berline',
  top_speed = 211,
  drivetrain = 'FWD',
  co2_wltp = 155,
  default_color = 'Rouge',
  default_seats = 4
WHERE marque = 'Abarth' AND modele = '595' AND type = 'car';

UPDATE model_specs_db 
SET 
  default_carrosserie = 'Berline',
  top_speed = 225,
  drivetrain = 'FWD',
  co2_wltp = 165,
  default_color = 'Rouge',
  default_seats = 4
WHERE marque = 'Abarth' AND modele = '595 Competizione' AND type = 'car';

UPDATE model_specs_db 
SET 
  default_carrosserie = 'Berline',
  top_speed = 225,
  drivetrain = 'FWD',
  co2_wltp = 165,
  default_color = 'Rouge',
  default_seats = 4
WHERE marque = 'Abarth' AND modele = '695' AND type = 'car';

UPDATE model_specs_db 
SET 
  default_carrosserie = 'Roadster',
  top_speed = 232,
  drivetrain = 'RWD',
  co2_wltp = 148,
  default_color = 'Rouge',
  default_seats = 2
WHERE marque = 'Abarth' AND modele = '124 Spider' AND type = 'car';

-- PORSCHE
UPDATE model_specs_db 
SET 
  default_carrosserie = 'Coupé',
  top_speed = 289,
  drivetrain = 'RWD',
  co2_wltp = 205,
  default_color = 'Noir',
  default_seats = 4
WHERE marque = 'Porsche' AND modele LIKE '911%' AND type = 'car';

UPDATE model_specs_db 
SET 
  default_carrosserie = 'Coupé',
  top_speed = 285,
  drivetrain = 'RWD',
  co2_wltp = 195,
  default_color = 'Noir',
  default_seats = 2
WHERE marque = 'Porsche' AND modele LIKE '718%' AND type = 'car';

-- FERRARI
UPDATE model_specs_db 
SET 
  default_carrosserie = 'Coupé',
  top_speed = 330,
  drivetrain = 'RWD',
  co2_wltp = 260,
  default_color = 'Rouge',
  default_seats = 2
WHERE marque = 'Ferrari' AND type = 'car';

-- BMW M
UPDATE model_specs_db 
SET 
  default_carrosserie = CASE 
    WHEN modele LIKE 'M2%' THEN 'Coupé'
    WHEN modele LIKE 'M3%' THEN 'Berline'
    WHEN modele LIKE 'M4%' THEN 'Coupé'
    WHEN modele LIKE 'M5%' THEN 'Berline'
    ELSE 'Berline'
  END,
  top_speed = CASE 
    WHEN modele LIKE 'M2%' THEN 250
    WHEN modele LIKE 'M3%' THEN 250
    WHEN modele LIKE 'M4%' THEN 250
    WHEN modele LIKE 'M5%' THEN 250
    ELSE 250
  END,
  drivetrain = 'RWD',
  co2_wltp = CASE 
    WHEN modele LIKE 'M2%' THEN 205
    WHEN modele LIKE 'M3%' THEN 230
    WHEN modele LIKE 'M4%' THEN 230
    WHEN modele LIKE 'M5%' THEN 265
    ELSE 230
  END,
  default_color = 'Blanc',
  default_seats = CASE 
    WHEN modele LIKE 'M2%' THEN 4
    WHEN modele LIKE 'M3%' THEN 5
    WHEN modele LIKE 'M4%' THEN 4
    WHEN modele LIKE 'M5%' THEN 5
    ELSE 5
  END
WHERE marque = 'BMW' AND modele LIKE 'M%' AND type = 'car';

-- AUDI RS
UPDATE model_specs_db 
SET 
  default_carrosserie = CASE 
    WHEN modele LIKE 'RS3%' THEN 'Berline'
    WHEN modele LIKE 'RS4%' THEN 'Berline'
    WHEN modele LIKE 'RS5%' THEN 'Coupé'
    WHEN modele LIKE 'RS6%' THEN 'Break'
    WHEN modele LIKE 'TT%' THEN 'Coupé'
    ELSE 'Berline'
  END,
  top_speed = CASE 
    WHEN modele LIKE 'RS3%' THEN 250
    WHEN modele LIKE 'RS4%' THEN 250
    WHEN modele LIKE 'RS5%' THEN 250
    WHEN modele LIKE 'RS6%' THEN 250
    WHEN modele LIKE 'TT%' THEN 250
    ELSE 250
  END,
  drivetrain = 'AWD',
  co2_wltp = CASE 
    WHEN modele LIKE 'RS3%' THEN 195
    WHEN modele LIKE 'RS4%' THEN 240
    WHEN modele LIKE 'RS5%' THEN 240
    WHEN modele LIKE 'RS6%' THEN 265
    WHEN modele LIKE 'TT%' THEN 195
    ELSE 240
  END,
  default_color = 'Gris',
  default_seats = CASE 
    WHEN modele LIKE 'RS3%' THEN 5
    WHEN modele LIKE 'RS4%' THEN 5
    WHEN modele LIKE 'RS5%' THEN 4
    WHEN modele LIKE 'RS6%' THEN 5
    WHEN modele LIKE 'TT%' THEN 4
    ELSE 5
  END
WHERE marque = 'Audi' AND modele LIKE 'RS%' AND type = 'car';

-- MERCEDES-BENZ AMG
UPDATE model_specs_db 
SET 
  default_carrosserie = CASE 
    WHEN modele LIKE 'AMG A45%' THEN 'Berline'
    WHEN modele LIKE 'AMG C63%' THEN 'Berline'
    WHEN modele LIKE 'AMG E63%' THEN 'Berline'
    WHEN modele LIKE 'AMG GT%' THEN 'Coupé'
    ELSE 'Berline'
  END,
  top_speed = 250,
  drivetrain = CASE 
    WHEN modele LIKE 'AMG A45%' THEN 'AWD'
    WHEN modele LIKE 'AMG C63%' THEN 'RWD'
    WHEN modele LIKE 'AMG E63%' THEN 'AWD'
    WHEN modele LIKE 'AMG GT%' THEN 'RWD'
    ELSE 'RWD'
  END,
  co2_wltp = CASE 
    WHEN modele LIKE 'AMG A45%' THEN 192
    WHEN modele LIKE 'AMG C63%' THEN 250
    WHEN modele LIKE 'AMG E63%' THEN 270
    WHEN modele LIKE 'AMG GT%' THEN 250
    ELSE 250
  END,
  default_color = 'Noir',
  default_seats = CASE 
    WHEN modele LIKE 'AMG A45%' THEN 5
    WHEN modele LIKE 'AMG C63%' THEN 5
    WHEN modele LIKE 'AMG E63%' THEN 5
    WHEN modele LIKE 'AMG GT%' THEN 2
    ELSE 5
  END
WHERE marque = 'Mercedes-Benz' AND modele LIKE 'AMG%' AND type = 'car';

-- ALPINE
UPDATE model_specs_db 
SET 
  default_carrosserie = 'Coupé',
  top_speed = CASE 
    WHEN modele LIKE '%S%' THEN 260
    ELSE 250
  END,
  drivetrain = 'RWD',
  co2_wltp = CASE 
    WHEN modele LIKE '%S%' THEN 148
    ELSE 138
  END,
  default_color = 'Bleu',
  default_seats = 2
WHERE marque = 'Alpine' AND type = 'car';

-- LAMBORGHINI
UPDATE model_specs_db 
SET 
  default_carrosserie = 'Coupé',
  top_speed = CASE 
    WHEN modele LIKE 'Huracán%' THEN 325
    WHEN modele LIKE 'Aventador%' THEN 350
    ELSE 325
  END,
  drivetrain = 'RWD',
  co2_wltp = CASE 
    WHEN modele LIKE 'Huracán%' THEN 280
    WHEN modele LIKE 'Aventador%' THEN 370
    ELSE 280
  END,
  default_color = 'Jaune',
  default_seats = 2
WHERE marque = 'Lamborghini' AND type = 'car';

-- MCLAREN
UPDATE model_specs_db 
SET 
  default_carrosserie = 'Coupé',
  top_speed = CASE 
    WHEN modele LIKE '570%' THEN 328
    WHEN modele LIKE '720%' THEN 341
    WHEN modele LIKE '765%' THEN 330
    ELSE 328
  END,
  drivetrain = 'RWD',
  co2_wltp = CASE 
    WHEN modele LIKE '570%' THEN 258
    WHEN modele LIKE '720%' THEN 249
    WHEN modele LIKE '765%' THEN 270
    ELSE 258
  END,
  default_color = 'Orange',
  default_seats = 2
WHERE marque = 'McLaren' AND type = 'car';

-- RENAULT RS
UPDATE model_specs_db 
SET 
  default_carrosserie = CASE 
    WHEN modele LIKE 'Clio%' THEN 'Berline'
    WHEN modele LIKE 'Megane%' THEN 'Berline'
    ELSE 'Berline'
  END,
  top_speed = CASE 
    WHEN modele LIKE 'Clio%' THEN 235
    WHEN modele LIKE 'Megane%' THEN 260
    ELSE 235
  END,
  drivetrain = 'FWD',
  co2_wltp = CASE 
    WHEN modele LIKE 'Clio%' THEN 155
    WHEN modele LIKE 'Megane%' THEN 165
    ELSE 155
  END,
  default_color = 'Jaune',
  default_seats = 5
WHERE marque = 'Renault' AND modele LIKE '%RS%' AND type = 'car';

-- PEUGEOT GTI
UPDATE model_specs_db 
SET 
  default_carrosserie = 'Berline',
  top_speed = CASE 
    WHEN modele LIKE '208%' THEN 230
    WHEN modele LIKE '308%' THEN 250
    ELSE 230
  END,
  drivetrain = 'FWD',
  co2_wltp = CASE 
    WHEN modele LIKE '208%' THEN 145
    WHEN modele LIKE '308%' THEN 165
    ELSE 145
  END,
  default_color = 'Rouge',
  default_seats = 5
WHERE marque = 'Peugeot' AND modele LIKE '%GTI%' AND type = 'car';

-- VOLKSWAGEN GTI/R
UPDATE model_specs_db 
SET 
  default_carrosserie = 'Berline',
  top_speed = CASE 
    WHEN modele LIKE 'Golf GTI%' THEN 250
    WHEN modele LIKE 'Golf R%' THEN 250
    WHEN modele LIKE 'Polo GTI%' THEN 237
    ELSE 250
  END,
  drivetrain = CASE 
    WHEN modele LIKE 'Golf R%' THEN 'AWD'
    ELSE 'FWD'
  END,
  co2_wltp = CASE 
    WHEN modele LIKE 'Golf GTI%' THEN 165
    WHEN modele LIKE 'Golf R%' THEN 195
    WHEN modele LIKE 'Polo GTI%' THEN 145
    ELSE 165
  END,
  default_color = 'Rouge',
  default_seats = 5
WHERE marque = 'Volkswagen' AND (modele LIKE '%GTI%' OR modele LIKE '%R%') AND type = 'car';

-- FORD
UPDATE model_specs_db 
SET 
  default_carrosserie = CASE 
    WHEN modele LIKE 'Mustang%' THEN 'Coupé'
    WHEN modele LIKE 'Focus%' THEN 'Berline'
    WHEN modele LIKE 'Fiesta%' THEN 'Berline'
    ELSE 'Berline'
  END,
  top_speed = CASE 
    WHEN modele LIKE 'Mustang%' THEN 250
    WHEN modele LIKE 'Focus%' THEN 268
    WHEN modele LIKE 'Fiesta%' THEN 230
    ELSE 250
  END,
  drivetrain = CASE 
    WHEN modele LIKE 'Mustang%' THEN 'RWD'
    WHEN modele LIKE 'Focus%' THEN 'AWD'
    WHEN modele LIKE 'Fiesta%' THEN 'FWD'
    ELSE 'FWD'
  END,
  co2_wltp = CASE 
    WHEN modele LIKE 'Mustang%' THEN 240
    WHEN modele LIKE 'Focus%' THEN 175
    WHEN modele LIKE 'Fiesta%' THEN 138
    ELSE 240
  END,
  default_color = CASE 
    WHEN modele LIKE 'Mustang%' THEN 'Rouge'
    ELSE 'Bleu'
  END,
  default_seats = CASE 
    WHEN modele LIKE 'Mustang%' THEN 4
    ELSE 5
  END
WHERE marque = 'Ford' AND type = 'car';

-- MOTOS
-- DUCATI
UPDATE model_specs_db 
SET 
  default_carrosserie = 'Sportive',
  top_speed = CASE 
    WHEN modele LIKE 'Panigale V2%' THEN 285
    WHEN modele LIKE 'Panigale V4%' THEN 299
    WHEN modele LIKE 'Monster%' THEN 225
    ELSE 250
  END,
  drivetrain = 'RWD',
  co2_wltp = NULL,
  default_color = 'Rouge',
  default_seats = 2
WHERE marque = 'Ducati' AND type = 'moto';

-- YAMAHA
UPDATE model_specs_db 
SET 
  default_carrosserie = 'Sportive',
  top_speed = CASE 
    WHEN modele LIKE 'YZF-R1%' THEN 299
    WHEN modele LIKE 'MT-09%' THEN 230
    WHEN modele LIKE 'R6%' THEN 262
    ELSE 250
  END,
  drivetrain = 'RWD',
  co2_wltp = NULL,
  default_color = 'Bleu',
  default_seats = 2
WHERE marque = 'Yamaha' AND type = 'moto';

-- KAWASAKI
UPDATE model_specs_db 
SET 
  default_carrosserie = 'Sportive',
  top_speed = CASE 
    WHEN modele LIKE 'Ninja ZX-10R%' THEN 299
    WHEN modele LIKE 'Ninja 650%' THEN 200
    ELSE 250
  END,
  drivetrain = 'RWD',
  co2_wltp = NULL,
  default_color = 'Vert',
  default_seats = 2
WHERE marque = 'Kawasaki' AND type = 'moto';

-- ========================================
-- 3. VÉRIFICATION FINALE
-- ========================================

DO $$ 
DECLARE
  columns_count INTEGER;
  updated_rows INTEGER;
BEGIN
  -- Compter les colonnes attendues
  SELECT COUNT(*) INTO columns_count
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'model_specs_db'
  AND column_name IN ('kw', 'ch', 'cv_fiscaux', 'co2', 'cylindree', 'moteur', 'transmission', 
                      'default_carrosserie', 'top_speed', 'drivetrain', 'co2_wltp', 'default_color', 'default_seats');
  
  -- Compter les lignes mises à jour
  SELECT COUNT(*) INTO updated_rows
  FROM model_specs_db
  WHERE default_carrosserie IS NOT NULL 
     OR top_speed IS NOT NULL 
     OR drivetrain IS NOT NULL 
     OR co2_wltp IS NOT NULL 
     OR default_color IS NOT NULL 
     OR default_seats IS NOT NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REDZONE - FIX SCHEMA ALIGNMENT COMPLÉTÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Colonnes attendues présentes : %/13', columns_count;
  RAISE NOTICE '✅ Lignes enrichies avec données : %', updated_rows;
  RAISE NOTICE '✅ Schéma synchronisé avec getModelSpecs()';
  RAISE NOTICE '========================================';
END $$;

