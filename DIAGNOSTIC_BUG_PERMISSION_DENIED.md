# 🔍 DIAGNOSTIC BUG CRITIQUE - PERMISSION DENIED PERSISTANT

**Date** : $(date +%Y-%m-%d)  
**Expert** : Senior DevOps  
**Statut** : ⚠️ **EN INVESTIGATION**

---

## 📋 VÉRIFICATIONS EFFECTUÉES

### ✅ 1. Vérification du Code Source

#### **Fichier** : `src/app/coming-soon/page.tsx`

**Statut** : ✅ **CORRECT**

- ✅ Import correct : `import { subscribeToWaitingList } from "@/app/actions/subscribe";`
- ✅ Plus de `createClient()` dans le code
- ✅ Plus d'appel direct à Supabase
- ✅ Utilisation de la Server Action : `await subscribeToWaitingList(normalizedEmail)`

**Conclusion** : Le code source est correct, pas de trace de `createClient()`.

---

### ✅ 2. Vérification du Client Admin

#### **Fichier** : `src/lib/supabase/admin.ts`

**Statut** : ⚠️ **PROBLÈME POTENTIEL IDENTIFIÉ**

**Code actuel** :
```typescript
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY est manquante. Cette variable est requise pour le client admin. " +
    "Vérifiez SUPABASE_SERVICE_ROLE_KEY dans .env.local"
  );
}
```

**Problème identifié** :
- Dans `src/lib/env.ts`, `SUPABASE_SERVICE_ROLE_KEY` est définie comme **optionnelle** (`.optional()`)
- Si la variable n'est pas définie sur Netlify, `env.SUPABASE_SERVICE_ROLE_KEY` sera `undefined`
- Le client admin va throw une erreur, mais cette erreur pourrait ne pas être visible dans le navigateur

**Variable attendue sur Netlify** :
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Action requise** :
1. Vérifier dans Netlify Dashboard → Site settings → Environment variables
2. Confirmer que `SUPABASE_SERVICE_ROLE_KEY` est bien définie
3. Vérifier que la valeur commence par `eyJ` (JWT valide)

---

### ✅ 3. Vérification de la Server Action

#### **Fichier** : `src/app/actions/subscribe.ts`

**Statut** : ✅ **CORRECT**

- ✅ Flag `"use server"` présent
- ✅ Import correct : `import { createAdminClient } from "@/lib/supabase/admin";`
- ✅ Gestion d'erreurs complète
- ✅ Logs détaillés pour diagnostic

**Conclusion** : La Server Action est correctement implémentée.

---

## 🐛 HYPOTHÈSES DE CAUSE

### **Hypothèse 1 : Variable d'environnement manquante sur Netlify**

**Probabilité** : 🔴 **ÉLEVÉE**

**Symptômes** :
- Erreur "permission denied" dans le navigateur
- La Server Action throw une erreur silencieuse si `SUPABASE_SERVICE_ROLE_KEY` est manquante
- L'erreur n'est pas propagée correctement au client

**Solution** :
1. Vérifier Netlify Dashboard → Environment variables
2. Ajouter `SUPABASE_SERVICE_ROLE_KEY` si manquante
3. Redéployer

---

### **Hypothèse 2 : Build Netlify n'a pas compilé la Server Action**

**Probabilité** : 🟡 **MOYENNE**

**Symptômes** :
- Le fichier `subscribe.ts` n'a pas été détecté par Next.js
- La Server Action n'est pas disponible au runtime

**Solution** :
1. Vérifier les logs de build Netlify
2. Chercher des erreurs liées à `subscribe.ts`
3. Forcer un rebuild complet

---

### **Hypothèse 3 : Cache navigateur / CDN**

**Probabilité** : 🟡 **MOYENNE**

**Symptômes** :
- L'ancienne version du code est toujours servie
- Le navigateur utilise une version en cache

**Solution** :
1. Vider le cache navigateur (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Vérifier le cache CDN Netlify

---

### **Hypothèse 4 : Erreur silencieuse dans la Server Action**

**Probabilité** : 🟡 **MOYENNE**

**Symptômes** :
- La Server Action throw une erreur mais elle n'est pas catchée
- L'erreur n'apparaît que dans les logs serveur Netlify

**Solution** :
1. Vérifier les logs Netlify Functions
2. Ajouter plus de logs dans `subscribe.ts`
3. Améliorer la gestion d'erreurs

---

## 🔧 ACTIONS CORRECTIVES RECOMMANDÉES

### **Action 1 : Vérifier les Variables d'Environnement Netlify**

**Checklist** :
- [ ] Aller sur Netlify Dashboard
- [ ] Site settings → Environment variables
- [ ] Vérifier que `SUPABASE_SERVICE_ROLE_KEY` existe
- [ ] Vérifier que la valeur commence par `eyJ`
- [ ] Si manquante, ajouter la variable
- [ ] Redéployer le site

---

### **Action 2 : Améliorer la Gestion d'Erreurs**

**Modification recommandée** : `src/app/actions/subscribe.ts`

Ajouter une vérification explicite au début :

```typescript
export async function subscribeToWaitingList(email: string) {
  // Vérification explicite de la variable d'environnement
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[Subscribe Action] ❌ SUPABASE_SERVICE_ROLE_KEY manquante");
    return {
      success: false,
      error: "Configuration serveur invalide. Contactez le support.",
      code: "ENV_MISSING",
    };
  }
  
  // ... reste du code
}
```

---

### **Action 3 : Ajouter des Logs de Debug**

**Modification recommandée** : `src/app/actions/subscribe.ts`

Ajouter des logs au début de la fonction :

```typescript
export async function subscribeToWaitingList(email: string) {
  console.log("[Subscribe Action] 🚀 Début inscription:", {
    email,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    timestamp: new Date().toISOString(),
  });
  
  // ... reste du code
}
```

---

### **Action 4 : Vérifier les Logs Netlify**

**Instructions** :
1. Aller sur Netlify Dashboard
2. Deployments → Dernier déploiement
3. Functions logs
4. Chercher les logs `[Subscribe Action]`
5. Vérifier s'il y a des erreurs

---

## 📊 CHECKLIST DE DIAGNOSTIC

- [x] Code source vérifié (page.tsx)
- [x] Server Action vérifiée (subscribe.ts)
- [x] Client admin vérifié (admin.ts)
- [ ] Variables Netlify vérifiées (à faire manuellement)
- [ ] Logs Netlify vérifiés (à faire manuellement)
- [ ] Cache navigateur vidé (à faire manuellement)

---

## 🎯 PROCHAINES ÉTAPES

1. **Vérifier Netlify Environment Variables** (priorité haute)
2. **Vérifier les logs Netlify Functions** (priorité haute)
3. **Améliorer la gestion d'erreurs** (priorité moyenne)
4. **Ajouter des logs de debug** (priorité moyenne)

---

**Fin du rapport de diagnostic**

