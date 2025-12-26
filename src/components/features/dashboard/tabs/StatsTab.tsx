"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Car, 
  Heart, 
  Eye, 
  Clock, 
  XCircle,
  Loader2,
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProStats, type ProStats } from "@/lib/supabase/stats";

interface StatsTabProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: "red" | "blue" | "green" | "orange" | "purple";
  isLoading?: boolean;
}

function StatCard({ title, value, icon: Icon, color, isLoading }: StatCardProps) {
  const colorClasses = {
    red: {
      bg: "bg-red-600/20",
      text: "text-red-400",
      border: "border-red-600/30",
      iconBg: "bg-red-600/20",
    },
    blue: {
      bg: "bg-blue-600/20",
      text: "text-blue-400",
      border: "border-blue-600/30",
      iconBg: "bg-blue-600/20",
    },
    green: {
      bg: "bg-green-600/20",
      text: "text-green-400",
      border: "border-green-600/30",
      iconBg: "bg-green-600/20",
    },
    orange: {
      bg: "bg-orange-600/20",
      text: "text-orange-400",
      border: "border-orange-600/30",
      iconBg: "bg-orange-600/20",
    },
    purple: {
      bg: "bg-purple-600/20",
      text: "text-purple-400",
      border: "border-purple-600/30",
      iconBg: "bg-purple-600/20",
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`bg-neutral-900 rounded-2xl border ${colors.border} p-6 hover:border-opacity-50 transition-all`}>
      <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center mb-4 border ${colors.border}`}>
        <Icon className={colors.text} size={24} />
      </div>
      <h3 className="text-sm font-medium text-neutral-400 mb-1">{title}</h3>
      <p className={`text-3xl font-black ${colors.text}`}>
        {isLoading ? (
          <Loader2 className="animate-spin inline" size={24} />
        ) : (
          value
        )}
      </p>
    </div>
  );
}

export default function StatsTab({ user }: StatsTabProps) {
  const { user: authUser } = useAuth();
  const [stats, setStats] = useState<ProStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (!authUser?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const proStats = await getProStats(authUser.id);
        setStats(proStats);
      } catch (err) {
        console.error("Erreur chargement stats:", err);
        setError("Erreur lors du chargement des statistiques");
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [authUser?.id]);

  // Si l'utilisateur n'est pas un pro, afficher un message
  if (user.role !== "pro") {
    return (
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
          Statistiques
        </h1>
        <p className="text-neutral-400 mb-8">
          Analysez les performances de vos annonces
        </p>
        <div className="bg-neutral-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-12 text-center">
          <BarChart3 size={48} className="text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-400 font-medium mb-2">
            Statistiques réservées aux professionnels
          </p>
          <p className="text-neutral-500 text-sm">
            Les statistiques détaillées sont disponibles uniquement pour les comptes professionnels.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
          Statistiques
        </h1>
        <p className="text-neutral-400">
          Analysez les performances de vos annonces
        </p>
      </div>

      {error && (
        <div className="bg-red-600/20 border border-red-600/30 rounded-2xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Annonces Actives"
          value={stats?.activeVehicles ?? 0}
          icon={Car}
          color="green"
          isLoading={isLoading}
        />
        <StatCard
          title="Total Favoris"
          value={stats?.totalFavorites ?? 0}
          icon={Heart}
          color="red"
          isLoading={isLoading}
        />
        <StatCard
          title="Vues Totales"
          value={stats?.totalViews ?? 0}
          icon={Eye}
          color="blue"
          isLoading={isLoading}
        />
        <StatCard
          title="En Attente"
          value={stats?.pendingVehicles ?? 0}
          icon={Clock}
          color="orange"
          isLoading={isLoading}
        />
        <StatCard
          title="Refusées"
          value={stats?.rejectedVehicles ?? 0}
          icon={XCircle}
          color="purple"
          isLoading={isLoading}
        />
      </div>

      {/* Section insights */}
      {stats && !isLoading && (
        <div className="bg-gradient-to-br from-neutral-900/50 to-neutral-800/50 backdrop-blur-sm rounded-3xl border border-white/10 p-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-red-400" size={24} />
            <h2 className="text-2xl font-black text-white">Insights</h2>
          </div>

          <div className="space-y-4">
            {/* Taux de conversion favoris */}
            {stats.activeVehicles > 0 && stats.totalFavorites > 0 && (
              <div className="bg-neutral-900/50 rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-400 text-sm font-medium">
                    Taux de conversion (favoris/annonce)
                  </span>
                  <span className="text-white font-bold">
                    {(stats.totalFavorites / stats.activeVehicles).toFixed(1)}
                  </span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-600 to-red-700 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((stats.totalFavorites / stats.activeVehicles) * 10, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Message si aucune annonce active */}
            {stats.activeVehicles === 0 && (
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-300 text-sm">
                  💡 <strong>Astuce :</strong> Publiez votre première annonce pour commencer à recevoir des statistiques !
                </p>
              </div>
            )}

            {/* Message si des annonces sont en attente */}
            {stats.pendingVehicles > 0 && (
              <div className="bg-orange-600/10 border border-orange-500/30 rounded-xl p-4">
                <p className="text-orange-300 text-sm">
                  ⏳ {stats.pendingVehicles} annonce{stats.pendingVehicles > 1 ? "s" : ""} en attente de modération.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
