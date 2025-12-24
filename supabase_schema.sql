-- ========================================
-- REDZONE - SCHÉMA DE BASE DE DONNÉES
-- ========================================
-- Script d'initialisation complet pour Supabase
-- Ce fichier crée la structure de base pour la table vehicles
-- 
-- ⚠️ IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- ========================================

-- ========================================
-- 1. NETTOYAGE PRÉALABLE
-- ========================================
-- Supprimer la table vehicles si elle existe déjà (pour repartir à neuf)
DROP TABLE IF EXISTS public.vehicles CASCADE;

-- Supprimer les types ENUM s'ils existent déjà
DROP TYPE IF EXISTS public.engine_type_enum CASCADE;
DROP TYPE IF EXISTS public.seller_type_enum CASCADE;

-- ========================================
-- 2. CRÉATION DES ENUMs (Choix stricts)
-- ========================================

-- Type de moteur : exclusivement thermique/hybride
CREATE TYPE public.engine_type_enum AS ENUM (
  'Essence',
  'Diesel',
  'Hybride',
  'Ethanol',
  'GPL'
);

-- Type de vendeur
CREATE TYPE public.seller_type_enum AS ENUM (
  'Particulier',
  'Professionnel'
);

-- ========================================
-- 3. CRÉATION DE LA TABLE vehicles
-- ========================================

CREATE TABLE public.vehicles (
  -- Identifiant unique
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Lien avec l'utilisateur connecté
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Timestamp de création
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Informations de base du véhicule
  brand TEXT NOT NULL,              -- Marque (ex: BMW, Audi, Mercedes)
  model TEXT NOT NULL,              -- Modèle (ex: M3, RS4, AMG GT)
  year INTEGER NOT NULL,            -- Année de fabrication
  price INTEGER NOT NULL,           -- Prix en euros
  mileage INTEGER NOT NULL,         -- Kilométrage
  
  -- Type de moteur et de vendeur (ENUMs)
  engine_type engine_type_enum NOT NULL,
  seller_type seller_type_enum NOT NULL,
  
  -- Description et médias
  description TEXT,                 -- Description détaillée du véhicule
  images TEXT[],                    -- Tableau d'URLs d'images
  
  -- Statut de vente
  is_sold BOOLEAN DEFAULT FALSE NOT NULL
);

-- ========================================
-- 4. INDEX POUR PERFORMANCES
-- ========================================

-- Index sur owner_id pour les requêtes utilisateur
CREATE INDEX idx_vehicles_owner_id ON public.vehicles(owner_id);

-- Index sur is_sold pour filtrer les véhicules disponibles
CREATE INDEX idx_vehicles_is_sold ON public.vehicles(is_sold) WHERE is_sold = FALSE;

-- Index sur created_at pour le tri chronologique
CREATE INDEX idx_vehicles_created_at ON public.vehicles(created_at DESC);

-- Index sur brand et model pour les recherches
CREATE INDEX idx_vehicles_brand_model ON public.vehicles(brand, model);

-- Index sur price pour les filtres de prix
CREATE INDEX idx_vehicles_price ON public.vehicles(price);

-- Index composite pour les recherches fréquentes
CREATE INDEX idx_vehicles_search ON public.vehicles(is_sold, brand, price) WHERE is_sold = FALSE;

-- ========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Activer RLS sur la table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Politique de LECTURE : Tout le monde peut voir les annonces
-- (anonymes et authentifiés)
CREATE POLICY "Anyone can view vehicles"
  ON public.vehicles
  FOR SELECT
  USING (true);

-- Politique d'INSERTION : Seuls les utilisateurs connectés peuvent poster
-- et doivent être propriétaires de leur annonce
CREATE POLICY "Authenticated users can insert own vehicles"
  ON public.vehicles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Politique de MODIFICATION : Seul le propriétaire peut modifier
CREATE POLICY "Users can update own vehicles"
  ON public.vehicles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Politique de SUPPRESSION : Seul le propriétaire peut supprimer
CREATE POLICY "Users can delete own vehicles"
  ON public.vehicles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ========================================
-- 6. STOCKAGE (STORAGE) - Bucket pour images
-- ========================================

-- Créer le bucket 'car-images' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('car-images', 'car-images', true)
ON CONFLICT (id) DO NOTHING;

-- Politique de LECTURE : Tout le monde peut voir les images
CREATE POLICY "Anyone can view car images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'car-images');

-- Politique d'INSERTION : Seuls les utilisateurs connectés peuvent uploader
CREATE POLICY "Authenticated users can upload car images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'car-images');

-- Politique de MODIFICATION : Seuls les utilisateurs connectés peuvent modifier
CREATE POLICY "Authenticated users can update car images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'car-images')
  WITH CHECK (bucket_id = 'car-images');

-- Politique de SUPPRESSION : Seuls les utilisateurs connectés peuvent supprimer
CREATE POLICY "Authenticated users can delete car images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'car-images');

-- ========================================
-- 7. COMMENTAIRES POUR DOCUMENTATION
-- ========================================

COMMENT ON TABLE public.vehicles IS 'Table principale des annonces de véhicules RedZone';
COMMENT ON COLUMN public.vehicles.owner_id IS 'Référence vers l''utilisateur propriétaire de l''annonce';
COMMENT ON COLUMN public.vehicles.engine_type IS 'Type de moteur : Essence, Diesel, Hybride, Ethanol, ou GPL';
COMMENT ON COLUMN public.vehicles.seller_type IS 'Type de vendeur : Particulier ou Professionnel';
COMMENT ON COLUMN public.vehicles.images IS 'Tableau d''URLs pointant vers les images dans le bucket car-images';
COMMENT ON COLUMN public.vehicles.is_sold IS 'Indique si le véhicule a été vendu (true) ou est encore disponible (false)';

-- ========================================
-- FIN DU SCRIPT
-- ========================================

