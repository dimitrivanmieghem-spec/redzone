-- ========================================
-- REDZONE - TABLE FAVORITES
-- ========================================
-- Script pour créer la table favorites pour migrer du localStorage vers la DB
-- Ce script est idempotent : il peut être exécuté plusieurs fois sans erreur
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase

-- Vérifier si la table existe avant de la créer
DO $$ 
BEGIN
  -- Créer la table si elle n'existe pas
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    CREATE TABLE favorites (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
      vehicle_id UUID REFERENCES vehicles ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, vehicle_id)
    );

    RAISE NOTICE 'Table favorites créée avec succès';
  ELSE
    RAISE NOTICE 'Table favorites existe déjà';
  END IF;
END $$;

-- Index pour performances (créer seulement s'ils n'existent pas)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_vehicle_id ON favorites(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);
    
    -- Row Level Security
    ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Supprimer et créer les policies
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    -- Supprimer les anciennes policies si elles existent (pour éviter les doublons)
    DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
    DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
    DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
    DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;

    -- Policy : Les utilisateurs peuvent voir leurs propres favoris
    CREATE POLICY "Users can view own favorites"
      ON favorites FOR SELECT
      USING (auth.uid() = user_id);

    -- Policy : Les utilisateurs peuvent ajouter leurs propres favoris
    CREATE POLICY "Users can insert own favorites"
      ON favorites FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    -- Policy : Les utilisateurs peuvent supprimer leurs propres favoris
    CREATE POLICY "Users can delete own favorites"
      ON favorites FOR DELETE
      USING (auth.uid() = user_id);
    
    RAISE NOTICE '✅ Policies RLS créées avec succès';
  END IF;
END $$;

-- Commentaires pour documentation (exécutés en dehors du bloc DO)
COMMENT ON TABLE favorites IS 'Table pour gérer les favoris des utilisateurs (migration depuis localStorage)';
COMMENT ON COLUMN favorites.user_id IS 'ID de l''utilisateur propriétaire du favori';
COMMENT ON COLUMN favorites.vehicle_id IS 'ID du véhicule mis en favori';

-- Vérification finale
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    RAISE NOTICE '✅ Table favorites créée et configurée avec succès !';
  ELSE
    RAISE EXCEPTION '❌ Erreur : La table favorites n''a pas pu être créée';
  END IF;
END $$;
