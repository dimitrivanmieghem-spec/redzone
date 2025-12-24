# 🚀 IMPLÉMENTATION DES PROCHAINES ÉTAPES - AUDIT SÉCURITÉ
**RedZone - Guide d'implémentation des recommandations de l'audit**

---

## ✅ ÉTAPES DÉJÀ IMPLÉMENTÉES

### 1. **Système de Logs d'Audit RGPD** ✅
- ✅ Table `audit_logs` créée (`supabase/create_audit_logs_table.sql`)
- ✅ Fonctions de logging créées (`src/lib/supabase/audit-logs.ts`)
- ✅ Intégration dans le middleware pour les accès non autorisés
- ✅ Intégration dans le login pour les tentatives échouées
- ✅ Intégration dans le register pour les créations de compte
- ✅ Intégration dans la mise à jour de profil

### 2. **Documentation des Durées de Conservation** ✅
- ✅ Document complet créé (`RGPD_DUREES_CONSERVATION.md`)
- ✅ Durées de conservation définies pour chaque type de données
- ✅ Conformité avec la législation belge et européenne

### 3. **Scripts de Nettoyage Automatique** ✅
- ✅ Script SQL créé (`supabase/cleanup_expired_data.sql`)
- ✅ Fonctions de nettoyage pour chaque type de données
- ✅ Fonction principale `cleanup_all_expired_data()`

### 4. **Vérification des Politiques RLS** ✅
- ✅ Script de vérification créé (`supabase/verify_rls_policies.sql`)
- ✅ Vérification automatique que RLS est activé
- ✅ Liste des politiques par table

### 5. **Monitoring des Tentatives d'Intrusion** ✅
- ✅ Système de détection créé (`src/lib/monitoring/intrusion-detection.ts`)
- ✅ Détection de force brute
- ✅ Détection d'activité suspecte
- ✅ Rate limiting intégré dans l'API Sentinelle

---

## 📋 ACTIONS REQUISES (À EXÉCUTER)

### 🔴 CRITIQUE - À FAIRE IMMÉDIATEMENT

#### 1. Exécuter le Script SQL de Création de la Table Audit Logs

**Fichier :** `supabase/create_audit_logs_table.sql`

**Action :**
1. Ouvrez Supabase Dashboard > SQL Editor
2. Copiez-collez le contenu de `supabase/create_audit_logs_table.sql`
3. Exécutez le script

**Vérification :**
```sql
-- Vérifier que la table existe
SELECT * FROM audit_logs LIMIT 1;
```

---

#### 2. Exécuter le Script de Vérification RLS

**Fichier :** `supabase/verify_rls_policies.sql`

**Action :**
1. Ouvrez Supabase Dashboard > SQL Editor
2. Copiez-collez le contenu de `supabase/verify_rls_policies.sql`
3. Exécutez le script
4. Vérifiez les warnings et corrigez si nécessaire

**Vérification :**
- Vérifiez qu'il n'y a pas de warnings dans les résultats
- Toutes les tables sensibles doivent avoir RLS activé

---

#### 3. Configurer le Cron Job pour le Nettoyage Automatique

**Fichier :** `supabase/cleanup_expired_data.sql`

**✅ DÉJÀ CONFIGURÉ :**
- ✅ Route API créée : `src/app/api/cleanup-expired-data/route.ts`
- ✅ Cron job ajouté dans `vercel.json` : `0 0 1 * *` (le 1er de chaque mois à minuit)

**Action requise :**
1. Exécutez le script SQL `supabase/cleanup_expired_data.sql` dans Supabase Dashboard
2. Ajoutez la variable d'environnement `CLEANUP_SECRET_KEY` dans Vercel (optionnel mais recommandé)
3. Le cron job s'exécutera automatiquement le 1er de chaque mois

**Option alternative : Via Supabase Cron**
Si vous préférez utiliser Supabase Cron au lieu de Vercel Cron :
1. Exécutez le script SQL dans Supabase
2. Configurez un cron job dans Supabase Dashboard :
   - **Fonction :** `cleanup_all_expired_data()`
   - **Fréquence :** Tous les mois (ex: `0 0 1 * *`)

---

### 🟡 IMPORTANT - À FAIRE AVANT LA PRODUCTION

#### 4. Intégrer le Logging d'Audit dans les Actions Critiques

**Fichiers à modifier :**

1. **Accès aux données personnelles** :
   - `src/lib/supabase/messages.ts` - Ajouter `logDataAccess()` lors de la récupération des messages
   - `src/lib/supabase/conversations.ts` - Ajouter `logDataAccess()` lors de la récupération des conversations
   - `src/lib/supabase/favorites.ts` - Ajouter `logDataAccess()` lors de la récupération des favoris

2. **Modifications de données** :
   - `src/app/actions/messages.ts` - Logger les envois de messages
   - `src/app/actions/tickets.ts` - Logger les créations/réponses de tickets

**Exemple d'intégration :**
```typescript
import { logDataAccess } from "@/lib/supabase/audit-logs";

// Lors de la récupération des messages
const messages = await getMessages(conversationId);
await logDataAccess("message", conversationId, "Accès aux messages de la conversation");
```

---

#### 5. Créer une Page d'Export des Données (RGPD)

**Fichier à créer :** `src/app/dashboard/export-data/page.tsx`

**Fonctionnalités :**
- Export de toutes les données personnelles de l'utilisateur
- Format JSON téléchargeable
- Logger la demande d'export (`logDataExportRequest()`)

**Exemple :**
```typescript
export async function exportUserData(userId: string) {
  // Récupérer toutes les données de l'utilisateur
  const profile = await getProfile(userId);
  const vehicles = await getUserVehicles(userId);
  const messages = await getUserMessages(userId);
  const favorites = await getUserFavorites(userId);
  
  // Logger la demande
  await logDataExportRequest(userId, profile.email);
  
  return {
    profile,
    vehicles,
    messages,
    favorites,
    exportedAt: new Date().toISOString(),
  };
}
```

---

#### 6. Créer une Page de Suppression de Compte (Droit à l'oubli RGPD)

**Fichier à créer :** `src/app/dashboard/delete-account/page.tsx`

**Fonctionnalités :**
- Confirmation avec mot de passe
- Suppression en cascade de toutes les données
- Logger la suppression (`logDataDeletion()`)

---

### 🟢 RECOMMANDÉ - AMÉLIORATIONS FUTURES

#### 7. Intégrer un Service de Scan Antivirus

**Options :**
- **ClamAV** (open-source, auto-hébergé)
- **VirusTotal API** (service externe, payant)
- **Cloudflare Scans** (intégré avec Cloudflare)

**Intégration dans `src/lib/supabase/uploads.ts` :**
```typescript
async function scanFileForVirus(file: File): Promise<boolean> {
  // Appel à l'API de scan antivirus
  // Retourne true si le fichier est sûr
}
```

---

#### 8. Système de Monitoring Externe

**Options :**
- **Sentry** - Monitoring des erreurs
- **Datadog** - Monitoring complet
- **LogRocket** - Session replay et logs

**Intégration :**
- Ajouter les SDK dans `src/app/layout.tsx`
- Configurer les alertes pour les intrusions critiques

---

#### 9. Tests de Sécurité

**Actions :**
1. **Tests de pénétration** - Faire appel à un professionnel
2. **Audit de sécurité externe** - Faire appel à un cabinet spécialisé
3. **Tests automatisés** - Utiliser OWASP ZAP ou Burp Suite

---

## 📊 CHECKLIST DE VÉRIFICATION

### Avant la Mise en Production

- [ ] Table `audit_logs` créée et fonctionnelle
- [ ] Scripts de nettoyage automatique configurés (cron job)
- [ ] Politiques RLS vérifiées et corrigées si nécessaire
- [ ] Logging d'audit intégré dans toutes les actions critiques
- [ ] Page d'export des données créée
- [ ] Page de suppression de compte créée
- [ ] Rate limiting testé sur les routes critiques
- [ ] Headers de sécurité vérifiés (via outil en ligne)
- [ ] Tests de sécurité effectués

### Après la Mise en Production

- [ ] Monitoring des logs d'audit actif
- [ ] Alertes configurées pour les intrusions critiques
- [ ] Nettoyage automatique fonctionnel (vérifier après 1 mois)
- [ ] Documentation mise à jour

---

## 🔧 CONFIGURATION DES VARIABLES D'ENVIRONNEMENT

Ajoutez dans `.env.local` (et dans les variables d'environnement de production) :

```env
# Clé secrète pour l'API Sentinelle
SENTINELLE_SECRET_KEY=votre_cle_secrete_ici

# Clé secrète pour le nettoyage automatique
CLEANUP_SECRET_KEY=votre_cle_secrete_ici

# (Optionnel) Clé API pour scan antivirus
VIRUSTOTAL_API_KEY=votre_cle_api_ici
```

---

## 📞 SUPPORT

En cas de problème lors de l'implémentation :
1. Vérifiez les logs dans Supabase Dashboard > Logs
2. Vérifiez les erreurs dans la console du navigateur
3. Consultez la documentation Supabase pour les politiques RLS

---

**Date de création :** Décembre 2025  
**Statut :** ✅ **PRÊT POUR IMPLÉMENTATION**

