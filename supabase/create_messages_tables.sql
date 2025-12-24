-- ========================================
-- REDZONE - TABLES MESSAGERIE
-- ========================================
-- Script pour créer les tables conversations et messages
-- Ce script est idempotent : il peut être exécuté plusieurs fois sans erreur
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase

-- ========================================
-- TABLE CONVERSATIONS
-- ========================================

-- Vérifier si la table existe avant de la créer
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    CREATE TABLE conversations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
      buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      buyer_last_read_at TIMESTAMP WITH TIME ZONE,
      seller_last_read_at TIMESTAMP WITH TIME ZONE,
      UNIQUE(buyer_id, seller_id, vehicle_id)
    );

    RAISE NOTICE 'Table conversations créée avec succès';
  ELSE
    RAISE NOTICE 'Table conversations existe déjà';
  END IF;
END $$;

-- Index pour performances
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_vehicle_id ON conversations(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
    
    RAISE NOTICE 'Index conversations créés avec succès';
  END IF;
END $$;

-- Row Level Security pour conversations
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
    ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
    
    -- Supprimer les anciennes policies si elles existent
    DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
    DROP POLICY IF EXISTS "Buyers can create conversations" ON conversations;
    DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;

    -- Policy : Les utilisateurs peuvent voir leurs conversations (buyer OU seller)
    CREATE POLICY "Users can view own conversations"
      ON conversations FOR SELECT
      USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

    -- Policy : Les acheteurs peuvent créer des conversations
    CREATE POLICY "Buyers can create conversations"
      ON conversations FOR INSERT
      WITH CHECK (auth.uid() = buyer_id);

    -- Policy : Les utilisateurs peuvent mettre à jour leurs conversations (dates de lecture)
    CREATE POLICY "Users can update own conversations"
      ON conversations FOR UPDATE
      USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
      WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
    
    RAISE NOTICE 'Policies RLS conversations créées avec succès';
  END IF;
END $$;

-- ========================================
-- TABLE MESSAGES
-- ========================================

-- Vérifier si la table existe avant de la créer
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    CREATE TABLE messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
      sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      is_read BOOLEAN DEFAULT FALSE,
      read_at TIMESTAMP WITH TIME ZONE
    );

    RAISE NOTICE 'Table messages créée avec succès';
  ELSE
    RAISE NOTICE 'Table messages existe déjà';
  END IF;
END $$;

-- Index pour performances
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
    
    RAISE NOTICE 'Index messages créés avec succès';
  END IF;
END $$;

-- Row Level Security pour messages
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
    
    -- Supprimer les anciennes policies si elles existent
    DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
    DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
    DROP POLICY IF EXISTS "Users can update own messages" ON messages;

    -- Policy : Les utilisateurs peuvent voir les messages de leurs conversations
    CREATE POLICY "Users can view messages in own conversations"
      ON messages FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM conversations
          WHERE conversations.id = messages.conversation_id
          AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
        )
      );

    -- Policy : Les utilisateurs peuvent envoyer des messages dans leurs conversations
    CREATE POLICY "Users can send messages in own conversations"
      ON messages FOR INSERT
      WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
          SELECT 1 FROM conversations
          WHERE conversations.id = messages.conversation_id
          AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
        )
      );

    -- Policy : Les utilisateurs peuvent mettre à jour leurs messages (is_read, read_at)
    CREATE POLICY "Users can update own messages"
      ON messages FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM conversations
          WHERE conversations.id = messages.conversation_id
          AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
        )
      );
    
    RAISE NOTICE 'Policies RLS messages créées avec succès';
  END IF;
END $$;

-- ========================================
-- FUNCTION : Mettre à jour updated_at automatiquement
-- ========================================

-- Function pour mettre à jour updated_at sur conversations quand un message est ajouté
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS trigger_update_conversation_updated_at ON messages;
CREATE TRIGGER trigger_update_conversation_updated_at
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

-- Commentaires pour documentation
COMMENT ON TABLE conversations IS 'Conversations entre acheteurs et vendeurs concernant un véhicule';
COMMENT ON COLUMN conversations.vehicle_id IS 'ID du véhicule concerné';
COMMENT ON COLUMN conversations.buyer_id IS 'ID de l''acheteur (utilisateur qui contacte)';
COMMENT ON COLUMN conversations.seller_id IS 'ID du vendeur (propriétaire du véhicule)';
COMMENT ON COLUMN conversations.buyer_last_read_at IS 'Dernière fois que l''acheteur a lu les messages';
COMMENT ON COLUMN conversations.seller_last_read_at IS 'Dernière fois que le vendeur a lu les messages';

COMMENT ON TABLE messages IS 'Messages individuels dans les conversations';
COMMENT ON COLUMN messages.conversation_id IS 'ID de la conversation parente';
COMMENT ON COLUMN messages.sender_id IS 'ID de l''auteur du message';
COMMENT ON COLUMN messages.content IS 'Contenu du message (max 5000 caractères)';

-- Vérification finale
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations')
     AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    RAISE NOTICE '✅ Tables de messagerie créées et configurées avec succès !';
  ELSE
    RAISE EXCEPTION '❌ Erreur : Les tables n''ont pas pu être créées';
  END IF;
END $$;

