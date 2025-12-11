# 🔒 Sécurisation du Formulaire Guest - Guide d'Installation

Ce guide explique comment configurer les deux barrières de sécurité pour les annonces déposées par des invités (sans compte).

## 📋 Vue d'ensemble

Deux protections ont été mises en place :

1. **Cloudflare Turnstile (CAPTCHA)** - Protection anti-robot
2. **Double Opt-in Email** - Vérification email obligatoire avec code à 6 chiffres

---

## 🛡️ 1. Cloudflare Turnstile (CAPTCHA)

### Installation

Le paquet `@marsidev/react-turnstile` a déjà été installé.

### Configuration

1. **Créer un compte Cloudflare Turnstile** (gratuit) :
   - Allez sur https://dash.cloudflare.com/
   - Naviguez vers "Turnstile"
   - Créez un nouveau site
   - Copiez votre **Site Key** et **Secret Key**

2. **Ajouter les variables d'environnement** :

Créez ou modifiez votre fichier `.env.local` :

```env
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=votre_site_key_ici
TURNSTILE_SECRET_KEY=votre_secret_key_ici
```

⚠️ **Note** : Pour le développement, vous pouvez utiliser la clé de test :
- Site Key : `1x00000000000000000000AA`
- Secret Key : `1x0000000000000000000000000000000AA`

### Vérification côté serveur (optionnel mais recommandé)

Pour une sécurité maximale, vous pouvez vérifier le token Turnstile côté serveur avant de créer l'annonce. Créez une API route `/api/verify-turnstile` :

```typescript
// app/api/verify-turnstile/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  );
  
  const data = await response.json();
  return NextResponse.json({ success: data.success });
}
```

---

## 📧 2. Double Opt-in Email

### Configuration actuelle

Actuellement, l'envoi d'email est **simulé** (affichage dans la console). Pour activer l'envoi réel d'emails :

### Option A : Resend (Recommandé - Gratuit jusqu'à 3000 emails/mois)

1. **Créer un compte Resend** :
   - Allez sur https://resend.com
   - Créez un compte gratuit
   - Générez une API Key

2. **Installer Resend** :
```bash
npm install resend
```

3. **Configurer la variable d'environnement** :
```env
RESEND_API_KEY=re_votre_api_key_ici
```

4. **Décommenter le code dans `src/lib/emailVerification.ts`** :
   - Ouvrez `src/lib/emailVerification.ts`
   - Décommentez la section "TODO: Décommenter et configurer Resend"
   - Le code est déjà prêt à être utilisé !

### Option B : Autre service d'email

Vous pouvez utiliser n'importe quel service d'email (SendGrid, Mailgun, etc.) en modifiant la fonction `sendVerificationEmail` dans `src/lib/emailVerification.ts`.

---

## 🗄️ 3. Migration Base de Données

### Exécuter le script SQL

1. Ouvrez le SQL Editor dans Supabase
2. Copiez-collez le contenu de `supabase/guest_email_verification.sql`
3. Exécutez le script

Ce script ajoute les colonnes suivantes à la table `vehicules` :
- `email_contact` : Email de contact pour les invités
- `is_email_verified` : Statut de vérification email
- `verification_code` : Code de vérification hashé
- `verification_code_expires_at` : Date d'expiration du code

Et ajoute le nouveau statut `waiting_email_verification` et `pending_validation`.

---

## 🔄 Flux de Vérification

### Pour les Utilisateurs Connectés
1. Remplissent le formulaire (étapes 1-3)
2. Cliquent sur "Publier"
3. Annonce créée avec statut `pending`
4. Redirection vers `/sell/congrats`

### Pour les Invités (Guest)
1. Remplissent le formulaire (étapes 1-3)
2. **Complètent le CAPTCHA Turnstile** (étape 3)
3. Cliquent sur "Publier"
4. Annonce créée avec statut `waiting_email_verification`
5. **Code de vérification généré et envoyé par email**
6. **Étape 4 : Entrent le code reçu**
7. Code vérifié → Statut passe à `pending_validation`
8. Redirection vers `/sell/congrats`

---

## 🧪 Test en Développement

### Tester le CAPTCHA
- Utilisez la clé de test : `1x00000000000000000000AA`
- Le CAPTCHA s'affichera toujours comme "validé" en mode test

### Tester l'Email
- L'email est simulé dans la console
- Le code de vérification s'affiche dans les logs du serveur
- Vous pouvez copier ce code pour tester la vérification

### Tester le Flux Complet
1. Déconnectez-vous (ou utilisez un navigateur en navigation privée)
2. Allez sur `/sell`
3. Remplissez le formulaire
4. Complétez le CAPTCHA
5. Publiez l'annonce
6. Vérifiez la console pour voir le code
7. Entrez le code dans l'étape 4
8. Vérifiez que l'annonce passe en `pending_validation`

---

## 🔐 Sécurité

### Points de Sécurité Implémentés

1. **CAPTCHA Turnstile** : Empêche les robots de soumettre des annonces
2. **Code de vérification hashé** : Le code est hashé avant stockage en base
3. **Expiration du code** : Le code expire après 15 minutes
4. **Statut séquentiel** : L'annonce ne passe en `pending_validation` qu'après vérification email
5. **Validation côté serveur** : Toutes les validations sont également effectuées côté serveur

### Améliorations Futures

- [ ] Vérification du token Turnstile côté serveur
- [ ] Rate limiting sur les tentatives de vérification
- [ ] Utilisation de bcrypt pour le hash du code
- [ ] Envoi d'email de rappel si le code n'est pas vérifié après 10 minutes

---

## 📝 Notes Importantes

- ⚠️ **En production**, remplacez le hash simple par bcrypt dans `src/lib/emailVerification.ts`
- ⚠️ **Configurez un vrai service d'email** avant la mise en production
- ⚠️ **Vérifiez le token Turnstile côté serveur** pour une sécurité maximale
- ✅ Le CAPTCHA est **gratuit** et **illimité** avec Cloudflare
- ✅ Resend offre **3000 emails/mois gratuits**

---

## 🆘 Dépannage

### Le CAPTCHA ne s'affiche pas
- Vérifiez que `NEXT_PUBLIC_TURNSTILE_SITE_KEY` est défini
- Vérifiez la console du navigateur pour les erreurs
- Assurez-vous que le domaine est autorisé dans Cloudflare Turnstile

### L'email n'est pas envoyé
- Vérifiez les logs de la console (simulation)
- Si vous utilisez Resend, vérifiez votre API Key
- Vérifiez que le domaine est vérifié dans Resend

### Le code de vérification ne fonctionne pas
- Vérifiez que le code n'a pas expiré (15 minutes)
- Vérifiez que vous utilisez le bon code (celui affiché dans la console en dev)
- Vérifiez les logs serveur pour les erreurs

---

## ✅ Checklist de Déploiement

- [ ] Script SQL exécuté dans Supabase
- [ ] Clé Turnstile configurée (production)
- [ ] Service d'email configuré (Resend ou autre)
- [ ] Variables d'environnement configurées
- [ ] Test du flux complet en production
- [ ] Vérification que les emails arrivent bien
- [ ] Monitoring des erreurs de vérification

---

**Date de création** : $(date)
**Version** : 1.0.0

