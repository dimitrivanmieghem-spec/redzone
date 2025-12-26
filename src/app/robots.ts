// Octane98 - Robots.txt pour SEO
// Next.js génère automatiquement /robots.txt depuis ce fichier

import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://octane98.be';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Routes privées (nécessitent authentification)
          '/admin',
          '/admin/*',
          '/dashboard',
          '/dashboard/*',
          '/profile',
          '/profile/*',
          '/messages',
          '/messages/*',
          '/favorites',
          '/favorites/*',
          '/sell', // Page de vente nécessite authentification
          '/sell/*',
          // Routes API internes
          '/api',
          '/api/*',
          // Routes de développement
          '/_next',
          '/_next/*',
          // Autres routes privées
          '/settings',
          '/settings/*',
          '/support',
          '/support/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

