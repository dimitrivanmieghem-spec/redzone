-- ========================================
-- REDZONE - SYSTÈME MEMBRES FONDATEURS (500 PREMIERS)
-- ========================================
-- Script pour implémenter le système des 500 premiers membres fondateurs
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase

-- ========================================
-- 1. AJOUTER LA COLONNE is_founder
-- ========================================

DO $$ 
BEGIN
  -- Ajouter la colonne is_founder si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_founder'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_founder BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Colonne is_founder ajoutée à la table profiles';
  ELSE
    RAISE NOTICE 'Colonne is_founder existe déjà';
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_is_founder ON profiles(is_founder) WHERE is_founder = TRUE;

-- ========================================
-- 2. FONCTION POUR ATTRIBUER AUTOMATIQUEMENT LE BADGE FONDATEUR
-- ========================================

CREATE OR REPLACE FUNCTION assign_founder_badge()
RETURNS TRIGGER AS $$
DECLARE
  founder_count INTEGER;
BEGIN
  -- Compter le nombre actuel de membres fondateurs
  SELECT COUNT(*) INTO founder_count
  FROM profiles
  WHERE is_founder = TRUE;
  
  -- Si moins de 500 membres fondateurs, attribuer le badge au nouvel utilisateur
  IF founder_count < 500 THEN
    UPDATE profiles
    SET is_founder = TRUE
    WHERE id = NEW.id;
    
    RAISE NOTICE 'Badge fondateur attribué à l''utilisateur % (Total: %)', NEW.id, founder_count + 1;
  ELSE
    RAISE NOTICE 'Limite de 500 membres fondateurs atteinte. Badge non attribué.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 3. TRIGGER POUR ATTRIBUER AUTOMATIQUEMENT
-- ========================================

DROP TRIGGER IF EXISTS on_profile_created_assign_founder ON profiles;
CREATE TRIGGER on_profile_created_assign_founder
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_founder_badge();

-- ========================================
-- 4. FONCTION POUR ATTRIBUER MANUELLEMENT (ADMIN)
-- ========================================

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

-- ========================================
-- 5. FONCTION POUR RETIRER LE BADGE (ADMIN)
-- ========================================

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

-- ========================================
-- 6. FONCTION POUR VÉRIFIER LE STATUT FONDATEUR
-- ========================================

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
-- 7. ATTRIBUER LE BADGE AUX UTILISATEURS EXISTANTS (SI < 500)
-- ========================================

-- Cette fonction attribue le badge aux 500 premiers utilisateurs (par date de création)
DO $$
DECLARE
  user_record RECORD;
  founder_count INTEGER := 0;
BEGIN
  -- Compter les membres fondateurs existants
  SELECT COUNT(*) INTO founder_count
  FROM profiles
  WHERE is_founder = TRUE;
  
  -- Si moins de 500, attribuer aux plus anciens utilisateurs
  IF founder_count < 500 THEN
    FOR user_record IN
      SELECT id, email, created_at
      FROM profiles
      WHERE is_founder = FALSE
      ORDER BY created_at ASC
      LIMIT (500 - founder_count)
    LOOP
      UPDATE profiles
      SET is_founder = TRUE
      WHERE id = user_record.id;
      
      founder_count := founder_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Badge fondateur attribué à % utilisateurs existants (Total: %)', (500 - (SELECT COUNT(*) FROM profiles WHERE is_founder = TRUE) + founder_count), founder_count;
  ELSE
    RAISE NOTICE 'Limite de 500 membres fondateurs déjà atteinte. Aucune attribution supplémentaire.';
  END IF;
END $$;

-- ========================================
-- 8. COMMENTAIRES POUR DOCUMENTATION
-- ========================================

COMMENT ON COLUMN profiles.is_founder IS 'Badge Membre Fondateur - Attribué automatiquement aux 500 premiers utilisateurs';
COMMENT ON FUNCTION assign_founder_badge() IS 'Attribue automatiquement le badge fondateur aux nouveaux utilisateurs (limite: 500)';
COMMENT ON FUNCTION manually_assign_founder(TEXT) IS 'Attribue manuellement le badge fondateur à un utilisateur (admin uniquement)';
COMMENT ON FUNCTION remove_founder_badge(TEXT) IS 'Retire le badge fondateur d''un utilisateur (admin uniquement)';
COMMENT ON FUNCTION check_founder_status(TEXT) IS 'Vérifie le statut fondateur d''un utilisateur et le nombre de places restantes';

-- ========================================
-- 9. EXEMPLES D'UTILISATION
-- ========================================

-- Vérifier le statut d'un utilisateur :
-- SELECT * FROM check_founder_status('email@exemple.com');

-- Attribuer manuellement le badge (admin) :
-- SELECT manually_assign_founder('email@exemple.com');

-- Retirer le badge (admin) :
-- SELECT remove_founder_badge('email@exemple.com');

-- Voir tous les membres fondateurs :
-- SELECT email, full_name, created_at, is_founder FROM profiles WHERE is_founder = TRUE ORDER BY created_at ASC;

-- Voir le nombre de places restantes :
-- SELECT 500 - COUNT(*) AS remaining_slots FROM profiles WHERE is_founder = TRUE;

