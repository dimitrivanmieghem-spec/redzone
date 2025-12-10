-- ========================================
-- REDZONE - EXTENSION ARTICLES POUR UGC
-- ========================================
-- Ce script étend la table articles pour supporter le contenu généré par les utilisateurs
-- Copiez-collez ce script dans le SQL Editor de Supabase

-- ========================================
-- 1. AJOUT DU STATUT 'pending' AU CHECK
-- ========================================
-- Supprimer l'ancienne contrainte
ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_status_check;

-- Ajouter la nouvelle contrainte avec 'pending'
ALTER TABLE articles ADD CONSTRAINT articles_status_check 
  CHECK (status IN ('draft', 'pending', 'published', 'archived'));

-- ========================================
-- 2. AJOUT DU CHAMP TYPE DE CONTENU
-- ========================================
-- Ajouter la colonne post_type pour distinguer Questions/Présentations
ALTER TABLE articles ADD COLUMN IF NOT EXISTS post_type TEXT 
  CHECK (post_type IN ('question', 'presentation', 'article'));

-- Valeur par défaut pour les anciens articles (article = contenu éditorial)
UPDATE articles SET post_type = 'article' WHERE post_type IS NULL;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_articles_post_type ON articles(post_type);

-- ========================================
-- 3. MISE À JOUR DES POLITIQUES RLS
-- ========================================
-- Les utilisateurs peuvent créer des posts avec status 'pending'
-- (La politique existante "Users can create own articles" fonctionne déjà)

-- Les utilisateurs peuvent voir leurs propres posts même en 'pending'
-- (La politique "Users can view own articles" fonctionne déjà)

-- Les admins peuvent voir tous les posts (y compris 'pending')
-- (La politique "Admins can view all articles" fonctionne déjà)

-- ========================================
-- 4. VÉRIFICATION
-- ========================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'articles'
  AND column_name IN ('status', 'post_type')
ORDER BY ordinal_position;

