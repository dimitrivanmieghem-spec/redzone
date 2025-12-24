-- ========================================
-- FONCTION RPC get_admin_stats
-- ========================================
-- 📅 Date: 2025-01-XX
-- 🎯 Objectif: Créer la fonction RPC pour récupérer les statistiques admin
-- 
-- ⚠️ IMPORTANT:
-- Cette fonction utilise la table "vehicles" (pas "vehicules")
-- Elle nécessite que l'utilisateur soit admin ou moderator
-- ========================================

-- Supprimer la fonction si elle existe déjà
DROP FUNCTION IF EXISTS get_admin_stats();

-- Créer la fonction RPC get_admin_stats
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE(
  total_vehicles BIGINT,
  pending_vehicles BIGINT,
  active_vehicles BIGINT,
  rejected_vehicles BIGINT,
  total_users BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin ou moderator
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Accès refusé - Administrateur ou Modérateur requis';
  END IF;

  -- Retourner les statistiques
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::BIGINT FROM vehicles) AS total_vehicles,
    (SELECT COUNT(*)::BIGINT FROM vehicles WHERE status = 'pending' OR status = 'pending_validation' OR status = 'waiting_email_verification') AS pending_vehicles,
    (SELECT COUNT(*)::BIGINT FROM vehicles WHERE status = 'active') AS active_vehicles,
    (SELECT COUNT(*)::BIGINT FROM vehicles WHERE status = 'rejected') AS rejected_vehicles,
    (SELECT COUNT(*)::BIGINT FROM profiles) AS total_users;
END;
$$;

-- Commentaire pour documentation
COMMENT ON FUNCTION get_admin_stats() IS 'Retourne les statistiques admin (véhicules et utilisateurs). Nécessite le rôle admin ou moderator.';

