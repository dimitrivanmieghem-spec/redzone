# 🔍 AUDIT ARCHITECTURE - CHAÎNE DE DONNÉES VÉHICULE

**Date** : 2025-01-XX  
**Contexte** : Refactoring du formulaire `/sell` - Analyse de la chaîne complète Marque → Modèle → Specs → Taxes

---

## 📋 RÉSUMÉ EXÉCUTIF

L'audit révèle une **architecture partiellement fonctionnelle** avec plusieurs **chaînons manquants critiques** :

- ✅ **Cascade Marque/Modèle** : Fonctionnelle mais dépendante d'une seule table
- ✅ **Autofill Specs** : Implémenté et opérationnel
- ❌ **Calculateur de Taxe** : **NON INTÉGRÉ** dans le formulaire de vente
- ⚠️ **Base de Données** : Structure incomplète (table `brands` manquante, pas de table de règles fiscales)

---

## 1️⃣ LA CASCADE MARQUE/MODÈLE

### ✅ **État Actuel : FONCTIONNEL**

#### **Flux de Données Identifié**

```
Step1Identity.tsx (ligne 272-284)
  ↓
  props.modeles (passé depuis page.tsx)
  ↓
page.tsx (ligne 421-459)
  ↓
  useEffect déclenché quand formData.marque change
  ↓
  getModels(formData.type, formData.marque)
  ↓
src/lib/supabase/modelSpecs.ts (ligne 132-185)
  ↓
  supabase.from('model_specs_db')
    .select('modele')
    .eq('type', type)
    .eq('marque', brand)  ← FILTRAGE PAR MARQUE ✅
    .eq('is_active', true)
    .order('modele')
```

#### **Réponses aux Questions Critiques**

**Q1 : Comment les modèles sont-ils chargés après sélection d'une marque ?**

✅ **Réponse** : Via un `useEffect` dans `page.tsx` (ligne 421) qui appelle `getModels(type, marque)`.

**Q2 : Quelle table/API est appelée ?**

✅ **Réponse** : 
- **Table principale** : `model_specs_db` (colonne `modele`)
- **Fallback** : Aucun (si la table échoue, erreur silencieuse)
- **API externe** : Aucune

**Q3 : Le filtrage par marque est-il présent ?**

✅ **Réponse** : **OUI**, ligne 154 de `modelSpecs.ts` :
```typescript
.eq('marque', brand)  // Filtre strict par marque
```

#### **⚠️ Points de Fragilité**

1. **Dépendance unique** : Si `model_specs_db` est indisponible, aucun fallback
2. **Pas de cache** : Chaque changement de marque déclenche une nouvelle requête
3. **Gestion d'erreur silencieuse** : Si `getModels()` retourne `[]`, l'erreur est affichée mais pas loggée en détail

---

## 2️⃣ L'AUTOFILL (PRÉ-REMPLISSAGE)

### ✅ **État Actuel : IMPLÉMENTÉ ET OPÉRATIONNEL**

#### **Flux de Données Identifié**

```
page.tsx (ligne 496-569)
  ↓
  useEffect déclenché quand (type + marque + modele) changent
  ↓
  getModelSpecs(type, marque, modele)
  ↓
src/lib/supabase/modelSpecs.ts (ligne 294-428)
  ↓
  supabase.from('model_specs_db')
    .select('kw, ch, cv_fiscaux, co2, cylindree, moteur, transmission, ...')
    .eq('type', type)
    .ilike('marque', brand)
    .ilike('modele', model)
  ↓
  setFormData() avec toutes les specs pré-remplies
```

#### **Réponses aux Questions Critiques**

**Q1 : Existe-t-il une logique d'autofill ?**

✅ **Réponse** : **OUI**, implémentée dans `page.tsx` ligne 496-569.

**Q2 : Où se trouve cette logique ?**

✅ **Réponse** : 
- **Fichier** : `src/app/sell/page.tsx`
- **Lignes** : 496-569
- **Fonction** : `useEffect` avec dépendances `[formData.type, formData.marque, formData.modele, isManualModel, showToast]`

**Q3 : Quelle source de données utilise-t-elle ?**

✅ **Réponse** : 
- **Table** : `model_specs_db`
- **Fonction** : `getModelSpecs(type, brand, model)` depuis `src/lib/supabase/modelSpecs.ts`
- **Colonnes pré-remplies** :
  - `puissance` ← `ch` (chevaux)
  - `puissanceKw` ← `kw`
  - `cvFiscaux` ← `cv_fiscaux`
  - `co2` ← `co2`
  - `cylindree` ← `cylindree`
  - `moteur` ← `moteur`
  - `transmission` ← `transmission`
  - `carrosserie` ← `default_carrosserie`
  - `co2Wltp` ← `co2_wltp` (pour Flandre)
  - `drivetrain` ← `drivetrain`
  - `topSpeed` ← `top_speed`
  - `couleurExterieure` ← `default_color`
  - `nombrePlaces` ← `default_seats`

#### **✅ Points Forts**

1. **Pré-remplissage complet** : Tous les champs techniques sont automatiquement remplis
2. **Gestion du mode manuel** : Si `modele === "__AUTRE__"`, les champs sont vidés
3. **Extraction d'architecture** : Fonction `extractArchitecture()` pour déduire V6, V8, etc. depuis le champ `moteur`
4. **Gestion CO2 conditionnelle** : Le champ CO2 n'est affiché que si `hasCo2Data === true`

#### **⚠️ Points de Fragilité**

1. **Pas de validation** : Si les specs retournent des valeurs invalides (ex: `kw = null`), le formulaire peut planter
2. **Recherche approximative** : Utilise `ILIKE` pour la recherche (tolérant aux espaces), mais peut matcher plusieurs résultats
3. **Pas de cache** : Chaque changement de modèle déclenche une nouvelle requête

---

## 3️⃣ LE CALCULATEUR DE TAXE

### ❌ **État Actuel : NON INTÉGRÉ DANS LE FORMULAIRE**

#### **Flux de Données Identifié**

```
TaxCalculator.tsx (composant existant)
  ↓
  Props requises :
    - puissanceKw
    - puissanceCv
    - cvFiscaux
    - co2
    - co2Wltp (optionnel)
    - annee
    - region (wallonie/flandre)
  ↓
  Calculs :
    - TMC (Taxe de Mise en Circulation) : puissanceKw + age + co2
    - Taxe Annuelle : cvFiscaux uniquement
```

#### **Réponses aux Questions Critiques**

**Q1 : Le formulaire calcule-t-il les taxes en temps réel ?**

❌ **Réponse** : **NON**. Le composant `TaxCalculator` existe (`src/components/TaxCalculator.tsx`) mais **n'est PAS utilisé** dans le formulaire `/sell`.

**Q2 : Sur quelles données se base-t-il ?**

✅ **Réponse** : Le calculateur nécessite :
- `puissanceKw` : ✅ Disponible dans `formData.puissanceKw`
- `puissanceCv` : ✅ Disponible dans `formData.puissance`
- `cvFiscaux` : ✅ Disponible dans `formData.cvFiscaux`
- `co2` : ✅ Disponible dans `formData.co2`
- `co2Wltp` : ✅ Disponible dans `formData.co2Wltp`
- `annee` : ✅ Disponible dans `formData.annee`
- `region` : ❌ **MANQUANT** (pas de champ dans formData)
- `firstRegistrationDate` : ❌ **MANQUANT** (pas de champ dans formData)

**Q3 : Les données sont-elles bien passées du Step1 au calculateur ?**

❌ **Réponse** : **NON**. Le calculateur n'est pas intégré, donc aucune donnée n'est passée.

#### **🔴 CHAÎNON MANQUANT CRITIQUE**

**Problème** : Le calculateur de taxe existe mais n'est **jamais appelé** dans le formulaire de vente.

**Impact** : 
- L'utilisateur ne peut pas voir les taxes estimées pendant la saisie
- Pas de feedback visuel sur le coût fiscal du véhicule
- Expérience utilisateur incomplète

**Solution Requise** :
1. Ajouter `TaxCalculator` dans `Step2Specs.tsx` ou `Step3Media.tsx`
2. Passer les props depuis `formData`
3. Ajouter un champ `region` dans `formData` (ou le déduire de `codePostal`)

---

## 4️⃣ ÉTAT DE LA BASE DE DONNÉES (INFÉRENCE)

### 📊 **Tables Attendues par le Frontend**

D'après l'analyse du code, voici les tables et colonnes **attendues** :

#### **Table 1 : `model_specs_db` ✅ (EXISTE)**

**Colonnes utilisées** :
```sql
- type (car | moto)
- marque (TEXT)
- modele (TEXT)
- is_active (BOOLEAN)
- kw (NUMERIC) → puissanceKw
- ch (NUMERIC) → puissance
- cv_fiscaux (NUMERIC) → cvFiscaux
- co2 (NUMERIC) → co2
- co2_wltp (NUMERIC) → co2Wltp (pour Flandre)
- cylindree (NUMERIC) → cylindree
- moteur (TEXT) → moteur
- transmission (TEXT) → transmission
- default_carrosserie (TEXT) → carrosserie
- top_speed (NUMERIC) → topSpeed
- drivetrain (TEXT) → drivetrain (RWD/FWD/AWD/4WD)
- default_color (TEXT) → couleurExterieure
- default_seats (NUMERIC) → nombrePlaces
```

**Index recommandés** :
- `(type, marque, modele)` pour `getModelSpecs()`
- `(type, marque)` pour `getModels()`
- `(type)` pour `getBrands()`

#### **Table 2 : `brands` ❌ (MANQUANTE)**

**Colonnes attendues** (d'après `Step1Identity.tsx` ligne 93-97) :
```sql
- name (TEXT) → nom de la marque
- type (car | moto)
```

**Statut** : 
- Le code tente de l'utiliser en premier (ligne 93)
- Si elle n'existe pas, fallback vers `model_specs_db` (ligne 119)
- **Recommandation** : Créer cette table pour optimiser les performances

#### **Table 3 : `taxes_rules` ❌ (MANQUANTE)**

**Colonnes attendues** (d'après `TaxCalculator.tsx`) :
```sql
- region (wallonie | flandre | bruxelles)
- puissance_kw_min (NUMERIC)
- puissance_kw_max (NUMERIC)
- tmc_base (NUMERIC)
- age_min (INTEGER)
- age_max (INTEGER)
- taux_reduction (NUMERIC)
- co2_min (NUMERIC)
- co2_max (NUMERIC)
- eco_malus (NUMERIC)
- cv_fiscaux_min (INTEGER)
- cv_fiscaux_max (INTEGER)
- taxe_circulation (NUMERIC)
```

**Statut** : 
- **N'existe pas** : Les règles fiscales sont **hardcodées** dans `TaxCalculator.tsx`
- **Impact** : Impossible de mettre à jour les barèmes sans modifier le code
- **Recommandation** : Créer cette table pour externaliser les règles fiscales

#### **Table 4 : `vehicles` ✅ (EXISTE - pour sauvegarde)**

**Colonnes utilisées** (d'après `page.tsx` ligne 758-797) :
```sql
- type, brand, model, price, year, mileage, fuel_type, transmission
- power_hp, fiscal_horsepower, co2, displacement_cc
- co2_wltp, drivetrain, top_speed
- contact_email, phone, contact_methods, city, postal_code
- ... (voir types.ts pour la liste complète)
```

---

## 🔗 DIAGRAMME DE FLUX COMPLET

```
┌─────────────────────────────────────────────────────────────┐
│                    FORMULAIRE /SELL                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1 : IDENTITY                                          │
│  - Sélection Type (car/moto)                                │
│  - Sélection Marque                                         │
│  - Sélection Modèle                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
         ┌──────────────────┴──────────────────┐
         │                                      │
         ▼                                      ▼
┌─────────────────────┐          ┌─────────────────────┐
│  getBrands()         │          │  getModels()         │
│  Table: brands       │          │  Table: model_specs_db│
│  (ou model_specs_db) │          │  Filtre: marque      │
└─────────────────────┘          └─────────────────────┘
         │                                      │
         └──────────────────┬──────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2 : SPECS                                             │
│  - getModelSpecs() → Autofill                                │
│  - Pré-remplit: puissance, cvFiscaux, co2, etc.            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
         ┌──────────────────┴──────────────────┐
         │                                      │
         ▼                                      ▼
┌─────────────────────┐          ┌─────────────────────┐
│  getModelSpecs()     │          │  TaxCalculator      │
│  Table: model_specs_db│          │  ❌ NON INTÉGRÉ      │
│  Retourne: specs    │          │  Props: manquantes  │
└─────────────────────┘          └─────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3 : MEDIA                                             │
│  - Photos, Audio, Contact, Localisation                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4 : FINALIZE                                          │
│  - Vérification Email (invités uniquement)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  handleSubmit()                                             │
│  - saveVehicle() → Table: vehicles                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 CHAÎNONS MANQUANTS IDENTIFIÉS

### **1. Table `brands` manquante**

**Impact** : 
- Performance dégradée (extraction de marques depuis `model_specs_db`)
- Code de fallback nécessaire dans `Step1Identity.tsx`

**Solution** :
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('car', 'moto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, type)
);

CREATE INDEX idx_brands_type ON brands(type);
CREATE INDEX idx_brands_name ON brands(name);
```

### **2. Calculateur de Taxe non intégré**

**Impact** :
- Expérience utilisateur incomplète
- Pas de feedback fiscal en temps réel

**Solution** :
1. Ajouter `TaxCalculator` dans `Step2Specs.tsx` (après les champs techniques)
2. Passer les props depuis `formData` :
   ```typescript
   <TaxCalculator
     puissanceKw={parseFloat(formData.puissanceKw) || 0}
     puissanceCv={parseInt(formData.puissance) || 0}
     cvFiscaux={parseInt(formData.cvFiscaux) || 0}
     co2={parseInt(formData.co2) || 0}
     co2Wltp={formData.co2Wltp ? parseInt(formData.co2Wltp) : undefined}
     annee={parseInt(formData.annee) || 0}
     region={formData.region || "wallonie"} // À ajouter dans formData
   />
   ```

### **3. Table `taxes_rules` manquante**

**Impact** :
- Règles fiscales hardcodées dans le code
- Impossible de mettre à jour les barèmes sans déploiement

**Solution** :
```sql
CREATE TABLE taxes_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL CHECK (region IN ('wallonie', 'flandre', 'bruxelles')),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('tmc_base', 'eco_malus', 'taxe_circulation')),
  puissance_kw_min NUMERIC,
  puissance_kw_max NUMERIC,
  age_min INTEGER,
  age_max INTEGER,
  co2_min NUMERIC,
  co2_max NUMERIC,
  cv_fiscaux_min INTEGER,
  cv_fiscaux_max INTEGER,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **4. Champ `region` manquant dans formData**

**Impact** :
- Impossible de calculer les taxes pour Flandre/Bruxelles
- Le calculateur ne peut pas déterminer la région

**Solution** :
1. Ajouter `region` dans `formData` (déduire de `codePostal` ou permettre sélection manuelle)
2. Ajouter `firstRegistrationDate` si besoin de précision

---

## 📝 RECOMMANDATIONS PRIORITAIRES

### **🔴 PRIORITÉ 1 : Intégrer le Calculateur de Taxe**

**Fichier à modifier** : `src/components/features/sell-form/Step2Specs.tsx`

**Action** :
1. Importer `TaxCalculator`
2. Ajouter le composant après les champs techniques
3. Passer les props depuis `formData`
4. Ajouter un champ `region` dans `formData` (ou le déduire de `codePostal`)

### **🟡 PRIORITÉ 2 : Créer la table `brands`**

**Action** :
1. Créer la table `brands` avec les colonnes `name` et `type`
2. Populer depuis `model_specs_db` (extraction des marques uniques)
3. Mettre à jour `Step1Identity.tsx` pour utiliser cette table en priorité

### **🟢 PRIORITÉ 3 : Externaliser les règles fiscales**

**Action** :
1. Créer la table `taxes_rules`
2. Populer avec les barèmes 2025 (actuellement dans `TaxCalculator.tsx`)
3. Modifier `TaxCalculator.tsx` pour lire depuis la base au lieu de hardcoder

---

## ✅ CONCLUSION

L'architecture actuelle est **fonctionnelle** pour la cascade Marque → Modèle → Specs, mais **incomplète** pour le calcul des taxes. Les chaînons manquants sont :

1. ❌ **Calculateur de Taxe non intégré** (priorité absolue)
2. ⚠️ **Table `brands` manquante** (optimisation)
3. ⚠️ **Table `taxes_rules` manquante** (maintenabilité)

**Score de Complétude** : **70%** (3/4 fonctionnalités majeures opérationnelles)

