/**
 * Script de test local pour l'API Route /api/subscribe
 * Simule un appel POST pour vérifier que la route ne crash pas
 */

const https = require('https');
const http = require('http');

async function testAPISubscribe() {
  console.log('🧪 TEST LOCAL - API Subscribe Route');
  console.log('='.repeat(50));

  // Configuration du test
  const testEmail = 'test-' + Date.now() + '@example.com';
  const payload = JSON.stringify({ email: testEmail });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/subscribe',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'User-Agent': 'Test-Script/1.0',
    },
  };

  console.log('📤 Envoi de la requête...');
  console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);
  console.log('Payload:', payload);
  console.log('-'.repeat(30));

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log('📥 Réponse reçue:');
      console.log('Status:', res.statusCode);
      console.log('Headers:', JSON.stringify(res.headers, null, 2));

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Body:', data);
        console.log('='.repeat(50));

        try {
          const response = JSON.parse(data);
          console.log('✅ Réponse JSON valide:', response);

          if (res.statusCode === 200 || res.statusCode === 500) {
            console.log('✅ Test réussi - Route accessible');
          } else {
            console.log('⚠️ Status inattendu:', res.statusCode);
          }

          resolve(response);
        } catch (e) {
          console.log('❌ Réponse non-JSON:', data);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erreur de requête:', error.message);
      console.log('='.repeat(50));
      console.log('💡 Vérifiez que le serveur Next.js tourne sur localhost:3000');
      console.log('   Commande: npm run dev');
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Test avec email valide
testAPISubscribe()
  .then(() => {
    console.log('🎉 Test terminé avec succès');
  })
  .catch((error) => {
    console.error('💥 Test échoué:', error.message);
  });
