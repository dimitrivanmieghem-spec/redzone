-- ========================================
-- REDZONE - EXTENSIONS BACK-OFFICE ADMIN
-- ========================================
-- Script SQL pour étendre les capacités du back-office
-- Copiez-collez ce script dans le SQL Editor de Supabase

-- ========================================
-- 1. AJOUT COLONNE is_banned À PROFILES
-- ========================================

-- Ajouter la colonne is_banned si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;
    
    COMMENT ON COLUMN profiles.is_banned IS 'True si l''utilisateur est banni (ne peut plus se connecter ni publier)';
  END IF;
END $$;

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);

-- ========================================
-- 2. TABLE FAQ_ITEMS (FAQ Dynamique)
-- ========================================

CREATE TABLE IF NOT EXISTS faq_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  "order" INTEGER DEFAULT 0, -- Ordre d'affichage (0 = premier)
  is_active BOOLEAN DEFAULT TRUE -- Active ou non
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_faq_items_order ON faq_items("order");
CREATE INDEX IF NOT EXISTS idx_faq_items_is_active ON faq_items(is_active);

-- Row Level Security
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

-- Policy : Tout le monde peut lire les FAQ actives
CREATE POLICY "Anyone can view active FAQ"
  ON faq_items FOR SELECT
  USING (is_active = TRUE);

-- Policy : Seuls les admins peuvent gérer les FAQ
CREATE POLICY "Admins can manage FAQ"
  ON faq_items FOR ALL
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

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_faq_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS faq_items_updated_at ON faq_items;
CREATE TRIGGER faq_items_updated_at
  BEFORE UPDATE ON faq_items
  FOR EACH ROW
  EXECUTE FUNCTION update_faq_items_updated_at();

-- ========================================
-- 3. AJOUT COLONNES À SITE_SETTINGS
-- ========================================

-- Ajouter home_title (Titre H1 de la page d'accueil)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'site_settings' AND column_name = 'home_title'
  ) THEN
    ALTER TABLE site_settings 
    ADD COLUMN home_title TEXT DEFAULT 'Le Sanctuaire du Moteur Thermique';
    
    COMMENT ON COLUMN site_settings.home_title IS 'Titre H1 de la page d''accueil';
  END IF;
END $$;

-- Note: tva_rate existe déjà dans site_settings, pas besoin de l'ajouter

-- ========================================
-- 4. DONNÉES PAR DÉFAUT FAQ
-- ========================================

-- Insérer quelques questions fréquentes par défaut
INSERT INTO faq_items (question, answer, "order", is_active)
VALUES
  (
    'Qu''est-ce que RedZone ?',
    'RedZone est une plateforme communautaire de mise en relation pour véhicules sportifs en Belgique. Nous mettons en relation les passionnés de voitures de sport, youngtimers et supercars.',
    1,
    TRUE
  ),
  (
    'Comment publier une annonce ?',
    'Créez un compte gratuitement, puis cliquez sur "Vendre" dans le menu. Remplissez le formulaire avec les informations de votre véhicule et ajoutez des photos. Votre annonce sera validée par notre équipe avant publication.',
    2,
    TRUE
  ),
  (
    'Les annonces sont-elles gratuites ?',
    'Oui ! Durant la phase Bêta, la publication d''annonces est entièrement gratuite et illimitée pour tous les particuliers.',
    3,
    TRUE
  ),
  (
    'Comment contacter un vendeur ?',
    'Chaque annonce affiche les méthodes de contact choisies par le vendeur : Email, WhatsApp ou téléphone. Cliquez sur le bouton correspondant pour le contacter directement.',
    4,
    TRUE
  ),
  (
    'RedZone vérifie-t-il les véhicules ?',
    'RedZone agit en qualité d''hébergeur technique. Nous ne vérifions pas physiquement les véhicules et ne garantissons pas l''exactitude des informations. Toute transaction se fait exclusivement entre l''acheteur et le vendeur.',
    5,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- ========================================
-- 5. VÉRIFICATIONS
-- ========================================

-- Vérifier les colonnes ajoutées
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name IN ('profiles', 'faq_items', 'site_settings')
  AND column_name IN ('is_banned', 'home_title', 'question', 'answer', 'order', 'is_active')
ORDER BY table_name, column_name;

-- Vérifier les tables créées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('faq_items', 'profiles', 'site_settings')
ORDER BY table_name;

-- Afficher les FAQ par défaut
SELECT id, question, "order", is_active 
FROM faq_items 
ORDER BY "order" ASC;

