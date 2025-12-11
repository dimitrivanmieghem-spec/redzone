# 🚀 MODE HYBRIDE : Annonces Accessibles aux Invités

## ✅ **MODIFICATIONS RÉALISÉES**

### **1. DÉBLOCAGE FRONTEND**

#### **Middleware (`src/middleware.ts`)**
- ✅ Retiré `/sell` de la liste `protectedRoutes`
- ✅ La page `/sell` est maintenant accessible à tous (connectés ou non)

**Avant :**
```typescript
const protectedRoutes = ["/dashboard", "/sell", "/favorites"];
```

**Après :**
```typescript
const protectedRoutes = ["/dashboard", "/favorites"];
```

---

### **2. BASE DE DONNÉES & RLS**

#### **Script SQL (`supabase/enable_guest_ads.sql`)**

**Modifications de la table `vehicules` :**
- ✅ `user_id` rendu nullable (pour les invités)
- ✅ Ajout de la colonne `guest_email` (pour les invités)
- ✅ Contrainte : soit `user_id` soit `guest_email` doit être présent
- ✅ Ajout du statut `pending_validation` (pour les annonces d'invités)

**Nouvelles politiques RLS :**
- ✅ `"Authenticated users can insert vehicles"` - Utilisateurs connectés
- ✅ `"Anonymous users can insert vehicles as guests"` - **Invités autorisés**
  - Force automatiquement le statut à `pending_validation`
  - Nécessite `guest_email` non null
  - Empêche le spam en forçant la validation admin

**Statuts disponibles :**
- `pending` - Annonces membres (en attente)
- `pending_validation` - Annonces invités (validation obligatoire)
- `active` - Approuvées
- `rejected` - Rejetées

---

### **3. FONCTION DE CRÉATION**

#### **`src/lib/supabase/vehicules.ts` - `createVehicule()`**

**Signature modifiée :**
```typescript
export async function createVehicule(
  vehicule: Omit<VehiculeInsert, "id" | "user_id" | "status" | "created_at" | "guest_email">,
  userId: string | null = null,  // Optionnel
  guestEmail: string | null = null  // Obligatoire si userId est null
): Promise<string>
```

**Logique :**
- Si `userId` fourni → Statut `pending` (membre)
- Si `guestEmail` fourni → Statut `pending_validation` (invité)
- Validation : au moins un des deux doit être présent

---

### **4. PAGE `/sell` - GESTION DES INVITÉS**

#### **Validation étape 3**
- ✅ Email obligatoire **uniquement pour les invités**
- ✅ Si connecté : email optionnel (utilise `user.email` par défaut)

#### **Champ Email de contact**
- ✅ Affichage conditionnel :
  - **Invité** : `Email de contact *` (obligatoire)
  - **Membre** : `Email de contact (Optionnel - utilisera {email} par défaut)`
- ✅ Message d'aide adapté selon le statut

#### **Fonction `handleSubmit()`**
- ✅ Retiré la vérification `if (!user)` qui redirigeait vers login
- ✅ Vérification email pour les invités
- ✅ Appel à `createVehicule()` avec les bons paramètres :
  ```typescript
  createVehicule(vehiculeData, user?.id || null, user ? null : contactEmail)
  ```
- ✅ Messages de succès différents selon le statut
- ✅ Logging adapté (avec ou sans `user_id`)

---

### **5. UPLOAD DE FICHIERS**

#### **`src/lib/supabase/uploads.ts`**

**Fonctions modifiées :**
- ✅ `uploadImage()` - `userId` optionnel
- ✅ `uploadImages()` - `userId` optionnel
- ✅ `uploadAudio()` - `userId` optionnel

**Gestion des invités :**
- Utilise un UUID temporaire : `guest_{timestamp}_{random}`
- Permet l'upload même sans compte

**Modifications dans `src/app/sell/page.tsx` :**
- ✅ `handlePhotoInputChange()` - Retiré vérification `!user`
- ✅ `handleAudioInputChange()` - Retiré vérification `!user`
- ✅ Appels avec `user?.id || null`

---

## 📋 **INSTRUCTIONS DE DÉPLOIEMENT**

### **Étape 1 : Exécuter le Script SQL**

1. Ouvrez Supabase Dashboard > SQL Editor
2. Copiez-collez le contenu de `supabase/enable_guest_ads.sql`
3. Exécutez (F5)
4. Vérifiez les résultats :
   - ✅ Colonnes `user_id` et `guest_email` créées/modifiées
   - ✅ Politiques RLS créées (2 politiques INSERT)
   - ✅ Contrainte `check_user_or_guest` active

### **Étape 2 : Vérifier les Politiques RLS**

Exécutez cette requête pour vérifier :
```sql
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'vehicules'
  AND cmd = 'INSERT'
ORDER BY policyname;
```

**Résultat attendu :**
- `Authenticated users can insert vehicles`
- `Anonymous users can insert vehicles as guests`

### **Étape 3 : Tester le Formulaire**

**En tant qu'invité (non connecté) :**
1. Allez sur `/sell` (devrait être accessible)
2. Remplissez le formulaire
3. **Vérifiez** : Le champ "Email de contact" est marqué `*` (obligatoire)
4. Soumettez l'annonce
5. **Vérifiez** : Message "En attente de validation par l'admin"

**En tant que membre (connecté) :**
1. Connectez-vous
2. Allez sur `/sell`
3. Remplissez le formulaire
4. **Vérifiez** : Le champ "Email de contact" est optionnel
5. Soumettez l'annonce
6. **Vérifiez** : Message "En attente de validation par l'admin"

---

## 🔒 **SÉCURITÉ**

### **Protection Anti-Spam**

✅ **Statut automatique** : Les annonces d'invités sont automatiquement en `pending_validation`
✅ **Validation admin obligatoire** : Seuls les admins peuvent approuver les annonces d'invités
✅ **Pas de modification** : Les invités ne peuvent pas modifier leurs annonces après soumission
✅ **Email requis** : Les invités doivent fournir un email valide

### **RLS (Row Level Security)**

✅ **Lecture** : Seuls les admins peuvent voir les annonces `pending_validation`
✅ **Modification** : Seuls les admins peuvent modifier les annonces d'invités
✅ **Suppression** : Seuls les admins peuvent supprimer les annonces d'invités

---

## 📊 **FLUX DE TRAVAIL**

### **Annonce Membre (Connecté)**
1. Utilisateur connecté remplit le formulaire
2. Soumission → Statut `pending`
3. Admin peut approuver → Statut `active`

### **Annonce Invité (Non Connecté)**
1. Invité remplit le formulaire (email obligatoire)
2. Soumission → Statut `pending_validation`
3. Admin doit valider → Statut `active` ou `rejected`

---

## 🐛 **DÉPANNAGE**

### **Problème : "Email de contact requis" même si connecté**
- ✅ Vérifiez que `user` n'est pas `null` dans le composant
- ✅ Vérifiez que `useAuth()` retourne bien l'utilisateur

### **Problème : Erreur RLS lors de la soumission**
- ✅ Vérifiez que les politiques RLS sont bien créées
- ✅ Vérifiez que `guest_email` est bien fourni pour les invités
- ✅ Vérifiez que le statut est bien `pending_validation` pour les invités

### **Problème : Upload de photos ne fonctionne pas pour les invités**
- ✅ Vérifiez que les politiques Storage permettent l'upload aux `anon`
- ✅ Vérifiez que le folder `guest_*` est autorisé

---

## ✅ **CHECKLIST DE VÉRIFICATION**

- [ ] Script SQL `enable_guest_ads.sql` exécuté dans Supabase
- [ ] Politiques RLS vérifiées (2 politiques INSERT)
- [ ] Colonnes `user_id` et `guest_email` vérifiées
- [ ] Test formulaire en tant qu'invité (non connecté)
- [ ] Test formulaire en tant que membre (connecté)
- [ ] Upload de photos fonctionne pour les invités
- [ ] Messages de succès différents selon le statut
- [ ] Les annonces d'invités sont bien en `pending_validation`

---

## 📝 **FICHIERS MODIFIÉS**

1. ✅ `src/middleware.ts` - Route `/sell` rendue publique
2. ✅ `supabase/enable_guest_ads.sql` - Script SQL (nouveau)
3. ✅ `src/lib/supabase/vehicules.ts` - Fonction `createVehicule()` adaptée
4. ✅ `src/lib/supabase/uploads.ts` - Uploads adaptés pour invités
5. ✅ `src/app/sell/page.tsx` - Gestion complète des invités

---

## 🚀 **PROCHAINES ÉTAPES (OPTIONNEL)**

- [ ] Ajouter un système de notification email pour les invités
- [ ] Permettre aux invités de suivre leur annonce via un lien unique
- [ ] Ajouter un système de limitation (max X annonces par email/jour)
- [ ] Créer une page admin pour gérer les annonces `pending_validation`

---

**✅ MODE HYBRIDE IMPLÉMENTÉ AVEC SUCCÈS !**

