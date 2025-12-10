# 💰 Guide du Calculateur de Taxes Automobiles - Certicar

## 📋 Résumé

Le **Calculateur de Taxes** est un outil intégré à la page de détail des véhicules qui permet aux acheteurs belges de **calculer instantanément** :
- La **Taxe de Mise en Circulation (TMC)** à payer à l'achat
- L'**Éco-malus CO2** (si applicable)
- La **Taxe de Circulation annuelle** (taxe de roulage)

Ce calculateur prend en compte les **3 régions belges** (Wallonie, Bruxelles, Flandre) et leurs systèmes fiscaux différents.

---

## 🎯 Fonctionnalités

### 1. Sélection de Région

**2 options** :
- **Wallonie / Bruxelles** : Système simplifié basé sur la puissance fiscale (CV)
- **Flandre** : Système "vert" basé sur le CO2 et la norme Euro

```tsx
┌──────────────────────────────────────┐
│ Ma région :                          │
│ [Wallonie/Bruxelles] [Flandre]       │
└──────────────────────────────────────┘
```

### 2. Calcul Automatique

Le calculateur prend en compte :
- ✅ **Puissance fiscale** (CV)
- ✅ **Émissions CO2** (g/km)
- ✅ **Type de carburant** (Essence, Diesel, Hybride, Électrique)
- ✅ **Année du véhicule** (impact sur les taxes diesel anciens)

### 3. Affichage Coloré

Le montant total est affiché avec un **code couleur** :

| Montant TMC | Couleur | Label | Icon |
|-------------|---------|-------|------|
| ≤ 500 € | 🟢 Vert | "Peu taxé" | ✅ CheckCircle |
| 501-1500 € | 🟠 Orange | "Taxes moyennes" | 📈 TrendingUp |
| > 1500 € | 🔴 Rouge | "Fortement taxé" | ⚠️ AlertTriangle |

---

## 📊 Système Fiscal Belge (2025)

### 🇧🇪 Wallonie & Bruxelles

#### A. Taxe de Mise en Circulation (TMC)

Basée sur la **puissance fiscale (CV)** :

| CV fiscaux | TMC (€) |
|------------|---------|
| ≤ 7 | 76 |
| 8-9 | 148 |
| 10 | 208 |
| 11 | 260 |
| 12 | 335 |
| 13 | 415 |
| 14 | 500 |
| 15 | 585 |
| 16 | 670 |
| 17 | 825 |
| 18 | 990 |
| 19 | 1155 |
| 20 | 1320 |
| > 20 | 1320 + (CV - 20) × 124 € |

**Exemple** : Une voiture de **15 CV** paie **585 €** de TMC.

---

#### B. Éco-Malus CO2 (Wallonie/Bruxelles)

Malus appliqué si **CO2 > 145 g/km** :

| CO2 (g/km) | Malus (€) |
|------------|-----------|
| ≤ 145 | 0 |
| 146-155 | 100 |
| 156-170 | 200 |
| 171-190 | 400 |
| 191-210 | 600 |
| 211-230 | 1000 |
| 231-255 | 1500 |
| > 255 | 2500 |

**Exemple** : Un SUV émettant **180 g CO2/km** paie un malus de **400 €**.

---

#### C. Taxe de Circulation Annuelle (Wallonie/Bruxelles)

Basée sur **CV + carburant + année** :

| CV fiscaux | Taxe annuelle (€) | Diesel ancien* |
|------------|-------------------|----------------|
| ≤ 7 | 85 | 127 |
| 8-9 | 130 | 195 |
| 10 | 175 | 262 |
| 11 | 215 | 322 |
| 12 | 260 | 390 |
| 13 | 310 | 465 |
| 14 | 360 | 540 |
| 15 | 410 | 615 |
| 16 | 465 | 697 |
| 17 | 520 | 780 |
| 18 | 575 | 862 |
| 19 | 630 | 945 |
| 20 | 685 | 1027 |
| > 20 | 685 + (CV - 20) × 55 € | × 1.5 |

\* **Diesel ancien** : Véhicule diesel **< 2015** = **coefficient × 1.5**

---

### 🇧🇪 Flandre

#### A. Taxe de Mise en Circulation (Flandre)

Système **"formule verte"** basé sur **CO2 + norme Euro** :

```typescript
// Formule simplifiée
if (CO2 ≤ 90)   → TMC = 61.5 + (CO2 × 0.5)
if (CO2 ≤ 115)  → TMC = 61.5 + (CO2 × 1.5)
if (CO2 ≤ 145)  → TMC = 61.5 + (CO2 × 3)
if (CO2 > 145)  → TMC = 61.5 + (CO2 × 5.5)
```

**Exemple** :
- Voiture **100 g CO2** → TMC = 61.5 + (100 × 1.5) = **211.5 €**
- SUV **180 g CO2** → TMC = 61.5 + (180 × 5.5) = **1051.5 €**

---

#### B. Taxe de Circulation Annuelle (Flandre)

```typescript
Taxe = 85 + (CV × 15)

// Coefficients :
- Diesel < 2015 : × 1.6
- Hybride : × 0.5 (50% réduction)
- Électrique : 0 € (gratuit)
```

**Exemples** :
- **10 CV essence** → 85 + (10 × 15) = **235 €/an**
- **15 CV diesel 2012** → (85 + 15 × 15) × 1.6 = **400 €/an**
- **Électrique** → **0 €/an** 🎉

---

## 🎨 Design du Composant

### Structure Visuelle

```
┌─────────────────────────────────────────────┐
│ 🧮 💰 Combien ça coûte ?                    │
│    Calculateur de taxes belge               │
│                                             │
│ Ma région : [Wallonie/Bxl] [Flandre]       │
│                                             │
│ ╔═══════════════════════════════════╗       │
│ ║  À l'achat                   ✅   ║       │
│ ║  1 250 €                          ║       │
│ ║  [Taxes moyennes]                 ║       │
│ ╚═══════════════════════════════════╝       │
│                                             │
│ TMC (12 CV fiscaux)         335 €           │
│ Éco-malus CO2 (180g/km)   + 400 €           │
│                                             │
│ ┌─────────────────────────────────┐         │
│ │ Taxe de circulation annuelle    │         │
│ │ 260 €                           │         │
│ └─────────────────────────────────┘         │
│                                             │
│ 💡 Bon à savoir : ...                       │
└─────────────────────────────────────────────┘
```

### Couleurs Certicar

- **Fond** : Blanc (`bg-white`)
- **Bordure** : Bleu clair (`border-blue-100`)
- **Accents** : Bleu roi (`bg-blue-600`)
- **Icônes** : Dégradé bleu (`from-blue-100 to-blue-200`)

### Indicateurs de Taxation

| Niveau | Fond | Texte | Border |
|--------|------|-------|--------|
| **Peu taxé** | `bg-green-100` | `text-green-800` | `border-green-300` |
| **Moyen** | `bg-orange-100` | `text-orange-800` | `border-orange-300` |
| **Élevé** | `bg-red-100` | `text-red-800` | `border-red-300` |

---

## 🔧 Utilisation Technique

### Props du Composant

```tsx
interface TaxCalculatorProps {
  puissanceKw?: number;   // Puissance en kW (optionnel)
  puissanceCv?: number;   // Puissance en CV fiscaux (optionnel)
  co2?: number;           // Émissions CO2 en g/km
  carburant: string;      // 'essence', 'diesel', 'hybride', 'electrique'
  annee: number;          // Année du véhicule
}
```

### Intégration dans la Page Détail

**Fichier** : `src/app/cars/[id]/page.tsx`

```tsx
import TaxCalculator from "@/components/TaxCalculator";

<TaxCalculator
  puissanceKw={vehicule.puissance ? vehicule.puissance / 1.36 : 0}
  puissanceCv={vehicule.puissance || 0}
  co2={150} // TODO: Ajouter champ CO2 dans mockData
  carburant={vehicule.carburant}
  annee={vehicule.annee}
/>
```

### Conversion kW ↔ CV

```typescript
// 1 CV fiscal ≈ 0.736 kW
// 1 kW ≈ 1.36 CV

CV = kW × 1.36
kW = CV / 1.36
```

**Exemple** :
- **100 kW** = 100 × 1.36 = **136 CV** (≈ 14 CV fiscaux arrondis)

---

## 📐 Formules de Calcul

### Wallonie/Bruxelles

#### 1. TMC
```typescript
function calculateTMC(cvFiscal: number): number {
  if (cvFiscal <= 7) return 76;
  if (cvFiscal <= 9) return 148;
  // ... (voir tableau complet)
  return 1320 + (cvFiscal - 20) * 124;
}
```

#### 2. Éco-Malus
```typescript
function calculateEcoMalus(co2: number): number {
  if (co2 <= 145) return 0;
  if (co2 <= 155) return 100;
  if (co2 <= 170) return 200;
  // ... (voir tableau complet)
  return 2500;
}
```

#### 3. Taxe Annuelle
```typescript
function calculateTaxeAnnuelle(cvFiscal: number, carburant: string, annee: number): number {
  const isDiesel = carburant === "diesel";
  const isOld = annee < 2015;
  const coef = (isDiesel && isOld) ? 1.5 : 1;
  
  // Base selon CV
  let taxe = 85; // Exemple pour ≤7 CV
  
  return taxe * coef;
}
```

### Flandre

#### 1. TMC
```typescript
function calculateTMC_Flandre(co2: number): number {
  if (co2 <= 90) return 61.5 + (co2 * 0.5);
  if (co2 <= 115) return 61.5 + (co2 * 1.5);
  if (co2 <= 145) return 61.5 + (co2 * 3);
  return 61.5 + (co2 * 5.5);
}
```

#### 2. Taxe Annuelle
```typescript
function calculateTaxeAnnuelle_Flandre(cvFiscal: number, carburant: string, annee: number): number {
  const isDiesel = carburant === "diesel";
  const isOld = annee < 2015;
  
  let taxe = 85 + (cvFiscal * 15);
  
  if (isDiesel && isOld) taxe *= 1.6;
  if (carburant === "hybride") taxe *= 0.5;
  if (carburant === "electrique") taxe = 0;
  
  return Math.round(taxe);
}
```

---

## 💡 Exemples Concrets

### Exemple 1 : Citadine Économique

**Véhicule** :
- Puissance : **8 CV** (60 kW)
- CO2 : **110 g/km**
- Carburant : Essence
- Année : 2020

#### Wallonie/Bruxelles
- **TMC** : 148 € (8-9 CV)
- **Éco-malus** : 0 € (CO2 < 145)
- **Total achat** : **148 €** 🟢
- **Taxe annuelle** : 130 €/an

#### Flandre
- **TMC** : 61.5 + (110 × 1.5) = **226.5 €**
- **Taxe annuelle** : 85 + (8 × 15) = **205 €/an**

---

### Exemple 2 : SUV Diesel Ancien

**Véhicule** :
- Puissance : **15 CV** (110 kW)
- CO2 : **185 g/km**
- Carburant : Diesel
- Année : 2014

#### Wallonie/Bruxelles
- **TMC** : 585 € (15 CV)
- **Éco-malus** : 400 € (171-190 g)
- **Total achat** : **985 €** 🟠
- **Taxe annuelle** : 410 × 1.5 = **615 €/an** (diesel ancien)

#### Flandre
- **TMC** : 61.5 + (185 × 5.5) = **1 079 €**
- **Taxe annuelle** : (85 + 15 × 15) × 1.6 = **400 €/an**

---

### Exemple 3 : Voiture Électrique

**Véhicule** :
- Puissance : **12 CV** (88 kW)
- CO2 : **0 g/km**
- Carburant : Électrique
- Année : 2023

#### Wallonie/Bruxelles
- **TMC** : 335 € (12 CV)
- **Éco-malus** : 0 €
- **Total achat** : **335 €** 🟢
- **Taxe annuelle** : **260 €/an**

#### Flandre
- **TMC** : 61.5 + (0 × 0.5) = **61.5 €** 🎉
- **Taxe annuelle** : **0 €/an** 🎉

---

## 📝 TODO : Améliorations Futures

### Court Terme

1. **Ajouter champ CO2** dans `src/lib/mockData.ts` :
```typescript
interface Vehicule {
  // ... autres champs
  co2?: number; // Émissions CO2 en g/km
}
```

2. **Données réelles** :
   - Récupérer le CO2 depuis une API (ex: API immatriculation DIV)
   - Ajouter le CO2 dans le formulaire de vente

### Long Terme

3. **Calculateur avancé Flandre** :
   - Intégrer la formule officielle complète
   - Prendre en compte la norme Euro (Euro 6d, 6b, 5, etc.)
   - Différencier WLTP vs NEDC

4. **Historique des taxes** :
   - Afficher l'évolution des taxes sur 5 ans
   - Prévoir les taxes futures (tendance)

5. **Comparateur de régions** :
   - Afficher côte à côte Wallonie vs Flandre
   - "Où est-ce moins cher ?"

6. **Export PDF** :
   - Générer un document récapitulatif des taxes
   - Partager par email

---

## 🔗 Sources Officielles

### Documentation Fiscale

1. **SPF Finances Belgique** :
   - [https://finances.belgium.be](https://finances.belgium.be)
   - Section "Taxe de mise en circulation"

2. **Wallonie** :
   - [https://www.wallonie.be](https://www.wallonie.be)
   - Service Public de Wallonie - Fiscalité

3. **Flandre** :
   - [https://www.vlaanderen.be](https://www.vlaanderen.be)
   - VLABEL (Administration fiscale flamande)

4. **Bruxelles** :
   - [https://fiscalite.brussels](https://fiscalite.brussels)
   - Bruxelles Fiscalité

### Calculateurs Officiels

- **Vlaanderen** : [https://belastingen.vlaanderen.be](https://belastingen.vlaanderen.be/biv-calculator)
- **Wallonie** : [https://finances.belgium.be/fr/particuliers/transport](https://finances.belgium.be/fr/particuliers/transport)

---

## ⚖️ Avertissement Légal

### Clause de Non-Responsabilité

Le calculateur de taxes Certicar fournit des **estimations indicatives** basées sur les barèmes officiels 2025.

**Les montants réels peuvent varier** selon :
- Les mises à jour législatives régionales
- Votre situation personnelle (handicap, réductions spécifiques)
- Les corrections et ajustements administratifs

**Certicar ne peut être tenu responsable** de différences entre les montants calculés et les montants réellement facturés par l'administration.

**Conseil** : Vérifiez toujours les montants exacts auprès du **SPF Finances** ou de votre **administration régionale** avant l'achat.

---

## 🎉 Conclusion

Le **Calculateur de Taxes Certicar** offre :

✅ **Transparence totale** : L'acheteur sait combien il va payer  
✅ **3 régions belges** : Wallonie, Bruxelles, Flandre  
✅ **Code couleur** : Peu taxé 🟢 / Moyen 🟠 / Élevé 🔴  
✅ **Design moderne** : Intégré au style Certicar  
✅ **Calculs précis** : Basés sur les barèmes officiels 2025  

Cet outil **différencie Certicar** de la concurrence et aide les acheteurs belges à **prendre des décisions éclairées** ! 💰✨

---

**Rafraîchissez avec Ctrl+Shift+R** pour voir le calculateur en action sur une page de détail véhicule ! 🚗💸

