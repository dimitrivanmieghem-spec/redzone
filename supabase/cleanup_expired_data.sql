-- ========================================
-- REDZONE - NETTOYAGE AUTOMATIQUE DES DONNÉES EXPIRÉES
-- ========================================
-- Script pour nettoyer automatiquement les données expirées selon les durées de conservation RGPD
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- RECOMMANDATION : Configurer un cron job pour exécuter ce script tous les mois

-- ========================================
-- 1. NETTOYER LES LOGS D'AUDIT DE PLUS DE 2 ANS
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  deleted_count_var BIGINT;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  GET DIAGNOSTICS deleted_count_var = ROW_COUNT;
  
  RAISE NOTICE 'Nettoyage des logs d''audit : % enregistrements supprimés', deleted_count_var;
  
  RETURN QUERY SELECT deleted_count_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 2. NETTOYER LES PROFILS INACTIFS (3 ANS)
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_inactive_profiles()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  deleted_count_var BIGINT;
  user_id_var UUID;
BEGIN
  -- Marquer les profils inactifs de plus de 3 ans pour suppression
  -- Note: La suppression en cascade supprimera automatiquement les données liées
  FOR user_id_var IN
    SELECT p.id
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE u.last_sign_in_at IS NOT NULL
    AND u.last_sign_in_at < NOW() - INTERVAL '3 years'
    AND p.id NOT IN (
      -- Ne pas supprimer les admins
      SELECT id FROM profiles WHERE role = 'admin'
    )
  LOOP
    -- Supprimer l'utilisateur (cascade supprimera le profil)
    DELETE FROM auth.users WHERE id = user_id_var;
  END LOOP;
  
  GET DIAGNOSTICS deleted_count_var = ROW_COUNT;
  
  RAISE NOTICE 'Nettoyage des profils inactifs : % profils supprimés', deleted_count_var;
  
  RETURN QUERY SELECT deleted_count_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 3. NETTOYER LES ANNONCES VENDUES/RETIRÉES (1 AN)
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_old_vehicules()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  deleted_count_var BIGINT;
BEGIN
  -- Archiver les annonces vendues/retirées de plus de 1 an
  UPDATE vehicules
  SET status = 'archived'
  WHERE status IN ('sold', 'withdrawn')
  AND updated_at < NOW() - INTERVAL '1 year'
  AND status != 'archived';
  
  GET DIAGNOSTICS deleted_count_var = ROW_COUNT;
  
  RAISE NOTICE 'Archivage des annonces anciennes : % annonces archivées', deleted_count_var;
  
  -- Supprimer les annonces archivées de plus de 30 jours
  DELETE FROM vehicules
  WHERE status = 'archived'
  AND updated_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count_var = ROW_COUNT;
  
  RAISE NOTICE 'Suppression des annonces archivées : % annonces supprimées', deleted_count_var;
  
  RETURN QUERY SELECT deleted_count_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. NETTOYER LES NOTIFICATIONS ANCIENNES
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  deleted_count_var BIGINT;
BEGIN
  -- Supprimer les notifications lues de plus de 90 jours
  DELETE FROM notifications
  WHERE is_read = true
  AND created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count_var = ROW_COUNT;
  
  RAISE NOTICE 'Nettoyage des notifications : % notifications supprimées', deleted_count_var;
  
  RETURN QUERY SELECT deleted_count_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 5. NETTOYER LES RECHERCHES SAUVEGARDÉES INACTIVES (1 AN)
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_inactive_saved_searches()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  deleted_count_var BIGINT;
BEGIN
  -- Supprimer les recherches inactives de plus de 1 an
  DELETE FROM saved_searches
  WHERE is_active = false
  AND updated_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count_var = ROW_COUNT;
  
  RAISE NOTICE 'Nettoyage des recherches sauvegardées : % recherches supprimées', deleted_count_var;
  
  RETURN QUERY SELECT deleted_count_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 6. NETTOYER LES LOGS D'APPLICATION
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_old_app_logs()
RETURNS TABLE(deleted_count BIGINT) AS $$
DECLARE
  deleted_count_var BIGINT;
BEGIN
  -- Supprimer les logs d'erreur de plus de 1 an
  DELETE FROM app_logs
  WHERE level = 'error'
  AND created_at < NOW() - INTERVAL '1 year';
  
  -- Supprimer les logs d'information de plus de 90 jours
  DELETE FROM app_logs
  WHERE level = 'info'
  AND created_at < NOW() - INTERVAL '90 days';
  
  -- Supprimer les logs d'avertissement de plus de 180 jours
  DELETE FROM app_logs
  WHERE level = 'warning'
  AND created_at < NOW() - INTERVAL '180 days';
  
  GET DIAGNOSTICS deleted_count_var = ROW_COUNT;
  
  RAISE NOTICE 'Nettoyage des logs d''application : % logs supprimés', deleted_count_var;
  
  RETURN QUERY SELECT deleted_count_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. FONCTION PRINCIPALE DE NETTOYAGE
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_all_expired_data()
RETURNS TABLE(
  audit_logs_deleted BIGINT,
  profiles_deleted BIGINT,
  vehicules_deleted BIGINT,
  notifications_deleted BIGINT,
  saved_searches_deleted BIGINT,
  app_logs_deleted BIGINT
) AS $$
DECLARE
  audit_count BIGINT;
  profiles_count BIGINT;
  vehicules_count BIGINT;
  notifications_count BIGINT;
  searches_count BIGINT;
  app_logs_count BIGINT;
BEGIN
  -- Exécuter tous les nettoyages
  SELECT deleted_count INTO audit_count FROM cleanup_old_audit_logs();
  SELECT deleted_count INTO profiles_count FROM cleanup_inactive_profiles();
  SELECT deleted_count INTO vehicules_count FROM cleanup_old_vehicules();
  SELECT deleted_count INTO notifications_count FROM cleanup_old_notifications();
  SELECT deleted_count INTO searches_count FROM cleanup_inactive_saved_searches();
  SELECT deleted_count INTO app_logs_count FROM cleanup_old_app_logs();
  
  -- Retourner le rapport
  RETURN QUERY SELECT
    COALESCE(audit_count, 0),
    COALESCE(profiles_count, 0),
    COALESCE(vehicules_count, 0),
    COALESCE(notifications_count, 0),
    COALESCE(searches_count, 0),
    COALESCE(app_logs_count, 0);
  
  RAISE NOTICE 'Nettoyage complet terminé';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 8. COMMENTAIRES POUR DOCUMENTATION
-- ========================================

COMMENT ON FUNCTION cleanup_old_audit_logs() IS 'Nettoie les logs d''audit de plus de 2 ans (durée légale en Belgique)';
COMMENT ON FUNCTION cleanup_inactive_profiles() IS 'Nettoie les profils inactifs de plus de 3 ans';
COMMENT ON FUNCTION cleanup_old_vehicules() IS 'Archive puis supprime les annonces vendues/retirées de plus de 1 an';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Nettoie les notifications lues de plus de 90 jours';
COMMENT ON FUNCTION cleanup_inactive_saved_searches() IS 'Nettoie les recherches sauvegardées inactives de plus de 1 an';
COMMENT ON FUNCTION cleanup_old_app_logs() IS 'Nettoie les logs d''application selon leur type et leur ancienneté';
COMMENT ON FUNCTION cleanup_all_expired_data() IS 'Fonction principale exécutant tous les nettoyages (à appeler via cron job)';

-- ========================================
-- 9. EXEMPLE D'UTILISATION
-- ========================================

-- Exécuter le nettoyage complet :
-- SELECT * FROM cleanup_all_expired_data();

-- Ou exécuter individuellement :
-- SELECT * FROM cleanup_old_audit_logs();
-- SELECT * FROM cleanup_inactive_profiles();
-- SELECT * FROM cleanup_old_vehicules();
-- SELECT * FROM cleanup_old_notifications();
-- SELECT * FROM cleanup_inactive_saved_searches();
-- SELECT * FROM cleanup_old_app_logs();

