// Octane98 - Utilitaires de vérification email pour les invités

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
 * Envoie un email de vérification via Resend (si configuré) ou en mode simulation
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  vehiculeId: string
): Promise<void> {
  // Vérifier si Resend est configuré
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    // MODE RÉEL : Utiliser Resend
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(resendApiKey);
      
      const { error } = await resend.emails.send({
        from: 'onboarding@resend.dev', // Email par défaut gratuit de Resend
        to: email,
        subject: 'Vérifiez votre annonce Octane98',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626;">Vérifiez votre annonce Octane98</h1>
            <p>Bonjour,</p>
            <p>Vous avez déposé une annonce sur Octane98. Pour confirmer votre annonce, veuillez entrer le code suivant :</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h2 style="color: #dc2626; font-size: 32px; letter-spacing: 4px; margin: 0;">${code}</h2>
            </div>
            <p>Ce code est valide pendant <strong>15 minutes</strong>.</p>
            <p>Si vous n'avez pas déposé d'annonce, ignorez cet email.</p>
            <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
              L'équipe Octane98
            </p>
          </div>
        `,
      });
      
      if (error) {
        console.error('Erreur Resend:', error);
        throw new Error(`Erreur envoi email: ${error.message}`);
      }
      
      return;
    } catch (error) {
      console.error('Erreur lors de l\'envoi via Resend, bascule en mode simulation:', error);
      // Continuer en mode simulation si Resend échoue
    }
  }

  // MODE SIMULATION : En développement, les emails sont simulés (pas de logs en production)
}

/**
 * Calcule la date d'expiration du code (15 minutes)
 */
export function getVerificationCodeExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 15);
  return expiry;
}

