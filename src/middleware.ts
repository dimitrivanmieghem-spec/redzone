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
    "/search",
    "/cars",
    "/legal",
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
  // /sell est maintenant publique (mode hybride)
  const protectedRoutes = ["/dashboard", "/favorites"];

  // Routes admin nécessitant le rôle admin
  const adminRoutes = ["/admin"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Si la route nécessite une protection
  if (isProtectedRoute || isAdminRoute) {
    try {
      // Créer le client Supabase pour vérifier l'authentification
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {
              // Ne pas modifier les cookies dans le middleware
            },
          },
        }
      );

      // Vérifier l'utilisateur avec getUser() (plus sécurisé que getSession())
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

      // Si route admin, vérifier le rôle
      if (isAdminRoute) {
        if (!profile || profile.role !== "admin") {
          // Rediriger vers la page d'accueil si pas admin
          return NextResponse.redirect(new URL("/", request.url));
        }
      }

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

