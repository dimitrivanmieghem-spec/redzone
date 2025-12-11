// RedZone - Utilitaires de vérification email pour les invités

/**
 * Génère un code de vérification à 6 chiffres
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash le code de vérification (simple hash pour stockage sécurisé)
 * En production, utilisez bcrypt ou crypto.subtle
 */
export function hashVerificationCode(code: string): string {
  // Hash simple pour l'instant (à remplacer par bcrypt en production)
  // En production, utilisez: await bcrypt.hash(code, 10)
  // Utiliser Buffer pour compatibilité Node.js et navigateur
  if (typeof window === 'undefined') {
    // Côté serveur
    return Buffer.from(code).toString('base64').split('').reverse().join('');
  } else {
    // Côté client
    return btoa(code).split('').reverse().join('');
  }
}

/**
 * Vérifie si un code correspond au hash stocké
 */
export function verifyCode(code: string, hash: string): boolean {
  const codeHash = hashVerificationCode(code);
  return codeHash === hash;
}

/**
 * Envoie un email de vérification (simulation pour l'instant)
 * 
 * TODO: Intégrer Resend ou un autre service d'email
 * Exemple avec Resend:
 * 
 * import { Resend } from 'resend';
 * const resend = new Resend(process.env.RESEND_API_KEY);
 * 
 * await resend.emails.send({
 *   from: 'RedZone <noreply@redzone.be>',
 *   to: email,
 *   subject: 'Vérifiez votre annonce RedZone',
 *   html: `Votre code de vérification: <strong>${code}</strong>`
 * });
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  vehiculeId: string
): Promise<void> {
  // SIMULATION - À remplacer par un vrai service d'email
  console.log('='.repeat(60));
  console.log('📧 EMAIL DE VÉRIFICATION (SIMULATION)');
  console.log('='.repeat(60));
  console.log(`Destinataire: ${email}`);
  console.log(`Code de vérification: ${code}`);
  console.log(`ID Véhicule: ${vehiculeId}`);
  console.log('');
  console.log('--- CONTENU EMAIL ---');
  console.log(`Sujet: Vérifiez votre annonce RedZone`);
  console.log('');
  console.log(`Bonjour,`);
  console.log('');
  console.log(`Vous avez déposé une annonce sur RedZone.`);
  console.log(`Pour confirmer votre annonce, veuillez entrer le code suivant:`);
  console.log('');
  console.log(`  ${code}`);
  console.log('');
  console.log(`Ce code est valide pendant 15 minutes.`);
  console.log('');
  console.log(`Si vous n'avez pas déposé d'annonce, ignorez cet email.`);
  console.log('');
  console.log(`L'équipe RedZone`);
  console.log('='.repeat(60));
  
  // TODO: Décommenter et configurer Resend quand disponible
  /*
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY non configuré');
  }
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  const { error } = await resend.emails.send({
    from: 'RedZone <noreply@redzone.be>',
    to: email,
    subject: 'Vérifiez votre annonce RedZone',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Vérifiez votre annonce RedZone</h1>
        <p>Bonjour,</p>
        <p>Vous avez déposé une annonce sur RedZone. Pour confirmer votre annonce, veuillez entrer le code suivant :</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h2 style="color: #dc2626; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h2>
        </div>
        <p>Ce code est valide pendant <strong>15 minutes</strong>.</p>
        <p>Si vous n'avez pas déposé d'annonce, ignorez cet email.</p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
          L'équipe RedZone
        </p>
      </div>
    `,
  });
  
  if (error) {
    throw new Error(`Erreur envoi email: ${error.message}`);
  }
  */
}

/**
 * Calcule la date d'expiration du code (15 minutes)
 */
export function getVerificationCodeExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 15);
  return expiry;
}

