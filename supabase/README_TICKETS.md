# 🎫 Système de Tickets - Installation

## 📋 Instructions

1. **Ouvrez Supabase Dashboard** > **SQL Editor**
2. **Copiez-collez** le contenu de `supabase/create_tickets_table.sql`
3. **Cliquez sur Run** (ou F5)
4. **Vérifiez** qu'il n'y a pas d'erreurs

## ✅ Ce que le script fait

- ✅ Crée la table `tickets` avec toutes les colonnes nécessaires
- ✅ Ajoute la colonne `assigned_to` (admin | moderator)
- ✅ Ajoute les colonnes `status` (open | in_progress | resolved | closed)
- ✅ Crée les index pour les performances
- ✅ Configure Row Level Security (RLS) avec les bonnes politiques
- ✅ Crée un trigger pour mettre à jour `updated_at` automatiquement

## 🔒 Sécurité

- Les utilisateurs peuvent voir leurs propres tickets
- Les admins peuvent voir et gérer tous les tickets
- Les modérateurs peuvent voir et gérer les tickets qui leur sont assignés
- N'importe qui peut créer un ticket (même non connecté)

## 📊 Colonnes de la table

- `id` - UUID (Primary Key)
- `created_at` - Timestamp
- `updated_at` - Timestamp (auto-update)
- `user_id` - UUID (référence auth.users, nullable pour invités)
- `email_contact` - TEXT (email du créateur)
- `subject` - TEXT (bug | question | signalement | autre)
- `category` - TEXT (Technique | Contenu | Commercial)
- `message` - TEXT (message du ticket)
- `status` - TEXT (open | in_progress | resolved | closed)
- `assigned_to` - TEXT (admin | moderator)
- `admin_reply` - TEXT (réponse de l'admin, nullable)
- `admin_notes` - TEXT (notes internes, nullable)
- `resolved_at` - Timestamp (nullable)
- `resolved_by` - UUID (référence auth.users, nullable)
- `closed_at` - Timestamp (nullable)
- `closed_by` - UUID (référence auth.users, nullable)

