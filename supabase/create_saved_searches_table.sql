-- ========================================
-- REDZONE - TABLE SAVED_SEARCHES (SENTINELLE)
-- ========================================
-- Script pour créer la table saved_searches pour les alertes Sentinelle
-- Ce script est idempotent : il peut être exécuté plusieurs fois sans erreur
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase

-- Vérifier si la table existe avant de la créer
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_searches') THEN
    CREATE TABLE saved_searches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Critères de recherche
      marque TEXT,
      modele TEXT,
      prix_min INTEGER,
      prix_max INTEGER,
      annee_min INTEGER,
      annee_max INTEGER,
      km_max INTEGER,
      type TEXT[],
      carburants TEXT[],
      transmissions TEXT[],
      carrosseries TEXT[],
      norme_euro TEXT,
      car_pass_only BOOLEAN DEFAULT FALSE,
      
      -- Filtres passionnés
      architectures TEXT[],
      admissions TEXT[],
      couleur_exterieure TEXT[],
      couleur_interieure TEXT[],
      nombre_places TEXT[],
      
      -- Métadonnées
      name TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      last_notified_at TIMESTAMP WITH TIME ZONE
    );

    RAISE NOTICE 'Table saved_searches créée avec succès';
  ELSE
    RAISE NOTICE 'Table saved_searches existe déjà';
  END IF;
END $$;

-- Index pour performances
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_searches') THEN
    CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
    CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(is_active) WHERE is_active = TRUE;
    CREATE INDEX IF NOT EXISTS idx_saved_searches_marque ON saved_searches(marque) WHERE marque IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_saved_searches_type ON saved_searches USING GIN(type);
    CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at DESC);
    
    RAISE NOTICE 'Index saved_searches créés avec succès';
  END IF;
END $$;

-- Trigger pour updated_at
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_searches') THEN
    -- Supprimer la fonction si elle existe déjà
    DROP FUNCTION IF EXISTS update_saved_searches_updated_at() CASCADE;
    
    -- Créer la fonction
    CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    -- Supprimer le trigger si il existe
    DROP TRIGGER IF EXISTS trigger_update_saved_searches_updated_at ON saved_searches;
    
    -- Créer le trigger
    CREATE TRIGGER trigger_update_saved_searches_updated_at
      BEFORE UPDATE ON saved_searches
      FOR EACH ROW
      EXECUTE FUNCTION update_saved_searches_updated_at();
    
    RAISE NOTICE 'Trigger updated_at créé avec succès';
  END IF;
END $$;

-- Row Level Security
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_searches') THEN
    ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
    
    -- Supprimer les anciennes policies si elles existent
    DROP POLICY IF EXISTS "Users can view own saved searches" ON saved_searches;
    DROP POLICY IF EXISTS "Users can create own saved searches" ON saved_searches;
    DROP POLICY IF EXISTS "Users can update own saved searches" ON saved_searches;
    DROP POLICY IF EXISTS "Users can delete own saved searches" ON saved_searches;

    -- Policy : Les utilisateurs peuvent voir leurs propres recherches
    CREATE POLICY "Users can view own saved searches"
      ON saved_searches FOR SELECT
      USING (auth.uid() = user_id);

    -- Policy : Les utilisateurs peuvent créer leurs propres recherches
    CREATE POLICY "Users can create own saved searches"
      ON saved_searches FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    -- Policy : Les utilisateurs peuvent mettre à jour leurs propres recherches
    CREATE POLICY "Users can update own saved searches"
      ON saved_searches FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);

    -- Policy : Les utilisateurs peuvent supprimer leurs propres recherches
    CREATE POLICY "Users can delete own saved searches"
      ON saved_searches FOR DELETE
      USING (auth.uid() = user_id);
    
    RAISE NOTICE 'Policies RLS saved_searches créées avec succès';
  END IF;
END $$;

-- Commentaires pour documentation
COMMENT ON TABLE saved_searches IS 'Recherches sauvegardées pour les alertes Sentinelle';
COMMENT ON COLUMN saved_searches.user_id IS 'ID de l''utilisateur propriétaire de la recherche';
COMMENT ON COLUMN saved_searches.name IS 'Nom personnalisé de la recherche';
COMMENT ON COLUMN saved_searches.is_active IS 'Si TRUE, la recherche est active et génère des alertes';
COMMENT ON COLUMN saved_searches.last_notified_at IS 'Date de la dernière notification envoyée';

-- Vérification finale
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_searches') THEN
    RAISE NOTICE '✅ Table saved_searches créée et configurée avec succès !';
  ELSE
    RAISE EXCEPTION '❌ Erreur : La table saved_searches n''a pas pu être créée';
  END IF;
END $$;

