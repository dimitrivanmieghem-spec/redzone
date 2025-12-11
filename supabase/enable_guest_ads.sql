-- ========================================
-- REDZONE - MODE HYBRIDE : Annonces Invités
-- ========================================
-- Ce script permet aux utilisateurs non connectés de créer des annonces
-- Les annonces d'invités sont automatiquement en statut 'pending_validation'

-- ========================================
-- 1. MODIFIER LA TABLE VEHICULES
-- ========================================

-- Rendre user_id nullable (pour les invités)
ALTER TABLE vehicules 
  ALTER COLUMN user_id DROP NOT NULL;

-- Ajouter colonne guest_email (pour les invités)
ALTER TABLE vehicules 
  ADD COLUMN IF NOT EXISTS guest_email TEXT;

-- Ajouter contrainte : soit user_id soit guest_email doit être présent
ALTER TABLE vehicules 
  ADD CONSTRAINT check_user_or_guest 
  CHECK (
    (user_id IS NOT NULL) OR (guest_email IS NOT NULL)
  );

-- Modifier le statut par défaut pour inclure 'pending_validation'
ALTER TABLE vehicules 
  DROP CONSTRAINT IF EXISTS vehicules_status_check;

ALTER TABLE vehicules 
  ADD CONSTRAINT vehicules_status_check 
  CHECK (status IN ('pending', 'pending_validation', 'active', 'rejected'));

-- Mettre à jour le statut par défaut (sera géré par RLS)
-- Les invités auront automatiquement 'pending_validation'

-- ========================================
-- 2. MODIFIER LES POLITIQUES RLS
-- ========================================

-- Supprimer l'ancienne politique INSERT qui nécessite auth
DROP POLICY IF EXISTS "Authenticated users can insert vehicles" ON vehicules;

-- Nouvelle politique : Permettre INSERT aux utilisateurs connectés
CREATE POLICY "Authenticated users can insert vehicles"
  ON vehicules FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND user_id IS NOT NULL
  );

-- Nouvelle politique : Permettre INSERT aux utilisateurs anonymes (invités)
-- MAIS forcer le statut à 'pending_validation' pour éviter le spam
CREATE POLICY "Anonymous users can insert vehicles as guests"
  ON vehicules FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL 
    AND user_id IS NULL 
    AND guest_email IS NOT NULL
    AND status = 'pending_validation'  -- ⚠️ CRITIQUE : Force le statut
  );

-- Modifier la politique SELECT pour permettre aux invités de voir leurs propres annonces
-- (via guest_email, mais nécessite une fonction helper ou une autre approche)
-- Pour l'instant, seuls les admins peuvent voir les annonces pending_validation

-- Politique UPDATE : Les utilisateurs connectés peuvent modifier leurs annonces pending
DROP POLICY IF EXISTS "Users can update own pending vehicles" ON vehicules;
CREATE POLICY "Users can update own pending vehicles"
  ON vehicules FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND status IN ('pending', 'pending_validation')
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND status IN ('pending', 'pending_validation')
  );

-- Les invités ne peuvent PAS modifier leurs annonces (sécurité)
-- Seuls les admins peuvent modifier les annonces pending_validation

-- ========================================
-- 3. INDEX POUR PERFORMANCES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_vehicules_guest_email ON vehicules(guest_email);
CREATE INDEX IF NOT EXISTS idx_vehicules_status_validation ON vehicules(status) WHERE status = 'pending_validation';

-- ========================================
-- 4. FONCTION HELPER (OPTIONNEL)
-- ========================================

-- Fonction pour vérifier qu'un invité peut voir son annonce
-- (nécessiterait de passer l'email en paramètre, complexe avec RLS)
-- Pour l'instant, seuls les admins voient les annonces pending_validation

-- ========================================
-- 5. VÉRIFICATION
-- ========================================

-- Vérifier les contraintes
SELECT 
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'vehicules'
  AND column_name IN ('user_id', 'guest_email', 'status')
ORDER BY column_name;

-- Vérifier les politiques
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'vehicules'
  AND cmd = 'INSERT'
ORDER BY policyname;

-- ========================================
-- ✅ MODIFICATIONS APPLIQUÉES
-- ========================================
-- Les utilisateurs anonymes peuvent maintenant créer des annonces
-- Le statut sera automatiquement 'pending_validation'
-- Seuls les admins peuvent voir/modifier ces annonces

