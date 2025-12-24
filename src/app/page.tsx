"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Car, Shield, Users, Zap, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import CarCard from "@/components/features/vehicles/car-card";
import { useVehicules } from "@/hooks/useVehicules";

export default function Home() {
  const router = useRouter();

  // Récupérer les annonces actives depuis Supabase
  const { vehicules, isLoading } = useVehicules({
    status: "active",
    type: "car",
  });

  // 9 dernières annonces (les plus récentes) pour la vitrine
  const dernieresAnnonces = useMemo(() => {
    if (!vehicules || !Array.isArray(vehicules)) return [];
    return [...vehicules]
      .filter((v) => v && v.id && v.created_at)
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 9);
  }, [vehicules]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* HERO SECTION */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Fond avec dégradé noir/rouge profond */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-red-950/20 to-neutral-950">
          {/* Pattern subtil */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_70%)]" />
        </div>

        {/* Overlay pour améliorer la lisibilité du texte */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Contenu central */}
        <div className="relative z-10 text-center px-4 max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 tracking-wide leading-tight">
            L&apos;Exclusivité{" "}
            <span className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 bg-clip-text text-transparent">
              n&apos;a pas de batterie
            </span>
            .
          </h1>
          <p className="text-xl md:text-2xl lg:text-3xl text-neutral-300 mb-16 max-w-4xl mx-auto font-light leading-relaxed tracking-wide">
            Le sanctuaire digital dédié aux puristes de la mécanique thermique. De la GTI à la Supercar, entrez dans le cercle RedZone.
          </p>

          {/* Boutons CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/search"
              className="group relative px-10 py-5 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-full transition-all duration-300 shadow-2xl shadow-red-600/50 hover:shadow-red-600/70 hover:scale-105 flex items-center gap-3 overflow-hidden"
            >
              <span className="relative z-10 tracking-wide">Explorer le Showroom</span>
              <ArrowRight
                size={20}
                className="relative z-10 group-hover:translate-x-1 transition-transform"
              />
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </Link>

            <Link
              href="/sell"
              className="group px-10 py-5 bg-transparent border-2 border-white/20 hover:border-white text-white font-semibold text-lg rounded-full transition-all duration-300 hover:bg-white/5 hover:scale-105 flex items-center gap-3 backdrop-blur-sm tracking-wide"
            >
              <span>Confier mon véhicule</span>
              <Car
                size={20}
                className="group-hover:rotate-12 transition-transform duration-300"
              />
            </Link>
          </div>
        </div>

        {/* Lignes décoratives en bas */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent" />
      </section>

      {/* SECTION "DERNIÈRES ENTREES AU GARAGE" */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-wide">
            Dernières Entrées au{" "}
            <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
              Garage
            </span>
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="bg-neutral-900 rounded-3xl overflow-hidden animate-pulse"
              >
                <div className="h-64 bg-neutral-800" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-neutral-800 rounded w-3/4" />
                  <div className="h-4 bg-neutral-800 rounded w-1/2" />
                  <div className="h-4 bg-neutral-800 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : dernieresAnnonces.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <Car size={80} className="mx-auto mb-6 text-neutral-700 opacity-50" />
              <h2 className="text-3xl font-black mb-4 text-neutral-300">
                Soyez le premier à publier !
              </h2>
              <p className="text-neutral-400 text-lg mb-8">
                Aucune annonce disponible pour le moment. Partagez votre passion automobile et soyez le premier à publier une annonce sur RedZone.
              </p>
              <Link
                href="/sell"
                className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full transition-all tracking-wide shadow-xl hover:shadow-md hover:scale-105"
              >
                <Plus size={20} />
                Publier ma première annonce
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
              {dernieresAnnonces.map((vehicule, index) => (
                <div
                  key={vehicule.id}
                  className="group transform transition-all duration-300 hover:scale-[1.02]"
                >
                  <CarCard car={vehicule} priority={index < 3} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Lien vers toutes les annonces */}
        {dernieresAnnonces.length > 0 && (
          <div className="text-center mt-16">
            <Link
              href="/search"
              className="group inline-flex items-center gap-2 text-neutral-400 hover:text-red-500 font-medium transition-colors duration-300 tracking-wide"
            >
              Accéder au Showroom complet
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        )}
      </section>

      {/* SECTION "LA CONFIANCE" */}
      <section className="py-28 px-4 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-wide">
              La{" "}
              <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                Confiance
              </span>
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Bloc 1: 100% Mécanique Noble */}
            <div className="group relative bg-gradient-to-br from-neutral-900 to-neutral-800 p-10 rounded-3xl border border-neutral-800 hover:border-red-600/50 transition-all duration-500 hover:shadow-2xl hover:shadow-red-600/20 hover:-translate-y-2">
              {/* Icône avec effet de brillance */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-600/20 rounded-full blur-2xl group-hover:bg-red-600/40 transition-all duration-500" />
                <div className="relative bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-2xl w-16 h-16 flex items-center justify-center">
                  <Zap
                    size={32}
                    className="text-white group-hover:rotate-12 transition-transform duration-300"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-black mb-5 text-white tracking-wide">
                100% Mécanique Noble
              </h3>
              <p className="text-neutral-300 leading-relaxed text-lg font-light">
                Aucun compromis. Ici, on parle cylindres, échappement et émotion. Zéro électrique.
              </p>
              {/* Ligne décorative au survol */}
              <div className="absolute bottom-0 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Bloc 2: Transparence Totale */}
            <div className="group relative bg-gradient-to-br from-neutral-900 to-neutral-800 p-10 rounded-3xl border border-neutral-800 hover:border-red-600/50 transition-all duration-500 hover:shadow-2xl hover:shadow-red-600/20 hover:-translate-y-2">
              {/* Icône avec effet de brillance */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-600/20 rounded-full blur-2xl group-hover:bg-red-600/40 transition-all duration-500" />
                <div className="relative bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-2xl w-16 h-16 flex items-center justify-center">
                  <Shield
                    size={32}
                    className="text-white group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-black mb-5 text-white tracking-wide">
                Transparence Totale
              </h3>
              <p className="text-neutral-300 leading-relaxed text-lg font-light">
                Chaque annonce est vérifiée. Vendeurs qualifiés, historiques limpides. Achetez en confiance.
              </p>
              {/* Ligne décorative au survol */}
              <div className="absolute bottom-0 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Bloc 3: Entre Gentlemen Drivers */}
            <div className="group relative bg-gradient-to-br from-neutral-900 to-neutral-800 p-10 rounded-3xl border border-neutral-800 hover:border-red-600/50 transition-all duration-500 hover:shadow-2xl hover:shadow-red-600/20 hover:-translate-y-2">
              {/* Icône avec effet de brillance */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-red-600/20 rounded-full blur-2xl group-hover:bg-red-600/40 transition-all duration-500" />
                <div className="relative bg-gradient-to-br from-red-600 to-red-700 p-4 rounded-2xl w-16 h-16 flex items-center justify-center">
                  <Users
                    size={32}
                    className="text-white group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-black mb-5 text-white tracking-wide">
                Entre Gentlemen Drivers
              </h3>
              <p className="text-neutral-300 leading-relaxed text-lg font-light">
                Une plateforme conçue par des passionnés, pour des passionnés qui parlent le même langage.
              </p>
              {/* Ligne décorative au survol */}
              <div className="absolute bottom-0 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
