"use client";

import { ArrowLeft, Bell, TrendingUp, Building2, Shield, Sparkles } from "lucide-react";
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 via-yellow-600/20 to-yellow-500/20 border border-yellow-500/40 rounded-full backdrop-blur-sm">
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
                Réservé aux <span className="font-bold text-yellow-400">500 premiers inscrits</span>.
              </p>
              <p className="text-lg text-neutral-400">
                Obtenez le badge exclusif à vie et un accès prioritaire aux futures fonctionnalités Pro.
              </p>
            </div>

            {/* Séparateur */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Avantages */}
            <div className="space-y-8">
              {/* Pour les Passionnés */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-red-600 rounded-full" />
                  Pour les Passionnés
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-red-600/20 border border-red-500/40 rounded-full flex items-center justify-center mt-0.5">
                      <Bell className="text-red-400" size={14} />
                    </div>
                    <div>
                      <p className="text-white font-medium">La Sentinelle</p>
                      <p className="text-neutral-400 text-sm">
                        Soyez alerté avant tout le monde des nouvelles annonces.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-red-600/20 border border-red-500/40 rounded-full flex items-center justify-center mt-0.5">
                      <TrendingUp className="text-red-400" size={14} />
                    </div>
                    <div>
                      <p className="text-white font-medium">Garage de Rêve</p>
                      <p className="text-neutral-400 text-sm">
                        Suivez l&apos;évolution des prix de vos favoris.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Pour les Pros */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-600 rounded-full" />
                  Pour les Pros
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600/20 border border-blue-500/40 rounded-full flex items-center justify-center mt-0.5">
                      <Building2 className="text-blue-400" size={14} />
                    </div>
                    <div>
                      <p className="text-white font-medium">Showroom Digital</p>
                      <p className="text-neutral-400 text-sm">
                        Votre page vitrine dédiée{" "}
                        <span className="text-yellow-400">(Bientôt disponible)</span>.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600/20 border border-blue-500/40 rounded-full flex items-center justify-center mt-0.5">
                      <Shield className="text-blue-400" size={14} />
                    </div>
                    <div>
                      <p className="text-white font-medium">Badge Vérifié</p>
                      <p className="text-neutral-400 text-sm">
                        Rassurez vos acheteurs avec le statut Pro.
                      </p>
                    </div>
                  </li>
                </ul>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 via-yellow-600/20 to-yellow-500/20 border border-yellow-500/40 rounded-full">
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
                Réservé aux <span className="font-bold text-yellow-400">500 premiers inscrits</span>.
                Obtenez le badge exclusif à vie.
              </p>
            </div>

            {/* Avantages condensés (Mobile) */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Bell className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-white font-medium text-xs">La Sentinelle</p>
                  <p className="text-neutral-500 text-xs">Alertes exclusives</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-white font-medium text-xs">Garage de Rêve</p>
                  <p className="text-neutral-500 text-xs">Suivi des prix</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="text-blue-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-white font-medium text-xs">Showroom Pro</p>
                  <p className="text-neutral-500 text-xs">Bientôt disponible</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="text-blue-400 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="text-white font-medium text-xs">Badge Vérifié</p>
                  <p className="text-neutral-500 text-xs">Statut Pro</p>
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

