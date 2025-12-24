# 🔒 Configuration de la Table audit_logs

## Problème
La table `audit_logs` n'existe pas dans Supabase, ce qui cause des erreurs 404 lors des tentatives d'écriture de logs d'audit.

## Solution
Exécuter le script SQL pour créer la table `audit_logs` dans Supabase.

## Instructions

1. **Ouvrir le SQL Editor dans Supabase**
   - Connectez-vous à votre projet Supabase
   - Allez dans "SQL Editor" dans le menu de gauche

2. **Exécuter le script**
   - Ouvrez le fichier `supabase/create_audit_logs_table.sql`
   - Copiez tout le contenu du fichier
   - Collez-le dans le SQL Editor de Supabase
   - Cliquez sur "Run" pour exécuter le script

3. **Vérifier la création**
   - Allez dans "Table Editor" dans Supabase
   - Vérifiez que la table `audit_logs` apparaît dans la liste des tables

## Structure de la table

La table `audit_logs` contient :
- `id` : UUID (clé primaire)
- `created_at` : Timestamp
- `user_id` : UUID (référence vers auth.users)
- `user_email` : Email de l'utilisateur
- `action_type` : Type d'action (data_access, login_attempt, etc.)
- `resource_type` : Type de ressource (profile, vehicule, etc.)
- `resource_id` : ID de la ressource
- `description` : Description de l'action
- `ip_address` : Adresse IP
- `user_agent` : User-Agent du navigateur
- `metadata` : Métadonnées supplémentaires (JSON)
- `status` : Statut (success, failed, blocked)
- `error_message` : Message d'erreur (si applicable)

## Politiques RLS

- **Admins** : Peuvent voir tous les logs
- **Utilisateurs** : Peuvent voir leurs propres logs
- **Système** : Peut créer des logs (via Server Actions)

## Nettoyage automatique

Une fonction `cleanup_old_audit_logs()` est disponible pour nettoyer les logs de plus de 2 ans (conformité RGPD).

## Important

⚠️ **Après avoir créé la table, les erreurs 404 dans la console disparaîtront automatiquement.**

Le code est déjà configuré pour utiliser cette table une fois qu'elle existe.

