# 🚀 Guide de Déploiement - Système Coming Soon

## 📋 Vue d'ensemble

Ce système permet de déployer Octane98 avec une page "Coming Soon" visible par le public, tout en conservant un accès total pour l'administrateur via un lien secret.

---

## ✅ Composants Créés

### 1. **Table de Capture d'Emails** (`waiting_list`)
- **Fichier SQL** : `supabase/migration_waiting_list.sql`
- **Permissions** : INSERT publique, SELECT admin uniquement
- **Index** : Optimisation sur email et created_at

### 2. **Landing Page Marketing** (`/coming-soon`)
- **Fichier** : `src/app/coming-soon/page.tsx`
- **Design** : Sombre, premium, animations framer-motion
- **Fonctionnalités** :
  - Formulaire d'inscription à la liste d'attente
  - Section "Pourquoi Octane98 ?" (3 points clés)
  - Validation email et gestion des doublons

### 3. **Middleware de Protection**
- **Fichier** : `src/middleware.ts`
- **Fonctionnement** :
  - Vérifie le cookie `octane_bypass_token`
  - Redirige vers `/coming-soon` si pas de cookie
  - Exceptions : `/coming-soon`, `/access`, `/api`, `/_next`, images publiques

### 4. **Page d'Accès Secret** (`/access/[code]`)
- **Fichier** : `src/app/access/[code]/page.tsx`
- **Code secret** : `octane-alpha-2025`
- **Fonctionnement** :
  - Vérifie le code dans l'URL
  - Dépose le cookie `octane_bypass_token` (30 jours)
  - Redirige vers l'accueil

### 5. **Configuration SEO**
- **robots.txt** : Autorise uniquement `/coming-soon`
- **Meta-tags** : Optimisés pour "Octane98 Belgique"

---

## 🚀 Étapes de Déploiement

### Étape 1 : Exécuter la Migration SQL

1. Connectez-vous au **Dashboard Supabase**
2. Ouvrez le **SQL Editor**
3. Copiez-collez le contenu de `supabase/migration_waiting_list.sql`
4. Cliquez sur **Run**

**Vérification** :
```sql
SELECT * FROM waiting_list LIMIT 5;
```

---

### Étape 2 : Tester Localement

1. **Démarrer le serveur** :
```bash
npm run dev
```

2. **Tester la redirection** :
   - Visitez `http://localhost:3000/`
   - Vous devez être redirigé vers `/coming-soon`

3. **Tester l'accès secret** :
   - Visitez `http://localhost:3000/access/octane-alpha-2025`
   - Vous devez être redirigé vers `/` avec accès complet

4. **Vérifier le formulaire** :
   - Testez l'inscription avec un email
   - Vérifiez dans Supabase que l'email est bien enregistré

---

### Étape 3 : Déploiement Netlify

1. **Push sur votre repository** :
```bash
git add .
git commit -m "feat: Ajout système Coming Soon"
git push origin main
```

2. **Netlify détectera automatiquement** le déploiement

3. **Vérifier les Variables d'Environnement** :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

### Étape 4 : Post-Déploiement

1. **Tester la page publique** :
   - Visitez `https://octane98.be`
   - Vous devez voir la page Coming Soon

2. **Tester l'accès admin** :
   - Visitez `https://octane98.be/access/octane-alpha-2025`
   - Vous devez avoir accès complet au site

3. **Vérifier les emails capturés** :
   - Dashboard Supabase → Table Editor → `waiting_list`
   - Les emails doivent apparaître en temps réel

---

## 🔐 Sécurité

### Protection du Code Secret

⚠️ **IMPORTANT** : Le code `octane-alpha-2025` est hardcodé dans le client. Pour une sécurité renforcée en production :

1. **Option 1** : Utiliser une variable d'environnement
   ```typescript
   const SECRET_CODE = process.env.NEXT_PUBLIC_SECRET_CODE || "octane-alpha-2025";
   ```

2. **Option 2** : Vérification côté serveur (recommandé)
   - Créer une Server Action qui vérifie le code
   - Le cookie est défini côté serveur uniquement

### Durée du Cookie

- **Actuellement** : 30 jours
- **Modifiable** dans `src/app/access/[code]/page.tsx` :
  ```typescript
  const COOKIE_DURATION_DAYS = 30; // Modifier ici
  ```

---

## 📊 Analyse des Emails Capturés

### Via Supabase Dashboard

1. **Dashboard** → **Table Editor** → `waiting_list`
2. **Filtres disponibles** :
   - Par date (`created_at`)
   - Par source (`source`)

### Export CSV

```sql
-- Dans le SQL Editor
COPY waiting_list TO '/tmp/waiting_list.csv' CSV HEADER;
```

---

## 🎨 Personnalisation

### Modifier le Design

- **Couleurs** : Modifier les classes Tailwind dans `src/app/coming-soon/page.tsx`
- **Contenu** : Modifier les textes directement dans le composant
- **Animations** : Ajuster les variants framer-motion

### Modifier le Code Secret

1. Modifier dans `src/app/access/[code]/page.tsx` :
   ```typescript
   const SECRET_CODE = "votre-nouveau-code";
   ```

2. ⚠️ Mettre à jour la documentation si le code change !

---

## 🐛 Troubleshooting

### La redirection ne fonctionne pas

- Vérifier que le middleware est bien actif
- Vérifier les cookies du navigateur
- Vérifier que `/_next` et `/api` sont bien exclus

### Le formulaire ne fonctionne pas

- Vérifier les variables d'environnement Supabase
- Vérifier que la table `waiting_list` existe
- Vérifier les politiques RLS dans Supabase

### Le cookie ne persiste pas

- Vérifier les paramètres du cookie (`SameSite`, `Secure`)
- Vérifier que le domaine est correct en production

---

## ✅ Checklist de Déploiement

- [ ] Migration SQL exécutée
- [ ] Table `waiting_list` créée et testée
- [ ] Page `/coming-soon` accessible
- [ ] Formulaire d'inscription fonctionnel
- [ ] Accès secret `/access/octane-alpha-2025` fonctionnel
- [ ] Cookie `octane_bypass_token` déposé correctement
- [ ] Redirection middleware fonctionnelle
- [ ] `robots.txt` accessible
- [ ] Meta-tags SEO configurés
- [ ] Test en production effectué

---

## 📝 Notes Importantes

1. **Le code secret est visible** dans le code client. Pour une sécurité maximale, implémentez une vérification côté serveur.

2. **Les emails sont publics** via INSERT. Seuls les admins peuvent les consulter (RLS).

3. **Le cookie dure 30 jours**. L'administrateur devra réaccéder via le lien secret après expiration.

4. **La page `/coming-soon` est indexable** par Google pour le SEO.

---

## 🎯 Prochaines Étapes

Après le lancement officiel :

1. Désactiver le middleware Coming Soon
2. Supprimer ou masquer la page `/coming-soon`
3. Envoyer un email aux membres de la liste d'attente
4. Activer le sitemap complet dans `robots.txt`

