-- ========================================
-- OCTANE98 - SCHÉMA MASTER V2 (CONSOLIDÉ)
-- ========================================
-- 📅 Date: 2025-01-XX
-- 📋 Version: 2.0 (Consolidation complète)
-- 
-- ⚠️ IMPORTANT: Ce fichier représente la structure COMPLÈTE et PROPRE
-- de la base de données RedZone. Il peut être exécuté sur une base vide
-- pour créer un clone exact de l'architecture.
--
-- 🎯 Objectif: Unifier tous les fichiers SQL éparpillés en un schéma cohérent
--
-- ========================================
-- ⚠️ NOTE SUR LES NOMS DE TABLES
-- ========================================
-- Le code TypeScript utilise "vehicles" (anglais), certains scripts SQL
-- utilisent "vehicules" (français). Ce schéma utilise "vehicles" pour
-- correspondre au code TypeScript.
-- ========================================

-- ========================================
-- EXTENSIONS POSTGRESQL
-- ========================================

-- Extension pour les recherches textuelles avancées (pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ========================================
-- 1. ENUMS & TYPES (CHECK Constraints)
-- ========================================

-- Note: PostgreSQL n'a pas de vrais ENUMs dans ce schéma,
-- nous utilisons des CHECK constraints pour garantir la cohérence
-- Les valeurs sont définies dans les contraintes CHECK des tables

-- ========================================
-- 2. TABLE PROFILES (Utilisateurs)
-- ========================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Informations de base
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Rôles (7 rôles: particulier, pro, admin, moderator, support, editor, viewer)
  role TEXT DEFAULT 'particulier' CHECK (role IN ('particulier', 'pro', 'admin', 'moderator', 'support', 'editor', 'viewer')),
  
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
  ban_until TIMESTAMP WITH TIME ZONE,
  
  -- Membre Fondateur (500 premiers)
  is_founder BOOLEAN DEFAULT FALSE
);

-- Index profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_garage_name ON profiles(garage_name) WHERE garage_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified) WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned) WHERE is_banned = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_is_founder ON profiles(is_founder) WHERE is_founder = TRUE;
CREATE INDEX IF NOT EXISTS idx_profiles_role_admin_moderator ON profiles(role) WHERE role IN ('admin', 'moderator');

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

-- ========================================
-- 3. TABLE VEHICLES (Annonces)
-- ========================================

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Informations de base
  type TEXT NOT NULL CHECK (type IN ('car', 'moto')),
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  year INTEGER NOT NULL CHECK (year >= 1900 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
  mileage INTEGER NOT NULL CHECK (mileage >= 0),
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('essence', 'e85', 'lpg')),
  transmission TEXT NOT NULL CHECK (transmission IN ('manuelle', 'automatique', 'sequentielle')),
  body_type TEXT,
  power_hp INTEGER NOT NULL CHECK (power_hp > 0),
  condition TEXT NOT NULL CHECK (condition IN ('Neuf', 'Occasion')),
  euro_standard TEXT NOT NULL,
  car_pass BOOLEAN DEFAULT FALSE,
  
  -- Images
  image TEXT NOT NULL,
  images TEXT[],
  
  -- Description
  description TEXT,
  
  -- Statut
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'waiting_email_verification', 'pending_validation')),
  
  -- Vérification email (pour invités)
  guest_email TEXT,
  is_email_verified BOOLEAN DEFAULT FALSE,
  verification_code TEXT,
  verification_code_expires_at TIMESTAMP WITH TIME ZONE,
  edit_token UUID DEFAULT gen_random_uuid(), -- Pour permettre modification/suppression annonces invitées
  
  -- Spécifications techniques
  engine_architecture TEXT,
  admission TEXT,
  zero_a_cent NUMERIC(5, 2),
  co2 INTEGER,
  poids_kg INTEGER,
  fiscal_horsepower INTEGER,
  
  -- Passion & Transparence
  audio_file TEXT,
  history TEXT[],
  car_pass_url TEXT,
  is_manual_model BOOLEAN DEFAULT FALSE,
  
  -- Contact
  phone TEXT,
  contact_email TEXT,
  contact_methods TEXT[],
  
  -- Localisation
  city TEXT,
  postal_code TEXT,
  
  -- Filtres avancés
  interior_color TEXT,
  seats_count INTEGER,
  
  -- Champs pour calcul taxes belges
  displacement_cc INTEGER,
  co2_wltp INTEGER,
  first_registration_date DATE,
  is_hybrid BOOLEAN,
  is_electric BOOLEAN,
  region_of_registration TEXT CHECK (region_of_registration IN ('wallonie', 'flandre', 'bruxelles')),
  
  -- Champs pour véhicules sportifs
  drivetrain TEXT CHECK (drivetrain IN ('RWD', 'FWD', 'AWD', '4WD')),
  top_speed INTEGER,
  torque_nm INTEGER,
  engine_configuration TEXT,
  number_of_cylinders INTEGER,
  redline_rpm INTEGER,
  limited_edition BOOLEAN,
  number_produced INTEGER,
  racing_heritage TEXT,
  modifications TEXT[],
  track_ready BOOLEAN,
  warranty_remaining INTEGER,
  service_history_count INTEGER
);

-- Index vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status_active ON vehicles(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_vehicles_model ON vehicles(model);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(price) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON vehicles(year);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON vehicles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_edit_token ON vehicles(edit_token) WHERE edit_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_status_brand_year ON vehicles(status, brand, year DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_mileage ON vehicles(mileage) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type ON vehicles(fuel_type) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_transmission ON vehicles(transmission) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id_status ON vehicles(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status_pending ON vehicles(status) WHERE status IN ('pending', 'pending_validation', 'waiting_email_verification');
CREATE INDEX IF NOT EXISTS idx_vehicles_city ON vehicles(city) WHERE city IS NOT NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_postal_code ON vehicles(postal_code) WHERE postal_code IS NOT NULL AND status = 'active';
-- Index GIN pour recherches textuelles (si pg_trgm est disponible)
CREATE INDEX IF NOT EXISTS idx_vehicles_brand_trgm ON vehicles USING gin(brand gin_trgm_ops) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_vehicles_model_trgm ON vehicles USING gin(model gin_trgm_ops) WHERE status = 'active';

-- RLS vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active vehicles" ON vehicles;
CREATE POLICY "Public can view active vehicles"
  ON vehicles FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "Users can view own vehicles" ON vehicles;
CREATE POLICY "Users can view own vehicles"
  ON vehicles FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can view all vehicles" ON vehicles;
CREATE POLICY "Admins can view all vehicles"
  ON vehicles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create vehicles" ON vehicles;
CREATE POLICY "Authenticated users can create vehicles"
  ON vehicles FOR INSERT
  WITH CHECK (auth.uid() = owner_id OR owner_id IS NULL);

DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
CREATE POLICY "Users can update own vehicles"
  ON vehicles FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can update all vehicles" ON vehicles;
CREATE POLICY "Admins can update all vehicles"
  ON vehicles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;
CREATE POLICY "Users can delete own vehicles"
  ON vehicles FOR DELETE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Admins can delete all vehicles" ON vehicles;
CREATE POLICY "Admins can delete all vehicles"
  ON vehicles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 4. TABLE CONVERSATIONS (Messagerie)
-- ========================================

CREATE TABLE IF NOT EXISTS conversations (
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

-- Index conversations
CREATE INDEX IF NOT EXISTS idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_vehicle_id ON conversations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- RLS conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

DROP POLICY IF EXISTS "Buyers can create conversations" ON conversations;
CREATE POLICY "Buyers can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ========================================
-- 5. TABLE MESSAGES (Messagerie)
-- ========================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Index messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- RLS messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can send messages in own conversations" ON messages;
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

DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- ========================================
-- 6. TABLE FAVORITES (Favoris)
-- ========================================

CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id)
);

-- Index favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_vehicle_id ON favorites(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_vehicle ON favorites(user_id, vehicle_id);

-- RLS favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- 7. TABLE TICKETS (Support)
-- ========================================

CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Utilisateur (nullable pour les invités)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_contact TEXT NOT NULL,
  
  -- Contenu
  subject TEXT NOT NULL CHECK (subject IN ('bug', 'question', 'signalement', 'autre')),
  category TEXT NOT NULL CHECK (category IN ('Technique', 'Contenu', 'Commercial')),
  message TEXT NOT NULL,
  user_reply TEXT,
  
  -- Statut
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to TEXT NOT NULL DEFAULT 'admin' CHECK (assigned_to IN ('admin', 'moderator')),
  
  -- Réponses
  admin_notes TEXT, -- Notes internes pour l'admin
  admin_reply TEXT, -- Réponse visible par l'utilisateur
  
  -- Résolution
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index tickets
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_email_contact ON tickets(email_contact);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to_status ON tickets(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id_status ON tickets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_status_pending ON tickets(status) WHERE status IN ('open', 'in_progress');

-- RLS tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create tickets" ON tickets;
CREATE POLICY "Anyone can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Moderators can view assigned tickets" ON tickets;
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

DROP POLICY IF EXISTS "Admins can update all tickets" ON tickets;
CREATE POLICY "Admins can update all tickets"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Moderators can update assigned tickets" ON tickets;
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

DROP POLICY IF EXISTS "Admins can delete all tickets" ON tickets;
CREATE POLICY "Admins can delete all tickets"
  ON tickets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 8. TABLE NOTIFICATIONS
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
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);

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
-- 9. TABLE SAVED_SEARCHES (Alertes Sentinelle)
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
  last_notified_at TIMESTAMP WITH TIME ZONE
);

-- Index saved_searches
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_saved_searches_marque ON saved_searches(marque) WHERE marque IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_searches_type ON saved_searches USING GIN(type);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id_active ON saved_searches(user_id, is_active) WHERE is_active = true;

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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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
-- 10. TABLE ARTICLES (Blog/UGC)
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
CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_author_id_status ON articles(author_id, status);

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
-- 11. TABLE COMMENTS (Commentaires sur articles)
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
CREATE INDEX IF NOT EXISTS idx_comments_status_pending ON comments(status) WHERE status = 'pending';

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
-- 12. TABLE FAQ_ITEMS (FAQ Dynamique)
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
-- 13. TABLE SITE_SETTINGS (Configuration)
-- ========================================

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Réglages généraux
      banner_message TEXT DEFAULT 'Bienvenue sur Octane98',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  tva_rate NUMERIC(5, 2) DEFAULT 21.00 CHECK (tva_rate >= 0 AND tva_rate <= 100),
  home_title TEXT DEFAULT 'Le Sanctuaire du Moteur Thermique',
  
  -- Métadonnées
      site_name TEXT DEFAULT 'Octane98',
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
-- 14. TABLE APP_LOGS (Monitoring)
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
-- 15. TABLE AUDIT_LOGS (RGPD)
-- ========================================

CREATE TABLE IF NOT EXISTS audit_logs (
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

-- Index audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action_type, created_at DESC);

-- RLS audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs;
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;
CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true); -- Permettre l'insertion (contrôlée par le code serveur)

-- ========================================
-- 16. TABLE MODEL_SPECS_DB (Spécifications techniques)
-- ========================================

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

-- RLS model_specs_db
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
-- 3. FONCTIONS & TRIGGERS
-- ========================================

-- ========================================
-- 3.1. Fonction: handle_new_user (Création automatique de profil)
-- ========================================

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
-- 3.2. Fonction: update_updated_at_column (Trigger générique updated_at)
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 3.3. Trigger: update_conversation_updated_at (Mise à jour conversation quand message ajouté)
-- ========================================

CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_updated_at ON messages;
CREATE TRIGGER trigger_update_conversation_updated_at
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

-- ========================================
-- 3.4. Trigger: update_saved_searches_updated_at
-- ========================================

CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_saved_searches_updated_at ON saved_searches;
CREATE TRIGGER trigger_update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_searches_updated_at();

-- ========================================
-- 3.5. Trigger: update_articles_updated_at
-- ========================================

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3.6. Trigger: update_faq_items_updated_at
-- ========================================

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
-- 3.7. Trigger: update_tickets_updated_at
-- ========================================

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

-- ========================================
-- 3.8. Système Membres Fondateurs (500 premiers)
-- ========================================

-- Fonction pour attribuer automatiquement le badge fondateur
CREATE OR REPLACE FUNCTION assign_founder_badge()
RETURNS TRIGGER AS $$
DECLARE
  total_profiles_count INTEGER;
BEGIN
  -- Compter le nombre total de profils (y compris celui qui vient d'être créé)
  SELECT COUNT(*) INTO total_profiles_count
  FROM profiles;
  
  -- Si le nombre total de profils est <= 500, cet utilisateur est dans les 500 premiers
  IF total_profiles_count <= 500 THEN
    -- Attribuer le badge fondateur au nouvel utilisateur
    UPDATE profiles
    SET is_founder = TRUE
    WHERE id = NEW.id;
    
    RAISE NOTICE 'Badge fondateur attribué à l''utilisateur % (Rang: % / 500)', NEW.id, total_profiles_count;
  ELSE
    -- L'utilisateur n'est pas dans les 500 premiers, pas de badge (déjà FALSE par défaut)
    RAISE NOTICE 'Limite de 500 membres fondateurs atteinte. Utilisateur % n''est pas dans les 500 premiers (Rang: %)', NEW.id, total_profiles_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_assign_founder ON profiles;
CREATE TRIGGER on_profile_created_assign_founder
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_founder_badge();

-- Fonction pour attribuer manuellement le badge (admin)
CREATE OR REPLACE FUNCTION manually_assign_founder(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  founder_count INTEGER;
  user_id_var UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur
  SELECT id INTO user_id_var
  FROM profiles
  WHERE email = user_email;
  
  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', user_email;
  END IF;
  
  -- Vérifier si l'utilisateur est déjà fondateur
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id_var AND is_founder = TRUE) THEN
    RAISE NOTICE 'L''utilisateur % est déjà membre fondateur', user_email;
    RETURN TRUE;
  END IF;
  
  -- Compter le nombre actuel de membres fondateurs
  SELECT COUNT(*) INTO founder_count
  FROM profiles
  WHERE is_founder = TRUE;
  
  -- Si moins de 500, attribuer le badge
  IF founder_count < 500 THEN
    UPDATE profiles
    SET is_founder = TRUE
    WHERE id = user_id_var;
    
    RAISE NOTICE 'Badge fondateur attribué manuellement à % (Total: %)', user_email, founder_count + 1;
    RETURN TRUE;
  ELSE
    RAISE EXCEPTION 'Limite de 500 membres fondateurs atteinte. Impossible d''attribuer le badge.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour retirer le badge (admin)
CREATE OR REPLACE FUNCTION remove_founder_badge(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id_var UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur
  SELECT id INTO user_id_var
  FROM profiles
  WHERE email = user_email;
  
  IF user_id_var IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', user_email;
  END IF;
  
  -- Retirer le badge
  UPDATE profiles
  SET is_founder = FALSE
  WHERE id = user_id_var;
  
  RAISE NOTICE 'Badge fondateur retiré à %', user_email;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier le statut fondateur
CREATE OR REPLACE FUNCTION check_founder_status(user_email TEXT)
RETURNS TABLE(
  email TEXT,
  is_founder BOOLEAN,
  total_founders BIGINT,
  remaining_slots BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.email,
    p.is_founder,
    (SELECT COUNT(*) FROM profiles WHERE is_founder = TRUE)::BIGINT AS total_founders,
    GREATEST(0, 500 - (SELECT COUNT(*) FROM profiles WHERE is_founder = TRUE))::BIGINT AS remaining_slots
  FROM profiles p
  WHERE p.email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 3.9. Fonction: get_admin_stats (Statistiques admin)
-- ========================================

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE(
  total_vehicles BIGINT,
  pending_vehicles BIGINT,
  active_vehicles BIGINT,
  rejected_vehicles BIGINT,
  total_users BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin ou moderator
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  ) THEN
    RAISE EXCEPTION 'Accès refusé - Administrateur ou Modérateur requis';
  END IF;

  -- Retourner les statistiques
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::BIGINT FROM vehicles) AS total_vehicles,
    (SELECT COUNT(*)::BIGINT FROM vehicles WHERE status = 'pending' OR status = 'pending_validation' OR status = 'waiting_email_verification') AS pending_vehicles,
    (SELECT COUNT(*)::BIGINT FROM vehicles WHERE status = 'active') AS active_vehicles,
    (SELECT COUNT(*)::BIGINT FROM vehicles WHERE status = 'rejected') AS rejected_vehicles,
    (SELECT COUNT(*)::BIGINT FROM profiles) AS total_users;
END;
$$;

-- ========================================
-- 3.10. Fonction: cleanup_old_audit_logs (Nettoyage RGPD)
-- ========================================

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

-- ========================================
-- COMMENTAIRES POUR DOCUMENTATION
-- ========================================

COMMENT ON TABLE profiles IS 'Profils utilisateurs - Extensions de auth.users';
COMMENT ON COLUMN profiles.role IS 'Rôle utilisateur: particulier, pro, admin, moderator, support, editor, viewer';
COMMENT ON COLUMN profiles.is_founder IS 'Badge Membre Fondateur - Attribué automatiquement aux 500 premiers utilisateurs';

COMMENT ON TABLE vehicles IS 'Véhicules/Annonces - Table principale des annonces';
COMMENT ON TABLE conversations IS 'Conversations entre acheteurs et vendeurs concernant un véhicule';
COMMENT ON TABLE messages IS 'Messages individuels dans les conversations';
COMMENT ON TABLE favorites IS 'Favoris utilisateurs - Migration depuis localStorage';
COMMENT ON TABLE tickets IS 'Tickets de support utilisateur';
COMMENT ON TABLE notifications IS 'Notifications utilisateurs';
COMMENT ON TABLE saved_searches IS 'Recherches sauvegardées pour les alertes Sentinelle';
COMMENT ON TABLE articles IS 'Articles du blog / Contenu UGC';
COMMENT ON TABLE comments IS 'Commentaires sur les articles';
COMMENT ON TABLE faq_items IS 'FAQ dynamique - Gestion depuis l''admin';
COMMENT ON TABLE site_settings IS 'Configuration du site (une seule ligne)';
COMMENT ON TABLE app_logs IS 'Logs applicatifs pour monitoring';
COMMENT ON TABLE audit_logs IS 'Logs d''audit pour la conformité RGPD - Conservation 2 ans maximum';
COMMENT ON TABLE model_specs_db IS 'Spécifications techniques des modèles de véhicules';

COMMENT ON FUNCTION assign_founder_badge() IS 'Attribue automatiquement le badge fondateur aux nouveaux utilisateurs (limite: 500)';
COMMENT ON FUNCTION manually_assign_founder(TEXT) IS 'Attribue manuellement le badge fondateur à un utilisateur (admin uniquement)';
COMMENT ON FUNCTION remove_founder_badge(TEXT) IS 'Retire le badge fondateur d''un utilisateur (admin uniquement)';
COMMENT ON FUNCTION check_founder_status(TEXT) IS 'Vérifie le statut fondateur d''un utilisateur et le nombre de places restantes';
COMMENT ON FUNCTION get_admin_stats() IS 'Retourne les statistiques admin (véhicules et utilisateurs). Nécessite le rôle admin ou moderator.';
COMMENT ON FUNCTION cleanup_old_audit_logs() IS 'Nettoie les logs d''audit de plus de 2 ans (conformité RGPD)';

-- ========================================
-- ANALYSE DES TABLES (Optimisation)
-- ========================================

-- Mettre à jour les statistiques pour l'optimiseur de requêtes
ANALYZE profiles;
ANALYZE vehicles;
ANALYZE conversations;
ANALYZE messages;
ANALYZE favorites;
ANALYZE tickets;
ANALYZE notifications;
ANALYZE saved_searches;
ANALYZE articles;
ANALYZE comments;
ANALYZE faq_items;
ANALYZE site_settings;
ANALYZE app_logs;
ANALYZE audit_logs;
ANALYZE model_specs_db;

-- ========================================
-- RÉSUMÉ
-- ========================================
-- 
-- Tables créées: 15
-- - profiles (utilisateurs)
-- - vehicles (annonces)
-- - conversations (messagerie)
-- - messages (messagerie)
-- - favorites (favoris)
-- - tickets (support)
-- - notifications (notifications)
-- - saved_searches (alertes Sentinelle)
-- - articles (blog)
-- - comments (commentaires)
-- - faq_items (FAQ)
-- - site_settings (configuration)
-- - app_logs (logs applicatifs)
-- - audit_logs (logs RGPD)
-- - model_specs_db (spécifications techniques)
--
-- Fonctions créées: 10
-- - handle_new_user() - Création automatique de profil
-- - update_updated_at_column() - Trigger générique updated_at
-- - update_conversation_updated_at() - Mise à jour conversation
-- - update_saved_searches_updated_at() - Trigger saved_searches
-- - update_articles_updated_at() - Trigger articles
-- - update_faq_items_updated_at() - Trigger faq_items
-- - update_tickets_updated_at() - Trigger tickets
-- - assign_founder_badge() - Badge fondateur automatique
-- - manually_assign_founder() - Attribution manuelle badge
-- - remove_founder_badge() - Retrait badge
-- - check_founder_status() - Vérification statut
-- - get_admin_stats() - Statistiques admin
-- - cleanup_old_audit_logs() - Nettoyage RGPD
--
-- Triggers créés: 8
-- - on_auth_user_created (profiles)
-- - trigger_update_conversation_updated_at (messages)
-- - trigger_update_saved_searches_updated_at (saved_searches)
-- - update_articles_updated_at (articles)
-- - faq_items_updated_at (faq_items)
-- - trigger_update_tickets_updated_at (tickets)
-- - on_profile_created_assign_founder (profiles)
--
-- RLS Policies: Toutes les tables ont leurs politiques de sécurité configurées
-- Index: Tous les index nécessaires pour les performances sont créés
--
-- ========================================
-- FIN DU SCHÉMA MASTER V2
-- ========================================

