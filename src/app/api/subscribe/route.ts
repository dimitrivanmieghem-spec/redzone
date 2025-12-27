import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/app/actions/welcome-email";

// Force Node.js runtime pour stabilité maximale
export const runtime = 'nodejs';

/**
 * API Route ULTRA-SIMPLE pour l'inscription à la waiting list
 * Version minimaliste pour diagnostic de crash
 */
export async function POST(request: NextRequest) {
  console.log("=== API SUBSCRIBE - DÉBUT ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Method:", request.method);
  console.log("URL:", request.url);

  try {
    // 1. VÉRIFICATION IMMÉDIATE DE LA CLÉ SERVICE
  console.log("1. Vérification SUPABASE_SERVICE_ROLE_KEY...");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ SUPABASE_SERVICE_ROLE_KEY ABSENTE !");
    return NextResponse.json({
      success: false,
      error: "Clé de service manquante",
      step: "env_check"
    }, { status: 500 });
  }
  console.log("✅ SUPABASE_SERVICE_ROLE_KEY présente (longueur:", process.env.SUPABASE_SERVICE_ROLE_KEY.length + ")");

  // 2. PARSING DU PAYLOAD
  console.log("2. Parsing du payload JSON...");
  let body;
  try {
    body = await request.json();
    console.log("✅ Payload parsé:", body);
  } catch (parseError) {
    console.error("❌ Erreur parsing JSON:", parseError.message);
    return NextResponse.json({
      success: false,
      error: "JSON invalide",
      step: "json_parse"
    }, { status: 400 });
  }

  const { email } = body;
  console.log("3. Email extrait:", email);

  // 3. VALIDATION DE BASE
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    console.error("❌ Email invalide:", email);
    return NextResponse.json({
      success: false,
      error: "Email invalide",
      step: "validation"
    }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  console.log("✅ Email normalisé:", normalizedEmail);

  // 4. VÉRIFICATION URL SUPABASE
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL manquante");
    return NextResponse.json({
      success: false,
      error: "URL Supabase manquante",
      step: "url_check"
    }, { status: 500 });
  }
  console.log("✅ URL Supabase présente:", supabaseUrl);

  // 5. CRÉATION CLIENT SUPABASE
  console.log("5. Création client Supabase...");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  console.log("✅ Client Supabase créé");

  // 6. INSERTION DANS WAITING_LIST
  console.log("6. Insertion dans waiting_list...");
  const { data, error: insertError } = await supabase
    .from("waiting_list")
    .insert({
      email: normalizedEmail,
      source: "website",
    });

  console.log("7. Résultat insertion:");
  console.log("   - Data:", data);
  console.log("   - Error:", insertError);

  if (insertError) {
    console.error("❌ ERREUR INSERTION:", insertError.message);
    console.error("   Code:", insertError.code);

    // Gestion doublon
    if (insertError.code === "23505") {
      console.log("✅ Doublon détecté (normal)");
      return NextResponse.json({
        success: false,
        error: "Déjà inscrit",
        isDuplicate: true
      });
    }

    return NextResponse.json({
      success: false,
      error: insertError.message || "Erreur insertion",
      step: "insert"
    }, { status: 500 });
  }

  // 7. SUCCÈS - ENVOI EMAIL DE BIENVENUE
  console.log("✅ INSCRIPTION RÉUSSIE:", normalizedEmail);

  // Envoi de l'email de bienvenue (ne bloque pas l'inscription si échec)
  if (process.env.RESEND_API_KEY) {
    console.log("📧 Envoi email de bienvenue...");
    try {
      const emailResult = await sendWelcomeEmail(normalizedEmail);
      if (emailResult.success) {
        console.log("✅ Email de bienvenue envoyé avec succès");
      } else {
        console.warn("⚠️ Échec envoi email de bienvenue:", emailResult.error);
      }
    } catch (emailError: any) {
      console.warn("⚠️ Exception lors de l'envoi d'email:", emailError?.message);
      // Ne pas bloquer l'inscription pour autant
    }
  } else {
    console.log("📧 RESEND_API_KEY non configurée - email en mode simulation");
  }

  console.log("=== API SUBSCRIBE - FIN SUCCÈS ===");

  return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("=== API SUBSCRIBE - ERREUR CRITIQUE ===");
    console.error("Message:", error?.message || "Erreur inconnue");
    console.error("Name:", error?.name || "N/A");
    console.error("Code:", error?.code || "N/A");
    console.error("Stack:", error?.stack || "N/A");
    console.error("Timestamp:", new Date().toISOString());
    console.error("=====================================");

    return NextResponse.json({
      success: false,
      error: error?.message || "Erreur serveur inconnue",
      code: error?.code || "UNKNOWN_ERROR",
      step: "catch"
    }, { status: 500 });
  }
}