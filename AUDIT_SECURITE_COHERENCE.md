# 🔍 AUDIT DE SÉCURITÉ & COHÉRENCE - Fullstack
## Analyse des 3 Espaces Majeurs de l'Application

**Date** : Audit complet des espaces Admin, Dashboard et Vitrine Publique  
**Statut** : 🔴 **INCOHÉRENCES ET RISQUES DÉTECTÉS**

---

## 📋 RÉSUMÉ EXÉCUTIF

| Catégorie | Statut | Risque |
|-----------|--------|--------|
| **Sécurité Admin** | 🟡 MOYEN | Vérifications côté client contournables |
| **Logique Pro vs Particulier** | 🟢 BON | Gestion correcte avec messages d'erreur |
| **Fuite de Données** | 🔴 CRITIQUE | Email, téléphone et adresse exposés publiquement |
| **Cohérence de Modification** | 🟡 MOYEN | Double stockage (user_metadata + profiles) |

---

## 🛡️ 1. SÉCURITÉ & CLOISONNEMENT ADMIN

### ✅ **Points Positifs**

1. **Middleware robuste** (`src/middleware.ts`) :
   - Protection au niveau serveur des routes `/admin`
   - Vérification des rôles avec `canAccessAdmin()` et `canAccessAdminOnly()`
   - Redirection automatique des utilisateurs non autorisés
   - Logging des tentatives d'accès non autorisées

2. **Protection des routes strictes** :
   - `/admin/settings`, `/admin/users`, `/admin/tech` → Admin uniquement
   - Tabs via query params également protégés

### 🔴 **FAILLES DÉTECTÉES**

#### **Faille #1 : Vérification Côté Client Contournable**

**Localisation** : `src/app/admin/page.tsx` (lignes 84-89, 137-139)

```typescript
// Ligne 84-89
useEffect(() => {
  if (!isLoading && (!user || !["admin", "moderator", "support", "editor", "viewer"].includes(user.role))) {
    showToast("Accès refusé - Rôle autorisé requis", "error");
    router.push("/");
  }
}, [user, isLoading, router, showToast]);

// Ligne 137-139
if (!user || !["admin", "moderator", "support", "editor", "viewer"].includes(user.role)) {
  return null;
}
```

**PROBLÈME** :
- Ces vérifications sont **côté client** et peuvent être contournées
- Un utilisateur malveillant peut :
  1. Désactiver JavaScript
  2. Modifier le code dans DevTools
  3. Accéder directement aux composants via React DevTools
  4. Utiliser un client HTTP pour bypasser le middleware (si mal configuré)

**IMPACT** :
- ⚠️ **MOYEN** : Le middleware protège déjà au niveau serveur, mais la vérification client est redondante et peut créer une fausse impression de sécurité

**RECOMMANDATION** :
- ✅ Le middleware est suffisant pour la protection serveur
- ⚠️ Les vérifications client sont redondantes mais inoffensives (ne nuisent pas, mais ne protègent pas non plus)
- 💡 **Optionnel** : Garder les vérifications client pour l'UX (affichage immédiat d'erreur), mais ne pas s'y fier pour la sécurité

---

## 👤 2. LOGIQUE PRO VS PARTICULIER

### ✅ **Gestion Correcte**

#### **Dashboard** (`src/app/dashboard/page.tsx`)

**Lignes 128-154** : Gestion des onglets selon le rôle
```typescript
const isPro = user.role === "pro";
const isParticulier = user.role === "particulier";

const proTabs = [
  { id: "vitrine" as TabType, label: "Ma Vitrine", icon: Building2 },
  { id: "stats" as TabType, label: "Statistiques", icon: BarChart3 },
  { id: "equipe" as TabType, label: "Mon Équipe", icon: Users },
];

const particulierTabs = [
  { id: "sentinelle" as TabType, label: "Ma Sentinelle", icon: Bell },
];

const tabs = [
  ...commonTabs,
  ...(isPro ? proTabs : []),
  ...(isParticulier ? particulierTabs : []),
];
```

✅ **BON** : Les onglets sont correctement filtrés selon le rôle

#### **Vitrine Publique** (`src/app/garage/[userId]/page.tsx`)

**Lignes 79-84** : Vérification du rôle Pro
```typescript
// Vérifier que c'est un professionnel
if (profileData.role !== "pro") {
  setError("Cette page est réservée aux garages professionnels");
  setIsLoading(false);
  return;
}
```

✅ **BON** : Un particulier qui accède à `/garage/[son_id]` verra un message d'erreur clair

### 🟡 **INCOHÉRENCE MINEURE**

#### **Crash Test : Particulier sans Infos Garage**

**Scénario** : Un particulier (sans `garage_name`, `garage_description`, etc.) accède à `/garage/[son_id]`

**Résultat** : ✅ **PAS DE CRASH**
- La page vérifie `role !== "pro"` et affiche une erreur avant de charger les données
- Aucun risque de plantage

**CONCLUSION** : ✅ **Gestion correcte** - Pas de crash, message d'erreur approprié

---

## 👀 3. FUITE DE DONNÉES (DATA LEAK)

### 🔴 **FAILLE CRITIQUE : Données Sensibles Exposées Publiquement**

**Localisation** : `src/app/garage/[userId]/page.tsx`

#### **Faille #1 : Email Exposé**

**Ligne 259** :
```typescript
<a
  href={`mailto:${profile.email}?subject=Demande de rendez-vous privé&body=Bonjour,%0D%0A%0D%0AJe souhaiterais solliciter un rendez-vous privé pour découvrir votre collection.`}
  className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600..."
>
```

**PROBLÈME** :
- L'email est **visible dans le HTML** pour tous les visiteurs (même non connectés)
- Accessible via "Afficher le code source" ou DevTools
- Peut être scrapé par des bots

**IMPACT** : 🔴 **CRITIQUE**
- Violation potentielle du RGPD (données personnelles)
- Risque de spam/phishing
- Exposition d'informations sensibles

#### **Faille #2 : Téléphone Exposé**

**Lignes 286-293** :
```typescript
{profile.phone && (
  <a
    href={`tel:${profile.phone}`}
    className="flex items-center gap-2 hover:text-amber-400 transition-colors"
  >
    <Phone size={16} />
    <span>{profile.phone}</span>
  </a>
)}
```

**PROBLÈME** :
- Le numéro de téléphone est **visible dans le HTML** pour tous
- Accessible sans authentification

**IMPACT** : 🔴 **CRITIQUE**
- Violation RGPD
- Risque de harcèlement téléphonique
- Exposition d'informations personnelles

#### **Faille #3 : Adresse Complète Exposée**

**Lignes 155-157, 280-284** :
```typescript
const fullAddress = [profile.address, profile.postal_code, profile.city]
  .filter(Boolean)
  .join(", ");

// ...

{fullAddress && (
  <div className="flex items-center gap-2">
    <MapPin size={16} />
    <span>{fullAddress}</span>
  </div>
)}
```

**PROBLÈME** :
- L'adresse complète (rue + code postal + ville) est **visible publiquement**
- Peut être utilisée pour localiser physiquement l'utilisateur

**IMPACT** : 🔴 **CRITIQUE**
- Violation RGPD
- Risque de sécurité physique (si garage résidentiel)
- Exposition d'informations sensibles

### 💡 **RECOMMANDATIONS**

1. **Email** :
   - ✅ Option 1 : Masquer l'email et utiliser un formulaire de contact
   - ✅ Option 2 : Afficher uniquement pour les utilisateurs connectés
   - ✅ Option 3 : Utiliser un email générique (contact@garage.com)

2. **Téléphone** :
   - ✅ Option 1 : Masquer et afficher uniquement pour les utilisateurs connectés
   - ✅ Option 2 : Afficher uniquement le format masqué (ex: `+32 XXX XX XX XX`)
   - ✅ Option 3 : Utiliser un formulaire de contact

3. **Adresse** :
   - ✅ Option 1 : Afficher uniquement la ville (pas la rue ni le code postal)
   - ✅ Option 2 : Afficher uniquement pour les utilisateurs connectés
   - ✅ Option 3 : Utiliser une zone géographique large (ex: "Bruxelles" au lieu de l'adresse complète)

---

## 🔄 4. COHÉRENCE DE MODIFICATION

### 🟡 **INCOHÉRENCE : Double Stockage des Données**

#### **Problème Identifié**

**Dashboard** (`src/app/dashboard/page.tsx`, lignes 808-1019) :
- Modifie les champs via `updateProfile()` :
  - `firstName`, `lastName`, `bio`, `phone`
  - `garageName`, `logoUrl`, `website`, `address`, `city`, `postalCode`, `garageDescription`

**Action** (`src/app/actions/profile.ts`, lignes 26-164) :
- Stocke les données dans **2 endroits** :
  1. `user.user_metadata` (lignes 51-76) → Métadonnées Supabase Auth
  2. `profiles` table (lignes 91-118) → Table Supabase

**Vitrine Publique** (`src/app/garage/[userId]/page.tsx`, lignes 67-77) :
- Lit **uniquement depuis `profiles`** :
  ```typescript
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  ```

### ✅ **BONNE NOUVELLE**

**Cohérence de lecture** : ✅ **CORRECTE**
- La page publique lit depuis `profiles`, qui est bien mis à jour par `updateProfile()`
- Les modifications du dashboard sont bien reflétées sur la vitrine publique

**Champs correspondants** :
| Dashboard (modifiable) | Vitrine Publique (affiché) | Statut |
|------------------------|----------------------------|--------|
| `garageName` | `garage_name` | ✅ Cohérent |
| `garageDescription` | `garage_description` | ✅ Cohérent |
| `website` | `website` | ✅ Cohérent |
| `address` | `address` | ✅ Cohérent |
| `city` | `city` | ✅ Cohérent |
| `postalCode` | `postal_code` | ✅ Cohérent |
| `phone` | `phone` | ✅ Cohérent |
| `bio` | `bio` | ✅ Cohérent |

### 🟡 **INCOHÉRENCE MINEURE : Double Stockage**

**Problème** :
- Les données sont stockées dans `user_metadata` ET dans `profiles`
- Risque de désynchronisation si une mise à jour échoue partiellement

**Impact** : 🟡 **FAIBLE**
- Le code actuel met à jour les deux endroits de manière synchrone
- La page publique lit uniquement depuis `profiles`, donc pas d'impact visible

**Recommandation** :
- 💡 **Optionnel** : Considérer `profiles` comme source de vérité unique
- 💡 **Optionnel** : Utiliser `user_metadata` uniquement pour des données temporaires ou non critiques

---

## 📊 TABLEAU RÉCAPITULATIF DES RISQUES

| Faille | Localisation | Gravité | Impact | Priorité |
|--------|--------------|---------|--------|----------|
| **Vérification client admin** | `admin/page.tsx` | 🟡 MOYEN | Faible (middleware protège) | Basse |
| **Email exposé** | `garage/[userId]/page.tsx:259` | 🔴 CRITIQUE | Violation RGPD, spam | **HAUTE** |
| **Téléphone exposé** | `garage/[userId]/page.tsx:286` | 🔴 CRITIQUE | Violation RGPD, harcèlement | **HAUTE** |
| **Adresse exposée** | `garage/[userId]/page.tsx:280` | 🔴 CRITIQUE | Violation RGPD, sécurité physique | **HAUTE** |
| **Double stockage** | `actions/profile.ts` | 🟡 FAIBLE | Risque de désynchronisation | Basse |

---

## 🎯 RECOMMANDATIONS PRIORITAIRES

### 🔴 **URGENT (À Corriger Immédiatement)**

1. **Masquer l'email** dans la vitrine publique
   - Utiliser un formulaire de contact ou afficher uniquement pour les utilisateurs connectés

2. **Masquer le téléphone** dans la vitrine publique
   - Afficher uniquement pour les utilisateurs connectés ou utiliser un format masqué

3. **Limiter l'adresse** dans la vitrine publique
   - Afficher uniquement la ville (pas la rue ni le code postal)

### 🟡 **MOYEN (À Améliorer)**

4. **Simplifier le stockage des données**
   - Utiliser `profiles` comme source de vérité unique
   - Réduire l'utilisation de `user_metadata` aux données temporaires

### 🟢 **FAIBLE (Optionnel)**

5. **Clarifier les vérifications admin**
   - Documenter que les vérifications client sont pour l'UX uniquement
   - La sécurité réelle est assurée par le middleware

---

## ✅ POINTS POSITIFS

1. ✅ **Middleware robuste** : Protection serveur efficace des routes admin
2. ✅ **Gestion Pro vs Particulier** : Logique correcte, pas de crash
3. ✅ **Cohérence de lecture** : Les modifications du dashboard sont bien reflétées sur la vitrine publique
4. ✅ **Logging d'audit** : Tentatives d'accès non autorisées sont loggées

---

## 📝 CONCLUSION

**Risques Critiques** : 🔴 **3 failles majeures** (exposition de données sensibles)  
**Risques Moyens** : 🟡 **2 incohérences mineures** (double stockage, vérifications client)  
**Points Positifs** : ✅ **Sécurité admin solide**, **logique métier correcte**

**Action Immédiate Requise** : Masquer les données sensibles (email, téléphone, adresse complète) dans la vitrine publique.

