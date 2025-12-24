-- ========================================
-- REDZONE - TABLE AUDIT_LOGS (RGPD)
-- ========================================
-- Système de logs d'audit pour la conformité RGPD
-- Enregistre tous les accès aux données personnelles
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase

-- Vérifier si la table existe avant de la créer
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    CREATE TABLE audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Qui a accédé aux données
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      user_email TEXT, -- Email de l'utilisateur (pour traçabilité même si user_id est supprimé)
      
      -- Type d'action
      action_type TEXT NOT NULL CHECK (action_type IN (
        'data_access',      -- Accès aux données personnelles
        'data_export',      -- Export des données (RGPD)
        'data_deletion',    -- Suppression de données (droit à l'oubli)
        'data_modification', -- Modification de données
        'login_attempt',    -- Tentative de connexion
        'failed_login',     -- Échec de connexion
        'password_reset',   -- Réinitialisation de mot de passe
        'profile_update',   -- Mise à jour du profil
        'unauthorized_access', -- Tentative d'accès non autorisé
        'data_export_request' -- Demande d'export de données
      )),
      
      -- Ressource concernée
      resource_type TEXT, -- Ex: 'profile', 'vehicule', 'message', 'favorite'
      resource_id UUID,   -- ID de la ressource concernée
      
      -- Détails
      description TEXT NOT NULL,
      ip_address INET,     -- Adresse IP de la requête
      user_agent TEXT,     -- User-Agent du navigateur
      
      -- Métadonnées supplémentaires (JSON)
      metadata JSONB DEFAULT '{}',
      
      -- Statut
      status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'blocked')),
      error_message TEXT
    );

    -- Index pour les requêtes fréquentes
    CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
    CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
    CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
    CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);
    
    -- Index composite pour les requêtes d'audit RGPD
    CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action_type, created_at DESC);
    
    RAISE NOTICE 'Table audit_logs créée avec succès';
  ELSE
    RAISE NOTICE 'Table audit_logs existe déjà';
  END IF;
END $$;

-- Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Politique : Les admins peuvent voir tous les logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Politique : Les utilisateurs peuvent voir leurs propres logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

-- Politique : Seuls les admins peuvent insérer des logs (via le serveur)
-- Note: En production, cette politique sera ajustée pour permettre l'insertion via les Server Actions
DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;
CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true); -- Permettre l'insertion (contrôlée par le code serveur)

-- Fonction pour nettoyer les anciens logs (conformité RGPD)
-- Les logs sont conservés 2 ans maximum (durée légale en Belgique)
-- IMPORTANT: Cette fonction doit retourner TABLE(deleted_count BIGINT) pour être compatible
-- avec cleanup_all_expired_data() dans cleanup_expired_data.sql
-- Si la fonction existe déjà avec un type de retour différent, on la supprime d'abord
DO $$
BEGIN
  -- Supprimer la fonction si elle existe avec un type de retour différent
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname = 'cleanup_old_audit_logs'
    AND pg_get_function_result(p.oid) != 'TABLE(deleted_count bigint)'
  ) THEN
    DROP FUNCTION IF EXISTS cleanup_old_audit_logs();
  END IF;
END $$;

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

-- Commentaires pour documentation
COMMENT ON TABLE audit_logs IS 'Logs d''audit pour la conformité RGPD - Conservation 2 ans maximum';
COMMENT ON COLUMN audit_logs.action_type IS 'Type d''action effectuée (data_access, data_export, data_deletion, etc.)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type de ressource concernée (profile, vehicule, message, etc.)';
COMMENT ON COLUMN audit_logs.ip_address IS 'Adresse IP de la requête pour traçabilité';
COMMENT ON COLUMN audit_logs.metadata IS 'Métadonnées supplémentaires au format JSON';

