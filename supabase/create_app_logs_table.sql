-- ========================================
-- REDZONE - TABLE APP_LOGS (MONITORING)
-- ========================================
-- Ce script crée la table pour le logging des actions critiques
-- Copiez-collez ce script dans le SQL Editor de Supabase

-- ========================================
-- 1. CRÉATION DE LA TABLE app_logs
-- ========================================
CREATE TABLE IF NOT EXISTS public.app_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('error', 'info', 'warning')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb -- Pour stocker des données supplémentaires (ex: vehicule_id, article_id)
);

-- ========================================
-- 2. INDEX POUR PERFORMANCES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON app_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON app_logs(user_id);

-- ========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;

-- Policy : Seuls les admins peuvent voir les logs
DROP POLICY IF EXISTS "Admins can view all logs" ON app_logs;
CREATE POLICY "Admins can view all logs"
  ON app_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy : Les utilisateurs peuvent créer leurs propres logs (pour erreurs)
DROP POLICY IF EXISTS "Users can create own logs" ON app_logs;
CREATE POLICY "Users can create own logs"
  ON app_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy : Les admins peuvent créer des logs pour tous
DROP POLICY IF EXISTS "Admins can create all logs" ON app_logs;
CREATE POLICY "Admins can create all logs"
  ON app_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- 4. VÉRIFICATION
-- ========================================
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'app_logs'
ORDER BY ordinal_position;

