/**
 * TEST RAPIDE POST-RÉPARATION SQL
 * Lancez ce script immédiatement après l'exécution du script SQL
 */

const http = require('http');

const payload = JSON.stringify({
  email: 'quick-test-' + Date.now() + '@example.com'
});

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

console.log('🧪 TEST RAPIDE POST-RÉPARATION');
console.log('='.repeat(40));

const req = http.request(options, (res) => {
  console.log(`📥 Status: ${res.statusCode}`);

  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('📦 Response:', data);
    console.log('='.repeat(40));

    if (res.statusCode === 200 && data.includes('"success":true')) {
      console.log('🎉 SUCCÈS ! Le script SQL a fonctionné.');
      console.log('🚀 Prêt pour le déploiement Netlify !');
    } else {
      console.log('❌ Encore un problème. Vérifiez les logs.');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erreur réseau:', e.message);
  console.log('💡 Le serveur Next.js tourne-t-il ? (npm run dev)');
});

req.write(payload);
req.end();
