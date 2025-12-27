/**
 * ========================================
 * SCRIPT DE TEST ISOLÉ - ERREUR 42501
 * ========================================
 * 
 * INSTRUCTIONS :
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Aller sur la page /coming-soon
 * 3. Copier-coller ce script dans la console
 * 4. Appuyer sur Entrée
 * 
 * RÉSULTATS ATTENDUS :
 * - Test 1 (INSERT seul) : ✅ Succès
 * - Test 2 (INSERT + SELECT) : ❌ Erreur 42501
 * - Test 3 (SELECT anonyme) : ❌ Erreur 42501
 * 
 * ========================================
 */

(async function testWaitingListInsert() {
  console.log('🧪 DÉBUT DU TEST - ERREUR 42501');
  console.log('================================\n');
  
  // Méthode 1 : Utiliser le client Supabase global si disponible
  let supabase;
  
  try {
    // Essayer de récupérer depuis window (si exposé)
    if (window.supabase) {
      supabase = window.supabase;
      console.log('✅ Client Supabase trouvé dans window.supabase');
    } else {
      // Méthode 2 : Créer un client temporaire
      // Note : Nécessite d'importer depuis le module
      // Pour ce test, on va utiliser fetch directement vers l'API Supabase
      console.log('⚠️  Client Supabase non trouvé, utilisation de fetch direct');
      
      // Récupérer les variables depuis les meta tags ou les variables globales
      const supabaseUrl = document.querySelector('meta[name="supabase-url"]')?.content 
        || process.env.NEXT_PUBLIC_SUPABASE_URL
        || prompt('Entrez votre NEXT_PUBLIC_SUPABASE_URL:');
      
      const supabaseKey = document.querySelector('meta[name="supabase-key"]')?.content
        || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        || prompt('Entrez votre NEXT_PUBLIC_SUPABASE_ANON_KEY:');
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Impossible de récupérer les credentials Supabase');
        return;
      }
      
      // Créer un client Supabase minimal pour le test
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Client Supabase créé');
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création du client:', error);
    console.log('\n💡 ALTERNATIVE : Testez directement dans la page /coming-soon');
    console.log('   Le formulaire utilise déjà le bon client Supabase.');
    return;
  }
  
  // ========================================
  // TEST 1 : INSERT SEUL (sans SELECT)
  // ========================================
  console.log('\n📝 TEST 1 : INSERT seul (sans .select())');
  console.log('----------------------------------------');
  
  const testEmail1 = `test-${Date.now()}@example.com`;
  
  try {
    const { data: insertData1, error: insertError1 } = await supabase
      .from('waiting_list')
      .insert({
        email: testEmail1,
        source: 'website',
      });
      // Pas de .select() ici
    
    if (insertError1) {
      console.log('❌ ÉCHEC:', {
        code: insertError1.code,
        message: insertError1.message,
        hint: insertError1.hint,
        details: insertError1.details,
      });
    } else {
      console.log('✅ SUCCÈS : Insertion réussie (sans retour de données)');
      console.log('   Email testé:', testEmail1);
    }
  } catch (error) {
    console.error('❌ EXCEPTION:', error);
  }
  
  // ========================================
  // TEST 2 : INSERT + SELECT (comme dans le code actuel)
  // ========================================
  console.log('\n📝 TEST 2 : INSERT + SELECT (reproduction du bug)');
  console.log('----------------------------------------');
  
  const testEmail2 = `test-${Date.now()}-2@example.com`;
  
  try {
    const { data: insertData2, error: insertError2 } = await supabase
      .from('waiting_list')
      .insert({
        email: testEmail2,
        source: 'website',
      })
      .select()
      .single();
    
    if (insertError2) {
      console.log('❌ ÉCHEC (ATTENDU) :', {
        code: insertError2.code,
        message: insertError2.message,
        hint: insertError2.hint,
        details: insertError2.details,
      });
      
      if (insertError2.code === '42501') {
        console.log('✅ Erreur 42501 confirmée : Permission Denied');
        console.log('   Cause : SELECT bloqué par RLS pour client anonyme');
      }
    } else {
      console.log('✅ SUCCÈS (INATTENDU) : Insertion + SELECT réussis');
      console.log('   Données retournées:', insertData2);
    }
  } catch (error) {
    console.error('❌ EXCEPTION:', error);
  }
  
  // ========================================
  // TEST 3 : SELECT ANONYME (vérification RLS)
  // ========================================
  console.log('\n📝 TEST 3 : SELECT anonyme (vérification RLS)');
  console.log('----------------------------------------');
  
  try {
    const { data: checkData, error: checkError } = await supabase
      .from('waiting_list')
      .select('email')
      .eq('email', testEmail1)
      .single();
    
    if (checkError) {
      console.log('❌ ÉCHEC (ATTENDU) :', {
        code: checkError.code,
        message: checkError.message,
        hint: checkError.hint,
      });
      
      if (checkError.code === '42501') {
        console.log('✅ Erreur 42501 confirmée : SELECT bloqué pour client anonyme');
        console.log('   Conforme à la politique RLS (admin uniquement)');
      }
    } else {
      console.log('✅ SUCCÈS (INATTENDU) : SELECT réussi');
      console.log('   Données:', checkData);
    }
  } catch (error) {
    console.error('❌ EXCEPTION:', error);
  }
  
  // ========================================
  // RÉSUMÉ
  // ========================================
  console.log('\n📊 RÉSUMÉ DES TESTS');
  console.log('================================');
  console.log('✅ Test 1 (INSERT seul) : Devrait réussir');
  console.log('❌ Test 2 (INSERT + SELECT) : Devrait échouer avec 42501');
  console.log('❌ Test 3 (SELECT anonyme) : Devrait échouer avec 42501');
  console.log('\n💡 CONCLUSION :');
  console.log('   L\'erreur 42501 est causée par le .select() après INSERT.');
  console.log('   La politique SELECT est restreinte aux admins.');
  console.log('   Solution : Supprimer .select().single() ou ajouter une politique SELECT publique.');
  
  return {
    test1: { email: testEmail1, expected: 'success' },
    test2: { email: testEmail2, expected: 'error_42501' },
    test3: { expected: 'error_42501' },
  };
})();

