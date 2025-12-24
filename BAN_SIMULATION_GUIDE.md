# 🧪 SIMULATEUR DE BANNISSEMENT - Guide Complet

## ✅ Fonctionnalités Implémentées

### 1. **Contexte de Simulation (`BanSimulationContext`)**

**Fichier :** `src/contexts/BanSimulationContext.tsx`

- ✅ État de simulation stocké dans `localStorage` (persiste entre les sessions)
- ✅ Accessible uniquement aux administrateurs (`user.role === "admin"`)
- ✅ Fonctions disponibles :
  - `isSimulatingBan` : État actuel de la simulation
  - `toggleSimulation()` : Active/désactive la simulation
  - `stopSimulation()` : Force l'arrêt de la simulation

### 2. **Menu Utilisateur Amélioré (`Navbar.tsx`)**

**Sections du menu pour les admins :**

#### **SECTION ADMINISTRATION**
- ✅ Tableau de Bord Global → `/admin`
- ✅ Modération Annonces → `/admin/moderation`
- ✅ Gestion Utilisateurs → `/admin/users`
- ✅ Paramètres Site → `/admin/settings`

#### **SWITCH DE SIMULATION**
- ✅ Bouton toggle avec icône `TestTube`
- ✅ Indicateur visuel (rouge quand actif)
- ✅ Texte dynamique : "Simuler état banni" / "Mode Test Actif"
- ✅ Message d'avertissement : "⚠️ Interface de test active"

#### **SECTION MON COMPTE PERSO**
- ✅ Mon Garage / Mes Annonces → `/dashboard`
- ✅ Mes Favoris → `/favorites`
- ✅ Paramètres Profil → `/dashboard`

### 3. **Bannière d'Alerte sur Dashboard**

**Fichier :** `src/app/dashboard/layout.tsx`

- ✅ Affiche la bannière si `user.is_banned` OU `isSimulatingBan` (pour admin)
- ✅ Style différent pour la simulation :
  - **Ban réel** : Fond rouge (`bg-red-900/90`)
  - **Simulation** : Fond ambre (`bg-amber-900/90`)
- ✅ Message personnalisé : "🧪 MODE TEST : Votre compte est suspendu (simulation)"
- ✅ Raison de test affichée : "Simulation de bannissement pour tester l'interface utilisateur"

### 4. **Blocage de l'Accès à `/sell`**

**Fichier :** `src/app/sell/page.tsx`

- ✅ Redirection automatique si `isEffectivelyBanned` (ban réel OU simulation)
- ✅ Toast d'erreur personnalisé :
  - **Ban réel** : "Votre compte est suspendu. Vous ne pouvez pas publier d'annonces."
  - **Simulation** : "Mode test actif : Publication d'annonces désactivée (simulation)"

### 5. **Bannière Flottante de Sortie**

**Fichier :** `src/components/BanSimulationBanner.tsx`

- ✅ Bannière flottante en haut à droite (`top-20 right-4`)
- ✅ Visible uniquement si admin ET simulation active
- ✅ Design ambre avec icône `TestTube`
- ✅ Bouton "Quitter le mode Test" pour arrêter la simulation
- ✅ Animation `slideInRight` pour l'apparition

### 6. **Intégration Globale**

**Fichier :** `src/app/layout.tsx`

- ✅ `BanSimulationProvider` ajouté dans la hiérarchie des contextes
- ✅ `BanSimulationBanner` ajouté dans le layout global
- ✅ Disponible sur toutes les pages

## 🎨 Design & UX

### **Couleurs de Simulation**
- **Ambre** (`amber-900`, `amber-600`) pour différencier la simulation du ban réel
- **Rouge** (`red-600`) pour le ban réel

### **Indicateurs Visuels**
- ✅ Switch toggle avec animation
- ✅ Badge "MODE TEST ACTIF" dans la bannière
- ✅ Icône `TestTube` pour identifier la fonctionnalité de test

### **Responsive**
- ✅ Menu desktop et mobile avec le même switch
- ✅ Bannière flottante adaptée mobile (max-width)

## 🔒 Sécurité

### **Vérifications Implémentées**
1. ✅ `user.role === "admin"` requis pour activer la simulation
2. ✅ Désactivation automatique si l'utilisateur perd le rôle admin
3. ✅ Pas d'impact sur la base de données (simulation purement frontend)

### **Isolation**
- ✅ La simulation n'affecte QUE l'interface utilisateur
- ✅ Aucune modification dans Supabase
- ✅ Le compte admin reste pleinement fonctionnel côté serveur

## 📋 Utilisation

### **Activer la Simulation**
1. Se connecter en tant qu'admin
2. Ouvrir le menu utilisateur (avatar)
3. Dans la section "Administration", cliquer sur le switch "Simuler état banni"
4. Le switch devient rouge et affiche "Mode Test Actif"

### **Tester l'Interface**
1. Aller sur `/dashboard` → Voir la bannière ambre
2. Essayer d'accéder à `/sell` → Redirection avec message de test
3. Vérifier que tous les éléments de ban sont visibles

### **Quitter la Simulation**
**Option 1 :** Via la bannière flottante
- Cliquer sur "Quitter le mode Test" dans la bannière en haut à droite

**Option 2 :** Via le menu utilisateur
- Ouvrir le menu utilisateur
- Cliquer à nouveau sur le switch pour le désactiver

## 🧪 Scénarios de Test

### **Scénario 1 : Test de la Bannière**
1. Activer la simulation
2. Aller sur `/dashboard`
3. ✅ Vérifier que la bannière ambre s'affiche avec le message de test

### **Scénario 2 : Test du Blocage `/sell`**
1. Activer la simulation
2. Essayer d'accéder à `/sell`
3. ✅ Vérifier la redirection vers `/dashboard`
4. ✅ Vérifier le toast avec le message de test

### **Scénario 3 : Test de la Bannière Flottante**
1. Activer la simulation
2. ✅ Vérifier que la bannière flottante apparaît en haut à droite
3. Cliquer sur "Quitter le mode Test"
4. ✅ Vérifier que la simulation s'arrête

### **Scénario 4 : Persistance**
1. Activer la simulation
2. Rafraîchir la page (F5)
3. ✅ Vérifier que la simulation est toujours active (localStorage)

## 📁 Fichiers Modifiés/Créés

### **Nouveaux Fichiers**
- ✅ `src/contexts/BanSimulationContext.tsx` - Contexte de simulation
- ✅ `src/components/BanSimulationBanner.tsx` - Bannière flottante

### **Fichiers Modifiés**
- ✅ `src/app/layout.tsx` - Ajout du provider et de la bannière
- ✅ `src/components/Navbar.tsx` - Menu amélioré avec switch
- ✅ `src/app/dashboard/layout.tsx` - Bannière d'alerte avec simulation
- ✅ `src/app/sell/page.tsx` - Blocage avec simulation
- ✅ `src/app/globals.css` - Animation `slideInRight`

## 🎯 Avantages

1. **Test en Conditions Réelles**
   - Permet de tester l'interface de bannissement sans vraiment bannir le compte admin

2. **Sécurité**
   - Aucun risque de bloquer accidentellement le compte admin
   - Simulation isolée du backend

3. **UX Améliorée**
   - Indicateurs visuels clairs (ambre vs rouge)
   - Bannière flottante pour sortir facilement
   - Messages personnalisés pour la simulation

4. **Persistance**
   - L'état de simulation est sauvegardé dans localStorage
   - Survit aux rafraîchissements de page

---

**Date de mise en place :** $(date)
**Status :** ✅ Fonctionnel - Prêt pour les tests

