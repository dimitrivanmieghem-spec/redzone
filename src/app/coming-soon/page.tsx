"use client";

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Gauge, Sparkles, Shield, TrendingUp, CheckCircle, Loader2, ArrowRight, Calculator } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import dynamic from "next/dynamic";

// Lazy load du calculateur fiscal pour la performance
const TaxCalculator = dynamic(() => import("@/components/TaxCalculator"), {
  loading: () => (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="animate-spin text-red-600 mx-auto mb-4" size={48} />
        <p className="text-slate-400">Chargement du calculateur...</p>
      </div>
    </div>
  ),
  ssr: false // Pas de SSR pour éviter les problèmes d'hydratation
});

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { showToast } = useToast();

  // État pour le calculateur fiscal
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorInputs, setCalculatorInputs] = useState({
    annee: new Date().getFullYear(),
    puissanceKw: 150, // Valeur d'exemple pour montrer le calculateur
    co2: 150,
    cvFiscaux: 11, // Valeur d'exemple pour montrer le calculateur
    carburant: "essence" as string
  });

  // Ref pour détecter quand l'utilisateur scrolle vers le calculateur
  const calculatorRef = useRef<HTMLDivElement>(null);

  // Détection du scroll pour charger le calculateur uniquement quand visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !showCalculator) {
          setShowCalculator(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (calculatorRef.current) {
      observer.observe(calculatorRef.current);
    }

    return () => observer.disconnect();
  }, [showCalculator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      showToast("Veuillez entrer une adresse email valide", "error");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    setIsSubmitting(true);
    
    try {
      // Utiliser l'API Route (client admin, contourne RLS)
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const result = await response.json();

      if (!result.success) {
        // Gestion des erreurs
        if (result.isDuplicate) {
          // Doublon
          showToast("Vous êtes déjà inscrit à la liste !", "info");
          setIsSubmitted(true);
        } else {
          // Autre erreur
          showToast(result.error || "Erreur lors de l'inscription. Réessayez plus tard.", "error");
        }
        setIsSubmitting(false);
        return;
      }

      // Insertion réussie - Log pour Netlify
      console.log("[Coming Soon] ✅ Inscription réussie via API Route:", {
        email: normalizedEmail,
        timestamp: new Date().toISOString(),
      });

      // TODO: Réimplémenter l'envoi d'email via API Route séparée si nécessaire

      // Succès
      showToast("Inscription réussie ! Vous serez informé en avant-première du lancement.", "success");
      setIsSubmitted(true);
      setEmail("");

    } catch (error: any) {
      // Erreur inattendue (exception non gérée)
      console.error("[Coming Soon] ❌ ERREUR CRITIQUE inscription:", {
        email: normalizedEmail,
        error: error?.message || "Erreur inconnue",
        stack: error?.stack,
      });
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
        ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number], // Courbe de Bézier équivalente à backOut
      },
    },
  };

  return (
    <main className="min-h-[100dvh] bg-neutral-950 text-white relative overflow-hidden">
      {/* Hero Background - Optimisé Mobile-First */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Image de fond - Hero Octane98 - Optimisée pour mobile vertical */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.png"
            alt="Octane98 - Le sanctuaire du moteur thermique"
            fill
            className="object-cover object-center md:object-center lg:object-center opacity-60"
            priority
            quality={85}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          />
        </div>

        {/* Fond avec dégradé noir/rouge profond - Par-dessus l'image */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-neutral-950 via-red-950/20 to-neutral-950">
          {/* Pattern subtil */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_70%)]" />
        </div>

        {/* Overlay pour améliorer la lisibilité du texte - Plus prononcé sur mobile */}
        <div className="absolute inset-0 z-0 bg-black/50 md:bg-black/40" />

        {/* Contenu central - Mobile-First avec scroll vertical */}
        <div className="relative z-10 w-full px-4 py-6 md:py-12 overflow-y-auto max-h-screen">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl mx-auto text-center"
          >
            {/* Logo et Titre - Typographie adaptée mobile */}
            <motion.div variants={itemVariants} className="mb-6 md:mb-12">
              <div className="flex items-center justify-center gap-2 md:gap-4 mb-4 md:mb-6">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-2xl shadow-red-900/50">
                  <Gauge className="text-white w-7 h-7 md:w-10 md:h-10" />
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-6xl lg:text-7xl font-black text-white tracking-tight">
                  Octane<span className="text-red-600">98</span>
                </h1>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black text-white mb-3 md:mb-4 tracking-tight px-2">
                Le sanctuaire du moteur thermique arrive.
              </h2>
              <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-neutral-300 md:text-neutral-400 max-w-2xl mx-auto leading-relaxed px-2">
                La première marketplace belge dédiée aux puristes de la performance. Calculateur de taxes précis, annonces certifiées, et mélodies mécaniques.
              </p>
            </motion.div>

            {/* Formulaire d'inscription - Full width mobile avec card glassmorphism */}
            <motion.div variants={itemVariants} className="mb-8 md:mb-16">
              <div className="bg-neutral-900/70 backdrop-blur-md rounded-2xl border border-neutral-800/50 p-4 md:p-6 shadow-xl">
                <form onSubmit={handleSubmit} className="w-full">
                  <div className="flex flex-col gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      disabled={isSubmitting || isSubmitted}
                      className="w-full min-h-[44px] px-4 py-3 md:px-6 md:py-4 bg-neutral-800/80 backdrop-blur-sm border-2 border-neutral-700 rounded-xl md:rounded-2xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-600 transition-all text-base md:text-lg touch-manipulation"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || isSubmitted}
                      className="w-full min-h-[44px] px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:scale-[0.98] text-white font-black rounded-xl md:rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-900/50 hover:shadow-red-900/70 touch-manipulation"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin w-5 h-5" />
                          <span className="text-sm md:text-base">Inscription...</span>
                        </>
                      ) : isSubmitted ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm md:text-base">Inscrit !</span>
                        </>
                      ) : (
                        <>
                          <span className="text-sm md:text-base">Devenir Membre Fondateur</span>
                          <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                        </>
                      )}
                    </button>
                  </div>
                  {isSubmitted && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-green-400 mt-3 md:mt-4 text-xs md:text-sm font-medium"
                    >
                      ✓ Vous serez informé en avant-première du lancement
                    </motion.p>
                  )}
                </form>
              </div>
            </motion.div>

            {/* Section "Pourquoi Octane98 ?" - Cards optimisées mobile */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-12">
              <motion.div
                variants={itemVariants}
                className="bg-neutral-900/70 backdrop-blur-md rounded-xl md:rounded-2xl border border-neutral-800/50 p-5 md:p-8 hover:border-red-600/50 transition-all shadow-lg"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-red-600/20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 mx-auto border border-red-600/30">
                  <Sparkles className="text-red-600 w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-base md:text-xl font-black text-white mb-2 md:mb-3">Expertise Thermique</h3>
                <p className="text-xs md:text-base text-neutral-300 md:text-neutral-400 leading-relaxed">
                  Notre plateforme est dédiée exclusivement aux véhicules thermiques de caractère. Chaque annonce est vérifiée par des passionnés qui connaissent la vraie valeur mécanique.
                </p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="bg-neutral-900/70 backdrop-blur-md rounded-xl md:rounded-2xl border border-neutral-800/50 p-5 md:p-8 hover:border-red-600/50 transition-all shadow-lg"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-red-600/20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 mx-auto border border-red-600/30">
                  <Shield className="text-red-600 w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-base md:text-xl font-black text-white mb-2 md:mb-3">Transparence Fiscale</h3>
                <p className="text-xs md:text-base text-neutral-300 md:text-neutral-400 leading-relaxed">
                  Calculateur de taxes belge ultra-précis. Connaissez instantanément le coût réel d'immatriculation avant d'acheter. Plus de surprises à la douane.
                </p>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="bg-neutral-900/70 backdrop-blur-md rounded-xl md:rounded-2xl border border-neutral-800/50 p-5 md:p-8 hover:border-red-600/50 transition-all shadow-lg"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-red-600/20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 mx-auto border border-red-600/30">
                  <TrendingUp className="text-red-600 w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-base md:text-xl font-black text-white mb-2 md:mb-3">Passion Puriste</h3>
                <p className="text-xs md:text-base text-neutral-300 md:text-neutral-400 leading-relaxed">
                  Rejoignez une communauté qui respire la mécanique. Partagez les sonorités de votre moteur, l'histoire de votre véhicule, et connectez-vous avec d'autres puristes.
                </p>
              </motion.div>
            </motion.div>

            {/* Section Calculateur Fiscal - Lazy loaded au scroll */}
            <motion.div
              ref={calculatorRef}
              variants={itemVariants}
              className="mb-8 md:mb-16"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl mb-4 shadow-2xl shadow-red-600/40">
                  <Calculator size={32} className="text-white" />
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-white mb-4 tracking-tight">
                  Calculateur Fiscal Belge 2025
                </h2>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                  Découvrez le coût réel d&apos;immatriculation de votre véhicule en Belgique.
                  <strong className="text-red-500"> Précis et gratuit.</strong>
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  💡 Valeurs d&apos;exemple pré-remplies - Modifiez-les selon votre véhicule
                </p>
              </div>


              {/* Affichage du résultat du calculateur */}
              {showCalculator && (
                <div className="max-w-4xl mx-auto">
                  <Suspense fallback={
                    <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10 flex items-center justify-center min-h-[400px]">
                      <div className="text-center">
                        <Loader2 className="animate-spin text-red-600 mx-auto mb-4" size={48} />
                        <p className="text-slate-400">Calcul en cours...</p>
                      </div>
                    </div>
                  }>
                    <TaxCalculator
                      puissanceKw={calculatorInputs.puissanceKw}
                      puissanceCv={Math.round(calculatorInputs.puissanceKw * 1.3596)}
                      cvFiscaux={calculatorInputs.cvFiscaux}
                      co2={calculatorInputs.co2}
                      carburant={calculatorInputs.carburant}
                      annee={calculatorInputs.annee}
                      defaultRegion="wallonie"
                    />
                  </Suspense>

                  {/* CTA après calcul */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-center"
                  >
                    <div className="bg-gradient-to-r from-red-900/20 to-red-800/20 rounded-3xl p-6 border border-red-500/30 max-w-2xl mx-auto">
                      <h3 className="text-xl font-black text-white mb-3">
                        🚀 Devenez Membre Fondateur
                      </h3>
                      <p className="text-slate-300 mb-4">
                        Inscrivez-vous maintenant pour valider votre statut de Membre Fondateur
                        et obtenir votre accès prioritaire au lancement d&apos;Octane98.
                      </p>
                      <button
                        onClick={() => {
                          // Scroll vers le formulaire d'inscription
                          document.querySelector('input[type="email"]')?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                          });
                        }}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-6 py-3 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-red-900/50"
                      >
                        <ArrowRight size={20} />
                        M&apos;inscrire maintenant
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>

            {/* Footer */}
            <motion.div variants={itemVariants} className="text-neutral-400 text-xs md:text-sm mt-4 md:mt-8 pb-4 md:pb-0">
              <p>Bientôt disponible en Belgique 🇧🇪</p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

