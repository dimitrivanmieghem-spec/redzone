"use server";

import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Envoie un email de bienvenue aux nouveaux membres de la waiting list
 */
export async function sendWelcomeEmail(email: string): Promise<{ success: boolean; error?: string }> {
  // Si Resend n'est pas configuré, on skip silencieusement (mode dev)
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV MODE] Welcome email simulé pour: ${email}`);
    }
    return { success: true }; // On retourne success pour ne pas bloquer le flux
  }

  try {
    const { error } = await resend.emails.send({
      from: "Octane98 <admin@octane98.be>",
      to: email,
      subject: "Bienvenue chez les puristes : Vous êtes Membre Fondateur",
      html: `
        <!DOCTYPE html>
        <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #171717;
                background-color: #f9fafb;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 0;
              }
              .header {
                background: linear-gradient(135deg, #0a0a0b 0%, #1f1f1f 100%);
                padding: 40px 30px;
                text-align: center;
              }
              .logo {
                font-size: 32px;
                font-weight: 900;
                color: #ffffff;
                margin-bottom: 10px;
              }
              .logo-red {
                color: #dc2626;
              }
              .subtitle {
                color: #a3a3a3;
                font-size: 14px;
                margin-top: 10px;
              }
              .content {
                padding: 40px 30px;
              }
              .title {
                font-size: 28px;
                font-weight: 800;
                color: #0a0a0b;
                margin-bottom: 20px;
                line-height: 1.2;
              }
              .badge {
                display: inline-block;
                background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                color: #1f2937;
                font-weight: 700;
                font-size: 14px;
                padding: 8px 16px;
                border-radius: 20px;
                margin-bottom: 20px;
              }
              .text {
                color: #4b5563;
                font-size: 16px;
                line-height: 1.8;
                margin-bottom: 20px;
              }
              .highlight {
                color: #dc2626;
                font-weight: 700;
              }
              .features {
                background-color: #f9fafb;
                border-left: 4px solid #dc2626;
                padding: 20px;
                margin: 30px 0;
              }
              .feature-item {
                color: #374151;
                font-size: 15px;
                margin-bottom: 12px;
                padding-left: 25px;
                position: relative;
              }
              .feature-item::before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #dc2626;
                font-weight: 900;
                font-size: 18px;
              }
              .cta {
                text-align: center;
                margin: 40px 0;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                color: #ffffff;
                font-weight: 700;
                font-size: 16px;
                padding: 16px 32px;
                border-radius: 12px;
                text-decoration: none;
                box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2);
              }
              .footer {
                background-color: #f9fafb;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e5e7eb;
              }
              .footer-text {
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 10px;
              }
              .footer-link {
                color: #dc2626;
                text-decoration: none;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">
                  Octane<span class="logo-red">98</span>
                </div>
                <div class="subtitle">Le sanctuaire du moteur thermique</div>
              </div>
              
              <div class="content">
                <div class="badge">🏁 MEMBRE FONDATEUR</div>
                
                <h1 class="title">Bienvenue chez les puristes !</h1>
                
                <p class="text">
                  Félicitations ! Vous faites maintenant partie des <span class="highlight">Membres Fondateurs</span> d'Octane98.
                </p>
                
                <p class="text">
                  Vous avez rejoint une communauté exclusive de passionnés automobiles dédiée aux véhicules thermiques de caractère. 
                  En tant que Membre Fondateur, vous bénéficiez d'<span class="highlight">avantages exclusifs à vie</span> :
                </p>
                
                <div class="features">
                  <div class="feature-item">Calculateur de taxes belge illimité</div>
                  <div class="feature-item">Historique de cote exclusif</div>
                  <div class="feature-item">Alertes en temps réel sur vos recherches</div>
                  <div class="feature-item">Accès prioritaire aux nouvelles fonctionnalités</div>
                  <div class="feature-item">Support premium dédié</div>
                </div>
                
                <p class="text">
                  Octane98 est la première marketplace belge dédiée exclusivement aux passionnés de la performance. 
                  Supercars, youngtimers, GTI... Chaque annonce est vérifiée par des experts qui connaissent la vraie valeur mécanique.
                </p>
                
                <p class="text">
                  Nous vous tiendrons informé en avant-première du lancement officiel. 
                  En attendant, préparez-vous à découvrir votre prochaine pépite mécanique !
                </p>
                
                <div class="cta">
                  <a href="https://octane98.be/coming-soon" class="cta-button">
                    Découvrir Octane98
                  </a>
                </div>
                
                <p class="text" style="font-size: 14px; color: #6b7280; margin-top: 40px;">
                  Questions ? Répondez simplement à cet email, nous vous répondrons personnellement.
                </p>
              </div>
              
              <div class="footer">
                <p class="footer-text">
                  Octane98 - Le sanctuaire du moteur thermique<br>
                  Belgique 🇧🇪
                </p>
                <p class="footer-text">
                  <a href="https://octane98.be/legal/privacy" class="footer-link">Politique de confidentialité</a> | 
                  <a href="https://octane98.be/legal/terms" class="footer-link">CGU</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("[Welcome Email] Erreur Resend:", error);
      // On ne throw pas pour ne pas bloquer l'inscription si l'email échoue
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Welcome Email] Erreur:", error);
    // On ne throw pas pour ne pas bloquer l'inscription si l'email échoue
    return { success: false, error: error.message || "Erreur inconnue" };
  }
}

