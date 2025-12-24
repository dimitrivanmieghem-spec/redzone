-- ========================================
-- REDZONE - NETTOYAGE DES DONNÉES DE TEST
-- ========================================
-- Ce script vide toutes les données des tables principales
-- tout en conservant la structure des tables.
-- 
-- ⚠️ ATTENTION : Ce script va supprimer TOUTES les données de test.
-- Il garde les utilisateurs (auth.users et profiles) pour préserver les comptes admin.
-- 
-- Si vous voulez aussi nettoyer les utilisateurs, décommentez les lignes à la fin.
-- ========================================

-- Désactiver temporairement les triggers et contraintes pour éviter les erreurs
SET session_replication_role = 'replica';

-- ========================================
-- 1. VIDER LES TABLES PRINCIPALES (dans l'ordre des dépendances)
-- ========================================

DO $$
BEGIN
    -- Table des logs (généralement pas de dépendances)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_logs') THEN
        TRUNCATE TABLE public.app_logs RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Table app_logs vidée';
    END IF;

    -- Table des notifications (dépend de auth.users)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        TRUNCATE TABLE public.notifications RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Table notifications vidée';
    END IF;

    -- Table des commentaires (dépend de articles et auth.users)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        TRUNCATE TABLE public.comments RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Table comments vidée';
    END IF;

    -- Table des articles (dépend de auth.users)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'articles') THEN
        TRUNCATE TABLE public.articles RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Table articles vidée';
    END IF;

    -- Table des véhicules (peut être "vehicules" ou "vehicles" selon votre schéma)
    -- Tenter d'abord avec "vehicules" (ancien schéma)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicules') THEN
        TRUNCATE TABLE public.vehicules RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Table vehicules vidée';
    -- Sinon tenter avec "vehicles" (nouveau schéma)
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
        TRUNCATE TABLE public.vehicles RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Table vehicles vidée';
    END IF;
END $$;

-- ========================================
-- 2. NETTOYAGE OPTIONNEL DES UTILISATEURS
-- ========================================
-- ⚠️ DÉCOMMENTEZ LE BLOC SUIVANT SEULEMENT SI VOUS VOULEZ TOUT EFFACER
-- Y COMPRIS VOS COMPTES ADMIN
-- ========================================

/*
DO $$
BEGIN
    -- Vider les profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Table profiles vidée';
    END IF;
    
    -- Vider les users (auth.users)
    -- ATTENTION : Cela supprimera TOUS les utilisateurs, y compris les admins
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        TRUNCATE TABLE auth.users RESTART IDENTITY CASCADE;
        RAISE NOTICE 'Table auth.users vidée';
    END IF;
END $$;
*/

-- ========================================
-- 3. RÉACTIVER LES CONTRAINTES
-- ========================================
SET session_replication_role = 'origin';

-- ========================================
-- 4. VÉRIFICATION
-- ========================================
-- Vérifier que les tables sont vides (optionnel, décommentez pour vérifier)
-- SELECT 'vehicules' as table_name, COUNT(*) as row_count FROM public.vehicules
-- UNION ALL
-- SELECT 'articles', COUNT(*) FROM public.articles
-- UNION ALL
-- SELECT 'comments', COUNT(*) FROM public.comments
-- UNION ALL
-- SELECT 'notifications', COUNT(*) FROM public.notifications
-- UNION ALL
-- SELECT 'app_logs', COUNT(*) FROM public.app_logs;

-- ========================================
-- FIN DU SCRIPT
-- ========================================
-- Les tables sont maintenant vides mais leur structure est conservée.
-- Les compteurs d'ID ont été réinitialisés (RESTART IDENTITY).
-- Vous pouvez maintenant insérer de nouvelles données de test.
-- ========================================

