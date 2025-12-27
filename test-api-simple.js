const https = require('https');
const http = require('http');

async function testAPI() {
  console.log('🧪 TEST API SUBSCRIBE - VERSION SIMPLE');
  console.log('=====================================');

  const payload = JSON.stringify({ email: 'test-simple-' + Date.now() + '@example.com' });

  const options = {
    hostname: 'localhost',
    port: 3001, // Port correct
    path: '/api/subscribe',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  console.log('📤 Requête vers:', `http://${options.hostname}:${options.port}${options.path}`);
  console.log('📦 Payload:', payload);
  console.log('⏳ Envoi...');

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log('📥 Réponse reçue:');
      console.log('   Status:', res.statusCode);
      console.log('   Headers:', JSON.stringify(res.headers, null, 2));

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('   Body:', data);
        console.log('=====================================');

        if (res.statusCode === 200) {
          console.log('✅ SUCCÈS: Code 200 reçu');
        } else {
          console.log('❌ ÉCHEC: Code', res.statusCode, 'reçu');
        }

        resolve({ status: res.statusCode, body: data });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erreur réseau:', error.message);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

// Exécuter le test
testAPI().catch(console.error);
