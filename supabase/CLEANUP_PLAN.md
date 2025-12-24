# 🧹 PLAN DE NETTOYAGE SUPABASE

## Fichiers à SUPPRIMER (consolidés dans schema_vFinal.sql)

### Tables principales (CREATE TABLE)
- ✅ `create_notifications_table.sql` → Consolidé dans schema_vFinal.sql
- ✅ `create_articles_table.sql` → Consolidé dans schema_vFinal.sql
- ✅ `create_comments_table.sql` → Consolidé dans schema_vFinal.sql
- ✅ `create_app_logs_table.sql` → Consolidé dans schema_vFinal.sql
- ✅ `create_model_specs_db_table.sql` → Consolidé dans schema_vFinal.sql
- ✅ `admin_extensions.sql` → Consolidé (faq_items, site_settings)
- ✅ `admin_fix.sql` → Consolidé (site_settings)
- ✅ `admin_fix_safe.sql` → Doublon de admin_fix.sql
- ✅ `finalization_phase.sql` → Consolidé (tickets, edit_token) - NOTE: Contient fonction delete_vehicule_by_token non incluse dans schema_vFinal.sql
- ✅ `saved_searches_migration.sql` → Consolidé (saved_searches) + doublon notifications

### Migrations/Extensions profiles
- ✅ `update_profiles_premium.sql` → Consolidé dans schema_vFinal.sql (profiles)
- ✅ `extend_profiles_for_garage.sql` → Consolidé dans schema_vFinal.sql (profiles)
- ✅ `add_professional_roles.sql` → Consolidé dans schema_vFinal.sql (profiles)
- ✅ `add_moderator_role.sql` → Consolidé dans schema_vFinal.sql (profiles)
- ✅ `user_ban_migration.sql` → Consolidé dans schema_vFinal.sql (profiles)

### Migrations/Extensions tickets
- ✅ `update_tickets_for_routing.sql` → Consolidé dans schema_vFinal.sql (tickets)
- ✅ `add_ticket_response.sql` → Consolidé dans schema_vFinal.sql (tickets)

### Migrations/Extensions articles
- ✅ `extend_articles_for_ugc.sql` → Consolidé dans schema_vFinal.sql (articles)

### Migrations/Extensions vehicules
- ✅ `add_advanced_filters.sql` → Consolidé dans schema_vFinal.sql (vehicules)
- ✅ `add_missing_columns.sql` → Consolidé dans schema_vFinal.sql (vehicules)
- ✅ `add_location_fields.sql` → Consolidé dans schema_vFinal.sql (vehicules)
- ✅ `enable_guest_ads.sql` → Consolidé dans schema_vFinal.sql (vehicules)
- ✅ `guest_email_verification.sql` → Consolidé dans schema_vFinal.sql (vehicules)

### Fixes RLS/Security (déjà appliqués)
- ✅ `fix_rls_vehicules_insert.sql` → Consolidé dans schema_vFinal.sql (RLS)
- ✅ `fix_storage_guest_upload.sql` → Probablement obsolète
- ✅ `fix_policies.sql` → Consolidé dans schema_vFinal.sql (RLS)
- ✅ `fix_public_read_specs.sql` → Consolidé dans schema_vFinal.sql (RLS)
- ✅ `fix_public_read_specs_final.sql` → Consolidé dans schema_vFinal.sql (RLS)
- ✅ `fix_model_specs_rls.sql` → Consolidé dans schema_vFinal.sql (RLS)
- ✅ `fix_model_specs_public_read.sql` → Consolidé dans schema_vFinal.sql (RLS)
- ✅ `fix_model_specs_final.sql` → Consolidé dans schema_vFinal.sql (RLS)
- ✅ `fix_rls_model_specs_db_urgent.sql` → Consolidé dans schema_vFinal.sql (RLS)
- ✅ `refactoring_rls_cleanup.sql` → Consolidé dans schema_vFinal.sql (RLS)
- ✅ `security_fixes.sql` → Consolidé dans schema_vFinal.sql (RLS)
- ✅ `security_fixes_critical.sql` → Consolidé dans schema_vFinal.sql (RLS)
- ✅ `enforce_thermal_only.sql` → Consolidé dans schema_vFinal.sql (CHECK constraints)

## Fichiers à ARCHIVER (test/diagnostic/seed)

### Tests
- 📦 `test_golf_7r.sql` → À archiver (test)

### Diagnostics
- 📦 `diagnostic_co2.sql` → À archiver (diagnostic)
- 📦 `diagnostic_model_specs.sql` → À archiver (diagnostic)

### Seed Data (dev/test)
- 📦 `seed_data.sql` → À archiver (données de test)
- 📦 `seed_v2.sql` → À archiver (données de test)
- 📦 `clean_data.sql` → À archiver (nettoyage données de test)

## Fichiers à CONSERVER

### Documentation/Schémas
- ✅ `schema_vFinal.sql` → Schéma master consolidé (ESSENTIEL)
- ✅ `cleanup_schema.sql` → Script de nettoyage (ESSENTIEL)
- ✅ `AUDIT_REPORT.md` → Rapport d'audit (ESSENTIEL)

---

Total fichiers à supprimer: **~35 fichiers**
Total fichiers à archiver: **6 fichiers**

