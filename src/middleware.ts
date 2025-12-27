import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { canAccessAdmin, canAccessAdminOnly, MODERATOR_RIGHTS } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes toujours accessibles (même en mode Coming Soon)
  const alwaysAllowedRoutes = [
    "/coming-soon",
    "/access", // Route d'accès secret
    "/api",
    "/_next",
    "/favicon.ico",
    "/manifest.json", // Manifest PWA - nécessaire pour éviter ERR_SSL_PROTOCOL_ERROR
  ];

  // Vérifier si la route est toujours accessible
  const isAlwaysAllowed = alwaysAllowedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAlwaysAllowed) {
    return NextResponse.next();
  }

  // ⚡ PRIORITÉ : Routes publiques passent DIRECTEMENT sans vérification bypass
  const publicRoutes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/search",
    "/cars",
    "/legal",
    "/auth",
    "/coming-soon", // Route publique en mode maintenance
  ];

  // Vérifier si la route est publique - si oui, PAS de vérification DB du tout
  const isPublicRoute = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    // ⚡ OPTIMISATION : Routes publiques passent DIRECTEMENT sans DB queries
    return NextResponse.next();
  }

  // 🔒 APRÈS les routes publiques : vérifier le bypass pour les routes protégées
  const bypassToken = request.cookies.get("octane_bypass_token");
  const hasBypassAccess = bypassToken?.value === "granted";

  // Si pas de bypass sur route protégée, rediriger vers coming-soon
  if (!hasBypassAccess) {
    const comingSoonUrl = new URL("/coming-soon", request.url);
    // Préserver l'URL demandée dans un paramètre pour redirection ultérieure si besoin
    if (pathname !== "/" && !pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
      comingSoonUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(comingSoonUrl);
  }

  // Routes protégées nécessitant une authentification
  const protectedRoutes = ["/dashboard", "/favorites", "/sell"];

  // Routes admin : admin OU moderator peuvent accéder
  const adminRoutes = ["/admin"];
  
  // Routes admin strictes : SEUL admin peut accéder (settings, users, tech)
  const adminOnlyRoutes = ["/admin/settings", "/admin/users", "/admin/tech"];
  
  // Tabs admin stricts (via query params) : SEUL admin peut accéder
  const adminOnlyTabs = ["settings", "users", "tech"];
  const urlParams = request.nextUrl.searchParams;
  const currentTab = urlParams.get("tab");

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminOnlyRoute = adminOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  ) || (pathname === "/admin" && currentTab && adminOnlyTabs.includes(currentTab));

  // Si la route nécessite une protection
  if (isProtectedRoute || isAdminRoute) {
    try {
      // Créer le client Supabase pour vérifier l'authentification
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
            setAll(cookiesToSet) {
              // Permettre la mise à jour des cookies pour rafraîchir la session
              // Mais seulement en lecture pour éviter les problèmes de timing
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  // Ne pas modifier les cookies dans le middleware pour éviter les blocages
                  // Les cookies seront mis à jour côté client après le login
                });
              } catch {
                // Ignorer les erreurs de cookies dans le middleware
              }
            },
          },
        }
      );

      // Utiliser getUser() pour plus de sécurité et éviter les boucles de session
      // getUser() vérifie la validité du token et récupère les infos utilisateur à jour
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      // Si pas d'utilisateur ou erreur, rediriger vers login
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
        // Si erreur de récupération du profil, rediriger vers login par sécurité
        console.error("Erreur récupération profil dans middleware:", profileError);
        return NextResponse.redirect(new URL("/login", request.url));
      }

      if (profile?.is_banned) {
        // Rediriger vers une page d'erreur ou logout
        return NextResponse.redirect(new URL("/login?banned=true", request.url));
      }

      // Si route admin, vérifier le rôle avec les fonctions de permissions
      if (isAdminRoute) {
        const userRole = profile?.role as UserRole | undefined;
        
        if (!userRole) {
          return NextResponse.redirect(new URL("/", request.url));
        }
        
        // Routes admin strictes : uniquement admin (settings, users)
        if (isAdminOnlyRoute) {
          if (!canAccessAdminOnly(userRole)) {
            // Rediriger selon le rôle
            if (userRole === "moderator" && MODERATOR_RIGHTS.canViewDashboard) {
              // Les modérateurs peuvent accéder au dashboard mais pas aux routes strictes
              return NextResponse.redirect(new URL("/admin?tab=dashboard", request.url));
            }
            if (canAccessAdmin(userRole)) {
              // Autres rôles admin (support, editor, viewer) → dashboard
              return NextResponse.redirect(new URL("/admin?tab=dashboard", request.url));
            }
            // Rôles non-admin → accueil
            return NextResponse.redirect(new URL("/", request.url));
          }
        } else {
          // Routes admin générales : vérifier avec canAccessAdmin
          if (!canAccessAdmin(userRole)) {
            // Rediriger vers la page d'accueil si pas autorisé
            return NextResponse.redirect(new URL("/", request.url));
          }
        }
      }
      
      // Les routes protégées sont accessibles à tous les utilisateurs authentifiés
      // (user, pro, particulier, admin, moderator)
      // Le middleware ne bloque que les non-authentifiés et les bannis

      // Autoriser l'accès
      return NextResponse.next();
    } catch (error) {
      // En cas d'erreur, rediriger vers login par sécurité
      // Log silencieux pour éviter l'exposition d'infos sensibles
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Pour toutes les autres routes, autoriser l'accès
  return NextResponse.next();
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

