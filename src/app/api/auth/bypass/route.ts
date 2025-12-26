import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "octane_bypass_token";
const COOKIE_DURATION_DAYS = 30;
const COOKIE_MAX_AGE = COOKIE_DURATION_DAYS * 24 * 60 * 60; // 30 jours en secondes

/**
 * Route API sécurisée pour valider le code d'accès Alpha
 * et définir un cookie HTTP-Only sécurisé
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    // Récupérer le code secret depuis les variables d'environnement ou utiliser la valeur par défaut
    const SECRET_CODE = process.env.ALPHA_ACCESS_CODE || "octane-alpha-2025";

    // Valider le code
    if (!code || code !== SECRET_CODE) {
      return NextResponse.json(
        { success: false, error: "Code d'accès invalide" },
        { status: 401 }
      );
    }

    // Définir le cookie HTTP-Only sécurisé
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, "granted", {
      httpOnly: true, // Cookie inaccessible via JavaScript (protection XSS)
      secure: process.env.NODE_ENV === "production", // HTTPS uniquement en production
      sameSite: "lax", // Protection CSRF
      maxAge: COOKIE_MAX_AGE, // 30 jours
      path: "/", // Disponible sur tout le site
    });

    // Logger l'accès autorisé (optionnel, pour audit)
    if (process.env.NODE_ENV === "development") {
      console.log(`[ALPHA ACCESS] Code validé, cookie défini pour ${COOKIE_DURATION_DAYS} jours`);
    }

    return NextResponse.json({
      success: true,
      message: "Accès autorisé",
    });
  } catch (error) {
    console.error("[ALPHA ACCESS] Erreur lors de la validation:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

