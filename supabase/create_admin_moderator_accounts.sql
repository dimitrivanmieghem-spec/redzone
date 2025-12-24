-- ========================================
-- REDZONE - CRÉATION DES COMPTES ADMIN ET MODÉRATEUR
-- ========================================
-- Script pour créer et configurer les comptes admin et modérateur
-- IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- ⚠️ REMPLACEZ les emails par vos vrais emails avant d'exécuter

-- ========================================
-- INSTRUCTIONS
-- ========================================

-- 1. Créez d'abord les comptes via l'interface d'inscription du site
--    OU via Supabase Dashboard > Authentication > Users > Add User

-- 2. Récupérez les emails des comptes créés

-- 3. Exécutez ce script en remplaçant les emails ci-dessous

-- ========================================
-- 1. CRÉER LE COMPTE ADMIN
-- ========================================

-- Option A : Si le compte existe déjà, mettre à jour le rôle
UPDATE profiles
SET role = 'admin',
    is_founder = TRUE  -- Les admins sont automatiquement membres fondateurs
WHERE email = 'VOTRE_EMAIL_ADMIN@exemple.com';  -- ⚠️ REMPLACEZ PAR VOTRE EMAIL

-- Option B : Si vous voulez créer le compte directement (nécessite l'UUID)
-- INSERT INTO profiles (id, email, full_name, role, is_founder)
-- VALUES (
--   'UUID_DU_COMPTE_ADMIN',  -- ⚠️ REMPLACEZ PAR L'UUID
--   'VOTRE_EMAIL_ADMIN@exemple.com',  -- ⚠️ REMPLACEZ PAR VOTRE EMAIL
--   'Votre Nom',  -- ⚠️ REMPLACEZ PAR VOTRE NOM
--   'admin',
--   TRUE
-- );

-- ========================================
-- 2. CRÉER LE COMPTE MODÉRATEUR
-- ========================================

-- Option A : Si le compte existe déjà, mettre à jour le rôle
UPDATE profiles
SET role = 'moderator',
    is_founder = TRUE  -- Les modérateurs sont automatiquement membres fondateurs
WHERE email = 'EMAIL_MODERATEUR@exemple.com';  -- ⚠️ REMPLACEZ PAR L'EMAIL DU MODÉRATEUR

-- Option B : Si vous voulez créer le compte directement (nécessite l'UUID)
-- INSERT INTO profiles (id, email, full_name, role, is_founder)
-- VALUES (
--   'UUID_DU_COMPTE_MODERATEUR',  -- ⚠️ REMPLACEZ PAR L'UUID
--   'EMAIL_MODERATEUR@exemple.com',  -- ⚠️ REMPLACEZ PAR L'EMAIL DU MODÉRATEUR
--   'Nom Modérateur',  -- ⚠️ REMPLACEZ PAR LE NOM DU MODÉRATEUR
--   'moderator',
--   TRUE
-- );

-- ========================================
-- 3. VÉRIFIER LES COMPTES
-- ========================================

-- Vérifier que les comptes sont bien configurés
SELECT 
  email,
  full_name,
  role,
  is_founder,
  is_banned,
  created_at
FROM profiles
WHERE role IN ('admin', 'moderator')
ORDER BY role, created_at;

-- ========================================
-- 4. VÉRIFIER LES PERMISSIONS
-- ========================================

-- Vérifier que les admins peuvent accéder à toutes les tables
-- (Les politiques RLS devraient permettre cela)

-- ========================================
-- 5. CRÉER UN COMPTE ADMIN VIA SUPABASE DASHBOARD (ALTERNATIVE)
-- ========================================

-- 1. Allez dans Supabase Dashboard > Authentication > Users
-- 2. Cliquez sur "Add User"
-- 3. Remplissez :
--    - Email : votre email
--    - Password : votre mot de passe
--    - Auto Confirm User : ✅ (pour éviter la confirmation email)
-- 4. Cliquez sur "Create User"
-- 5. Récupérez l'UUID de l'utilisateur créé
-- 6. Exécutez :
--    UPDATE profiles SET role = 'admin', is_founder = TRUE WHERE id = 'UUID_RÉCUPÉRÉ';

-- ========================================
-- 6. NOTES IMPORTANTES
-- ========================================

-- ⚠️ Les admins et modérateurs sont automatiquement membres fondateurs
-- ⚠️ Les admins ont accès à toutes les sections du back-office
-- ⚠️ Les modérateurs ont accès à la modération et au support uniquement
-- ⚠️ Les comptes admin et modérateur ne peuvent pas être bannis automatiquement
-- ⚠️ Gardez ces emails en sécurité

