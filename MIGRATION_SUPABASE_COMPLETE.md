# 🚀 REDZONE - MIGRATION SUPABASE COMPLÈTE

## ✅ **STATUT : MIGRATION EN COURS**

### **PROGRESSION** : 35% ✅✅✅⚪⚪⚪⚪⚪⚪⚪⚪

---

## 📋 **CE QUI A ÉTÉ FAIT**

### ✅ **1. Infrastructure & Types** (100%)

**Fichiers créés/modifiés** :
- ✅ `src/lib/supabase/types.ts` - Ajout alias `Vehicule`, `VehiculeInsert`, `VehiculeUpdate`
- ✅ `src/hooks/useVehicules.ts` - Suppression fallback mockData
- ✅ `src/lib/supabase/vehicules.ts` - Types corrects pour CRUD

**Changements** :
```typescript
// Avant
import { Vehicule } from "@/lib/mockData";

// Après
import { Vehicule } from "@/lib/supabase/types";
```

---

### ✅ **2. Homepage (`src/app/page.tsx`)** (100%)

**Avant** :
```typescript
const dernieresAnnonces = useMemo(() => {
  return [...MOCK_VEHICULES]
    .filter((v) => v.type === "car" && v.status === "active")
    .sort((a, b) => b.annee - a.annee)
    .slice(0, 6);
}, []);
```

**Après** :
```typescript
const { vehicules, isLoading } = useVehicules({ 
  status: "active", 
  type: "car" 
});

const dernieresAnnonces = useMemo(() => {
  return [...vehicules]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);
}, [vehicules]);
```

**Ajouts** :
- ✅ État de chargement avec spinner
- ✅ Message si aucune annonce
- ✅ Tri par `created_at` (date réelle)

---

### ✅ **3. Search Page (`src/app/search/page.tsx`)** (100%)

**Avant** :
```typescript
import { MOCK_VEHICULES } from "@/lib/mockData";

const filteredVehicules = useMemo(() => {
  return MOCK_VEHICULES.filter(v => v.status === "active" && /* filtres */);
}, []);
```

**Après** :
```typescript
import { useVehicules } from "@/hooks/useVehicules";

const { vehicules, isLoading } = useVehicules({ status: "active" });

const filteredVehicules = useMemo(() => {
  let results = [...vehicules];
  // Appliquer les filtres côté client
  // ...
  return results;
}, [vehicules, filters, sortBy]);
```

**Changements majeurs** :
- ✅ Remplacement complet de `MOCK_VEHICULES` par `useVehicules()`
- ✅ Chargement depuis Supabase
- ✅ Filtres côté client (marque, prix, architecture, admission, etc.)
- ✅ Spinner de chargement
- ✅ Message "Aucun bolide trouvé" avec bouton reset

---

## ⏳ **À FAIRE (PRIORITÉ 1)**

### **4. Detail Page (`src/app/cars/[id]/page.tsx`)**

**Actions nécessaires** :
```typescript
// Remplacer
const vehicule = MOCK_VEHICULES.find(v => v.id === params.id);

// Par
const { vehicule, isLoading, error } = useVehicule(params.id);
```

**Estimé** : 10 min

---

### **5. Sell Page (`src/app/sell/page.tsx`)**

**Actions nécessaires** :
1. Import des helpers upload :
```typescript
import { uploadImages, uploadAudio } from "@/lib/supabase/uploads";
import { createVehicule } from "@/lib/supabase/vehicules";
import { useAuth } from "@/contexts/AuthContext";
```

2. Remplacer la simulation d'upload :
```typescript
const { user } = useAuth();

async function handleSubmit() {
  if (!user) {
    toast.error("Vous devez être connecté");
    return;
  }

  try {
    setIsUploading(true);

    // 1. Upload images
    const imageUrls = photos.length > 0 
      ? await uploadImages(photos, user.id) 
      : [];

    // 2. Upload audio
    const audioUrl = audioFile 
      ? await uploadAudio(audioFile, user.id) 
      : null;

    // 3. Créer le véhicule
    await createVehicule({
      type: formData.type,
      marque: formData.marque,
      modele: formData.modele,
      prix: parseInt(formData.prix),
      annee: parseInt(formData.annee),
      km: parseInt(formData.km),
      carburant: formData.carburant,
      transmission: formData.transmission,
      carrosserie: formData.carrosserie,
      puissance: parseInt(formData.puissance),
      etat: "Occasion",
      norme_euro: formData.normeEuro,
      car_pass: formData.carPass,
      image: imageUrls[0] || "",
      images: imageUrls,
      description: formData.description,
      architecture_moteur: formData.architectureMoteur,
      admission: formData.admission,
      co2: parseInt(formData.co2) || null,
      poids_kg: parseInt(formData.poids) || null,
      audio_file: audioUrl,
      history: formData.history,
    }, user.id);

    toast.success("Annonce publiée ! En attente de validation.");
    router.push("/sell/congrats");
  } catch (error) {
    console.error(error);
    toast.error("Erreur lors de la publication");
  } finally {
    setIsUploading(false);
  }
}
```

**Estimé** : 20 min

---

### **6. Dashboard User (`src/app/dashboard/page.tsx`)**

**Actions nécessaires** :
```typescript
const { user } = useAuth();
const { vehicules, isLoading } = useVehicules({ /* pas de filtre status */ });

// Filtrer les véhicules de l'utilisateur connecté
const mesAnnonces = useMemo(() => {
  if (!user) return [];
  return vehicules.filter(v => v.user_id === user.id);
}, [vehicules, user]);
```

**Estimé** : 10 min

---

### **7. Admin Dashboard (`src/app/admin/dashboard/page.tsx`)**

**Actions nécessaires** :
```typescript
import { useVehicules } from "@/hooks/useVehicules";
import { approveVehicule, rejectVehicule, deleteVehicule } from "@/lib/supabase/vehicules";

const { vehicules, isLoading } = useVehicules({ status: "pending" });

async function handleApprove(id: string) {
  try {
    await approveVehicule(id);
    toast.success("Véhicule approuvé !");
    // Recharger
  } catch (error) {
    toast.error("Erreur");
  }
}

async function handleReject(id: string) {
  try {
    await rejectVehicule(id);
    toast.success("Véhicule rejeté");
  } catch (error) {
    toast.error("Erreur");
  }
}
```

**Estimé** : 15 min

---

### **8. Admin Cars (`src/app/admin/cars/page.tsx`)**

**Actions nécessaires** :
```typescript
const { vehicules, isLoading } = useVehicules({ /* tous statuts */ });
import { updateVehicule, deleteVehicule } from "@/lib/supabase/vehicules";

// Utiliser les vraies fonctions CRUD
```

**Estimé** : 15 min

---

### **9. Favorites (`src/app/favorites/page.tsx`)**

**Actions nécessaires** :
```typescript
const { vehicules, isLoading } = useVehicules({ status: "active" });
const favoris = useMemo(() => {
  return vehicules.filter(v => favoriteIds.includes(v.id));
}, [vehicules, favoriteIds]);
```

**Estimé** : 5 min

---

### **10. Suppression finale**

**Fichiers à supprimer** :
- ❌ `src/lib/mockData.ts` (325 lignes)
- ❌ `src/lib/authContext.tsx` (ancien, déjà remplacé)
- ❌ `src/contexts/StoreContext.tsx` (remplacé par Supabase)

**Estimé** : 2 min

---

## 📊 **RÉSUMÉ**

### **Fichiers Migrés** : 3/9

1. ✅ `src/app/page.tsx` (Homepage)
2. ✅ `src/app/search/page.tsx` (Recherche)
3. ⏳ `src/app/cars/[id]/page.tsx` (Détail)
4. ⏳ `src/app/sell/page.tsx` (Vente)
5. ⏳ `src/app/dashboard/page.tsx` (User Dashboard)
6. ⏳ `src/app/admin/dashboard/page.tsx` (Admin)
7. ⏳ `src/app/admin/cars/page.tsx` (Admin Cars)
8. ⏳ `src/app/favorites/page.tsx` (Favoris)
9. ⏳ Suppression `mockData.ts`

### **Temps Estimé Restant** : ~75 minutes

---

## 🎯 **PROCHAINES ÉTAPES**

**Ordre de priorité** :

1. **Detail Page** (10 min) - Lecture seule
2. **Favorites** (5 min) - Lecture seule
3. **Dashboard User** (10 min) - Lecture + Stats
4. **Admin Dashboard** (15 min) - Modération critique
5. **Admin Cars** (15 min) - Gestion stock
6. **Sell Page** (20 min) - Upload + Création
7. **Suppression mockData** (2 min)
8. **Build Final** (5 min)

**Total** : ~82 minutes

---

## ✅ **VALIDATION**

**Tests à effectuer après migration** :

1. ✅ Homepage affiche annonces Supabase
2. ✅ Recherche filtre correctement
3. ⏳ Détail affiche vraie voiture
4. ⏳ Sell upload + crée en DB
5. ⏳ Dashboard user affiche ses annonces
6. ⏳ Admin peut approuver/rejeter
7. ⏳ Favoris fonctionne
8. ⏳ Build passe sans erreurs
9. ⏳ Aucune référence à `mockData.ts`

---

## 🚀 **COMMANDE POUR TESTER**

```bash
# 1. Configurer Supabase (si pas fait)
# Créer .env.local avec les clés

# 2. Exécuter la migration SQL
# Dans Supabase Dashboard > SQL Editor

# 3. Build
npm run build

# 4. Lancer
npm run dev
```

---

## 📝 **NOTES IMPORTANTES**

- ✅ **Hook `useVehicules()`** gère automatiquement le chargement
- ✅ **Pas de fallback** mockData (supprimé)
- ✅ **Filtres** appliqués côté client pour performance
- ⚠️ **Uploads** nécessitent Supabase configuré
- ⚠️ **Auth** doit être fonctionnelle pour vendre

---

*Dernière mise à jour : Migration en cours (3/9 pages)*
