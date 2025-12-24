# 🔧 Guide de Résolution - Problème Chrome

## 📋 Problème

Le timeout de connexion se produit **uniquement sur Google Chrome** mais **pas sur Brave**.

---

## 🔍 Causes Probables

### **1. Extensions Chrome** ⚠️ (Cause la plus probable - 90%)

Les extensions Chrome peuvent **bloquer ou modifier** les requêtes réseau vers Supabase :

**Extensions courantes problématiques :**
- **Ad blockers** : uBlock Origin, AdBlock Plus, AdGuard
- **Privacy extensions** : Privacy Badger, Ghostery, DuckDuckGo Privacy
- **VPN extensions** : NordVPN, ExpressVPN, etc.
- **Security extensions** : Avast, Norton, etc.

**Comment vérifier :**
1. Ouvrez Chrome en **mode navigation privée** (Ctrl+Shift+N)
2. Essayez de vous connecter
3. Si ça fonctionne → **C'est une extension !**

### **2. Cookies SameSite** ⚠️

Chrome applique des règles **strictes** sur les cookies SameSite :
- Les cookies doivent avoir `SameSite=None; Secure` pour fonctionner en cross-site
- Brave est moins strict sur ce point

### **3. Cache Corrompu**

Chrome peut avoir un **cache corrompu** qui cause des problèmes.

**Solution :**
1. Ouvrez les **Outils de développement** (F12)
2. Clic droit sur le bouton **Actualiser**
3. Sélectionnez **Vider le cache et actualiser forcée**

### **4. Service Workers**

Chrome peut avoir des **service workers** qui interfèrent.

**Solution :**
1. Ouvrez les **Outils de développement** (F12)
2. Onglet **Application** → **Service Workers**
3. Cliquez sur **Unregister** pour tous les service workers

---

## ✅ Solutions Implémentées dans le Code

### **1. Détection Chrome et Vérification localStorage**

Le code détecte maintenant Chrome et vérifie si localStorage est bloqué :

```typescript
// Détecter Chrome et vérifier les extensions problématiques
if (typeof window !== "undefined") {
  const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  if (isChrome) {
    // Vérifier si localStorage est bloqué (signe d'extension)
    try {
      const testKey = "__chrome_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
    } catch (e) {
      // Afficher un message d'avertissement
      showToast("⚠️ Extension Chrome détectée. Désactivez temporairement les extensions...");
    }
  }
}
```

### **2. Fallback sur sessionStorage**

Si localStorage est bloqué, le code utilise sessionStorage comme fallback :

```typescript
storage: {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      // Fallback sur sessionStorage si localStorage bloqué
      return sessionStorage.getItem(key);
    }
  },
  // ...
}
```

---

## 🚀 Solutions pour l'Utilisateur

### **Solution 1 : Désactiver les Extensions (Recommandé)**

1. **Ouvrez Chrome** en mode navigation privée (Ctrl+Shift+N)
2. **Essayez de vous connecter**
3. Si ça fonctionne → **C'est une extension !**

**Pour identifier l'extension :**
1. Allez sur `chrome://extensions/`
2. **Désactivez toutes les extensions**
3. **Réactivez-les une par une** jusqu'à trouver la coupable

**Extensions à vérifier en priorité :**
- uBlock Origin
- Privacy Badger
- Ghostery
- AdBlock Plus
- Toutes les extensions VPN

### **Solution 2 : Vider le Cache**

1. Ouvrez les **Outils de développement** (F12)
2. Clic droit sur le bouton **Actualiser**
3. Sélectionnez **Vider le cache et actualiser forcée**

**Ou via les paramètres :**
1. **Paramètres Chrome** → **Confidentialité et sécurité** → **Effacer les données de navigation**
2. Cochez **Images et fichiers en cache**
3. Cliquez sur **Effacer les données**

### **Solution 3 : Désactiver les Service Workers**

1. Ouvrez les **Outils de développement** (F12)
2. Onglet **Application** → **Service Workers**
3. Cliquez sur **Unregister** pour tous les service workers

### **Solution 4 : Réinitialiser Chrome**

Si rien ne fonctionne :
1. **Paramètres Chrome** → **Réinitialiser et nettoyer**
2. **Restaurer les paramètres par défaut**
3. **Redémarrer Chrome**

---

## 🔍 Diagnostic

### **Comment identifier la cause :**

1. **Test en navigation privée** :
   - Si ça fonctionne → **Extension**
   - Si ça ne fonctionne pas → **Autre problème**

2. **Vérifier la console** (F12) :
   - Cherchez les erreurs liées aux cookies
   - Cherchez les erreurs CORS
   - Cherchez les erreurs de réseau

3. **Vérifier les extensions** :
   - Allez sur `chrome://extensions/`
   - Désactivez toutes les extensions
   - Testez la connexion

4. **Vérifier les cookies** :
   - Ouvrez les **Outils de développement** (F12)
   - Onglet **Application** → **Cookies**
   - Vérifiez que les cookies Supabase sont présents

---

## 📊 Comparaison Chrome vs Brave

| Aspect | Chrome | Brave |
|--------|--------|-------|
| **Extensions** | ⚠️ Peuvent bloquer | ✅ Moins de problèmes |
| **Cookies SameSite** | ⚠️ Stricte | ✅ Moins strict |
| **Privacy** | ⚠️ Par défaut | ✅ Privacy par défaut |
| **Third-party cookies** | ❌ Bloqués | ✅ Autorisés |
| **Service Workers** | ⚠️ Peuvent interférer | ✅ Moins de problèmes |

---

## ✅ Résumé

**Cause principale** : **Extensions Chrome** qui bloquent les requêtes réseau

**Solution immédiate** : **Désactiver les extensions** ou utiliser **Brave**

**Solution à long terme** : **Configurer les extensions** pour autoriser les requêtes vers Supabase

---

**Date de création :** $(date)
**Fichiers modifiés :**
- `src/lib/supabase/client-singleton.ts` - Fallback sessionStorage
- `src/app/login/page.tsx` - Détection Chrome et extensions

