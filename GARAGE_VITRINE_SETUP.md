# 🏢 GUIDE : Vitrine Publique Garage Pro

## 📋 **OBJECTIF**

Créer une page vitrine publique pour chaque garage professionnel, accessible via `/garage/[userId]`, qui affiche :
- L'identité du garage (logo, nom, description)
- Les informations pratiques (adresse, site web, téléphone)
- Le stock complet de véhicules actifs

---

## ✅ **CE QUI A ÉTÉ CRÉÉ**

### 1. **Script SQL** (`supabase/extend_profiles_for_garage.sql`)
- Étend la table `profiles` avec les colonnes nécessaires pour la vitrine
- Met à jour le trigger pour copier automatiquement les métadonnées
- Crée une fonction de synchronisation pour les données existantes

### 2. **Page Vitrine** (`src/app/garage/[userId]/page.tsx`)
- Header avec logo, nom du garage, badges (Pro, Vérifié)
- Description et informations pratiques
- Grille de véhicules actifs du garage
- État vide élégant si aucun véhicule

### 3. **Composant CarCard Modifié**
- Affiche le nom du garage (si pro) ou le nom du vendeur (si particulier)
- Le nom du garage est cliquable et redirige vers `/garage/[userId]`

### 4. **Fonctions Utilitaires** (`src/lib/supabase/profiles.ts`)
- `getPublicProfile()` : Récupère un profil public par ID
- `getPublicProfiles()` : Récupère plusieurs profils en batch

---

## 🚀 **INSTALLATION**

### **Étape 1 : Exécuter le Script SQL**

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. **SQL Editor** → **New query**
4. Copiez-collez le contenu de `supabase/extend_profiles_for_garage.sql`
5. **Run** (Ctrl+Enter)

**Résultat attendu** :
- ✅ Colonnes ajoutées à la table `profiles`
- ✅ Trigger mis à jour
- ✅ Fonction de synchronisation créée
- ✅ Index créés pour optimiser les recherches

### **Étape 2 : Synchroniser les Données Existantes (Optionnel)**

Si vous avez déjà des utilisateurs avec des métadonnées, exécutez cette requête pour synchroniser :

```sql
SELECT public.sync_profile_metadata();
```

Cela copiera les métadonnées existantes depuis `auth.users` vers `profiles`.

### **Étape 3 : Vérifier**

Vérifiez que les colonnes ont été ajoutées :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

Vous devriez voir :
- `garage_name`
- `garage_description`
- `website`
- `address`
- `city`
- `postal_code`
- `phone`
- `bio`

---

## 📝 **UTILISATION**

### **Pour les Professionnels**

1. Allez dans **Dashboard** → **Paramètres**
2. Remplissez les informations du garage :
   - Nom du Garage
   - Logo
   - Site Web
   - Adresse
   - Description
3. Cliquez sur **Sauvegarder**

### **Accéder à la Vitrine**

Une fois les informations sauvegardées, la vitrine est accessible via :
```
/garage/[votre-user-id]
```

**Exemple** : Si votre `user_id` est `abc123`, votre vitrine sera à :
```
/garage/abc123
```

### **Lien depuis les Annonces**

Sur chaque carte de véhicule (`CarCard`), le nom du garage est maintenant cliquable et redirige vers la vitrine.

---

## 🎨 **DESIGN**

La page vitrine respecte :
- ✅ **Dark Mode** : Fond `neutral-950`, textes clairs
- ✅ **Responsive** : Mobile et Desktop optimisés
- ✅ **Style Apple-esque** : Épuré, moderne, élégant
- ✅ **Badges** : "Professionnel" et "Vérifié" bien visibles
- ✅ **Call-to-Action** : Bouton "Contacter le garage" proéminent

---

## 🔒 **SÉCURITÉ**

- ✅ **RLS activé** : La table `profiles` est protégée
- ✅ **Lecture publique** : Tout le monde peut lire les profils (nécessaire pour la vitrine)
- ✅ **Écriture protégée** : Seul le propriétaire peut modifier son profil
- ✅ **Données sensibles** : L'email n'est pas affiché publiquement (uniquement dans le mailto)

---

## 🐛 **DÉPANNAGE**

### **La page affiche "Garage introuvable"**

1. Vérifiez que l'utilisateur existe dans `profiles`
2. Vérifiez que `role = 'pro'`
3. Vérifiez que l'ID dans l'URL correspond à un `user_id` valide

### **Les colonnes n'apparaissent pas**

1. Vérifiez que le script SQL a été exécuté sans erreur
2. Vérifiez que les colonnes existent : `SELECT * FROM profiles LIMIT 1;`
3. Si les colonnes n'existent pas, réexécutez le script SQL

### **Les métadonnées ne sont pas synchronisées**

1. Exécutez : `SELECT public.sync_profile_metadata();`
2. Vérifiez les métadonnées dans `auth.users` : `SELECT raw_user_meta_data FROM auth.users WHERE id = 'votre-id';`

---

## 📚 **PROCHAINES ÉTAPES**

- [ ] Ajouter un système de notation/avis pour les garages
- [ ] Ajouter des statistiques (nombre de ventes, satisfaction)
- [ ] Ajouter un filtre par garage dans la recherche
- [ ] Ajouter une carte Google Maps avec l'adresse du garage

