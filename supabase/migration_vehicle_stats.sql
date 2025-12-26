-- ========================================
-- TABLE vehicle_stats - Tracking des Visites
-- ========================================
-- Script SQL pour créer la table de statistiques des véhicules
-- Permet de tracker les vues réelles sur chaque annonce

-- Créer la table vehicle_stats
CREATE TABLE IF NOT EXISTS vehicle_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  view_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Une seule entrée par véhicule (contrainte unique)
  UNIQUE(vehicle_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_vehicle_stats_vehicle_id ON vehicle_stats(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_stats_view_count ON vehicle_stats(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_stats_updated_at ON vehicle_stats(updated_at DESC);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_vehicle_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_vehicle_stats_timestamp
  BEFORE UPDATE ON vehicle_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_stats_updated_at();

-- Fonction helper pour incrémenter le compteur de vues
-- À utiliser dans le code frontend/backend lors d'une visite
CREATE OR REPLACE FUNCTION increment_vehicle_view(vehicle_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO vehicle_stats (vehicle_id, view_count)
  VALUES (vehicle_uuid, 1)
  ON CONFLICT (vehicle_id) 
  DO UPDATE SET 
    view_count = vehicle_stats.view_count + 1,
    updated_at = NOW()
  RETURNING view_count INTO new_count;
  
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (RLS)
ALTER TABLE vehicle_stats ENABLE ROW LEVEL SECURITY;

-- Policy : Tout le monde peut lire les stats (publiques)
CREATE POLICY "Anyone can view vehicle stats"
  ON vehicle_stats FOR SELECT
  USING (true);

-- Policy : Seuls les propriétaires peuvent insérer/mettre à jour leurs stats
-- (via la fonction increment_vehicle_view qui est SECURITY DEFINER)
-- Note : En production, vous pouvez restreindre l'insertion aux propriétaires seulement

-- Policy alternative si vous voulez restreindre l'insertion :
-- CREATE POLICY "Vehicle owners can manage their stats"
--   ON vehicle_stats FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM vehicles
--       WHERE vehicles.id = vehicle_stats.vehicle_id
--       AND vehicles.owner_id = auth.uid()
--     )
--   );

-- Initialiser les stats pour les véhicules existants (optionnel)
-- Décommentez si vous voulez créer des entrées pour les véhicules déjà existants
-- INSERT INTO vehicle_stats (vehicle_id, view_count)
-- SELECT id, 0
-- FROM vehicles
-- WHERE status = 'active'
-- ON CONFLICT (vehicle_id) DO NOTHING;

-- ========================================
-- COMMENTAIRES
-- ========================================
-- 
-- Utilisation dans le code :
-- 
-- 1. Pour incrémenter une vue :
--    SELECT increment_vehicle_view('uuid-du-vehicule');
--
-- 2. Pour récupérer le nombre de vues :
--    SELECT view_count FROM vehicle_stats WHERE vehicle_id = 'uuid-du-vehicule';
--
-- 3. Pour récupérer les stats de tous les véhicules d'un propriétaire :
--    SELECT v.id, v.brand, v.model, COALESCE(vs.view_count, 0) as views
--    FROM vehicles v
--    LEFT JOIN vehicle_stats vs ON vs.vehicle_id = v.id
--    WHERE v.owner_id = 'uuid-du-proprietaire';
--
-- 4. Pour récupérer le top des véhicules les plus vus :
--    SELECT v.*, vs.view_count
--    FROM vehicles v
--    JOIN vehicle_stats vs ON vs.vehicle_id = v.id
--    WHERE v.status = 'active'
--    ORDER BY vs.view_count DESC
--    LIMIT 10;
--
-- ========================================

