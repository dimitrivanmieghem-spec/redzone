-- ========================================
-- REDZONE - ALERTES DE RECHERCHE
-- ========================================
-- 📅 Date: Décembre 2025
-- 📋 Version: 1.0
-- 
-- ⚠️ IMPORTANT: Ce script est IDEMPOTENT (peut être exécuté plusieurs fois sans erreur)
-- 
-- 🎯 Objectif: Permettre aux utilisateurs de sauvegarder leurs critères de recherche
-- pour être notifiés par email des nouvelles annonces correspondantes
--
-- ========================================

-- ========================================
-- 1. TABLE SEARCH_ALERTS
-- ========================================

CREATE TABLE IF NOT EXISTS public.search_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_search_alerts_user_id ON public.search_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_search_alerts_is_active ON public.search_alerts(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_search_alerts_created_at ON public.search_alerts(created_at DESC);

-- Index GIN pour les recherches dans le JSONB criteria
CREATE INDEX IF NOT EXISTS idx_search_alerts_criteria_gin ON public.search_alerts USING GIN (criteria);

-- Commentaire sur la table
COMMENT ON TABLE public.search_alerts IS 'Alertes de recherche sauvegardées par les utilisateurs pour être notifiés des nouvelles annonces';

-- Commentaires sur les colonnes
COMMENT ON COLUMN public.search_alerts.id IS 'Identifiant unique de l''alerte';
COMMENT ON COLUMN public.search_alerts.user_id IS 'ID de l''utilisateur propriétaire de l''alerte';
COMMENT ON COLUMN public.search_alerts.criteria IS 'Critères de recherche au format JSONB (marque, modèle, prix min/max, année, etc.)';
COMMENT ON COLUMN public.search_alerts.is_active IS 'Indique si l''alerte est active (true) ou désactivée (false)';
COMMENT ON COLUMN public.search_alerts.created_at IS 'Date de création de l''alerte';
COMMENT ON COLUMN public.search_alerts.updated_at IS 'Date de dernière mise à jour de l''alerte';

-- ========================================
-- 2. TRIGGER POUR UPDATED_AT
-- ========================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_search_alerts_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Supprimer le trigger s'il existe déjà (pour idempotence)
DROP TRIGGER IF EXISTS trigger_update_search_alerts_updated_at ON public.search_alerts;

-- Créer le trigger
CREATE TRIGGER trigger_update_search_alerts_updated_at
  BEFORE UPDATE ON public.search_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_search_alerts_updated_at();

-- ========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Activer RLS
ALTER TABLE public.search_alerts ENABLE ROW LEVEL SECURITY;

-- Policy : Les utilisateurs peuvent voir uniquement leurs propres alertes
DROP POLICY IF EXISTS "Users can view own search alerts" ON public.search_alerts;
CREATE POLICY "Users can view own search alerts"
  ON public.search_alerts FOR SELECT
  USING (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent créer leurs propres alertes
DROP POLICY IF EXISTS "Users can create own search alerts" ON public.search_alerts;
CREATE POLICY "Users can create own search alerts"
  ON public.search_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent modifier leurs propres alertes
DROP POLICY IF EXISTS "Users can update own search alerts" ON public.search_alerts;
CREATE POLICY "Users can update own search alerts"
  ON public.search_alerts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent supprimer leurs propres alertes
DROP POLICY IF EXISTS "Users can delete own search alerts" ON public.search_alerts;
CREATE POLICY "Users can delete own search alerts"
  ON public.search_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- 4. GRANT PERMISSIONS
-- ========================================

-- Permissions pour les utilisateurs authentifiés
GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_alerts TO authenticated;
-- Note: Pas de séquence car on utilise gen_random_uuid() pour l'ID

-- ========================================
-- 5. FONCTION UTILITAIRE: GET_USER_ALERTS
-- ========================================
-- Fonction helper pour récupérer toutes les alertes actives d'un utilisateur

CREATE OR REPLACE FUNCTION public.get_user_search_alerts(user_id UUID)
RETURNS TABLE(
  id UUID,
  criteria JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id,
    sa.criteria,
    sa.is_active,
    sa.created_at,
    sa.updated_at
  FROM public.search_alerts sa
  WHERE sa.user_id = get_user_search_alerts.user_id
  AND sa.is_active = TRUE
  ORDER BY sa.created_at DESC;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.get_user_search_alerts(UUID) IS 
'Retourne toutes les alertes de recherche actives d''un utilisateur';

-- Grant sur la fonction
GRANT EXECUTE ON FUNCTION public.get_user_search_alerts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_search_alerts(UUID) TO anon;

-- ========================================
-- 6. VÉRIFICATIONS POST-INSTALLATION
-- ========================================

-- Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'search_alerts'
  ) THEN
    RAISE EXCEPTION 'La table search_alerts n''a pas été créée';
  END IF;
END $$;

-- Vérifier que RLS est activé
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'search_alerts'
    AND rowsecurity = TRUE
  ) THEN
    RAISE EXCEPTION 'RLS n''est pas activé sur search_alerts';
  END IF;
END $$;

-- ========================================
-- 7. NOTES D'UTILISATION
-- ========================================
-- 
-- STRUCTURE DU JSONB criteria:
-- {
--   "marque": "BMW",
--   "modele": "M3",
--   "prixMin": "50000",
--   "prixMax": "100000",
--   "anneeMin": "2020",
--   "anneeMax": "2024",
--   "kmMax": "50000",
--   "type": ["car"],
--   "carburants": ["essence"],
--   "transmissions": ["manuelle"],
--   "carrosseries": ["Coupé"],
--   "normeEuro": "euro6d",
--   "carPassOnly": true,
--   "architectures": ["L6"],
--   "admissions": ["Bi-Turbo"],
--   "couleurExterieure": ["Noir"],
--   "couleurInterieure": ["Rouge"],
--   "nombrePlaces": ["2"]
-- }
-- 
-- CRÉER UNE ALERTE:
-- INSERT INTO public.search_alerts (user_id, criteria)
-- VALUES (
--   auth.uid(),
--   '{"marque": "BMW", "prixMin": "50000", "prixMax": "100000"}'::jsonb
-- );
-- 
-- RÉCUPÉRER LES ALERTES D'UN UTILISATEUR:
-- SELECT * FROM public.get_user_search_alerts(auth.uid());
-- 
-- ========================================
-- FIN DU SCRIPT
-- ========================================

