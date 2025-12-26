-- OCTANE98 - FIX TRIGGER PROFILES
-- Script pour corriger le trigger handle_new_user() qui crée automatiquement un profil
-- Problème : Le trigger peut échouer silencieusement si l'email est NULL ou si une contrainte échoue

-- ========================================
-- 1. AMÉLIORER LA FONCTION handle_new_user()
-- ========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que l'email n'est pas NULL
  IF NEW.email IS NULL THEN
    RAISE WARNING 'Email is NULL for user %', NEW.id;
    -- Ne pas bloquer la création de l'utilisateur auth, mais logger l'erreur
    RETURN NEW;
  END IF;

  -- Insérer le profil avec gestion d'erreur et ON CONFLICT
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'fullName',
      NEW.email
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::TEXT,
      'particulier'
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role);
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Logger l'erreur mais ne pas bloquer la création de l'utilisateur auth
    RAISE WARNING 'Erreur lors de la création du profil pour %: %', NEW.email, SQLERRM;
    -- Retourner NEW pour ne pas bloquer l'insertion dans auth.users
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 2. VÉRIFIER QUE LE TRIGGER EXISTE
-- ========================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 3. COMMENTAIRES
-- ========================================

COMMENT ON FUNCTION public.handle_new_user() IS 
'Crée automatiquement un profil dans public.profiles lors de la création d''un utilisateur dans auth.users. 
Gère les erreurs gracieusement pour ne pas bloquer la création de l''utilisateur auth.';

-- ========================================
-- 4. VÉRIFICATION
-- ========================================

DO $$
BEGIN
  RAISE NOTICE 'OCTANE98 - FIX TRIGGER PROFILES COMPLÉTÉ';
  RAISE NOTICE 'Le trigger handle_new_user() a été amélioré pour gérer les erreurs.';
END $$;

