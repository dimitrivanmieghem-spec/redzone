# Migration Guide: French to English Database Standardization

## Overview

This migration standardizes the database from French to English naming conventions for better code maintainability and industry standards.

## Critical Changes

### Table Rename
- `vehicules` → `vehicles`

### Column Mappings

| French (Old) | English (New) | Type |
|--------------|---------------|------|
| `marque` | `brand` | TEXT |
| `modele` | `model` | TEXT |
| `annee` | `year` | INTEGER |
| `km` | `mileage` | INTEGER |
| `carburant` | `fuel_type` | TEXT |
| `carrosserie` | `body_type` | TEXT |
| `puissance` | `power_hp` | INTEGER |
| `etat` | `condition` | TEXT |
| `norme_euro` | `euro_standard` | TEXT |
| `architecture_moteur` | `engine_architecture` | TEXT |
| `cv_fiscaux` | `fiscal_horsepower` | INTEGER |
| `couleur_interieure` | `interior_color` | TEXT |
| `nombre_places` | `seats_count` | INTEGER |
| `code_postal` | `postal_code` | TEXT |
| `ville` | `city` | TEXT |
| `telephone` | `phone` | TEXT |
| `email_contact` | `guest_email` | TEXT |

### Columns That Stay The Same (Already English)

- `id`, `created_at`, `user_id`, `type`, `prix`, `transmission`, `description`, `status`
- `is_email_verified`, `verification_code`, `verification_code_expires_at`
- `edit_token`, `audio_file`, `history`, `car_pass_url`, `is_manual_model`
- `contact_email`, `contact_methods`, `co2`, `poids_kg`, `zero_a_cent`, `admission`
- `car_pass`, `image`, `images`

## Migration Steps

### Step 1: Database Migration (SQL)

1. **Backup your database** ⚠️ CRITICAL
2. Run `supabase/standardize_db.sql` in Supabase SQL Editor
3. Verify the migration was successful (check logs)

### Step 2: Code Updates

Update all references in the following order:

1. **Types** (`src/lib/supabase/types.ts`)
   - Update `Database['public']['Tables']['vehicules']` → `vehicles`
   - Update all column names in Row, Insert, Update interfaces

2. **Core Functions** (`src/lib/supabase/vehicules.ts`)
   - Replace `.from('vehicules')` → `.from('vehicles')`
   - Update all column references

3. **Server Actions** (`src/lib/supabase/server-actions/vehicules.ts`)
   - Update column names in queries

4. **Pages & Components**
   - `src/app/sell/page.tsx` - Update form data mapping
   - `src/app/cars/[id]/page.tsx` - Update column references
   - `src/app/garage/[userId]/page.tsx` - Update queries
   - `src/app/admin/moderation/page.tsx` - Update queries
   - `src/components/features/vehicles/my-ads.tsx` - Update queries
   - `src/lib/supabase/search.ts` - Update queries
   - `src/hooks/useVehicules.ts` - Update queries
   - `src/lib/supabase/users.ts` - Update queries

5. **Actions**
   - `src/app/actions/vehicules.ts` - Update column references

### Step 3: Testing Checklist

- [ ] Can create a new vehicle listing
- [ ] Can view vehicle details
- [ ] Can edit vehicle listing
- [ ] Can delete vehicle listing
- [ ] Search functionality works
- [ ] Admin moderation works
- [ ] User's garage page displays vehicles
- [ ] All filters work correctly

## Files to Update

### Priority 1 (Critical - Core Functionality)
- `src/lib/supabase/types.ts`
- `src/lib/supabase/vehicules.ts`
- `src/lib/supabase/server-actions/vehicules.ts`
- `src/app/sell/page.tsx`

### Priority 2 (Important - User-Facing Features)
- `src/app/cars/[id]/page.tsx`
- `src/app/garage/[userId]/page.tsx`
- `src/lib/supabase/search.ts`
- `src/components/features/vehicles/my-ads.tsx`

### Priority 3 (Secondary - Admin/Utilities)
- `src/app/admin/moderation/page.tsx`
- `src/hooks/useVehicules.ts`
- `src/lib/supabase/users.ts`
- `src/app/actions/vehicules.ts`

## Rollback Plan

If migration fails:

```sql
-- Rollback table name
ALTER TABLE vehicles RENAME TO vehicules;

-- Rollback column names (reverse all ALTER TABLE RENAME COLUMN commands)
-- ... (see standardize_db.sql for reverse operations)
```

**Note:** Always have a database backup before running migrations!

