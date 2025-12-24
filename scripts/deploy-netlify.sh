#!/bin/bash
# RedZone - Script de Déploiement Netlify
# 
# Ce script vérifie que tout est prêt avant de déployer sur Netlify
# et guide l'utilisateur à travers le processus de déploiement.

set -e  # Arrêter en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  RedZone - Script de Déploiement Netlify                    ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur : Ce script doit être exécuté à la racine du projet${NC}"
    exit 1
fi

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Erreur : Node.js n'est pas installé${NC}"
    exit 1
fi

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Erreur : npm n'est pas installé${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Étape 1 : Vérification des variables d'environnement...${NC}"
node scripts/verify-env.js
VERIFY_EXIT_CODE=$?

if [ $VERIFY_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ La vérification des variables d'environnement a échoué${NC}"
    echo -e "${YELLOW}💡 Corrigez les erreurs avant de continuer${NC}"
    exit 1
fi

echo -e "\n${BLUE}📋 Étape 2 : Vérification des dépendances...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Installation des dépendances...${NC}"
    npm install
else
    echo -e "${GREEN}✅ Dépendances déjà installées${NC}"
fi

echo -e "\n${BLUE}📋 Étape 3 : Build de production...${NC}"
npm run build
BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ Le build a échoué${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Build réussi !${NC}"

echo -e "\n${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  PROCHAINES ÉTAPES MANUELLES                                  ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${YELLOW}1. Vérifiez que votre repository est à jour :${NC}"
echo -e "   git add ."
echo -e "   git commit -m 'Préparation déploiement production'"
echo -e "   git push origin main\n"

echo -e "${YELLOW}2. Dans Netlify Dashboard :${NC}"
echo -e "   - Allez dans Site Settings > Environment Variables"
echo -e "   - Configurez toutes les variables de votre .env.local"
echo -e "   - Vérifiez que NEXT_PUBLIC_SITE_URL correspond à votre domaine Netlify\n"

echo -e "${YELLOW}3. Déclenchez un nouveau déploiement :${NC}"
echo -e "   - Soit via un nouveau commit (déploiement automatique)"
echo -e "   - Soit via 'Trigger deploy' dans Netlify Dashboard\n"

echo -e "${YELLOW}4. Après le déploiement, testez :${NC}"
echo -e "   - Accès public (page d'accueil)"
echo -e "   - Inscription/Connexion"
echo -e "   - Publication d'annonce"
echo -e "   - Accès admin/moderator\n"

echo -e "${GREEN}✅ Tout est prêt pour le déploiement !${NC}\n"

