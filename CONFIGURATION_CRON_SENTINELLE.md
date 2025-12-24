# ⚙️ CONFIGURATION CRON JOB SENTINELLE

## ✅ **CONFIGURATION AUTOMATIQUE**

Le fichier `vercel.json` a été créé avec la configuration du cron job. Si vous déployez sur **Vercel**, le cron job sera automatiquement configuré.

### **Configuration actuelle**

- **Route** : `/api/sentinelle/check`
- **Fréquence** : Toutes les heures (`0 * * * *`)
- **Format** : Cron standard (minute heure jour mois jour-semaine)

---

## 🔐 **SÉCURITÉ (Optionnel mais recommandé)**

Pour sécuriser l'endpoint, ajoutez une variable d'environnement :

```env
SENTINELLE_SECRET_KEY=votre_cle_secrete_ici
```

**Note** : Si cette variable n'est pas définie, l'endpoint reste accessible (mais uniquement via le cron job Vercel qui est sécurisé par défaut).

---

## 🚀 **DÉPLOIEMENT SUR VERCEL**

1. **Pousser le code** :
   ```bash
   git add vercel.json
   git commit -m "Ajout configuration cron job Sentinelle"
   git push
   ```

2. **Vercel détectera automatiquement** le fichier `vercel.json` et configurera le cron job.

3. **Vérifier dans le dashboard Vercel** :
   - Aller dans votre projet
   - Section "Cron Jobs"
   - Vous devriez voir le cron job configuré

---

## 🔄 **ALTERNATIVES SI PAS SUR VERCEL**

### **Option 1 : Supabase Edge Function**

1. Créer une Edge Function dans Supabase
2. Configurer un cron job dans Supabase Dashboard
3. L'Edge Function appelle votre API

**Exemple Edge Function** :
```typescript
// supabase/functions/sentinelle-check/index.ts
Deno.serve(async (req) => {
  const response = await fetch('https://votre-domaine.com/api/sentinelle/check', {
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENTINELLE_SECRET_KEY')}`
    }
  });
  return response;
});
```

### **Option 2 : Service Externe (cron-job.org)**

1. Aller sur [cron-job.org](https://cron-job.org)
2. Créer un compte gratuit
3. Créer un nouveau cron job :
   - **URL** : `https://votre-domaine.com/api/sentinelle/check`
   - **Méthode** : GET
   - **Headers** : `Authorization: Bearer ${SENTINELLE_SECRET_KEY}`
   - **Schedule** : Toutes les heures

### **Option 3 : GitHub Actions**

Créer `.github/workflows/sentinelle-cron.yml` :
```yaml
name: Sentinelle Cron
on:
  schedule:
    - cron: '0 * * * *'  # Toutes les heures
  workflow_dispatch:  # Permet de déclencher manuellement

jobs:
  check-alerts:
    runs-on: ubuntu-latest
    steps:
      - name: Check Sentinelle Alerts
        run: |
          curl -X GET "https://votre-domaine.com/api/sentinelle/check" \
            -H "Authorization: Bearer ${{ secrets.SENTINELLE_SECRET_KEY }}"
```

---

## 📊 **MODIFIER LA FRÉQUENCE**

Pour changer la fréquence du cron job, modifiez le champ `schedule` dans `vercel.json` :

### **Exemples de schedules**

- **Toutes les heures** : `0 * * * *`
- **Toutes les 30 minutes** : `*/30 * * * *`
- **Toutes les 6 heures** : `0 */6 * * *`
- **Une fois par jour (minuit)** : `0 0 * * *`
- **Une fois par jour (9h)** : `0 9 * * *`
- **Toutes les 15 minutes** : `*/15 * * * *`

**Format Cron** : `minute heure jour mois jour-semaine`

---

## 🧪 **TESTER MANUELLEMENT**

Pour tester l'endpoint manuellement :

```bash
# Sans clé secrète (si SENTINELLE_SECRET_KEY n'est pas défini)
curl https://votre-domaine.com/api/sentinelle/check

# Avec clé secrète
curl -H "Authorization: Bearer votre_cle_secrete" \
     https://votre-domaine.com/api/sentinelle/check
```

**Réponse attendue** :
```json
{
  "success": true,
  "processed": 5,
  "notified": 2,
  "timestamp": "2024-01-15T10:00:00.000Z"
}
```

---

## 📝 **LOGS ET MONITORING**

### **Vercel**

- Les logs du cron job sont disponibles dans le dashboard Vercel
- Section "Logs" → Filtrer par "Cron Jobs"

### **Votre application**

- Les logs sont dans la console (si vous utilisez un service de logging)
- Les erreurs sont capturées et retournées dans la réponse JSON

---

## ✅ **VALIDATION**

Une fois configuré, vérifiez que :

1. ✅ Le cron job est actif dans Vercel Dashboard
2. ✅ Les logs montrent des exécutions réussies
3. ✅ Les utilisateurs reçoivent des notifications
4. ✅ Le champ `last_notified_at` est mis à jour dans `saved_searches`

---

## 🎯 **RÉSUMÉ**

- ✅ **Fichier créé** : `vercel.json` avec configuration cron
- ✅ **Route API** : `/api/sentinelle/check` (déjà créée)
- ✅ **Fréquence** : Toutes les heures
- ✅ **Sécurité** : Optionnelle via `SENTINELLE_SECRET_KEY`

**Le cron job sera automatiquement configuré lors du prochain déploiement sur Vercel !** 🚀

