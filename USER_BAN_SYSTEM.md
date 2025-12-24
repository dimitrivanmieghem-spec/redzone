# 🚫 SYSTÈME DE GESTION AVANCÉE DES UTILISATEURS (BAN & SUPPRESSION)

## 📋 Vue d'ensemble

Ce système permet aux administrateurs de :
- **Bannir** des utilisateurs avec raison et date de fin (ou permanent)
- **Débannir** des utilisateurs
- **Supprimer définitivement** des comptes utilisateurs
- Les utilisateurs bannis voient une notification et ne peuvent pas publier d'annonces

---

## 🔧 INSTALLATION

### Étape 1 : Migration SQL

1. Ouvrez **Supabase Dashboard** > **SQL Editor**
2. Copiez-collez le contenu de `supabase/user_ban_migration.sql`
3. Cliquez sur **Run** (ou F5)
4. Vérifiez qu'il n'y a pas d'erreurs

**Ce que le script fait :**
- ✅ Ajoute `ban_reason` (TEXT, nullable) à la table `profiles`
- ✅ Ajoute `ban_until` (TIMESTAMP WITH TIME ZONE, nullable) à la table `profiles`
- ✅ S'assure que `is_banned` (BOOLEAN) existe
- ✅ Crée des index pour les performances
- ✅ Crée une fonction pour vérifier les bans expirés

### Étape 2 : Variables d'environnement

Ajoutez dans votre fichier `.env.local` :

```env
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

**Important :** Cette clé est nécessaire pour la suppression d'utilisateurs. Vous la trouvez dans :
- Supabase Dashboard > Settings > API > `service_role` key (⚠️ SECRET)

---

## 🎯 FONCTIONNALITÉS

### 1. Interface Admin (`/admin/users`)

#### **Bannir un utilisateur**
1. Cliquez sur **"Gérer le Ban"** à côté d'un utilisateur
2. Une modale s'ouvre avec :
   - Champ **Raison** (obligatoire)
   - Option **Bannissement permanent** (checkbox)
   - Champ **Date de fin** (si non permanent)
3. Cliquez sur **"Confirmer le bannissement"**

#### **Débannir un utilisateur**
- Si l'utilisateur est déjà banni, le bouton devient **"Débannir"** (vert)
- Cliquez dessus pour débannir immédiatement

#### **Supprimer un compte**
1. Cliquez sur **"Supprimer"** (rouge) à côté d'un utilisateur
2. Une modale de confirmation s'ouvre
3. Tapez **"SUPPRIMER"** pour confirmer
4. Cliquez sur **"Supprimer définitivement"**

**⚠️ Protection :**
- Impossible de supprimer un autre admin
- Impossible de supprimer son propre compte
- Double confirmation obligatoire

### 2. Interface Utilisateur

#### **Notification de ban**
- Si l'utilisateur est banni, une bannière rouge apparaît en haut du dashboard
- Affiche la raison et la date de fin (ou "Définitive")

#### **Blocage de publication**
- Les utilisateurs bannis ne peuvent pas accéder à `/sell`
- Redirection automatique vers `/dashboard` avec message d'erreur

#### **Vérification automatique**
- Les bans expirés sont automatiquement levés lors de la connexion
- La fonction `check_expired_bans()` peut être appelée manuellement par un admin

---

## 🔒 SÉCURITÉ

### Server Actions
- Toutes les actions (ban, unban, delete) sont des **Server Actions** sécurisées
- Vérification admin obligatoire via `requireAdmin()`
- Utilisation de `service_role` uniquement pour la suppression (opération sensible)

### Protection des routes
- Les pages admin vérifient le rôle avant d'afficher le contenu
- Redirection automatique si non admin

### Protection des données
- Impossible de supprimer un autre admin
- Impossible de supprimer son propre compte
- Double confirmation pour la suppression

---

## 📁 FICHIERS CRÉÉS/MODIFIÉS

### Nouveaux fichiers
1. **`supabase/user_ban_migration.sql`** - Migration SQL
2. **`src/lib/supabase/server-actions/users.ts`** - Server Actions pour ban/unban/delete
3. **`USER_BAN_SYSTEM.md`** - Cette documentation

### Fichiers modifiés
1. **`src/lib/supabase/users.ts`** - Interface `UserProfile` mise à jour avec `ban_reason` et `ban_until`
2. **`src/app/admin/users/page.tsx`** - Interface améliorée avec modales
3. **`src/contexts/AuthContext.tsx`** - Ajout des champs de ban dans l'interface `User`
4. **`src/app/dashboard/layout.tsx`** - Notification de ban ajoutée
5. **`src/app/sell/page.tsx`** - Blocage d'accès si banni

---

## 🧪 TEST

### Tester le bannissement
1. Connectez-vous en tant qu'admin
2. Allez sur `/admin/users`
3. Cliquez sur **"Gérer le Ban"** d'un utilisateur
4. Saisissez une raison et une date de fin
5. Confirmez
6. Connectez-vous avec le compte banni
7. Vérifiez que la notification apparaît et que `/sell` est bloqué

### Tester la suppression
1. Créez un compte de test
2. En tant qu'admin, allez sur `/admin/users`
3. Cliquez sur **"Supprimer"** à côté du compte de test
4. Tapez "SUPPRIMER" et confirmez
5. Vérifiez que le compte n'existe plus

---

## 🐛 RÉSOLUTION DES PROBLÈMES

### Erreur : "SUPABASE_SERVICE_ROLE_KEY n'est pas configuré"
**Solution :** Ajoutez la variable d'environnement dans `.env.local` et redémarrez le serveur.

### Erreur : "Vous ne pouvez pas supprimer un autre administrateur"
**Solution :** C'est normal, c'est une protection. Changez d'abord le rôle de l'utilisateur.

### Les bans expirés ne sont pas automatiquement levés
**Solution :** Les bans sont vérifiés à la connexion. Pour forcer la vérification, appelez `checkExpiredBans()` depuis l'admin.

---

## 📝 NOTES

- Les bans permanents ont `ban_until = null`
- Les bans temporaires ont une date ISO dans `ban_until`
- La suppression d'un utilisateur supprime aussi toutes ses annonces (cascade)
- La fonction `check_expired_bans()` peut être appelée via un cron job Supabase pour automatiser le débannissement

