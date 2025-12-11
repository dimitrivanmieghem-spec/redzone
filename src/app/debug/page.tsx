"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugPage() {
  const [connectionTest, setConnectionTest] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message?: string;
    error?: any;
  }>({ status: "idle" });
  
  // Éviter l'erreur d'hydratation en chargeant le timestamp côté client uniquement
  const [timestamp, setTimestamp] = useState<string>("");
  
  useEffect(() => {
    setTimestamp(new Date().toISOString());
  }, []);

  // Vérifier les variables d'environnement
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const urlLength = process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0;
  const keyLength = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0;

  const testConnection = async () => {
    setConnectionTest({ status: "loading" });

    try {
      console.log("🔍 [DEBUG] Test de connexion Supabase...");
      console.log("🔍 [DEBUG] URL présente:", hasUrl, `(${urlLength} caractères)`);
      console.log("🔍 [DEBUG] KEY présente:", hasKey, `(${keyLength} caractères)`);

      const supabase = createClient();
      console.log("🔍 [DEBUG] Client Supabase créé");

      // Test de connexion simple : compter les lignes de model_specs_db
      const { count, error } = await supabase
        .from("model_specs_db")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.error("❌ [DEBUG] Erreur de connexion:", error);
        setConnectionTest({
          status: "error",
          message: "Erreur de connexion",
          error: error,
        });
        return;
      }

      console.log("✅ [DEBUG] Connexion réussie! Count:", count);
      setConnectionTest({
        status: "success",
        message: `Connexion établie avec succès! (${count} lignes dans model_specs_db)`,
      });
    } catch (err) {
      console.error("❌ [DEBUG] Exception lors du test:", err);
      setConnectionTest({
        status: "error",
        message: "Exception lors du test de connexion",
        error: err,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          🔧 Page de Diagnostic Supabase
        </h1>

        {/* Section 1: Vérification des Variables d'Environnement */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            1. Vérification des Variables d'Environnement
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
              <span className="font-medium text-slate-700">
                NEXT_PUBLIC_SUPABASE_URL
              </span>
              <span
                className={`px-3 py-1 rounded font-semibold ${
                  hasUrl
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {hasUrl ? "OK" : "MANQUANT"}
              </span>
            </div>
            {hasUrl && (
              <div className="text-sm text-slate-500 ml-4">
                Longueur: {urlLength} caractères
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
              <span className="font-medium text-slate-700">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </span>
              <span
                className={`px-3 py-1 rounded font-semibold ${
                  hasKey
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {hasKey ? "OK" : "MANQUANT"}
              </span>
            </div>
            {hasKey && (
              <div className="text-sm text-slate-500 ml-4">
                Longueur: {keyLength} caractères
              </div>
            )}
          </div>

          {!hasUrl || !hasKey ? (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Action requise:</strong> Vérifiez votre fichier{" "}
                <code className="bg-yellow-100 px-2 py-1 rounded">.env.local</code>{" "}
                et assurez-vous que les deux variables sont définies.
              </p>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800">
                ✅ Toutes les variables d'environnement sont présentes.
              </p>
            </div>
          )}
        </div>

        {/* Section 2: Test de Connexion */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            2. Test de Connexion à la Base de Données
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            Ce test effectue une requête simple sur la table{" "}
            <code className="bg-slate-100 px-2 py-1 rounded">model_specs_db</code>{" "}
            pour vérifier la connexion et les politiques RLS.
          </p>

          <button
            onClick={testConnection}
            disabled={connectionTest.status === "loading" || !hasUrl || !hasKey}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              connectionTest.status === "loading" || !hasUrl || !hasKey
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700 active:scale-95"
            }`}
          >
            {connectionTest.status === "loading"
              ? "⏳ Test en cours..."
              : "🔌 Tester la connexion DB"}
          </button>

          {connectionTest.status === "success" && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-800 font-semibold">
                ✅ {connectionTest.message}
              </p>
            </div>
          )}

          {connectionTest.status === "error" && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-800 font-semibold mb-2">
                ❌ {connectionTest.message}
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-red-700 font-medium hover:text-red-900">
                  Voir les détails de l'erreur
                </summary>
                <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto max-h-96">
                  {JSON.stringify(connectionTest.error, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Section 3: Informations de Debug */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            3. Informations de Debug
          </h2>
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              <strong>Page:</strong> <code>/debug</code>
            </p>
            <p>
              <strong>Environnement:</strong> {process.env.NODE_ENV || "non défini"}
            </p>
            <p>
              <strong>Timestamp:</strong> {timestamp || "Chargement..."}
            </p>
            <p className="mt-4 text-xs text-slate-500">
              💡 <strong>Astuce:</strong> Ouvrez la console du navigateur (F12) pour
              voir les logs détaillés du test de connexion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

