# 📊 AUDIT FONCTIONNEL - Rôles, Quotas & Système Premium

**Date de l'audit :** Décembre 2025  
**Auditeur :** Product Manager & Lead Architect  
**Objectif :** Inventaire de l'existant avant implémentation du programme "Early Adopter" et comptes Premium

---

## 📋 RÉSUMÉ EXÉCUTIF

### ✅ **CE QUI EXISTE**
- Système de rôles complet (7 rôles)
- Champs "Garage" pour les Pros (nom, description, site web, adresse)
- Badge "Membre Fondateur" (`is_founder`) déjà présent dans la base
- Aucun système de quota actuellement

### ❌ **CE QUI MANQUE**
- Système de quota (limite d'annonces/photos)
- Champs business (TVA, BCE) dans la table `profiles`
- Différenciation fonctionnelle Pro vs Particulier (mêmes limites pour tous)
- Système de paiement (Stripe/PayPal)

---

## 1. 📐 STRUCTURE DES RÔLES

### Valeurs possibles pour `role` dans `profiles`

**Source :** `src/lib/permissions.ts` (ligne 5-12) et `supabase/MASTER_SCHEMA_V2.sql` (ligne 50)

**7 rôles définis :**
1. `"particulier"` - Rôle par défaut (DEFAULT dans SQL)
2. `"pro"` - Professionnel (garage/concessionnaire)
3. `"admin"` - Administrateur (accès complet back-office)
4. `"moderator"` - Modérateur (validation d'annonces)
5. `"support"` - Support client (gestion tickets)
6. `"editor"` - Éditeur (gestion contenu éditorial)
7. `"viewer"` - Lecteur/Auditeur (lecture seule)

**Contrainte SQL :**
```sql
role TEXT DEFAULT 'particulier' CHECK (role IN ('particulier', 'pro', 'admin', 'moderator', 'support', 'editor', 'viewer'))
```

**Fichiers de référence :**
- `src/lib/permissions.ts` - Définition TypeScript
- `src/lib/supabase/types.ts` - Types Supabase (ligne 226)
- `supabase/MASTER_SCHEMA_V2.sql` - Schéma SQL (ligne 50)

---

## 2. 🏢 AVANTAGES PRO ACTUELS

### Champs disponibles dans `profiles` pour les Pros

**Source :** `src/lib/supabase/types.ts` (lignes 231-243) et `supabase/MASTER_SCHEMA_V2.sql` (lignes 52-66)

**Champs "Garage" présents :**
- ✅ `garage_name` (TEXT) - Nom du garage
- ✅ `garage_description` (TEXT) - Description du garage
- ✅ `website` (TEXT) - Site web du garage
- ✅ `address` (TEXT) - Adresse complète
- ✅ `city` (TEXT) - Ville
- ✅ `postal_code` (TEXT) - Code postal
- ✅ `phone` (TEXT) - Téléphone
- ✅ `bio` (TEXT) - Biographie
- ✅ `speciality` (TEXT) - Spécialité (ex: "Supercars", "Youngtimers")
- ✅ `founded_year` (INTEGER) - Année de fondation
- ✅ `cover_image_url` (TEXT) - Image de couverture
- ✅ `is_verified` (BOOLEAN) - Badge vérifié (DEFAULT FALSE)

### Différences fonctionnelles Pro vs Particulier

**Dans le formulaire de vente (`src/app/sell/page.tsx`) :**

#### Champs Pro uniquement (lignes 2167-2223) :
- **Nom du Garage** (`garageName`) - **⚠️ NON STOCKÉ dans profiles**
- **Numéro de TVA** (`tvaNumber`) - **⚠️ NON STOCKÉ dans profiles**
- **Adresse du Garage** (`garageAddress`) - **⚠️ NON STOCKÉ dans profiles**

**⚠️ PROBLÈME DÉTECTÉ :** Ces champs sont demandés dans le formulaire mais ne sont **PAS persistés** dans la base de données. Ils sont probablement perdus après soumission.

**Dans le formulaire d'inscription (`src/app/register/page.tsx`) :**
- Les Pros doivent fournir un **numéro de TVA** (obligatoire, format BE0123456789)
- Le `vatNumber` est validé via Zod mais **N'EST PAS STOCKÉ** dans `profiles` après inscription

**Dans le Dashboard (`src/app/dashboard/page.tsx`) :**
- Badge "PRO" affiché si `user.role === "pro"` (ligne 198-202)
- Onglet "Vitrine" disponible pour tous (pas spécifique Pro)

**Dans la page Garage (`src/app/garage/[userId]/page.tsx`) :**
- Page publique accessible à `/garage/{userId}`
- Affiche les informations du garage (nom, description, site web, etc.)
- Disponible pour tous les utilisateurs (pas spécifique Pro)

### Limites identiques pour tous

**❌ AUCUNE DIFFÉRENCE DE LIMITES :**
- Nombre d'annonces : **Illimité** (aucun quota détecté)
- Nombre de photos : **Illimité** (seule limite : taille max 10MB par photo)
- Taille des photos : **10MB max** (identique pour tous)
- Taille audio : **5MB max** (identique pour tous)

---

## 3. 🚫 SYSTÈME DE QUOTA

### Résultat : **AUCUN SYSTÈME DE QUOTA DÉTECTÉ**

**Recherche effectuée :**
- ✅ Aucune fonction de comptage d'annonces avant création
- ✅ Aucune vérification de limite dans `src/app/sell/page.tsx`
- ✅ Aucune table `quotas` ou `subscriptions` dans le schéma
- ✅ Aucune fonction SQL de vérification de quota

**Code analysé :**
- `src/app/sell/page.tsx` - Aucune vérification de quota avant soumission
- `src/lib/supabase/vehicules.ts` - Aucune fonction de comptage
- `supabase/MASTER_SCHEMA_V2.sql` - Aucune table de quota

**Message dans le formulaire (ligne 2444) :**
```
ℹ️ Durant la phase Bêta, la publication d'annonces est entièrement gratuite et illimitée.
```

**Conclusion :** Le système est actuellement **100% gratuit et sans limite** pour tous les utilisateurs.

---

## 4. 💼 CHAMPS BUSINESS DANS `profiles`

### Champs présents

**Source :** `src/lib/supabase/types.ts` (lignes 231-243)

**Champs "Business" existants :**
- ✅ `garage_name` - Nom du garage
- ✅ `garage_description` - Description
- ✅ `website` - Site web
- ✅ `address` - Adresse
- ✅ `city` - Ville
- ✅ `postal_code` - Code postal
- ✅ `phone` - Téléphone
- ✅ `speciality` - Spécialité
- ✅ `founded_year` - Année de fondation
- ✅ `is_verified` - Badge vérifié

### Champs manquants (pour facturation)

**❌ ABSENTS de la table `profiles` :**
- ❌ `vat_number` / `vatNumber` - Numéro de TVA
- ❌ `bce_number` / `bceNumber` - Numéro BCE (Banque-Carrefour des Entreprises)
- ❌ `siret` - Numéro SIRET (non applicable en Belgique)
- ❌ `company_name` - Nom de la société (utilise `garage_name` à la place)
- ❌ `billing_address` - Adresse de facturation (utilise `address` à la place)
- ❌ `subscription_status` - Statut d'abonnement
- ❌ `subscription_plan` - Plan d'abonnement (free/premium/pro)
- ❌ `subscription_expires_at` - Date d'expiration de l'abonnement
- ❌ `payment_method` - Méthode de paiement
- ❌ `stripe_customer_id` - ID client Stripe

**⚠️ PROBLÈME DÉTECTÉ :**
Le `vatNumber` est demandé à l'inscription (`src/app/register/page.tsx` ligne 106) et validé via Zod, mais **N'EST PAS STOCKÉ** dans la table `profiles` après création du compte.

---

## 5. 💳 SYSTÈME DE PAIEMENT

### Résultat : **AUCUN SYSTÈME DE PAIEMENT DÉTECTÉ**

**Recherche effectuée :**
- ❌ Aucun fichier `stripe.ts` ou `payment.ts`
- ❌ Aucune intégration Stripe détectée
- ❌ Aucune table `subscriptions` ou `payments` dans le schéma
- ❌ Aucune référence à des clés API Stripe dans le code

**Conclusion :** Le système de paiement doit être créé de zéro.

---

## 6. 🎖️ SYSTÈME "EARLY ADOPTER" / "MEMBRE FONDATEUR"

### Champs existants

**Source :** `src/lib/supabase/types.ts` (ligne 243) et `supabase/MASTER_SCHEMA_V2.sql` (ligne 74)

**Champ présent :**
- ✅ `is_founder` (BOOLEAN) - Badge "Membre Fondateur" (DEFAULT FALSE)
- ✅ Index créé : `idx_profiles_is_founder` (ligne 83 du schéma SQL)

**Utilisation actuelle :**
- Badge affiché dans le Dashboard (`src/app/dashboard/page.tsx` ligne 186-196)
- Message : "Vous faites partie des 500 premiers membres. Accès prioritaire aux fonctionnalités Pro à vie !"

**⚠️ PROBLÈME :** Aucune logique automatique pour définir `is_founder = true` lors de l'inscription des 500 premiers utilisateurs.

---

## 7. 📊 TABLEAU RÉCAPITULATIF

| Élément | Statut | Détails |
|---------|--------|---------|
| **Rôles définis** | ✅ Complet | 7 rôles (particulier, pro, admin, moderator, support, editor, viewer) |
| **Champs Garage (Pro)** | ✅ Présents | 11 champs (garage_name, website, address, etc.) |
| **Champs Business (Facturation)** | ❌ Manquants | Pas de TVA, BCE, adresse facturation dans profiles |
| **Système de Quota** | ❌ Absent | Aucune limite d'annonces/photos |
| **Limites Photos** | ⚠️ Partiel | Limite de taille (10MB) mais pas de limite de nombre |
| **Limites Annonces** | ❌ Absent | Illimité pour tous |
| **Différenciation Pro/Particulier** | ⚠️ Partielle | Champs UI mais pas de limites différentes |
| **Système de Paiement** | ❌ Absent | Aucune intégration Stripe/PayPal |
| **Badge Membre Fondateur** | ✅ Présent | Champ `is_founder` existe mais pas de logique auto |
| **Stockage TVA** | ❌ Manquant | Demandé à l'inscription mais non stocké |

---

## 8. 🔍 DÉTAILS TECHNIQUES

### Limites de fichiers actuelles

**Photos (`src/lib/supabase/uploads.ts`) :**
- Taille max : **10MB par photo**
- Formats : JPEG, JPG, PNG, WebP, GIF
- **Nombre : ILLIMITÉ** (aucune limite détectée)

**Audio (`src/lib/supabase/uploads.ts`) :**
- Taille max : **5MB par fichier**
- Formats : MP3, WAV, OGG, WebM
- **Nombre : 1 fichier** (limite implicite par formulaire)

**Posts Passion (`src/components/PassionPostForm.tsx`) :**
- Photos : **Maximum 3 photos** (ligne 46)
- Taille : **5MB par photo** (ligne 52)

### Formulaire de vente - Champs Pro

**Fichier :** `src/app/sell/page.tsx` (lignes 2167-2223)

**Champs demandés (mais non persistés) :**
- `formData.garageName` → **NON STOCKÉ dans profiles**
- `formData.tvaNumber` → **NON STOCKÉ dans profiles**
- `formData.garageAddress` → **NON STOCKÉ dans profiles**

**⚠️ ACTION REQUISE :** Ces champs doivent être stockés dans `profiles` lors de la création/modification d'annonce, ou supprimés du formulaire si non utilisés.

---

## 9. 📝 RECOMMANDATIONS POUR L'IMPLÉMENTATION

### Priorité 1 : Compléter les champs Business

**Ajouter dans `profiles` :**
- `vat_number` (TEXT) - Numéro de TVA belge
- `bce_number` (TEXT) - Numéro BCE (optionnel)
- `billing_address` (TEXT) - Adresse de facturation (si différente de `address`)

**Action :** Migration SQL + Mise à jour des types TypeScript

### Priorité 2 : Système de Quota

**Créer une table `user_quotas` :**
```sql
CREATE TABLE user_quotas (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  max_vehicles INTEGER DEFAULT 5, -- Particulier: 5, Pro: 50, Premium: illimité
  max_photos_per_vehicle INTEGER DEFAULT 10, -- Particulier: 10, Pro: 50, Premium: illimité
  current_vehicles_count INTEGER DEFAULT 0,
  subscription_plan TEXT DEFAULT 'free', -- 'free', 'premium', 'pro'
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  is_founder BOOLEAN DEFAULT FALSE -- Hérité de profiles.is_founder
);
```

**Action :** Créer la table + Fonction de vérification avant création d'annonce

### Priorité 3 : Logique "Early Adopter"

**Créer un trigger SQL :**
```sql
CREATE OR REPLACE FUNCTION set_founder_on_registration()
RETURNS TRIGGER AS $$
DECLARE
  founder_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO founder_count
  FROM profiles
  WHERE is_founder = TRUE;
  
  IF founder_count < 500 THEN
    NEW.is_founder = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Action :** Trigger sur INSERT dans `profiles`

### Priorité 4 : Différenciation Pro/Particulier

**Limites proposées :**
- **Particulier :** 5 annonces max, 10 photos/annonce
- **Pro :** 50 annonces max, 50 photos/annonce
- **Premium (Early Adopter) :** Illimité (hérité de Pro + avantages supplémentaires)

**Action :** Implémenter la vérification dans `src/app/sell/page.tsx` avant soumission

---

## 10. ✅ CONCLUSION

### État actuel

**Points forts :**
- ✅ Système de rôles complet et bien structuré
- ✅ Champs "Garage" présents pour les Pros
- ✅ Badge "Membre Fondateur" déjà dans le schéma
- ✅ Infrastructure prête pour extension

**Points à améliorer :**
- ❌ Aucun système de quota (tout est illimité)
- ❌ Champs business incomplets (TVA non stocké)
- ❌ Pas de différenciation fonctionnelle Pro/Particulier
- ❌ Pas de système de paiement

### Prochaines étapes recommandées

1. **Migration SQL** : Ajouter `vat_number`, `bce_number` dans `profiles`
2. **Table Quotas** : Créer `user_quotas` avec limites par rôle
3. **Logique Early Adopter** : Trigger SQL pour définir automatiquement les 500 premiers
4. **Vérification Quotas** : Ajouter la vérification dans `src/app/sell/page.tsx`
5. **Système de Paiement** : Intégrer Stripe pour les futurs abonnements Premium

---

**Audit réalisé par :** Product Manager & Lead Architect  
**Date :** Décembre 2025  
**Prochaine étape :** Implémentation des quotas et champs business

