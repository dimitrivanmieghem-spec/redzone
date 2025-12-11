-- ========================================
-- TEST : Recherche du modèle Golf 7R
-- ========================================
-- Ce script vérifie si le modèle Golf 7R existe dans la base
-- et sous quel format exact (pour identifier les problèmes de matching)

-- Recherche exacte
SELECT 
  'Recherche exacte' AS test_type,
  marque,
  modele,
  type,
  ch,
  kw,
  cv_fiscaux,
  co2,
  cylindree,
  moteur,
  transmission,
  is_active
FROM model_specs_db
WHERE marque = 'Volkswagen' 
  AND modele = 'Golf 7R'
  AND type = 'car'
  AND is_active = true;

-- Recherche avec ILIKE (insensible à la casse)
SELECT 
  'Recherche ILIKE' AS test_type,
  marque,
  modele,
  type,
  ch,
  kw,
  cv_fiscaux,
  co2,
  cylindree,
  moteur,
  transmission,
  is_active
FROM model_specs_db
WHERE marque ILIKE '%volkswagen%' 
  AND modele ILIKE '%golf%7r%'
  AND type = 'car'
  AND is_active = true;

-- Recherche toutes les variantes de Golf
SELECT 
  'Toutes les Golf' AS test_type,
  marque,
  modele,
  type,
  ch,
  kw,
  cv_fiscaux,
  is_active
FROM model_specs_db
WHERE marque ILIKE '%volkswagen%' 
  AND modele ILIKE '%golf%'
  AND type = 'car'
  AND is_active = true
ORDER BY modele;

-- Recherche toutes les marques qui contiennent "volkswagen" ou "vw"
SELECT DISTINCT
  marque,
  COUNT(*) AS nombre_modeles
FROM model_specs_db
WHERE (marque ILIKE '%volkswagen%' OR marque ILIKE '%vw%')
  AND type = 'car'
  AND is_active = true
GROUP BY marque
ORDER BY marque;

