# 🎛️ GUIDE D'EXTENSION DU BACK-OFFICE ADMIN

## ✅ MODULES CRÉÉS

### 1. **Module Utilisateurs (CRM)** - `/admin/users`
- ✅ Liste complète des utilisateurs
- ✅ Bannissement/Débannissement
- ✅ Vue détaillée avec statistiques
- ✅ Liste des véhicules par utilisateur

### 2. **Module Contenu (FAQ)** - `/admin/content`
- ✅ Gestion complète de la FAQ
- ✅ Ajout/Modification/Suppression
- ✅ Ordre d'affichage personnalisable
- ✅ Activation/Désactivation

### 3. **Réglages Améliorés** - `/admin/settings`
- ✅ Titre H1 de la page d'accueil (dynamique)
- ✅ Taux TVA (déjà existant, maintenant visible)

---

## 📋 INSTRUCTIONS D'INSTALLATION

### ÉTAPE 1 : Exécuter le Script SQL

1. Ouvrez **Supabase Dashboard** > **SQL Editor**
2. Copiez-collez le contenu de `supabase/admin_extensions.sql`
3. Cliquez sur **Run** (ou F5)
4. Vérifiez qu'il n'y a pas d'erreurs

**Ce que le script fait :**
- ✅ Ajoute la colonne `is_banned` à la table `profiles`
- ✅ Crée la table `faq_items` avec RLS
- ✅ Ajoute la colonne `home_title` à `site_settings`
- ✅ Insère 5 questions FAQ par défaut

---

### ÉTAPE 2 : Vérifier les Routes

Les nouvelles routes sont automatiquement disponibles :
- ✅ `/admin/users` - Gestion des utilisateurs
- ✅ `/admin/content` - Gestion de la FAQ

Elles apparaissent dans le menu du dashboard admin.

---

## 🎯 FONCTIONNALITÉS

### Module Utilisateurs (`/admin/users`)

**Vue Liste :**
- Email, Rôle, Date d'inscription
- Badge "Admin" pour les administrateurs
- Badge "Banni" pour les utilisateurs bannis
- Bouton "Bannir/Débannir" par utilisateur

**Vue Détail (panneau droit) :**
- Informations complètes de l'utilisateur
- Statistiques (nombre de véhicules publiés)
- Liste des véhicules avec liens directs
- Statut de chaque véhicule (Actif/En attente/Rejeté)

**Fonctionnalités :**
- ✅ Bannir un utilisateur → Empêche la connexion et la publication
- ✅ Débannir un utilisateur → Restaure l'accès
- ✅ Voir toutes les annonces d'un utilisateur

---

### Module Contenu (`/admin/content`)

**Interface de Gestion :**
- ✅ Bouton "Ajouter une FAQ" en haut
- ✅ Formulaire de création avec :
  - Question (obligatoire)
  - Réponse (obligatoire)
  - Ordre d'affichage (numérique)
  - Case à cocher "Active"

**Gestion des FAQ existantes :**
- ✅ Bouton "Modifier" → Édition inline
- ✅ Bouton "Activer/Désactiver" → Toggle rapide
- ✅ Bouton "Supprimer" → Avec confirmation
- ✅ Affichage de l'ordre d'affichage

**Affichage Public :**
- ✅ Section "Questions Fréquentes" en bas de la page d'accueil
- ✅ Seules les FAQ actives sont affichées
- ✅ Triées par ordre croissant
- ✅ Design responsive (2 colonnes sur desktop)

---

### Réglages Améliorés (`/admin/settings`)

**Nouveaux Champs :**
- ✅ **Titre H1 de la page d'accueil** : Modifiable sans coder
  - Par défaut : "Le Sanctuaire du Moteur Thermique"
  - S'affiche en grand sur la page d'accueil
  - Important pour le SEO

- ✅ **Taux TVA** : Déjà existant, maintenant visible et modifiable
  - Utilisé dans le calculateur de taxes
  - Par défaut : 21%

---

## 🔒 SÉCURITÉ

### Protection des Routes
- ✅ Toutes les pages admin sont protégées par le middleware
- ✅ Vérification du rôle "admin" côté serveur
- ✅ Redirection automatique si non autorisé

### Bannissement
- ✅ Vérification `is_banned` dans le middleware
- ✅ Vérification `is_banned` dans AuthContext
- ✅ Déconnexion automatique si banni
- ✅ Empêche la connexion et la publication

---

## 📊 STRUCTURE DES DONNÉES

### Table `profiles` (mise à jour)
```sql
- id (UUID, PRIMARY KEY)
- email (TEXT, UNIQUE)
- full_name (TEXT)
- role (TEXT: 'user' | 'admin')
- is_banned (BOOLEAN, DEFAULT FALSE) ← NOUVEAU
- created_at (TIMESTAMP)
- avatar_url (TEXT)
```

### Table `faq_items` (nouvelle)
```sql
- id (UUID, PRIMARY KEY)
- question (TEXT, NOT NULL)
- answer (TEXT, NOT NULL)
- order (INTEGER, DEFAULT 0)
- is_active (BOOLEAN, DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Table `site_settings` (mise à jour)
```sql
- home_title (TEXT) ← NOUVEAU
- tva_rate (NUMERIC) ← Déjà existant
- ... (autres champs existants)
```

---

## 🎨 INTERFACE UTILISATEUR

### Design Cohérent
- ✅ Même style que le reste du back-office
- ✅ Fond sombre (slate-900/800)
- ✅ Accents rouges RedZone
- ✅ Animations et transitions fluides

### Responsive
- ✅ Mobile-friendly
- ✅ Grilles adaptatives
- ✅ Panneaux collapsibles sur mobile

---

## 🧪 TESTS RECOMMANDÉS

### Module Utilisateurs
1. ✅ Accéder à `/admin/users`
2. ✅ Voir la liste des utilisateurs
3. ✅ Cliquer sur un utilisateur → Voir les détails
4. ✅ Bannir un utilisateur → Vérifier qu'il ne peut plus se connecter
5. ✅ Débannir → Vérifier qu'il peut se reconnecter

### Module FAQ
1. ✅ Accéder à `/admin/content`
2. ✅ Créer une nouvelle FAQ
3. ✅ Modifier une FAQ existante
4. ✅ Désactiver une FAQ → Vérifier qu'elle disparaît de la page d'accueil
5. ✅ Réactiver → Vérifier qu'elle réapparaît
6. ✅ Supprimer une FAQ

### Réglages
1. ✅ Accéder à `/admin/settings`
2. ✅ Modifier le titre H1
3. ✅ Vérifier qu'il s'affiche sur la page d'accueil
4. ✅ Modifier le taux TVA
5. ✅ Vérifier qu'il est utilisé dans le calculateur

---

## 📁 FICHIERS CRÉÉS/MODIFIÉS

### Nouveaux Fichiers
1. ✅ `supabase/admin_extensions.sql` - Script SQL complet
2. ✅ `src/lib/supabase/users.ts` - Fonctions de gestion utilisateurs
3. ✅ `src/lib/supabase/faq.ts` - Fonctions de gestion FAQ
4. ✅ `src/app/admin/users/page.tsx` - Page admin utilisateurs
5. ✅ `src/app/admin/content/page.tsx` - Page admin FAQ

### Fichiers Modifiés
1. ✅ `src/lib/supabase/settings.ts` - Ajout de `home_title`
2. ✅ `src/app/admin/settings/page.tsx` - Ajout du champ `home_title`
3. ✅ `src/app/page.tsx` - Titre dynamique + Section FAQ
4. ✅ `src/app/admin/dashboard/page.tsx` - Liens vers users et content
5. ✅ `src/middleware.ts` - Vérification `is_banned`
6. ✅ `src/contexts/AuthContext.tsx` - Vérification `is_banned`

---

## 🚀 PROCHAINES ÉTAPES (OPTIONNEL)

1. **Export CSV** : Exporter la liste des utilisateurs
2. **Recherche** : Ajouter une barre de recherche dans `/admin/users`
3. **Filtres** : Filtrer par rôle, statut banni, etc.
4. **Statistiques** : Graphiques d'évolution des utilisateurs
5. **Notifications** : Alertes pour nouveaux utilisateurs bannis

---

## ⚠️ NOTES IMPORTANTES

1. **Bannissement** : Un utilisateur banni ne peut plus :
   - Se connecter
   - Publier des annonces
   - Accéder aux pages protégées

2. **FAQ** : Seules les FAQ avec `is_active = TRUE` sont affichées publiquement

3. **Titre H1** : Le titre est important pour le SEO, modifiez-le avec précaution

4. **TVA** : Le taux est utilisé dans le calculateur de taxes, vérifiez qu'il est correct

---

**Date de création :** $(date)  
**Version :** 1.0  
**Statut :** ✅ Prêt pour production

