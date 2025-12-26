-- ========================================
-- OCTANE98 - TABLE WAITING LIST
-- ========================================
-- Script SQL pour créer la table de capture d'emails
-- Copiez-collez ce script dans le SQL Editor de Supabase

-- ========================================
-- TABLE WAITING_LIST
-- ========================================

CREATE TABLE IF NOT EXISTS waiting_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'website' -- 'website', 'social', 'referral', etc.
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_waiting_list_email ON waiting_list(email);
CREATE INDEX IF NOT EXISTS idx_waiting_list_created_at ON waiting_list(created_at DESC);

-- Contrainte d'unicité sur l'email (éviter les doublons)
CREATE UNIQUE INDEX IF NOT EXISTS idx_waiting_list_email_unique ON waiting_list(email);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Politique : N'importe qui peut INSÉRER (s'inscrire à la liste)
CREATE POLICY "Anyone can subscribe to waiting list"
  ON waiting_list
  FOR INSERT
  WITH CHECK (true);

-- Politique : Seuls les admins peuvent VOIR les emails (lecture)
CREATE POLICY "Only admins can view waiting list"
  ON waiting_list
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Note : UPDATE et DELETE sont désactivés par défaut (pas de politique = blocage total)
-- Pour permettre la suppression/modification admin, ajouter :
-- CREATE POLICY "Admins can update waiting list"
--   ON waiting_list
--   FOR UPDATE
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--       AND profiles.role = 'admin'
--     )
--   );

