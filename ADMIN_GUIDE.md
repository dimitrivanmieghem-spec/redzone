# 🔐 Guide Back-Office Administrateur - RedZone

## 📋 Vue d'ensemble

Le back-office administrateur permet de modérer les annonces de véhicules soumises par les vendeurs.

---

## 🚪 Accès au Back-Office

### URL de connexion
```
http://localhost:3000/admin/login
```

### Identifiants (Dev Mode)
- **Mot de passe** : `admin123`

⚠️ **Important** : En production, remplacez ce système par une vraie authentification avec hash de mot de passe.

---

## 🎨 Interface Administrateur

### Design
- **Fond sombre** : Interface professionnelle (slate-900 / slate-800)
- **Sidebar latérale** : Navigation fixe à gauche
- **Contenu clair** : Zone de travail à droite (fond slate-50)
- **Contraste élevé** : Optimisé pour la lecture et la productivité

### Structure
```
┌─────────────────────────────────────────────────┐
│  [Sidebar Sombre]  │  [Contenu Clair]           │
│                    │                             │
│  Logo              │  Header                     │
│  Navigation        │  ┌───────────────────────┐ │
│  - À valider (4)   │  │ Annonces à valider    │ │
│  - Actives (26)    │  │                       │ │
│  - Rejetées (0)    │  │ [Liste des véhicules] │ │
│                    │  │                       │ │
│  Statistiques      │  └───────────────────────┘ │
│  User + Logout     │                             │
└─────────────────────────────────────────────────┘
```

---

## 📊 Fonctionnalités

### 1. Onglet "À Valider" (Pending)

**Affiche** : Les annonces en attente de modération (`status: "pending"`).

**Actions disponibles** :
- ✅ **Approuver** : Change le statut à `"active"` → l'annonce devient visible sur le site
- ❌ **Rejeter** : Change le statut à `"rejected"` → l'annonce est masquée

**Informations visibles** :
- Photo du véhicule (120x96px)
- Marque + Modèle + Prix
- Année, Kilométrage, Carburant
- Badges techniques :
  - Transmission (manuelle/automatique)
  - Carrosserie (SUV, Berline, etc.)
  - Norme Euro (important pour la Belgique)
  - Car-Pass (✓ si présent)
  - Puissance (en ch)

### 2. Onglet "Actives"

**Affiche** : Les annonces approuvées et en ligne (`status: "active"`).

Ces véhicules sont visibles sur :
- La page d'accueil (6 dernières)
- La page de recherche
- Les favoris
- Le dashboard utilisateur

### 3. Onglet "Rejetées"

**Affiche** : Les annonces refusées (`status: "rejected"`).

Ces véhicules sont masqués du site public.

---

## 🔒 Sécurité

### Protection des routes

Le dashboard admin vérifie automatiquement :

```typescript
if (!user || user.role !== "admin") {
  showToast("Accès refusé - Administrateur uniquement", "error");
  router.push("/");
}
```

**Si l'utilisateur n'est pas admin** :
- ❌ Redirection immédiate vers l'accueil
- 🔔 Toast d'erreur affiché
- 🚫 Aucun contenu sensible n'est rendu

### Rôles utilisateur

```typescript
interface User {
  id: string;
  nom: string;
  email: string;
  avatar: string;
  role: "user" | "admin"; // ← Nouveau champ
}
```

- **`"user"`** : Utilisateur normal (inscription classique)
- **`"admin"`** : Administrateur (connexion via `/admin/login`)

---

## 🗂️ Structure des données

### Interface Vehicule (mise à jour)

```typescript
export interface Vehicule {
  id: string;
  type: TypeVehicule;
  marque: string;
  modele: string;
  prix: number;
  annee: number;
  km: number;
  carburant: "essence" | "diesel" | "hybride" | "electrique";
  transmission: "manuelle" | "automatique";
  carrosserie: "SUV" | "Berline" | "Break" | "Citadine" | "Coupé" | "Cabriolet";
  puissance: number;
  etat: "Neuf" | "Occasion";
  norme_euro: "euro6d" | "euro6b" | "euro5" | "euro4" | "euro3" | "euro2" | "euro1";
  car_pass: boolean;
  image: string;
  images?: string[];
  description?: string;
  status: "pending" | "active" | "rejected"; // ← NOUVEAU
}
```

### Statuts de modération

| Statut | Description | Visible sur le site ? |
|--------|-------------|----------------------|
| `pending` | En attente de validation | ❌ Non |
| `active` | Approuvée et en ligne | ✅ Oui |
| `rejected` | Rejetée par l'admin | ❌ Non |

---

## 📦 Fichiers créés/modifiés

### Nouveaux fichiers

1. **`src/app/admin/login/page.tsx`**
   - Page de connexion administrateur
   - Design sombre et professionnel
   - Validation du mot de passe

2. **`src/app/admin/dashboard/page.tsx`**
   - Interface de modération
   - Sidebar + contenu
   - Actions d'approbation/rejet

3. **`ADMIN_GUIDE.md`**
   - Documentation complète du système admin

### Fichiers modifiés

1. **`src/lib/authContext.tsx`**
   - Ajout du champ `role` à l'interface `User`
   - Nouvelle fonction `loginAdmin(password)`
   - Vérification du mot de passe `admin123`

2. **`src/lib/mockData.ts`**
   - Ajout du champ `status` à l'interface `Vehicule`
   - 4 véhicules en statut `"pending"` pour tester
   - Tous les autres en statut `"active"`

3. **Pages publiques** (filtrage des véhicules actifs uniquement) :
   - `src/app/page.tsx` → Dernières annonces
   - `src/app/search/page.tsx` → Recherche
   - `src/app/favorites/page.tsx` → Favoris
   - `src/app/dashboard/page.tsx` → Dashboard utilisateur

---

## 🧪 Test du système

### 1. Connexion admin

```bash
# Aller sur la page de login admin
http://localhost:3000/admin/login

# Entrer le mot de passe
admin123

# ✓ Redirection vers /admin/dashboard
```

### 2. Validation d'une annonce

1. Onglet "À Valider" (4 véhicules en attente)
2. Cliquer sur **"Approuver"** pour un véhicule
3. ✅ Toast vert : "Annonce approuvée ✓"
4. Le véhicule passe dans l'onglet "Actives"
5. Il devient visible sur le site public

### 3. Rejet d'une annonce

1. Onglet "À Valider"
2. Cliquer sur **"Rejeter"** pour un véhicule
3. ❌ Toast rouge : "Annonce rejetée"
4. Le véhicule passe dans l'onglet "Rejetées"
5. Il reste masqué du site public

### 4. Vérifier la sécurité

```typescript
// Test 1 : Accéder au dashboard sans être admin
// → Redirection immédiate vers "/"
// → Toast : "Accès refusé - Administrateur uniquement"

// Test 2 : Se connecter en tant qu'utilisateur normal
// → user.role = "user"
// → Ne peut pas accéder à /admin/dashboard

// Test 3 : Se connecter en tant qu'admin
// → user.role = "admin"
// → Accès complet au back-office
```

---

## 📊 Statistiques du sidebar

Le sidebar affiche des statistiques en temps réel :

- **Total annonces** : Nombre total de véhicules dans la base
- **Utilisateurs** : `142` (simulé)
- **Vues totales** : `3.2k` (simulé)

💡 **Future** : Ces valeurs peuvent être connectées à une vraie base de données.

---

## 🎯 Workflow complet

```
Vendeur soumet une annonce
         ↓
  status: "pending"
         ↓
Admin voit l'annonce dans "À Valider"
         ↓
    ┌────────┴────────┐
    ↓                  ↓
Approuver          Rejeter
    ↓                  ↓
status: "active"   status: "rejected"
    ↓                  ↓
Visible sur site   Masqué du site
```

---

## 🚀 Déploiement en production

### ⚠️ Changements nécessaires

1. **Remplacer l'authentification simulée** :
   ```typescript
   // ❌ À RETIRER en production
   if (password === "admin123") { ... }
   
   // ✅ À IMPLÉMENTER
   - Hash du mot de passe (bcrypt)
   - Base de données users
   - JWT ou sessions
   - 2FA (recommandé)
   ```

2. **Retirer le message de dev** :
   ```typescript
   // Dans /admin/login/page.tsx, ligne 123-127
   // ❌ RETIRER ce bloc en production
   <div className="mt-6 text-center">
     <p className="text-xs text-slate-500">
       Dev Mode: Mot de passe = <code>admin123</code>
     </p>
   </div>
   ```

3. **Connecter à une vraie base de données** :
   - Remplacer `MOCK_VEHICULES` par des appels API
   - Persister les changements de statut
   - Logs d'audit (qui a approuvé/rejeté quoi)

4. **Ajouter des fonctionnalités** :
   - Filtrage par date de soumission
   - Recherche dans les annonces
   - Export CSV des annonces
   - Statistiques avancées
   - Gestion des utilisateurs
   - Messagerie avec les vendeurs

---

## ✅ Checklist de validation

- [x] Login admin fonctionnel (`/admin/login`)
- [x] Dashboard protégé par rôle
- [x] Onglets "Pending", "Active", "Rejected"
- [x] Actions "Approuver" et "Rejeter"
- [x] Toasts de feedback
- [x] Design sombre et professionnel
- [x] Sidebar avec navigation
- [x] Statistiques rapides
- [x] Déconnexion admin
- [x] Filtrage des véhicules actifs sur le site public
- [x] Build sans erreurs ✓
- [x] Lint sans warnings ✓

---

## 📚 Routes admin

| Route | Description | Protection |
|-------|-------------|-----------|
| `/admin/login` | Connexion administrateur | Public |
| `/admin/dashboard` | Interface de modération | Admin only |

---

## 🔗 Liens utiles

- **Login admin** : `http://localhost:3000/admin/login`
- **Dashboard admin** : `http://localhost:3000/admin/dashboard`
- **Site public** : `http://localhost:3000`

---

## 🎨 Palette de couleurs (Admin)

- **Fond sidebar** : `bg-slate-800` (#1e293b)
- **Fond contenu** : `bg-slate-50` (#f8fafc)
- **Accent** : `bg-red-600` (#fbbf24)
- **Texte clair** : `text-white` (#ffffff)
- **Texte sombre** : `text-slate-900` (#0f172a)
- **Bordures** : `border-slate-700` (#334155)

---

## 🛠️ Maintenance

### Ajouter un nouvel administrateur (Dev)

Actuellement, tous les utilisateurs qui se connectent avec `admin123` deviennent admin.

En production, ajoutez une table `admins` dans votre base de données.

### Changer le mot de passe admin

```typescript
// Dans src/lib/authContext.tsx, ligne 74
if (password === "NOUVEAU_MOT_DE_PASSE") {
  // ...
}
```

---

## 📞 Support

Pour toute question sur le back-office :
- 📧 Email : admin@RedZone.be (simulé)
- 📝 Issues : GitHub repository

---

**🎉 Le back-office administrateur est opérationnel et prêt à l'emploi !**

