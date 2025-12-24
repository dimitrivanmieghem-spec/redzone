import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques (pas de protection)
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
    "/_next",
    "/api",
    "/favicon.ico",
  ];

  // Vérifier si la route est publique
  const isPublicRoute = publicRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Routes protégées nécessitant une authentification
  const protectedRoutes = ["/dashboard", "/favorites", "/sell"];

  // Routes admin : admin OU moderator peuvent accéder
  const adminRoutes = ["/admin"];
  
  // Routes admin strictes : SEUL admin peut accéder (settings, users, tech)
  const adminOnlyRoutes = ["/admin/settings", "/admin/users", "/admin/tech"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminOnlyRoute = adminOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );

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
        // Logger la tentative d'accès non autorisé
        try {
          const { logAuditEventServer } = await import("@/lib/supabase/audit-logs");
          await logAuditEventServer({
            action_type: "unauthorized_access",
            resource_type: "route",
            resource_id: pathname,
            description: `Tentative d'accès non autorisé à ${pathname}`,
            status: "blocked",
            metadata: { pathname, error: authError?.message },
          }, request);
        } catch (logError) {
          // Ne pas bloquer la redirection en cas d'erreur de logging
          console.error("Erreur lors du logging d'audit:", logError);
        }
        
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

      // Si route admin, vérifier le rôle
      if (isAdminRoute) {
        const userRole = profile?.role;
        
        // Routes admin strictes : uniquement admin
        if (isAdminOnlyRoute) {
          if (userRole !== "admin") {
            // Rediriger vers le dashboard admin si modérateur, sinon vers l'accueil
            if (userRole === "moderator") {
              return NextResponse.redirect(new URL("/admin?tab=dashboard", request.url));
            }
            return NextResponse.redirect(new URL("/", request.url));
          }
        } else {
          // Routes admin générales : admin OU moderator
          // Les autres rôles (pro, particulier, user) n'ont pas accès
          if (userRole !== "admin" && userRole !== "moderator") {
            // Rediriger vers la page d'accueil si pas admin ni moderator
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
      // Log silencieux en production pour éviter l'exposition d'infos
      if (process.env.NODE_ENV === "development") {
        console.error("Middleware error:", error);
      }
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
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

