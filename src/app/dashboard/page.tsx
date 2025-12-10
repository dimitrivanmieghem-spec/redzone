"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Car, Heart, Plus, TrendingUp, ArrowRight, Building2, BarChart3, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useVehicules } from "@/hooks/useVehicules";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { favorites } = useFavorites();
  const { vehicules, isLoading: vehiculesLoading } = useVehicules({});
  const router = useRouter();

  // Rediriger vers login si non connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Mes annonces (filtrées par user_id)
  const mesAnnonces = useMemo(() => {
    if (!user) return [];
    return vehicules.filter(v => v.user_id === user.id);
  }, [vehicules, user]);

  // Favoris actifs
  const favoriteVehicules = useMemo(() => {
    return vehicules.filter((v) =>
      favorites.includes(v.id) && v.status === "active"
    );
  }, [vehicules, favorites]);

  // Afficher un loader pendant la vérification
  if (authLoading || vehiculesLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-900">Chargement...</p>
        </div>
      </main>
    );
  }

  // Si pas d'utilisateur, ne rien afficher (redirection en cours)
  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50/20 via-white to-red-50/20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header avec avatar */}
        <div className="mb-12 flex items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-600/30">
            <LayoutDashboard className="text-white" size={40} />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Bonjour {user.name} 👋
            </h1>
            <p className="text-slate-700 text-lg mt-1">
              Gérez vos annonces et favoris en un clin d&apos;œil
            </p>
          </div>
        </div>

        {/* Statistiques - CARTES ÉPURÉES (Blanc sur blanc avec ombre) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Mes Annonces / Mon Inventaire */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200/50 hover:shadow-3xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center">
                <Car size={32} className="text-red-600" />
              </div>
              <span className="text-5xl font-black text-slate-900 tracking-tight">{mesAnnonces.length}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">
              {user.role === "pro" ? "Mon Inventaire" : "Mes Annonces"}
            </h3>
            <p className="text-xs text-slate-600">
              {mesAnnonces.length === 0 
                ? user.role === "pro" ? "Aucun véhicule en stock" : "Aucune annonce active"
                : `${mesAnnonces.length} véhicule${mesAnnonces.length > 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Mes Favoris */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200/50 hover:shadow-3xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-200 rounded-2xl flex items-center justify-center">
                <Heart size={32} className="text-red-600 fill-red-600" />
              </div>
              <span className="text-5xl font-black text-slate-900 tracking-tight">
                {favorites.length}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">Mes Favoris</h3>
            <p className="text-xs text-slate-600">
              {favorites.length === 0
                ? "Aucun favori"
                : `${favorites.length} véhicule${favorites.length > 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Vues */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200/50 hover:shadow-3xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                <TrendingUp size={32} className="text-green-600" />
              </div>
              <span className="text-5xl font-black text-slate-900 tracking-tight">0</span>
            </div>
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-1">Vues totales</h3>
            <p className="text-xs text-slate-600">Sur vos annonces</p>
          </div>
        </div>

        {/* Actions rapides - CARTES INTERACTIVES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link
            href="/sell"
            className="group relative overflow-hidden bg-gradient-to-br from-red-600 to-red-700 p-8 rounded-3xl shadow-2xl shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 transition-all duration-300"
          >
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
                <Plus size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                {user.role === "pro" ? "Ajouter au stock" : "Publier une annonce"}
              </h3>
              <p className="text-red-100 mb-4">
                {user.role === "pro" ? "Ajoutez un véhicule à votre inventaire" : "Vendez votre véhicule en 2 minutes"}
              </p>
              <ArrowRight className="text-white" size={24} />
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          </Link>

          {user.role === "pro" ? (
            <Link
              href="/dashboard/garage"
              className="group relative overflow-hidden bg-white p-8 rounded-3xl shadow-2xl shadow-slate-200/50 hover:shadow-3xl hover:scale-105 transition-all duration-300"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6">
                  <Building2 size={32} className="text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                  Mon Garage
                </h3>
                <p className="text-slate-700 mb-4">
                  Logo et informations de contact
                </p>
                <ArrowRight className="text-red-600" size={24} />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16" />
            </Link>
          ) : (
            <Link
              href="/search"
              className="group relative overflow-hidden bg-white p-8 rounded-3xl shadow-2xl shadow-slate-200/50 hover:shadow-3xl hover:scale-105 transition-all duration-300"
            >
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-6">
                  <Car size={32} className="text-slate-700" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                  Rechercher un véhicule
                </h3>
                <p className="text-slate-700 mb-4">
                  Parcourez notre catalogue
                </p>
                <ArrowRight className="text-red-600" size={24} />
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16" />
            </Link>
          )}
        </div>

        {/* Section Professionnel - Outils supplémentaires */}
        {user.role === "pro" && (
          <div className="mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight flex items-center gap-3">
              <Building2 size={32} className="text-red-600" />
              Outils Professionnels
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/dashboard/garage"
                className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200/50 hover:shadow-3xl hover:scale-105 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mb-6">
                  <Building2 size={32} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                  Mon Garage (Branding)
                </h3>
                <p className="text-slate-600 mb-4">
                  Personnalisez votre logo et vos informations de contact
                </p>
                <ArrowRight className="text-red-600" size={20} />
              </Link>

              <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-slate-200/50 border-2 border-dashed border-slate-300">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mb-6">
                  <BarChart3 size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                  Statistiques Rapides
                </h3>
                <p className="text-slate-600 mb-4">
                  Bientôt disponible : Suivez vos performances et vos ventes
                </p>
                <span className="text-xs text-slate-500 font-medium">En développement</span>
              </div>
            </div>
          </div>
        )}

        {/* Mes Favoris - CARTES HORIZONTALES (au lieu de tableau) */}
        {favorites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                <Heart size={32} className="text-red-500 fill-red-500" />
                Mes Favoris
              </h2>
              <Link
                href="/favorites"
                className="text-red-600 hover:text-red-700 font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all"
              >
                Voir tout
                <ArrowRight size={18} />
              </Link>
            </div>
            <div className="space-y-4">
              {favoriteVehicules.slice(0, 3).map((vehicule) => (
                <Link
                  key={vehicule.id}
                  href={`/cars/${vehicule.id}`}
                  className="block bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-6">
                    {/* Photo */}
                    <div className="w-32 h-24 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 relative">
                      <Image
                        src={vehicule.image}
                        alt={`${vehicule.marque} ${vehicule.modele}`}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                        {vehicule.marque} {vehicule.modele}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-700">
                        <span>{vehicule.annee}</span>
                        <span>•</span>
                        <span>{vehicule.km.toLocaleString("fr-BE")} km</span>
                        <span>•</span>
                        <span className="capitalize">{vehicule.carburant}</span>
                      </div>
                    </div>

                    {/* Prix */}
                    <div className="text-right">
                      <p className="text-3xl font-black text-red-600 tracking-tight">
                        {vehicule.prix.toLocaleString("fr-BE")} €
                      </p>
                    </div>

                    {/* Icône flèche */}
                    <ArrowRight className="text-red-600 group-hover:translate-x-2 transition-transform" size={24} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Message si pas de favoris */}
        {favorites.length === 0 && (
          <div className="bg-white rounded-3xl p-16 text-center shadow-2xl shadow-slate-200/50">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={40} className="text-slate-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
              Aucun favori pour le moment
            </h3>
            <p className="text-slate-700 mb-8 text-lg">
              Parcourez nos annonces et ajoutez vos coups de cœur !
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-full transition-all shadow-xl hover:scale-105"
            >
              Découvrir les annonces
              <ArrowRight size={20} />
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
