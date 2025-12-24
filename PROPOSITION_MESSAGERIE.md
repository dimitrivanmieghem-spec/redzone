# 💬 Proposition de Système de Messagerie

## 📊 Analyse de l'Existant

### État Actuel
- ✅ **Notifications** : Système complet avec table `notifications`, API, et UI
- ✅ **ContactZone** : Composant sur la page détail véhicule
- ⚠️ **MessagesTab** : Vide (message "Fonctionnalité à venir")
- ❌ **Table messages/conversations** : N'existe pas

### Système de Notifications Existant
- Table `notifications` avec RLS
- Types : `info`, `success`, `error`
- Système de marquage lu/non-lu
- Panneau de notifications dans le dashboard
- API complète dans `src/lib/supabase/notifications.ts`

---

## 🎯 Solution Proposée

### Architecture Recommandée

#### **1. Structure Base de Données**

**Table `conversations`**
- Une conversation par couple (acheteur, vendeur, véhicule)
- Unicité : (buyer_id, seller_id, vehicle_id) unique
- Permet d'organiser les messages par annonce

**Table `messages`**
- Messages individuels dans les conversations
- Lien vers `conversations`
- Support texte + métadonnées (images, fichiers si besoin plus tard)

**Avantages :**
- ✅ Organisation claire par annonce
- ✅ Historique complet
- ✅ Facile à filtrer et rechercher
- ✅ Scalable (supporte futurs ajouts : images, fichiers)

---

## 📋 Structure Détaillée

### **Table `conversations`**

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  buyer_last_read_at TIMESTAMP WITH TIME ZONE,
  seller_last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(buyer_id, seller_id, vehicle_id)
);
```

**Colonnes :**
- `id` : Identifiant unique
- `vehicle_id` : Annonce concernée
- `buyer_id` : Acheteur (utilisateur qui contacte)
- `seller_id` : Vendeur (propriétaire du véhicule)
- `created_at` : Date de création
- `updated_at` : Dernière mise à jour (dernier message)
- `buyer_last_read_at` : Dernière fois que l'acheteur a lu
- `seller_last_read_at` : Dernière fois que le vendeur a lu

---

### **Table `messages`**

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE
);
```

**Colonnes :**
- `id` : Identifiant unique
- `conversation_id` : Conversation parente
- `sender_id` : Auteur du message
- `content` : Contenu du message (TEXT)
- `created_at` : Date d'envoi
- `is_read` : Lu/non-lu (pour notifications)
- `read_at` : Date de lecture

---

## 🔐 Sécurité (RLS Policies)

### **Conversations**

**SELECT :** Utilisateur peut voir ses conversations (buyer OU seller)
```sql
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
```

**INSERT :** Utilisateur peut créer une conversation (doit être buyer)
```sql
CREATE POLICY "Buyers can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);
```

### **Messages**

**SELECT :** Utilisateur peut voir les messages de ses conversations
```sql
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );
```

**INSERT :** Utilisateur peut envoyer un message dans ses conversations
```sql
CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );
```

---

## 📡 Intégration avec Notifications

### **Création automatique de notification lors d'un nouveau message**

**Côté serveur (Server Action)** :
```typescript
// Lors de l'envoi d'un message
1. Insérer le message dans `messages`
2. Mettre à jour `conversations.updated_at`
3. Créer une notification pour le destinataire
   - Type: "info"
   - Title: "Nouveau message"
   - Message: "Vous avez reçu un message concernant [Marque Modèle]"
   - Link: "/dashboard?tab=messages&conversation=[id]"
```

**Avantages :**
- ✅ Réutilise le système de notifications existant
- ✅ Badge dans le panneau de notifications
- ✅ Alerte visuelle immédiate
- ✅ Cohérent avec le reste du site

---

## 🎨 Interface Utilisateur

### **1. MessagesTab dans Dashboard**

**Layout :**
```
┌─────────────────────────────────────┐
│  Mes Messages                       │
├──────────┬──────────────────────────┤
│          │                          │
│ Liste    │  Zone de conversation    │
│ convos   │                          │
│          │  [Messages]              │
│ - Convo1 │                          │
│ - Convo2 │  [Zone de saisie]        │
│ - Convo3 │                          │
│          │                          │
└──────────┴──────────────────────────┘
```

**Fonctionnalités :**
- Liste des conversations (triées par `updated_at` DESC)
- Badge "non lu" si nouveaux messages
- Prévisualisation du dernier message
- Filtrage par véhicule
- Recherche de conversations

---

### **2. Page Détail Véhicule**

**Modification de ContactZone :**
- Ajouter un bouton "Envoyer un message" (si connecté)
- Au clic : Redirige vers `/dashboard?tab=messages&start_conversation=[vehicle_id]`
- Ou : Ouvre un modal pour créer une conversation

---

## 🔄 Flux Utilisateur

### **Scénario 1 : Acheteur contacte un vendeur**

1. **Page détail véhicule** → Clic sur "Envoyer un message"
2. **Création conversation** (si n'existe pas) ou ouverture existante
3. **Interface messages** → Zone de saisie
4. **Envoi message** → Sauvegarde en DB + Notification au vendeur
5. **Vendeur reçoit notification** → Badge dans panneau notifications
6. **Vendeur clique** → Redirige vers conversation

### **Scénario 2 : Vendeur répond**

1. **Vendeur voit notification** → Clique
2. **Ouvre conversation** → Voit historique
3. **Répond** → Message sauvegardé + Notification à l'acheteur
4. **Synchronisation** → Les deux voient le nouveau message

---

## 📁 Structure Fichiers Proposée

```
src/
├── lib/
│   └── supabase/
│       ├── messages.ts          # API CRUD messages
│       ├── conversations.ts     # API CRUD conversations
│       └── messages-server.ts   # Server Actions (notifications)
│
├── components/
│   └── features/
│       └── messages/
│           ├── ConversationsList.tsx
│           ├── MessageThread.tsx
│           ├── MessageInput.tsx
│           └── ConversationItem.tsx
│
└── app/
    └── dashboard/
        └── page.tsx             # MessagesTab modifié
```

---

## ✅ Avantages de cette Solution

1. **Réutilise les notifications existantes**
   - Pas besoin de créer un nouveau système
   - Cohérent avec le reste du site

2. **Structure claire**
   - Conversations organisées par annonce
   - Historique complet
   - Facile à maintenir

3. **Sécurisé**
   - RLS garantit que les utilisateurs ne voient que leurs conversations
   - Pas de fuite de données

4. **Scalable**
   - Supporte futures améliorations (images, fichiers)
   - Performance avec index appropriés

5. **UX optimale**
   - Notifications en temps réel
   - Interface intuitive
   - Synchronisation automatique

---

## 🚀 Plan d'Implémentation

### Phase 1 : Base de Données
1. ✅ Créer script SQL pour `conversations` et `messages`
2. ✅ Configurer RLS policies
3. ✅ Ajouter index de performance

### Phase 2 : API TypeScript
1. ✅ Créer `src/lib/supabase/conversations.ts`
2. ✅ Créer `src/lib/supabase/messages.ts`
3. ✅ Server Actions pour créer notifications

### Phase 3 : Types TypeScript
1. ✅ Ajouter types dans `src/lib/supabase/types.ts`

### Phase 4 : Composants UI
1. ✅ Créer composants messages
2. ✅ Intégrer dans MessagesTab
3. ✅ Modifier ContactZone

### Phase 5 : Intégration Notifications
1. ✅ Créer notification lors d'un nouveau message
2. ✅ Lien vers conversation

### Phase 6 : Tests & Polish
1. ✅ Tester tous les scénarios
2. ✅ Vérifier sécurité RLS
3. ✅ Optimiser performances

---

## 📊 Impact sur Autres Pages

### **Pages Impactées :**

1. **`/dashboard` (MessagesTab)**
   - Remplacer le placeholder par l'interface complète

2. **`/cars/[id]` (Page détail)**
   - Modifier ContactZone pour ajouter bouton "Envoyer message"

3. **Composants existants :**
   - NotificationsPanel : Aucun changement (réutilise l'existant)
   - ContactZone : Ajouter bouton message

4. **Types TypeScript :**
   - Ajouter `conversations` et `messages` dans `Database` interface

---

## ❓ Questions pour Validation

1. **Notifications en temps réel ?**
   - Option 1 : Polling toutes les 30s (comme actuellement)
   - Option 2 : Supabase Realtime (plus complexe mais instantané)
   - **Recommandation :** Polling pour commencer, Realtime en amélioration future

2. **Images dans les messages ?**
   - Phase 1 : Texte uniquement
   - Phase 2 : Images (upload Supabase Storage)

3. **Limite de caractères ?**
   - Recommandation : 5000 caractères (raisonnable)

4. **Notification par message ou par conversation ?**
   - Recommandation : Par message (plus précis)

---

## ✅ Recommandation Finale

**Cette solution est complète, sécurisée, et s'intègre parfaitement avec l'existant.**

**Points forts :**
- ✅ Réutilise le système de notifications
- ✅ Structure claire et maintenable
- ✅ Sécurité RLS
- ✅ UX optimale
- ✅ Scalable

**Prêt à implémenter si vous validez !** 🚀

