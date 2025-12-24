-- ========================================
-- REDZONE - SCRIPT DE SEED DATA
-- ========================================
-- Ce script insère des données de démonstration pour remplir les sections
-- "Nouveautés" et "Tribune" après le nettoyage de la base de données
-- 
-- ⚠️ IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- ========================================

-- ========================================
-- 1. RÉCUPÉRATION D'UN USER_ID DISPONIBLE
-- ========================================
-- On utilise le premier utilisateur disponible dans auth.users
-- Si aucun utilisateur n'existe, le script échouera (normal)
DO $$
DECLARE
  v_user_id UUID;
  v_author_id UUID;
BEGIN
  -- Récupérer le premier user_id disponible
  SELECT id INTO v_user_id
  FROM auth.users
  ORDER BY created_at ASC
  LIMIT 1;
  
  -- Si aucun utilisateur n'existe, on arrête
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur trouvé dans auth.users. Veuillez créer un utilisateur d''abord.';
  END IF;
  
  -- Utiliser le même user_id pour les articles
  v_author_id := v_user_id;
  
  -- ========================================
  -- 2. INSERTION DES 3 VÉHICULES
  -- ========================================
  
  -- Véhicule 1 : Porsche 911 GT3 (992)
  INSERT INTO vehicules (
    user_id,
    type,
    marque,
    modele,
    prix,
    annee,
    km,
    carburant,
    transmission,
    carrosserie,
    puissance,
    etat,
    norme_euro,
    car_pass,
    image,
    description,
    status,
    architecture_moteur,
    admission,
    zero_a_cent,
    co2,
    poids_kg
  ) VALUES (
    v_user_id,
    'car',
    'Porsche',
    '911 GT3',
    225000,
    2023,
    1500,
    'essence',
    'sequentielle',
    'Coupé',
    510,
    'Occasion',
    'Euro 6d',
    TRUE,
    'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=2070&auto=format&fit=crop',
    'Porsche 911 GT3 (992) en excellent état, très peu kilométrée. Moteur atmosphérique 4.0L flat-6 développant 510 ch. Boîte PDK 7 rapports. Équipements complets : PCCB, sièges bucket, pack aérodynamique. Historique complet, entretien Porsche. Véhicule de collection.',
    'active',
    'Flat-6 Atmosphérique',
    'Naturelle',
    3.4,
    308,
    1418
  );
  
  -- Véhicule 2 : BMW M3 E46
  INSERT INTO vehicules (
    user_id,
    type,
    marque,
    modele,
    prix,
    annee,
    km,
    carburant,
    transmission,
    carrosserie,
    puissance,
    etat,
    norme_euro,
    car_pass,
    image,
    description,
    status,
    architecture_moteur,
    admission,
    zero_a_cent,
    co2,
    poids_kg
  ) VALUES (
    v_user_id,
    'car',
    'BMW',
    'M3 E46',
    65000,
    2004,
    120000,
    'essence',
    'manuelle',
    'Berline',
    343,
    'Occasion',
    'Euro 3',
    TRUE,
    'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?q=80&w=2070&auto=format&fit=crop',
    'BMW M3 E46 légendaire, moteur S54B32 en ligne 6 cylindres 3.2L développant 343 ch. Boîte manuelle 6 rapports. Carrosserie en excellent état, intérieur cuir noir. Historique complet, entretien BMW. Youngtimer de référence, valeur sûre.',
    'active',
    'L6 Atmosphérique',
    'Naturelle',
    5.2,
    280,
    1570
  );
  
  -- Véhicule 3 : Audi RS6 Avant
  -- Note : Le carburant "Hybride" n'est pas dans les valeurs autorisées,
  -- on utilise "essence" à la place
  INSERT INTO vehicules (
    user_id,
    type,
    marque,
    modele,
    prix,
    annee,
    km,
    carburant,
    transmission,
    carrosserie,
    puissance,
    etat,
    norme_euro,
    car_pass,
    image,
    description,
    status,
    architecture_moteur,
    admission,
    zero_a_cent,
    co2,
    poids_kg
  ) VALUES (
    v_user_id,
    'car',
    'Audi',
    'RS6 Avant',
    110000,
    2021,
    45000,
    'essence',
    'automatique',
    'Break',
    600,
    'Occasion',
    'Euro 6d',
    TRUE,
    'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop',
    'Audi RS6 Avant C8, moteur V8 biturbo 4.0L TFSI développant 600 ch. Boîte automatique 8 rapports Tiptronic. Break sportif ultra-performant, 0-100 km/h en 3.6s. Équipements premium : Matrix LED, Bang & Olufsen, pack dynamique. Parfait état, entretien Audi.',
    'active',
    'V8 Biturbo',
    'Twin-Turbo',
    3.6,
    210,
    2075
  );
  
  -- ========================================
  -- 3. INSERTION DES 2 ARTICLES (TRIBUNE)
  -- ========================================
  
  -- Article 1 : Passion pour le thermique
  INSERT INTO articles (
    title,
    slug,
    content,
    main_image_url,
    author_id,
    status,
    post_type
  ) VALUES (
    'La Passion du Moteur Thermique : Pourquoi Rester Fidèle ?',
    'passion-moteur-thermique-pourquoi-rester-fidele',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.

Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?

Le moteur thermique reste le cœur battant de l''automobile passion. Le son, la mécanique, l''émotion... Autant de raisons de rester fidèle à cette technologie qui a façonné l''histoire de l''automobile.',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2083&auto=format&fit=crop',
    v_author_id,
    'published',
    'article'
  );
  
  -- Article 2 : Guide d'achat youngtimer
  INSERT INTO articles (
    title,
    slug,
    content,
    main_image_url,
    author_id,
    status,
    post_type
  ) VALUES (
    'Guide d''Achat Youngtimer : Les Points à Vérifier',
    'guide-achat-youngtimer-points-verifier',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.

Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?

L''achat d''un youngtimer nécessite une attention particulière. Vérifiez l''historique, les entretiens, la corrosion, et surtout... la passion du vendeur. Un bon youngtimer, c''est avant tout une histoire à raconter.',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop',
    v_author_id,
    'published',
    'article'
  );
  
  RAISE NOTICE 'Données de seed insérées avec succès !';
  RAISE NOTICE 'User ID utilisé : %', v_user_id;
  RAISE NOTICE '3 véhicules insérés avec status = ''active''';
  RAISE NOTICE '2 articles insérés avec status = ''published''';
  
END $$;

-- ========================================
-- 4. VÉRIFICATION DES DONNÉES INSÉRÉES
-- ========================================
-- Afficher les véhicules actifs
SELECT 
  'Véhicules actifs' as type,
  COUNT(*) as count
FROM vehicules
WHERE status = 'active';

-- Afficher les articles publiés
SELECT 
  'Articles publiés' as type,
  COUNT(*) as count
FROM articles
WHERE status = 'published';

-- Afficher les détails des véhicules insérés
SELECT 
  id,
  marque,
  modele,
  annee,
  prix,
  km,
  status
FROM vehicules
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 3;

-- Afficher les détails des articles insérés
SELECT 
  id,
  title,
  slug,
  status,
  post_type
FROM articles
WHERE status = 'published'
ORDER BY created_at DESC
LIMIT 2;

