-- ========================================
-- REDZONE - NETTOYAGE DES DONNÉES DE TEST
-- ========================================
-- Script pour nettoyer toutes les données de test avant la mise en production
-- ⚠️ ATTENTION : Ce script supprime définitivement les données
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- RECOMMANDATION : Faire une sauvegarde avant d'exécuter ce script

-- ========================================
-- 1. IDENTIFIER LES DONNÉES À SUPPRIMER
-- ========================================

-- Voir les annonces de test
-- Note : La table s'appelle 'vehicles' et la colonne 'owner_id' (pas 'user_id')
-- SELECT id, brand, model, status, created_at FROM vehicles ORDER BY created_at DESC;

-- Voir les utilisateurs de test
-- SELECT id, email, role, created_at FROM profiles ORDER BY created_at DESC;

-- ========================================
-- 2. SUPPRIMER LES ANNONCES DE TEST
-- ========================================

-- Option 1 : Supprimer toutes les annonces (sauf celles des admins/moderateurs)
-- IMPORTANT : La table s'appelle 'vehicles' et la colonne est 'owner_id' (pas 'user_id')
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les annonces qui ne sont pas créées par des admins ou modérateurs
  DELETE FROM vehicles
  WHERE owner_id NOT IN (
    SELECT id FROM profiles WHERE role IN ('admin', 'moderator')
  )
  OR owner_id IS NULL; -- Supprimer aussi les annonces sans propriétaire (invités)
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Annonces supprimées : %', deleted_count;
END $$;

-- Option 2 : Supprimer toutes les annonces (y compris celles des admins)
-- ATTENTION : Utilisez cette option seulement si vous voulez tout supprimer
-- DELETE FROM vehicles;

-- ========================================
-- 3. SUPPRIMER LES UTILISATEURS DE TEST
-- ========================================

-- Supprimer les utilisateurs de test (garder admin et modérateur)
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Supprimer les profils de test
  DELETE FROM profiles
  WHERE role NOT IN ('admin', 'moderator')
  AND (
    email LIKE '%test%' OR
    email LIKE '%example%' OR
    email LIKE '%demo%' OR
    email LIKE '%@test.%' OR
    full_name LIKE '%test%' OR
    full_name LIKE '%Test%'
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Profils de test supprimés : %', deleted_count;
END $$;

-- ========================================
-- 4. SUPPRIMER LES DONNÉES LIÉES
-- ========================================

-- Supprimer les favoris orphelins
DELETE FROM favorites
WHERE user_id NOT IN (SELECT id FROM profiles)
OR vehicle_id NOT IN (SELECT id FROM vehicles);

-- Supprimer les recherches sauvegardées orphelines
DELETE FROM saved_searches
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Supprimer les conversations orphelines
DELETE FROM conversations
WHERE buyer_id NOT IN (SELECT id FROM profiles)
OR seller_id NOT IN (SELECT id FROM profiles)
OR vehicle_id NOT IN (SELECT id FROM vehicles);

-- Supprimer les messages orphelins
DELETE FROM messages
WHERE conversation_id NOT IN (SELECT id FROM conversations)
OR sender_id NOT IN (SELECT id FROM profiles);

-- Supprimer les notifications orphelines
DELETE FROM notifications
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Supprimer les tickets orphelins
DELETE FROM tickets
WHERE user_id NOT IN (SELECT id FROM profiles);

-- Supprimer les articles orphelins
DELETE FROM articles
WHERE author_id NOT IN (SELECT id FROM profiles);

-- Supprimer les commentaires orphelins
DELETE FROM comments
WHERE user_id NOT IN (SELECT id FROM profiles)
OR article_id NOT IN (SELECT id FROM articles);

-- ========================================
-- 5. NETTOYER LES FICHIERS STOCKÉS (STORAGE)
-- ========================================

-- ATTENTION : Cette partie nécessite une action manuelle dans Supabase Dashboard
-- Allez dans Storage > files et supprimez les fichiers orphelins

-- Pour lister les fichiers orphelins (à exécuter manuellement) :
-- SELECT name, bucket_id, created_at 
-- FROM storage.objects 
-- WHERE bucket_id = 'files'
-- AND (storage.foldername(name))[1] NOT IN (SELECT id::text FROM profiles);

-- ========================================
-- 6. VÉRIFICATION FINALE
-- ========================================

-- Vérifier qu'il ne reste que les comptes admin et modérateur
SELECT 
  role,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as emails
FROM profiles
GROUP BY role
ORDER BY role;

-- Vérifier qu'il ne reste aucune annonce
SELECT COUNT(*) as total_vehicles FROM vehicles;

-- Vérifier les logs d'audit (optionnel - garder pour traçabilité)
-- SELECT COUNT(*) as total_audit_logs FROM audit_logs;

-- ========================================
-- 7. RÉINITIALISER LES SÉQUENCES (OPTIONNEL)
-- ========================================

-- Si vous voulez réinitialiser les IDs (non recommandé en production)
-- ALTER SEQUENCE IF EXISTS vehicles_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;

-- ========================================
-- 8. COMMENTAIRES
-- ========================================

-- Ce script nettoie :
-- ✅ Toutes les annonces (sauf celles des admins/moderateurs)
-- ✅ Tous les utilisateurs de test
-- ✅ Toutes les données liées (favoris, messages, etc.)
-- ✅ Les fichiers orphelins (à supprimer manuellement dans Storage)

-- Ce script GARDE :
-- ✅ Les comptes admin et modérateur
-- ✅ Les logs d'audit (pour traçabilité)
-- ✅ Les paramètres du site (site_settings)
-- ✅ La FAQ (faq_items)

-- ========================================
-- 9. APRÈS LE NETTOYAGE
-- ========================================

-- Vérifier que vous pouvez toujours vous connecter en admin
-- Vérifier que votre ami modérateur peut toujours se connecter
-- Vérifier que la base est vide (0 annonces)
-- Vérifier que seuls les comptes admin et modérateur existent

