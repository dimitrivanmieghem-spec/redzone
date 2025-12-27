import { createClient } from "@supabase/supabase-js";
import type { Context } from "@netlify/edge-functions";

export default async (request: Request, context: Context) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ success: false, error: "Adresse email invalide" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    console.log("[Edge Function Subscribe] 🚀 Début inscription:", normalizedEmail);

    // Récupération des variables d'environnement via Netlify
    const supabaseUrl = Netlify.env.get("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      console.error("[Edge Function Subscribe] ❌ Variables manquantes");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Configuration serveur invalide",
          code: "ENV_MISSING"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Client admin avec service role
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: insertError } = await supabase
      .from("waiting_list")
      .insert({
        email: normalizedEmail,
        source: "website",
      });

    if (insertError) {
      if (insertError.code === "23505") {
        console.log("[Edge Function Subscribe] Doublon:", normalizedEmail);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Vous êtes déjà inscrit à la liste !",
            isDuplicate: true
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }

      console.error("[Edge Function Subscribe] ERREUR:", insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: insertError.message || "Erreur lors de l'inscription"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    console.log("[Edge Function Subscribe] ✅ Succès:", normalizedEmail);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error: any) {
    console.error("[Edge Function Subscribe] ❌ ERREUR:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Erreur lors de l'inscription"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};
