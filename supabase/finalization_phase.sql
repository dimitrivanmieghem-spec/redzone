-- ========================================
-- REDZONE - PHASE DE FINALISATION
-- Script SQL pour les 4 piliers essentiels
-- ========================================

-- ========================================
-- 1. TABLE TICKETS (Support & Bugs)
-- ========================================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Utilisateur (nullable pour les invités)
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  email_contact TEXT NOT NULL, -- Email de contact (obligatoire)
  
  -- Contenu du ticket
  subject TEXT NOT NULL CHECK (subject IN ('bug', 'question', 'signalement', 'autre')),
  message TEXT NOT NULL,
  
  -- Statut
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
  
  -- Métadonnées
  admin_notes TEXT, -- Notes internes pour l'admin
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users ON DELETE SET NULL
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_email_contact ON tickets(email_contact);

-- Row Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policy : Insert public (tout le monde peut créer un ticket)
CREATE POLICY "Anyone can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (true);

-- Policy : Select pour le propriétaire (user_id) ou admin
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy : Update pour admin uniquement
CREATE POLICY "Admins can update tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Commentaires
COMMENT ON TABLE tickets IS 'Système de tickets pour support et signalements';
COMMENT ON COLUMN tickets.email_contact IS 'Email de contact (obligatoire, peut être différent de user.email)';
COMMENT ON COLUMN tickets.subject IS 'Type de ticket: bug, question, signalement, autre';
COMMENT ON COLUMN tickets.status IS 'Statut: open, closed, resolved';

-- ========================================
-- 2. COLONNE edit_token POUR VÉHICULES (Invités)
-- ========================================
DO $$ 
BEGIN
  -- Ajouter la colonne edit_token si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vehicules' AND column_name = 'edit_token'
  ) THEN
    ALTER TABLE vehicules 
    ADD COLUMN edit_token UUID DEFAULT gen_random_uuid();
    
    -- Générer un token pour les véhicules existants sans user_id (invités)
    UPDATE vehicules
    SET edit_token = gen_random_uuid()
    WHERE user_id IS NULL AND edit_token IS NULL;
    
    COMMENT ON COLUMN vehicules.edit_token IS 'Token UUID pour permettre la modification/suppression des annonces invitées (sans compte)';
  END IF;
END $$;

-- Index pour edit_token
CREATE INDEX IF NOT EXISTS idx_vehicules_edit_token ON vehicules(edit_token) WHERE edit_token IS NOT NULL;

-- ========================================
-- 3. FONCTION POUR SUPPRIMER UN VÉHICULE PAR TOKEN (Invités)
-- ========================================
CREATE OR REPLACE FUNCTION delete_vehicule_by_token(token_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vehicule_record RECORD;
BEGIN
  -- Récupérer le véhicule avec ce token
  SELECT * INTO vehicule_record
  FROM vehicules
  WHERE edit_token = token_uuid
  AND user_id IS NULL; -- Seulement pour les invités
  
  -- Si pas trouvé, retourner false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Supprimer le véhicule
  DELETE FROM vehicules WHERE id = vehicule_record.id;
  
  RETURN TRUE;
END;
$$;

-- Commentaire
COMMENT ON FUNCTION delete_vehicule_by_token IS 'Supprime un véhicule invité en utilisant son edit_token (sécurisé)';

-- ========================================
-- 4. VÉRIFICATION
-- ========================================
-- Vérifier que la table tickets existe
SELECT 
  'Table tickets créée' AS status,
  COUNT(*) AS total_tickets
FROM tickets;

-- Vérifier que la colonne edit_token existe
SELECT 
  'Colonne edit_token ajoutée' AS status,
  COUNT(*) AS vehicules_avec_token
FROM vehicules
WHERE edit_token IS NOT NULL;

-- ========================================
-- FIN DU SCRIPT
-- ========================================

