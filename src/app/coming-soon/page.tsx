"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Gauge, Sparkles, Shield, TrendingUp, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { sendWelcomeEmail } from "@/app/actions/welcome-email";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      showToast("Veuillez entrer une adresse email valide", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("waiting_list")
        .insert({
          email: email.trim().toLowerCase(),
          source: "website",
        });

      if (error) {
        // Si l'email existe déjà, c'est pas grave
        if (error.code === "23505") {
          showToast("Vous êtes déjà inscrit à la liste !", "info");
          setIsSubmitted(true);
        } else {
          throw error;
        }
      } else {
        // Nouvelle inscription : envoyer l'email de bienvenue
        try {
          await sendWelcomeEmail(email.trim().toLowerCase());
        } catch (emailError) {
          // On ne bloque pas le flux si l'email échoue
          console.error("Erreur envoi email de bienvenue:", emailError);
        }
        
        showToast("Inscription réussie ! Vérifiez votre email pour votre message de bienvenue.", "success");
        setIsSubmitted(true);
        setEmail("");
      }
    } catch (error: any) {
      console.error("Erreur inscription:", error);
      showToast("Erreur lors de l'inscription. Réessayez plus tard.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center px-4 py-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl w-full text-center"
      >
        {/* Logo et Titre */}
        <motion.div variants={itemVariants} className="mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-2xl shadow-red-900/50">
              <Gauge className="text-white" size={40} />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight">
              Octane<span className="text-red-600">98</span>
            </h1>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight">
            Le sanctuaire du moteur thermique arrive.
          </h2>
          <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            La première marketplace belge dédiée aux puristes de la performance. Calculateur de taxes précis, annonces certifiées, et mélodies mécaniques.
          </p>
        </motion.div>

        {/* Formulaire d'inscription */}
        <motion.div variants={itemVariants} className="mb-16">
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                disabled={isSubmitting || isSubmitted}
                className="flex-1 px-6 py-4 bg-neutral-900 border-2 border-neutral-800 rounded-2xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-600 transition-all text-lg"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-900/50 hover:shadow-red-900/70 hover:scale-105"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Inscription...
                  </>
                ) : isSubmitted ? (
                  <>
                    <CheckCircle size={20} />
                    Inscrit !
                  </>
                ) : (
                  <>
                    Devenir Membre Fondateur
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </div>
            {isSubmitted && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-green-400 mt-4 text-sm font-medium"
              >
                ✓ Vous serez informé en avant-première du lancement
              </motion.p>
            )}
          </form>
        </motion.div>

        {/* Section "Pourquoi Octane98 ?" */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <motion.div
            variants={itemVariants}
            className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl border border-neutral-800 p-8 hover:border-red-600/50 transition-all"
          >
            <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-red-600/30">
              <Sparkles className="text-red-600" size={32} />
            </div>
            <h3 className="text-xl font-black text-white mb-3">Expertise Thermique</h3>
            <p className="text-neutral-400 leading-relaxed">
              Notre plateforme est dédiée exclusivement aux véhicules thermiques de caractère. Chaque annonce est vérifiée par des passionnés qui connaissent la vraie valeur mécanique.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl border border-neutral-800 p-8 hover:border-red-600/50 transition-all"
          >
            <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-red-600/30">
              <Shield className="text-red-600" size={32} />
            </div>
            <h3 className="text-xl font-black text-white mb-3">Transparence Fiscale</h3>
            <p className="text-neutral-400 leading-relaxed">
              Calculateur de taxes belge ultra-précis. Connaissez instantanément le coût réel d'immatriculation avant d'acheter. Plus de surprises à la douane.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl border border-neutral-800 p-8 hover:border-red-600/50 transition-all"
          >
            <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-red-600/30">
              <TrendingUp className="text-red-600" size={32} />
            </div>
            <h3 className="text-xl font-black text-white mb-3">Passion Puriste</h3>
            <p className="text-neutral-400 leading-relaxed">
              Rejoignez une communauté qui respire la mécanique. Partagez les sonorités de votre moteur, l'histoire de votre véhicule, et connectez-vous avec d'autres puristes.
            </p>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div variants={itemVariants} className="text-neutral-500 text-sm">
          <p>Bientôt disponible en Belgique 🇧🇪</p>
        </motion.div>
      </motion.div>
    </main>
  );
}

