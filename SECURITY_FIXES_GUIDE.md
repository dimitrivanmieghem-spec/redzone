# 🔒 GUIDE D'APPLICATION DES CORRECTIFS DE SÉCURITÉ

## 📋 RÉSUMÉ DES CORRECTIFS

Ce guide vous explique comment appliquer les correctifs de sécurité identifiés dans l'audit.

---

## ✅ CORRECTIFS AUTOMATIQUES (DÉJÀ APPLIQUÉS)

Les fichiers suivants ont été créés/modifiés automatiquement :

1. ✅ **`src/middleware.ts`** - Middleware de protection des routes
2. ✅ **`src/lib/validation.ts`** - Module de validation et sanitization
3. ✅ **`src/lib/supabase/vehicules.ts`** - Intégration de la validation

**Aucune action requise** pour ces fichiers, ils sont prêts à être utilisés.

---

## 🔧 CORRECTIFS MANUELS (À APPLIQUER)

### 1. CORRIGER LES POLITIQUES RLS DU STORAGE (CRITIQUE)

**Fichier :** `supabase/security_fixes.sql`

**Action :**
1. Ouvrez Supabase Dashboard > SQL Editor
2. Copiez-collez le contenu de `supabase/security_fixes.sql`
3. Exécutez le script

**Ce que ça fait :**
- Supprime la politique trop permissive "Anyone can view files"
- Crée des politiques restrictives basées sur le propriétaire
- Ajoute une protection contre la modification du statut

**⚠️ IMPORTANT :** Après l'exécution, vérifiez que les images des véhicules actifs sont toujours accessibles publiquement (c'est normal pour l'affichage).

---

### 2. VÉRIFIER LE MIDDLEWARE (RECOMMANDÉ)

**Fichier :** `src/middleware.ts`

**Vérification :**
1. Le middleware est automatiquement actif dans Next.js
2. Testez l'accès à `/admin/dashboard` sans être connecté → doit rediriger vers `/login`
3. Testez l'accès à `/sell` sans être connecté → doit rediriger vers `/login`
4. Testez l'accès à `/admin/dashboard` avec un compte non-admin → doit rediriger vers `/`

**Note :** Next.js 16 utilise maintenant "proxy" au lieu de "middleware", mais le fichier `middleware.ts` fonctionne toujours. L'avertissement peut être ignoré pour l'instant.

---

### 3. TESTER LA VALIDATION (RECOMMANDÉ)

**Test manuel :**
1. Allez sur `/sell`
2. Essayez de soumettre un formulaire avec :
   - Description contenant `<script>alert('XSS')</script>` → doit être échappée
   - URL Car-Pass invalide → doit être rejetée
   - Email invalide → doit être rejeté
   - Téléphone invalide → doit être rejeté

**Vérification :**
- Les erreurs doivent s'afficher clairement
- Les données malveillantes ne doivent pas être insérées en base

---

## 📊 CHECKLIST DE VÉRIFICATION

Après avoir appliqué les correctifs, vérifiez :

- [ ] Le script SQL `security_fixes.sql` a été exécuté dans Supabase
- [ ] Les routes `/admin/*` sont inaccessibles sans authentification
- [ ] Les routes `/admin/*` sont inaccessibles pour les non-admins
- [ ] La route `/sell` est inaccessible sans authentification
- [ ] Les données malveillantes sont rejetées dans le formulaire de vente
- [ ] Les images des véhicules actifs sont toujours accessibles publiquement
- [ ] Les fichiers privés (non associés à un véhicule actif) ne sont plus accessibles publiquement

---

## 🚨 EN CAS DE PROBLÈME

### Problème : Les images ne s'affichent plus

**Solution :** Vérifiez que la politique "Public can view active vehicle images" a bien été créée dans Supabase.

### Problème : Le middleware bloque tout

**Solution :** Vérifiez que les routes publiques (`/`, `/login`, `/register`, `/cars`) ne sont pas bloquées. Si oui, ajustez le tableau `publicRoutes` dans `src/middleware.ts`.

### Problème : Erreur de validation sur des données valides

**Solution :** Vérifiez les règles de validation dans `src/lib/validation.ts` et ajustez-les si nécessaire.

---

## 📈 PROCHAINES ÉTAPES (OPTIONNEL)

1. **Rate Limiting** : Implémenter une limitation du nombre de requêtes
2. **CSRF Protection** : Vérifier que Next.js gère bien la protection CSRF (déjà fait par défaut)
3. **Logging** : Ajouter des logs pour les tentatives d'accès non autorisées
4. **Monitoring** : Configurer un monitoring des erreurs de sécurité

---

## 📞 SUPPORT

En cas de question ou problème, consultez :
- Le rapport d'audit : `SECURITY_AUDIT_REPORT.md`
- La documentation Supabase : https://supabase.com/docs/guides/auth/row-level-security
- La documentation Next.js : https://nextjs.org/docs/app/building-your-application/routing/middleware

---

**Date de dernière mise à jour :** $(date)  
**Version des correctifs :** 1.0

