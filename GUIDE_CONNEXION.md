# 🔐 GUIDE DE CONNEXION - RedZone Admin

## 📋 **MÉTHODE 1 : Créer un compte puis le transformer en admin** (Recommandé)

### **Étape 1 : Créer un compte normal**

1. Allez sur `/register` (ou cliquez sur "Créer un compte" depuis `/login`)
2. Remplissez le formulaire :
   - Prénom
   - Nom
   - Email (ex: `votre-email@exemple.com`)
   - Mot de passe
   - Confirmer le mot de passe
3. Cliquez sur "Créer mon compte"
4. Vous êtes automatiquement connecté

### **Étape 2 : Transformer votre compte en admin**

1. Ouvrez **Supabase Dashboard** > **SQL Editor**
2. Exécutez cette commande (remplacez par votre email) :

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'votre-email@exemple.com';
```

3. Vérifiez que ça a fonctionné :
```sql
SELECT id, email, role FROM profiles WHERE email = 'votre-email@exemple.com';
```

Vous devriez voir `role = 'admin'`.

### **Étape 3 : Se connecter**

1. Allez sur `/login`
2. Entrez votre **email** et votre **mot de passe**
3. Cliquez sur "Se connecter"
4. Vous êtes redirigé vers l'accueil
5. Cliquez sur votre avatar en haut à droite → "Dashboard Admin"
6. Vous accédez au dashboard admin !

---

## 📋 **MÉTHODE 2 : Créer directement un admin dans Supabase** (Alternative)

### **Étape 1 : Créer l'utilisateur dans Supabase**

1. Ouvrez **Supabase Dashboard** > **Authentication** > **Users**
2. Cliquez sur **"Add User"** ou **"Invite User"**
3. Remplissez :
   - **Email** : `admin@redzone.be` (ou votre email)
   - **Password** : Choisissez un mot de passe fort
   - **Auto Confirm User** : ✅ Cochez cette case
4. Cliquez sur **"Create User"**

### **Étape 2 : Transformer en admin**

1. Allez dans **SQL Editor**
2. Exécutez :

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@redzone.be';
```

### **Étape 3 : Se connecter**

1. Allez sur `/login`
2. Entrez :
   - **Email** : `admin@redzone.be`
   - **Password** : Le mot de passe que vous avez créé
3. Cliquez sur "Se connecter"
4. Accédez au dashboard via votre avatar → "Dashboard Admin"

---

## 🚨 **PROBLÈME : Le login admin ne fonctionne pas ?**

### **Symptôme** : "Mot de passe incorrect" sur `/admin/login`

**Cause** : Le système `loginAdmin` essaie de se connecter avec un email par défaut qui n'existe pas.

**Solution** : Utilisez la **Méthode 1** ci-dessus (créer un compte normal puis le transformer en admin).

### **Symptôme** : "Accès refusé" même après connexion

**Cause** : Votre compte n'a pas le rôle `admin` dans la table `profiles`.

**Solution** : Vérifiez et corrigez :
```sql
-- Vérifier votre rôle
SELECT id, email, role FROM profiles WHERE email = 'votre-email@exemple.com';

-- Si role != 'admin', corriger :
UPDATE profiles SET role = 'admin' WHERE email = 'votre-email@exemple.com';
```

### **Symptôme** : "Ce compte n'est pas administrateur"

**Cause** : Vous êtes connecté mais votre rôle n'est pas `admin`.

**Solution** :
1. Déconnectez-vous
2. Exécutez le SQL pour transformer en admin
3. Reconnectez-vous

---

## ✅ **CHECKLIST DE VÉRIFICATION**

- [ ] Compte créé dans Supabase (via `/register` ou Dashboard)
- [ ] Rôle `admin` assigné dans la table `profiles`
- [ ] Connexion réussie sur `/login`
- [ ] Avatar visible en haut à droite
- [ ] Menu déroulant affiche "Dashboard Admin"
- [ ] Accès au dashboard admin (`/admin/dashboard`)
- [ ] Stats s'affichent correctement
- [ ] Validation/Rejet fonctionne

---

## 🎯 **RÉSUMÉ RAPIDE**

**Pour se connecter en admin :**

1. ✅ Créez un compte normal sur `/register`
2. ✅ Exécutez dans Supabase SQL Editor :
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'votre-email@exemple.com';
   ```
3. ✅ Connectez-vous sur `/login` avec votre email/password
4. ✅ Cliquez sur votre avatar → "Dashboard Admin"

**C'est tout !** 🎉

---

## 📝 **NOTES IMPORTANTES**

- ⚠️ **Ne pas utiliser `/admin/login`** : Cette page utilise un système de mot de passe simplifié qui ne fonctionne pas avec Supabase.
- ✅ **Utilisez `/login`** : C'est la méthode normale et sécurisée.
- 🔒 **Sécurité** : En production, ajoutez 2FA et des logs d'audit.

---

*Dernière mise à jour : Après migration Supabase complète* ✅

