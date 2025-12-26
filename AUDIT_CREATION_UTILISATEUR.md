# 🔍 AUDIT COMPLET - CRÉATION D'UTILISATEUR ADMIN

## 📋 RÉSUMÉ EXÉCUTIF

**Problème** : La création d'un utilisateur via `/admin/users` échoue.

**Diagnostic** : **B) Bug dans le Trigger SQL** (le plus probable) + **C) Mismatch de colonnes** (secondaire)

---

## 1️⃣ ANALYSE DU FRONTEND

### Fichier : `src/app/admin/users/page.tsx`

- **Fonction appelée** : `createUserManually()` (ligne 513)
- **Source** : `@/lib/supabase/server-actions/users`
- **Gestion d'erreurs** : ✅ Les erreurs sont loggées et affichées via `showToast()`

### Flux Frontend
```typescript
const result = await createUserManually(
  newUserData.email,
  newUserData.password,
  newUserData.fullName,
  newUserData.role
);
if (result.success) {
  showToast("Utilisateur créé avec succès", "success");
} else {
  showToast(result.error || "Erreur lors de la création", "error");
}
```

✅ **Verdict Frontend** : Le code gère correctement les erreurs. Le problème ne vient pas du frontend.

---

## 2️⃣ ANALYSE DU BACKEND (Server Action)

### Fichier : `src/lib/supabase/server-actions/users.ts`

#### Fonction : `createUserManually()` (lignes 245-348)

**Étapes du processus** :

1. ✅ **Vérification admin** : Utilise `requireAdmin(supabase)` avec client serveur
2. ✅ **Validation des données** : Email, password, fullName, role
3. ✅ **Client Admin** : Utilise `createAdminClient()` qui utilise `SUPABASE_SERVICE_ROLE_KEY`
4. ✅ **Création Auth** : `serviceClient.auth.admin.createUser()` avec `email_confirm: true`
5. ⚠️ **Création Profil** : `serviceClient.from("profiles").upsert()` avec `onConflict: "id"`

#### Code Critique (lignes 292-319)
```typescript
// Créer ou mettre à jour le profil dans la table profiles
const { error: profileError } = await serviceClient
  .from("profiles")
  .upsert({
    id: userId,
    email: email.trim().toLowerCase(),
    full_name: fullName.trim(),
    role: role,
  }, {
    onConflict: "id",
  });

if (profileError) {
  // Si l'erreur est due à un profil déjà existant (créé par trigger), on le met à jour
  const { error: updateError } = await serviceClient
    .from("profiles")
    .update({
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      role: role,
    })
    .eq("id", userId);
  // ...
}
```

✅ **Verdict Backend** : Le code utilise bien `service_role` et gère le cas où le trigger crée déjà le profil.

---

## 3️⃣ AUDIT SUPABASE & DATABASE

### A) Permissions Service Role

**Fichier** : `src/lib/supabase/admin.ts`

```typescript
export function createAdminClient() {
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

✅ **Verdict** : Le client admin utilise bien la `SERVICE_ROLE_KEY` qui contourne toutes les politiques RLS.

---

### B) Trigger de Profil

**Fichier** : `supabase/MASTER_SCHEMA_V2.sql` (lignes 1132-1148)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### ⚠️ PROBLÈME IDENTIFIÉ #1 : Le trigger ne définit pas le `role`

Le trigger insère seulement :
- `id` (UUID)
- `email` (TEXT NOT NULL)
- `full_name` (TEXT, nullable)

**Mais** : Le trigger **ne définit pas** le champ `role`, qui a une valeur par défaut `'particulier'` dans le schéma.

**Impact** : Si le trigger s'exécute AVANT l'upsert manuel, le profil est créé avec `role = 'particulier'` par défaut, puis l'upsert essaie de le mettre à jour. Cela devrait fonctionner, MAIS...

#### ⚠️ PROBLÈME IDENTIFIÉ #2 : Race condition potentielle

1. `auth.admin.createUser()` crée l'utilisateur dans `auth.users`
2. Le trigger `on_auth_user_created` s'exécute **immédiatement** (AFTER INSERT)
3. Le trigger insère dans `profiles` avec `role = 'particulier'` (valeur par défaut)
4. L'upsert manuel essaie ensuite d'insérer/mettre à jour avec le `role` spécifié

**Si le trigger échoue** (par exemple, si `NEW.email` est NULL ou si une contrainte échoue), l'upsert manuel devrait quand même fonctionner grâce à `onConflict: "id"`.

---

### C) Contraintes de Table

**Fichier** : `supabase/MASTER_SCHEMA_V2.sql` (lignes 40-75)

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Informations de base
  email TEXT NOT NULL UNIQUE,  -- ⚠️ NOT NULL
  full_name TEXT,              -- ✅ Nullable
  avatar_url TEXT,             -- ✅ Nullable
  
  -- Rôles
  role TEXT DEFAULT 'particulier' CHECK (role IN ('particulier', 'pro', 'admin', 'moderator', 'support', 'editor', 'viewer')),
  -- ...
);
```

#### Analyse des contraintes :

1. ✅ `email TEXT NOT NULL UNIQUE` : Le trigger fournit `NEW.email`, qui devrait toujours être présent
2. ✅ `role TEXT DEFAULT 'particulier'` : Valeur par défaut présente, donc pas de problème si le trigger ne le définit pas
3. ✅ `full_name TEXT` : Nullable, donc pas de problème

**MAIS** : Si `NEW.email` est NULL dans `auth.users` (ce qui ne devrait pas arriver mais peut arriver dans certains cas), le trigger échouera avec :
```
ERROR: null value in column "email" violates not-null constraint
```

---

## 4️⃣ VÉRIFICATION RLS

**Fichier** : `supabase/MASTER_SCHEMA_V2.sql` (lignes 87-120)

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
```

#### ⚠️ PROBLÈME IDENTIFIÉ #3 : Pas de politique INSERT pour les admins

**Politiques RLS existantes** :
- ✅ SELECT : Tout le monde peut voir les profils
- ✅ UPDATE : Les utilisateurs peuvent mettre à jour leur propre profil
- ✅ UPDATE : Les admins peuvent mettre à jour tous les profils
- ❌ **INSERT : AUCUNE POLITIQUE** (sauf via le trigger qui utilise `SECURITY DEFINER`)

**Impact** : Même si le client admin utilise `service_role` (qui contourne RLS), le trigger `handle_new_user()` utilise `SECURITY DEFINER`, ce qui signifie qu'il s'exécute avec les privilèges du propriétaire de la fonction (généralement `postgres` ou `supabase_admin`), donc il devrait pouvoir insérer.

**MAIS** : Si le trigger échoue pour une autre raison (contrainte, email NULL, etc.), l'upsert manuel devrait quand même fonctionner car le client admin contourne RLS.

---

## 5️⃣ DIAGNOSTIC FINAL

### 🔴 PROBLÈME PRINCIPAL : Bug dans le Trigger SQL

**Cause probable** : Le trigger `handle_new_user()` peut échouer dans certains cas :

1. **Email NULL** : Si `NEW.email` est NULL (rare mais possible), le trigger échouera avec une contrainte NOT NULL
2. **Race condition** : Si le trigger s'exécute mais échoue silencieusement, l'upsert manuel peut aussi échouer
3. **Contrainte UNIQUE** : Si un profil existe déjà avec le même email (cas très rare mais possible)

### 🟡 PROBLÈME SECONDAIRE : Mismatch de colonnes

Le trigger n'insère pas le `role`, mais cela ne devrait pas poser de problème car :
- Le `role` a une valeur par défaut `'particulier'`
- L'upsert manuel met à jour le `role` après

**MAIS** : Si le trigger échoue, l'upsert peut échouer aussi si le profil n'existe pas encore.

---

## 6️⃣ SOLUTIONS RECOMMANDÉES

### Solution 1 : Améliorer le Trigger (RECOMMANDÉ)

**Fichier** : `supabase/fix_trigger_profiles.sql`

```sql
-- Améliorer le trigger pour gérer les erreurs et inclure le role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que l'email n'est pas NULL
  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'Email cannot be NULL';
  END IF;

  -- Insérer le profil avec gestion d'erreur
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::TEXT,
      'particulier'
    )
  )
  ON CONFLICT (id) DO NOTHING; -- Ne pas échouer si le profil existe déjà
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Logger l'erreur mais ne pas bloquer la création de l'utilisateur auth
    RAISE WARNING 'Erreur lors de la création du profil pour %: %', NEW.email, SQLERRM;
    RETURN NEW; -- Retourner NEW pour ne pas bloquer l'insertion dans auth.users
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Solution 2 : Améliorer la fonction `createUserManually`

**Fichier** : `src/lib/supabase/server-actions/users.ts`

```typescript
// Après la création auth, attendre un peu pour que le trigger s'exécute
await new Promise(resolve => setTimeout(resolve, 100));

// Ensuite, faire l'upsert avec gestion d'erreur améliorée
const { error: profileError } = await serviceClient
  .from("profiles")
  .upsert({
    id: userId,
    email: email.trim().toLowerCase(),
    full_name: fullName.trim(),
    role: role,
  }, {
    onConflict: "id",
  });

if (profileError) {
  // Si l'erreur est "duplicate key" ou "unique constraint", c'est normal (trigger a créé le profil)
  if (profileError.code === '23505' || profileError.message?.includes('duplicate') || profileError.message?.includes('unique')) {
    // Le profil existe déjà, faire un UPDATE
    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        role: role,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Erreur mise à jour profil après trigger:", updateError);
      // Ne pas échouer complètement, le profil existe déjà
    }
  } else {
    // Autre erreur, la logger mais ne pas bloquer
    console.error("Erreur upsert profil:", profileError);
  }
}
```

### Solution 3 : Ajouter une politique RLS INSERT pour les admins (Optionnel)

```sql
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
```

**Note** : Cette politique n'est pas nécessaire si le client admin utilise `service_role` (qui contourne RLS), mais elle peut être utile pour la cohérence.

---

## 7️⃣ ACTIONS IMMÉDIATES

1. ✅ **Vérifier les logs Supabase** : Regarder les erreurs exactes dans le dashboard Supabase > Logs
2. ✅ **Tester le trigger manuellement** : Exécuter un INSERT dans `auth.users` et voir si le trigger fonctionne
3. ✅ **Appliquer Solution 1** : Améliorer le trigger pour gérer les erreurs
4. ✅ **Appliquer Solution 2** : Améliorer la gestion d'erreur dans `createUserManually`

---

## 8️⃣ CONCLUSION

**Diagnostic** : 
- **A) Manque de privilèges admin** : ❌ NON (le client utilise bien `service_role`)
- **B) Bug dans le Trigger SQL** : ✅ **OUI** (le plus probable)
- **C) Mismatch de colonnes** : ⚠️ **PARTIELLEMENT** (le trigger ne définit pas le `role`, mais il y a une valeur par défaut)

**Recommandation** : Appliquer les Solutions 1 et 2 pour rendre le système plus robuste.

