import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
    // Permet les images non optimisées pour les domaines non configurés
    unoptimized: false,
  },
  // Headers de sécurité
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    
    // Headers de base (toujours présents)
    const baseHeaders = [
      {
        key: "X-DNS-Prefetch-Control",
        value: "on",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
    ];

    // Headers HTTPS uniquement en production (évite ERR_SSL_PROTOCOL_ERROR en localhost)
    const productionOnlyHeaders = [];
    if (isProduction) {
      productionOnlyHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    // CSP avec upgrade-insecure-requests conditionnel
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob: https://*.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in",
      "media-src 'self' https://*.supabase.co blob: data:",
      "frame-src 'self' https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ];

    // Ajouter upgrade-insecure-requests uniquement en production
    if (isProduction) {
      cspDirectives.push("upgrade-insecure-requests");
    }

    return [
      {
        source: "/:path*",
        headers: [
          ...baseHeaders,
          ...productionOnlyHeaders,
          {
            key: "Content-Security-Policy",
            value: cspDirectives.join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
