# Simplification du Formulaire de Vente (/sell)

## ✅ Modifications Apportées

### 1. Suppression de la Section "Informations Avancées"
- ❌ **Supprimé complètement** : Section repliable avec ~15 champs techniques
- ✅ **Résultat** : Formulaire réduit de ~40 champs à ~14 champs essentiels (-65%)

### 2. Champs Supprimés (Trop Techniques ou Redondants)
- ❌ Couple (Nm)
- ❌ Régime de rupture (tr/min)
- ❌ Nombre de cylindres
- ❌ Configuration moteur (redondant avec Architecture)
- ❌ Édition limitée (checkbox) → À mentionner dans la description
- ❌ Nombre d'exemplaires produits → À mentionner dans la description
- ❌ Héritage sportif → À mentionner dans la description
- ❌ Modifications → À mentionner dans la description
- ❌ Prêt pour circuit → À mentionner dans la description
- ❌ Garantie restante → À mentionner dans la description
- ❌ Nombre d'entretiens → À mentionner dans la description
- ❌ Date de première immatriculation (peut être déduit de l'année)
- ❌ Région d'immatriculation (peut être déduit du code postal)

### 3. Champs Conservés (Essentiels)
#### ÉTAPE 2 : Caractéristiques & Configuration
**Section A : Informations de Vente (OBLIGATOIRES)**
- ✅ Prix (€)
- ✅ Année
- ✅ Kilométrage
- ✅ Puissance (ch) - Pré-rempli automatiquement
- ✅ Transmission - Pré-rempli automatiquement

**Section B : Données Techniques (PRÉ-REMPLIES, modifiables)**
- ✅ CV Fiscaux - Pré-rempli automatiquement
- ✅ CO2 (g/km) - Pré-rempli si disponible
- ✅ Cylindrée - Pré-rempli automatiquement
- ✅ Architecture Moteur - Pré-rempli automatiquement

**Section C : Configuration Esthétique (OPTIONNELS)**
- ✅ Type de Carrosserie - Pré-rempli si disponible
- ✅ Couleur Extérieure - Pré-rempli si disponible
- ✅ Couleur Intérieure
- ✅ Nombre de Places - Pré-rempli si disponible

**Section D : Description**
- ✅ L'Histoire du véhicule - Placeholder amélioré pour guider le vendeur

**Section E : Champs Optionnels Additionnels (affichés si pré-remplis depuis la base)**
- ✅ CO2 WLTP (g/km) - Pour calcul taxes Flandre
- ✅ Vitesse max (km/h)
- ✅ Type de transmission (RWD/FWD/AWD)

### 4. Amélioration du Pré-remplissage Automatique

#### Nouveaux Champs Pré-remplis depuis `model_specs_db` :
- `co2_wltp` → CO2 WLTP (si disponible)
- `drivetrain` → Type de transmission (RWD/FWD/AWD) (si disponible)
- `top_speed` → Vitesse maximale (si disponible)
- `default_color` → Couleur extérieure standard (si disponible)
- `default_seats` → Nombre de places standard (si disponible)

#### Mise à Jour de `src/lib/supabase/modelSpecs.ts` :
- ✅ Interface `VehicleSpecs` enrichie avec les nouveaux champs
- ✅ Fonction `getModelSpecs` mise à jour pour récupérer les nouveaux champs
- ✅ Pré-remplissage automatique amélioré dans `/sell/page.tsx`

### 5. Amélioration de la Description
**Placeholder amélioré :**
> *"Racontez l'histoire de ce véhicule : entretien, options, modifications (Stage 1, préparation...), édition limitée, garantie, historique... (Minimum 20 caractères)"*

**Message d'information :**
> *"ℹ️ Données constructeur pré-remplies. Ces données sont pré-remplies depuis notre base constructeur. Vous pouvez les modifier si votre véhicule est différent (ex: Stage 1, préparation, édition spéciale)."*

---

## 📋 SQL - Enrichissement de `model_specs_db`

### Fichier : `supabase/enrich_model_specs_db.sql`

**Nouvelles colonnes ajoutées :**
1. `top_speed` (INTEGER) - Vitesse maximale en km/h
2. `drivetrain` (TEXT) - Type de transmission (RWD/FWD/AWD/4WD)
3. `co2_wltp` (NUMERIC) - CO2 WLTP pour calcul taxes Flandre
4. `default_carrosserie` (TEXT) - Type de carrosserie par défaut
5. `default_color` (TEXT) - Couleur extérieure standard
6. `default_seats` (INTEGER) - Nombre de places standard

**Instructions :**
1. Exécuter le script SQL dans Supabase
2. Enrichir progressivement la base avec les données pour les véhicules sportifs
3. Sources recommandées : Sites officiels constructeurs, spécifications techniques publiques

---

## 🔄 Impact sur les Autres Pages

### Page de Détail (`/cars/[id]`)
**À FAIRE :**
- ❌ Supprimer l'affichage des champs techniques superflus (couple, régime de rupture, etc.)
- ✅ Garder uniquement les informations pertinentes pour l'acheteur
- ✅ Améliorer la présentation de la description (riche en détails)

### Page de Recherche (`/search`)
**À FAIRE :**
- ❌ Supprimer les filtres pour les champs supprimés (torque, redline, limited_edition, track_ready, etc.)
- ✅ Garder uniquement les filtres pertinents (drivetrain, top_speed si disponibles)

### Autres Fichiers
**À VÉRIFIER :**
- `src/components/features/vehicles/car-card.tsx` - Vérifier que les champs supprimés ne sont pas utilisés
- `src/hooks/useVehicules.ts` - Vérifier les filtres
- `src/lib/supabase/server-actions/vehicules.ts` - Vérifier la sauvegarde des champs
- `src/lib/supabase/vehicules.ts` - Vérifier le mapping

---

## 📊 Résultat Final

### Avant : ~40 champs
- 25 champs visibles par défaut
- 15 champs dans la section "Informations Avancées" (repliable)

### Après : ~14 champs essentiels
- Focus sur l'essentiel : prix, année, km, puissance, description
- Maximum de données pré-remplies automatiquement
- Liberté dans la description pour les spécificités

### Gain pour le Vendeur :
- ⚡ Formulaire **3x plus rapide** à remplir
- 🎯 Focus sur l'essentiel
- 🤖 Maximum de données pré-remplies automatiquement
- ✍️ Liberté dans la description pour les détails spécifiques

---

## ✅ Actions Restantes

1. [ ] Exécuter `supabase/enrich_model_specs_db.sql` dans Supabase
2. [ ] Adapter la page de détail `/cars/[id]` pour supprimer les champs inutiles
3. [ ] Adapter la page de recherche `/search` pour supprimer les filtres inutiles
4. [ ] Vérifier tous les autres fichiers impactés
5. [ ] Tester le formulaire de bout en bout
6. [ ] Vérifier que les champs pré-remplis fonctionnent correctement

