/**
 * TEST FINAL DE CERTIFICATION - API SUBSCRIBE
 * Doit retourner {"success":true} après réparation des permissions
 */

const https = require('https');
const http = require('http');

async function testFinalCertification() {
  console.log('🎯 TEST FINAL DE CERTIFICATION - API SUBSCRIBE');
  console.log('='.repeat(60));
  console.log('Objectif: Obtenir {"success":true} avec code 200');
  console.log('='.repeat(60));

  const payload = JSON.stringify({ email: 'test-final-success@octane98.be' });

  const options = {
    hostname: 'localhost',
    port: 3001, // Port Next.js dev
    path: '/api/subscribe',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  console.log('🚀 Envoi de la requête de certification...');
  console.log(`📍 URL: http://${options.hostname}:${options.port}${options.path}`);
  console.log(`📧 Email de test: test-final-success@octane98.be`);
  console.log('⏳ Attente de la réponse...');
  console.log('-'.repeat(40));

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log('📥 RÉPONSE REÇUE:');
      console.log(`🏷️  Status Code: ${res.statusCode}`);
      console.log(`📄 Content-Type: ${res.headers['content-type']}`);

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
              console.log('🎉 SUCCÈS TOTAL !');
              console.log('✅ Code HTTP: 200');
              console.log('✅ Response: {"success":true}');
              console.log('🚀 CERTIFICATION RÉUSSIE - PRÊT POUR DÉPLOIEMENT NETLIFY !');
              resolve({ status: res.statusCode, body: response, certified: true });
            } else {
              console.log('❌ ÉCHEC: Response indique success=false');
              console.log('📋 Détails:', response);
              resolve({ status: res.statusCode, body: response, certified: false });
            }
          } catch (e) {
            console.log('❌ ERREUR: Réponse non-JSON');
            reject(e);
          }
        } else {
          console.log(`❌ ÉCHEC: Code HTTP ${res.statusCode} (attendu: 200)`);
          console.log('📋 Réponse brute:', data);
          resolve({ status: res.statusCode, body: data, certified: false });
        }
      });
    });

    req.on('error', (error) => {
      console.error('💥 ERREUR RÉSEAU:', error.message);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Exécuter le test de certification
testFinalCertification().catch(console.error);
