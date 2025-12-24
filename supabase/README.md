# 📚 SUPABASE - Documentation et Scripts SQL

Ce dossier contient tous les scripts SQL et la documentation pour la base de données RedZone.

## 📋 Structure

### Fichiers Essentiels

- **`schema_vFinal.sql`** ⭐ - **Schéma master consolidé** de toute la base de données. Ce fichier représente la structure IDEALE et PROPRE de la base de données telle qu'elle devrait être aujourd'hui.
  - ⚠️ **ATTENTION** : Ce fichier est une RÉFÉRENCE. Ne pas exécuter tel quel sur une base existante.
  - Utilisez-le comme documentation de référence pour comprendre la structure complète.

- **`cleanup_schema.sql`** - Script de nettoyage de la base de données (vérifications d'intégrité, nettoyage de données orphelines).
  - ✅ Sécurisé à exécuter (contient principalement des vérifications).

- **`AUDIT_REPORT.md`** - Rapport complet de l'audit de la base de données réalisé en 2025-01-XX.
  - Liste des tables actives, orphelines, colonnes analysées.

### Dossier `_archived/`

Contient les fichiers SQL obsolètes archivés suite au nettoyage :
- Anciens scripts de création de tables (consolidés dans `schema_vFinal.sql`)
- Scripts de migration (déjà appliqués)
- Scripts de test/diagnostic
- Données de seed (dev/test)

**⚠️ NE PAS exécuter les scripts dans `_archived/` sur une base de données à jour** - ils contiennent des définitions obsolètes.

## 🗄️ Tables de la Base de Données

La base de données RedZone contient **11 tables actives** :

1. **`profiles`** - Utilisateurs (particulier, pro, admin, moderator)
2. **`vehicules`** - Annonces de véhicules
3. **`tickets`** - Système de support
4. **`notifications`** - Notifications utilisateur
5. **`saved_searches`** - Alertes Sentinelle (recherches sauvegardées)
6. **`articles`** - Blog "Récits de Puristes" / UGC
7. **`comments`** - Commentaires sur les articles
8. **`faq_items`** - FAQ dynamique
9. **`site_settings`** - Configuration globale du site
10. **`app_logs`** - Logging des actions critiques
11. **`model_specs_db`** - Spécifications techniques des véhicules

Toutes les tables sont documentées dans `schema_vFinal.sql` avec leurs colonnes, index, RLS policies et triggers.

## 🚀 Utilisation

### Pour une nouvelle base de données

1. Exécutez `schema_vFinal.sql` pour créer toute la structure
2. (Optionnel) Exécutez `cleanup_schema.sql` pour vérifier l'intégrité

### Pour une base existante

Si votre base de données est déjà à jour :
- ✅ Utilisez `schema_vFinal.sql` comme **référence** uniquement
- ✅ Exécutez `cleanup_schema.sql` pour vérifier l'intégrité

Si vous devez migrer vers cette structure :
- Consultez `AUDIT_REPORT.md` pour voir quels scripts ont été consolidés
- Référez-vous aux fichiers dans `_archived/` pour l'historique (mais ne les exécutez pas)

## 📖 Documentation

- **`AUDIT_REPORT.md`** - Rapport d'audit complet
- **`CLEANUP_PLAN.md`** - Plan de nettoyage réalisé
- **`_archived/README.md`** - Documentation des fichiers archivés

## ✅ État du Nettoyage

Dernier nettoyage effectué le : **2025-01-XX**

- ✅ 35+ fichiers obsolètes supprimés
- ✅ 6 fichiers de test/diagnostic archivés
- ✅ Structure consolidée dans `schema_vFinal.sql`
- ✅ Base de données propre et organisée

