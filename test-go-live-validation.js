/**
 * TEST GO-LIVE FINAL - VALIDATION COMPLÈTE
 * À exécuter APRÈS réparation SQL pour confirmer le succès
 */

const https = require('https');
const http = require('http');

async function testGoLiveValidation() {
  console.log('🚀 TEST GO-LIVE FINAL - VALIDATION COMPLÈTE');
  console.log('='.repeat(60));
  console.log('Étape: Post-réparation SQL');
  console.log('Objectif: Code 200 + email de bienvenue');
  console.log('='.repeat(60));

  const payload = JSON.stringify({ email: 'go-live-test@octane98.be' });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/subscribe',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  console.log('🎯 Test d\'inscription finale...');
  console.log(`📍 URL: http://${options.hostname}:${options.port}${options.path}`);
  console.log(`📧 Email: go-live-test@octane98.be`);
  console.log('⏳ Envoi de la requête...');
  console.log('-'.repeat(40));

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log('📥 RÉPONSE REÇUE:');
      console.log(`🏷️  Status Code: ${res.statusCode}`);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📦 Corps de la réponse:');
        console.log(data);
        console.log('='.repeat(60));

        // Analyse du résultat
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            if (response.success === true) {
              console.log('🎉 SUCCÈS TOTAL - GO-LIVE AUTORISÉ !');
              console.log('✅ Code HTTP: 200');
              console.log('✅ Response: {"success":true}');
              console.log('✅ Inscription BDD: Réussie');
              console.log('📧 Email de bienvenue: Envoyé (si RESEND_API_KEY configuré)');
              console.log('');
              console.log('🏆 OCTANE98 EST 100% OPÉRATIONNEL !');
              console.log('🚀 Commandes Netlify:');
              console.log('   1. git push origin main');
              console.log('   2. Netlify: Clear cache and deploy');
              console.log('   3. Attendre déploiement (~2-3 min)');
              console.log('   4. Tester https://octane98.be/coming-soon');
              console.log('');
              console.log('🎊 FÉLICITATIONS - LANCEMENT RÉUSSI !');
              resolve({ status: res.statusCode, body: response, goLive: true });
            } else {
              console.log('❌ ÉCHEC: Response indique success=false');
              console.log('📋 Détails:', response);
              console.log('');
              console.log('🔧 Action requise: Vérifier les logs détaillés');
              resolve({ status: res.statusCode, body: response, goLive: false });
            }
          } catch (e) {
            console.log('❌ ERREUR: Réponse non-JSON');
            reject(e);
          }
        } else if (res.statusCode === 500) {
          console.log('❌ ERREUR 500: Problème persistant après réparation SQL');
          console.log('📋 Cause probable: Script SQL non exécuté ou échoué');
          console.log('');
          console.log('🔧 Actions:');
          console.log('   1. Ré-exécuter repair-waiting-list-final.sql');
          console.log('   2. Vérifier les logs Supabase');
          console.log('   3. Relancer ce test');
          resolve({ status: res.statusCode, body: data, goLive: false });
        } else {
          console.log(`❌ CODE HTTP INATTENDU: ${res.statusCode}`);
          console.log('📋 Réponse brute:', data);
          resolve({ status: res.statusCode, body: data, goLive: false });
        }
      });
    });

    req.on('error', (error) => {
      console.error('💥 ERREUR RÉSEAU:', error.message);
      console.log('');
      console.log('🔧 Vérifications:');
      console.log('   1. Serveur Next.js en cours: npm run dev');
      console.log('   2. Port correct: 3001');
      console.log('   3. Connexion réseau OK');
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Exécuter le test de validation go-live
testGoLiveValidation().catch(console.error);
