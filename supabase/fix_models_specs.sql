-- ========================================
-- REDZONE - FIX MODELS & SPECS DATA
-- ========================================
-- Script SQL idempotent pour rétablir la chaîne complète Marque -> Modèle
-- 1. Vérifie/crée les permissions RLS sur model_specs_db
-- 2. Vérifie la structure de la table
-- 3. Insère des données de modèles pour les marques principales (Starter Pack Sportif)
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- ========================================

-- ========================================
-- 1. VÉRIFICATION STRUCTURE & PERMISSIONS
-- ========================================

-- Activer RLS si pas déjà activé
ALTER TABLE IF EXISTS model_specs_db ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent (pour éviter les conflits)
DROP POLICY IF EXISTS "Anyone can view active model specs" ON model_specs_db;
DROP POLICY IF EXISTS "Enable Read Access for All" ON model_specs_db;
DROP POLICY IF EXISTS "Public Read" ON model_specs_db;
DROP POLICY IF EXISTS "model_specs_db_public_read" ON model_specs_db;

-- Créer la politique de lecture publique (uniquement pour les modèles actifs)
CREATE POLICY "Enable Read Access for All" 
  ON public.model_specs_db 
  FOR SELECT 
  TO anon, authenticated 
  USING (is_active = true);

-- Accorder les permissions SELECT
GRANT SELECT ON public.model_specs_db TO anon;
GRANT SELECT ON public.model_specs_db TO authenticated;

-- Commentaire pour documentation
COMMENT ON POLICY "Enable Read Access for All" ON model_specs_db IS 'Permet la lecture publique de la table model_specs_db pour tous les utilisateurs (anon et authenticated) - Uniquement les modèles actifs';

-- ========================================
-- 2. VÉRIFICATION STRUCTURE (Colonnes)
-- ========================================

DO $$ 
BEGIN
  -- Vérifier que les colonnes essentielles existent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'model_specs_db' 
    AND column_name = 'marque'
  ) THEN
    RAISE EXCEPTION 'Colonne marque manquante dans model_specs_db';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'model_specs_db' 
    AND column_name = 'modele'
  ) THEN
    RAISE EXCEPTION 'Colonne modele manquante dans model_specs_db';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'model_specs_db' 
    AND column_name = 'type'
  ) THEN
    RAISE EXCEPTION 'Colonne type manquante dans model_specs_db';
  END IF;
  
  RAISE NOTICE '✅ Structure de model_specs_db vérifiée';
END $$;

-- ========================================
-- 3. INJECTION DE DONNÉES (Starter Pack Sportif)
-- ========================================
-- Insertion de modèles réels pour les marques principales
-- IMPORTANT : Les noms de marques doivent correspondre EXACTEMENT à ceux de la table brands
-- (Sensible à la casse : "Abarth", "Porsche", "Ferrari", etc.)

-- ABARTH (Voitures)
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Abarth', '595', 'car', 110, 150, 7, 155, 1368, '1.4 T-Jet', 'Manuelle', true),
  ('Abarth', '595 Competizione', 'car', 132, 180, 8, 165, 1368, '1.4 T-Jet', 'Manuelle', true),
  ('Abarth', '695', 'car', 132, 180, 8, 165, 1368, '1.4 T-Jet', 'Manuelle', true),
  ('Abarth', '124 Spider', 'car', 125, 170, 8, 148, 1368, '1.4 MultiAir Turbo', 'Manuelle', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- PORSCHE (Voitures)
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Porsche', '911 (991)', 'car', 272, 370, 18, 205, 3800, '3.8L Flat-6', 'Manuelle', true),
  ('Porsche', '911 (992)', 'car', 283, 385, 19, 210, 3800, '3.0L Flat-6 Turbo', 'Automatique', true),
  ('Porsche', '911 GT3', 'car', 375, 510, 22, 308, 4000, '4.0L Flat-6', 'Manuelle', true),
  ('Porsche', '718 Cayman', 'car', 220, 300, 15, 195, 2500, '2.0L Flat-4 Turbo', 'Manuelle', true),
  ('Porsche', '718 Boxster', 'car', 220, 300, 15, 195, 2500, '2.0L Flat-4 Turbo', 'Manuelle', true),
  ('Porsche', '718 Cayman S', 'car', 257, 350, 17, 215, 2500, '2.5L Flat-4 Turbo', 'Manuelle', true),
  ('Porsche', '718 Boxster S', 'car', 257, 350, 17, 215, 2500, '2.5L Flat-4 Turbo', 'Manuelle', true),
  ('Porsche', 'Cayman GT4', 'car', 309, 420, 20, 275, 4000, '4.0L Flat-6', 'Manuelle', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- FERRARI (Voitures)
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Ferrari', '488 GTB', 'car', 492, 670, 35, 260, 3902, '3.9L V8 Turbo', 'Automatique', true),
  ('Ferrari', 'F8 Tributo', 'car', 530, 720, 37, 290, 3902, '3.9L V8 Turbo', 'Automatique', true),
  ('Ferrari', 'Roma', 'car', 456, 620, 32, 255, 3855, '3.9L V8 Turbo', 'Automatique', true),
  ('Ferrari', 'Portofino', 'car', 441, 600, 30, 245, 3855, '3.9L V8 Turbo', 'Automatique', true),
  ('Ferrari', 'SF90 Stradale', 'car', 574, 780, 40, 0, 3990, '4.0L V8 Turbo Hybrid', 'Automatique', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- BMW (Voitures)
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('BMW', 'M2', 'car', 272, 370, 18, 205, 2979, '3.0L I6 Turbo', 'Manuelle', true),
  ('BMW', 'M2 Competition', 'car', 302, 410, 20, 225, 2979, '3.0L I6 Turbo', 'Manuelle', true),
  ('BMW', 'M3', 'car', 317, 431, 21, 230, 2998, '3.0L I6 Turbo', 'Manuelle', true),
  ('BMW', 'M4', 'car', 317, 431, 21, 230, 2998, '3.0L I6 Turbo', 'Manuelle', true),
  ('BMW', 'M4 Competition', 'car', 331, 450, 22, 240, 2998, '3.0L I6 Turbo', 'Automatique', true),
  ('BMW', 'M5', 'car', 441, 600, 30, 265, 4395, '4.4L V8 Turbo', 'Automatique', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- AUDI (Voitures)
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Audi', 'RS3', 'car', 294, 400, 20, 195, 2480, '2.5L I5 Turbo', 'Automatique', true),
  ('Audi', 'RS4', 'car', 331, 450, 22, 240, 2894, '2.9L V6 Turbo', 'Automatique', true),
  ('Audi', 'RS5', 'car', 331, 450, 22, 240, 2894, '2.9L V6 Turbo', 'Automatique', true),
  ('Audi', 'RS6', 'car', 441, 600, 30, 265, 3993, '4.0L V8 Turbo', 'Automatique', true),
  ('Audi', 'TT RS', 'car', 294, 400, 20, 195, 2480, '2.5L I5 Turbo', 'Automatique', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- MERCEDES-BENZ (Voitures)
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Mercedes-Benz', 'AMG A45', 'car', 280, 381, 19, 192, 1991, '2.0L I4 Turbo', 'Automatique', true),
  ('Mercedes-Benz', 'AMG C63', 'car', 350, 476, 24, 250, 3982, '4.0L V8 Turbo', 'Automatique', true),
  ('Mercedes-Benz', 'AMG E63', 'car', 420, 571, 29, 270, 3982, '4.0L V8 Turbo', 'Automatique', true),
  ('Mercedes-Benz', 'AMG GT', 'car', 350, 476, 24, 250, 3982, '4.0L V8 Turbo', 'Automatique', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- ALPINE (Voitures)
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Alpine', 'A110', 'car', 185, 252, 13, 138, 1798, '1.8L I4 Turbo', 'Manuelle', true),
  ('Alpine', 'A110 S', 'car', 215, 292, 15, 148, 1798, '1.8L I4 Turbo', 'Manuelle', true),
  ('Alpine', 'A110 GT', 'car', 185, 252, 13, 138, 1798, '1.8L I4 Turbo', 'Manuelle', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- LAMBORGHINI (Voitures)
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Lamborghini', 'Huracán', 'car', 449, 610, 31, 280, 5204, '5.2L V10', 'Automatique', true),
  ('Lamborghini', 'Huracán EVO', 'car', 470, 640, 33, 290, 5204, '5.2L V10', 'Automatique', true),
  ('Lamborghini', 'Aventador', 'car', 515, 700, 36, 370, 6498, '6.5L V12', 'Automatique', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- MCLAREN (Voitures)
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('McLaren', '570S', 'car', 419, 570, 29, 258, 3799, '3.8L V8 Turbo', 'Automatique', true),
  ('McLaren', '720S', 'car', 530, 720, 37, 249, 3994, '4.0L V8 Turbo', 'Automatique', true),
  ('McLaren', '765LT', 'car', 563, 765, 39, 270, 3994, '4.0L V8 Turbo', 'Automatique', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- RENAULT (Voitures - RS)
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Renault', 'Clio RS', 'car', 162, 220, 11, 155, 1618, '1.6L I4 Turbo', 'Manuelle', true),
  ('Renault', 'Megane RS', 'car', 205, 280, 14, 165, 1798, '1.8L I4 Turbo', 'Manuelle', true),
  ('Renault', 'Megane RS Trophy', 'car', 221, 300, 15, 170, 1798, '1.8L I4 Turbo', 'Manuelle', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- PEUGEOT (Voitures - GTI)
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Peugeot', '208 GTI', 'car', 147, 200, 10, 145, 1598, '1.6L I4 Turbo', 'Manuelle', true),
  ('Peugeot', '308 GTI', 'car', 200, 272, 14, 165, 1598, '1.6L I4 Turbo', 'Manuelle', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- VOLKSWAGEN (Voitures - GTI/R)
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Volkswagen', 'Golf GTI', 'car', 180, 245, 12, 165, 1984, '2.0L I4 Turbo', 'Manuelle', true),
  ('Volkswagen', 'Golf R', 'car', 235, 320, 16, 195, 1984, '2.0L I4 Turbo', 'Automatique', true),
  ('Volkswagen', 'Polo GTI', 'car', 147, 200, 10, 145, 1984, '2.0L I4 Turbo', 'Manuelle', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- FORD (Voitures - Mustang/RS)
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Ford', 'Mustang GT', 'car', 331, 450, 22, 240, 5038, '5.0L V8', 'Manuelle', true),
  ('Ford', 'Focus RS', 'car', 257, 350, 17, 175, 2261, '2.3L I4 Turbo', 'Manuelle', true),
  ('Ford', 'Fiesta ST', 'car', 147, 200, 10, 138, 1596, '1.6L I4 Turbo', 'Manuelle', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- MOTOS SPORTIVES
-- DUCATI
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Ducati', 'Panigale V2', 'moto', 114, 155, 8, 0, 955, '955cc V-Twin', 'Manuelle', true),
  ('Ducati', 'Panigale V4', 'moto', 157, 214, 11, 0, 1103, '1103cc V4', 'Manuelle', true),
  ('Ducati', 'Monster', 'moto', 86, 117, 6, 0, 937, '937cc V-Twin', 'Manuelle', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- YAMAHA
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Yamaha', 'YZF-R1', 'moto', 147, 200, 10, 0, 998, '998cc I4', 'Manuelle', true),
  ('Yamaha', 'MT-09', 'moto', 85, 115, 6, 0, 847, '847cc I3', 'Manuelle', true),
  ('Yamaha', 'R6', 'moto', 87, 118, 6, 0, 599, '599cc I4', 'Manuelle', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- KAWASAKI
INSERT INTO model_specs_db (marque, modele, type, kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, is_active) VALUES
  ('Kawasaki', 'Ninja ZX-10R', 'moto', 149, 203, 10, 0, 998, '998cc I4', 'Manuelle', true),
  ('Kawasaki', 'Ninja 650', 'moto', 50, 68, 3, 0, 649, '649cc Parallel-Twin', 'Manuelle', true)
ON CONFLICT (marque, modele, type) DO NOTHING;

-- ========================================
-- 4. VÉRIFICATION FINALE
-- ========================================

DO $$ 
DECLARE
  models_count INTEGER;
  brands_count INTEGER;
  policy_exists BOOLEAN;
BEGIN
  -- Compter les modèles insérés
  SELECT COUNT(*) INTO models_count FROM model_specs_db WHERE is_active = true;
  
  -- Compter les marques uniques
  SELECT COUNT(DISTINCT marque) INTO brands_count FROM model_specs_db WHERE is_active = true;
  
  -- Vérifier la politique
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'model_specs_db' 
    AND policyname = 'Enable Read Access for All'
  ) INTO policy_exists;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REDZONE - FIX MODELS & SPECS COMPLÉTÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Modèles actifs : %', models_count;
  RAISE NOTICE '✅ Marques uniques : %', brands_count;
  RAISE NOTICE '✅ Politique RLS : %', CASE WHEN policy_exists THEN 'CRÉÉE' ELSE 'MANQUANTE' END;
  RAISE NOTICE '✅ Permissions SELECT accordées à anon et authenticated';
  RAISE NOTICE '========================================';
END $$;

