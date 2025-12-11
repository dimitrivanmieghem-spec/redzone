import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  const supabase = await createClient();

  // Si on a un token_hash et un type, c'est une confirmation d'email
  if (token_hash && type) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        type: type as "email" | "signup" | "email_change" | "recovery",
        token_hash,
      });

      if (error) {
        console.error("Erreur vérification token:", error);
        return NextResponse.redirect(
          new URL(
            `/login?error=invalid_token&message=${encodeURIComponent("Lien de confirmation invalide ou expiré")}`,
            requestUrl.origin
          )
        );
      }

      if (data?.user) {
        // Succès : l'utilisateur est maintenant confirmé et connecté
        // Rediriger vers le dashboard
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    } catch (err) {
      console.error("Erreur callback:", err);
      return NextResponse.redirect(
        new URL(
          `/login?error=callback_error&message=${encodeURIComponent("Erreur lors de la confirmation")}`,
          requestUrl.origin
        )
      );
    }
  }

  // Si pas de token_hash, vérifier si l'utilisateur est déjà connecté (cas où Supabase a déjà géré la session)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // L'utilisateur est connecté, rediriger vers le dashboard
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // En cas d'erreur ou si les paramètres sont manquants, rediriger vers la page de connexion
  return NextResponse.redirect(
    new URL(
      `/login?error=invalid_token&message=${encodeURIComponent("Lien de confirmation invalide ou expiré")}`,
      requestUrl.origin
    )
  );
}

