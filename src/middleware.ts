import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { canAccessAdmin, canAccessAdminOnly, MODERATOR_RIGHTS } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";

// ===== CONFIGURATION GLOBALE =====
const IS_MAINTENANCE = true; // Mode maintenance : redirige vers /coming-soon

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ===== COUCHE 1 : ROUTES TOUJOURS AUTORISÉES =====
  // Ces routes passent tous les contrôles (assets, APIs, etc.)
  const alwaysAllowedRoutes = [
    "/api",             // APIs
    "/_next",           // Framework Next.js
    "/favicon.ico",     // Favicon
    "/manifest.json",   // PWA
    "/robots.txt",      // SEO
    "/sitemap.xml",     // SEO
    "/legal",           // Pages légales
  ];

  const isAlwaysAllowed = alwaysAllowedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAlwaysAllowed) {
    // Ajouter les headers CSP même pour les routes always allowed
    addSecurityHeaders(response);
    return response;
  }

  // ===== COUCHE 2 : SÉCURITÉ (CSP Headers) =====
  // Appliquer les headers de sécurité à TOUTES les routes
  addSecurityHeaders(response);

  // ===== COUCHE 3 : MAINTENANCE MODE =====
  // Si mode maintenance actif, rediriger vers coming-soon (sauf routes whitelistées)
  if (IS_MAINTENANCE) {
    const maintenanceWhitelist = [
      "/coming-soon",    // Page de maintenance elle-même
      "/login",          // Connexion admin
      "/auth",           // Callbacks OAuth
      "/admin",          // Accès admin (sera vérifié après)
      "/register",       // Redirigé vers login
    ];

    const isWhitelistedForMaintenance = maintenanceWhitelist.some((route) =>
      pathname === route || pathname.startsWith(`${route}/`)
    );

    if (!isWhitelistedForMaintenance) {
      // Rediriger vers coming-soon en mode maintenance
      return NextResponse.redirect(new URL("/coming-soon", request.url));
    }
  }

  // ===== COUCHE 4 : GESTION SPÉCIALE /register =====
  if (pathname === "/register") {
    // Inscription INTERDITE en Closed Alpha
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ===== COUCHE 5 : AUTHENTIFICATION SUPABASE =====
  try {
    // Créer le client Supabase pour vérifier la session
    const cookieStore = await cookies();
    const { env } = await import("@/lib/env");
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {}, // Lecture seule pour le middleware
        },
      }
    );

    // Vérifier la session utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // ===== PROTECTION ADMIN =====
    if (pathname.startsWith("/admin")) {
      // Vérifier si l'utilisateur est authentifié
      if (authError || !user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Vérifier si l'utilisateur est banni
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_banned, role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Erreur récupération profil dans middleware:", profileError);
        return NextResponse.redirect(new URL("/login", request.url));
      }

      if (profile?.is_banned) {
        return NextResponse.redirect(new URL("/login?banned=true", request.url));
      }

      // Vérifier les permissions admin
      const userRole = profile?.role as UserRole | undefined;
      if (!userRole) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Routes admin spécifiques
      const adminOnlyRoutes = ["/admin/settings", "/admin/users", "/admin/tech"];
      const adminOnlyTabs = ["settings", "users", "tech"];
      const urlParams = request.nextUrl.searchParams;
      const currentTab = urlParams.get("tab");

      const isAdminOnlyRoute = adminOnlyRoutes.some((route) =>
        pathname.startsWith(route)
      ) || (pathname === "/admin" && currentTab && adminOnlyTabs.includes(currentTab));

      if (isAdminOnlyRoute) {
        if (!canAccessAdminOnly(userRole)) {
          if (userRole === "moderator" && MODERATOR_RIGHTS.canViewDashboard) {
            return NextResponse.redirect(new URL("/admin?tab=dashboard", request.url));
          }
          if (canAccessAdmin(userRole)) {
            return NextResponse.redirect(new URL("/admin?tab=dashboard", request.url));
          }
          return NextResponse.redirect(new URL("/", request.url));
        }
      } else {
        // Routes admin générales
        if (!canAccessAdmin(userRole)) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }

      // Autoriser l'accès admin
      return response;
    }

    // ===== ROUTES PUBLIQUES (NON ADMIN) =====
    const publicRoutes = [
      "/coming-soon",     // Landing page
      "/login",           // Connexion
      "/auth",            // Callbacks OAuth
      "/forgot-password", // Reset MDP
      "/reset-password",  // Reset MDP
    ];

    const isPublicRoute = publicRoutes.some((route) =>
      pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isPublicRoute) {
      return response;
    }

    // ===== ROUTES PROTÉGÉES (REQUIERT AUTHENTIFICATION) =====
    // Vérifier si l'utilisateur est authentifié
    if (authError || !user) {
      const loginUrl = new URL("/login", request.url);
      // Préserver l'URL demandée pour redirection après connexion
      if (pathname !== "/" && !pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
        loginUrl.searchParams.set("redirect", pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    // Vérifier si l'utilisateur est banni
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_banned, role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Erreur récupération profil dans middleware:", profileError);
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (profile?.is_banned) {
      return NextResponse.redirect(new URL("/login?banned=true", request.url));
    }

    // Autoriser l'accès pour tous les utilisateurs authentifiés et non bannis
    return response;

  } catch (error) {
    console.error("Erreur middleware:", error);
    // En cas d'erreur, rediriger vers login par sécurité
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// ===== FONCTION SÉCURITÉ =====
function addSecurityHeaders(response: NextResponse) {
  // Récupérer l'URL Supabase depuis les variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  // Content Security Policy - Autorise les ressources nécessaires
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    `img-src 'self' data: blob: https: ${supabaseUrl}`,
    // ✅ AJOUT wss: + VARIABLE ENV pour Supabase
    `connect-src 'self' https: wss: ${supabaseUrl} https://www.google-analytics.com https://www.googletagmanager.com`,
    "worker-src 'self' blob:",  // CRITIQUE : Permet les Web Workers pour browser-image-compression
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // Autres headers de sécurité
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  return response;
}

// Configuration du middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (images, etc.)
     * - robots.txt, sitemap.xml, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

