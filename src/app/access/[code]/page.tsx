"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle, Gauge } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export default function AccessPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");

  useEffect(() => {
    async function validateAccess() {
      const code = params.code as string;

      if (!code) {
        setStatus("error");
        showToast("Code d'accès manquant", "error");
        setTimeout(() => {
          router.push("/coming-soon");
        }, 2000);
        return;
      }

      try {
        // Appeler l'API sécurisée pour valider le code et définir le cookie HTTP-Only
        const response = await fetch("/api/auth/bypass", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("success");
          showToast("Accès autorisé ! Redirection...", "success");

          // Rediriger vers l'accueil après un court délai
          setTimeout(() => {
            router.push("/");
          }, 1500);
        } else {
          setStatus("error");
          showToast(data.error || "Code d'accès invalide", "error");

          // Rediriger vers coming-soon après un délai
          setTimeout(() => {
            router.push("/coming-soon");
          }, 2000);
        }
      } catch (error) {
        console.error("Erreur lors de la validation:", error);
        setStatus("error");
        showToast("Erreur lors de la validation. Réessayez plus tard.", "error");

        setTimeout(() => {
          router.push("/coming-soon");
        }, 2000);
      }
    }

    validateAccess();
  }, [params.code, router, showToast]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-neutral-900 rounded-2xl border border-neutral-800 p-12 text-center max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
            <Gauge className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-white">Octane98</h1>
        </div>

        {status === "checking" && (
          <div className="space-y-4">
            <Loader2 className="animate-spin text-red-600 mx-auto" size={48} />
            <p className="text-neutral-400">Vérification du code d'accès...</p>
          </div>
        )}

        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <CheckCircle className="text-green-600 mx-auto" size={48} />
            <h2 className="text-xl font-black text-white">Accès autorisé</h2>
            <p className="text-neutral-400">Redirection en cours...</p>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <XCircle className="text-red-600 mx-auto" size={48} />
            <h2 className="text-xl font-black text-white">Code invalide</h2>
            <p className="text-neutral-400">Redirection vers la page d'accueil...</p>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}

