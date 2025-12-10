#!/bin/bash
# Script de déploiement automatisé RedZone

set -e

echo "🚀 Déploiement RedZone"
echo "======================"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier que nous sommes sur la branche main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠️  Vous n'êtes pas sur la branche main (actuellement: $CURRENT_BRANCH)${NC}"
    read -p "Continuer quand même ? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 2. Vérifier que le répertoire de travail est propre
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Des modifications non commitées détectées${NC}"
    git status --short
    read -p "Voulez-vous les commiter avant le déploiement ? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Message de commit: " COMMIT_MSG
        git add .
        git commit -m "${COMMIT_MSG:-Auto-deploy: $(date +%Y-%m-%d)}"
    fi
fi

# 3. Vérifier que le build passe
echo ""
echo "🔨 Vérification du build..."
if npm run build; then
    echo -e "${GREEN}✅ Build réussi${NC}"
else
    echo -e "${RED}❌ Build échoué - Corrigez les erreurs avant de déployer${NC}"
    exit 1
fi

# 4. Pousser vers GitHub (si pas déjà fait)
echo ""
echo "📤 Push vers GitHub..."
if git push origin "$CURRENT_BRANCH"; then
    echo -e "${GREEN}✅ Code poussé vers GitHub${NC}"
else
    echo -e "${YELLOW}⚠️  Push échoué ou déjà à jour${NC}"
fi

# 5. Déployer sur Vercel
echo ""
echo "🌐 Déploiement sur Vercel..."

if command -v vercel &> /dev/null; then
    # Si Vercel CLI est installé, utiliser directement
    if vercel --prod; then
        echo -e "${GREEN}✅ Déploiement réussi !${NC}"
    else
        echo -e "${RED}❌ Déploiement échoué${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Vercel CLI non installé${NC}"
    echo "Le déploiement se fera automatiquement via GitHub Actions"
    echo "ou vous pouvez installer Vercel CLI: npm install -g vercel"
fi

echo ""
echo -e "${GREEN}🎉 Déploiement terminé !${NC}"
echo ""
echo "📝 Vérifications post-déploiement :"
echo "1. Vérifiez que le site est accessible"
echo "2. Testez l'authentification"
echo "3. Vérifiez les routes protégées"
echo ""

