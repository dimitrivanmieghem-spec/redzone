-- ========================================
-- REDZONE - FIX POLITIQUES SITE_SETTINGS
-- ========================================
-- Script minimal pour supprimer les politiques existantes
-- Exécutez ce script AVANT d'exécuter admin_fix.sql

-- Supprimer TOUTES les politiques existantes pour site_settings
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  -- Supprimer toutes les politiques existantes pour site_settings de manière dynamique
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'site_settings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON site_settings', pol.policyname);
    RAISE NOTICE 'Politique supprimée: %', pol.policyname;
  END LOOP;
END $$;

-- Vérification : Afficher les politiques restantes (devrait être vide)
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'site_settings';

