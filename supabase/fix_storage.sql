-- ========================================
-- REDZONE - FIX STORAGE BUCKET
-- ========================================
-- Script SQL idempotent pour configurer le bucket de stockage 'vehicles'
-- Crée le bucket et définit les politiques RLS pour les images de véhicules
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- ========================================

-- ========================================
-- 1. CRÉATION DU BUCKET 'vehicles'
-- ========================================
-- Note: La création de bucket via SQL n'est pas toujours possible dans Supabase
-- Si le bucket n'existe pas après exécution, créez-le manuellement :
-- Dashboard > Storage > New bucket > Nom: "vehicles" > Public: true

-- Tenter de créer le bucket via l'extension storage (si disponible)
DO $$ 
BEGIN
  -- Vérifier si le bucket existe déjà
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'vehicles'
  ) THEN
    -- Tenter de créer le bucket
    -- Note: Cette opération peut échouer si l'extension storage n'est pas configurée
    -- Dans ce cas, créez le bucket manuellement dans le Dashboard
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'vehicles',
      'vehicles',
      true, -- Bucket public (lecture publique)
      10485760, -- Limite de taille : 10MB (10 * 1024 * 1024)
      ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'] -- Types MIME autorisés
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Bucket vehicles créé';
  ELSE
    RAISE NOTICE 'Bucket vehicles existe déjà';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Impossible de créer le bucket via SQL. Créez-le manuellement dans Dashboard > Storage > New bucket (Nom: vehicles, Public: true)';
END $$;

-- ========================================
-- 2. POLITIQUES RLS POUR LE BUCKET 'vehicles'
-- ========================================

-- Supprimer les anciennes politiques si elles existent (pour éviter les conflits)
DROP POLICY IF EXISTS "Anyone can view vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own vehicle images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all vehicle images" ON storage.objects;

-- ========================================
-- 2.1. POLITIQUE DE LECTURE (SELECT) - Publique
-- ========================================
-- Tout le monde peut voir les photos des véhicules (nécessaire pour l'affichage public)

CREATE POLICY "Public can view vehicle images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'vehicles');

-- Commentaire pour documentation
COMMENT ON POLICY "Public can view vehicle images" ON storage.objects IS 
  'Permet la lecture publique des images de véhicules dans le bucket vehicles';

-- ========================================
-- 2.2. POLITIQUE D'ÉCRITURE (INSERT) - Authentifiée
-- ========================================
-- Seuls les utilisateurs connectés peuvent uploader des images

CREATE POLICY "Authenticated users can upload vehicle images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'vehicles'
    AND auth.role() = 'authenticated'
  );

-- Commentaire pour documentation
COMMENT ON POLICY "Authenticated users can upload vehicle images" ON storage.objects IS 
  'Permet aux utilisateurs authentifiés d''uploader des images dans le bucket vehicles';

-- ========================================
-- 2.3. POLITIQUE DE MODIFICATION (UPDATE) - Authentifiée
-- ========================================
-- Les utilisateurs peuvent modifier leurs propres images
-- Structure attendue : vehicles/{userId}/{filename} ou vehicles/{vehicleId}/{filename}

CREATE POLICY "Users can update own vehicle images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'vehicles'
    AND (
      -- Vérifier si le fichier appartient à l'utilisateur (format: vehicles/{userId}/...)
      auth.uid()::text = (string_to_array(name, '/'))[2]
      OR
      -- Vérifier si le fichier appartient à un véhicule de l'utilisateur (format: vehicles/{vehicleId}/...)
      EXISTS (
        SELECT 1 FROM vehicles
        WHERE vehicles.owner_id = auth.uid()
        AND vehicles.id::text = (string_to_array(name, '/'))[2]
      )
      OR
      -- Admins peuvent modifier toutes les images
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  )
  WITH CHECK (
    bucket_id = 'vehicles'
    AND (
      auth.uid()::text = (string_to_array(name, '/'))[2]
      OR
      EXISTS (
        SELECT 1 FROM vehicles
        WHERE vehicles.owner_id = auth.uid()
        AND vehicles.id::text = (string_to_array(name, '/'))[2]
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

-- Commentaire pour documentation
COMMENT ON POLICY "Users can update own vehicle images" ON storage.objects IS 
  'Permet aux utilisateurs de modifier leurs propres images (format: vehicles/{userId}/... ou vehicles/{vehicleId}/...)';

-- ========================================
-- 2.4. POLITIQUE DE SUPPRESSION (DELETE) - Authentifiée
-- ========================================
-- Les utilisateurs peuvent supprimer leurs propres images

CREATE POLICY "Users can delete own vehicle images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'vehicles'
    AND (
      -- Vérifier si le fichier appartient à l'utilisateur (format: vehicles/{userId}/...)
      auth.uid()::text = (string_to_array(name, '/'))[2]
      OR
      -- Vérifier si le fichier appartient à un véhicule de l'utilisateur (format: vehicles/{vehicleId}/...)
      EXISTS (
        SELECT 1 FROM vehicles
        WHERE vehicles.owner_id = auth.uid()
        AND vehicles.id::text = (string_to_array(name, '/'))[2]
      )
      OR
      -- Admins peuvent supprimer toutes les images
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

-- Commentaire pour documentation
COMMENT ON POLICY "Users can delete own vehicle images" ON storage.objects IS 
  'Permet aux utilisateurs de supprimer leurs propres images (format: vehicles/{userId}/... ou vehicles/{vehicleId}/...)';

-- ========================================
-- 2.5. POLITIQUE ADMIN (Gestion complète)
-- ========================================
-- Les admins peuvent gérer toutes les images (optionnel, pour faciliter la modération)

CREATE POLICY "Admins can manage all vehicle images"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'vehicles'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'vehicles'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Commentaire pour documentation
COMMENT ON POLICY "Admins can manage all vehicle images" ON storage.objects IS 
  'Permet aux admins de gérer toutes les images du bucket vehicles';

-- ========================================
-- 3. VÉRIFICATION FINALE
-- ========================================

DO $$ 
DECLARE
  bucket_exists BOOLEAN;
  policies_count INTEGER;
BEGIN
  -- Vérifier si le bucket existe
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'vehicles'
  ) INTO bucket_exists;
  
  -- Compter les politiques créées
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies
  WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%vehicle%';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REDZONE - FIX STORAGE COMPLÉTÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Bucket vehicles : %', CASE WHEN bucket_exists THEN 'CRÉÉ' ELSE 'MANQUANT (créez-le manuellement)' END;
  RAISE NOTICE '✅ Politiques RLS créées : %', policies_count;
  RAISE NOTICE '✅ Lecture publique activée';
  RAISE NOTICE '✅ Écriture authentifiée activée';
  RAISE NOTICE '✅ Modification/Suppression utilisateur activée';
  RAISE NOTICE '✅ Gestion admin activée';
  RAISE NOTICE '========================================';
  
  IF NOT bucket_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ ACTION REQUISE :';
    RAISE NOTICE '   1. Allez dans Dashboard > Storage';
    RAISE NOTICE '   2. Cliquez sur "New bucket"';
    RAISE NOTICE '   3. Nom : "vehicles"';
    RAISE NOTICE '   4. Public : ✅ Coché';
    RAISE NOTICE '   5. Cliquez sur "Create"';
    RAISE NOTICE '';
  END IF;
END $$;

