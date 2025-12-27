-- =========================================
-- TRIGGER AUTOMATIQUE DE CRÉATION DE PROFILS
-- =========================================
-- Ce script garantit que tout nouvel utilisateur dans auth.users
-- aura automatiquement une entrée dans public.profiles
--
-- À exécuter dans le SQL Editor de Supabase
-- =========================================

-- 1. Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Créer la fonction qui sera appelée par le trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer automatiquement un profil pour le nouvel utilisateur
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_founder,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    -- Utiliser full_name depuis user_metadata, ou extraire depuis l'email
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    -- Rôle par défaut (sera 'admin' si c'est un compte admin)
    CASE
      WHEN NEW.email = 'admin@octane98.be' THEN 'admin'::public.user_role
      ELSE 'particulier'::public.user_role
    END,
    -- is_founder depuis user_metadata
    COALESCE(
      (NEW.raw_user_meta_data->>'is_founder')::boolean,
      (NEW.raw_user_meta_data->>'isFounder')::boolean,
      false
    ),
    NOW(),
    NOW()
  );

  -- Log de création pour debugging
  RAISE LOG 'Profil créé automatiquement pour utilisateur: % (%)', NEW.email, NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer le trigger qui appelle la fonction après chaque INSERT dans auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Vérification : Créer les profils manquants pour les utilisateurs existants
-- (Utile si des utilisateurs existent déjà sans profil)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  is_founder,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ) as full_name,
  CASE
    WHEN u.email = 'admin@octane98.be' THEN 'admin'::public.user_role
    ELSE 'particulier'::public.user_role
  END as role,
  COALESCE(
    (u.raw_user_meta_data->>'is_founder')::boolean,
    (u.raw_user_meta_data->>'isFounder')::boolean,
    false
  ) as is_founder,
  u.created_at,
  u.updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL; -- Uniquement les utilisateurs sans profil

-- 5. Message de confirmation
DO $$
DECLARE
  profiles_created INTEGER;
BEGIN
  SELECT COUNT(*) INTO profiles_created
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id;

  RAISE NOTICE '✅ Trigger configuré avec succès ! Profils actifs: %', profiles_created;
  RAISE NOTICE '✅ Tout nouvel utilisateur aura automatiquement un profil créé.';
END $$;

-- =========================================
-- INSTRUCTIONS D'UTILISATION
-- =========================================
--
-- 1. Copiez ce script complet
-- 2. Allez dans Supabase Dashboard > SQL Editor
-- 3. Collez et exécutez le script
-- 4. Vérifiez que les profils manquants ont été créés automatiquement
--
-- Vérification :
-- SELECT COUNT(*) FROM auth.users; -- Nombre total d'utilisateurs
-- SELECT COUNT(*) FROM public.profiles; -- Nombre de profils (doit être égal)
-- =========================================
