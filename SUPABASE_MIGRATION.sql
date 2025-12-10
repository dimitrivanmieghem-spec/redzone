-- ========================================
-- REDZONE - MIGRATION SUPABASE COMPLÈTE
-- ========================================
-- Copiez-collez ce script dans le SQL Editor de Supabase

-- ========================================
-- 1. TABLE PROFILES
-- ========================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT
);

-- Index
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger pour créer automatiquement un profil après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 2. TABLE VEHICULES
-- ========================================

CREATE TABLE vehicules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  
  -- Infos de base
  type TEXT NOT NULL CHECK (type IN ('car', 'moto')),
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  prix NUMERIC NOT NULL CHECK (prix > 0),
  annee INTEGER NOT NULL CHECK (annee >= 1900 AND annee <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
  km INTEGER NOT NULL CHECK (km >= 0),
  carburant TEXT NOT NULL CHECK (carburant IN ('essence', 'e85', 'lpg')),
  transmission TEXT NOT NULL CHECK (transmission IN ('manuelle', 'automatique', 'sequentielle')),
  carrosserie TEXT,
  puissance INTEGER NOT NULL CHECK (puissance > 0),
  etat TEXT NOT NULL CHECK (etat IN ('Neuf', 'Occasion')),
  norme_euro TEXT NOT NULL,
  car_pass BOOLEAN DEFAULT FALSE,
  
  -- Médias
  image TEXT NOT NULL,
  images TEXT[],
  description TEXT,
  
  -- Modération
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  
  -- Technique
  architecture_moteur TEXT,
  admission TEXT,
  zero_a_cent NUMERIC,
  co2 INTEGER,
  poids_kg INTEGER,
  
  -- Passion
  audio_file TEXT,
  history TEXT[]
);

-- Index pour les performances
CREATE INDEX idx_vehicules_status ON vehicules(status);
CREATE INDEX idx_vehicules_marque ON vehicules(marque);
CREATE INDEX idx_vehicules_type ON vehicules(type);
CREATE INDEX idx_vehicules_prix ON vehicules(prix);
CREATE INDEX idx_vehicules_user_id ON vehicules(user_id);
CREATE INDEX idx_vehicules_created_at ON vehicules(created_at DESC);

-- Row Level Security
ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;

-- Policies : Lecture
CREATE POLICY "Anyone can view active vehicles"
  ON vehicules FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can view own vehicles"
  ON vehicules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vehicles"
  ON vehicules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policies : Écriture
CREATE POLICY "Authenticated users can insert vehicles"
  ON vehicules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
  ON vehicules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all vehicles"
  ON vehicules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can delete own vehicles"
  ON vehicules FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all vehicles"
  ON vehicules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- ========================================
-- 3. STORAGE BUCKET
-- ========================================

-- Créer le bucket "files" manuellement dans Supabase Dashboard > Storage
-- Puis exécuter ces policies :

-- Policy : Lecture publique
CREATE POLICY "Anyone can view files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'files');

-- Policy : Upload pour authentifiés
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'files' 
    AND auth.role() = 'authenticated'
  );

-- Policy : Mise à jour de ses propres fichiers
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy : Suppression de ses propres fichiers
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ========================================
-- 4. FONCTIONS UTILES
-- ========================================

-- Fonction pour compter les véhicules par statut
CREATE OR REPLACE FUNCTION count_vehicles_by_status()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vehicules.status::TEXT,
    COUNT(*)::BIGINT
  FROM vehicules
  WHERE user_id = auth.uid()
  GROUP BY vehicules.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les stats admin
CREATE OR REPLACE FUNCTION admin_stats()
RETURNS TABLE(
  total_vehicles BIGINT,
  pending_vehicles BIGINT,
  active_vehicles BIGINT,
  rejected_vehicles BIGINT,
  total_users BIGINT
) AS $$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM vehicules) AS total_vehicles,
    (SELECT COUNT(*) FROM vehicules WHERE status = 'pending') AS pending_vehicles,
    (SELECT COUNT(*) FROM vehicules WHERE status = 'active') AS active_vehicles,
    (SELECT COUNT(*) FROM vehicules WHERE status = 'rejected') AS rejected_vehicles,
    (SELECT COUNT(*) FROM profiles) AS total_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 5. CRÉER UN ADMIN PAR DÉFAUT
-- ========================================

-- ATTENTION : Créez d'abord un compte manuellement dans Supabase Dashboard > Authentication
-- Puis récupérez son UUID et exécutez :

-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE email = 'votre-email@exemple.com';

-- ========================================
-- 6. DONNÉES DE TEST (OPTIONNEL)
-- ========================================

-- Insérer un utilisateur de test (remplacez l'UUID par un vrai UUID d'un compte créé)
-- INSERT INTO profiles (id, email, full_name, role)
-- VALUES (
--   'VOTRE-USER-UUID-ICI',
--   'test@redzone.be',
--   'Test User',
--   'user'
-- );

-- Insérer un véhicule de test
-- INSERT INTO vehicules (
--   user_id, type, marque, modele, prix, annee, km, carburant,
--   transmission, carrosserie, puissance, etat, norme_euro, car_pass,
--   image, images, description, status,
--   architecture_moteur, admission, zero_a_cent, co2, poids_kg,
--   audio_file, history
-- ) VALUES (
--   'VOTRE-USER-UUID-ICI',
--   'car',
--   'Porsche',
--   '911 Carrera S',
--   145000,
--   2021,
--   12000,
--   'essence',
--   'manuelle',
--   'Coupé',
--   450,
--   'Occasion',
--   'euro6d',
--   true,
--   'https://images.unsplash.com/photo-1503376780353-7e6692767b70',
--   ARRAY['https://images.unsplash.com/photo-1503376780353-7e6692767b70'],
--   'Porsche 911 Carrera S (992) en excellent état. Entretien complet chez Porsche Center.',
--   'active',
--   'Flat-6',
--   'Turbo',
--   3.8,
--   205,
--   1430,
--   'https://cdn.example.com/audio/porsche-911.mp3',
--   ARRAY['Carnet complet', 'Factures', 'Non accidentée', 'Origine Belgique']
-- );

-- ========================================
-- ✅ MIGRATION TERMINÉE
-- ========================================

-- Vérifications :
SELECT 'Tables créées' AS status, COUNT(*) AS count FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Policies créées' AS status, COUNT(*) AS count FROM pg_policies WHERE schemaname = 'public';
SELECT 'Functions créées' AS status, COUNT(*) AS count FROM pg_proc WHERE pronamespace = 'public'::regnamespace;

-- Afficher toutes les tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

