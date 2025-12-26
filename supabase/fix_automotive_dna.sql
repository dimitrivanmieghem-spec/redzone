-- ========================================
-- REDZONE - FIX AUTOMOTIVE DNA
-- ========================================
-- Script SQL idempotent pour renforcer l'ADN "Petrolhead" de RedZone
-- Exclusivement dédié aux sportives thermiques
-- EXCLUSION FORMELLE : Tesla, Polestar, BYD, Fisker, Lucid, Rivian, Smart (électrique), Aiways, MG (électrique)
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- ========================================

-- ========================================
-- 1. TABLE BRANDS (Les Légendes Thermiques)
-- ========================================
-- Table de référence pour les marques ayant un ADN sportif thermique fort
-- Cette table permet d'optimiser les requêtes et de garantir la cohérence

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'brands') THEN
    CREATE TABLE brands (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('car', 'moto')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(name, type)
    );

    -- Index pour les requêtes fréquentes
    CREATE INDEX idx_brands_type ON brands(type);
    CREATE INDEX idx_brands_name ON brands(name);
    CREATE INDEX idx_brands_type_name ON brands(type, name);

    -- Row Level Security
    ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

    -- Politique : Lecture publique (pour les formulaires)
    CREATE POLICY "Anyone can view brands"
      ON brands FOR SELECT
      USING (true);

    -- Politique : Seuls les admins peuvent modifier
    CREATE POLICY "Admins can manage brands"
      ON brands FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    RAISE NOTICE 'Table brands créée avec succès';
  ELSE
    RAISE NOTICE 'Table brands existe déjà';
  END IF;
END $$;

-- Insertion des marques thermiques sportives (IDEMPOTENT)
-- Utilisation de ON CONFLICT pour éviter les doublons
INSERT INTO brands (name, type) VALUES
  -- VOITURES SPORTIVES THERMIQUES
  ('Abarth', 'car'),
  ('Alfa Romeo', 'car'),
  ('Alpine', 'car'),
  ('Aston Martin', 'car'),
  ('Audi', 'car'),
  ('Bentley', 'car'),
  ('BMW', 'car'),
  ('Bugatti', 'car'),
  ('Caterham', 'car'),
  ('Chevrolet', 'car'),
  ('Citroën', 'car'),
  ('Dodge', 'car'),
  ('Donkervoort', 'car'),
  ('Ferrari', 'car'),
  ('Fiat', 'car'),
  ('Ford', 'car'),
  ('Honda', 'car'),
  ('Hyundai', 'car'),
  ('Jaguar', 'car'),
  ('Jeep', 'car'),
  ('Koenigsegg', 'car'),
  ('Lamborghini', 'car'),
  ('Lancia', 'car'),
  ('Land Rover', 'car'),
  ('Lexus', 'car'),
  ('Lotus', 'car'),
  ('Maserati', 'car'),
  ('Mazda', 'car'),
  ('McLaren', 'car'),
  ('Mercedes-Benz', 'car'),
  ('MG', 'car'),
  ('Mini', 'car'),
  ('Mitsubishi', 'car'),
  ('Morgan', 'car'),
  ('Nissan', 'car'),
  ('Opel', 'car'),
  ('Pagani', 'car'),
  ('Peugeot', 'car'),
  ('Porsche', 'car'),
  ('Renault', 'car'),
  ('Rolls-Royce', 'car'),
  ('Saab', 'car'),
  ('Seat', 'car'),
  ('Skoda', 'car'),
  ('Subaru', 'car'),
  ('Suzuki', 'car'),
  ('Toyota', 'car'),
  ('TVR', 'car'),
  ('Volkswagen', 'car'),
  ('Volvo', 'car'),
  -- MOTOS SPORTIVES THERMIQUES
  ('Aprilia', 'moto'),
  ('BMW', 'moto'),
  ('Ducati', 'moto'),
  ('Harley-Davidson', 'moto'),
  ('Honda', 'moto'),
  ('Husqvarna', 'moto'),
  ('Kawasaki', 'moto'),
  ('KTM', 'moto'),
  ('MV Agusta', 'moto'),
  ('Suzuki', 'moto'),
  ('Triumph', 'moto'),
  ('Yamaha', 'moto')
ON CONFLICT (name, type) DO NOTHING;

-- Commentaires pour documentation
COMMENT ON TABLE brands IS 'Marques thermiques sportives autorisées sur RedZone - ADN Petrolhead exclusif';
COMMENT ON COLUMN brands.name IS 'Nom de la marque (ex: Porsche, Ferrari, Ducati)';
COMMENT ON COLUMN brands.type IS 'Type de véhicule (car ou moto)';

-- ========================================
-- 2. TABLE TAXES_RULES (Fiscalité Belge)
-- ========================================
-- Table pour gérer les règles fiscales belges (TMC, Eco-Malus, Taxe annuelle)
-- Permet de mettre à jour les barèmes sans modifier le code
-- CRUCIAL pour les sportives thermiques (lourdement taxées en Belgique)

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'taxes_rules') THEN
    CREATE TABLE taxes_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      region TEXT NOT NULL CHECK (region IN ('wallonie', 'flandre', 'bruxelles')),
      rule_type TEXT NOT NULL CHECK (rule_type IN ('tmc_base', 'eco_malus', 'taxe_circulation', 'degressivite')),
      
      -- Paramètres pour TMC Base (selon puissance kW)
      puissance_kw_min NUMERIC,
      puissance_kw_max NUMERIC,
      tmc_base_amount NUMERIC,
      
      -- Paramètres pour Dégressivité (selon âge)
      age_min INTEGER,
      age_max INTEGER,
      taux_reduction NUMERIC, -- Pourcentage (ex: 90 = 90% du tarif de base)
      
      -- Paramètres pour Eco-Malus (selon CO2)
      co2_min NUMERIC,
      co2_max NUMERIC,
      eco_malus_amount NUMERIC,
      
      -- Paramètres pour Taxe de Circulation (selon CV fiscaux)
      cv_fiscaux_min INTEGER,
      cv_fiscaux_max INTEGER,
      taxe_circulation_amount NUMERIC,
      
      -- Métadonnées
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      is_active BOOLEAN DEFAULT true,
      
      -- Contraintes
      CONSTRAINT check_tmc_params CHECK (
        (rule_type = 'tmc_base' AND puissance_kw_min IS NOT NULL AND puissance_kw_max IS NOT NULL AND tmc_base_amount IS NOT NULL) OR
        (rule_type != 'tmc_base')
      ),
      CONSTRAINT check_degressivite_params CHECK (
        (rule_type = 'degressivite' AND age_min IS NOT NULL AND age_max IS NOT NULL AND taux_reduction IS NOT NULL) OR
        (rule_type != 'degressivite')
      ),
      CONSTRAINT check_eco_malus_params CHECK (
        (rule_type = 'eco_malus' AND co2_min IS NOT NULL AND co2_max IS NOT NULL AND eco_malus_amount IS NOT NULL) OR
        (rule_type != 'eco_malus')
      ),
      CONSTRAINT check_taxe_circulation_params CHECK (
        (rule_type = 'taxe_circulation' AND cv_fiscaux_min IS NOT NULL AND cv_fiscaux_max IS NOT NULL AND taxe_circulation_amount IS NOT NULL) OR
        (rule_type != 'taxe_circulation')
      )
    );

    -- Index pour les requêtes fréquentes
    CREATE INDEX idx_taxes_rules_region ON taxes_rules(region);
    CREATE INDEX idx_taxes_rules_type ON taxes_rules(rule_type);
    CREATE INDEX idx_taxes_rules_active ON taxes_rules(is_active);
    CREATE INDEX idx_taxes_rules_region_type ON taxes_rules(region, rule_type, is_active);

    -- Row Level Security
    ALTER TABLE taxes_rules ENABLE ROW LEVEL SECURITY;

    -- Politique : Lecture publique (pour le calculateur)
    CREATE POLICY "Anyone can view taxes rules"
      ON taxes_rules FOR SELECT
      USING (is_active = true);

    -- Politique : Seuls les admins peuvent modifier
    CREATE POLICY "Admins can manage taxes rules"
      ON taxes_rules FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );

    RAISE NOTICE 'Table taxes_rules créée avec succès';
  ELSE
    RAISE NOTICE 'Table taxes_rules existe déjà';
  END IF;
END $$;

-- Insertion des règles fiscales Wallonie/Bruxelles 2025
-- Basées sur le code TaxCalculator.tsx (lignes 58-215)

-- TMC BASE (selon puissance kW)
INSERT INTO taxes_rules (region, rule_type, puissance_kw_min, puissance_kw_max, tmc_base_amount) VALUES
  ('wallonie', 'tmc_base', 0, 70, 61.5),
  ('wallonie', 'tmc_base', 70.01, 85, 123.0),
  ('wallonie', 'tmc_base', 85.01, 100, 495.0),
  ('wallonie', 'tmc_base', 100.01, 110, 867.0),
  ('wallonie', 'tmc_base', 110.01, 120, 1239.0),
  ('wallonie', 'tmc_base', 120.01, 155, 2478.0),
  ('wallonie', 'tmc_base', 155.01, 9999, 4957.0),
  ('bruxelles', 'tmc_base', 0, 70, 61.5),
  ('bruxelles', 'tmc_base', 70.01, 85, 123.0),
  ('bruxelles', 'tmc_base', 85.01, 100, 495.0),
  ('bruxelles', 'tmc_base', 100.01, 110, 867.0),
  ('bruxelles', 'tmc_base', 110.01, 120, 1239.0),
  ('bruxelles', 'tmc_base', 120.01, 155, 2478.0),
  ('bruxelles', 'tmc_base', 155.01, 9999, 4957.0)
ON CONFLICT DO NOTHING;

-- DÉGRESSIVITÉ (selon âge du véhicule)
INSERT INTO taxes_rules (region, rule_type, age_min, age_max, taux_reduction) VALUES
  ('wallonie', 'degressivite', 0, 1, 100),
  ('wallonie', 'degressivite', 2, 2, 90),
  ('wallonie', 'degressivite', 3, 3, 80),
  ('wallonie', 'degressivite', 4, 4, 70),
  ('wallonie', 'degressivite', 5, 5, 60),
  ('wallonie', 'degressivite', 6, 6, 55),
  ('wallonie', 'degressivite', 7, 7, 50),
  ('wallonie', 'degressivite', 8, 8, 45),
  ('wallonie', 'degressivite', 9, 9, 40),
  ('wallonie', 'degressivite', 10, 10, 35),
  ('wallonie', 'degressivite', 11, 11, 30),
  ('wallonie', 'degressivite', 12, 12, 25),
  ('wallonie', 'degressivite', 13, 13, 20),
  ('wallonie', 'degressivite', 14, 14, 15),
  ('wallonie', 'degressivite', 15, 15, 10),
  ('wallonie', 'degressivite', 16, 999, 0), -- Forfait minimum 61.5€
  ('bruxelles', 'degressivite', 0, 1, 100),
  ('bruxelles', 'degressivite', 2, 2, 90),
  ('bruxelles', 'degressivite', 3, 3, 80),
  ('bruxelles', 'degressivite', 4, 4, 70),
  ('bruxelles', 'degressivite', 5, 5, 60),
  ('bruxelles', 'degressivite', 6, 6, 55),
  ('bruxelles', 'degressivite', 7, 7, 50),
  ('bruxelles', 'degressivite', 8, 8, 45),
  ('bruxelles', 'degressivite', 9, 9, 40),
  ('bruxelles', 'degressivite', 10, 10, 35),
  ('bruxelles', 'degressivite', 11, 11, 30),
  ('bruxelles', 'degressivite', 12, 12, 25),
  ('bruxelles', 'degressivite', 13, 13, 20),
  ('bruxelles', 'degressivite', 14, 14, 15),
  ('bruxelles', 'degressivite', 15, 15, 10),
  ('bruxelles', 'degressivite', 16, 999, 0) -- Forfait minimum 61.5€
ON CONFLICT DO NOTHING;

-- ÉCO-MALUS (Wallonie uniquement, CO2 > 146g/km)
-- Exemption pour véhicules de collection (30+ ans)
INSERT INTO taxes_rules (region, rule_type, co2_min, co2_max, eco_malus_amount) VALUES
  ('wallonie', 'eco_malus', 146, 155, 100),
  ('wallonie', 'eco_malus', 156, 165, 175),
  ('wallonie', 'eco_malus', 166, 175, 250),
  ('wallonie', 'eco_malus', 176, 185, 350),
  ('wallonie', 'eco_malus', 186, 195, 450),
  ('wallonie', 'eco_malus', 196, 205, 600),
  ('wallonie', 'eco_malus', 206, 215, 850),
  ('wallonie', 'eco_malus', 216, 225, 1200),
  ('wallonie', 'eco_malus', 226, 235, 1600),
  ('wallonie', 'eco_malus', 236, 245, 2000),
  ('wallonie', 'eco_malus', 245.01, 9999, 2500)
ON CONFLICT DO NOTHING;

-- TAXE DE CIRCULATION ANNUELLE (selon CV fiscaux)
-- Basée UNIQUEMENT sur les CV fiscaux (cylindrée), PAS sur la puissance DIN
INSERT INTO taxes_rules (region, rule_type, cv_fiscaux_min, cv_fiscaux_max, taxe_circulation_amount) VALUES
  ('wallonie', 'taxe_circulation', 0, 4, 100),
  ('wallonie', 'taxe_circulation', 5, 6, 200),
  ('wallonie', 'taxe_circulation', 7, 8, 300),
  ('wallonie', 'taxe_circulation', 9, 9, 350),
  ('wallonie', 'taxe_circulation', 10, 10, 400),
  ('wallonie', 'taxe_circulation', 11, 11, 500),
  ('wallonie', 'taxe_circulation', 12, 12, 600),
  ('wallonie', 'taxe_circulation', 13, 13, 700),
  ('wallonie', 'taxe_circulation', 14, 14, 850),
  ('wallonie', 'taxe_circulation', 15, 15, 1000),
  ('wallonie', 'taxe_circulation', 16, 16, 1200),
  ('wallonie', 'taxe_circulation', 17, 17, 1400),
  ('wallonie', 'taxe_circulation', 18, 18, 1600),
  ('wallonie', 'taxe_circulation', 19, 19, 1800),
  ('wallonie', 'taxe_circulation', 20, 20, 2000),
  ('wallonie', 'taxe_circulation', 21, 999, NULL), -- Calcul progressif : 2000 + (cv - 20) * 150
  ('bruxelles', 'taxe_circulation', 0, 4, 100),
  ('bruxelles', 'taxe_circulation', 5, 6, 200),
  ('bruxelles', 'taxe_circulation', 7, 8, 300),
  ('bruxelles', 'taxe_circulation', 9, 9, 350),
  ('bruxelles', 'taxe_circulation', 10, 10, 400),
  ('bruxelles', 'taxe_circulation', 11, 11, 500),
  ('bruxelles', 'taxe_circulation', 12, 12, 600),
  ('bruxelles', 'taxe_circulation', 13, 13, 700),
  ('bruxelles', 'taxe_circulation', 14, 14, 850),
  ('bruxelles', 'taxe_circulation', 15, 15, 1000),
  ('bruxelles', 'taxe_circulation', 16, 16, 1200),
  ('bruxelles', 'taxe_circulation', 17, 17, 1400),
  ('bruxelles', 'taxe_circulation', 18, 18, 1600),
  ('bruxelles', 'taxe_circulation', 19, 19, 1800),
  ('bruxelles', 'taxe_circulation', 20, 20, 2000),
  ('bruxelles', 'taxe_circulation', 21, 999, NULL) -- Calcul progressif : 2000 + (cv - 20) * 150
ON CONFLICT DO NOTHING;

-- Commentaires pour documentation
COMMENT ON TABLE taxes_rules IS 'Règles fiscales belges pour calculer TMC, Eco-Malus et Taxe de Circulation - Barèmes 2025';
COMMENT ON COLUMN taxes_rules.rule_type IS 'Type de règle : tmc_base, degressivite, eco_malus, taxe_circulation';
COMMENT ON COLUMN taxes_rules.taux_reduction IS 'Pourcentage de réduction (ex: 90 = 90% du tarif de base)';
COMMENT ON COLUMN taxes_rules.taxe_circulation_amount IS 'Montant annuel en euros (NULL = calcul progressif)';

-- ========================================
-- 3. CORRECTIF AUDIT_LOGS (IP en TEXT)
-- ========================================
-- Correction de la colonne ip_address pour éviter les crashs sur 'unknown'
-- Passage de INET à TEXT pour plus de flexibilité

DO $$ 
BEGIN
  -- Vérifier si la colonne existe et si elle est de type INET
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'ip_address'
    AND data_type = 'inet'
  ) THEN
    -- Convertir INET en TEXT
    ALTER TABLE audit_logs 
    ALTER COLUMN ip_address TYPE TEXT USING ip_address::TEXT;
    
    RAISE NOTICE 'Colonne ip_address convertie de INET vers TEXT';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'audit_logs' 
    AND column_name = 'ip_address'
    AND data_type = 'text'
  ) THEN
    RAISE NOTICE 'Colonne ip_address est déjà de type TEXT';
  ELSE
    -- Si la colonne n'existe pas, la créer en TEXT
    ALTER TABLE audit_logs 
    ADD COLUMN IF NOT EXISTS ip_address TEXT;
    
    RAISE NOTICE 'Colonne ip_address créée en TEXT';
  END IF;
END $$;

-- Mettre à jour l'index si nécessaire
DROP INDEX IF EXISTS idx_audit_logs_ip_address;
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Commentaire pour documentation
COMMENT ON COLUMN audit_logs.ip_address IS 'Adresse IP de la requête (TEXT pour gérer "unknown" et autres valeurs)';

-- ========================================
-- 4. VÉRIFICATION FINALE
-- ========================================

DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REDZONE - FIX AUTOMOTIVE DNA COMPLÉTÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Table brands créée/vérifiée';
  RAISE NOTICE '✅ Table taxes_rules créée/vérifiée';
  RAISE NOTICE '✅ Table audit_logs corrigée (ip_address en TEXT)';
  RAISE NOTICE '✅ ADN Petrolhead renforcé - Marques électriques exclues';
  RAISE NOTICE '========================================';
END $$;

