-- ========================================
-- REDZONE - SCHÉMA MASTER CONSOLIDÉ
-- ========================================
-- 📅 Date: 2025-01-XX
-- 📋 Audit: Voir AUDIT_REPORT.md
-- 
-- Ce fichier représente la structure IDEALE et PROPRE de la base de données
-- telle qu'elle devrait être aujourd'hui pour faire tourner le site RedZone.
--
-- ⚠️ ATTENTION: Ce script est une RÉFÉRENCE. Il ne doit PAS être exécuté tel quel
-- sur une base de données existante. Utilisez-le comme documentation de référence.
--
-- Pour migrer vers ce schéma, utilisez les scripts de migration incrémentaux
-- déjà présents dans le dossier supabase/.
--
-- ========================================

-- ========================================
-- 1. TABLE PROFILES (Utilisateurs)
-- ========================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'particulier' CHECK (role IN ('particulier', 'pro', 'admin', 'moderator')),
  avatar_url TEXT,
  
  -- Garage (pour les pros)
  garage_name TEXT,
  garage_description TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  phone TEXT,
  bio TEXT,
  
  -- Premium
  speciality TEXT,
  founded_year INTEGER,
  cover_image_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Ban
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT,
  ban_until TIMESTAMP WITH TIME ZONE
);

-- Index profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_garage_name ON profiles(garage_name) WHERE garage_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned);

-- RLS profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Trigger pour créer automatiquement un profil à la création d'un user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 2. TABLE VEHICULES (Annonces)
-- ========================================
-- Note: Cette table a été construite de manière incrémentale
-- Toutes les colonnes listées ici représentent l'état final consolidé

CREATE TABLE IF NOT EXISTS vehicules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Informations de base
  type TEXT NOT NULL CHECK (type IN ('car', 'moto')),
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  prix NUMERIC(12, 2) NOT NULL,
  annee INTEGER NOT NULL,
  km INTEGER NOT NULL,
  carburant TEXT NOT NULL CHECK (carburant IN ('essence', 'e85', 'lpg')),
  transmission TEXT NOT NULL CHECK (transmission IN ('manuelle', 'automatique', 'sequentielle')),
  carrosserie TEXT NOT NULL,
  puissance INTEGER NOT NULL,
  etat TEXT NOT NULL CHECK (etat IN ('Neuf', 'Occasion')),
  norme_euro TEXT NOT NULL,
  car_pass BOOLEAN DEFAULT FALSE,
  
  -- Images
  image TEXT NOT NULL,
  images TEXT[],
  
  -- Description
  description TEXT,
  
  -- Statut
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'waiting_email_verification', 'pending_validation')),
  
  -- Vérification email (pour invités)
  email_contact TEXT,
  is_email_verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT,
  verification_code_expires_at TIMESTAMP WITH TIME ZONE,
  edit_token UUID DEFAULT gen_random_uuid(), -- Pour permettre modification/suppression annonces invitées
  
  -- Spécifications techniques
  architecture_moteur TEXT,
  admission TEXT,
  zero_a_cent NUMERIC(5, 2),
  co2 INTEGER,
  poids_kg INTEGER,
  cv_fiscaux INTEGER,
  
  -- Passion & Transparence
  audio_file TEXT,
  history TEXT[],
  car_pass_url TEXT,
  is_manual_model BOOLEAN DEFAULT FALSE,
  
  -- Contact
  telephone TEXT,
  contact_email TEXT,
  contact_methods TEXT[],
  
  -- Localisation
  ville TEXT,
  code_postal TEXT,
  
  -- Filtres avancés
  couleur_interieure TEXT,
  nombre_places INTEGER
);

-- Index vehicules
CREATE INDEX IF NOT EXISTS idx_vehicules_user_id ON vehicules(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicules_status ON vehicules(status);
CREATE INDEX IF NOT EXISTS idx_vehicules_type ON vehicules(type);
CREATE INDEX IF NOT EXISTS idx_vehicules_marque ON vehicules(marque);
CREATE INDEX IF NOT EXISTS idx_vehicules_modele ON vehicules(modele);
CREATE INDEX IF NOT EXISTS idx_vehicules_prix ON vehicules(prix);
CREATE INDEX IF NOT EXISTS idx_vehicules_annee ON vehicules(annee);
CREATE INDEX IF NOT EXISTS idx_vehicules_created_at ON vehicules(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicules_edit_token ON vehicules(edit_token) WHERE edit_token IS NOT NULL;

-- RLS vehicules
ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active vehicules" ON vehicules;
CREATE POLICY "Public can view active vehicules"
  ON vehicules FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "Users can view own vehicules" ON vehicules;
CREATE POLICY "Users can view own vehicules"
  ON vehicules FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all vehicules" ON vehicules;
CREATE POLICY "Admins can view all vehicules"
  ON vehicules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create vehicules" ON vehicules;
CREATE POLICY "Authenticated users can create vehicules"
  ON vehicules FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update own vehicules" ON vehicules;
CREATE POLICY "Users can update own vehicules"
  ON vehicules FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update all vehicules" ON vehicules;
CREATE POLICY "Admins can update all vehicules"
  ON vehicules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can delete own vehicules" ON vehicules;
CREATE POLICY "Users can delete own vehicules"
  ON vehicules FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete all vehicules" ON vehicules;
CREATE POLICY "Admins can delete all vehicules"
  ON vehicules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 3. TABLE TICKETS (Support)
-- ========================================

CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Utilisateur (nullable pour les invités)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_contact TEXT NOT NULL,
  
  -- Contenu
  subject TEXT NOT NULL CHECK (subject IN ('bug', 'question', 'signalement', 'autre')),
  category TEXT NOT NULL CHECK (category IN ('Technique', 'Contenu', 'Commercial')),
  message TEXT NOT NULL,
  
  -- Statut
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved')),
  assigned_to TEXT NOT NULL DEFAULT 'admin' CHECK (assigned_to IN ('admin', 'moderator')),
  
  -- Réponses
  admin_notes TEXT, -- Notes internes pour l'admin
  admin_reply TEXT, -- Réponse visible par l'utilisateur
  
  -- Résolution
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index tickets
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_email_contact ON tickets(email_contact);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to_status ON tickets(assigned_to, status);

-- RLS tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create tickets" ON tickets;
CREATE POLICY "Anyone can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'moderator')
    )
  );

DROP POLICY IF EXISTS "Admins can update tickets" ON tickets;
CREATE POLICY "Admins can update tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'moderator')
    )
  );

-- ========================================
-- 4. TABLE NOTIFICATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Contenu
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'error')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  
  -- État de lecture
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

-- RLS notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can create own notifications" ON notifications;
CREATE POLICY "Users can create own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can create all notifications" ON notifications;
CREATE POLICY "Admins can create all notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update all notifications" ON notifications;
CREATE POLICY "Admins can update all notifications"
  ON notifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 5. TABLE SAVED_SEARCHES (Alertes Sentinelle)
-- ========================================

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Critères de recherche
  marque TEXT,
  modele TEXT,
  prix_min INTEGER,
  prix_max INTEGER,
  annee_min INTEGER,
  annee_max INTEGER,
  km_max INTEGER,
  type TEXT[],
  carburants TEXT[],
  transmissions TEXT[],
  carrosseries TEXT[],
  norme_euro TEXT,
  car_pass_only BOOLEAN DEFAULT FALSE,
  
  -- Filtres passionnés
  architectures TEXT[],
  admissions TEXT[],
  couleur_exterieure TEXT[],
  couleur_interieure TEXT[],
  nombre_places TEXT[],
  
  -- Métadonnées
  name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT saved_searches_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Index saved_searches
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_saved_searches_marque ON saved_searches(marque) WHERE marque IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_searches_type ON saved_searches USING GIN(type);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_saved_searches_updated_at ON saved_searches;
CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_searches_updated_at();

-- RLS saved_searches
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved searches" ON saved_searches;
CREATE POLICY "Users can view own saved searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own saved searches" ON saved_searches;
CREATE POLICY "Users can insert own saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own saved searches" ON saved_searches;
CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved searches" ON saved_searches;
CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all saved searches" ON saved_searches;
CREATE POLICY "Admins can view all saved searches"
  ON saved_searches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 6. TABLE ARTICLES (Blog/UGC)
-- ========================================

CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contenu
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  main_image_url TEXT,
  post_type TEXT CHECK (post_type IN ('question', 'presentation', 'article')),
  
  -- Auteur
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Modération
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'archived'))
);

-- Index articles
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_post_type ON articles(post_type);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS articles
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published articles" ON articles;
CREATE POLICY "Anyone can view published articles"
  ON articles FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Users can view own articles" ON articles;
CREATE POLICY "Users can view own articles"
  ON articles FOR SELECT
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admins can view all articles" ON articles;
CREATE POLICY "Admins can view all articles"
  ON articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can create own articles" ON articles;
CREATE POLICY "Users can create own articles"
  ON articles FOR INSERT
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own articles" ON articles;
CREATE POLICY "Users can update own articles"
  ON articles FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Admins can manage all articles" ON articles;
CREATE POLICY "Admins can manage all articles"
  ON articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 7. TABLE COMMENTS (Commentaires sur articles)
-- ========================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Relations
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Contenu
  content TEXT NOT NULL,
  
  -- Modération
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Index comments
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments(article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- RLS comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view approved comments" ON comments;
CREATE POLICY "Anyone can view approved comments"
  ON comments FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Users can view own comments" ON comments;
CREATE POLICY "Users can view own comments"
  ON comments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all comments" ON comments;
CREATE POLICY "Admins can view all comments"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pending comments" ON comments;
CREATE POLICY "Users can update own pending comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can manage all comments" ON comments;
CREATE POLICY "Admins can manage all comments"
  ON comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can delete own pending comments" ON comments;
CREATE POLICY "Users can delete own pending comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins can delete all comments" ON comments;
CREATE POLICY "Admins can delete all comments"
  ON comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 8. TABLE FAQ_ITEMS (FAQ Dynamique)
-- ========================================

CREATE TABLE IF NOT EXISTS faq_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Index faq_items
CREATE INDEX IF NOT EXISTS idx_faq_items_order ON faq_items("order");
CREATE INDEX IF NOT EXISTS idx_faq_items_is_active ON faq_items(is_active);

-- Trigger updated_at
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

-- RLS faq_items
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active FAQ" ON faq_items;
CREATE POLICY "Anyone can view active FAQ"
  ON faq_items FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage FAQ" ON faq_items;
CREATE POLICY "Admins can manage FAQ"
  ON faq_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 9. TABLE SITE_SETTINGS (Configuration)
-- ========================================

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Réglages généraux
  banner_message TEXT DEFAULT 'Bienvenue sur RedZone',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  tva_rate NUMERIC(5, 2) DEFAULT 21.00 CHECK (tva_rate >= 0 AND tva_rate <= 100),
  home_title TEXT DEFAULT 'Le Sanctuaire du Moteur Thermique',
  
  -- Métadonnées
  site_name TEXT DEFAULT 'RedZone',
  site_description TEXT DEFAULT 'Le sanctuaire du moteur thermique',
  
  -- Contrainte : Une seule ligne de configuration
  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Index site_settings
CREATE INDEX IF NOT EXISTS idx_site_settings_id ON site_settings(id);

-- RLS site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view settings" ON site_settings;
CREATE POLICY "Admins can view settings"
  ON site_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update settings" ON site_settings;
CREATE POLICY "Admins can update settings"
  ON site_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 10. TABLE APP_LOGS (Monitoring)
-- ========================================

CREATE TABLE IF NOT EXISTS app_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('error', 'info', 'warning')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index app_logs
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON app_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON app_logs(user_id);

-- RLS app_logs
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all logs" ON app_logs;
CREATE POLICY "Admins can view all logs"
  ON app_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can create own logs" ON app_logs;
CREATE POLICY "Users can create own logs"
  ON app_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins can create all logs" ON app_logs;
CREATE POLICY "Admins can create all logs"
  ON app_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 11. TABLE MODEL_SPECS_DB (Spécifications techniques)
-- ========================================
-- Note: Cette table est une migration future si vehicleData.ts > 400 Ko
-- Pour l'instant, elle peut être utilisée en parallèle ou en remplacement

CREATE TABLE IF NOT EXISTS model_specs_db (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Identification
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('car', 'moto')),
  
  -- Spécifications techniques
  kw NUMERIC(6, 2) NOT NULL,
  ch NUMERIC(6, 2) NOT NULL,
  cv_fiscaux INTEGER NOT NULL,
  co2 NUMERIC(6, 2),
  cylindree INTEGER NOT NULL,
  moteur TEXT NOT NULL,
  transmission TEXT NOT NULL CHECK (transmission IN ('Manuelle', 'Automatique', 'Séquentielle')),
  
  -- Métadonnées
  is_active BOOLEAN DEFAULT TRUE,
  source TEXT DEFAULT 'vehicleData.ts',
  
  -- Contrainte d'unicité
  CONSTRAINT unique_marque_modele_type UNIQUE (marque, modele, type)
);

-- Index model_specs_db
CREATE INDEX IF NOT EXISTS idx_model_specs_db_marque ON model_specs_db(marque);
CREATE INDEX IF NOT EXISTS idx_model_specs_db_modele ON model_specs_db(modele);
CREATE INDEX IF NOT EXISTS idx_model_specs_db_type ON model_specs_db(type);
CREATE INDEX IF NOT EXISTS idx_model_specs_db_active ON model_specs_db(is_active) WHERE is_active = TRUE;

-- RLS model_specs_db (lecture publique, écriture admin)
ALTER TABLE model_specs_db ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active model specs" ON model_specs_db;
CREATE POLICY "Anyone can view active model specs"
  ON model_specs_db FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage model specs" ON model_specs_db;
CREATE POLICY "Admins can manage model specs"
  ON model_specs_db FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- FIN DU SCHÉMA MASTER
-- ========================================
--
-- Ce schéma représente l'état IDEAL de la base de données.
-- Pour migrer une base existante, utilisez les scripts de migration incrémentaux
-- dans le dossier supabase/.
--
-- Tables définies: 11 tables
-- - profiles
-- - vehicules
-- - tickets
-- - notifications
-- - saved_searches
-- - articles
-- - comments
-- - faq_items
-- - site_settings
-- - app_logs
-- - model_specs_db
--
-- Toutes les tables ont leurs Index, RLS Policies et Triggers configurés.
--
-- ========================================

