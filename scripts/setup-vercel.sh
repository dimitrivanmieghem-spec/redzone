#!/bin/bash
# Script d'installation et configuration Vercel CLI

set -e

echo "🚀 Configuration Vercel CLI pour RedZone"
echo "========================================"
echo ""

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "📦 Installation de Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI déjà installé"
    vercel --version
fi

echo ""
echo "🔐 Connexion à Vercel..."
echo "👉 Ouvrez votre navigateur pour vous connecter"
vercel login

echo ""
echo "📁 Lien du projet au dépôt local..."
vercel link

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📝 Prochaines étapes :"
echo "1. Configurez les variables d'environnement dans Vercel Dashboard"
echo "2. Exécutez 'npm run deploy' pour déployer"
echo ""

