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
-- IMPORTANT: Exécutez cette section une seule fois après avoir créé la colonne is_founder
DO $$
DECLARE
  user_record RECORD;
  founder_count INTEGER := 0;
  total_profiles INTEGER := 0;
  users_to_assign INTEGER := 0;
BEGIN
  -- Compter le nombre total de profils
  SELECT COUNT(*) INTO total_profiles FROM profiles;
  
  -- Compter les membres fondateurs existants
  SELECT COUNT(*) INTO founder_count
  FROM profiles
  WHERE is_founder = TRUE;
  
  -- Si moins de 500 profils au total, tous les profils existants sont fondateurs
  IF total_profiles <= 500 THEN
    -- Attribuer le badge à tous les profils qui ne l'ont pas encore
    UPDATE profiles
    SET is_founder = TRUE
    WHERE is_founder = FALSE OR is_founder IS NULL;
    
    RAISE NOTICE 'Badge fondateur attribué à tous les % utilisateurs existants (dans les 500 premiers)', total_profiles;
  ELSIF founder_count < 500 THEN
    -- Il y a plus de 500 profils, mais moins de 500 fondateurs
    -- Attribuer le badge aux 500 premiers (par date de création)
    users_to_assign := 500 - founder_count;
    
    FOR user_record IN
      SELECT id, email, created_at
      FROM profiles
      WHERE is_founder = FALSE OR is_founder IS NULL
      ORDER BY created_at ASC
      LIMIT users_to_assign
    LOOP
      UPDATE profiles
      SET is_founder = TRUE
      WHERE id = user_record.id;
      
      founder_count := founder_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Badge fondateur attribué à % utilisateurs existants parmi les 500 premiers (Total fondateurs: %)', users_to_assign, founder_count;
  ELSE
    RAISE NOTICE 'Limite de 500 membres fondateurs déjà atteinte. Aucune attribution supplémentaire nécessaire.';
  END IF;
  
  -- S'assurer que les profils au-delà des 500 premiers n'ont pas le badge
  UPDATE profiles
  SET is_founder = FALSE
  WHERE id IN (
    SELECT id
    FROM profiles
    WHERE is_founder = TRUE
    ORDER BY created_at ASC
    OFFSET 500
  );
  
  RAISE NOTICE 'Vérification terminée: seuls les 500 premiers utilisateurs (par date de création) ont le badge fondateur.';
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

