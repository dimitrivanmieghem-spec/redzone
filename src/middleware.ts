import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { canAccessAdmin, canAccessAdminOnly, MODERATOR_RIGHTS } from "@/lib/permissions";
import type { UserRole } from "@/lib/permissions";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes toujours accessibles (statiques, API, etc.)
  const alwaysAllowedRoutes = [
    "/api",
    "/_next",
    "/favicon.ico",
    "/manifest.json",
  ];

  // Vérifier si la route est toujours accessible
  const isAlwaysAllowed = alwaysAllowedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAlwaysAllowed) {
    return NextResponse.next();
  }

  // Routes publiques - accessibles sans authentification
  const publicRoutes = [
    "/",                // Page d'accueil (redirige selon logique)
    "/coming-soon",     // Landing page
    "/login",           // Connexion
    "/register",        // Inscription
    "/forgot-password", // Réinitialisation mot de passe
    "/reset-password",  // Reset mot de passe
    "/auth",            // Callbacks OAuth
  ];

  // Vérifier si la route est publique
  const isPublicRoute = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    // Routes publiques passent directement
    return NextResponse.next();
  }

  // Toutes les routes restantes nécessitent une authentification Supabase
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

    // Vérifier la session utilisateur
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Si pas d'utilisateur authentifié, rediriger vers login
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

    // Vérifier les permissions admin si nécessaire
    const adminRoutes = ["/admin"];
    const adminOnlyRoutes = ["/admin/settings", "/admin/users", "/admin/tech"];
    const adminOnlyTabs = ["settings", "users", "tech"];
    const urlParams = request.nextUrl.searchParams;
    const currentTab = urlParams.get("tab");

    const isAdminRoute = adminRoutes.some((route) =>
      pathname.startsWith(route)
    );
    const isAdminOnlyRoute = adminOnlyRoutes.some((route) =>
      pathname.startsWith(route)
    ) || (pathname === "/admin" && currentTab && adminOnlyTabs.includes(currentTab));

    if (isAdminRoute) {
      const userRole = profile?.role as UserRole | undefined;

      if (!userRole) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Routes admin strictes : uniquement admin
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
    }

    // Autoriser l'accès pour tous les utilisateurs authentifiés et non bannis
    return NextResponse.next();
  } catch (error) {
    // En cas d'erreur, rediriger vers login par sécurité
    return NextResponse.redirect(new URL("/login", request.url));
  }
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

