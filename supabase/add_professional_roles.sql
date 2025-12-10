-- ========================================
-- REDZONE - AJOUT DES RÔLES PARTICULIER/PRO
-- ========================================
-- Ce script étend la table profiles pour supporter les rôles 'particulier' et 'pro'
-- Copiez-collez ce script dans le SQL Editor de Supabase

-- ========================================
-- 1. MODIFIER LA CONTRAINTE DE RÔLE
-- ========================================
-- Supprimer l'ancienne contrainte
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Ajouter la nouvelle contrainte avec 'particulier' et 'pro'
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('particulier', 'pro', 'admin'));

-- ========================================
-- 2. METTRE À JOUR LES UTILISATEURS EXISTANTS
-- ========================================
-- Les utilisateurs existants avec role='user' deviennent 'particulier' par défaut
UPDATE profiles 
SET role = 'particulier' 
WHERE role = 'user' OR role IS NULL;

-- ========================================
-- 3. MODIFIER LE TRIGGER DE CRÉATION AUTO
-- ========================================
-- Mettre à jour la fonction pour utiliser 'particulier' par défaut
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'particulier') -- Rôle depuis metadata ou 'particulier' par défaut
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. VÉRIFICATION
-- ========================================
SELECT 
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY role;

-- Afficher la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'role'
ORDER BY ordinal_position;

