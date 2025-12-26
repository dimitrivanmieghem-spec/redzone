# 🔍 AUDIT TECHNIQUE COMPLET - Dashboard Professionnel & Erreurs Critiques

**Date** : Audit réalisé après optimisation Auth  
**Objectif** : Diagnostic des erreurs SSL, 400, et analyse des fonctionnalités Pro  
**Périmètre** : Middleware, Dashboard Pro, Flux de données, Vitrine Publique

---

## 🚨 1. AUDIT DE LA COUCHE RÉSEAU & MIDDLEWARE

### ❌ PROBLÈME CRITIQUE #1 : Manifest.json bloqué par le middleware

**Fichier** : `src/middleware.ts` (lignes 11-17)

**État actuel** :
```typescript
const alwaysAllowedRoutes = [
  "/coming-soon",
  "/access",
  "/api",
  "/_next",
  "/favicon.ico",  // ✅ favicon est autorisé
  // ❌ MANQUE: "/manifest.json"
];
```

**Impact** :
- Le middleware intercepte `/manifest.json` et le soumet à la logique Coming Soon
- Résultat : `ERR_SSL_PROTOCOL_ERROR` car le manifest est redirigé vers `/coming-soon` ou bloqué
- Les assets statiques peuvent aussi être bloqués si le matcher ne les exclut pas correctement

**Solution requise** :
```typescript
const alwaysAllowedRoutes = [
  "/coming-soon",
  "/access",
  "/api",
  "/_next",
  "/favicon.ico",
  "/manifest.json",  // ✅ AJOUTER
];
```

**Matcher du middleware** (ligne 262) :
Le matcher exclut déjà les fichiers statiques via regex, MAIS le problème vient du fait que `manifest.json` n'est pas dans `alwaysAllowedRoutes`, donc il est intercepté AVANT que le matcher ne l'exclue.

---

### ⚠️ PROBLÈME #2 : Headers HTTPS forcés en développement local

**Fichier** : `next.config.ts` (lignes 57-71)

**État actuel** :
```typescript
headers: [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // ...
  {
    key: "Content-Security-Policy",
    value: [
      // ...
      "upgrade-insecure-requests",  // ❌ Force HTTPS même en localhost
    ].join("; ")
  }
]
```

**Impact** :
- `upgrade-insecure-requests` force le navigateur à utiliser HTTPS même sur `localhost:3000`
- En local, Next.js sert en HTTP → le navigateur essaie HTTPS → `ERR_SSL_PROTOCOL_ERROR`
- `Strict-Transport-Security` est aussi problématique en dev (cache HSTS)

**Solution requise** :
Conditionner ces headers à la production uniquement :
```typescript
async headers() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const securityHeaders = [
    { key: "X-DNS-Prefetch-Control", value: "on" },
    // ...
  ];
  
  // Headers HTTPS uniquement en production
  if (isProduction) {
    securityHeaders.push(
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    );
  }
  
  // CSP avec upgrade-insecure-requests conditionnel
  const cspDirectives = [
    "default-src 'self'",
    // ...
  ];
  
  if (isProduction) {
    cspDirectives.push("upgrade-insecure-requests");
  }
  
  return [{
    source: "/:path*",
    headers: [
      ...securityHeaders,
      { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
    ],
  }];
}
```

---

## 🔄 2. AUDIT DU FLUX DE DONNÉES (Portail Pro)

### ✅ Flux GarageTab (`src/components/features/dashboard/tabs/GarageTab.tsx`)

**Architecture** :
- **Composant** : `MyAds` (ligne 168)
- **Récupération** : Appel client direct Supabase dans `useEffect` (ligne 174-219)
- **Requête** : `.from("vehicles").select("*").eq("owner_id", user.id)`

**Problème identifié : Erreur 400 au premier chargement**

**Cause probable** :
1. **Race condition** : Le `user` peut être `null` ou non complètement initialisé lors du premier render
2. **Session Supabase non prête** : Les cookies de session peuvent ne pas être encore disponibles côté client
3. **Timing des hooks** : `useAuth()` peut retourner `user` avant que la session Supabase soit complètement chargée

**Code problématique** (ligne 174-179) :
```typescript
useEffect(() => {
  async function fetchMyVehicules() {
    if (!user) {
      setIsLoading(false);
      return;
    }
    // ❌ Si user.id existe mais la session Supabase n'est pas prête,
    // la requête échoue avec 400 (Bad Request / Unauthorized)
```

**Solution recommandée** :
```typescript
useEffect(() => {
  async function fetchMyVehicules() {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    // Attendre que la session Supabase soit prête
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn("Session non disponible, attente...");
      // Retry après un court délai
      setTimeout(() => fetchMyVehicules(), 500);
      return;
    }
    
    // Continuer avec la requête...
```

---

### ✅ Flux FavoritesTab (`src/components/features/dashboard/tabs/FavoritesTab.tsx`)

**Architecture** :
- **Context** : `useFavorites()` depuis `FavoritesContext`
- **Récupération** : Appel client via `getUserFavorites()` (ligne 10-11)
- **Double chargement** : Favoris depuis DB + migration localStorage

**Problème identifié : Erreur 400 au premier chargement**

**Cause probable** :
Même problème que GarageTab : session Supabase non prête au premier render.

**Code problématique** (`src/contexts/FavoritesContext.tsx`, ligne 38) :
```typescript
const dbFavorites = await getUserFavorites();
// ❌ getUserFavorites() peut échouer si la session n'est pas prête
```

**Solution recommandée** :
Ajouter une vérification de session dans `getUserFavorites()` :
```typescript
// src/lib/supabase/favorites.ts
export async function getUserFavorites(): Promise<string[]> {
  const supabase = createClient();
  
  // Vérifier la session d'abord
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return []; // Pas de session = pas de favoris
  }
  
  // Continuer avec la requête...
}
```

---

### 📊 Analyse des Erreurs 400 Intermittentes

**Pattern observé** :
- ❌ Premier chargement : Erreur 400
- ✅ Refresh (F5) : Fonctionne

**Hypothèses** :
1. **Hydration mismatch** : Le serveur et le client ont des états différents
2. **Session cookies** : Les cookies de session ne sont pas immédiatement disponibles côté client
3. **RLS Policies** : Les politiques RLS peuvent rejeter la requête si `auth.uid()` n'est pas encore disponible

**Vérifications à effectuer** :
```sql
-- Dans Supabase SQL Editor, vérifier les policies RLS sur vehicles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'vehicles';

-- Vérifier si les policies utilisent auth.uid() correctement
```

---

## 🎨 3. AUDIT DES FONCTIONNALITÉS 'PRO' (Database & UI)

### ✅ Champs de Couverture dans Profiles

**Fichier** : `supabase/schema_vFinal.sql` (ligne 43)

**État actuel** :
```sql
CREATE TABLE IF NOT EXISTS profiles (
  -- ...
  cover_image_url TEXT,  -- ✅ CHAMP EXISTE
  -- ...
);
```

**Résultat** : ✅ Le champ `cover_image_url` existe dans le schéma. La personnalisation de la couverture est possible.

**Recommandation** : Vérifier que le champ existe dans la base de production :
```sql
-- À exécuter dans Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('cover_image_url', 'avatar_url', 'garage_name');
```

---

### ❌ StatsTab : Placeholder uniquement

**Fichier** : `src/components/features/dashboard/tabs/StatsTab.tsx`

**État actuel** :
- Composant minimal (20 lignes)
- Aucune logique métier
- Message "Statistiques à venir"

**Ce qui manque** :
1. **Requêtes de statistiques** :
   - Nombre de vues par véhicule
   - Temps moyen sur chaque annonce
   - Demandes de contact
   - Évolution des prix
   
2. **Visualisations** :
   - Graphiques (Chart.js ou Recharts)
   - Tableaux de données
   - Filtres par période

3. **Données à collecter** :
   - Table `vehicle_stats` ou `analytics` à créer
   - Tracking des vues (à implémenter)
   - Tracking des clics (à implémenter)

**Plan d'action** :
```sql
-- Créer une table de statistiques
CREATE TABLE vehicle_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'contact_click', 'image_view')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Pour stocker des infos supplémentaires (IP, user-agent, etc.)
);

CREATE INDEX idx_vehicle_stats_vehicle_id ON vehicle_stats(vehicle_id);
CREATE INDEX idx_vehicle_stats_created_at ON vehicle_stats(created_at DESC);
```

---

### ❌ EquipeTab : Placeholder uniquement

**Fichier** : `src/components/features/dashboard/tabs/EquipeTab.tsx`

**État actuel** :
- Composant minimal (20 lignes)
- Aucune logique métier
- Message "Gestion d'équipe à venir"

**Ce qui manque** :
1. **Table d'équipe** :
   - Lier plusieurs utilisateurs à un garage Pro
   - Gérer les rôles (owner, manager, seller)
   - Permissions granulaires

2. **Fonctionnalités** :
   - Inviter des membres
   - Gérer les rôles
   - Révoquer l'accès

**Plan d'action** :
```sql
-- Créer une table team_members
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  garage_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'seller')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  UNIQUE(garage_id, user_id)
);

CREATE INDEX idx_team_members_garage_id ON team_members(garage_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
```

---

## 🌐 4. AUDIT DE LA VITRINE PUBLIQUE

### ✅ Page Vitrine Publique existe

**Fichier** : `src/app/garage/[userId]/page.tsx`

**État actuel** : Page dynamique présente

**Analyse requise** : Lire le fichier complet pour vérifier :
- Affichage du logo garage
- Support de la bannière (`cover_image_url`)
- Liste des véhicules du garage
- Informations de contact

**Recommandation** : Vérifier que la page récupère bien `cover_image_url` et `avatar_url` depuis `profiles`.

---

### ✅ VitrineTab référence la page publique

**Fichier** : `src/components/features/dashboard/tabs/VitrineTab.tsx` (ligne 30)

**État actuel** :
```typescript
<Link href={`/garage/${user.id}`} target="_blank">
  Voir ma vitrine
</Link>
```

**Résultat** : ✅ Le lien vers la vitrine publique est fonctionnel.

---

## 📋 RÉSUMÉ DES PROBLÈMES CRITIQUES

### 🔴 Priorité CRITIQUE (Blocage Production)

1. **Manifest.json bloqué** → `ERR_SSL_PROTOCOL_ERROR`
   - **Cause** : Middleware intercepte `/manifest.json`
   - **Impact** : PWA non fonctionnelle, assets bloqués
   - **Solution** : Ajouter `/manifest.json` à `alwaysAllowedRoutes`

2. **Headers HTTPS forcés en dev** → `ERR_SSL_PROTOCOL_ERROR`
   - **Cause** : `upgrade-insecure-requests` + HSTS en localhost
   - **Impact** : Site non testable en local
   - **Solution** : Conditionner ces headers à la production

---

### 🟡 Priorité HAUTE (Expérience Utilisateur)

3. **Erreurs 400 au premier chargement** → Garage & Favoris
   - **Cause** : Session Supabase non prête au premier render
   - **Impact** : Nécessite un refresh (F5) pour charger les données
   - **Solution** : Vérifier la session avant les requêtes + retry logic

---

### 🟢 Priorité MOYENNE (Fonctionnalités)

4. **StatsTab inactif** → Placeholder uniquement
   - **Solution** : Créer table `vehicle_stats` + implémenter tracking + graphiques

5. **EquipeTab inactif** → Placeholder uniquement
   - **Solution** : Créer table `team_members` + interface de gestion

---

## 🎯 PLAN D'ACTION TECHNIQUE

### Phase 1 : Corrections Critiques (30 min)

1. **Corriger le middleware** :
   - Ajouter `/manifest.json` à `alwaysAllowedRoutes`
   - Vérifier que tous les assets statiques sont bien exclus

2. **Corriger next.config.ts** :
   - Conditionner `upgrade-insecure-requests` et HSTS à la production
   - Tester en localhost après modification

---

### Phase 2 : Corrections Flux de Données (45 min)

3. **Corriger GarageTab** :
   - Ajouter vérification de session avant requête
   - Implémenter retry logic avec backoff
   - Ajouter loading states appropriés

4. **Corriger FavoritesTab** :
   - Même approche que GarageTab
   - Vérifier `getUserFavorites()` dans `src/lib/supabase/favorites.ts`

5. **Vérifier RLS Policies** :
   - S'assurer que les policies autorisent les requêtes utilisateur authentifié
   - Tester avec un utilisateur Pro en production

---

### Phase 3 : Implémentation Fonctionnalités Pro (4-6h)

6. **Implémenter StatsTab** :
   - Créer table `vehicle_stats`
   - Implémenter tracking des vues/clics
   - Créer composants de graphiques
   - Intégrer Recharts ou Chart.js

7. **Implémenter EquipeTab** :
   - Créer table `team_members`
   - Interface d'invitation par email
   - Gestion des rôles et permissions
   - Révocation d'accès

8. **Améliorer VitrineTab** :
   - Upload de `cover_image_url`
   - Upload de logo (utiliser `avatar_url` ou nouveau champ)
   - Preview de la vitrine publique

---

## 🔍 VÉRIFICATIONS SUPABASE REQUISES

### Vérification 1 : Champs Profiles

```sql
-- Exécuter dans Supabase SQL Editor
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

**Champs attendus** :
- ✅ `cover_image_url` (TEXT, nullable)
- ✅ `garage_name` (TEXT, nullable)
- ✅ `avatar_url` (TEXT, nullable)

---

### Vérification 2 : RLS Policies Vehicles

```sql
-- Vérifier les policies sur vehicles
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'vehicles';
```

**Policy attendue** :
- Policy permettant aux utilisateurs de voir leurs propres véhicules via `auth.uid() = owner_id`

---

### Vérification 3 : RLS Policies Favorites

```sql
-- Vérifier les policies sur favorites (si table existe)
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'favorites';
```

---

## 📊 SCHÉMA DE DONNÉES PROPOSÉ

### Table `vehicle_stats` (Statistiques)

```sql
CREATE TABLE vehicle_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id), -- Utilisateur qui a généré l'événement (peut être NULL si visiteur)
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'contact_click', 'image_view', 'share')),
  ip_address INET, -- Optionnel (RGPD)
  user_agent TEXT, -- Optionnel
  referrer TEXT, -- Optionnel
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Données supplémentaires flexibles
);

CREATE INDEX idx_vehicle_stats_vehicle_id ON vehicle_stats(vehicle_id);
CREATE INDEX idx_vehicle_stats_created_at ON vehicle_stats(created_at DESC);
CREATE INDEX idx_vehicle_stats_event_type ON vehicle_stats(event_type);

-- RLS
ALTER TABLE vehicle_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle owners can view their stats"
  ON vehicle_stats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vehicles
      WHERE vehicles.id = vehicle_stats.vehicle_id
      AND vehicles.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert stats"
  ON vehicle_stats FOR INSERT
  WITH CHECK (true);
```

---

### Table `team_members` (Équipe Pro)

```sql
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  garage_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'seller')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(garage_id, user_id)
);

CREATE INDEX idx_team_members_garage_id ON team_members(garage_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(status);

-- RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their team"
  ON team_members FOR SELECT
  USING (
    garage_id IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'pro'
    ) OR
    user_id = auth.uid()
  );

CREATE POLICY "Garage owners can manage team"
  ON team_members FOR ALL
  USING (
    garage_id IN (
      SELECT id FROM profiles WHERE id = auth.uid() AND role = 'pro'
    )
  );
```

---

## ✅ CHECKLIST DE VALIDATION

- [ ] Manifest.json accessible sans erreur SSL
- [ ] Assets statiques chargés correctement
- [ ] Headers HTTPS conditionnels (production uniquement)
- [ ] GarageTab charge sans erreur 400 au premier rendu
- [ ] FavoritesTab charge sans erreur 400 au premier rendu
- [ ] Session Supabase vérifiée avant chaque requête
- [ ] Champs `cover_image_url` vérifiés dans Supabase
- [ ] RLS Policies vérifiées et testées
- [ ] StatsTab fonctionnel avec données réelles
- [ ] EquipeTab fonctionnel avec gestion d'équipe
- [ ] VitrineTab permet upload de couverture
- [ ] Vitrine publique affiche logo et bannière

---

## 🚀 COMMANDES DE TEST

### Test 1 : Vérifier le manifest

```bash
# Démarrer le serveur
npm run dev

# Dans le navigateur, ouvrir :
http://localhost:3000/manifest.json

# Vérifier qu'il n'y a pas de redirection vers /coming-soon
```

### Test 2 : Vérifier les erreurs 400

```bash
# Ouvrir la console du navigateur (F12)
# Aller sur /dashboard?tab=garage
# Vérifier les erreurs réseau dans l'onglet Network
# Identifier les requêtes qui retournent 400
```

### Test 3 : Vérifier la session

```bash
# Dans la console du navigateur, tester :
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
// Si null au premier chargement, c'est le problème
```

---

**Prochaines étapes** : Implémenter les corrections critiques (Phase 1) et tester en localhost avant déploiement.

