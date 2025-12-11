-- ========================================
-- DIAGNOSTIC CO2 - Vérification des données
-- ========================================
-- Ce script permet de vérifier si les données CO2 sont présentes dans la table
-- et de diagnostiquer pourquoi certaines valeurs sont NULL

-- ========================================
-- 1. VÉRIFICATION STRUCTURE DE LA COLONNE
-- ========================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'model_specs_db'
  AND column_name = 'co2';

-- ========================================
-- 2. STATISTIQUES GLOBALES CO2
-- ========================================
SELECT 
    COUNT(*) as total_lignes,
    COUNT(co2) as lignes_avec_co2,
    COUNT(*) - COUNT(co2) as lignes_sans_co2,
    ROUND(100.0 * COUNT(co2) / COUNT(*), 2) as pourcentage_avec_co2,
    MIN(co2) as co2_min,
    MAX(co2) as co2_max,
    ROUND(AVG(co2), 2) as co2_moyen
FROM model_specs_db
WHERE is_active = true;

-- ========================================
-- 3. EXEMPLE : Vérifier un véhicule spécifique
-- ========================================
-- Remplacez 'Volkswagen' et 'Golf' par la marque et le modèle que vous testez
SELECT 
    marque,
    modele,
    type,
    kw,
    ch,
    cv_fiscaux,
    co2,  -- ⬅️ Vérifier cette colonne
    cylindree,
    moteur,
    transmission,
    is_active,
    CASE 
        WHEN co2 IS NULL THEN '❌ NULL (donnée manquante)'
        ELSE '✅ ' || co2::text || ' g/km'
    END as statut_co2
FROM model_specs_db
WHERE marque ILIKE '%Volkswagen%'
  AND modele ILIKE '%Golf%'
  AND type = 'car'
  AND is_active = true
ORDER BY modele;

-- ========================================
-- 4. LISTE DES VÉHICULES SANS CO2 (par marque)
-- ========================================
SELECT 
    marque,
    COUNT(*) as nombre_sans_co2
FROM model_specs_db
WHERE is_active = true
  AND co2 IS NULL
GROUP BY marque
ORDER BY nombre_sans_co2 DESC
LIMIT 20;

-- ========================================
-- 5. EXEMPLE DÉTAILLÉ : Tous les modèles d'une marque
-- ========================================
-- Remplacez 'Volkswagen' par la marque que vous testez
SELECT 
    marque,
    modele,
    type,
    kw,
    ch,
    cv_fiscaux,
    co2,
    cylindree,
    CASE 
        WHEN co2 IS NULL THEN '⚠️ Donnée manquante'
        ELSE '✅ ' || co2::text || ' g/km'
    END as statut_co2,
    created_at
FROM model_specs_db
WHERE marque ILIKE '%Volkswagen%'
  AND type = 'car'
  AND is_active = true
ORDER BY modele, co2 NULLS LAST;

-- ========================================
-- 6. VÉRIFICATION : Est-ce que la colonne existe vraiment ?
-- ========================================
SELECT 
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'model_specs_db' 
          AND column_name = 'co2'
    ) as colonne_co2_existe;

-- ========================================
-- 7. COMPARAISON : Véhicules avec et sans CO2
-- ========================================
SELECT 
    'Avec CO2' as categorie,
    COUNT(*) as nombre,
    ROUND(AVG(annee), 0) as annee_moyenne_estimee
FROM model_specs_db
WHERE is_active = true
  AND co2 IS NOT NULL

UNION ALL

SELECT 
    'Sans CO2' as categorie,
    COUNT(*) as nombre,
    NULL as annee_moyenne_estimee
FROM model_specs_db
WHERE is_active = true
  AND co2 IS NULL;

-- ========================================
-- NOTES
-- ========================================
-- Si co2 est NULL, c'est normal pour :
-- 1. Les véhicules anciens (avant les normes Euro)
-- 2. Les véhicules où la donnée n'a pas été importée
-- 3. Les motos (souvent pas de données CO2)
--
-- Pour corriger :
-- 1. Vérifiez que les données sont bien importées avec co2
-- 2. Si vous importez depuis vehicleData.ts, vérifiez que le champ co2 est bien mappé
-- 3. Pour les anciens véhicules, NULL est acceptable
-- ========================================

