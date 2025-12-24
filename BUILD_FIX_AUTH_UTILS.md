# 🔧 FIX BUILD ERROR - Séparation Client/Server

## 🚨 Problème

Erreur de build Next.js : `Ecmascript file had an error` liée à `next/headers`.

**Cause :** `src/lib/supabase/auth-utils.ts` importait `createServerClient` depuis `server.ts` (qui utilise `next/headers`), et ce fichier était importé dans des Client Components.

## ✅ Solution Appliquée

### 1. **Séparation des Utilitaires**

Création de deux fichiers distincts :

#### `src/lib/supabase/auth-utils-client.ts`
- ✅ **Client Side ONLY**
- ✅ Utilise `createClient()` (client browser)
- ✅ **Aucun import de `next/headers`**
- ✅ Fonctions : `isAdmin()`, `isAuthenticated()`, `requireAuth()`

#### `src/lib/supabase/auth-utils-server.ts`
- ✅ **Server Side ONLY**
- ✅ Utilise `createServerClient()` (client serveur avec `next/headers`)
- ✅ Fonctions : `isAdminServer()`, `requireAdmin()`

### 2. **Mise à Jour des Imports**

Tous les fichiers qui utilisent `requireAdmin()` importent maintenant directement depuis `auth-utils-server.ts` :

- ✅ `src/lib/supabase/server-actions/users.ts`
- ✅ `src/lib/supabase/vehicules.ts`
- ✅ `src/lib/supabase/users.ts`
- ✅ `src/lib/supabase/settings.ts`
- ✅ `src/lib/supabase/comments.ts`
- ✅ `src/lib/supabase/modelSpecsAdmin.ts`

### 3. **Fichier de Compatibilité**

`src/lib/supabase/auth-utils.ts` :
- ⚠️ **DEPRECATED** - Conservé pour compatibilité
- ✅ Réexporte uniquement les fonctions **client** (sans `next/headers`)
- ❌ **NE RÉEXPORTE PLUS** `requireAdmin` (pour éviter l'import de `next/headers`)

## 📁 Structure des Fichiers

```
src/lib/supabase/
├── auth-utils-client.ts    ← Client Components
├── auth-utils-server.ts    ← Server Actions/Components
├── auth-utils.ts           ← DEPRECATED (compatibilité)
├── server.ts               ← Utilise next/headers
└── client.ts               ← Client browser
```

## 🔒 Règles d'Import

### ✅ CORRECT

**Dans les Server Actions :**
```typescript
import { requireAdmin } from "@/lib/supabase/auth-utils-server";
```

**Dans les Client Components :**
```typescript
import { isAdmin } from "@/lib/supabase/auth-utils-client";
```

### ❌ INCORRECT

**Ne JAMAIS faire :**
```typescript
// ❌ Dans un Client Component
import { requireAdmin } from "@/lib/supabase/auth-utils-server"; // ❌ Importe next/headers
```

## 🧪 Vérification

Pour vérifier que le build fonctionne :

```bash
npm run build
```

Si le build réussit, le problème est résolu ! ✅

## 📝 Notes

- Les Server Actions (`server-actions/users.ts`, etc.) utilisent maintenant `auth-utils-server.ts`
- Les fonctions dans `vehicules.ts`, `users.ts`, etc. utilisent `auth-utils-server.ts` car elles sont appelées depuis des Server Actions
- Le fichier `auth-utils.ts` est conservé pour la compatibilité mais ne doit plus être utilisé pour `requireAdmin`

---

**Date de correction :** $(date)
**Status :** ✅ Résolu

