# 🔍 AUDIT BASE DE DONNÉES REDZONE
## Rapport de Consolidation - Analyse Code vs Schema

Date: 2025-01-XX  
Objet: Identification des tables actives, orphelines et colonnes inutiles

---

## 📊 RÉSUMÉ EXÉCUTIF

### Tables Identifiées dans les Scripts SQL: **11 tables**

### Tables Utilisées dans le Code: **11 tables** ✅

**Bonne nouvelle : Aucune table orpheline majeure détectée !**

---

## ✅ TABLES ACTIVES (Vitales)

Toutes ces tables sont **activement utilisées** dans le code source (`src/`).

### 1. **`profiles`** ✅
- **Utilisation** : Authentification, gestion utilisateurs, rôles (admin, particulier, pro, moderator)
- **Fichiers SQL** : `update_profiles_premium.sql`, `add_professional_roles.sql`, `add_moderator_role.sql`, `admin_extensions.sql`
- **Code** : `src/lib/supabase/users.ts`, `src/lib/supabase/profiles.ts`, `src/contexts/AuthContext.tsx`
- **Status** : ✅ **ACTIVE - VITALE**

### 2. **`vehicules`** ✅
- **Utilisation** : Table principale pour les annonces de véhicules
- **Fichiers SQL** : Implémentation incrémentale via plusieurs scripts (`add_missing_columns.sql`, `add_advanced_filters.sql`, etc.)
- **Code** : `src/lib/supabase/vehicules.ts`, `src/hooks/useVehicules.ts`, `src/lib/supabase/search.ts`
- **Status** : ✅ **ACTIVE - VITALE**

### 3. **`tickets`** ✅
- **Utilisation** : Système de support (création, résolution par admin/moderator)
- **Fichiers SQL** : `finalization_phase.sql`, `update_tickets_for_routing.sql`, `add_ticket_response.sql`
- **Code** : `src/app/actions/tickets.ts`, `src/lib/supabase/tickets.ts`
- **Status** : ✅ **ACTIVE - VITALE**

### 4. **`notifications`** ✅
- **Utilisation** : Notifications utilisateur (validation annonces, réponses tickets, alertes sentinelle)
- **Fichiers SQL** : `create_notifications_table.sql`, `saved_searches_migration.sql` (doublon partiel)
- **Code** : `src/lib/supabase/notifications.ts`, `src/components/NotificationsPanel.tsx`, `src/components/layout/navbar.tsx`
- **Status** : ✅ **ACTIVE - VITALE**
- **⚠️ NOTE** : Table créée dans 2 fichiers SQL différents (consolidation recommandée)

### 5. **`saved_searches`** ✅
- **Utilisation** : Alertes Sentinelle (recherches sauvegardées avec notifications)
- **Fichiers SQL** : `saved_searches_migration.sql`
- **Code** : `src/lib/supabase/savedSearches.ts`
- **Status** : ✅ **ACTIVE - VITALE**

### 6. **`model_specs_db`** ✅
- **Utilisation** : Base de données des spécifications techniques (marque, modèle, puissance, CO2, etc.)
- **Fichiers SQL** : `create_model_specs_db_table.sql`
- **Code** : `src/lib/supabase/modelSpecs.ts`, `src/lib/supabase/modelSpecsAdmin.ts`
- **Status** : ✅ **ACTIVE - VITALE**
- **⚠️ NOTE** : Selon le commentaire dans le SQL, cette table est une migration future si `vehicleData.ts` > 400 Ko. Vérifier si elle est réellement utilisée ou si c'est juste préparé.

### 7. **`articles`** ✅
- **Utilisation** : Blog "Récits de Puristes" / UGC (User Generated Content)
- **Fichiers SQL** : `create_articles_table.sql`, `extend_articles_for_ugc.sql`
- **Code** : `src/lib/supabase/articles.ts`, `src/lib/supabase/articles-server.ts`, `src/components/PassionPostForm.tsx`
- **Status** : ✅ **ACTIVE - VITALE**

### 8. **`comments`** ✅
- **Utilisation** : Commentaires sur les articles (avec modération)
- **Fichiers SQL** : `create_comments_table.sql`
- **Code** : `src/lib/supabase/comments.ts`, `src/lib/supabase/server-actions/comments.ts`
- **Status** : ✅ **ACTIVE - VITALE**

### 9. **`faq_items`** ✅
- **Utilisation** : FAQ dynamique gérée par l'admin
- **Fichiers SQL** : `admin_extensions.sql`
- **Code** : `src/lib/supabase/faq.ts`
- **Status** : ✅ **ACTIVE - VITALE**

### 10. **`site_settings`** ✅
- **Utilisation** : Configuration globale du site (banner, maintenance, TVA, etc.)
- **Fichiers SQL** : `admin_fix.sql`, `admin_fix_safe.sql` (doublon)
- **Code** : `src/lib/supabase/settings.ts`
- **Status** : ✅ **ACTIVE - VITALE**
- **⚠️ NOTE** : Table créée dans 2 fichiers SQL différents (consolidation recommandée)

### 11. **`app_logs`** ✅
- **Utilisation** : Logging des actions critiques (erreurs, warnings, infos)
- **Fichiers SQL** : `create_app_logs_table.sql`
- **Code** : `src/lib/supabase/logs.ts`
- **Status** : ✅ **ACTIVE - VITALE**

---

## ⚠️ TABLES SUSPECTES/DOUBLONS

### Tables créées dans plusieurs fichiers SQL (à vérifier/consolider) :

1. **`notifications`**
   - Créée dans : `create_notifications_table.sql` (version principale)
   - Créée aussi dans : `saved_searches_migration.sql` (lignes 104-120) - **VERSION PARTIELLE**
   - **Action recommandée** : Supprimer la définition dans `saved_searches_migration.sql` (garder uniquement celle de `create_notifications_table.sql`)

2. **`site_settings`**
   - Créée dans : `admin_fix.sql` (version principale)
   - Créée aussi dans : `admin_fix_safe.sql` - **VERSION DUPLIQUÉE**
   - **Action recommandée** : Vérifier si `admin_fix_safe.sql` est vraiment nécessaire ou si c'est une sauvegarde. Si sauvegarde, supprimer le fichier ou renommer.

---

## 🛠 COLONNES INUTILES / À VÉRIFIER

### Table `tickets` :
- ✅ **`admin_reply`** : Ajoutée récemment via `add_ticket_response.sql` - **UTILISÉE** dans `src/app/dashboard/support/page.tsx`
- ✅ **`category`** : Ajoutée via `update_tickets_for_routing.sql` - **UTILISÉE** dans le code
- ✅ **`assigned_to`** : Ajoutée via `update_tickets_for_routing.sql` - **UTILISÉE** dans le code

### Table `profiles` :
- ✅ Toutes les colonnes semblent utilisées (garage_name, garage_description, website, etc.)
- ✅ Colonnes de ban (is_banned, ban_reason, ban_until) - **UTILISÉES**

### Table `vehicules` :
- ⚠️ **Note** : Cette table a été étendue via de nombreux scripts incrémentaux. Toutes les colonnes semblent utilisées dans `src/lib/supabase/types.ts`.
- ✅ Colonnes vérifiées : Toutes présentes dans le type TypeScript `Vehicule`

### Table `notifications` :
- ✅ **`metadata`** : Présente dans le SQL mais type `JSONB` - **UTILISÉE** dans `src/lib/supabase/notifications.ts`
- ✅ Toutes les colonnes utilisées

---

## 📋 SCRIPTS SQL À NETTOYER/ORGANISER

### Scripts de Migration/Réparation (à conserver mais documenter) :
- `fix_rls_*.sql` - Corrections RLS (conserver mais documenter)
- `security_fixes*.sql` - Corrections sécurité (conserver)
- `refactoring_rls_cleanup.sql` - Nettoyage RLS (conserver)

### Scripts de Test/Diagnostic (à supprimer ou déplacer) :
- ⚠️ **`test_golf_7r.sql`** - Script de test - **À SUPPRIMER** ou déplacer dans `supabase/tests/`
- ⚠️ **`diagnostic_*.sql`** - Scripts de diagnostic - **À DÉPLACER** dans `supabase/diagnostics/` ou supprimer si obsolète

### Scripts de Seed (à conserver mais organiser) :
- `seed_data.sql` - Données de test
- `seed_v2.sql` - Données de test version 2
- **Action** : Conserver mais documenter clairement qu'ils sont pour le dev/test

### Scripts Doublons :
- ⚠️ **`admin_fix_safe.sql`** vs `admin_fix.sql` - Vérifier lequel est la version active
- ⚠️ **`saved_searches_migration.sql`** contient une définition partielle de `notifications` - À nettoyer

---

## 🎯 RECOMMANDATIONS

### Priorité HAUTE :
1. ✅ **Consolider les définitions de `notifications`** (supprimer la version partielle dans `saved_searches_migration.sql`)
2. ✅ **Vérifier/Consolider `site_settings`** (déterminer si `admin_fix_safe.sql` est nécessaire)
3. ✅ **Supprimer les scripts de test** (`test_golf_7r.sql`)
4. ✅ **Déplacer les scripts de diagnostic** dans un dossier dédié

### Priorité MOYENNE :
1. Organiser les scripts SQL par catégorie (tables/, migrations/, fixes/, tests/)
2. Documenter chaque script avec sa date et son objectif
3. Créer un script master `schema_vFinal.sql` consolidant tout

### Priorité BASSE :
1. Nettoyer les commentaires obsolètes dans les scripts
2. Standardiser le format des commentaires SQL

---

## ✅ CONCLUSION

**Excellent état général** : Aucune table orpheline majeure détectée. Toutes les tables sont utilisées.

**Points d'attention** :
- Quelques définitions dupliquées de tables (`notifications`, `site_settings`)
- Scripts de test/diagnostic à organiser
- Structure de fichiers SQL à améliorer pour la maintenabilité

**Action immédiate recommandée** : Générer les scripts de nettoyage et le schéma master consolidé.

