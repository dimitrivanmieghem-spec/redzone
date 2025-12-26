"use client";

import { ArrowLeft, Bell, TrendingUp, Building2, Shield, Sparkles, Gauge, Calculator } from "lucide-react";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-neutral-950 flex">
      {/* Colonne de gauche - Marketing (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Image de fond avec overlay sombre */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1920&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/95 via-neutral-900/90 to-neutral-800/95" />
        </div>

        {/* Contenu marketing */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo et retour */}
          <div>
            <Link
              href="/"
              className="flex items-center gap-3 mb-6 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:shadow-red-900/50 transition-all group-hover:scale-105">
                <Gauge className="text-white" size={24} />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                Octane<span className="text-red-600">98</span>
              </span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors font-medium"
            >
              <ArrowLeft size={20} />
              <span>Retour à l&apos;accueil</span>
            </Link>
          </div>

          {/* Contenu principal */}
          <div className="max-w-lg space-y-8">
            {/* Badge Membre Fondateur */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400/20 via-yellow-500/20 to-yellow-600/20 border border-yellow-400/40 rounded-full backdrop-blur-sm">
                <Sparkles className="text-yellow-400" size={18} />
                <span className="text-yellow-400 text-sm font-black uppercase tracking-wider">
                  Offre Limitée
                </span>
              </div>
              <h1 className="text-5xl font-black tracking-tight leading-tight">
                Devenez{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600">
                  Membre Fondateur
                </span>
              </h1>
              <p className="text-xl text-neutral-300 leading-relaxed">
                Rejoignez les <span className="font-bold text-yellow-400">500 premiers puristes</span> et profitez d'avantages exclusifs.
              </p>
              <p className="text-lg text-neutral-400">
                Calculateur de taxes illimité • Historique de cote exclusif • Alertes en temps réel • Badge à vie
              </p>
            </div>

            {/* Séparateur */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Avantages Membre Fondateur */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-600/20 border border-red-500/40 rounded-xl flex items-center justify-center mt-0.5">
                  <Calculator className="text-red-400" size={20} />
                </div>
                <div>
                  <p className="text-white font-bold text-base">Calculateur de Taxes Illimité</p>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Calculez les taxes d'immatriculation belges pour tous vos véhicules, sans limite.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-600/20 border border-red-500/40 rounded-xl flex items-center justify-center mt-0.5">
                  <TrendingUp className="text-red-400" size={20} />
                </div>
                <div>
                  <p className="text-white font-bold text-base">Historique de Cote Exclusif</p>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Accédez aux données historiques de cote de vos modèles favoris.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-600/20 border border-red-500/40 rounded-xl flex items-center justify-center mt-0.5">
                  <Bell className="text-red-400" size={20} />
                </div>
                <div>
                  <p className="text-white font-bold text-base">Alertes en Temps Réel</p>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Soyez alerté en premier des nouvelles annonces correspondant à vos critères.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer marketing */}
          <div className="text-sm text-neutral-400">
            <p>🔒 Vos données sont protégées conformément au RGPD</p>
          </div>
        </div>
      </div>

      {/* Colonne de droite - Contenu (Desktop) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 bg-neutral-950">
        <div className="w-full max-w-md">
          {/* Logo et retour (Mobile) */}
          <div className="lg:hidden mb-8">
            <Link
              href="/"
              className="flex items-center gap-3 mb-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/30">
                <Gauge className="text-white" size={20} />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Octane<span className="text-red-600">98</span>
              </span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors font-medium"
            >
              <ArrowLeft size={20} />
              <span>Retour à l&apos;accueil</span>
            </Link>
          </div>

          {/* Contenu marketing (Mobile - en premier) */}
          <div className="lg:hidden mb-8 space-y-6">
            {/* Badge Membre Fondateur */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400/20 via-yellow-500/20 to-yellow-600/20 border border-yellow-400/40 rounded-full">
                <Sparkles className="text-yellow-400" size={16} />
                <span className="text-yellow-400 text-xs font-black uppercase tracking-wider">
                  Offre Limitée
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Devenez{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600">
                  Membre Fondateur
                </span>
              </h1>
              <p className="text-neutral-400">
                Rejoignez les <span className="font-bold text-yellow-400">500 premiers puristes</span>.
              </p>
              <p className="text-sm text-neutral-500">
                Taxes illimité • Cote exclusif • Alertes temps réel • Badge à vie
              </p>
            </div>

            {/* Avantages condensés (Mobile) */}
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Calculator className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-white font-medium text-xs">Calculateur Taxes</p>
                  <p className="text-neutral-500 text-xs">Illimité</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-white font-medium text-xs">Historique Cote</p>
                  <p className="text-neutral-500 text-xs">Exclusif</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Bell className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-white font-medium text-xs">Alertes Temps Réel</p>
                  <p className="text-neutral-500 text-xs">Notifications</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu enfants (formulaire) */}
          {children}
        </div>
      </div>
    </main>
  );
}

