-- ========================================
-- REDZONE - CORRECTION UPLOAD STORAGE POUR INVITÉS
-- ========================================
-- Ce script corrige les politiques RLS du storage pour permettre
-- aux invités (non connectés) d'uploader des images et audio
--
-- ⚠️ IMPORTANT : Le bucket utilisé est "files" (pas "vehicles")
-- ========================================

-- ========================================
-- 1. SUPPRIMER LES ANCIENNES POLITIQUES STORAGE
-- ========================================

-- Supprimer toutes les politiques existantes sur storage.objects pour le bucket "files"
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND (
            policyname LIKE '%files%' 
            OR policyname LIKE '%vehicle%'
            OR policyname LIKE '%image%'
            OR policyname LIKE '%upload%'
            OR policyname LIKE '%guest%'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
        RAISE NOTICE 'Politique supprimée: %', pol.policyname;
    END LOOP;
END $$;

-- ========================================
-- 2. POLITIQUES STORAGE POUR BUCKET "files"
-- ========================================

-- ✅ PUBLIC READ: Lecture publique de tous les fichiers
-- (Les images et audio doivent être accessibles publiquement)
CREATE POLICY "public_read_all_files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'files');

-- ✅ GUEST UPLOAD: Les invités peuvent uploader dans images/guest_* et audio/guest_*
CREATE POLICY "guest_upload_files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'files'
    AND auth.uid() IS NULL  -- Invité (non connecté)
    AND (
      -- Permettre upload dans images/guest_*
      name LIKE 'images/guest_%'
      OR
      -- Permettre upload dans audio/guest_*
      name LIKE 'audio/guest_%'
    )
  );

-- ✅ AUTH UPLOAD: Les utilisateurs connectés peuvent uploader dans leur dossier
CREATE POLICY "auth_upload_files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'files'
    AND auth.uid() IS NOT NULL  -- Utilisateur connecté
    AND (
      -- Le dossier doit correspondre à l'ID utilisateur ou être guest_*
      (storage.foldername(name))[1] = auth.uid()::text
      OR name LIKE 'images/guest_%'
      OR name LIKE 'audio/guest_%'
      OR name LIKE 'images/%'
      OR name LIKE 'audio/%'
    )
  );

-- ✅ USER UPDATE OWN: Les utilisateurs peuvent modifier leurs propres fichiers
CREATE POLICY "user_update_own_files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'files'
    AND (
      -- Le fichier est dans leur dossier
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- Ou c'est un fichier guest (pour permettre modification après création)
      name LIKE '%/guest_%'
    )
  )
  WITH CHECK (
    bucket_id = 'files'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR name LIKE '%/guest_%'
    )
  );

-- ✅ USER DELETE OWN: Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "user_delete_own_files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'files'
    AND (
      -- Le fichier est dans leur dossier
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- Ou c'est un fichier guest (pour permettre suppression après création)
      name LIKE '%/guest_%'
    )
  );

-- ✅ ADMIN MANAGE ALL: Les admins peuvent tout gérer
CREATE POLICY "admin_manage_all_files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'files'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'files'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ========================================
-- 3. VÉRIFICATION
-- ========================================

-- Afficher toutes les politiques créées
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'Pas de condition USING'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'Pas de condition WITH CHECK'
    END as with_check_clause
FROM pg_policies
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%files%'
ORDER BY policyname;

-- ========================================
-- ✅ CORRECTION TERMINÉE
-- ========================================
-- Les invités peuvent maintenant uploader dans :
--   - images/guest_*
--   - audio/guest_*
--
-- Les utilisateurs connectés peuvent uploader dans :
--   - images/{user_id}/*
--   - audio/{user_id}/*
--   - images/guest_* (pour compatibilité)
--   - audio/guest_* (pour compatibilité)
--
-- Tous les fichiers sont accessibles en lecture publique.
-- ========================================

