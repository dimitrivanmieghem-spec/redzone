-- ========================================
-- REDZONE - ENRICHISSEMENT BASE DE DONNÉES VÉHICULES SPORTIFS
-- ========================================
-- Script pour enrichir la table model_specs_db avec des véhicules sportifs
-- De la Fiat Abarth à la Ferrari, en passant par les RS3, GTI, etc.
-- Ce script est idempotent : il peut être exécuté plusieurs fois sans erreur

-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- RECOMMANDATION : Faire une sauvegarde avant d'exécuter ce script

DO $$
BEGIN
  -- Vérifier que la table existe
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'model_specs_db') THEN
    RAISE EXCEPTION 'La table model_specs_db n''existe pas. Exécutez d''abord le script de création de la table.';
  END IF;

  RAISE NOTICE '🚀 Début de l''enrichissement de la base de données...';
END $$;

-- ========================================
-- 1. FIAT ABARTH
-- ========================================
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats, is_active)
VALUES
  ('Fiat', 'Abarth 500', 'car', 99, 135, 7, 155, 1368, 'L4 Turbo', 'Manuelle', 'Coupé', 205, 'FWD', 155, 'Rouge', '2', true),
  ('Fiat', 'Abarth 695', 'car', 132, 180, 9, 161, 1368, 'L4 Turbo', 'Manuelle', 'Coupé', 225, 'FWD', 161, 'Rouge', '2', true),
  ('Fiat', 'Abarth 124 Spider', 'car', 125, 170, 8, 148, 1368, 'L4 Turbo', 'Manuelle', 'Cabriolet', 230, 'RWD', 148, 'Rouge', '2', true)
ON CONFLICT (marque, modele, type) DO UPDATE SET
  kw = EXCLUDED.kw,
  ch = EXCLUDED.ch,
  cv_fiscaux = EXCLUDED.cv_fiscaux,
  co2 = EXCLUDED.co2,
  cylindree = EXCLUDED.cylindree,
  moteur = EXCLUDED.moteur,
  transmission = EXCLUDED.transmission,
  default_carrosserie = EXCLUDED.default_carrosserie,
  top_speed = EXCLUDED.top_speed,
  drivetrain = EXCLUDED.drivetrain,
  co2_wltp = EXCLUDED.co2_wltp,
  default_color = EXCLUDED.default_color,
  default_seats = EXCLUDED.default_seats,
  is_active = true,
  updated_at = NOW();

-- ========================================
-- 2. AUDI (RS3, RS4, RS5, RS6, RS7, R8)
-- ========================================
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats, is_active)
VALUES
  ('Audi', 'RS3', 'car', 294, 400, 20, 189, 2480, 'L5 Turbo', 'Automatique', 'Berline', 250, 'AWD', 189, 'Gris', '5', true),
  ('Audi', 'RS4', 'car', 331, 450, 22, 199, 2894, 'V6 Biturbo', 'Automatique', 'Break', 250, 'AWD', 199, 'Gris', '5', true),
  ('Audi', 'RS5', 'car', 331, 450, 22, 199, 2894, 'V6 Biturbo', 'Automatique', 'Coupé', 250, 'AWD', 199, 'Gris', '4', true),
  ('Audi', 'RS6', 'car', 441, 600, 28, 220, 3993, 'V8 Biturbo', 'Automatique', 'Break', 250, 'AWD', 220, 'Gris', '5', true),
  ('Audi', 'RS7', 'car', 441, 600, 28, 220, 3993, 'V8 Biturbo', 'Automatique', 'Berline', 250, 'AWD', 220, 'Gris', '5', true),
  ('Audi', 'R8', 'car', 419, 570, 26, 275, 5204, 'V10', 'Automatique', 'Coupé', 320, 'AWD', 275, 'Rouge', '2', true),
  ('Audi', 'R8 V10 Plus', 'car', 449, 610, 28, 275, 5204, 'V10', 'Automatique', 'Coupé', 330, 'AWD', 275, 'Rouge', '2', true)
ON CONFLICT (marque, modele, type) DO UPDATE SET
  kw = EXCLUDED.kw,
  ch = EXCLUDED.ch,
  cv_fiscaux = EXCLUDED.cv_fiscaux,
  co2 = EXCLUDED.co2,
  cylindree = EXCLUDED.cylindree,
  moteur = EXCLUDED.moteur,
  transmission = EXCLUDED.transmission,
  default_carrosserie = EXCLUDED.default_carrosserie,
  top_speed = EXCLUDED.top_speed,
  drivetrain = EXCLUDED.drivetrain,
  co2_wltp = EXCLUDED.co2_wltp,
  default_color = EXCLUDED.default_color,
  default_seats = EXCLUDED.default_seats,
  is_active = true,
  updated_at = NOW();

-- ========================================
-- 3. FERRARI
-- ========================================
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats, is_active)
VALUES
  ('Ferrari', '488 GTB', 'car', 492, 670, 30, 260, 3902, 'V8 Turbo', 'Automatique', 'Coupé', 330, 'RWD', 260, 'Rouge', '2', true),
  ('Ferrari', '488 Pista', 'car', 530, 720, 32, 260, 3902, 'V8 Turbo', 'Automatique', 'Coupé', 340, 'RWD', 260, 'Rouge', '2', true),
  ('Ferrari', 'F8 Tributo', 'car', 530, 720, 32, 260, 3902, 'V8 Turbo', 'Automatique', 'Coupé', 340, 'RWD', 260, 'Rouge', '2', true),
  ('Ferrari', '812 Superfast', 'car', 588, 800, 36, 340, 6496, 'V12', 'Automatique', 'Coupé', 340, 'RWD', 340, 'Rouge', '2', true),
  ('Ferrari', 'SF90 Stradale', 'car', 735, 1000, 45, 0, 3990, 'V8 Turbo Hybride', 'Automatique', 'Coupé', 340, 'AWD', 0, 'Rouge', '2', true),
  ('Ferrari', 'Roma', 'car', 456, 620, 28, 255, 3855, 'V8 Turbo', 'Automatique', 'Coupé', 320, 'RWD', 255, 'Rouge', '2', true)
ON CONFLICT (marque, modele, type) DO UPDATE SET
  kw = EXCLUDED.kw,
  ch = EXCLUDED.ch,
  cv_fiscaux = EXCLUDED.cv_fiscaux,
  co2 = EXCLUDED.co2,
  cylindree = EXCLUDED.cylindree,
  moteur = EXCLUDED.moteur,
  transmission = EXCLUDED.transmission,
  default_carrosserie = EXCLUDED.default_carrosserie,
  top_speed = EXCLUDED.top_speed,
  drivetrain = EXCLUDED.drivetrain,
  co2_wltp = EXCLUDED.co2_wltp,
  default_color = EXCLUDED.default_color,
  default_seats = EXCLUDED.default_seats,
  is_active = true,
  updated_at = NOW();

-- ========================================
-- 4. VOLKSWAGEN (GTI, R, Golf R)
-- ========================================
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats, is_active)
VALUES
  ('Volkswagen', 'Golf GTI', 'car', 180, 245, 12, 164, 1984, 'L4 Turbo', 'Manuelle', 'Berline', 250, 'FWD', 164, 'Rouge', '5', true),
  ('Volkswagen', 'Golf GTI Clubsport', 'car', 221, 300, 15, 179, 1984, 'L4 Turbo', 'Manuelle', 'Berline', 250, 'FWD', 179, 'Rouge', '5', true),
  ('Volkswagen', 'Golf R', 'car', 235, 320, 16, 189, 1984, 'L4 Turbo', 'Automatique', 'Berline', 250, 'AWD', 189, 'Bleu', '5', true),
  ('Volkswagen', 'Golf R32', 'car', 184, 250, 13, 237, 3189, 'V6', 'Manuelle', 'Berline', 250, 'AWD', 237, 'Bleu', '5', true),
  ('Volkswagen', 'Scirocco R', 'car', 195, 265, 13, 189, 1984, 'L4 Turbo', 'Manuelle', 'Coupé', 250, 'FWD', 189, 'Rouge', '4', true)
ON CONFLICT (marque, modele, type) DO UPDATE SET
  kw = EXCLUDED.kw,
  ch = EXCLUDED.ch,
  cv_fiscaux = EXCLUDED.cv_fiscaux,
  co2 = EXCLUDED.co2,
  cylindree = EXCLUDED.cylindree,
  moteur = EXCLUDED.moteur,
  transmission = EXCLUDED.transmission,
  default_carrosserie = EXCLUDED.default_carrosserie,
  top_speed = EXCLUDED.top_speed,
  drivetrain = EXCLUDED.drivetrain,
  co2_wltp = EXCLUDED.co2_wltp,
  default_color = EXCLUDED.default_color,
  default_seats = EXCLUDED.default_seats,
  is_active = true,
  updated_at = NOW();

-- ========================================
-- 5. BMW (M Series)
-- ========================================
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats, is_active)
VALUES
  ('BMW', 'M2', 'car', 272, 370, 18, 199, 2979, 'L6 Turbo', 'Manuelle', 'Coupé', 250, 'RWD', 199, 'Bleu', '4', true),
  ('BMW', 'M3', 'car', 331, 450, 22, 199, 2993, 'L6 Turbo', 'Automatique', 'Berline', 250, 'RWD', 199, 'Bleu', '5', true),
  ('BMW', 'M4', 'car', 331, 450, 22, 199, 2993, 'L6 Turbo', 'Automatique', 'Coupé', 250, 'RWD', 199, 'Bleu', '4', true),
  ('BMW', 'M5', 'car', 441, 600, 28, 220, 4395, 'V8 Turbo', 'Automatique', 'Berline', 250, 'AWD', 220, 'Bleu', '5', true),
  ('BMW', 'M8', 'car', 441, 600, 28, 220, 4395, 'V8 Turbo', 'Automatique', 'Coupé', 250, 'AWD', 220, 'Bleu', '4', true)
ON CONFLICT (marque, modele, type) DO UPDATE SET
  kw = EXCLUDED.kw,
  ch = EXCLUDED.ch,
  cv_fiscaux = EXCLUDED.cv_fiscaux,
  co2 = EXCLUDED.co2,
  cylindree = EXCLUDED.cylindree,
  moteur = EXCLUDED.moteur,
  transmission = EXCLUDED.transmission,
  default_carrosserie = EXCLUDED.default_carrosserie,
  top_speed = EXCLUDED.top_speed,
  drivetrain = EXCLUDED.drivetrain,
  co2_wltp = EXCLUDED.co2_wltp,
  default_color = EXCLUDED.default_color,
  default_seats = EXCLUDED.default_seats,
  is_active = true,
  updated_at = NOW();

-- ========================================
-- 6. MERCEDES-AMG
-- ========================================
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats, is_active)
VALUES
  ('Mercedes-Benz', 'AMG A45', 'car', 280, 381, 19, 189, 1991, 'L4 Turbo', 'Automatique', 'Berline', 250, 'AWD', 189, 'Argent', '5', true),
  ('Mercedes-Benz', 'AMG C63', 'car', 350, 476, 23, 209, 3982, 'V8 Biturbo', 'Automatique', 'Berline', 250, 'RWD', 209, 'Argent', '5', true),
  ('Mercedes-Benz', 'AMG E63', 'car', 420, 571, 27, 220, 3982, 'V8 Biturbo', 'Automatique', 'Berline', 250, 'AWD', 220, 'Argent', '5', true),
  ('Mercedes-Benz', 'AMG GT', 'car', 350, 476, 23, 209, 3982, 'V8 Biturbo', 'Automatique', 'Coupé', 310, 'RWD', 209, 'Argent', '2', true),
  ('Mercedes-Benz', 'AMG GT R', 'car', 430, 585, 28, 220, 3982, 'V8 Biturbo', 'Automatique', 'Coupé', 318, 'RWD', 220, 'Vert', '2', true)
ON CONFLICT (marque, modele, type) DO UPDATE SET
  kw = EXCLUDED.kw,
  ch = EXCLUDED.ch,
  cv_fiscaux = EXCLUDED.cv_fiscaux,
  co2 = EXCLUDED.co2,
  cylindree = EXCLUDED.cylindree,
  moteur = EXCLUDED.moteur,
  transmission = EXCLUDED.transmission,
  default_carrosserie = EXCLUDED.default_carrosserie,
  top_speed = EXCLUDED.top_speed,
  drivetrain = EXCLUDED.drivetrain,
  co2_wltp = EXCLUDED.co2_wltp,
  default_color = EXCLUDED.default_color,
  default_seats = EXCLUDED.default_seats,
  is_active = true,
  updated_at = NOW();

-- ========================================
-- 7. PORSCHE
-- ========================================
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats, is_active)
VALUES
  ('Porsche', '911 Carrera', 'car', 283, 385, 19, 205, 2981, 'Flat-6 Turbo', 'Automatique', 'Coupé', 293, 'RWD', 205, 'Rouge', '4', true),
  ('Porsche', '911 Turbo', 'car', 427, 580, 28, 220, 3745, 'Flat-6 Turbo', 'Automatique', 'Coupé', 320, 'AWD', 220, 'Rouge', '4', true),
  ('Porsche', '911 GT3', 'car', 375, 510, 24, 275, 3996, 'Flat-6', 'Manuelle', 'Coupé', 318, 'RWD', 275, 'Rouge', '2', true),
  ('Porsche', 'Cayman GT4', 'car', 309, 420, 20, 250, 3996, 'Flat-6', 'Manuelle', 'Coupé', 293, 'RWD', 250, 'Rouge', '2', true),
  ('Porsche', '718 Boxster', 'car', 220, 300, 15, 195, 1988, 'Flat-4 Turbo', 'Automatique', 'Cabriolet', 275, 'RWD', 195, 'Rouge', '2', true)
ON CONFLICT (marque, modele, type) DO UPDATE SET
  kw = EXCLUDED.kw,
  ch = EXCLUDED.ch,
  cv_fiscaux = EXCLUDED.cv_fiscaux,
  co2 = EXCLUDED.co2,
  cylindree = EXCLUDED.cylindree,
  moteur = EXCLUDED.moteur,
  transmission = EXCLUDED.transmission,
  default_carrosserie = EXCLUDED.default_carrosserie,
  top_speed = EXCLUDED.top_speed,
  drivetrain = EXCLUDED.drivetrain,
  co2_wltp = EXCLUDED.co2_wltp,
  default_color = EXCLUDED.default_color,
  default_seats = EXCLUDED.default_seats,
  is_active = true,
  updated_at = NOW();

-- ========================================
-- 8. LAMBORGHINI
-- ========================================
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats, is_active)
VALUES
  ('Lamborghini', 'Huracán', 'car', 449, 610, 28, 275, 5204, 'V10', 'Automatique', 'Coupé', 325, 'AWD', 275, 'Jaune', '2', true),
  ('Lamborghini', 'Huracán Performante', 'car', 470, 640, 30, 275, 5204, 'V10', 'Automatique', 'Coupé', 325, 'AWD', 275, 'Jaune', '2', true),
  ('Lamborghini', 'Aventador', 'car', 515, 700, 33, 370, 6498, 'V12', 'Automatique', 'Coupé', 350, 'AWD', 370, 'Jaune', '2', true),
  ('Lamborghini', 'Aventador SVJ', 'car', 566, 770, 36, 370, 6498, 'V12', 'Automatique', 'Coupé', 350, 'AWD', 370, 'Jaune', '2', true)
ON CONFLICT (marque, modele, type) DO UPDATE SET
  kw = EXCLUDED.kw,
  ch = EXCLUDED.ch,
  cv_fiscaux = EXCLUDED.cv_fiscaux,
  co2 = EXCLUDED.co2,
  cylindree = EXCLUDED.cylindree,
  moteur = EXCLUDED.moteur,
  transmission = EXCLUDED.transmission,
  default_carrosserie = EXCLUDED.default_carrosserie,
  top_speed = EXCLUDED.top_speed,
  drivetrain = EXCLUDED.drivetrain,
  co2_wltp = EXCLUDED.co2_wltp,
  default_color = EXCLUDED.default_color,
  default_seats = EXCLUDED.default_seats,
  is_active = true,
  updated_at = NOW();

-- ========================================
-- 9. MCLAREN
-- ========================================
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats, is_active)
VALUES
  ('McLaren', '570S', 'car', 419, 570, 26, 258, 3799, 'V8 Turbo', 'Automatique', 'Coupé', 328, 'RWD', 258, 'Orange', '2', true),
  ('McLaren', '720S', 'car', 530, 720, 32, 249, 3994, 'V8 Turbo', 'Automatique', 'Coupé', 341, 'RWD', 249, 'Orange', '2', true),
  ('McLaren', '765LT', 'car', 563, 765, 36, 249, 3994, 'V8 Turbo', 'Automatique', 'Coupé', 330, 'RWD', 249, 'Orange', '2', true)
ON CONFLICT (marque, modele, type) DO UPDATE SET
  kw = EXCLUDED.kw,
  ch = EXCLUDED.ch,
  cv_fiscaux = EXCLUDED.cv_fiscaux,
  co2 = EXCLUDED.co2,
  cylindree = EXCLUDED.cylindree,
  moteur = EXCLUDED.moteur,
  transmission = EXCLUDED.transmission,
  default_carrosserie = EXCLUDED.default_carrosserie,
  top_speed = EXCLUDED.top_speed,
  drivetrain = EXCLUDED.drivetrain,
  co2_wltp = EXCLUDED.co2_wltp,
  default_color = EXCLUDED.default_color,
  default_seats = EXCLUDED.default_seats,
  is_active = true,
  updated_at = NOW();

-- ========================================
-- 10. AUTRES SPORTIVES
-- ========================================
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, default_carrosserie, top_speed, drivetrain, co2_wltp, default_color, default_seats, is_active)
VALUES
  -- Ford
  ('Ford', 'Mustang GT', 'car', 331, 450, 22, 225, 5038, 'V8', 'Manuelle', 'Coupé', 250, 'RWD', 225, 'Rouge', '4', true),
  ('Ford', 'Focus RS', 'car', 257, 350, 17, 175, 2261, 'L4 Turbo', 'Manuelle', 'Berline', 250, 'AWD', 175, 'Bleu', '5', true),
  -- Renault
  ('Renault', 'Mégane RS', 'car', 205, 280, 14, 155, 1798, 'L4 Turbo', 'Manuelle', 'Berline', 250, 'FWD', 155, 'Rouge', '5', true),
  ('Renault', 'Clio RS', 'car', 147, 200, 10, 135, 1618, 'L4 Turbo', 'Manuelle', 'Berline', 230, 'FWD', 135, 'Rouge', '5', true),
  -- Peugeot
  ('Peugeot', '308 GTI', 'car', 200, 272, 13, 149, 1598, 'L4 Turbo', 'Manuelle', 'Berline', 250, 'FWD', 149, 'Rouge', '5', true),
  -- Alfa Romeo
  ('Alfa Romeo', 'Giulia Quadrifoglio', 'car', 375, 510, 24, 198, 2891, 'V6 Biturbo', 'Automatique', 'Berline', 307, 'RWD', 198, 'Rouge', '5', true),
  -- Jaguar
  ('Jaguar', 'F-Type R', 'car', 423, 575, 27, 292, 5000, 'V8 Supercharged', 'Automatique', 'Coupé', 300, 'RWD', 292, 'Rouge', '2', true),
  -- Maserati
  ('Maserati', 'Ghibli Trofeo', 'car', 427, 580, 28, 250, 3799, 'V8 Twin Turbo', 'Automatique', 'Berline', 326, 'AWD', 250, 'Bleu', '5', true)
ON CONFLICT (marque, modele, type) DO UPDATE SET
  kw = EXCLUDED.kw,
  ch = EXCLUDED.ch,
  cv_fiscaux = EXCLUDED.cv_fiscaux,
  co2 = EXCLUDED.co2,
  cylindree = EXCLUDED.cylindree,
  moteur = EXCLUDED.moteur,
  transmission = EXCLUDED.transmission,
  default_carrosserie = EXCLUDED.default_carrosserie,
  top_speed = EXCLUDED.top_speed,
  drivetrain = EXCLUDED.drivetrain,
  co2_wltp = EXCLUDED.co2_wltp,
  default_color = EXCLUDED.default_color,
  default_seats = EXCLUDED.default_seats,
  is_active = true,
  updated_at = NOW();

-- ========================================
-- VÉRIFICATION FINALE
-- ========================================
DO $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM model_specs_db WHERE is_active = true;
  RAISE NOTICE '✅ Enrichissement terminé !';
  RAISE NOTICE '📊 Total de véhicules actifs dans la base : %', total_count;
END $$;

-- ========================================
-- NOTES
-- ========================================
-- Ce script ajoute/enrichit la base de données avec :
-- ✅ Fiat Abarth (500, 695, 124 Spider)
-- ✅ Audi RS (RS3, RS4, RS5, RS6, RS7, R8)
-- ✅ Ferrari (488, F8, 812, SF90, Roma)
-- ✅ Volkswagen GTI/R (Golf GTI, Golf R, Scirocco R)
-- ✅ BMW M (M2, M3, M4, M5, M8)
-- ✅ Mercedes-AMG (A45, C63, E63, GT, GT R)
-- ✅ Porsche (911, Cayman, Boxster)
-- ✅ Lamborghini (Huracán, Aventador)
-- ✅ McLaren (570S, 720S, 765LT)
-- ✅ Autres sportives (Mustang, Focus RS, Mégane RS, etc.)

-- Les données incluent :
-- ✅ Puissance (kW et ch)
-- ✅ CV fiscaux (pour calcul taxes belges)
-- ✅ CO2 (NEDC et WLTP)
-- ✅ Cylindrée
-- ✅ Architecture moteur
-- ✅ Transmission
-- ✅ Type de carrosserie
-- ✅ Vitesse max
-- ✅ Type de transmission (RWD/FWD/AWD)
-- ✅ Couleur par défaut
-- ✅ Nombre de places

