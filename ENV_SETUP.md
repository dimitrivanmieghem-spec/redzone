# 🔐 CONFIGURATION SUPABASE

## 📋 **ÉTAPES D'INSTALLATION**

### **1. Créer un fichier `.env.local`**

À la racine du projet, créez un fichier `.env.local` avec ce contenu :

```env
# RedZone - Configuration Supabase

# URL de votre projet Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co

# Clé publique Anon (trouvable dans Settings > API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-ici
```

### **2. Trouver vos clés Supabase**

1. Allez sur [https://supabase.com](https://supabase.com)
2. Ouvrez votre projet
3. **Settings** → **API**
4. Copiez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon (public) key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **3. Redémarrer le serveur**

```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
```

---

## 🗃️ **STRUCTURE DE LA BASE DE DONNÉES**

### **Table : `vehicules`**

```sql
CREATE TABLE vehicules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- Infos de base
  type TEXT NOT NULL CHECK (type IN ('car', 'moto')),
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  prix NUMERIC NOT NULL,
  annee INTEGER NOT NULL,
  km INTEGER NOT NULL,
  carburant TEXT NOT NULL CHECK (carburant IN ('essence', 'e85', 'lpg')),
  transmission TEXT NOT NULL CHECK (transmission IN ('manuelle', 'automatique', 'sequentielle')),
  carrosserie TEXT,
  puissance INTEGER NOT NULL,
  etat TEXT NOT NULL CHECK (etat IN ('Neuf', 'Occasion')),
  norme_euro TEXT NOT NULL,
  car_pass BOOLEAN DEFAULT FALSE,
  
  -- Médias
  image TEXT NOT NULL,
  images TEXT[],
  description TEXT,
  
  -- Modération
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  
  -- Technique
  architecture_moteur TEXT,
  admission TEXT,
  zero_a_cent NUMERIC,
  co2 INTEGER,
  poids_kg INTEGER,
  
  -- Passion
  audio_file TEXT,
  history TEXT[]
);

-- Index pour les recherches
CREATE INDEX idx_vehicules_status ON vehicules(status);
CREATE INDEX idx_vehicules_marque ON vehicules(marque);
CREATE INDEX idx_vehicules_type ON vehicules(type);
CREATE INDEX idx_vehicules_prix ON vehicules(prix);

-- Row Level Security (RLS)
ALTER TABLE vehicules ENABLE ROW LEVEL SECURITY;

-- Policy : Tout le monde peut lire les véhicules actifs
CREATE POLICY "Anyone can view active vehicles"
  ON vehicules FOR SELECT
  USING (status = 'active');

-- Policy : Les utilisateurs peuvent voir leurs propres véhicules
CREATE POLICY "Users can view own vehicles"
  ON vehicules FOR SELECT
  USING (auth.uid() = user_id);

-- Policy : Les admins peuvent tout voir
CREATE POLICY "Admins can view all vehicles"
  ON vehicules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy : Les utilisateurs peuvent créer leurs véhicules
CREATE POLICY "Users can insert own vehicles"
  ON vehicules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy : Les utilisateurs peuvent modifier leurs véhicules
CREATE POLICY "Users can update own vehicles"
  ON vehicules FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy : Les admins peuvent tout modifier
CREATE POLICY "Admins can update all vehicles"
  ON vehicules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );
```

### **Table : `profiles`**

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy : Tout le monde peut lire les profils
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Policy : Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### **Storage Bucket : `files`**

```sql
-- Créer le bucket dans Supabase Dashboard > Storage
-- Nom : "files"
-- Public : true (pour les images/audio)

-- Policies Storage
-- 1. Anyone can view files
CREATE POLICY "Anyone can view files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'files');

-- 2. Authenticated users can upload
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'files' 
    AND auth.role() = 'authenticated'
  );

-- 3. Users can update their own files
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 🚀 **MIGRATION DES DONNÉES**

### **Script d'Import (Optionnel)**

Si vous voulez importer les données de `mockData.ts` dans Supabase :

```typescript
// scripts/import-mock-data.ts
import { createClient } from '@supabase/supabase-js';
import { MOCK_VEHICULES } from '../src/lib/mockData';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service Role uniquement
);

async function importData() {
  for (const vehicule of MOCK_VEHICULES) {
    const { error } = await supabase
      .from('vehicules')
      .insert({
        ...vehicule,
        user_id: 'admin-user-id', // Remplacer par un vrai UUID
      });
    
    if (error) console.error('Erreur:', error);
    else console.log('✓ Importé:', vehicule.modele);
  }
}

importData();
```

---

## ✅ **FICHIERS CRÉÉS**

1. **`src/lib/supabase/client.ts`** - Client browser
2. **`src/lib/supabase/server.ts`** - Client server
3. **`src/lib/supabase/types.ts`** - Types TypeScript
4. **`ENV_SETUP.md`** - Guide de configuration
5. **`.env.local.example`** - Exemple de configuration

**Total** : 5 fichiers créés

---

## 📝 **PROCHAINES ÉTAPES**

1. ✅ **Packages installés** (@supabase/supabase-js + @supabase/ssr)
2. ✅ **Configuration créée** (client.ts, server.ts, types.ts)
3. ⏳ **Créer tables** dans Supabase Dashboard
4. ⏳ **Ajouter .env.local** avec vos clés
5. ⏳ **Migrer les pages** pour utiliser Supabase
6. ⏳ **Upload de fichiers** (photos + audio)
7. ⏳ **Authentification** (supabase.auth)

**Je continue maintenant avec la création des hooks et helpers...**

