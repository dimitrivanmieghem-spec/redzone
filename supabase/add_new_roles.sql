-- ========================================
-- REDZONE - AJOUT DES NOUVEAUX RÔLES
-- ========================================
-- Script pour ajouter les rôles : support, editor, viewer
-- Ce script est idempotent : il peut être exécuté plusieurs fois sans erreur

DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

  -- Ajouter la nouvelle contrainte avec tous les rôles
  ALTER TABLE profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('particulier', 'pro', 'admin', 'moderator', 'support', 'editor', 'viewer'));

  RAISE NOTICE 'Contrainte de rôle mise à jour avec succès. Rôles disponibles : particulier, pro, admin, moderator, support, editor, viewer';
END
$$ LANGUAGE plpgsql;

-- Vérification
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'profiles_role_check'
AND table_name = 'profiles';

