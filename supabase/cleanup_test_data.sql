-- ========================================
-- REDZONE - NETTOYAGE DES DONNÉES DE TEST
-- ========================================
-- Script pour supprimer toutes les entrées de test sauf celles de dimitri.vanmieghem@gmail.com
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- ⚠️ ATTENTION : Cette opération est IRRÉVERSIBLE !

-- ========================================
-- 1. VÉRIFICATIONS PRÉLIMINAIRES
-- ========================================

DO $$
DECLARE
  profiles_to_keep_count INTEGER;
  profiles_to_delete_count INTEGER;
  vehicles_to_delete_count INTEGER;
  favorites_to_delete_count INTEGER;
  conversations_to_delete_count INTEGER;
  messages_to_delete_count INTEGER;
BEGIN
  -- Compter les profils à conserver
  SELECT COUNT(*) INTO profiles_to_keep_count
  FROM profiles
  WHERE email LIKE '%dimitri.vanmieghem@gmail.com%';
  
  -- Compter les profils à supprimer
  SELECT COUNT(*) INTO profiles_to_delete_count
  FROM profiles
  WHERE email NOT LIKE '%dimitri.vanmieghem@gmail.com%';
  
  -- Compter les véhicules à supprimer (ceux qui n'appartiennent pas aux profils à conserver)
  -- Gère les deux noms de table possibles
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicules'
  ) THEN
    SELECT COUNT(*) INTO vehicles_to_delete_count
    FROM vehicules v
    WHERE v.user_id NOT IN (
      SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
    );
  ELSIF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles'
  ) THEN
    SELECT COUNT(*) INTO vehicles_to_delete_count
    FROM vehicles v
    WHERE v.user_id NOT IN (
      SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
    );
  ELSE
    vehicles_to_delete_count := 0;
  END IF;
  
  -- Compter les favoris à supprimer (ceux des utilisateurs à supprimer ou ceux liés aux véhicules à supprimer)
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'favorites'
  ) THEN
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicules'
    ) THEN
      SELECT COUNT(*) INTO favorites_to_delete_count
      FROM favorites f
      WHERE f.user_id NOT IN (
        SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
      )
      OR f.vehicle_id IN (
        SELECT id FROM vehicules v
        WHERE v.user_id NOT IN (
          SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
        )
      );
    ELSIF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicles'
    ) THEN
      SELECT COUNT(*) INTO favorites_to_delete_count
      FROM favorites f
      WHERE f.user_id NOT IN (
        SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
      )
      OR f.vehicle_id IN (
        SELECT id FROM vehicles v
        WHERE v.user_id NOT IN (
          SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
        )
      );
    ELSE
      SELECT COUNT(*) INTO favorites_to_delete_count
      FROM favorites f
      WHERE f.user_id NOT IN (
        SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
      );
    END IF;
  ELSE
    favorites_to_delete_count := 0;
  END IF;
  
  -- Compter les conversations à supprimer
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations'
  ) THEN
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicules'
    ) THEN
      SELECT COUNT(*) INTO conversations_to_delete_count
      FROM conversations c
      WHERE c.buyer_id NOT IN (
        SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
      )
      OR c.seller_id NOT IN (
        SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
      )
      OR c.vehicle_id IN (
        SELECT id FROM vehicules v
        WHERE v.user_id NOT IN (
          SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
        )
      );
    ELSIF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'vehicles'
    ) THEN
      SELECT COUNT(*) INTO conversations_to_delete_count
      FROM conversations c
      WHERE c.buyer_id NOT IN (
        SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
      )
      OR c.seller_id NOT IN (
        SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
      )
      OR c.vehicle_id IN (
        SELECT id FROM vehicles v
        WHERE v.user_id NOT IN (
          SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
        )
      );
    ELSE
      SELECT COUNT(*) INTO conversations_to_delete_count
      FROM conversations c
      WHERE c.buyer_id NOT IN (
        SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
      )
      OR c.seller_id NOT IN (
        SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
      );
    END IF;
  ELSE
    conversations_to_delete_count := 0;
  END IF;
  
  -- Compter les messages à supprimer (via les conversations)
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'messages'
  ) THEN
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'conversations'
    ) THEN
      IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'vehicules'
      ) THEN
        SELECT COUNT(*) INTO messages_to_delete_count
        FROM messages m
        WHERE m.conversation_id IN (
          SELECT id FROM conversations c
          WHERE c.buyer_id NOT IN (
            SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
          )
          OR c.seller_id NOT IN (
            SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
          )
          OR c.vehicle_id IN (
            SELECT id FROM vehicules v
            WHERE v.user_id NOT IN (
              SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
            )
          )
        );
      ELSIF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'vehicles'
      ) THEN
        SELECT COUNT(*) INTO messages_to_delete_count
        FROM messages m
        WHERE m.conversation_id IN (
          SELECT id FROM conversations c
          WHERE c.buyer_id NOT IN (
            SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
          )
          OR c.seller_id NOT IN (
            SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
          )
          OR c.vehicle_id IN (
            SELECT id FROM vehicles v
            WHERE v.user_id NOT IN (
              SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
            )
          )
        );
      ELSE
        SELECT COUNT(*) INTO messages_to_delete_count
        FROM messages m
        WHERE m.conversation_id IN (
          SELECT id FROM conversations c
          WHERE c.buyer_id NOT IN (
            SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
          )
          OR c.seller_id NOT IN (
            SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
          )
        );
      END IF;
    ELSE
      messages_to_delete_count := 0;
    END IF;
  ELSE
    messages_to_delete_count := 0;
  END IF;
  
  -- Afficher le résumé
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSUMÉ DU NETTOYAGE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Profils à CONSERVER : %', profiles_to_keep_count;
  RAISE NOTICE 'Profils à SUPPRIMER : %', profiles_to_delete_count;
  RAISE NOTICE 'Véhicules à SUPPRIMER : %', vehicles_to_delete_count;
  RAISE NOTICE 'Favoris à SUPPRIMER : %', favorites_to_delete_count;
  RAISE NOTICE 'Conversations à SUPPRIMER : %', conversations_to_delete_count;
  RAISE NOTICE 'Messages à SUPPRIMER : %', messages_to_delete_count;
  RAISE NOTICE '========================================';
  
  -- Vérifier qu'il y a au moins un profil à conserver
  IF profiles_to_keep_count = 0 THEN
    RAISE EXCEPTION 'ERREUR : Aucun profil trouvé avec email contenant "dimitri.vanmieghem@gmail.com". Opération annulée pour sécurité.';
  END IF;
END $$;

-- ========================================
-- 2. SUPPRESSION DES VÉHICULES
-- ========================================
-- Supprimer tous les véhicules qui n'appartiennent pas aux profils à conserver
-- Les favoris et conversations liés seront supprimés automatiquement grâce à ON DELETE CASCADE
-- Gère les deux noms de table possibles : vehicules ou vehicles

DO $$
DECLARE
  deleted_count INTEGER;
  table_name TEXT;
BEGIN
  -- Déterminer quelle table existe
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicules'
  ) THEN
    table_name := 'vehicules';
  ELSIF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles'
  ) THEN
    table_name := 'vehicles';
  ELSE
    RAISE NOTICE '⚠️ Aucune table de véhicules trouvée (vehicules ou vehicles)';
    RETURN;
  END IF;
  
  -- Supprimer les véhicules des utilisateurs à supprimer
  EXECUTE format('DELETE FROM %I WHERE user_id NOT IN (SELECT id FROM profiles WHERE email LIKE %L)', 
    table_name, '%dimitri.vanmieghem@gmail.com%');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ % véhicules supprimés de la table %', deleted_count, table_name;
END $$;

-- ========================================
-- 3. SUPPRESSION DES FAVORIS (SI NÉCESSAIRE)
-- ========================================
-- Normalement, les favoris sont supprimés automatiquement via CASCADE,
-- mais on les supprime explicitement pour être sûr

DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les favoris des utilisateurs à supprimer
  DELETE FROM favorites
  WHERE user_id NOT IN (
    SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ % favoris supprimés', deleted_count;
END $$;

-- ========================================
-- 4. SUPPRESSION DES MESSAGES ET CONVERSATIONS
-- ========================================
-- Les messages sont supprimés automatiquement via CASCADE quand on supprime les conversations

DO $$
DECLARE
  deleted_conversations_count INTEGER;
  deleted_messages_count INTEGER;
BEGIN
  -- Vérifier si la table conversations existe
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations'
  ) THEN
    -- Supprimer les conversations des utilisateurs à supprimer
    DELETE FROM conversations
    WHERE buyer_id NOT IN (
      SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
    )
    OR seller_id NOT IN (
      SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
    );
    
    GET DIAGNOSTICS deleted_conversations_count = ROW_COUNT;
    RAISE NOTICE '✅ % conversations supprimées (messages supprimés automatiquement via CASCADE)', deleted_conversations_count;
  ELSE
    RAISE NOTICE '⚠️ Table conversations n''existe pas, ignorée';
  END IF;
END $$;

-- ========================================
-- 5. SUPPRESSION DES PROFILS
-- ========================================
-- Supprimer tous les profils sauf ceux à conserver
-- Les véhicules restants seront supprimés automatiquement via CASCADE
-- Les entrées dans auth.users seront également supprimées via CASCADE

DO $$
DECLARE
  deleted_count INTEGER;
  kept_profiles TEXT[];
BEGIN
  -- Récupérer la liste des emails conservés pour affichage
  SELECT ARRAY_AGG(email) INTO kept_profiles
  FROM profiles
  WHERE email LIKE '%dimitri.vanmieghem@gmail.com%';
  
  -- Supprimer les profils des utilisateurs à supprimer
  DELETE FROM profiles
  WHERE email NOT LIKE '%dimitri.vanmieghem@gmail.com%';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE '✅ % profils supprimés', deleted_count;
  RAISE NOTICE '✅ Profils conservés : %', array_to_string(kept_profiles, ', ');
END $$;

-- ========================================
-- 6. VÉRIFICATION FINALE
-- ========================================

DO $$
DECLARE
  remaining_profiles_count INTEGER;
  remaining_vehicles_count INTEGER;
  remaining_favorites_count INTEGER;
  remaining_conversations_count INTEGER;
  remaining_messages_count INTEGER;
BEGIN
  -- Compter ce qui reste
  SELECT COUNT(*) INTO remaining_profiles_count FROM profiles;
  
  -- Compter les véhicules restants (gère les deux noms de table)
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicules'
  ) THEN
    SELECT COUNT(*) INTO remaining_vehicles_count FROM vehicules;
  ELSIF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'vehicles'
  ) THEN
    SELECT COUNT(*) INTO remaining_vehicles_count FROM vehicles;
  ELSE
    remaining_vehicles_count := 0;
  END IF;
  
  -- Compter les favoris restants
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'favorites'
  ) THEN
    SELECT COUNT(*) INTO remaining_favorites_count FROM favorites;
  ELSE
    remaining_favorites_count := 0;
  END IF;
  
  -- Compter les conversations restantes
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'conversations'
  ) THEN
    SELECT COUNT(*) INTO remaining_conversations_count FROM conversations;
  ELSE
    remaining_conversations_count := 0;
  END IF;
  
  -- Compter les messages restants
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'messages'
  ) THEN
    SELECT COUNT(*) INTO remaining_messages_count FROM messages;
  ELSE
    remaining_messages_count := 0;
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VÉRIFICATION FINALE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Profils restants : %', remaining_profiles_count;
  RAISE NOTICE 'Véhicules restants : %', remaining_vehicles_count;
  RAISE NOTICE 'Favoris restants : %', remaining_favorites_count;
  RAISE NOTICE 'Conversations restantes : %', remaining_conversations_count;
  RAISE NOTICE 'Messages restants : %', remaining_messages_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ NETTOYAGE TERMINÉ AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  
  -- Vérifier que tous les profils restants sont bien ceux à conserver
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE email NOT LIKE '%dimitri.vanmieghem@gmail.com%'
  ) THEN
    RAISE WARNING 'ATTENTION : Il reste des profils qui ne devraient pas être conservés !';
  END IF;
END $$;

-- ========================================
-- 7. NETTOYAGE SUPPLÉMENTAIRE (TABLES OPTIONNELLES)
-- ========================================
-- Nettoyer d'autres tables qui pourraient référencer les données supprimées

-- Supprimer les recherches sauvegardées (saved_searches) si la table existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'saved_searches'
  ) THEN
    DELETE FROM saved_searches
    WHERE user_id NOT IN (
      SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
    );
    RAISE NOTICE '✅ Recherches sauvegardées nettoyées';
  END IF;
END $$;

-- Supprimer les notifications si la table existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
  ) THEN
    DELETE FROM notifications
    WHERE user_id NOT IN (
      SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
    );
    RAISE NOTICE '✅ Notifications nettoyées';
  END IF;
END $$;

-- Supprimer les tickets de support si la table existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tickets'
  ) THEN
    DELETE FROM tickets
    WHERE user_id NOT IN (
      SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
    );
    RAISE NOTICE '✅ Tickets nettoyés';
  END IF;
END $$;

-- Supprimer les articles si la table existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'articles'
  ) THEN
    DELETE FROM articles
    WHERE author_id NOT IN (
      SELECT id FROM profiles WHERE email LIKE '%dimitri.vanmieghem@gmail.com%'
    );
    RAISE NOTICE '✅ Articles nettoyés';
  END IF;
END $$;

-- ========================================
-- FIN DU SCRIPT
-- ========================================
-- Toutes les données de test ont été supprimées sauf celles de dimitri.vanmieghem@gmail.com
-- Les contraintes CASCADE ont automatiquement nettoyé les relations
