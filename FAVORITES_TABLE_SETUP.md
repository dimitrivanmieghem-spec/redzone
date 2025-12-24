# 🔧 Configuration de la Table Favorites

## Problème identifié

La table `favorites` n'existe pas dans votre base de données Supabase, ce qui cause les erreurs suivantes :
- `404 (Not Found)` lors des appels API vers `/rest/v1/favorites`
- `Could not find the table 'public.favorites' in the schema cache`

## Solution

Exécutez le script SQL fourni dans Supabase pour créer la table.

## 📋 Instructions

1. **Ouvrez votre projet Supabase**
   - Allez sur [supabase.com](https://supabase.com)
   - Connectez-vous à votre projet

2. **Ouvrez le SQL Editor**
   - Dans le menu latéral, cliquez sur "SQL Editor"
   - Cliquez sur "New query"

3. **Copiez et collez le script**
   - Ouvrez le fichier `supabase/create_favorites_table.sql`
   - Copiez tout le contenu
   - Collez-le dans le SQL Editor de Supabase

4. **Exécutez le script**
   - Cliquez sur "Run" ou appuyez sur `Ctrl+Enter` (ou `Cmd+Enter` sur Mac)
   - Vérifiez qu'il n'y a pas d'erreurs dans les résultats

5. **Vérifiez la création**
   - Allez dans "Table Editor" dans le menu latéral
   - Vous devriez voir la table `favorites` dans la liste
   - Vérifiez qu'elle contient les colonnes :
     - `id` (UUID, Primary Key)
     - `user_id` (UUID, Foreign Key vers auth.users)
     - `vehicle_id` (UUID, Foreign Key vers vehicles)
     - `created_at` (Timestamp)

## ✅ Vérification

Après avoir exécuté le script, testez dans votre application :

1. **Rechargez la page `/search`**
2. **Cliquez sur le cœur d'une annonce pour l'ajouter aux favoris**
3. **Vérifiez qu'il n'y a plus d'erreur dans la console (F12)**
4. **Vérifiez que le favori apparaît dans `/dashboard/favorites`**

## 🔍 Structure de la table

La table `favorites` a la structure suivante :

```sql
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES vehicles ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id)  -- Un utilisateur ne peut ajouter un véhicule qu'une seule fois
);
```

## 🔒 Sécurité (RLS)

Le script configure automatiquement Row Level Security (RLS) avec les policies suivantes :

- **SELECT** : Les utilisateurs peuvent voir leurs propres favoris
- **INSERT** : Les utilisateurs peuvent ajouter leurs propres favoris
- **DELETE** : Les utilisateurs peuvent supprimer leurs propres favoris

## 📊 Index de performance

Le script crée automatiquement des index pour optimiser les requêtes :

- `idx_favorites_user_id` : Pour les requêtes par utilisateur
- `idx_favorites_vehicle_id` : Pour les requêtes par véhicule
- `idx_favorites_created_at` : Pour le tri chronologique

## ⚠️ Important

- Le script est **idempotent** : vous pouvez l'exécuter plusieurs fois sans risque
- Si la table existe déjà, le script affichera un message mais ne fera rien de destructif
- Les policies existantes seront recréées (anciennes supprimées puis nouvelles créées)

## 🐛 Si vous rencontrez des erreurs

Si le script échoue, vérifiez :

1. **La table `vehicles` existe** : Le script fait référence à `vehicles`, assurez-vous qu'elle existe
2. **Vous avez les permissions** : Vous devez être administrateur du projet Supabase
3. **La syntaxe SQL** : Vérifiez qu'il n'y a pas de caractères invisibles copiés

Si le problème persiste, contactez le support ou vérifiez les logs dans Supabase.

