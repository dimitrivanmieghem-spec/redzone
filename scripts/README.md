# Scripts de Migration RedZone

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

