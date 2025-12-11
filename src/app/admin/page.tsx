"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Users,
  Car,
  TrendingUp,
  AlertTriangle,
  Power,
  PowerOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { getAdminStats, getSiteSettings, updateSiteSettings } from "@/lib/supabase/settings";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<{
    total_vehicles: number;
    pending_vehicles: number;
    active_vehicles: number;
    rejected_vehicles: number;
    total_users: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);

  // Charger les stats et le mode maintenance
  useEffect(() => {
    const loadData = async () => {
      if (user && user.role === "admin") {
        try {
          setStatsLoading(true);
          
          // Charger les stats
          const adminStats = await getAdminStats();
          if (adminStats) {
            setStats(adminStats);
          }

          // Charger le mode maintenance
          const settings = await getSiteSettings();
          if (settings) {
            setMaintenanceMode(settings.maintenance_mode || false);
          }
        } catch (error) {
          console.error("Erreur chargement données:", error);
          showToast("Erreur lors du chargement des données", "error");
        } finally {
          setStatsLoading(false);
        }
      }
    };

    loadData();
  }, [user, showToast]);

  const handleToggleMaintenance = async () => {
    if (!confirm("Êtes-vous sûr de vouloir activer/désactiver le mode maintenance ?")) {
      return;
    }

    try {
      setIsTogglingMaintenance(true);
      await updateSiteSettings({
        maintenance_mode: !maintenanceMode,
      });
      setMaintenanceMode(!maintenanceMode);
      showToast(
        maintenanceMode
          ? "Mode maintenance désactivé ✓"
          : "Mode maintenance activé ✓",
        "success"
      );
    } catch (error) {
      console.error("Erreur toggle maintenance:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Erreur lors du changement du mode maintenance",
        "error"
      );
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
          <AlertCircle className="text-red-600" size={28} />
          Tableau de Bord
        </h2>
      </header>

      <div className="p-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Annonces en attente */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                <AlertCircle className="text-amber-600" size={24} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">
              Annonces en attente
            </h3>
            <p className="text-3xl font-black text-slate-900">
              {statsLoading ? "..." : stats?.pending_vehicles ?? 0}
            </p>
          </div>

          {/* Utilisateurs inscrits */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">
              Utilisateurs inscrits
            </h3>
            <p className="text-3xl font-black text-slate-900">
              {statsLoading ? "..." : stats?.total_users ?? 0}
            </p>
          </div>

          {/* Annonces actives */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">
              Annonces actives
            </h3>
            <p className="text-3xl font-black text-slate-900">
              {statsLoading ? "..." : stats?.active_vehicles ?? 0}
            </p>
          </div>

          {/* Total annonces */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Car className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">
              Total annonces
            </h3>
            <p className="text-3xl font-black text-slate-900">
              {statsLoading ? "..." : stats?.total_vehicles ?? 0}
            </p>
          </div>
        </div>

        {/* Bouton Mode Maintenance */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  maintenanceMode
                    ? "bg-red-100"
                    : "bg-green-100"
                }`}
              >
                {maintenanceMode ? (
                  <AlertTriangle className="text-red-600" size={32} />
                ) : (
                  <Power className="text-green-600" size={32} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-1">
                  Mode Maintenance
                </h3>
                <p className="text-sm text-slate-600">
                  {maintenanceMode
                    ? "Le site est actuellement en mode maintenance"
                    : "Le site est actuellement accessible"}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleMaintenance}
              disabled={isTogglingMaintenance}
              className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${
                maintenanceMode
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-red-600 hover:bg-red-700 text-white"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isTogglingMaintenance ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Traitement...
                </>
              ) : maintenanceMode ? (
                <>
                  <PowerOff size={20} />
                  Désactiver le Mode Maintenance
                </>
              ) : (
                <>
                  <AlertTriangle size={20} />
                  Activer le Mode Maintenance
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

