# 📧 GUIDE : Personnalisation Email de Confirmation Supabase - RedZone

## 🎯 **OBJECTIF**

Personnaliser le template d'email de confirmation Supabase avec le design RedZone (dark theme, bouton rouge, badge Membre Fondateur).

---

## 📋 **ÉTAPES D'INSTALLATION**

### **Étape 1 : Accéder aux Templates Email Supabase**

1. Connectez-vous à votre [Dashboard Supabase](https://app.supabase.com)
2. Sélectionnez votre projet **RedZone**
3. Allez dans **Authentication** → **Email Templates**
4. Cliquez sur **Confirm signup** (ou **Confirmation d'inscription**)

---

### **Étape 2 : Copier le Template HTML**

1. Ouvrez le fichier `email-template-confirmation-redzone.html` dans votre projet
2. **Copiez TOUT le contenu** (Ctrl+A, Ctrl+C)
3. Collez-le dans l'éditeur Supabase (remplacez le template par défaut)

---

### **Étape 3 : Variables Supabase Disponibles**

Supabase fournit automatiquement ces variables dans le template :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{ .ConfirmationURL }}` | URL complète de confirmation | `https://votre-projet.supabase.co/auth/v1/verify?token=...` |
| `{{ .Token }}` | Token de confirmation | `abc123xyz...` |
| `{{ .TokenHash }}` | Hash du token | `hashed_token...` |
| `{{ .Email }}` | Email de l'utilisateur | `user@example.com` |
| `{{ .SiteURL }}` | URL de votre site | `https://redzone2.netlify.app` |

**✅ Le template utilise déjà `{{ .ConfirmationURL }}`** - c'est la variable recommandée.

---

### **Étape 4 : Personnaliser le Logo (Optionnel)**

Si vous avez un logo RedZone hébergé :

1. Remplacez cette section (lignes 24-27) :
```html
<!-- Placeholder Logo RedZone -->
<div style="width: 120px; height: 60px; background-color: #FF0000; border-radius: 4px; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
    <span style="color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 2px;">REDZONE</span>
</div>
```

2. Par cette version avec image :
```html
<img src="https://redzone2.netlify.app/logo-redzone.png" alt="RedZone" width="120" height="60" style="display: block; margin: 0 auto;" />
```

**⚠️ Important :** L'image doit être :
- Hébergée sur un serveur HTTPS
- Accessible publiquement
- Format PNG ou SVG (recommandé)

---

### **Étape 5 : Tester le Template**

1. **Sauvegardez** le template dans Supabase
2. Créez un compte de test : `test@example.com`
3. Vérifiez votre boîte email
4. L'email doit afficher :
   - ✅ Fond dark (#1a1a1a / #2a2a2a)
   - ✅ Logo RedZone (ou placeholder)
   - ✅ Badge "Membre Fondateur" doré
   - ✅ Bouton rouge "Activer mon compte"
   - ✅ Message de bienvenue personnalisé

---

## 🎨 **CARACTÉRISTIQUES DU DESIGN**

### **Couleurs Utilisées**

- **Fond principal** : `#1a1a1a` (noir profond)
- **Container** : `#2a2a2a` (gris foncé)
- **Texte principal** : `#ffffff` (blanc)
- **Texte secondaire** : `#e0e0e0` / `#b0b0b0` (gris clair)
- **Bouton validation** : `#FF0000` (rouge vif)
- **Badge Membre Fondateur** : `#FFD700` / `#FFA500` (dégradé doré)
- **Liens** : `#4a9eff` (bleu clair)

### **Structure HTML**

- ✅ **Table-based layout** (compatibilité email maximale)
- ✅ **Styles inline** (pas de CSS externe)
- ✅ **Responsive** (max-width 600px)
- ✅ **Compatible Outlook** (commentaires conditionnels `<!--[if mso]>`)

---

## 🔧 **DÉPANNAGE**

### **Le bouton ne fonctionne pas**

- Vérifiez que `{{ .ConfirmationURL }}` est bien présent dans le template
- Testez avec un compte réel (certains clients email bloquent les liens)

### **Le design ne s'affiche pas correctement**

- Vérifiez que tous les styles sont **inline** (pas de `<style>` dans `<head>`)
- Testez sur Gmail, Outlook, Apple Mail

### **Le logo ne s'affiche pas**

- Vérifiez que l'URL du logo est accessible (HTTPS)
- Utilisez un service d'hébergement d'images (Cloudinary, Imgur, etc.)

---

## 📝 **VARIANTES POSSIBLES**

### **Version avec Token Manuel**

Si vous préférez construire l'URL manuellement :

```html
<a href="{{ .SiteURL }}/auth/callback?token={{ .Token }}&type=signup" style="...">
    Activer mon compte
</a>
```

### **Version avec Email Personnalisé**

Ajoutez l'email de l'utilisateur :

```html
<p style="...">
    Bonjour <strong>{{ .Email }}</strong>, bienvenue dans le Club RedZone !
</p>
```

---

## ✅ **CHECKLIST FINALE**

- [ ] Template copié dans Supabase Dashboard
- [ ] Logo personnalisé ajouté (si disponible)
- [ ] Test d'envoi effectué
- [ ] Email reçu et vérifié (design + fonctionnalité)
- [ ] Bouton de confirmation fonctionne
- [ ] Compatible mobile (testé sur smartphone)

---

## 🚀 **PROCHAINES ÉTAPES**

Une fois le template configuré, vous pouvez également personnaliser :

1. **Email de réinitialisation de mot de passe** (`Reset password`)
2. **Email de changement d'email** (`Change email address`)
3. **Email de magic link** (`Magic Link`)

Utilisez le même design RedZone pour une cohérence visuelle complète !

---

**📌 Note :** Ce template est optimisé pour la compatibilité email maximale (Gmail, Outlook, Apple Mail, etc.) et utilise uniquement des styles inline comme recommandé pour les emails HTML.

