# 📋 RGPD - DURÉES DE CONSERVATION DES DONNÉES
**RedZone - Conformité RGPD et Loi belge sur la protection des données**

---

## 📊 RÉSUMÉ EXÉCUTIF

Conformément au **RGPD (Règlement Général sur la Protection des Données)** et à la **Loi belge du 30 juillet 2018 relative à la protection des personnes physiques à l'égard des traitements de données à caractère personnel**, RedZone s'engage à respecter les durées de conservation des données personnelles.

**Principe général :** Les données personnelles sont conservées uniquement pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées.

---

## 🗄️ DURÉES DE CONSERVATION PAR TYPE DE DONNÉES

### 1. **PROFILS UTILISATEURS** (`profiles`)

**Durée de conservation :**
- **Compte actif** : Conservation indéfinie tant que le compte est actif
- **Compte inactif** : 3 ans après la dernière connexion
- **Compte supprimé** : 30 jours après la demande de suppression (droit à l'oubli)

**Justification :**
- Nécessaire pour la gestion du compte utilisateur
- Obligations légales (facturation, contrats)
- Conservation des données de contact pour la communication

**Action automatique :**
- Suppression automatique après 3 ans d'inactivité
- Archivage avant suppression définitive

---

### 2. **ANNONCES VÉHICULES** (`vehicules`)

**Durée de conservation :**
- **Annonce active** : Conservation tant que l'annonce est active
- **Annonce vendue/retirée** : 1 an après la vente ou le retrait
- **Annonce rejetée** : 90 jours après le rejet (pour modération)

**Justification :**
- Nécessaire pour l'affichage des annonces
- Conservation pour historique des transactions
- Délai de rétractation légal (14 jours)

**Action automatique :**
- Archivage automatique après 1 an
- Suppression définitive après archivage (30 jours)

---

### 3. **MESSAGES ET CONVERSATIONS** (`messages`, `conversations`)

**Durée de conservation :**
- **Conversation active** : Conservation tant que la conversation est active
- **Conversation fermée** : 1 an après la dernière activité
- **Messages** : Conservation liée à la conversation

**Justification :**
- Nécessaire pour la communication entre utilisateurs
- Conservation pour preuve en cas de litige
- Délai de prescription légal (1 an)

**Action automatique :**
- Archivage automatique après 1 an d'inactivité
- Suppression définitive après archivage (30 jours)

---

### 4. **FAVORIS** (`favorites`)

**Durée de conservation :**
- **Favoris actifs** : Conservation tant que l'utilisateur est actif
- **Compte supprimé** : Suppression immédiate avec le compte

**Justification :**
- Données de préférence utilisateur
- Pas de valeur légale ou commerciale après suppression du compte

**Action automatique :**
- Suppression automatique lors de la suppression du compte

---

### 5. **RECHERCHES SAUVEGARDÉES** (`saved_searches`)

**Durée de conservation :**
- **Recherche active** : Conservation tant que la recherche est active
- **Recherche inactive** : 1 an après la désactivation
- **Compte supprimé** : Suppression immédiate avec le compte

**Justification :**
- Données de préférence utilisateur
- Service d'alertes (Sentinelle)

**Action automatique :**
- Suppression automatique après 1 an d'inactivité
- Suppression immédiate lors de la suppression du compte

---

### 6. **NOTIFICATIONS** (`notifications`)

**Durée de conservation :**
- **Notification non lue** : Conservation jusqu'à la lecture
- **Notification lue** : 90 jours après la lecture
- **Notification système** : 30 jours après l'envoi

**Justification :**
- Nécessaire pour informer l'utilisateur
- Pas de valeur après lecture prolongée

**Action automatique :**
- Suppression automatique après les délais indiqués

---

### 7. **LOGS D'AUDIT** (`audit_logs`)

**Durée de conservation :**
- **Tous les logs** : **2 ans maximum** (durée légale en Belgique)

**Justification :**
- Obligation légale de conservation des logs d'audit
- Durée maximale autorisée par la loi belge
- Nécessaire pour la traçabilité et la sécurité

**Action automatique :**
- Suppression automatique après 2 ans (fonction `cleanup_old_audit_logs()`)

---

### 8. **LOGS D'APPLICATION** (`app_logs`)

**Durée de conservation :**
- **Logs d'erreur** : 1 an
- **Logs d'information** : 90 jours
- **Logs d'avertissement** : 180 jours

**Justification :**
- Nécessaire pour le debugging et le monitoring
- Pas de valeur après une certaine période

**Action automatique :**
- Suppression automatique selon le type de log

---

### 9. **TICKETS DE SUPPORT** (`tickets`)

**Durée de conservation :**
- **Ticket ouvert** : Conservation tant que le ticket est ouvert
- **Ticket résolu** : 2 ans après la résolution
- **Ticket fermé** : 1 an après la fermeture

**Justification :**
- Nécessaire pour le support client
- Conservation pour preuve en cas de litige
- Délai de prescription légal

**Action automatique :**
- Archivage automatique après résolution
- Suppression définitive après les délais indiqués

---

### 10. **ARTICLES ET COMMENTAIRES** (`articles`, `comments`)

**Durée de conservation :**
- **Article publié** : Conservation indéfinie (contenu public)
- **Article en brouillon** : 1 an après la dernière modification
- **Commentaire approuvé** : Conservation liée à l'article
- **Commentaire rejeté** : 30 jours après le rejet

**Justification :**
- Contenu public (pas de données personnelles sensibles)
- Conservation pour l'historique du site

**Action automatique :**
- Suppression automatique des brouillons après 1 an
- Suppression des commentaires rejetés après 30 jours

---

## 🔄 PROCESSUS DE SUPPRESSION AUTOMATIQUE

### Scripts SQL de nettoyage

Des fonctions SQL automatiques sont configurées pour nettoyer les données expirées :

1. **`cleanup_old_audit_logs()`** - Nettoie les logs d'audit de plus de 2 ans
2. **`cleanup_inactive_profiles()`** - Nettoie les profils inactifs de plus de 3 ans
3. **`cleanup_old_notifications()`** - Nettoie les notifications anciennes
4. **`cleanup_expired_sessions()`** - Nettoie les sessions expirées

**Fréquence d'exécution :** Tous les mois (via cron job Supabase)

---

## 📝 DROITS DES UTILISATEURS (RGPD)

### 1. **Droit d'accès** (Article 15 RGPD)
- L'utilisateur peut demander l'accès à toutes ses données personnelles
- Export disponible via le dashboard utilisateur

### 2. **Droit de rectification** (Article 16 RGPD)
- L'utilisateur peut modifier ses données personnelles à tout moment
- Disponible via le profil utilisateur

### 3. **Droit à l'effacement** (Article 17 RGPD - "Droit à l'oubli")
- L'utilisateur peut demander la suppression de ses données
- Suppression effectuée dans les 30 jours
- Certaines données peuvent être conservées pour obligations légales

### 4. **Droit à la portabilité** (Article 20 RGPD)
- L'utilisateur peut exporter ses données au format JSON
- Export disponible via le dashboard utilisateur

### 5. **Droit d'opposition** (Article 21 RGPD)
- L'utilisateur peut s'opposer au traitement de ses données
- Disponible via les paramètres de confidentialité

---

## 🔒 SÉCURITÉ DES DONNÉES

### Chiffrement
- ✅ Données en transit : HTTPS/TLS 1.3
- ✅ Données au repos : Chiffrement au niveau de la base de données (Supabase)
- ✅ Mots de passe : Hachage bcrypt (géré par Supabase)

### Accès aux données
- ✅ Accès restreint aux administrateurs uniquement
- ✅ Logs d'audit pour tous les accès aux données personnelles
- ✅ Authentification à deux facteurs recommandée pour les admins

---

## 📞 CONTACT POUR LES DEMANDES RGPD

Pour toute demande concernant vos données personnelles :
- **Email** : [À compléter avec l'email du DPO]
- **Formulaire** : Disponible dans le dashboard utilisateur
- **Délai de réponse** : Maximum 30 jours (conforme RGPD)

---

## 📅 MISE À JOUR

**Dernière mise à jour :** Décembre 2025  
**Prochaine révision :** Décembre 2026

Ce document est conforme au RGPD et à la législation belge en vigueur.

