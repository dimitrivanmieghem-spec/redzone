-- ========================================
-- REDZONE - TABLE TICKETS (Migration)
-- ========================================
-- Script pour créer/mettre à jour la table tickets avec toutes les colonnes nécessaires
-- Ce script est idempotent : il peut être exécuté plusieurs fois sans erreur

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  email_contact TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  assigned_to TEXT DEFAULT 'admin',
  admin_reply TEXT,
  admin_notes TEXT
);

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$ 
BEGIN
  -- Colonne category (CRITIQUE - doit exister avant les contraintes)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'category') THEN
    ALTER TABLE tickets ADD COLUMN category TEXT;
    -- Mettre une valeur par défaut pour les tickets existants
    UPDATE tickets SET category = 'Commercial' WHERE category IS NULL;
    -- Rendre NOT NULL après avoir rempli les valeurs
    ALTER TABLE tickets ALTER COLUMN category SET NOT NULL;
  END IF;

  -- Colonne subject
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'subject') THEN
    ALTER TABLE tickets ADD COLUMN subject TEXT;
    UPDATE tickets SET subject = 'question' WHERE subject IS NULL;
    ALTER TABLE tickets ALTER COLUMN subject SET NOT NULL;
  END IF;

  -- Colonne message
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'message') THEN
    ALTER TABLE tickets ADD COLUMN message TEXT;
    UPDATE tickets SET message = '' WHERE message IS NULL;
    ALTER TABLE tickets ALTER COLUMN message SET NOT NULL;
  END IF;

  -- Colonne status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'status') THEN
    ALTER TABLE tickets ADD COLUMN status TEXT DEFAULT 'open';
  END IF;

  -- Colonne assigned_to (si elle n'existe pas, l'ajouter)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'assigned_to') THEN
    ALTER TABLE tickets ADD COLUMN assigned_to TEXT DEFAULT 'admin';
  END IF;

  -- Colonne updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'updated_at') THEN
    ALTER TABLE tickets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Colonne admin_reply
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'admin_reply') THEN
    ALTER TABLE tickets ADD COLUMN admin_reply TEXT;
  END IF;

  -- Colonne admin_notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'admin_notes') THEN
    ALTER TABLE tickets ADD COLUMN admin_notes TEXT;
  END IF;

  -- Colonne user_reply (pour permettre à l'utilisateur de répondre à l'admin)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'user_reply') THEN
    ALTER TABLE tickets ADD COLUMN user_reply TEXT;
  END IF;

  -- Colonne resolved_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'resolved_at') THEN
    ALTER TABLE tickets ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Colonne resolved_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'resolved_by') THEN
    ALTER TABLE tickets ADD COLUMN resolved_by UUID REFERENCES auth.users ON DELETE SET NULL;
  END IF;

  -- Colonne closed_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'closed_at') THEN
    ALTER TABLE tickets ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Colonne closed_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'closed_by') THEN
    ALTER TABLE tickets ADD COLUMN closed_by UUID REFERENCES auth.users ON DELETE SET NULL;
  END IF;
END $$;

-- Mettre à jour les contraintes CHECK pour status (seulement si la colonne existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'status') THEN
    -- Supprimer l'ancienne contrainte si elle existe
    ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
    -- Ajouter la nouvelle contrainte avec in_progress
    ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));
  END IF;
END $$;

-- Mettre à jour les contraintes CHECK pour category (seulement si la colonne existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'category') THEN
    ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_category_check;
    ALTER TABLE tickets ADD CONSTRAINT tickets_category_check CHECK (category IN ('Technique', 'Contenu', 'Commercial'));
  END IF;
END $$;

-- Mettre à jour les contraintes CHECK pour assigned_to (seulement si la colonne existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'assigned_to') THEN
    ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_assigned_to_check;
    ALTER TABLE tickets ADD CONSTRAINT tickets_assigned_to_check CHECK (assigned_to IN ('admin', 'moderator'));
  END IF;
END $$;

-- Mettre à jour les contraintes CHECK pour subject (seulement si la colonne existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'subject') THEN
    ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_subject_check;
    ALTER TABLE tickets ADD CONSTRAINT tickets_subject_check CHECK (subject IN ('bug', 'question', 'signalement', 'autre'));
  END IF;
END $$;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_email_contact ON tickets(email_contact);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tickets_updated_at ON tickets;
CREATE TRIGGER trigger_update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_tickets_updated_at();

-- Row Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Moderators can view assigned tickets" ON tickets;
DROP POLICY IF EXISTS "Anyone can create tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON tickets;
DROP POLICY IF EXISTS "Moderators can update assigned tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can delete all tickets" ON tickets;

-- Policy : Les utilisateurs peuvent voir leurs propres tickets
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Policy : Les admins peuvent voir tous les tickets
CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy : Les modérateurs peuvent voir les tickets qui leur sont assignés
CREATE POLICY "Moderators can view assigned tickets"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'moderator'
      AND tickets.assigned_to = 'moderator'
    )
  );

-- Policy : N'importe qui peut créer un ticket (même non connecté)
CREATE POLICY "Anyone can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (true);

-- Policy : Les admins peuvent modifier tous les tickets
CREATE POLICY "Admins can update all tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy : Les modérateurs peuvent modifier les tickets qui leur sont assignés
CREATE POLICY "Moderators can update assigned tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'moderator'
      AND tickets.assigned_to = 'moderator'
    )
  );

-- Policy : Les admins peuvent supprimer tous les tickets
CREATE POLICY "Admins can delete all tickets"
  ON tickets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Commentaires pour documentation
COMMENT ON TABLE tickets IS 'Table pour gérer les tickets de support utilisateur';
COMMENT ON COLUMN tickets.assigned_to IS 'Rôle auquel le ticket est assigné (admin ou moderator)';
COMMENT ON COLUMN tickets.status IS 'Statut du ticket: open, in_progress, resolved, closed';
COMMENT ON COLUMN tickets.category IS 'Catégorie du ticket: Technique, Contenu, Commercial';
