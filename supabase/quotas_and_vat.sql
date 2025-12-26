-- ========================================
-- REDZONE - QUOTAS & CHAMPS BUSINESS
-- ========================================
-- 📅 Date: Décembre 2025
-- 📋 Version: 1.0
-- 
-- ⚠️ IMPORTANT: Ce script est IDEMPOTENT (peut être exécuté plusieurs fois sans erreur)
-- 
-- 🎯 Objectifs:
-- 1. Ajouter les champs business (vat_number, bce_number) à profiles
-- 2. Créer un trigger pour définir automatiquement is_founder pour les 500 premiers
-- 3. Créer une fonction de vérification de quota pour les annonces
--
-- ========================================

-- ========================================
-- 1. AJOUT DES COLONNES BUSINESS
-- ========================================

-- Ajouter vat_number (Numéro de TVA belge)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'vat_number'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN vat_number TEXT;
    
    COMMENT ON COLUMN public.profiles.vat_number IS 'Numéro de TVA belge (format: BE0123456789)';
  END IF;
END $$;

-- Ajouter bce_number (Numéro BCE - Banque-Carrefour des Entreprises)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'bce_number'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN bce_number TEXT;
    
    COMMENT ON COLUMN public.profiles.bce_number IS 'Numéro BCE (Banque-Carrefour des Entreprises) - Optionnel';
  END IF;
END $$;

-- Créer des index pour les recherches sur les numéros business
CREATE INDEX IF NOT EXISTS idx_profiles_vat_number 
ON public.profiles(vat_number) 
WHERE vat_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_bce_number 
ON public.profiles(bce_number) 
WHERE bce_number IS NOT NULL;

-- ========================================
-- 2. TRIGGER "PIONNIER" (EARLY ADOPTER)
-- ========================================
-- Note: Le champ is_founder existe déjà dans profiles (BOOLEAN DEFAULT FALSE)
-- Ce trigger définit automatiquement is_founder = TRUE pour les 500 premiers utilisateurs

-- Fonction pour définir is_founder lors de l'insertion
CREATE OR REPLACE FUNCTION public.set_founder_on_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  founder_count INTEGER;
BEGIN
  -- Compter le nombre de membres fondateurs existants
  SELECT COUNT(*) INTO founder_count
  FROM public.profiles
  WHERE is_founder = TRUE;
  
  -- Si moins de 500 membres fondateurs, définir le nouvel utilisateur comme fondateur
  IF founder_count < 500 THEN
    NEW.is_founder = TRUE;
    
    -- Log optionnel (décommenter si vous avez une table de logs)
    -- INSERT INTO app_logs (level, message, metadata)
    -- VALUES ('info', 'Nouveau membre fondateur créé', jsonb_build_object('user_id', NEW.id, 'founder_count', founder_count + 1));
  END IF;
  
  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe déjà (pour idempotence)
DROP TRIGGER IF EXISTS trigger_set_founder_on_registration ON public.profiles;

-- Créer le trigger BEFORE INSERT
CREATE TRIGGER trigger_set_founder_on_registration
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_founder_on_registration();

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.set_founder_on_registration() IS 
'Définit automatiquement is_founder = TRUE pour les 500 premiers utilisateurs inscrits';

-- ========================================
-- 3. FONCTION DE VÉRIFICATION DES QUOTAS
-- ========================================
-- Fonction pour vérifier si un utilisateur peut créer une nouvelle annonce
-- selon son rôle et son statut de membre fondateur

CREATE OR REPLACE FUNCTION public.can_create_advert(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_profile RECORD;
  active_vehicles_count INTEGER;
  max_vehicles_limit INTEGER;
BEGIN
  -- Récupérer le profil utilisateur
  SELECT role, is_founder INTO user_profile
  FROM public.profiles
  WHERE id = user_id;
  
  -- Si l'utilisateur n'existe pas, retourner FALSE
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Les admins ont un accès illimité
  IF user_profile.role = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  -- Les membres fondateurs ont un accès illimité (pour récompenser les early adopters)
  IF user_profile.is_founder = TRUE THEN
    RETURN TRUE;
  END IF;
  
  -- Compter les annonces actives de l'utilisateur
  -- Note: On compte uniquement les annonces avec status = 'active'
  SELECT COUNT(*) INTO active_vehicles_count
  FROM public.vehicles
  WHERE owner_id = user_id
  AND status = 'active';
  
  -- Définir la limite selon le rôle
  CASE user_profile.role
    WHEN 'pro' THEN
      max_vehicles_limit := 50;  -- Professionnels: 50 annonces max
    WHEN 'particulier' THEN
      max_vehicles_limit := 3;   -- Particuliers: 3 annonces max
    ELSE
      -- Pour les autres rôles (moderator, support, editor, viewer), utiliser la limite particulière
      max_vehicles_limit := 3;
  END CASE;
  
  -- Retourner TRUE si le nombre d'annonces actives est inférieur à la limite
  RETURN active_vehicles_count < max_vehicles_limit;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.can_create_advert(UUID) IS 
'Vérifie si un utilisateur peut créer une nouvelle annonce selon son quota.
Règles:
- Admin: Illimité
- Membre Fondateur (is_founder = TRUE): Illimité
- Pro: 50 annonces actives max
- Particulier: 3 annonces actives max
- Autres rôles: 3 annonces actives max';

-- ========================================
-- 4. FONCTION UTILITAIRE: GET_USER_QUOTA_INFO
-- ========================================
-- Fonction helper pour récupérer les informations de quota d'un utilisateur
-- Utile pour l'affichage dans l'interface utilisateur

CREATE OR REPLACE FUNCTION public.get_user_quota_info(user_id UUID)
RETURNS TABLE(
  can_create BOOLEAN,
  current_count INTEGER,
  max_limit INTEGER,
  role TEXT,
  is_founder BOOLEAN,
  remaining_slots INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_profile RECORD;
  active_count INTEGER;
  max_limit INTEGER;
  remaining INTEGER;
BEGIN
  -- Récupérer le profil utilisateur
  SELECT role, is_founder INTO user_profile
  FROM public.profiles
  WHERE id = user_id;
  
  -- Si l'utilisateur n'existe pas, retourner des valeurs par défaut
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 0, 'unknown'::TEXT, FALSE, 0;
    RETURN;
  END IF;
  
  -- Compter les annonces actives
  SELECT COUNT(*) INTO active_count
  FROM public.vehicles
  WHERE owner_id = user_id
  AND status = 'active';
  
  -- Définir la limite selon le rôle
  IF user_profile.role = 'admin' OR user_profile.is_founder = TRUE THEN
    max_limit := 999999;  -- Illimité (représenté par un grand nombre)
  ELSIF user_profile.role = 'pro' THEN
    max_limit := 50;
  ELSE
    max_limit := 3;
  END IF;
  
  -- Calculer les slots restants
  IF max_limit = 999999 THEN
    remaining := 999999;  -- Illimité
  ELSE
    remaining := GREATEST(0, max_limit - active_count);
  END IF;
  
  -- Retourner les informations
  RETURN QUERY SELECT
    (active_count < max_limit OR max_limit = 999999) AS can_create,
    active_count AS current_count,
    max_limit AS max_limit,
    user_profile.role AS role,
    user_profile.is_founder AS is_founder,
    remaining AS remaining_slots;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.get_user_quota_info(UUID) IS 
'Retourne les informations de quota d''un utilisateur pour l''affichage dans l''interface.
Retourne: can_create, current_count, max_limit, role, is_founder, remaining_slots';

-- ========================================
-- 5. VÉRIFICATIONS POST-INSTALLATION
-- ========================================

-- Vérifier que les colonnes ont été ajoutées
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'vat_number'
  ) THEN
    RAISE EXCEPTION 'La colonne vat_number n''a pas été créée';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'bce_number'
  ) THEN
    RAISE EXCEPTION 'La colonne bce_number n''a pas été créée';
  END IF;
END $$;

-- Vérifier que le trigger existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'trigger_set_founder_on_registration'
  ) THEN
    RAISE EXCEPTION 'Le trigger trigger_set_founder_on_registration n''a pas été créé';
  END IF;
END $$;

-- Vérifier que les fonctions existent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'can_create_advert'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE EXCEPTION 'La fonction can_create_advert n''a pas été créée';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'get_user_quota_info'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    RAISE EXCEPTION 'La fonction get_user_quota_info n''a pas été créée';
  END IF;
END $$;

-- ========================================
-- 6. GRANT PERMISSIONS (si nécessaire)
-- ========================================
-- S'assurer que les fonctions sont accessibles aux utilisateurs authentifiés

-- Grant sur can_create_advert
GRANT EXECUTE ON FUNCTION public.can_create_advert(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_create_advert(UUID) TO anon;

-- Grant sur get_user_quota_info
GRANT EXECUTE ON FUNCTION public.get_user_quota_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_quota_info(UUID) TO anon;

-- ========================================
-- 7. NOTES D'UTILISATION
-- ========================================
-- 
-- UTILISATION DE can_create_advert():
-- 
--   SELECT public.can_create_advert(auth.uid());
-- 
-- UTILISATION DE get_user_quota_info():
-- 
--   SELECT * FROM public.get_user_quota_info(auth.uid());
-- 
-- VÉRIFICATION DU NOMBRE DE MEMBRES FONDATEURS:
-- 
--   SELECT COUNT(*) FROM public.profiles WHERE is_founder = TRUE;
-- 
-- ========================================
-- FIN DU SCRIPT
-- ========================================

