# 🎯 PROPOSITION DE RÔLES UTILISATEURS - RedZone

## 📋 RÔLES ACTUELS

Actuellement, RedZone dispose de **4 rôles** :

1. **`particulier`** - Utilisateur standard (par défaut)
   - Peut publier des annonces
   - Peut contacter les vendeurs
   - Accès limité au dashboard personnel

2. **`pro`** - Professionnel (garage, concessionnaire)
   - Mêmes droits que particulier
   - Badge "PRO" visible
   - Informations garage (nom, description, etc.)

3. **`moderator`** - Modérateur
   - Peut approuver/rejeter les annonces
   - Peut modérer les commentaires
   - Peut voir la gestion des véhicules
   - **PAS** d'accès aux paramètres du site
   - **PAS** de gestion des utilisateurs

4. **`admin`** - Administrateur
   - Accès complet à toutes les fonctionnalités
   - Gestion des utilisateurs
   - Paramètres du site
   - Statistiques complètes

---

## 💡 PROPOSITION DE RÔLES SUPPLÉMENTAIRES

### 1. **`support`** - Agent de Support ⭐ RECOMMANDÉ

**Objectif :** Gérer les tickets de support sans accès à la modération

**Permissions :**
- ✅ Voir tous les tickets de support
- ✅ Répondre aux tickets
- ✅ Fermer/résoudre les tickets
- ✅ Réassigner les tickets
- ❌ **PAS** d'accès à la modération (annonces, commentaires)
- ❌ **PAS** d'accès aux paramètres
- ❌ **PAS** de gestion des utilisateurs

**Cas d'usage :**
- Équipe de support client dédiée
- Séparation des responsabilités (support ≠ modération)
- Traçabilité des interactions client

**Avantages :**
- ✅ Sécurité : Support ne peut pas modifier le contenu
- ✅ Organisation : Rôles clairs et séparés
- ✅ Scalabilité : Facilite la croissance de l'équipe

---

### 2. **`editor`** - Éditeur de Contenu ⭐ RECOMMANDÉ

**Objectif :** Gérer le contenu éditorial (articles, tribune) sans accès admin

**Permissions :**
- ✅ Créer/modifier/supprimer des articles
- ✅ Modérer les commentaires d'articles
- ✅ Gérer la tribune (questions/réponses)
- ✅ Gérer les récits
- ❌ **PAS** d'accès à la modération des annonces
- ❌ **PAS** d'accès aux paramètres
- ❌ **PAS** de gestion des utilisateurs

**Cas d'usage :**
- Rédacteurs/journalistes automobiles
- Équipe éditoriale dédiée
- Contributeurs externes

**Avantages :**
- ✅ Sécurité : Éditeurs ne peuvent pas modifier les annonces
- ✅ Spécialisation : Focus sur le contenu éditorial
- ✅ Flexibilité : Peut inviter des contributeurs externes

---

### 3. **`viewer`** - Lecteur/Auditeur ⚠️ OPTIONNEL

**Objectif :** Accès en lecture seule pour audits/inspections

**Permissions :**
- ✅ Voir toutes les données (annonces, utilisateurs, tickets)
- ✅ Voir les statistiques
- ✅ Voir les logs d'audit
- ❌ **PAS** de modification (lecture seule)
- ❌ **PAS** d'accès aux paramètres

**Cas d'usage :**
- Auditeurs externes
- Inspecteurs/conformité
- Consultants

**Avantages :**
- ✅ Transparence : Accès complet en lecture seule
- ✅ Conformité : Facilite les audits RGPD
- ⚠️ **Inconvénient** : Peut être moins utile qu'un export de données

---

## 🎯 RECOMMANDATION FINALE

### Rôles à **AJOUTER** :

1. ✅ **`support`** - **FORTEMENT RECOMMANDÉ**
   - Utile pour une équipe de support dédiée
   - Séparation claire des responsabilités
   - Facilite la gestion des tickets

2. ✅ **`editor`** - **RECOMMANDÉ**
   - Utile si vous avez une équipe éditoriale
   - Permet d'inviter des contributeurs externes
   - Focus sur le contenu sans risque pour les annonces

3. ⚠️ **`viewer`** - **OPTIONNEL**
   - Moins prioritaire
   - Peut être remplacé par des exports de données
   - Utile uniquement si vous avez besoin d'audits fréquents

---

## 📊 TABLEAU COMPARATIF DES PERMISSIONS

| Fonctionnalité | particulier | pro | moderator | support | editor | viewer | admin |
|----------------|-------------|-----|-----------|---------|--------|--------|-------|
| Publier annonces | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Modérer annonces | ❌ | ❌ | ✅ | ❌ | ❌ | 👁️ | ✅ |
| Modérer commentaires | ❌ | ❌ | ✅ | ❌ | ✅ | 👁️ | ✅ |
| Gérer tickets | ❌ | ❌ | ❌ | ✅ | ❌ | 👁️ | ✅ |
| Créer articles | ❌ | ❌ | ❌ | ❌ | ✅ | 👁️ | ✅ |
| Gérer utilisateurs | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ | ✅ |
| Paramètres site | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ | ✅ |
| Statistiques | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ | ✅ |
| Voir données (lecture) | Limité | Limité | ✅ | ✅ | ✅ | ✅ | ✅ |

**Légende :**
- ✅ = Accès complet (lecture + écriture)
- 👁️ = Accès lecture seule
- ❌ = Pas d'accès

---

## 🚀 IMPLÉMENTATION PROPOSÉE

### Étape 1 : Mise à jour de la base de données

Modifier la contrainte CHECK dans la table `profiles` :

```sql
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('particulier', 'pro', 'admin', 'moderator', 'support', 'editor', 'viewer'));
```

### Étape 2 : Mise à jour des types TypeScript

```typescript
type UserRole = 
  | "particulier" 
  | "pro" 
  | "admin" 
  | "moderator" 
  | "support" 
  | "editor" 
  | "viewer";
```

### Étape 3 : Mise à jour des permissions dans le code

- Middleware : Ajouter les vérifications pour `support`, `editor`, `viewer`
- Pages admin : Adapter les accès selon les rôles
- Components : Afficher les badges appropriés

---

## ❓ QUESTION POUR VALIDATION

**Quels rôles souhaitez-vous ajouter ?**

1. ✅ **`support`** - Agent de support (gestion tickets)
2. ✅ **`editor`** - Éditeur de contenu (articles, tribune)
3. ⚠️ **`viewer`** - Lecteur/Auditeur (lecture seule)

**Réponse attendue :** Indiquez les rôles que vous souhaitez ajouter, et j'implémenterai :
- La création d'utilisateurs manuellement dans `/admin`
- L'attribution de rôles
- Les permissions appropriées pour chaque rôle

