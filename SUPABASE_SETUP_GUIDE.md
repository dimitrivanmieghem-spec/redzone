# 🚀 REDZONE - GUIDE COMPLET SUPABASE

## 📋 **TABLE DES MATIÈRES**

1. [Installation](#1-installation)
2. [Configuration Supabase Dashboard](#2-configuration-supabase-dashboard)
3. [Migration SQL](#3-migration-sql)
4. [Configuration .env.local](#4-configuration-envlocal)
5. [Création d'un Admin](#5-création-dun-admin)
6. [Test de Connexion](#6-test-de-connexion)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. INSTALLATION

### ✅ **Packages Installés**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Résultat attendu** :
```
✓ @supabase/supabase-js@2.x.x
✓ @supabase/ssr@0.x.x
```

---

## 2. CONFIGURATION SUPABASE DASHBOARD

### **Étape 1 : Créer un Projet**

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous ou créez un compte
3. **New Project**
4. Remplissez :
   - **Name** : `redzone` (ou votre choix)
   - **Database Password** : Générez un mot de passe fort
   - **Region** : `Europe (Frankfurt)` (ou plus proche)
5. **Create new project** (⏱️ ~2 minutes)

### **Étape 2 : Créer le Storage Bucket**

1. **Dashboard** → **Storage**
2. **New bucket**
3. Paramètres :
   - **Name** : `files`
   - **Public** : ✅ **Coché**
4. **Create bucket**

### **Étape 3 : Activer Email Authentication**

1. **Dashboard** → **Authentication** → **Providers**
2. **Email** → **Enable Email provider** : ✅
3. **Save**

---

## 3. MIGRATION SQL

### **Étape 1 : Ouvrir le SQL Editor**

1. **Dashboard** → **SQL Editor**
2. **New query**

### **Étape 2 : Copier-Coller le Script**

Ouvrez le fichier `SUPABASE_MIGRATION.sql` et copiez **tout le contenu**.

Collez-le dans le SQL Editor.

### **Étape 3 : Exécuter**

Cliquez sur **Run** (ou `Ctrl+Enter`).

**Résultat attendu** :
```
Success. No rows returned
Tables créées: 2
Policies créées: 15
Functions créées: 3
```

### **Étape 4 : Vérifier les Tables**

1. **Dashboard** → **Table Editor**
2. Vous devez voir :
   - ✅ `profiles` (5 colonnes)
   - ✅ `vehicules` (27 colonnes)

---

## 4. CONFIGURATION .env.local

### **Étape 1 : Récupérer les Clés**

1. **Dashboard** → **Settings** → **API**
2. Copiez :
   - **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - **Anon (public) key** (commence par `eyJ...`)

### **Étape 2 : Créer .env.local**

À la **racine du projet**, créez un fichier `.env.local` :

```env
# RedZone - Configuration Supabase

NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANT** :
- Remplacez `votre-projet` par votre vraie URL
- Remplacez la clé par votre vraie Anon Key
- **NE COMMITEZ JAMAIS ce fichier** (déjà dans `.gitignore`)

### **Étape 3 : Redémarrer le Serveur**

```bash
# Arrêter (Ctrl+C)
npm run dev
```

---

## 5. CRÉATION D'UN ADMIN

### **Méthode 1 : Via Dashboard (Recommandé)**

1. **Dashboard** → **Authentication** → **Users**
2. **Add user**
3. Remplissez :
   - **Email** : `admin@redzone.be` (ou votre choix)
   - **Password** : Un mot de passe fort
   - **Auto-confirm user** : ✅ **Coché**
4. **Create user**
5. **Copiez l'UUID** de l'utilisateur créé

### **Méthode 2 : Promouvoir en Admin**

1. **Dashboard** → **SQL Editor**
2. **New query**
3. Script :

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@redzone.be';
```

4. **Run**

**Résultat attendu** :
```
Success. 1 row affected
```

### **Vérification**

```sql
SELECT id, email, role FROM profiles WHERE role = 'admin';
```

Vous devez voir votre admin.

---

## 6. TEST DE CONNEXION

### **Test 1 : API Accessible**

```bash
curl https://votre-projet.supabase.co/rest/v1/
```

**Résultat attendu** :
```json
{"message": "Welcome to PostgREST"}
```

### **Test 2 : Auth Fonctionne**

1. Allez sur **http://localhost:3000/register**
2. Inscrivez-vous avec :
   - **Email** : `test@redzone.be`
   - **Password** : `test1234`
   - **Nom** : `Test User`
3. Vérifiez :
   - Toast "Bienvenue sur RedZone !"
   - Redirection vers `/dashboard`
   - Avatar en haut à droite

### **Test 3 : Vérifier le Profil**

**Dashboard** → **Table Editor** → **profiles**

Vous devez voir le profil créé :
- `email` : `test@redzone.be`
- `full_name` : `Test User`
- `role` : `user`

### **Test 4 : Publier une Annonce**

1. Allez sur **http://localhost:3000/sell**
2. Remplissez le formulaire :
   - **Type** : Voiture
   - **Marque** : Porsche
   - **Modèle** : 911
   - **Prix** : 100000
   - **Année** : 2020
   - **Km** : 20000
   - **Carburant** : Essence
   - **Transmission** : Manuelle
   - **Puissance** : 450
   - **Description** : "Porsche 911 en excellent état"
3. **Publier l'annonce**

### **Test 5 : Vérifier l'Annonce dans Supabase**

**Dashboard** → **Table Editor** → **vehicules**

Vous devez voir l'annonce créée avec :
- `status` : `pending`
- `marque` : `Porsche`
- `modele` : `911`

### **Test 6 : Login Admin**

1. Allez sur **http://localhost:3000/admin/login**
2. Entrez le mot de passe : `admin123` (si configuré)
3. Vous devez être redirigé vers `/admin/dashboard`
4. Vous devez voir l'annonce en attente

### **Test 7 : Approuver l'Annonce**

1. Dans `/admin/dashboard`
2. Cliquez sur **Approuver** pour l'annonce Porsche
3. Toast vert "Véhicule approuvé !"
4. L'annonce disparaît de la liste "À Valider"

### **Test 8 : Vérifier sur la Homepage**

1. Allez sur **http://localhost:3000**
2. Vous devez voir l'annonce Porsche dans "Dernières Annonces"

---

## 7. TROUBLESHOOTING

### ❌ **Erreur : "Invalid API key"**

**Cause** : Clés `.env.local` incorrectes

**Solution** :
1. Vérifiez que `.env.local` existe à la racine
2. Vérifiez les valeurs (pas de guillemets)
3. Redémarrez le serveur (`npm run dev`)

### ❌ **Erreur : "relation 'profiles' does not exist"**

**Cause** : Migration SQL non exécutée

**Solution** :
1. Retournez dans **SQL Editor**
2. Exécutez `SUPABASE_MIGRATION.sql`
3. Vérifiez dans **Table Editor** que les tables existent

### ❌ **Erreur : "insert or update on table 'vehicules' violates foreign key constraint"**

**Cause** : `user_id` invalide

**Solution** :
1. Vérifiez que l'utilisateur est connecté
2. Vérifiez que `auth.uid()` retourne un UUID valide
3. Dans **SQL Editor** :

```sql
SELECT auth.uid(); -- Doit retourner un UUID
```

### ❌ **Erreur : "new row violates row-level security policy"**

**Cause** : RLS bloque l'insertion

**Solution** :
1. Vérifiez que l'utilisateur est authentifié
2. Vérifiez les policies dans **Database** → **Policies**
3. Pour débugger temporairement (⚠️ **DEV UNIQUEMENT**) :

```sql
ALTER TABLE vehicules DISABLE ROW LEVEL SECURITY;
```

### ❌ **Erreur : "Failed to upload file"**

**Cause** : Bucket non configuré ou policies manquantes

**Solution** :
1. **Storage** → Vérifiez que le bucket `files` existe et est **Public**
2. **Storage** → **Policies** → Vérifiez les 4 policies

### ❌ **Les Images ne s'affichent pas**

**Cause** : URLs Supabase Storage incorrectes

**Solution** :
1. Vérifiez que l'URL commence par `https://`
2. Testez l'URL directement dans le navigateur
3. Vérifiez que le bucket est **Public**

### ❌ **L'Admin ne peut pas tout voir**

**Cause** : Profil pas en `role='admin'`

**Solution** :

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'votre-email@admin.com';
```

### ❌ **Erreur CORS**

**Cause** : Origine non autorisée

**Solution** :
1. **Dashboard** → **Settings** → **API**
2. **Site URL** : `http://localhost:3000`
3. **Redirect URLs** : `http://localhost:3000/**`

---

## 📊 **RÉSUMÉ DES FICHIERS**

### **Nouveaux Fichiers (10)**

1. **`src/lib/supabase/client.ts`** - Client browser
2. **`src/lib/supabase/server.ts`** - Client server
3. **`src/lib/supabase/types.ts`** - Types TypeScript
4. **`src/lib/supabase/uploads.ts`** - Gestion uploads
5. **`src/lib/supabase/vehicules.ts`** - Actions véhicules
6. **`src/hooks/useVehicules.ts`** - Hook React
7. **`src/contexts/AuthContext.tsx`** - Auth Supabase (remplace ancien)
8. **`SUPABASE_MIGRATION.sql`** - Script SQL complet
9. **`SUPABASE_SETUP_GUIDE.md`** - Ce guide
10. **`ENV_SETUP.md`** - Guide variables env

### **Fichiers Modifiés (À venir)**

11. **`src/app/layout.tsx`** - Import du nouveau AuthProvider
12. **`src/app/page.tsx`** - Utilise `useVehicules()`
13. **`src/app/search/page.tsx`** - Utilise `useVehicules()`
14. **`src/app/cars/[id]/page.tsx`** - Utilise `useVehicule()`
15. **`src/app/sell/page.tsx`** - Upload + création
16. **`src/app/login/page.tsx`** - Auth Supabase
17. **`src/app/register/page.tsx`** - Auth Supabase
18. **`src/app/admin/dashboard/page.tsx`** - Requêtes Supabase

### **Fichiers À Supprimer (Après migration)**

- ~~`src/lib/authContext.tsx`~~ → Remplacé par `src/contexts/AuthContext.tsx`
- ~~`src/lib/mockData.ts`~~ → Remplacé par Supabase
- ~~`src/contexts/StoreContext.tsx`~~ → Remplacé par Supabase

---

## ✅ **CHECKLIST COMPLÈTE**

- [ ] Projet Supabase créé
- [ ] Bucket `files` créé (Public)
- [ ] Email Auth activé
- [ ] `SUPABASE_MIGRATION.sql` exécuté
- [ ] Tables `profiles` et `vehicules` créées
- [ ] `.env.local` créé avec les bonnes clés
- [ ] Serveur redémarré
- [ ] Admin créé et promu
- [ ] Test inscription (✅ Profil créé)
- [ ] Test publication (✅ Véhicule créé)
- [ ] Test admin (✅ Modération fonctionne)
- [ ] Test homepage (✅ Véhicule affiché)

---

## 🎯 **PROCHAINE ÉTAPE**

Maintenant que Supabase est configuré, je vais **migrer les pages** pour utiliser la vraie base de données :

1. ✅ Installation packages
2. ✅ Configuration clients
3. ✅ Types TypeScript
4. ✅ Hooks & Actions
5. ✅ Auth Context
6. ✅ Migration SQL
7. ⏳ **Mise à jour des pages** (Homepage, Search, Detail, Sell)
8. ⏳ **Suppression mockData.ts**

**Je continue maintenant avec la mise à jour du layout et des pages !** 🚀
