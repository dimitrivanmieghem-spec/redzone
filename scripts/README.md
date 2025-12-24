# Scripts RedZone

## Création de Comptes de Test

### 🏠 Script Local (Recommandé pour développement)

**`scripts/create-local-users.ts`** - Création de comptes de test pour le développement local uniquement.

#### Prérequis

1. **Variables d'environnement** : Assurez-vous d'avoir ces variables dans votre `.env.local` :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
   ```

   💡 **Où trouver la Service Role Key ?**
   - Supabase Dashboard → Settings → API
   - Copiez la **Service Role Key** (⚠️ Ne la partagez jamais publiquement !)

#### Exécution

```bash
npx tsx scripts/create-local-users.ts
```

#### Résultat attendu

Le script va créer deux comptes de test pré-configurés :

1. **Compte Particulier** :
   - Email : `test.particulier@redzone.local`
   - Password : `Password123!`
   - Type : Particulier
   - Email auto-validé ✅

2. **Compte Professionnel** :
   - Email : `test.pro@redzone.local`
   - Password : `Password123!`
   - Type : Professionnel
   - TVA : BE0000000000
   - Email auto-validé ✅

#### Notes

- Si les utilisateurs existent déjà, le script affiche un message et continue
- Les profils sont automatiquement créés dans la table `profiles`
- Les comptes sont immédiatement utilisables (pas besoin de confirmer l'email)
- **Sécurité** : Le script vérifie strictement que `SUPABASE_SERVICE_ROLE_KEY` est présente

#### Utilisation

Une fois les comptes créés, vous pouvez vous connecter sur `/login` avec :
- `test.particulier@redzone.local` / `Password123!`
- `test.pro@redzone.local` / `Password123!`

---

### 🌐 Script Production (Alternative)

**`scripts/create-test-users.ts`** - Création de comptes de test pour la production (emails `.be`).

#### Exécution

```bash
npx tsx scripts/create-test-users.ts
```

#### Résultat attendu

Le script va créer deux comptes de test pré-configurés :

1. **Compte Particulier** :
   - Email : `test.particulier@redzone.be`
   - Password : `Password123!`
   - Type : Particulier
   - Email auto-validé ✅

2. **Compte Professionnel** :
   - Email : `test.pro@redzone.be`
   - Password : `Password123!`
   - Type : Professionnel
   - TVA : BE0123456789
   - Email auto-validé ✅

---

## Migration vehicleData.ts vers Supabase

### Prérequis

1. **Table Supabase créée** : Exécutez d'abord le script SQL `supabase/create_model_specs_db_table.sql` dans le SQL Editor de Supabase.

2. **Variables d'environnement** : Assurez-vous d'avoir ces variables dans votre `.env.local` :
   ```
   NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
   ```

### Exécution

```bash
# Installer tsx si nécessaire
npm install -g tsx

# Exécuter le script de migration
npx tsx scripts/migrate-vehicle-data.ts
```

### Résultat attendu

Le script va :
- Lire toutes les données de `vehicleData.ts` (avant suppression)
- Les insérer dans la table `model_specs_db` de Supabase
- Utiliser `upsert` pour éviter les doublons (basé sur marque + modèle + type)
- Afficher un résumé avec le nombre de véhicules insérés

### Notes

- Le script utilise la clé `SERVICE_ROLE_KEY` pour bypasser RLS (Row Level Security)
- Les données sont insérées par batch de 100 pour éviter les timeouts
- Les valeurs `co2: 0` sont converties en `NULL` pour les anciens modèles

