-- ========================================
-- REDZONE - CORRECTION RLS POUR INSERT VEHICULES
-- ========================================
-- Ce script corrige les politiques RLS pour permettre l'insertion
-- de véhicules par les utilisateurs connectés et les invités
--
-- Exécutez ce script dans Supabase SQL Editor

-- ========================================
-- 1. SUPPRIMER LES ANCIENNES POLITIQUES INSERT
-- ========================================
DROP POLICY IF EXISTS "Authenticated users can insert vehicles" ON vehicules;
DROP POLICY IF EXISTS "Anonymous users can insert vehicles as guests" ON vehicules;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicules;
DROP POLICY IF EXISTS "Guests can insert vehicles" ON vehicules;

-- ========================================
-- 2. POLITIQUE POUR UTILISATEURS CONNECTÉS
-- ========================================
-- Les utilisateurs connectés peuvent insérer leurs propres véhicules
-- avec le statut 'pending'
CREATE POLICY "Authenticated users can insert vehicles"
  ON vehicules FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id 
    AND user_id IS NOT NULL
    AND guest_email IS NULL
    AND status = 'pending'
  );

-- ========================================
-- 3. POLITIQUE POUR INVITÉS (ANONYMES)
-- ========================================
-- Les utilisateurs anonymes peuvent insérer des véhicules
-- avec le statut 'pending_validation' (exigé pour sécurité)
CREATE POLICY "Anonymous users can insert vehicles as guests"
  ON vehicules FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL
    AND user_id IS NULL 
    AND guest_email IS NOT NULL
    AND status = 'pending_validation'
  );

-- ========================================
-- 4. POLITIQUE SELECT POUR PERMETTRE LA LECTURE APRÈS INSERT
-- ========================================
-- Permettre aux invités de lire le véhicule qu'ils viennent d'insérer
-- (nécessaire pour le .select("id") après INSERT)
-- Note: Cette politique permet de lire uniquement les véhicules pending_validation
-- créés par des invités (via guest_email, mais on ne peut pas vérifier l'email en RLS)
-- Pour l'instant, on permet la lecture de tous les véhicules pending_validation
-- car seuls les admins peuvent les voir normalement
DROP POLICY IF EXISTS "Guests can read own pending vehicles" ON vehicules;

-- Alternative: Permettre la lecture de tous les véhicules pending_validation
-- (les admins peuvent déjà les voir, et les invités ont besoin de voir leur propre insertion)
-- Cette politique est permissive mais nécessaire pour le fonctionnement
CREATE POLICY "Anyone can read pending_validation vehicles"
  ON vehicules FOR SELECT
  USING (status = 'pending_validation');

-- ========================================
-- 5. VÉRIFICATION DES POLITIQUES
-- ========================================
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'vehicules'
  AND cmd IN ('INSERT', 'SELECT')
ORDER BY cmd, policyname;

