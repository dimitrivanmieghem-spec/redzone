# 📊 GUIDE D'ENRICHISSEMENT DE LA BASE DE DONNÉES REDZONE

## 🎯 Objectif

Ce guide explique comment enrichir la base de données RedZone avec :
1. **Les champs nécessaires pour le calcul des taxes belges** (Wallonie/Flandre)
2. **Les données techniques avancées pour véhicules sportifs**

---

## 📋 Étape 1 : Exécuter le Script SQL

### Fichier : `supabase/enrich_vehicles_table.sql`

Ce script ajoute automatiquement tous les champs manquants à la table `vehicles`.

**Comment exécuter :**

1. **Via Supabase Dashboard :**
   - Aller dans **SQL Editor**
   - Copier-coller le contenu de `supabase/enrich_vehicles_table.sql`
   - Cliquer sur **Run**

2. **Via CLI Supabase :**
   ```bash
   supabase db execute -f supabase/enrich_vehicles_table.sql
   ```

3. **Via psql :**
   ```bash
   psql -h [HOST] -U [USER] -d [DATABASE] -f supabase/enrich_vehicles_table.sql
   ```

**✅ Vérification :**
Le script est **idempotent** : il peut être exécuté plusieurs fois sans erreur. Il vérifie l'existence de chaque colonne avant de l'ajouter.

---

## 🔧 Étape 2 : Mettre à Jour les Types TypeScript

Après avoir exécuté le script SQL, mettre à jour `src/lib/supabase/types.ts` pour inclure les nouveaux champs :

```typescript
// Dans Database['public']['Tables']['vehicles']['Row']
displacement_cc: number | null;
co2_wltp: number | null;
first_registration_date: string | null;
is_hybrid: boolean | null;
is_electric: boolean | null;
region_of_registration: "wallonie" | "flandre" | "bruxelles" | null;
drivetrain: "RWD" | "FWD" | "AWD" | "4WD" | null;
top_speed: number | null;
torque_nm: number | null;
engine_configuration: string | null;
number_of_cylinders: number | null;
redline_rpm: number | null;
limited_edition: boolean | null;
number_produced: number | null;
racing_heritage: string | null;
modifications: string[] | null;
track_ready: boolean | null;
warranty_remaining: number | null;
service_history_count: number | null;
```

---

## 📝 Étape 3 : Enrichir les Données Existantes

### Option A : Enrichissement Manuel (Recommandé pour débuter)

1. **Via l'interface Admin :**
   - Aller dans `/admin?tab=vehicles`
   - Pour chaque véhicule, cliquer sur "Éditer"
   - Remplir les nouveaux champs
   - Sauvegarder

2. **Via le formulaire de vente :**
   - Modifier `src/app/sell/page.tsx` pour inclure les nouveaux champs
   - Les nouveaux véhicules auront automatiquement les données complètes

### Option B : Enrichissement Automatique via API

**Script d'enrichissement automatique** (à créer) :

```typescript
// src/lib/enrichment/autoEnrich.ts
export async function enrichVehicleFromAPI(vehicleId: string) {
  // 1. Récupérer le véhicule
  const vehicle = await getVehiculeById(vehicleId);
  
  // 2. Appeler une API externe (ex: Edmunds, CarQuery)
  const enrichedData = await fetchFromAPI(vehicle.brand, vehicle.model, vehicle.year);
  
  // 3. Mettre à jour le véhicule avec les données enrichies
  await updateVehicule(vehicleId, {
    displacement_cc: enrichedData.displacement,
    co2_wltp: enrichedData.co2_wltp,
    torque_nm: enrichedData.torque,
    top_speed: enrichedData.topSpeed,
    // ... autres champs
  });
}
```

**APIs recommandées :**
- **Edmunds API** : Données techniques complètes
- **CarQuery API** : Base de données de véhicules
- **NHTSA API** : Données de sécurité

### Option C : Import CSV/JSON

1. **Préparer un fichier CSV/JSON** avec les données enrichies
2. **Créer un script d'import** :

```typescript
// scripts/importEnrichedData.ts
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';

async function importEnrichedData() {
  const supabase = await createClient();
  const data = JSON.parse(fs.readFileSync('enriched_vehicles.json', 'utf-8'));
  
  for (const vehicle of data) {
    await supabase
      .from('vehicles')
      .update({
        displacement_cc: vehicle.displacement_cc,
        co2_wltp: vehicle.co2_wltp,
        // ... autres champs
      })
      .eq('id', vehicle.id);
  }
}
```

---

## 🎯 Étape 4 : Prioriser les Véhicules à Enrichir

### Utiliser les Vues SQL

Le script SQL crée deux vues utiles :

1. **`vehicles_complete_tax_data`** : Véhicules avec score de complétude des données fiscales
   ```sql
   SELECT * FROM vehicles_complete_tax_data 
   WHERE tax_data_completeness_score < 100 
   ORDER BY tax_data_completeness_score ASC;
   ```

2. **`vehicles_sport_complete`** : Véhicules avec score de complétude des données sportives
   ```sql
   SELECT * FROM vehicles_sport_complete 
   WHERE sport_data_completeness_score < 100 
   ORDER BY sport_data_completeness_score ASC;
   ```

### Prioriser par Critères

1. **Véhicules actifs** (status = 'active')
2. **Véhicules récents** (created_at DESC)
3. **Véhicules avec prix élevé** (meilleur ROI)
4. **Véhicules les plus consultés** (si tracking disponible)

---

## 🔄 Étape 5 : Calcul Automatique des CV Fiscaux

Le script SQL crée une fonction `calculate_fiscal_horsepower()` qui calcule automatiquement les CV fiscaux à partir de :
- `displacement_cc` (cylindrée)
- `fuel_type` (carburant)
- `euro_standard` (norme Euro)

**Le trigger `trigger_update_fiscal_horsepower`** met à jour automatiquement `fiscal_horsepower` quand ces champs changent.

**⚠️ Important :** La formule dans `calculate_fiscal_horsepower()` est simplifiée. Il faudra l'ajuster selon la formule officielle belge exacte.

---

## 📊 Étape 6 : Vérifier la Complétude

### Requête SQL pour Statistiques

```sql
-- Pourcentage de véhicules avec données fiscales complètes
SELECT 
  COUNT(*) FILTER (WHERE displacement_cc IS NOT NULL AND co2 IS NOT NULL) * 100.0 / COUNT(*) AS percentage_complete
FROM vehicles
WHERE status = 'active';

-- Pourcentage de véhicules avec données sportives complètes
SELECT 
  COUNT(*) FILTER (WHERE power_hp IS NOT NULL AND torque_nm IS NOT NULL AND drivetrain IS NOT NULL) * 100.0 / COUNT(*) AS percentage_complete
FROM vehicles
WHERE status = 'active';
```

---

## 🚀 Étape 7 : Mettre à Jour le Formulaire de Vente

Modifier `src/app/sell/page.tsx` pour inclure les nouveaux champs dans le formulaire :

1. **Nouvelle étape "Performance & Technique"** :
   - Cylindrée (displacement_cc) - **OBLIGATOIRE**
   - CO2 WLTP (co2_wltp) - **OBLIGATOIRE pour Flandre**
   - Couple (torque_nm)
   - Vitesse max (top_speed)
   - Transmission (drivetrain)
   - Configuration moteur (engine_configuration)
   - Nombre de cylindres (number_of_cylinders)
   - Régime de rupture (redline_rpm)

2. **Nouvelle étape "Détails Sportifs"** :
   - Édition limitée (limited_edition)
   - Nombre d'exemplaires (number_produced)
   - Héritage sportif (racing_heritage)
   - Modifications (modifications)
   - Prêt pour circuit (track_ready)

3. **Amélioration étape "Contact"** :
   - Région d'immatriculation (region_of_registration)
   - Date de première immatriculation (first_registration_date)
   - Garantie restante (warranty_remaining)

---

## ✅ Checklist de Vérification

- [ ] Script SQL exécuté sans erreur
- [ ] Types TypeScript mis à jour
- [ ] Formulaire de vente mis à jour
- [ ] Calcul automatique CV fiscaux fonctionne
- [ ] Vues SQL créées et testées
- [ ] Données existantes enrichies (au moins 10 véhicules de test)
- [ ] Interface admin permet d'éditer les nouveaux champs
- [ ] Calculateur de taxes utilise les nouveaux champs

---

## 📚 Ressources

- **Documentation Supabase** : https://supabase.com/docs
- **Formule CV fiscaux belge** : À rechercher dans la documentation officielle belge
- **APIs d'enrichissement** :
  - Edmunds API : https://developer.edmunds.com/
  - CarQuery API : https://www.carqueryapi.com/
  - NHTSA API : https://www.nhtsa.gov/vehicle-safety

---

## 🆘 Support

En cas de problème :
1. Vérifier les logs Supabase
2. Vérifier que les colonnes existent : `SELECT column_name FROM information_schema.columns WHERE table_name = 'vehicles';`
3. Vérifier que les triggers fonctionnent : `SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_fiscal_horsepower';`

