-- ========================================
-- REDZONE - TABLE COMMENTS (MODÉRATION)
-- ========================================
-- Ce script crée la table pour le système de commentaires avec modération
-- Copiez-collez ce script dans le SQL Editor de Supabase

-- ========================================
-- 1. CRÉATION DE LA TABLE comments
-- ========================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relations
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Contenu
  content TEXT NOT NULL,
  
  -- Modération (CLÉ DE LA MODÉRATION)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- ========================================
-- 2. INDEX POUR PERFORMANCES
-- ========================================
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- ========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ========================================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policy : Lecture publique UNIQUEMENT des commentaires approuvés
DROP POLICY IF EXISTS "Anyone can view approved comments" ON comments;
CREATE POLICY "Anyone can view approved comments"
  ON comments FOR SELECT
  USING (status = 'approved');

-- Policy : Les utilisateurs peuvent voir leurs propres commentaires (même en attente)
DROP POLICY IF EXISTS "Users can view own comments" ON comments;
CREATE POLICY "Users can view own comments"
  ON comments FOR SELECT
  USING (auth.uid() = user_id);

-- Policy : Les admins peuvent tout voir (y compris les commentaires en attente)
DROP POLICY IF EXISTS "Admins can view all comments" ON comments;
CREATE POLICY "Admins can view all comments"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy : Les utilisateurs connectés peuvent créer des commentaires
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent modifier leurs propres commentaires (seulement si pending)
DROP POLICY IF EXISTS "Users can update own pending comments" ON comments;
CREATE POLICY "Users can update own pending comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Policy : Les admins peuvent modifier tous les commentaires (modération)
DROP POLICY IF EXISTS "Admins can manage all comments" ON comments;
CREATE POLICY "Admins can manage all comments"
  ON comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy : Les utilisateurs peuvent supprimer leurs propres commentaires (seulement si pending)
DROP POLICY IF EXISTS "Users can delete own pending comments" ON comments;
CREATE POLICY "Users can delete own pending comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- Policy : Les admins peuvent supprimer tous les commentaires
DROP POLICY IF EXISTS "Admins can delete all comments" ON comments;
CREATE POLICY "Admins can delete all comments"
  ON comments FOR DELETE
  USING (
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
WHERE table_name = 'comments'
ORDER BY ordinal_position;

