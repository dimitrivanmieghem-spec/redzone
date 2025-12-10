-- ========================================
-- REDZONE - CORRECTIFS DE SÉCURITÉ
-- ========================================
-- Script pour corriger les failles de sécurité identifiées
-- Exécutez ce script dans Supabase SQL Editor

-- ========================================
-- 1. CORRECTION STORAGE BUCKET (CRITIQUE)
-- ========================================

-- Supprimer la politique trop permissive
DROP POLICY IF EXISTS "Anyone can view files" ON storage.objects;

-- Nouvelle politique : Seuls les fichiers du propriétaire sont accessibles
CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'files' 
    AND (
      -- Le propriétaire peut voir ses fichiers
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- Les admins peuvent voir tous les fichiers
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
      )
    )
  );

-- Politique pour les fichiers publics (images de véhicules actifs uniquement)
-- Note: Cette politique permet de voir les images des véhicules actifs
-- mais nécessite que le nom du fichier contienne l'ID du véhicule
CREATE POLICY "Public can view active vehicle images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'files'
    AND name LIKE '%/vehicules/%'
    -- Vérifier que le véhicule associé est actif
    AND EXISTS (
      SELECT 1 FROM vehicules
      WHERE vehicules.images::text LIKE '%' || storage.objects.name || '%'
      AND vehicules.status = 'active'
    )
  );

-- ========================================
-- 2. RESTREINDRE UPDATE AUX VÉHICULES PENDING (MOYEN)
-- ========================================

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicules;

-- Nouvelle politique : Les utilisateurs ne peuvent modifier que leurs véhicules EN ATTENTE
CREATE POLICY "Users can update own pending vehicles"
  ON vehicules FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND status = 'pending'  -- ⚠️ IMPORTANT : Seulement les véhicules en attente
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND status = 'pending'  -- Empêcher de changer le statut
  );

-- Les admins peuvent toujours tout modifier (politique existante conservée)

-- ========================================
-- 3. AJOUTER PROTECTION CONTRE MODIFICATION DU STATUT (BONUS)
-- ========================================

-- Fonction pour empêcher les utilisateurs non-admin de modifier le statut
CREATE OR REPLACE FUNCTION prevent_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut change et que l'utilisateur n'est pas admin
  IF OLD.status != NEW.status THEN
    IF NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Seuls les administrateurs peuvent modifier le statut d''un véhicule';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS check_status_change ON vehicules;
CREATE TRIGGER check_status_change
  BEFORE UPDATE ON vehicules
  FOR EACH ROW
  EXECUTE FUNCTION prevent_status_change();

-- ========================================
-- 4. VÉRIFICATION DES POLITIQUES
-- ========================================

-- Afficher toutes les politiques RLS pour vérification
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('vehicules', 'storage.objects')
ORDER BY tablename, policyname;

