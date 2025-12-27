# 🚀 Google Analytics 4 - Configuration Octane98

## 📋 Vue d'ensemble

Google Analytics 4 a été intégré à l'application Octane98 pour le suivi des utilisateurs et des performances.

## 🔧 Configuration

### 1. Créer une propriété GA4

1. Allez sur [Google Analytics](https://analytics.google.com)
2. Créez une nouvelle propriété GA4
3. Notez l'**ID de mesure** (format: `G-XXXXXXXXXX`)

### 2. Variables d'environnement

Ajoutez cette variable dans votre fichier `.env.local` :

```bash
# Google Analytics 4 - ID de mesure
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

**⚠️ Important :**
- Utilisez `NEXT_PUBLIC_` pour rendre la variable accessible côté client
- Sans cette variable, GA ne se charge pas (graceful degradation)

### 3. Vérification

Après déploiement :

1. **Console développeur** : Cherchez `gtag` dans l'onglet Console
2. **Network tab** : Voyez les requêtes vers `googletagmanager.com`
3. **GA4 Dashboard** : Les événements commenceront à apparaître

## 📊 Événements trackés automatiquement

GA4 tracke automatiquement :
- ✅ **Page views** (toutes les navigations)
- ✅ **Sessions utilisateur**
- ✅ **Durée de session**
- ✅ **Source de trafic**

## 🎯 Événements personnalisés (futurs)

Le code est prêt pour ajouter des événements personnalisés :

```typescript
// Exemple d'événement personnalisé
import { event } from 'nextjs-google-analytics';

event('annonce_consultee', {
  annonce_id: vehicleId,
  marque: brand,
  modele: model,
  prix: price
});
```

## 🔒 Sécurité & Performance

- ✅ **Chargement optimisé** : `strategy="afterInteractive"`
- ✅ **Non-bloquant** : N'affecte pas le rendu initial
- ✅ **Graceful degradation** : Fonctionne sans GA activé
- ✅ **RGPD compliant** : Respecte les choix cookies existants

## 🧪 Test en développement

```bash
# Avec GA activé
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX npm run dev

# Sans GA (par défaut)
npm run dev
```

## 📈 Dashboard GA4

Une fois configuré, vous verrez dans GA4 :
- **Trafic en temps réel**
- **Pages les plus vues**
- **Sources de trafic**
- **Comportement utilisateur**

## 🔧 Maintenance

- **Mise à jour GA** : Modifier seulement `NEXT_PUBLIC_GA_ID`
- **Désactivation** : Supprimer ou commenter la variable d'env
- **Debug** : Utiliser l'extension GA Debugger pour Chrome

---

**🎯 Configuration terminée !** Votre site tracke maintenant automatiquement avec Google Analytics 4. 📊📈
