-- ========================================
-- REDZONE - SCRIPT DE SEED DATA V2
-- ========================================
-- Ce script insère des données de démonstration pour remplir les sections
-- "Nouveautés" et "Tribune" après le nettoyage de la base de données
-- 
-- ⚠️ IMPORTANT : Exécutez ce script dans le SQL Editor de Supabase
-- ⚠️ PRÉREQUIS : Au moins un utilisateur doit exister dans auth.users
-- ========================================

-- ========================================
-- 1. RÉCUPÉRATION D'UN USER_ID DISPONIBLE
-- ========================================
-- On utilise le premier utilisateur disponible dans auth.users
-- Si aucun utilisateur n'existe, le script échouera avec un message clair
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
    RAISE EXCEPTION 'Aucun utilisateur trouvé dans auth.users. Veuillez créer un utilisateur d''abord via l''interface d''authentification.';
  END IF;
  
  -- Utiliser le même user_id pour les articles
  v_author_id := v_user_id;
  
  -- ========================================
  -- 2. NETTOYAGE DES VÉHICULES DE TEST EXISTANTS (OPTIONNEL)
  -- ========================================
  -- Supprimer les véhicules de test existants pour éviter les doublons
  -- (Uniquement ceux qui correspondent exactement aux modèles de seed)
  DELETE FROM vehicules 
  WHERE marque = 'Porsche' AND modele = '911 GT3' AND annee = 2023
     OR marque = 'BMW' AND modele = 'M3 E46' AND annee = 2004
     OR marque = 'Audi' AND modele = 'RS6 Avant' AND annee = 2021;
  
  -- ========================================
  -- 3. INSERTION DES 3 VÉHICULES
  -- ========================================
  -- IMPORTANT : Tous les véhicules ont status = 'active' pour être visibles
  -- IMPORTANT : Seuls les carburants 'essence', 'e85', 'lpg' sont autorisés
  
  -- Véhicule 1 : Porsche 911 GT3 (992) - Sportive Essence
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
    images,
    description,
    status,
    architecture_moteur,
    admission,
    zero_a_cent,
    co2,
    poids_kg,
    cv_fiscaux,
    nombre_places,
    ville,
    code_postal,
    contact_methods
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
    ARRAY[
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2083&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop'
    ],
    'Porsche 911 GT3 (992) en excellent état, très peu kilométrée. Moteur atmosphérique 4.0L flat-6 développant 510 ch. Boîte PDK 7 rapports. Équipements complets : PCCB, sièges bucket, pack aérodynamique. Historique complet, entretien Porsche. Véhicule de collection.',
    'active',
    'Flat-6 Atmosphérique',
    'Naturelle',
    3.4,
    308,
    1418,
    20,
    2,
    'Bruxelles',
    '1000',
    ARRAY['email', 'tel']
  );
  
  -- Véhicule 2 : BMW M3 E46 - Youngtimer Essence
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
    images,
    description,
    status,
    architecture_moteur,
    admission,
    zero_a_cent,
    co2,
    poids_kg,
    cv_fiscaux,
    nombre_places,
    ville,
    code_postal,
    contact_methods,
    history
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
    ARRAY[
      'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop'
    ],
    'BMW M3 E46 légendaire, moteur S54B32 en ligne 6 cylindres 3.2L développant 343 ch. Boîte manuelle 6 rapports. Carrosserie en excellent état, intérieur cuir noir. Historique complet, entretien BMW. Youngtimer de référence, valeur sûre.',
    'active',
    'L6 Atmosphérique',
    'Naturelle',
    5.2,
    280,
    1570,
    18,
    5,
    'Liège',
    '4000',
    ARRAY['email', 'whatsapp', 'tel'],
    ARRAY['Contrôle technique OK', 'Car-Pass vérifié', 'Historique complet', 'Entretien BMW officiel']
  );
  
  -- Véhicule 3 : Audi RS6 Avant C8 - Sportive Essence (V8 Biturbo)
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
    images,
    description,
    status,
    architecture_moteur,
    admission,
    zero_a_cent,
    co2,
    poids_kg,
    cv_fiscaux,
    nombre_places,
    ville,
    code_postal,
    contact_methods,
    couleur_interieure
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
    ARRAY[
      'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2083&auto=format&fit=crop'
    ],
    'Audi RS6 Avant C8, moteur V8 biturbo 4.0L TFSI développant 600 ch. Boîte automatique 8 rapports Tiptronic. Break sportif ultra-performant, 0-100 km/h en 3.6s. Équipements premium : Matrix LED, Bang & Olufsen, pack dynamique. Parfait état, entretien Audi.',
    'active',
    'V8 Biturbo',
    'Twin-Turbo',
    3.6,
    210,
    2075,
    25,
    5,
    'Namur',
    '5000',
    ARRAY['email', 'tel'],
    'Cuir Noir'
  );
  
  -- ========================================
  -- 4. NETTOYAGE DES ARTICLES EXISTANTS (SI DOUBLONS)
  -- ========================================
  -- Supprimer les articles existants avec les mêmes slugs pour éviter les conflits
  DELETE FROM articles 
  WHERE slug IN (
    'passion-moteur-thermique-pourquoi-rester-fidele',
    'guide-achat-youngtimer-points-verifier'
  );
  
  -- ========================================
  -- 5. INSERTION DES 2 ARTICLES (TRIBUNE)
  -- ========================================
  -- IMPORTANT : Tous les articles ont status = 'published' pour être visibles
  -- IMPORTANT : post_type = 'article' pour les articles de blog
  
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
    'Le moteur thermique reste le cœur battant de l''automobile passion. Le son, la mécanique, l''émotion... Autant de raisons de rester fidèle à cette technologie qui a façonné l''histoire de l''automobile.

## Le Son, Cette Signature Unique

Chaque moteur a sa propre signature sonore. Le vrombissement d''un V8 américain, le hurlement d''un flat-6 Porsche, le rugissement d''un V10 Lamborghini... Ces sons ne peuvent pas être reproduits par un moteur électrique. Ils font partie de l''ADN de chaque voiture de sport.

## La Mécanique Pure

Il y a quelque chose de fascinant dans la complexité mécanique d''un moteur thermique. Les pistons, les bielles, les arbres à cames, la distribution... Chaque pièce a un rôle précis dans la transformation de l''énergie. C''est une œuvre d''art mécanique.

## L''Émotion au Volant

Conduire une sportive thermique, c''est vivre une expérience sensorielle complète. Le son du moteur qui monte dans les tours, la sensation de puissance qui se libère, l''odeur de l''essence... Autant d''éléments qui créent une connexion émotionnelle unique entre le conducteur et sa machine.

## L''Histoire et la Culture Automobile

Le moteur thermique a façonné plus d''un siècle d''histoire automobile. Des premières voitures aux supercars modernes, chaque époque a apporté son lot d''innovations et de légendes. Cette histoire mérite d''être préservée et célébrée.

## Conclusion

Rester fidèle au thermique, c''est défendre une passion, une culture, une histoire. C''est choisir l''émotion pure plutôt que l''efficacité froide. C''est pour cela que RedZone existe : pour rassembler les puristes qui partagent cette passion.',
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
    'L''achat d''un youngtimer nécessite une attention particulière. Vérifiez l''historique, les entretiens, la corrosion, et surtout... la passion du vendeur. Un bon youngtimer, c''est avant tout une histoire à raconter.

## Qu''est-ce qu''un Youngtimer ?

Un youngtimer est une voiture qui a entre 20 et 30 ans. Assez récente pour être fiable au quotidien, mais assez ancienne pour avoir du caractère et une valeur sentimentale. Des modèles comme la BMW M3 E46, la Porsche 996, ou la Honda NSX sont de parfaits exemples.

## Les Points Critiques à Vérifier

### 1. L''Historique Complet

Un bon youngtimer doit avoir un historique complet. Factures d''entretien, carnet d''entretien, historique des propriétaires... Tous ces documents permettent de retracer la vie du véhicule et d''identifier d''éventuels problèmes.

### 2. La Corrosion

La corrosion est l''ennemi numéro un des youngtimers. Vérifiez particulièrement :
- Les passages de roues
- Le plancher
- Les longerons
- Les bas de portes
- Le coffre

### 3. L''Entretien Régulier

Un youngtimer bien entretenu vaut plus qu''un jeune véhicule négligé. Vérifiez que les révisions ont été faites aux bons intervalles et par des professionnels compétents.

### 4. Les Pièces d''Origine

Les pièces d''origine sont essentielles pour préserver la valeur d''un youngtimer. Vérifiez que les éléments clés (jantes, phares, intérieur) sont d''origine ou ont été remplacés par des pièces homologuées.

### 5. La Passion du Vendeur

Un vendeur passionné prend soin de sa voiture. Il connaît l''historique, les anecdotes, les particularités... Cette passion se traduit souvent par un meilleur entretien et une meilleure préservation.

## Conclusion

Acheter un youngtimer, c''est investir dans une histoire. Prenez le temps de vérifier tous les points, posez des questions, et surtout, faites confiance à votre instinct. Un bon youngtimer, c''est avant tout une voiture qui vous fait vibrer.',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop',
    v_author_id,
    'published',
    'article'
  );
  
  RAISE NOTICE '✅ Données de seed insérées avec succès !';
  RAISE NOTICE '📋 User ID utilisé : %', v_user_id;
  RAISE NOTICE '🚗 3 véhicules insérés avec status = ''active''';
  RAISE NOTICE '📝 2 articles insérés avec status = ''published''';
  
END $$;

-- ========================================
-- 5. VÉRIFICATION DES DONNÉES INSÉRÉES
-- ========================================
-- Afficher le nombre de véhicules actifs
SELECT 
  'Véhicules actifs' as type,
  COUNT(*) as count
FROM vehicules
WHERE status = 'active';

-- Afficher le nombre d'articles publiés
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
  carburant,
  status,
  created_at
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
  post_type,
  created_at
FROM articles
WHERE status = 'published'
ORDER BY created_at DESC
LIMIT 2;

