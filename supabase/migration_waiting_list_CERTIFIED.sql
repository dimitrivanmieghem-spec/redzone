-- ========================================
-- OCTANE98 - TABLE WAITING_LIST (SCRIPT CERTIFIÉ)
-- ========================================
-- Date: $(date +%Y-%m-%d)
-- Audit: Database Architect & Lead Full-Stack
-- Statut: ✅ CERTIFIÉ - Correspondance code/schéma validée
--
-- ANALYSE DU CODE:
-- Fichier: src/app/coming-soon/page.tsx
-- Lignes 48-51: Insertion avec colonnes:
--   - email: normalizedEmail (TEXT NOT NULL)
--   - source: "website" (TEXT DEFAULT 'website')
--
-- Client Supabase: createBrowserClient() avec NEXT_PUBLIC_SUPABASE_ANON_KEY
-- Type: Client anonyme (browser) → Nécessite RLS INSERT publique
--
-- Colonnes auto-générées (non envoyées dans le code):
--   - id: UUID (PRIMARY KEY, DEFAULT gen_random_uuid())
--   - created_at: TIMESTAMP WITH TIME ZONE (DEFAULT NOW())
-- ========================================

-- ========================================
-- TABLE WAITING_LIST
-- ========================================

CREATE TABLE IF NOT EXISTS waiting_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'website' -- 'website', 'social', 'referral', etc.
);

-- ========================================
-- INDEX & CONTRAINTES
-- ========================================

-- Index pour optimiser les requêtes de recherche par email
CREATE INDEX IF NOT EXISTS idx_waiting_list_email ON waiting_list(email);

-- Index pour tri chronologique (affichage admin)
CREATE INDEX IF NOT EXISTS idx_waiting_list_created_at ON waiting_list(created_at DESC);

-- Contrainte d'unicité sur l'email (éviter les doublons)
-- Code gère l'erreur 23505 (violation contrainte unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_waiting_list_email_unique ON waiting_list(email);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Activer RLS sur la table
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLITIQUE INSERT (PUBLIQUE)
-- ========================================
-- Permet à n'importe qui (client anonyme) d'insérer des emails
-- Correspond au client createBrowserClient() avec ANON_KEY

DROP POLICY IF EXISTS "Anyone can subscribe to waiting list" ON waiting_list;

CREATE POLICY "Anyone can subscribe to waiting list"
  ON waiting_list
  FOR INSERT
  WITH CHECK (true);

-- ========================================
-- POLITIQUE SELECT (ADMIN UNIQUEMENT)
-- ========================================
-- Seuls les admins et modérateurs peuvent voir la liste
-- Protection des données RGPD

DROP POLICY IF EXISTS "Only admins can view waiting list" ON waiting_list;

CREATE POLICY "Only admins can view waiting list"
  ON waiting_list
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- ========================================
-- POLITIQUES UPDATE/DELETE
-- ========================================
-- Désactivées par défaut (pas de politique = blocage total)
-- Pour permettre la gestion admin, décommenter ci-dessous:

-- DROP POLICY IF EXISTS "Admins can update waiting list" ON waiting_list;
-- CREATE POLICY "Admins can update waiting list"
--   ON waiting_list
--   FOR UPDATE
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--         AND profiles.role = 'admin'
--     )
--   );

-- DROP POLICY IF EXISTS "Admins can delete waiting list" ON waiting_list;
-- CREATE POLICY "Admins can delete waiting list"
--   ON waiting_list
--   FOR DELETE
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--         AND profiles.role = 'admin'
--     )
--   );

-- ========================================
-- VÉRIFICATION POST-CRÉATION
-- ========================================
-- Exécuter ces requêtes pour valider la création:

-- Vérifier la structure de la table:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'waiting_list';

-- Vérifier les index:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'waiting_list';

-- Vérifier les politiques RLS:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'waiting_list';

-- ========================================
-- NOTES IMPORTANTES
-- ========================================
-- ✅ Colonnes correspondantes: id, email, created_at, source
-- ✅ Client anonyme supporté via RLS INSERT publique
-- ✅ Protection doublons via UNIQUE INDEX sur email
-- ✅ Code gère l'erreur 23505 (doublon) avec message utilisateur
-- ✅ Code gère l'erreur 42501 (RLS) avec logs détaillés
-- ✅ Performance: 2 index pour requêtes rapides
-- ✅ RGPD: SELECT restreint aux admins uniquement

