# 🔔 PLAN D'INTÉGRATION DES NOTIFICATIONS - REDZONE

## 📋 Vue d'ensemble

Ce document présente un plan complet pour intégrer le système de notifications existant dans toutes les fonctionnalités du site RedZone, créant une expérience utilisateur cohérente et engageante.

---

## ✅ **NOTIFICATIONS DÉJÀ IMPLÉMENTÉES**

### 1. **Modération Véhicules** ✓
- ✅ **Annonce validée** : Notification à l'utilisateur quand son annonce est approuvée
- ✅ **Annonce refusée** : Notification avec motif de refus

### 2. **Système de Tickets** ✓
- ✅ **Nouveau ticket** : Notification admin/moderator
- ✅ **Réponse admin** : Notification utilisateur
- ✅ **Réponse utilisateur** : Notification admin/moderator
- ✅ **Ticket résolu/clôturé** : Notification utilisateur
- ✅ **Ticket réassigné** : Notification au nouvel assigné

---

## 🎯 **PROPOSITIONS D'INTÉGRATION PAR FONCTIONNALITÉ**

### **1. GESTION UTILISATEURS (Admin)**

#### **1.1 Bannissement/Débannissement**
**Fichier** : `src/lib/supabase/server-actions/users.ts`

**Notifications à ajouter** :
```typescript
// Quand un utilisateur est banni
await createNotification(
  userId,
  "Compte suspendu",
  `Votre compte a été suspendu. Raison : ${reason}${banUntil ? ` Jusqu'au ${formatDate(banUntil)}` : ' (permanent)'}`,
  "error",
  "/dashboard",
  { action: "ban", reason, ban_until: banUntil }
);

// Quand un utilisateur est débanni
await createNotification(
  userId,
  "Compte réactivé",
  "Votre compte a été réactivé. Vous pouvez à nouveau utiliser RedZone.",
  "success",
  "/dashboard",
  { action: "unban" }
);
```

**Bénéfices** :
- Transparence pour l'utilisateur
- Réduction des demandes de support ("Pourquoi suis-je banni ?")
- Meilleure communication

---

#### **1.2 Suppression de compte**
**Fichier** : `src/lib/supabase/server-actions/users.ts`

**Notification à ajouter** :
```typescript
// Avant suppression (si possible) ou notification aux admins
// Noter : L'utilisateur sera supprimé, donc pas de notification directe
// Mais on peut notifier les autres admins
await createNotification(
  adminId, // Autre admin
  "Compte utilisateur supprimé",
  `L'utilisateur ${userEmail} a été supprimé par ${currentAdminEmail}`,
  "info",
  "/admin/users",
  { action: "user_deleted", deleted_user_id: userId }
);
```

---

### **2. GESTION DES VÉHICULES**

#### **2.1 Modification de prix** ⭐ PRIORITÉ HAUTE
**Fichier** : `src/lib/supabase/server-actions/vehicules.ts` (fonction `updateVehicule`)

**Notification à ajouter** :
```typescript
// Détecter si le prix a changé
const oldVehicule = await getVehiculeById(id);
if (oldVehicule && updates.price && updates.price !== oldVehicule.price) {
  const priceDiff = updates.price - oldVehicule.price;
  const priceDiffPercent = ((priceDiff / oldVehicule.price) * 100).toFixed(1);
  
  // Notifier le propriétaire
  await createNotification(
    oldVehicule.owner_id,
    "Prix modifié",
    `Le prix de votre ${oldVehicule.brand} ${oldVehicule.model} a été modifié de ${oldVehicule.price.toLocaleString()}€ à ${updates.price.toLocaleString()}€ (${priceDiff > 0 ? '+' : ''}${priceDiffPercent}%)`,
    "info",
    `/cars/${id}`,
    { vehicule_id: id, action: "price_update", old_price: oldVehicule.price, new_price: updates.price }
  );
  
  // Notifier les utilisateurs qui ont ce véhicule en favoris (si système favoris en DB)
  // Voir section 3.1
}
```

**Bénéfices** :
- L'utilisateur est informé des changements sur ses annonces
- Transparence totale

---

#### **2.2 Suppression de véhicule**
**Fichier** : `src/lib/supabase/server-actions/vehicules.ts` (fonction `deleteVehicule`)

**Notification à ajouter** :
```typescript
// Récupérer les infos avant suppression
const vehicule = await getVehiculeById(id);

// Notifier le propriétaire
if (vehicule && vehicule.owner_id) {
  await createNotification(
    vehicule.owner_id,
    "Annonce supprimée",
    `Votre annonce ${vehicule.brand} ${vehicule.model} a été supprimée.`,
    "info",
    "/dashboard",
    { vehicule_id: id, action: "delete" }
  );
}
```

---

#### **2.3 Nouveau véhicule similaire** ⭐ PRIORITÉ HAUTE
**Fichier** : `src/lib/supabase/server-actions/vehicules.ts` (fonction `approveVehicule`)

**Notification à ajouter** :
```typescript
// Après approbation, notifier les utilisateurs qui ont des véhicules similaires en favoris
const similarVehicules = await supabase
  .from("vehicles")
  .select("owner_id")
  .eq("brand", vehicule.brand)
  .eq("model", vehicule.model)
  .eq("status", "active")
  .neq("id", id);

// Notifier chaque propriétaire d'un véhicule similaire
for (const similar of similarVehicules.data || []) {
  if (similar.owner_id && similar.owner_id !== vehicule.owner_id) {
    await createNotification(
      similar.owner_id,
      "Nouveau véhicule similaire",
      `Un nouveau ${vehicule.brand} ${vehicule.model} vient d'être ajouté au Showroom !`,
      "info",
      `/cars/${id}`,
      { vehicule_id: id, action: "similar_vehicle", your_vehicule_id: similar.id }
    );
  }
}
```

**Bénéfices** :
- Encourage la comparaison
- Augmente l'engagement
- Aide les vendeurs à ajuster leurs prix

---

### **3. SYSTÈME DE FAVORIS** ⭐ PRIORITÉ HAUTE

#### **3.1 Baisse de prix sur un favori**
**Fichier** : `src/lib/supabase/server-actions/vehicules.ts` (fonction `updateVehicule`)

**Prérequis** : Migrer les favoris du localStorage vers la base de données

**Table à créer** :
```sql
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id)
);
```

**Notification à ajouter** :
```typescript
// Quand le prix baisse sur un véhicule en favoris
if (oldVehicule && updates.price && updates.price < oldVehicule.price) {
  const priceDrop = oldVehicule.price - updates.price;
  const priceDropPercent = ((priceDrop / oldVehicule.price) * 100).toFixed(1);
  
  // Récupérer tous les utilisateurs qui ont ce véhicule en favoris
  const { data: favorites } = await supabase
    .from("favorites")
    .select("user_id")
    .eq("vehicle_id", id);
  
  // Notifier chaque utilisateur
  for (const favorite of favorites || []) {
    await createNotification(
      favorite.user_id,
      "💰 Prix réduit sur un favori !",
      `Le ${oldVehicule.brand} ${oldVehicule.model} que vous suivez a baissé de ${priceDrop.toLocaleString()}€ (${priceDropPercent}%) ! Nouveau prix : ${updates.price.toLocaleString()}€`,
      "success",
      `/cars/${id}`,
      { vehicule_id: id, action: "price_drop", old_price: oldVehicule.price, new_price: updates.price, drop_amount: priceDrop }
    );
  }
}
```

**Bénéfices** :
- Augmente les conversions
- Encourage les utilisateurs à utiliser les favoris
- Crée de l'urgence

---

#### **3.2 Véhicule favori vendu/supprimé**
**Fichier** : `src/lib/supabase/server-actions/vehicules.ts` (fonction `deleteVehicule` ou changement de statut)

**Notification à ajouter** :
```typescript
// Quand un véhicule en favoris est supprimé ou vendu
const { data: favorites } = await supabase
  .from("favorites")
  .select("user_id")
  .eq("vehicle_id", id);

for (const favorite of favorites || []) {
  await createNotification(
    favorite.user_id,
    "Véhicule favori indisponible",
    `Le ${vehicule.brand} ${vehicule.model} que vous suiviez n'est plus disponible.`,
    "info",
    "/favorites",
    { vehicule_id: id, action: "favorite_unavailable" }
  );
}
```

---

### **4. SYSTÈME DE CONTACT/MESSAGERIE** (Si implémenté)

#### **4.1 Nouveau message**
**Fichier** : À créer dans `src/app/actions/messages.ts`

**Notification à ajouter** :
```typescript
await createNotification(
  recipientId,
  "Nouveau message",
  `${senderName} vous a envoyé un message concernant ${vehiculeBrand} ${vehiculeModel}`,
  "info",
  `/messages/${conversationId}`,
  { conversation_id: conversationId, sender_id: senderId, vehicule_id: vehiculeId }
);
```

---

### **5. COMMENTAIRES** (Si système de commentaires existe)

#### **5.1 Nouveau commentaire sur votre annonce**
**Fichier** : `src/lib/supabase/server-actions/comments.ts`

**Notification à ajouter** :
```typescript
await createNotification(
  vehiculeOwnerId,
  "Nouveau commentaire",
  `${commenterName} a commenté votre ${vehicule.brand} ${vehicule.model}`,
  "info",
  `/cars/${vehiculeId}#comments`,
  { comment_id: commentId, vehicule_id: vehiculeId, commenter_id: commenterId }
);
```

---

### **6. PROFIL UTILISATEUR**

#### **6.1 Modification de profil**
**Fichier** : `src/app/actions/profile.ts`

**Notification à ajouter** (optionnel, pour confirmation) :
```typescript
await createNotification(
  userId,
  "Profil mis à jour",
  "Vos informations de profil ont été mises à jour avec succès.",
  "success",
  "/dashboard?tab=settings",
  { action: "profile_update" }
);
```

---

### **7. SYSTÈME D'ALERTES PRIX (Sentinelle)** ⭐ PRIORITÉ HAUTE

#### **7.1 Alerte prix déclenchée**
**Fichier** : À créer dans `src/app/actions/sentinelle.ts`

**Notification à ajouter** :
```typescript
// Quand un véhicule correspond aux critères de recherche d'un utilisateur
await createNotification(
  userId,
  "🔔 Alerte Sentinelle",
  `Un ${vehicule.brand} ${vehicule.model} correspond à vos critères ! Prix : ${vehicule.price.toLocaleString()}€`,
  "success",
  `/cars/${vehiculeId}`,
  { vehicule_id: vehiculeId, action: "sentinelle_match", criteria: sentinelleCriteria }
);
```

**Bénéfices** :
- Fonctionnalité premium très engageante
- Augmente les conversions
- Justifie l'abonnement PRO

---

### **8. ADMIN - NOUVELLES ANNONCES EN ATTENTE**

#### **8.1 Nouvelle annonce à modérer**
**Fichier** : `src/lib/supabase/server-actions/vehicules.ts` (fonction `createVehicule`)

**Notification à ajouter** :
```typescript
// Notifier tous les admins et modérateurs
const { data: admins } = await supabase
  .from("profiles")
  .select("id")
  .in("role", ["admin", "moderator"]);

for (const admin of admins || []) {
  await createNotification(
    admin.id,
    "Nouvelle annonce à modérer",
    `Une nouvelle annonce ${vehicule.brand} ${vehicule.model} attend votre validation.`,
    "info",
    `/admin?tab=moderation`,
    { vehicule_id: id, action: "pending_moderation" }
  );
}
```

**Bénéfices** :
- Réduction du temps de modération
- Meilleure réactivité
- Améliore l'expérience vendeur

---

### **9. EXPIRATION DE BANNISSEMENTS**

#### **9.1 Bannissement expiré**
**Fichier** : `src/lib/supabase/server-actions/users.ts` (fonction `checkExpiredBans`)

**Notification à ajouter** :
```typescript
// Quand un ban expire automatiquement
await createNotification(
  userId,
  "Compte réactivé automatiquement",
  "Votre suspension temporaire a pris fin. Votre compte est à nouveau actif.",
  "success",
  "/dashboard",
  { action: "ban_expired" }
);
```

---

## 📊 **PRIORISATION DES IMPLÉMENTATIONS**

### **🔥 PRIORITÉ TRÈS HAUTE** (Impact immédiat)
1. ✅ **Modération véhicules** (Déjà fait)
2. ✅ **Tickets support** (Déjà fait)
3. ⭐ **Baisse de prix sur favoris** (Augmente conversions)
4. ⭐ **Nouvelle annonce à modérer** (Admin)
5. ⭐ **Nouveau véhicule similaire** (Engagement)

### **⚡ PRIORITÉ HAUTE** (Valeur ajoutée importante)
6. **Modification de prix** (Transparence)
7. **Suppression de véhicule** (Info utilisateur)
8. **Bannissement/Débannissement** (Communication)
9. **Alerte Sentinelle** (Fonctionnalité premium)

### **📋 PRIORITÉ MOYENNE** (Amélioration UX)
10. **Véhicule favori supprimé**
11. **Nouveau message** (Si messagerie)
12. **Nouveau commentaire** (Si commentaires)
13. **Expiration de bannissement**

### **💡 PRIORITÉ BASSE** (Nice to have)
14. **Modification de profil** (Confirmation)
15. **Suppression de compte** (Notification admin)

---

## 🛠️ **IMPLEMENTATION TECHNIQUE**

### **Structure recommandée**

```typescript
// src/lib/supabase/notifications-helpers.ts
// Fonctions utilitaires pour créer des notifications typées

export async function notifyPriceDrop(
  vehicleId: string,
  oldPrice: number,
  newPrice: number,
  favorites: string[] // user_ids
) {
  // Logique de notification
}

export async function notifySimilarVehicle(
  newVehicleId: string,
  similarVehicleOwners: string[]
) {
  // Logique de notification
}

// etc.
```

### **Migration des favoris**

**Script SQL** :
```sql
-- Créer la table favorites
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id)
);

-- Index pour performances
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_vehicle_id ON favorites(vehicle_id);

-- RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  USING (auth.uid() = user_id);
```

---

## 📈 **MÉTRIQUES DE SUCCÈS**

### **KPIs à suivre** :
1. **Taux d'ouverture des notifications** (via `is_read`)
2. **Taux de clic** (via `link` dans metadata)
3. **Temps de réaction admin** (modération)
4. **Conversions après notification de baisse de prix**
5. **Engagement utilisateur** (nombre de notifications par utilisateur)

---

## 🎨 **AMÉLIORATIONS UI/UX**

### **Suggestions d'amélioration du panneau de notifications** :

1. **Groupement par type** :
   - "Modération" (approbations, refus)
   - "Prix" (baisses, modifications)
   - "Favoris" (nouvelles annonces similaires)
   - "Support" (tickets)

2. **Filtres** :
   - Toutes
   - Non lues
   - Par type
   - Par date

3. **Actions rapides** :
   - "Marquer toutes comme lues"
   - "Voir l'annonce" (si véhicule)
   - "Répondre" (si ticket)

4. **Badge animé** :
   - Animation pulse quand nouvelles notifications
   - Son optionnel (avec permission)

---

## ✅ **CHECKLIST D'IMPLÉMENTATION**

### **Phase 1 - Fondations** (Semaine 1)
- [ ] Migrer favoris vers base de données
- [ ] Créer fonctions utilitaires de notifications
- [ ] Tester le système existant

### **Phase 2 - Priorités hautes** (Semaine 2)
- [ ] Baisse de prix sur favoris
- [ ] Nouvelle annonce à modérer (admin)
- [ ] Nouveau véhicule similaire
- [ ] Modification de prix

### **Phase 3 - Priorités moyennes** (Semaine 3)
- [ ] Bannissement/Débannissement
- [ ] Suppression de véhicule
- [ ] Véhicule favori supprimé
- [ ] Expiration de bannissement

### **Phase 4 - Améliorations** (Semaine 4)
- [ ] Améliorer UI du panneau
- [ ] Ajouter filtres et groupement
- [ ] Analytics et métriques
- [ ] Tests utilisateurs

---

## 🔒 **SÉCURITÉ ET PERFORMANCE**

### **Considérations** :
1. **Rate limiting** : Limiter le nombre de notifications par utilisateur/jour
2. **Batch notifications** : Grouper les notifications similaires
3. **Cleanup** : Supprimer les anciennes notifications (> 90 jours)
4. **Index** : Optimiser les requêtes avec des index appropriés

---

## 📝 **CONCLUSION**

Ce plan d'intégration transforme le système de notifications en un outil central de communication et d'engagement pour RedZone. En suivant cette roadmap, vous créerez une expérience utilisateur premium qui :

- ✅ Informe en temps réel
- ✅ Augmente l'engagement
- ✅ Améliore la conversion
- ✅ Réduit le support
- ✅ Crée de la valeur

**Prochaine étape recommandée** : Commencer par la migration des favoris et l'implémentation des notifications de baisse de prix, qui ont le plus fort impact sur les conversions.

