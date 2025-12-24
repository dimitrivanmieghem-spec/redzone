-- ========================================
-- OPTIMISATION REQUÊTES SQL ET INDEX
-- ========================================
-- Ce script ajoute des index pour améliorer les performances
-- des requêtes fréquentes sur les tables principales
-- 
-- ✅ Version sécurisée et robuste :
-- - Vérifie l'existence des tables avant de créer des index
-- - Vérifie l'existence des colonnes avant de créer des index
-- - Gère les erreurs gracieusement
-- - Idempotent : peut être exécuté plusieurs fois sans erreur
-- ========================================

-- Créer l'extension pg_trgm pour les recherches textuelles (en dehors des blocs)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ========================================
-- FONCTION HELPER : Vérifier si une colonne existe
-- ========================================
CREATE OR REPLACE FUNCTION column_exists(table_schema_name TEXT, table_name_name TEXT, column_name_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = table_schema_name 
    AND table_name = table_name_name 
    AND column_name = column_name_name
  );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- INDEX SUR LA TABLE VEHICLES
-- ========================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
    
    -- Index pour les recherches par statut (utilisé partout)
    IF column_exists('public', 'vehicles', 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicles_status_active 
      ON vehicles(status) 
      WHERE status = 'active';
    END IF;

    -- Index composite pour les recherches avec filtres multiples
    IF column_exists('public', 'vehicles', 'status') AND 
       column_exists('public', 'vehicles', 'brand') AND 
       column_exists('public', 'vehicles', 'year') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicles_status_brand_year 
      ON vehicles(status, brand, year DESC) 
      WHERE status = 'active';
    END IF;

    -- Index pour le tri par date de création (homepage, recherche)
    IF column_exists('public', 'vehicles', 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicles_created_at_desc 
      ON vehicles(created_at DESC) 
      WHERE status = 'active';
    END IF;

    -- Index pour les filtres de prix (recherche, tri)
    IF column_exists('public', 'vehicles', 'price') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicles_price 
      ON vehicles(price) 
      WHERE status = 'active';
    END IF;

    -- Index pour les filtres de kilométrage
    IF column_exists('public', 'vehicles', 'mileage') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicles_mileage 
      ON vehicles(mileage) 
      WHERE status = 'active';
    END IF;

    -- Index pour les filtres de type de véhicule
    IF column_exists('public', 'vehicles', 'type') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicles_type 
      ON vehicles(type) 
      WHERE status = 'active';
    END IF;

    -- Index pour les filtres de carburant
    IF column_exists('public', 'vehicles', 'fuel_type') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type 
      ON vehicles(fuel_type) 
      WHERE status = 'active';
    END IF;

    -- Index pour les filtres de transmission
    IF column_exists('public', 'vehicles', 'transmission') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicles_transmission 
      ON vehicles(transmission) 
      WHERE status = 'active';
    END IF;

    -- Index pour les recherches par propriétaire (dashboard utilisateur)
    IF column_exists('public', 'vehicles', 'owner_id') AND 
       column_exists('public', 'vehicles', 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id_status 
      ON vehicles(owner_id, status);
    END IF;

    -- Index pour les recherches par statut (modération)
    IF column_exists('public', 'vehicles', 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicles_status_pending 
      ON vehicles(status) 
      WHERE status IN ('pending', 'pending_validation', 'waiting_email_verification');
    END IF;

    -- Index pour les recherches géographiques (ville)
    IF column_exists('public', 'vehicles', 'city') AND 
       column_exists('public', 'vehicles', 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicles_city 
      ON vehicles(city) 
      WHERE city IS NOT NULL AND status = 'active';
    END IF;

    -- Index pour les recherches géographiques (code postal)
    IF column_exists('public', 'vehicles', 'postal_code') AND 
       column_exists('public', 'vehicles', 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicles_postal_code 
      ON vehicles(postal_code) 
      WHERE postal_code IS NOT NULL AND status = 'active';
    END IF;

    -- Index pour les recherches textuelles (marque) - GIN index pour ILIKE
    IF column_exists('public', 'vehicles', 'brand') THEN
      BEGIN
        CREATE INDEX IF NOT EXISTS idx_vehicles_brand_trgm 
        ON vehicles USING gin(brand gin_trgm_ops) 
        WHERE status = 'active';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible de créer l''index GIN pour brand (pg_trgm peut-être non disponible)';
      END;
    END IF;

    -- Index pour les recherches textuelles (modèle) - GIN index pour ILIKE
    IF column_exists('public', 'vehicles', 'model') THEN
      BEGIN
        CREATE INDEX IF NOT EXISTS idx_vehicles_model_trgm 
        ON vehicles USING gin(model gin_trgm_ops) 
        WHERE status = 'active';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible de créer l''index GIN pour model (pg_trgm peut-être non disponible)';
      END;
    END IF;

    RAISE NOTICE '✅ Index créés pour la table vehicles';
  ELSE
    RAISE NOTICE '⚠️ Table vehicles n''existe pas, index ignorés';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erreur lors de la création des index pour vehicles: %', SQLERRM;
END $$;

-- ========================================
-- INDEX SUR LA TABLE PROFILES
-- ========================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    
    IF column_exists('public', 'profiles', 'role') THEN
      CREATE INDEX IF NOT EXISTS idx_profiles_role 
      ON profiles(role) 
      WHERE role IN ('admin', 'moderator');
    END IF;

    IF column_exists('public', 'profiles', 'is_banned') THEN
      CREATE INDEX IF NOT EXISTS idx_profiles_is_banned 
      ON profiles(is_banned) 
      WHERE is_banned = true;
    END IF;

    RAISE NOTICE '✅ Index créés pour la table profiles';
  ELSE
    RAISE NOTICE '⚠️ Table profiles n''existe pas, index ignorés';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erreur lors de la création des index pour profiles: %', SQLERRM;
END $$;

-- ========================================
-- INDEX SUR LA TABLE TICKETS
-- ========================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
    
    IF column_exists('public', 'tickets', 'user_id') AND 
       column_exists('public', 'tickets', 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_tickets_user_id_status 
      ON tickets(user_id, status);
    END IF;

    IF column_exists('public', 'tickets', 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_tickets_status 
      ON tickets(status) 
      WHERE status IN ('open', 'in_progress');
    END IF;

    IF column_exists('public', 'tickets', 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_tickets_created_at_desc 
      ON tickets(created_at DESC);
    END IF;

    RAISE NOTICE '✅ Index créés pour la table tickets';
  ELSE
    RAISE NOTICE '⚠️ Table tickets n''existe pas, index ignorés';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erreur lors de la création des index pour tickets: %', SQLERRM;
END $$;

-- ========================================
-- INDEX SUR LA TABLE SAVED_SEARCHES (Sentinelle)
-- ========================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_searches') THEN
    
    IF column_exists('public', 'saved_searches', 'user_id') AND 
       column_exists('public', 'saved_searches', 'is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id_active 
      ON saved_searches(user_id, is_active) 
      WHERE is_active = true;
    END IF;

    RAISE NOTICE '✅ Index créés pour la table saved_searches';
  ELSE
    RAISE NOTICE '⚠️ Table saved_searches n''existe pas, index ignorés';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erreur lors de la création des index pour saved_searches: %', SQLERRM;
END $$;

-- ========================================
-- INDEX SUR LA TABLE FAVORITES
-- ========================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    
    IF column_exists('public', 'favorites', 'user_id') AND 
       column_exists('public', 'favorites', 'vehicle_id') THEN
      CREATE INDEX IF NOT EXISTS idx_favorites_user_vehicle 
      ON favorites(user_id, vehicle_id);
    END IF;

    IF column_exists('public', 'favorites', 'vehicle_id') THEN
      CREATE INDEX IF NOT EXISTS idx_favorites_vehicle_id 
      ON favorites(vehicle_id);
    END IF;

    RAISE NOTICE '✅ Index créés pour la table favorites';
  ELSE
    RAISE NOTICE '⚠️ Table favorites n''existe pas, index ignorés';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erreur lors de la création des index pour favorites: %', SQLERRM;
END $$;

-- ========================================
-- INDEX SUR LA TABLE NOTIFICATIONS
-- ========================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    
    IF column_exists('public', 'notifications', 'user_id') AND 
       column_exists('public', 'notifications', 'is_read') THEN
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read 
      ON notifications(user_id, is_read) 
      WHERE is_read = false;
    END IF;

    IF column_exists('public', 'notifications', 'user_id') AND 
       column_exists('public', 'notifications', 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
      ON notifications(user_id, created_at DESC);
    END IF;

    RAISE NOTICE '✅ Index créés pour la table notifications';
  ELSE
    RAISE NOTICE '⚠️ Table notifications n''existe pas, index ignorés';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erreur lors de la création des index pour notifications: %', SQLERRM;
END $$;

-- ========================================
-- INDEX SUR LA TABLE COMMENTS
-- ========================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
    
    IF column_exists('public', 'comments', 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_comments_status 
      ON comments(status) 
      WHERE status = 'pending';
    END IF;

    IF column_exists('public', 'comments', 'article_id') THEN
      CREATE INDEX IF NOT EXISTS idx_comments_article_id 
      ON comments(article_id);
    END IF;

    RAISE NOTICE '✅ Index créés pour la table comments';
  ELSE
    RAISE NOTICE '⚠️ Table comments n''existe pas, index ignorés';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erreur lors de la création des index pour comments: %', SQLERRM;
END $$;

-- ========================================
-- INDEX SUR LA TABLE ARTICLES
-- ========================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'articles') THEN
    
    IF column_exists('public', 'articles', 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_articles_status 
      ON articles(status) 
      WHERE status = 'published';
    END IF;

    IF column_exists('public', 'articles', 'author_id') AND 
       column_exists('public', 'articles', 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_articles_author_id_status 
      ON articles(author_id, status);
    END IF;

    RAISE NOTICE '✅ Index créés pour la table articles';
  ELSE
    RAISE NOTICE '⚠️ Table articles n''existe pas, index ignorés';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erreur lors de la création des index pour articles: %', SQLERRM;
END $$;

-- ========================================
-- ANALYSE DES TABLES (pour toutes les tables existantes)
-- ========================================
-- Mettre à jour les statistiques pour l'optimiseur de requêtes
DO $$ 
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('vehicles', 'profiles', 'tickets', 'saved_searches', 'favorites', 'notifications', 'comments', 'articles')
  LOOP
    BEGIN
      EXECUTE format('ANALYZE %I', table_name);
      RAISE NOTICE '✅ ANALYZE exécuté pour la table %', table_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Erreur lors de l''ANALYZE de la table %: %', table_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- ========================================
-- NETTOYAGE : Supprimer la fonction helper
-- ========================================
DROP FUNCTION IF EXISTS column_exists(TEXT, TEXT, TEXT);

-- ========================================
-- NOTES
-- ========================================
-- Les index partiels (avec WHERE) sont plus légers et plus rapides
-- car ils ne contiennent que les lignes pertinentes
-- 
-- Les index GIN avec pg_trgm permettent des recherches textuelles rapides
-- même avec ILIKE et pattern matching
--
-- Les index composites sont utiles pour les requêtes avec plusieurs filtres
-- 
-- ANALYZE met à jour les statistiques pour que l'optimiseur choisisse
-- les meilleurs index pour chaque requête
--
-- Ce script vérifie l'existence de chaque table ET de chaque colonne
-- avant de créer des index. Il est donc sûr à exécuter même si certaines
-- tables ou colonnes n'existent pas encore.
--
-- Toutes les erreurs sont capturées et affichées comme des notices,
-- sans interrompre l'exécution du script
-- ========================================
