"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  FileCheck,
  Users,
  Settings,
  Car,
  MessageSquare,
  FileText,
  BookOpen,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Ban,
  Trash2,
  Calendar,
  Gauge,
  Fuel,
  Shield,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Power,
  PowerOff,
  AlertTriangle,
  LogOut,
  Mail,
  Plus,
  Save,
  Eye,
  EyeOff,
  Clock,
  Send,
  Edit,
  BarChart3,
  Filter,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { useBanSimulation } from "@/contexts/BanSimulationContext";
import { approveVehicule, rejectVehicule } from "@/lib/supabase/server-actions/vehicules";
import { getAdminStats, getSiteSettings, type SiteSettings } from "@/lib/supabase/settings";
import { updateSiteSettings } from "@/lib/supabase/server-actions/settings";
import { Vehicule } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { logInfo, logError } from "@/lib/supabase/logs";
import { getAllUsers, getUserWithVehicles, getUserVehicles, type UserProfile, type UserWithVehicles } from "@/lib/supabase/users";
import { banUser, unbanUser, deleteUser } from "@/lib/supabase/server-actions/users";
import { getVehiculesPaginated, deleteVehicule, getVehiculeById } from "@/lib/supabase/vehicules";
import { createAdminConversation } from "@/app/actions/admin-messages";
import { getOrCreateConversation } from "@/lib/supabase/conversations";
import { sendMessageWithNotification } from "@/app/actions/messages";
import { getPendingComments, CommentWithAuthor } from "@/lib/supabase/comments";
import { approveComment, rejectComment } from "@/lib/supabase/server-actions/comments";
import { getTickets, resolveTicket, deleteTicket, reassignTicket, closeTicket, setTicketInProgress, addAdminReply } from "@/app/actions/tickets";
import { getAllFAQ, createFAQItem, updateFAQItem, deleteFAQItem, type FAQItem } from "@/lib/supabase/faq";
import { getAllArticles, Article } from "@/lib/supabase/articles";
import { useVehicules } from "@/hooks/useVehicules";

type TabType = "dashboard" | "moderation" | "vehicles" | "users" | "settings" | "support" | "content" | "articles";

export default function AdminPage() {
  const { user, isLoading, logout } = useAuth();
  const { showToast } = useToast();
  const { isSimulatingBan, toggleSimulation } = useBanSimulation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isPending, startTransition] = useTransition();

  // Protection : Rediriger si non admin ni moderator
  useEffect(() => {
    if (!isLoading && (!user || (user.role !== "admin" && user.role !== "moderator"))) {
      showToast("Accès refusé - Administrateur ou Modérateur requis", "error");
      router.push("/");
    }
  }, [user, isLoading, router, showToast]);

  // Lire le paramètre tab depuis l'URL
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["dashboard", "moderation", "vehicles", "users", "settings", "support", "content", "articles"].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  // Rediriger les anciennes routes vers la nouvelle page avec l'onglet approprié
  useEffect(() => {
    const path = window.location.pathname;
    if (path === "/admin/dashboard") {
      router.replace("/admin?tab=dashboard");
    } else if (path === "/admin/moderation") {
      router.replace("/admin?tab=moderation");
    } else if (path === "/admin/cars") {
      router.replace("/admin?tab=vehicles");
    } else if (path === "/admin/users") {
      router.replace("/admin?tab=users");
    } else if (path === "/admin/settings") {
      router.replace("/admin?tab=settings");
    } else if (path === "/admin/support") {
      router.replace("/admin?tab=support");
    } else if (path === "/admin/content") {
      router.replace("/admin?tab=content");
    } else if (path === "/admin/articles") {
      router.replace("/admin?tab=articles");
    }
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-300">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    return null;
  }

  const tabs = [
    { id: "dashboard" as TabType, label: "Tableau de Bord", icon: LayoutDashboard, adminOnly: false },
    { id: "moderation" as TabType, label: "Modération", icon: FileCheck, adminOnly: false },
    { id: "vehicles" as TabType, label: "Gestion Véhicules", icon: Car, adminOnly: false },
    { id: "users" as TabType, label: "Utilisateurs", icon: Users, adminOnly: true },
    { id: "settings" as TabType, label: "Paramètres", icon: Settings, adminOnly: true },
    { id: "support" as TabType, label: "Support", icon: MessageSquare, adminOnly: false },
    { id: "content" as TabType, label: "FAQ", icon: FileText, adminOnly: true },
    { id: "articles" as TabType, label: "Articles", icon: BookOpen, adminOnly: true },
  ].filter(tab => !tab.adminOnly || user.role === "admin");

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex">
      {/* Sidebar Premium */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0a0a0b]/95 backdrop-blur-xl border-r border-white/10">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 group mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:shadow-red-900/50 transition-all duration-300 group-hover:scale-105">
              <Gauge className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Back-Office</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </Link>

          {/* Profil utilisateur */}
          <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-white/10">
            <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden ring-2 ring-red-600/30">
              <Image
                src={user.avatar}
                alt={user.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                priority
                loading="eager"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{user.name}</p>
              <p className="text-slate-400 text-xs truncate">{user.email}</p>
            </div>
            {user.role === "admin" && (
              <span className="px-2 py-1 bg-red-600/20 text-red-400 text-[10px] font-black uppercase rounded-full border border-red-600/30">
                ADMIN
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-red-600/20 text-red-400 border border-red-600/30 shadow-lg shadow-red-900/20"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            );
          })}

          {/* Séparateur */}
          <div className="my-4 border-t border-white/10" />

          {/* Toggle Simulation Ban (Admin uniquement) */}
          {user.role === "admin" && (
            <div className="p-4 bg-slate-900/50 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span className="text-xs font-bold text-slate-300 uppercase">Simuler état banni</span>
                </div>
                <button
                  onClick={toggleSimulation}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                    isSimulatingBan ? "bg-red-600" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                      isSimulatingBan ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isSimulatingBan ? "Mode test actif" : "Mode normal"}
              </p>
            </div>
          )}
        </nav>

        {/* Déconnexion */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 overflow-y-auto">
          {activeTab === "dashboard" && <DashboardTab user={user} />}
          {activeTab === "moderation" && <ModerationTab user={user} />}
          {activeTab === "vehicles" && <VehiclesTab user={user} />}
          {activeTab === "users" && user.role === "admin" && <UsersTab />}
          {activeTab === "settings" && user.role === "admin" && <SettingsTab />}
          {activeTab === "support" && <SupportTab user={user} />}
          {activeTab === "content" && user.role === "admin" && <ContentTab />}
          {activeTab === "articles" && user.role === "admin" && <ArticlesTab />}
        </main>
      </div>
    </div>
  );
}

// Composant Dashboard Tab (avec commentaires et posts)
function DashboardTab({ user }: { user: any }) {
  const { showToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeSubTab, setActiveSubTab] = useState<"pending" | "active" | "rejected" | "comments" | "posts">("pending");
  const [pendingComments, setPendingComments] = useState<CommentWithAuthor[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [pendingPosts, setPendingPosts] = useState<Article[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
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
  const { vehicules: allVehiculesFromHook, isLoading: vehiculesLoading } = useVehicules({});
  const [allVehicules, setAllVehicules] = useState<Vehicule[]>([]);

  useEffect(() => {
    setAllVehicules(allVehiculesFromHook);
  }, [allVehiculesFromHook]);

  useEffect(() => {
    const loadData = async () => {
      if (user && (user.role === "admin" || user.role === "moderator")) {
        try {
          setStatsLoading(true);
          const adminStats = await getAdminStats();
          if (adminStats) setStats(adminStats);
          const settings = await getSiteSettings();
          if (settings) setMaintenanceMode(settings.maintenance_mode || false);
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

  useEffect(() => {
    const loadComments = async () => {
      if (user && (user.role === "admin" || user.role === "moderator") && activeSubTab === "comments") {
        try {
          setIsLoadingComments(true);
          const comments = await getPendingComments();
          setPendingComments(comments);
        } catch (error) {
          console.error("Erreur chargement commentaires:", error);
          showToast("Erreur lors du chargement des commentaires", "error");
        } finally {
          setIsLoadingComments(false);
        }
      }
    };
    loadComments();
  }, [user, activeSubTab, showToast]);

  useEffect(() => {
    const loadPosts = async () => {
      if (user && (user.role === "admin" || user.role === "moderator") && activeSubTab === "posts") {
        try {
          setIsLoadingPosts(true);
          const allArticles = await getAllArticles();
          const pending = allArticles.filter((a) => a.status === "pending");
          setPendingPosts(pending);
        } catch (error) {
          console.error("Erreur chargement posts:", error);
          showToast("Erreur lors du chargement des posts", "error");
        } finally {
          setIsLoadingPosts(false);
        }
      }
    };
    loadPosts();
  }, [user, activeSubTab, showToast]);

  const vehicules = allVehicules.filter((v) => v.status === activeSubTab);
  const pendingCount = stats?.pending_vehicles ?? allVehicules.filter((v) => v.status === "pending").length;
  const activeCount = stats?.active_vehicles ?? allVehicules.filter((v) => v.status === "active").length;
  const rejectedCount = stats?.rejected_vehicles ?? allVehicules.filter((v) => v.status === "rejected").length;

  const handleApprove = async (id: string) => {
    const previousVehicules = [...allVehicules];
    const vehicule = allVehicules.find((v) => v.id === id);
    try {
      setAllVehicules((prev) => prev.filter((v) => v.id !== id));
      await approveVehicule(id);
      await logInfo(`Ad [${id}] validated successfully by Admin [${user.id}]`, user.id, { vehicule_id: id, brand: vehicule?.brand || null, model: vehicule?.model || null, action: "approve" });
      const adminStats = await getAdminStats();
      if (adminStats) setStats(adminStats);
      showToast("Annonce validée ! ✓", "success");
      startTransition(() => { router.refresh(); });
    } catch (error: any) {
      setAllVehicules(previousVehicules);
      await logError(`Validation failed for Ad [${id}] by Admin [${user.id}]: ${error?.message || "Unknown error"}`, user.id, { vehicule_id: id, error_message: error?.message || "Unknown error", action: "approve" });
      showToast(error instanceof Error ? error.message : "Erreur lors de l'approbation", "error");
    }
  };

  const handleReject = async (id: string) => {
    const previousVehicules = [...allVehicules];
    const vehicule = allVehicules.find((v) => v.id === id);
    try {
      setAllVehicules((prev) => prev.filter((v) => v.id !== id));
      await rejectVehicule(id);
      await logInfo(`Ad [${id}] rejected by Admin [${user.id}]`, user.id, { vehicule_id: id, brand: vehicule?.brand || null, model: vehicule?.model || null, action: "reject" });
      const adminStats = await getAdminStats();
      if (adminStats) setStats(adminStats);
      showToast("Annonce rejetée ✓", "success");
      startTransition(() => { router.refresh(); });
    } catch (error: any) {
      setAllVehicules(previousVehicules);
      await logError(`Rejection failed for Ad [${id}] by Admin [${user.id}]: ${error?.message || "Unknown error"}`, user.id, { vehicule_id: id, error_message: error?.message || "Unknown error", action: "reject" });
      showToast(error instanceof Error ? error.message : "Erreur lors du rejet", "error");
    }
  };

  const handleToggleMaintenance = async () => {
    if (!confirm("Êtes-vous sûr de vouloir activer/désactiver le mode maintenance ?")) return;
    try {
      setIsTogglingMaintenance(true);
      await updateSiteSettings({ maintenance_mode: !maintenanceMode });
      setMaintenanceMode(!maintenanceMode);
      showToast(maintenanceMode ? "Mode maintenance désactivé ✓" : "Mode maintenance activé ✓", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Erreur lors du changement du mode maintenance", "error");
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
          <LayoutDashboard className="text-red-600" size={28} />
          Tableau de Bord
        </h2>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle className="text-amber-600" size={24} />
              </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Annonces en attente</h3>
            <p className="text-3xl font-black text-slate-900">{statsLoading ? "..." : stats?.pending_vehicles ?? 0}</p>
            </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <Users className="text-blue-600" size={24} />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Utilisateurs inscrits</h3>
            <p className="text-3xl font-black text-slate-900">{statsLoading ? "..." : stats?.total_users ?? 0}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Annonces actives</h3>
            <p className="text-3xl font-black text-slate-900">{statsLoading ? "..." : stats?.active_vehicles ?? 0}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
              <Car className="text-purple-600" size={24} />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Total annonces</h3>
            <p className="text-3xl font-black text-slate-900">{statsLoading ? "..." : stats?.total_vehicles ?? 0}</p>
          </div>
        </div>

        {/* Graphiques visuels des statistiques */}
        {stats && !statsLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Graphique en barres - Statut des annonces */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <BarChart3 className="text-red-600" size={24} />
                Répartition des annonces
            </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Actives</span>
                    <span className="text-sm font-black text-slate-900">{stats.active_vehicles}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${stats.total_vehicles > 0 ? (stats.active_vehicles / stats.total_vehicles) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">En attente</span>
                    <span className="text-sm font-black text-slate-900">{stats.pending_vehicles}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-amber-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${stats.total_vehicles > 0 ? (stats.pending_vehicles / stats.total_vehicles) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Rejetées</span>
                    <span className="text-sm font-black text-slate-900">{stats.rejected_vehicles}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-red-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${stats.total_vehicles > 0 ? (stats.rejected_vehicles / stats.total_vehicles) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
          </div>

            {/* Graphique circulaire - Ratio annonces/utilisateurs */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <TrendingUp className="text-blue-600" size={24} />
                Vue d'ensemble
              </h3>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  {/* Graphique circulaire simplifié */}
                  <svg className="transform -rotate-90 w-48 h-48">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="currentColor"
                      strokeWidth="16"
                      fill="none"
                      className="text-slate-200"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="currentColor"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${stats.total_vehicles > 0 ? (stats.active_vehicles / stats.total_vehicles) * 502.4 : 0} 502.4`}
                      className="text-green-600 transition-all duration-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-black text-slate-900">{stats.active_vehicles}</p>
                    <p className="text-sm text-slate-600">Annonces actives</p>
                    <p className="text-xs text-slate-500 mt-1">sur {stats.total_vehicles} total</p>
              </div>
            </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-black text-slate-900">{stats.total_users}</p>
                  <p className="text-xs text-slate-600">Utilisateurs</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-black text-slate-900">
                    {stats.total_users > 0 ? Math.round((stats.total_vehicles / stats.total_users) * 10) / 10 : 0}
                  </p>
                  <p className="text-xs text-slate-600">Annonces/user</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglets de modération */}
        <div className="mb-6 flex items-center gap-2 border-b border-slate-200">
          {(["pending", "active", "rejected", "comments", "posts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-6 py-3 font-bold transition-all border-b-2 ${
                activeSubTab === tab
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "pending" ? "À valider" : tab === "active" ? "Actives" : tab === "rejected" ? "Rejetées" : tab === "comments" ? "Commentaires" : "Posts"}
              {tab === "pending" && pendingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">{pendingCount}</span>
              )}
              {tab === "comments" && pendingComments.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">{pendingComments.length}</span>
              )}
              {tab === "posts" && pendingPosts.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">{pendingPosts.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Contenu selon l'onglet */}
        {activeSubTab === "pending" && (
          <div className="space-y-4">
            {vehiculesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-red-600" size={32} />
              </div>
            ) : vehicules.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl">
                <CheckCircle className="text-green-600 mx-auto mb-4" size={48} />
                <p className="text-slate-600 font-medium">Aucune annonce en attente</p>
              </div>
            ) : (
              vehicules.map((vehicule) => (
                <div key={vehicule.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                  <div className="flex items-start gap-6">
                    <div className="w-32 h-24 bg-slate-100 rounded-xl overflow-hidden relative flex-shrink-0">
                      <Image src={vehicule.image} alt={`${vehicule.brand || 'Véhicule'} ${vehicule.model || ''}`} fill sizes="128px" className="object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-black text-slate-900">{vehicule.brand || 'N/A'} {vehicule.model || ''}</h3>
                          <p className="text-sm text-slate-600">{vehicule.year || 'N/A'} • {vehicule.mileage ? vehicule.mileage.toLocaleString("fr-BE") : 'N/A'} km • {vehicule.fuel_type || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{vehicule.price ? vehicule.price.toLocaleString("fr-BE") : 'N/A'} €</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleApprove(vehicule.id)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all">
                          <CheckCircle size={16} />
                          Approuver
                        </button>
                        <button onClick={() => handleReject(vehicule.id)} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all">
                          <XCircle size={16} />
                          Refuser
                        </button>
                        <Link href={`/cars/${vehicule.id}`} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl transition-all">
                          Voir l'annonce
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeSubTab === "comments" && (
          <div>
            {isLoadingComments ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-red-600" size={32} />
              </div>
            ) : pendingComments.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
                <MessageSquare size={48} className="text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-black text-slate-900 mb-2">Aucun commentaire en attente</h3>
                <p className="text-slate-600">Tous les commentaires ont été traités.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingComments.map((comment) => (
                  <div key={comment.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-black text-slate-900">{comment.author?.full_name || comment.author?.email?.split("@")[0] || "Utilisateur"}</span>
                          <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleDateString("fr-BE", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-slate-700 mb-3 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        {comment.article && (
                          <div className="bg-slate-50 rounded-xl p-3 mb-3">
                            <p className="text-xs text-slate-500 mb-1">Article :</p>
                            <Link href={`/tribune/${comment.article.slug}`} target="_blank" className="text-sm font-black text-red-600 hover:text-red-700">
                              {comment.article.title}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          try {
                            await approveComment(comment.id);
                            showToast("Commentaire approuvé !", "success");
                            setPendingComments((prev) => prev.filter((c) => c.id !== comment.id));
                            await logInfo(`Comment ${comment.id} approved by Admin ${user?.id}`, user?.id, { comment_id: comment.id, article_id: comment.article_id, action: "approve" });
                            router.refresh();
                          } catch (error) {
                            console.error("Erreur approbation:", error);
                            showToast("Erreur lors de l'approbation", "error");
                          }
                        }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
                      >
                        <CheckCircle size={20} />
                        Approuver
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await rejectComment(comment.id);
                            showToast("Commentaire rejeté.", "success");
                            setPendingComments((prev) => prev.filter((c) => c.id !== comment.id));
                            await logInfo(`Comment ${comment.id} rejected by Admin ${user?.id}`, user?.id, { comment_id: comment.id, article_id: comment.article_id, action: "reject" });
                            router.refresh();
                          } catch (error) {
                            console.error("Erreur rejet:", error);
                            showToast("Erreur lors du rejet", "error");
                          }
                        }}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
                      >
                        <XCircle size={20} />
                        Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === "posts" && (
          <div>
            {isLoadingPosts ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-red-600" size={32} />
              </div>
            ) : pendingPosts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
                <FileText size={48} className="text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-black text-slate-900 mb-2">Aucun post en attente</h3>
                <p className="text-slate-600">Tous les posts de la Tribune ont été traités.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {post.main_image_url && (
                        <img src={post.main_image_url} alt={post.title} className="w-32 h-32 object-cover rounded-xl" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-black text-slate-900">{post.title}</h3>
                          {post.post_type === "question" && (
                            <span className="bg-red-100 text-red-800 border border-red-200 text-xs font-black px-3 py-1 rounded-full">Question</span>
                          )}
                          {post.post_type === "presentation" && (
                            <span className="bg-red-100 text-red-800 border border-red-200 text-xs font-black px-3 py-1 rounded-full">Présentation</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mb-3">{new Date(post.created_at).toLocaleDateString("fr-BE", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        <p className="text-slate-700 mb-3 leading-relaxed line-clamp-3">{post.content.substring(0, 200)}...</p>
                        <p className="text-xs text-slate-500">Slug: <code className="bg-slate-100 px-2 py-1 rounded">{post.slug}</code></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          try {
                            const supabase = createClient();
                            const { error } = await supabase.from("articles").update({ status: "published" }).eq("id", post.id);
                            if (error) throw error;
                            setPendingPosts((prev) => prev.filter((p) => p.id !== post.id));
                            showToast("Post approuvé !", "success");
                            await logInfo(`Post ${post.id} approved by Admin ${user?.id}`, user?.id, { article_id: post.id, action: "approve" });
                            router.refresh();
                          } catch (error) {
                            console.error("Erreur approbation:", error);
                            showToast("Erreur lors de l'approbation", "error");
                          }
                        }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
                      >
                        <CheckCircle size={20} />
                        Approuver
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const supabase = createClient();
                            const { error } = await supabase.from("articles").update({ status: "rejected" }).eq("id", post.id);
                            if (error) throw error;
                            setPendingPosts((prev) => prev.filter((p) => p.id !== post.id));
                            showToast("Post rejeté.", "success");
                            await logInfo(`Post ${post.id} rejected by Admin ${user?.id}`, user?.id, { article_id: post.id, action: "reject" });
                            router.refresh();
                          } catch (error) {
                            console.error("Erreur rejet:", error);
                            showToast("Erreur lors du rejet", "error");
                          }
                        }}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
                      >
                        <XCircle size={20} />
                        Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {user.role === "admin" && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${maintenanceMode ? "bg-red-100" : "bg-green-100"}`}>
                  {maintenanceMode ? <AlertTriangle className="text-red-600" size={32} /> : <Power className="text-green-600" size={32} />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">Mode Maintenance</h3>
                  <p className="text-sm text-slate-600">{maintenanceMode ? "Le site est actuellement en mode maintenance" : "Le site est actuellement accessible"}</p>
                </div>
              </div>
              <button onClick={handleToggleMaintenance} disabled={isTogglingMaintenance} className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 ${maintenanceMode ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"} disabled:opacity-50 disabled:cursor-not-allowed`}>
                {isTogglingMaintenance ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Traitement...
                  </>
                ) : maintenanceMode ? (
                  <>
                    <PowerOff size={20} />
                    Désactiver
                  </>
                ) : (
                  <>
                    <AlertTriangle size={20} />
                    Activer
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant Moderation Tab (intégration du code existant)
function ModerationTab({ user }: { user: any }) {
  const { showToast } = useToast();
  const router = useRouter();
  const [pendingVehicules, setPendingVehicules] = useState<Vehicule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Actions en masse
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // Filtres avancés
  const [searchFilter, setSearchFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  function parseNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  function formatEuroNorm(normeEuro: string | null | undefined): string {
    if (!normeEuro) return 'N/A';
    return normeEuro.replace(/euro/gi, "Euro ").toUpperCase();
  }

  const loadPendingVehicules = async () => {
    if (user && (user.role === "admin" || user.role === "moderator")) {
      try {
        setIsLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("vehicles")
          .select("id, created_at, owner_id, brand, model, price, year, mileage, fuel_type, transmission, body_type, power_hp, condition, euro_standard, car_pass, image, images, description, status, engine_architecture, admission, zero_a_cent, co2, city, postal_code")
          .in("status", ["pending", "pending_validation", "waiting_email_verification"])
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        const mappedVehicules = ((data || []).map(v => ({
          ...v,
          price: parseNumber(v.price),
          year: parseNumber(v.year),
          mileage: parseNumber(v.mileage),
          power_hp: parseNumber(v.power_hp),
        })) as Vehicule[]) || [];
        setPendingVehicules(mappedVehicules);
      } catch (error) {
        console.error("❌ Erreur chargement annonces en attente:", error);
        showToast("Erreur lors du chargement des annonces", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadPendingVehicules();
  }, [user]);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "moderator")) return;

    const supabase = createClient();
    const channel = supabase
      .channel("vehicles-moderation-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vehicles",
        },
        (payload) => {
          const newStatus = (payload.new as any)?.status;
          const oldStatus = (payload.old as any)?.status;
          const pendingStatuses = ["pending", "pending_validation", "waiting_email_verification"];
          
          const shouldReload = 
            (payload.eventType === "INSERT" && pendingStatuses.includes(newStatus)) ||
            (payload.eventType === "UPDATE" && (
              pendingStatuses.includes(oldStatus) || pendingStatuses.includes(newStatus)
            )) ||
            (payload.eventType === "DELETE" && pendingStatuses.includes(oldStatus));
          
          if (shouldReload) {
            loadPendingVehicules();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleApprove = async (id: string) => {
    if (isProcessing) return;
    const vehicule = pendingVehicules.find((v) => v.id === id);
    if (!vehicule || !user) return;

    try {
      setIsProcessing(id);
      setPendingVehicules((prev) => prev.filter((v) => v.id !== id));
      await approveVehicule(id);
      await logInfo(
        `Ad [${id}] validated successfully by Admin [${user.id}]`,
        user.id,
        { vehicule_id: id, brand: vehicule.brand || null, model: vehicule.model || null, action: "approve" }
      );
      showToast("Annonce approuvée avec succès ✓", "success");
      router.refresh();
    } catch (error) {
      setPendingVehicules((prev) => {
        const updated = [...prev, vehicule];
        return updated.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      console.error("Erreur approbation:", error);
      showToast("Erreur lors de l'approbation", "error");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (isProcessing || !rejectReason.trim()) return;
    const vehicule = pendingVehicules.find((v) => v.id === id);
    if (!vehicule || !user) return;

    try {
      setIsProcessing(id);
      setPendingVehicules((prev) => prev.filter((v) => v.id !== id));
      await rejectVehicule(id, rejectReason);
      await logInfo(
        `Ad [${id}] rejected by Admin [${user.id}]. Reason: ${rejectReason}`,
        user.id,
        { vehicule_id: id, brand: vehicule.brand || null, model: vehicule.model || null, reject_reason: rejectReason, action: "reject" }
      );
      showToast("Annonce refusée", "success");
      setRejectModalOpen(null);
      setRejectReason("");
      setSelectedVehicles((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      router.refresh();
    } catch (error) {
      setPendingVehicules((prev) => {
        const updated = [...prev, vehicule];
        return updated.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
      console.error("Erreur rejet:", error);
      showToast("Erreur lors du rejet", "error");
    } finally {
      setIsProcessing(null);
    }
  };

  // Gestion sélection pour actions en masse
  const handleToggleSelect = (id: string) => {
    setSelectedVehicles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedVehicles.size === filteredVehicules.length) {
      setSelectedVehicles(new Set());
    } else {
      setSelectedVehicles(new Set(filteredVehicules.map(v => v.id)));
    }
  };

  // Actions en masse
  const handleBulkApprove = async () => {
    if (selectedVehicles.size === 0 || isBulkProcessing) return;
    if (!confirm(`Êtes-vous sûr de vouloir approuver ${selectedVehicles.size} annonce(s) ?`)) return;

    setIsBulkProcessing(true);
    const toProcess = Array.from(selectedVehicles);
    let successCount = 0;
    let errorCount = 0;

    for (const id of toProcess) {
      try {
        await approveVehicule(id);
        const vehicule = pendingVehicules.find((v) => v.id === id);
        await logInfo(
          `Ad [${id}] validated successfully by Admin [${user.id}] (bulk)`,
          user.id,
          { vehicule_id: id, brand: vehicule?.brand || null, model: vehicule?.model || null, action: "approve_bulk" }
        );
        successCount++;
      } catch (error) {
        console.error(`Erreur approbation ${id}:`, error);
        errorCount++;
      }
    }

    setPendingVehicules((prev) => prev.filter((v) => !selectedVehicles.has(v.id)));
    setSelectedVehicles(new Set());
    showToast(`${successCount} annonce(s) approuvée(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`, successCount > 0 ? "success" : "error");
    setIsBulkProcessing(false);
    router.refresh();
  };

  const handleBulkReject = async () => {
    if (selectedVehicles.size === 0 || isBulkProcessing || !rejectReason.trim()) return;
    if (!confirm(`Êtes-vous sûr de vouloir rejeter ${selectedVehicles.size} annonce(s) ?`)) return;

    setIsBulkProcessing(true);
    const toProcess = Array.from(selectedVehicles);
    let successCount = 0;
    let errorCount = 0;

    for (const id of toProcess) {
      try {
        await rejectVehicule(id, rejectReason);
        const vehicule = pendingVehicules.find((v) => v.id === id);
        await logInfo(
          `Ad [${id}] rejected by Admin [${user.id}] (bulk). Reason: ${rejectReason}`,
          user.id,
          { vehicule_id: id, brand: vehicule?.brand || null, model: vehicule?.model || null, reject_reason: rejectReason, action: "reject_bulk" }
        );
        successCount++;
      } catch (error) {
        console.error(`Erreur rejet ${id}:`, error);
        errorCount++;
      }
    }

    setPendingVehicules((prev) => prev.filter((v) => !selectedVehicles.has(v.id)));
    setSelectedVehicles(new Set());
    setRejectReason("");
    showToast(`${successCount} annonce(s) rejetée(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`, successCount > 0 ? "success" : "error");
    setIsBulkProcessing(false);
    router.refresh();
  };

  // Filtrer les véhicules
  const filteredVehicules = useMemo(() => {
    return pendingVehicules.filter((vehicule) => {
      // Recherche textuelle
      if (searchFilter.trim()) {
        const search = searchFilter.toLowerCase();
        const matchesSearch =
          vehicule.brand?.toLowerCase().includes(search) ||
          vehicule.model?.toLowerCase().includes(search) ||
          vehicule.description?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Filtre marque
      if (brandFilter && vehicule.brand !== brandFilter) return false;

      // Filtre date
      if (dateFilter) {
        const vehiculeDate = new Date(vehicule.created_at);
        const filterDate = new Date(dateFilter);
        if (vehiculeDate.toDateString() !== filterDate.toDateString()) return false;
      }

      return true;
    });
  }, [pendingVehicules, searchFilter, brandFilter, dateFilter]);

  // Récupérer les marques uniques
  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(pendingVehicules.map(v => v.brand).filter(Boolean))).sort();
  }, [pendingVehicules]);

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
          <FileCheck className="text-red-600" size={28} />
          Modération des Annonces
        </h2>
      </header>

      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-red-600" size={32} />
          </div>
        ) : pendingVehicules.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl">
            <CheckCircle className="text-green-600 mx-auto mb-4" size={48} />
            <p className="text-slate-600 font-medium">Aucune annonce en attente de modération</p>
          </div>
        ) : (
          <>
            {/* Filtres avancés */}
            <div className="mb-6 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <Filter size={20} className="text-red-600" />
                Filtres avancés
            </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Recherche</label>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Marque, modèle, description..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Marque</label>
                  <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600"
                  >
                    <option value="">Toutes les marques</option>
                    {uniqueBrands.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchFilter("");
                      setBrandFilter("");
                      setDateFilter("");
                    }}
                    className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl transition-all"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-4">
                {filteredVehicules.length} annonce(s) trouvée(s) sur {pendingVehicules.length}
            </p>
          </div>

            {/* Actions en masse */}
            {filteredVehicules.length > 0 && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedVehicles.size === filteredVehicules.length && filteredVehicules.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-600"
                  />
                  <span className="font-bold text-slate-900">
                    {selectedVehicles.size > 0
                      ? `${selectedVehicles.size} annonce(s) sélectionnée(s)`
                      : "Sélectionner tout"}
                  </span>
                </div>
                {selectedVehicles.size > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBulkApprove}
                      disabled={isBulkProcessing}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      {isBulkProcessing ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Approuver ({selectedVehicles.size})
                    </button>
                    <button
                      onClick={() => {
                        if (selectedVehicles.size > 0) {
                          setRejectModalOpen("bulk");
                        }
                      }}
                      disabled={isBulkProcessing}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Rejeter ({selectedVehicles.size})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Modal de rejet en masse */}
            {rejectModalOpen === "bulk" && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-slate-900">Refuser les annonces ({selectedVehicles.size})</h3>
                    <button
                      onClick={() => {
                        setRejectModalOpen(null);
                        setRejectReason("");
                      }}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X size={20} className="text-slate-600" />
                    </button>
              </div>
                  <p className="text-slate-600 mb-4">Veuillez indiquer la raison du refus (pour toutes les annonces sélectionnées) :</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Raison du refus..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 mb-4 resize-y min-h-[100px]"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBulkReject}
                      disabled={!rejectReason.trim() || isBulkProcessing}
                      className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBulkProcessing ? "Traitement..." : "Confirmer le refus"}
                    </button>
                    <button
                      onClick={() => {
                        setRejectModalOpen(null);
                        setRejectReason("");
                      }}
                      className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl transition-all"
                    >
                      Annuler
                    </button>
            </div>
                </div>
              </div>
            )}

            {filteredVehicules.length > 0 && (
              <div className="space-y-4">
                {filteredVehicules.map((vehicule) => (
              <div key={vehicule.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-start gap-6">
                  {/* Checkbox pour sélection */}
                  <div className="pt-2">
                    <input
                      type="checkbox"
                      checked={selectedVehicles.has(vehicule.id)}
                      onChange={() => handleToggleSelect(vehicule.id)}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-600"
                    />
                  </div>
                  <div className="w-32 h-24 bg-slate-100 rounded-xl overflow-hidden relative flex-shrink-0">
                    <Image
                      src={vehicule.image}
                      alt={`${vehicule.brand || 'Véhicule'} ${vehicule.model || ''}`}
                      fill
                      sizes="128px"
                      className="object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-black text-slate-900">
                          {vehicule.brand || 'N/A'} {vehicule.model || ''}
            </h3>
                        <p className="text-sm text-slate-600">
                          {vehicule.year || 'N/A'} • {vehicule.mileage ? vehicule.mileage.toLocaleString("fr-BE") : 'N/A'} km •{" "}
                          {vehicule.fuel_type || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          {vehicule.price ? vehicule.price.toLocaleString("fr-BE") : 'N/A'} €
                        </p>
                      </div>
          </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-900 text-xs font-medium rounded">
                        {vehicule.transmission || 'N/A'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-900 text-xs font-medium rounded">
                        {vehicule.body_type || 'N/A'}
                      </span>
                      {vehicule.euro_standard && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                          {formatEuroNorm(vehicule.euro_standard)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApprove(vehicule.id)}
                        disabled={isProcessing === vehicule.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        {isProcessing === vehicule.id ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Approuver
                      </button>
                      <button
                        onClick={() => setRejectModalOpen(vehicule.id)}
                        disabled={isProcessing === vehicule.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        Refuser
                      </button>
                      <Link
                        href={`/cars/${vehicule.id}`}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl transition-all"
                      >
                        Voir l'annonce
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal de rejet */}
        {rejectModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-900">Refuser l'annonce</h3>
                <button
                  onClick={() => {
                    setRejectModalOpen(null);
                    setRejectReason("");
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-600" />
                </button>
              </div>
              <p className="text-slate-600 mb-4">Veuillez indiquer la raison du refus :</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Photos de mauvaise qualité, véhicule non conforme..."
                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-red-600 text-slate-900 mb-4"
                rows={4}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleReject(rejectModalOpen)}
                  disabled={!rejectReason.trim() || isProcessing === rejectModalOpen}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isProcessing === rejectModalOpen ? "Traitement..." : "Confirmer le refus"}
                </button>
                <button
                  onClick={() => {
                    setRejectModalOpen(null);
                    setRejectReason("");
                  }}
                  className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl transition-all"
                >
                  Annuler
                </button>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant Vehicles Tab (simplifié - intégration du code existant)
function VehiclesTab({ user }: { user: any }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [owners, setOwners] = useState<Map<string, UserProfile>>(new Map());
  const [isLoadingVehicules, setIsLoadingVehicules] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<"pending" | "active" | "rejected" | "all">("all");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [contactingIds, setContactingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadVehicules = async () => {
      if (user && (user.role === "admin" || user.role === "moderator")) {
        try {
          setIsLoadingVehicules(true);
          const filters = statusFilter !== "all" ? { status: statusFilter } : undefined;
          const result = await getVehiculesPaginated(currentPage, pageSize, filters);
          setVehicules(result.data);
          setTotal(result.total);

          // Charger les profils des propriétaires
          const ownerIds = result.data
            .map(v => v.owner_id)
            .filter((id): id is string => id !== null && id !== undefined);
          
          if (ownerIds.length > 0) {
            const supabase = createClient();
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, email, full_name, avatar_url")
              .in("id", ownerIds);
            
            if (profiles) {
              const ownersMap = new Map<string, UserProfile>();
              profiles.forEach(profile => {
                ownersMap.set(profile.id, profile as UserProfile);
              });
              setOwners(ownersMap);
            }
          }
        } catch (error) {
          console.error("Erreur chargement véhicules:", error);
          showToast("Erreur lors du chargement des véhicules", "error");
        } finally {
          setIsLoadingVehicules(false);
        }
      }
    };
    loadVehicules();
  }, [user, currentPage, statusFilter, pageSize, showToast]);

  const handleDelete = async (vehiculeId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.")) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(vehiculeId));
    try {
      await deleteVehicule(vehiculeId);
      setVehicules(prev => prev.filter(v => v.id !== vehiculeId));
      showToast("Annonce supprimée avec succès", "success");
    } catch (error) {
      console.error("Erreur suppression:", error);
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(vehiculeId);
        return next;
      });
    }
  };

  const handleContact = async (vehicule: Vehicule) => {
    if (!vehicule.owner_id) {
      showToast("Cette annonce n'a pas de propriétaire (invité)", "error");
      return;
    }

    setContactingIds(prev => new Set(prev).add(vehicule.id));
    try {
      const senderRole = user.role === "admin" ? "Administrateur" : "Modérateur";
      const vehicleName = `${vehicule.brand || ''} ${vehicule.model || ''}`.trim() || "ce véhicule";
      const initialMessage = `Bonjour,\n\nJe vous contacte en tant que ${senderRole} de RedZone concernant votre annonce "${vehicleName}".\n\nComment pouvons-nous vous aider ?\n\nCordialement,\nL'équipe RedZone`;

      const result = await createAdminConversation(
        vehicule.id,
        vehicule.owner_id,
        initialMessage
      );

      if (result.success && result.conversationId) {
        showToast("Conversation créée avec notification envoyée", "success");
        router.push(`/dashboard?tab=messages&conversation=${result.conversationId}`);
      } else {
        showToast(result.error || "Erreur lors de la création de la conversation", "error");
      }
    } catch (error) {
      console.error("Erreur contact:", error);
      showToast("Erreur lors du contact", "error");
    } finally {
      setContactingIds(prev => {
        const next = new Set(prev);
        next.delete(vehicule.id);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
          <Car className="text-red-600" size={28} />
          Gestion des Véhicules
        </h2>
      </header>

      <div className="p-8">
        {/* Filtres */}
        <div className="mb-6 flex items-center gap-3">
          {(["all", "pending", "active", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                statusFilter === status
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {status === "all" ? "Tous" : status === "pending" ? "En attente" : status === "active" ? "Actifs" : "Rejetés"}
            </button>
          ))}
        </div>

        {isLoadingVehicules ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-red-600" size={32} />
          </div>
        ) : (
          <div className="space-y-4">
            {vehicules.length === 0 ? (
              <div className="text-center py-12">
                <Car className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-600 font-medium">Aucun véhicule trouvé</p>
              </div>
            ) : (
              vehicules.map((vehicule) => {
                const owner = vehicule.owner_id ? owners.get(vehicule.owner_id) : null;
                const isDeleting = deletingIds.has(vehicule.id);
                const isContacting = contactingIds.has(vehicule.id);

                return (
                  <div key={vehicule.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                    <div className="flex items-start gap-6">
                      <div className="w-20 h-16 bg-slate-200 rounded-xl overflow-hidden relative flex-shrink-0">
                        <Image
                          src={vehicule.image}
                          alt={`${vehicule.brand || 'Véhicule'} ${vehicule.model || ''}`}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {vehicule.brand || 'N/A'} {vehicule.model || ''}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {vehicule.year || "N/A"} • {vehicule.mileage ? vehicule.mileage.toLocaleString("fr-BE") : "N/A"} km
                            </p>
                            {owner && (
                              <div className="mt-2 flex items-center gap-2">
                                <User size={14} className="text-slate-400" />
                                <span className="text-xs text-slate-600">
                                  {owner.full_name || owner.email || "Propriétaire inconnu"}
                                </span>
                              </div>
                            )}
                            {!vehicule.owner_id && (
                              <div className="mt-2 flex items-center gap-2">
                                <Mail size={14} className="text-slate-400" />
                                <span className="text-xs text-slate-600">
                                  Invité {vehicule.guest_email ? `(${vehicule.guest_email})` : ""}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-slate-900">
                              {vehicule.price ? vehicule.price.toLocaleString("fr-BE") : "N/A"} €
                            </p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              vehicule.status === "active" ? "bg-green-100 text-green-700" :
                              vehicule.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {vehicule.status === "active" ? "Actif" : vehicule.status === "pending" ? "En attente" : "Rejeté"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Link
                            href={`/cars/${vehicule.id}`}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                          >
                            <Eye size={14} />
                            Voir
                          </Link>
                          {vehicule.owner_id && (
                            <button
                              onClick={() => handleContact(vehicule)}
                              disabled={isContacting}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                            >
                              {isContacting ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  Contact...
                                </>
                              ) : (
                                <>
                                  <MessageSquare size={14} />
                                  Contacter
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(vehicule.id)}
                            disabled={isDeleting}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Suppression...
                              </>
                            ) : (
                              <>
                                <Trash2 size={14} />
                                Supprimer
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-50"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-slate-600 font-medium">
              Page {currentPage} sur {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
              disabled={currentPage >= Math.ceil(total / pageSize)}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant Users Tab (complet)
function UsersTab() {
  const { showToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithVehicles | null>(null);
  const [userVehicles, setUserVehicles] = useState<Vehicule[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banUntil, setBanUntil] = useState("");
  const [isPermanentBan, setIsPermanentBan] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error("Erreur chargement utilisateurs:", error);
        showToast("Erreur lors du chargement des utilisateurs", "error");
      } finally {
        setIsLoadingUsers(false);
      }
    };
    loadUsers();
  }, [showToast]);

  const loadUserVehicles = async (userId: string) => {
    try {
      setIsLoadingVehicles(true);
      const userData = await getUserWithVehicles(userId);
      if (userData) {
        setSelectedUser(userData);
        const vehicles = await getUserVehicles(userId);
        setUserVehicles(vehicles);
      }
    } catch (error) {
      console.error("Erreur chargement véhicules:", error);
      showToast("Erreur lors du chargement des véhicules", "error");
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleOpenBanModal = (userId: string, isBanned: boolean) => {
    if (isBanned) {
      handleUnban(userId);
    } else {
      setBanModalOpen(userId);
      setBanReason("");
      setBanUntil("");
      setIsPermanentBan(false);
    }
  };

  const handleBan = async () => {
    if (!banModalOpen || !banReason.trim()) {
      showToast("Veuillez saisir une raison", "error");
      return;
    }
    try {
      setIsProcessing(true);
      await banUser({
        userId: banModalOpen,
        reason: banReason.trim(),
        banUntil: isPermanentBan ? null : banUntil || null,
      });
      showToast("Utilisateur banni avec succès", "success");
      setBanModalOpen(null);
      setBanReason("");
      setBanUntil("");
      setIsPermanentBan(false);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      if (selectedUser && selectedUser.id === banModalOpen) {
        const updatedUser = await getUserWithVehicles(banModalOpen);
        if (updatedUser) setSelectedUser(updatedUser);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Erreur bannissement:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors du bannissement", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      setIsProcessing(true);
      await unbanUser(userId);
      showToast("Utilisateur débanni avec succès", "success");
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      if (selectedUser && selectedUser.id === userId) {
        const updatedUser = await getUserWithVehicles(userId);
        if (updatedUser) setSelectedUser(updatedUser);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Erreur débannissement:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors du débannissement", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const isDeleteConfirmed = deleteConfirmText.trim().toUpperCase() === 'SUPPRIMER';

  const handleDelete = async () => {
    if (!deleteModalOpen) return;
    if (!isDeleteConfirmed) {
      showToast('Veuillez taper "SUPPRIMER" pour confirmer', "error");
      return;
    }
    try {
      setIsProcessing(true);
      await deleteUser(deleteModalOpen);
      showToast("Utilisateur supprimé définitivement", "success");
      setDeleteModalOpen(null);
      setDeleteConfirmText("");
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      if (selectedUser && selectedUser.id === deleteModalOpen) {
        setSelectedUser(null);
        setUserVehicles([]);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Erreur suppression:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors de la suppression", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedUserForBan = banModalOpen ? users.find(u => u.id === banModalOpen) : null;
  const selectedUserForDelete = deleteModalOpen ? users.find(u => u.id === deleteModalOpen) : null;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
          <Users className="text-red-600" size={28} />
          Gestion des Utilisateurs
        </h2>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des utilisateurs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <h3 className="text-xl font-black text-slate-900 mb-6">Liste des Utilisateurs ({users.length})</h3>
              {isLoadingUsers ? (
                <div className="text-center py-12">
                  <Loader2 className="animate-spin text-red-600 mx-auto mb-4" size={32} />
                  <p className="text-slate-600">Chargement...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-slate-600">Aucun utilisateur trouvé</div>
              ) : (
                <div className="space-y-3">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedUser?.id === u.id
                          ? "border-red-600 bg-red-50 shadow-lg"
                          : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
                      }`}
                      onClick={() => loadUserVehicles(u.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Mail size={18} className="text-slate-400" />
                            <span className="font-black text-slate-900">{u.email}</span>
                            {u.role === "admin" && (
                              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <Shield size={12} />
                                Admin
                              </span>
                            )}
                            {u.is_banned && (
                              <span className="px-2 py-1 bg-red-900 text-red-200 text-xs font-bold rounded-full flex items-center gap-1">
                                <Ban size={12} />
                                Banni
                                {u.ban_until && new Date(u.ban_until) > new Date() && (
                                  <span className="ml-1">(jusqu'au {new Date(u.ban_until).toLocaleDateString("fr-BE")})</span>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(u.created_at).toLocaleDateString("fr-BE")}
                            </div>
                            {u.ban_reason && (
                              <div className="text-xs text-red-600">Raison: {u.ban_reason}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBanModal(u.id, u.is_banned);
                            }}
                            className={`px-4 py-2 rounded-full font-bold transition-all ${
                              u.is_banned
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-red-600 hover:bg-red-700 text-white"
                            }`}
                          >
                            {u.is_banned ? (
                              <>
                                <CheckCircle size={16} className="inline mr-2" />
                                Débannir
                              </>
                            ) : (
                              <>
                                <Ban size={16} className="inline mr-2" />
                                Gérer le Ban
                              </>
                            )}
                          </button>
                          {u.role !== "admin" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteModalOpen(u.id);
                                setDeleteConfirmText("");
                              }}
                              className="px-4 py-2 bg-red-900 hover:bg-red-950 text-white rounded-full font-bold transition-all flex items-center gap-2"
                            >
                              <Trash2 size={16} />
                              Supprimer
                            </button>
                )}
              </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Détails utilisateur */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sticky top-8">
              <h3 className="text-xl font-black text-slate-900 mb-6">Détails Utilisateur</h3>
              {!selectedUser ? (
                <div className="text-center py-12 text-slate-600">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez un utilisateur pour voir les détails</p>
                </div>
              ) : (
                <div className="space-y-6">
              <div>
                    <h4 className="text-sm font-bold text-slate-600 mb-2">Informations</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-slate-900 font-black">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Nom</p>
                        <p className="text-slate-900">{selectedUser.full_name || "Non renseigné"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Rôle</p>
                        <p className="text-slate-900 font-black">
                          {selectedUser.role === "admin" ? "Administrateur" : selectedUser.role === "pro" ? "Professionnel" : "Particulier"}
                </p>
              </div>
                      <div>
                        <p className="text-xs text-slate-500">Statut</p>
                        <p className={`font-bold ${selectedUser.is_banned ? "text-red-600" : "text-green-600"}`}>
                          {selectedUser.is_banned ? "Banni" : "Actif"}
                        </p>
                        {selectedUser.is_banned && selectedUser.ban_reason && (
                          <p className="text-xs text-red-600 mt-1">Raison: {selectedUser.ban_reason}</p>
                        )}
            </div>
                    </div>
                  </div>
                  {isLoadingVehicles ? (
                    <div className="text-center py-8">
                      <Loader2 className="animate-spin text-red-600 mx-auto mb-2" size={24} />
                      <p className="text-xs text-slate-600">Chargement...</p>
                    </div>
                  ) : userVehicles.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-bold text-slate-600 mb-3">Véhicules ({userVehicles.length})</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {userVehicles.map((v) => (
                          <Link
                            key={v.id}
                            href={`/cars/${v.id}`}
                            className="block p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                          >
                            <p className="text-slate-900 font-black text-sm">
                              {v.brand || 'N/A'} {v.model || ''}
                            </p>
                            <p className="text-slate-600 text-xs">
                              {v.price ? v.price.toLocaleString("fr-BE") : 'N/A'} € •{" "}
                              {v.status === "active" ? (
                                <span className="text-green-600">Actif</span>
                              ) : v.status === "pending" ? (
                                <span className="text-yellow-600">En attente</span>
                              ) : (
                                <span className="text-red-600">Rejeté</span>
                              )}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-600">
                      <Car size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun véhicule publié</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modale de Bannissement */}
        {banModalOpen && selectedUserForBan && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Ban className="text-red-600" size={24} />
                  Bannir l'utilisateur
                </h3>
                <button onClick={() => { setBanModalOpen(null); setBanReason(""); setBanUntil(""); setIsPermanentBan(false); }} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Email de l'utilisateur</label>
                  <p className="text-slate-900 font-medium">{selectedUserForBan.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Raison du bannissement <span className="text-red-600">*</span></label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Ex: Spam, comportement inapproprié..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:border-red-600 focus:outline-none"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input type="checkbox" checked={isPermanentBan} onChange={(e) => setIsPermanentBan(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-600" />
                    <span className="text-sm font-bold text-slate-900">Bannissement permanent</span>
                  </label>
                </div>
                {!isPermanentBan && (
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Date de fin du bannissement</label>
                    <input type="datetime-local" value={banUntil} onChange={(e) => setBanUntil(e.target.value)} min={new Date().toISOString().slice(0, 16)} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:border-red-600 focus:outline-none" />
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button onClick={handleBan} disabled={!banReason.trim() || isProcessing} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black transition-all disabled:opacity-50">
                    {isProcessing ? "Traitement..." : "Confirmer le bannissement"}
                  </button>
                  <button onClick={() => { setBanModalOpen(null); setBanReason(""); setBanUntil(""); setIsPermanentBan(false); }} className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl font-black transition-all">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modale de Suppression */}
        {deleteModalOpen && selectedUserForDelete && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-2 border-red-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-red-600 flex items-center gap-2">
                  <AlertTriangle size={24} />
                  Supprimer le compte
                </h3>
                <button onClick={() => { setDeleteModalOpen(null); setDeleteConfirmText(""); }} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-red-900 font-bold mb-2">⚠️ Action irréversible</p>
                  <p className="text-sm text-slate-700">Cette action supprimera définitivement le compte, le profil et toutes les annonces associées.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">Pour confirmer, tapez <span className="text-red-600 font-black">SUPPRIMER</span></label>
                  <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="SUPPRIMER" className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:border-red-600 focus:outline-none uppercase" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={handleDelete} disabled={!isDeleteConfirmed || isProcessing} className={`flex-1 px-4 py-3 text-white rounded-xl font-black transition-all disabled:opacity-50 ${isDeleteConfirmed && !isProcessing ? "bg-red-600 hover:bg-red-700" : "bg-red-900"}`}>
                    {isProcessing ? "Suppression..." : "Supprimer définitivement"}
                  </button>
                  <button onClick={() => { setDeleteModalOpen(null); setDeleteConfirmText(""); }} className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl font-black transition-all">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant Settings Tab (complet)
function SettingsTab() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    banner_message: "",
    maintenance_mode: false,
    tva_rate: 21.00,
    site_name: "",
    site_description: "",
    home_title: "",
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoadingSettings(true);
        const siteSettings = await getSiteSettings();
        if (siteSettings) {
          setSettings(siteSettings);
          setFormData({
            banner_message: siteSettings.banner_message || "",
            maintenance_mode: siteSettings.maintenance_mode || false,
            tva_rate: siteSettings.tva_rate || 21.00,
            site_name: siteSettings.site_name || "",
            site_description: siteSettings.site_description || "",
            home_title: siteSettings.home_title || "Le Sanctuaire du Moteur Thermique",
          });
        }
      } catch (error) {
        console.error("Erreur chargement réglages:", error);
        showToast("Erreur lors du chargement des réglages", "error");
      } finally {
        setIsLoadingSettings(false);
      }
    };
    loadSettings();
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateSiteSettings(formData);
      showToast("Réglages sauvegardés avec succès ✓", "success");
      const updatedSettings = await getSiteSettings();
      if (updatedSettings) {
        setSettings(updatedSettings);
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors de la sauvegarde", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.")) return;
    try {
      setIsSaving(true);
      await updateSiteSettings({
        banner_message: "Bienvenue sur RedZone",
        maintenance_mode: false,
        tva_rate: 21.00,
        site_name: "RedZone",
        site_description: "Le sanctuaire du moteur thermique",
        home_title: "Le Sanctuaire du Moteur Thermique",
      });
      showToast("Données réinitialisées ✓", "success");
      const updatedSettings = await getSiteSettings();
      if (updatedSettings) {
        setSettings(updatedSettings);
        setFormData({
          banner_message: updatedSettings.banner_message || "",
          maintenance_mode: updatedSettings.maintenance_mode || false,
          tva_rate: updatedSettings.tva_rate || 21.00,
          site_name: updatedSettings.site_name || "",
          site_description: updatedSettings.site_description || "",
          home_title: updatedSettings.home_title || "Le Sanctuaire du Moteur Thermique",
        });
      }
    } catch (error) {
      console.error("Erreur réinitialisation:", error);
      showToast("Erreur lors de la réinitialisation", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
          <Settings className="text-red-600" size={28} />
          Paramètres du Site
        </h2>
      </header>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <label className="block text-sm font-bold text-slate-900 mb-3">Message de la bannière</label>
            <input type="text" value={formData.banner_message} onChange={(e) => setFormData({ ...formData, banner_message: e.target.value })} placeholder="Bienvenue sur RedZone" className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900" />
            <p className="text-xs text-slate-500 mt-2">Ce message s'affichera en haut du site (optionnel)</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Mode Maintenance</label>
                <p className="text-xs text-slate-500">Activez pour bloquer l'accès au site (sauf admins)</p>
              </div>
              <button type="button" onClick={() => setFormData({ ...formData, maintenance_mode: !formData.maintenance_mode })} className={`relative w-16 h-8 rounded-full transition-colors duration-200 ${formData.maintenance_mode ? "bg-red-600" : "bg-slate-300"}`}>
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 shadow-lg ${formData.maintenance_mode ? "translate-x-8" : ""}`} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <label className="block text-sm font-bold text-slate-900 mb-3">Taux TVA (%)</label>
            <input type="number" min="0" max="100" step="0.01" value={formData.tva_rate} onChange={(e) => setFormData({ ...formData, tva_rate: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900" />
            <p className="text-xs text-slate-500 mt-2">Taux de TVA belge par défaut : 21%</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <label className="block text-sm font-bold text-slate-900 mb-3">Nom du site</label>
            <input type="text" value={formData.site_name} onChange={(e) => setFormData({ ...formData, site_name: e.target.value })} placeholder="RedZone" className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <label className="block text-sm font-bold text-slate-900 mb-3">Description du site</label>
            <textarea value={formData.site_description} onChange={(e) => setFormData({ ...formData, site_description: e.target.value })} placeholder="Le sanctuaire du moteur thermique" rows={3} className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900 resize-none" />
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <label className="block text-sm font-bold text-slate-900 mb-3">Titre de la page d'accueil</label>
            <input type="text" value={formData.home_title} onChange={(e) => setFormData({ ...formData, home_title: e.target.value })} placeholder="Le Sanctuaire du Moteur Thermique" className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900" />
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <Save size={20} />
              {isSaving ? "Sauvegarde..." : "Enregistrer les réglages"}
            </button>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-2">Zone Danger</h3>
                <p className="text-sm text-slate-700 mb-4">Réinitialiser toutes les données aux valeurs par défaut. Cette action est irréversible.</p>
                <button type="button" onClick={handleReset} disabled={isSaving} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  Réinitialiser les données
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Composant Support Tab (complet)
function SupportTab({ user }: { user: any }) {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mine" | "all">("mine");
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved" | "closed">("all");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [inProgressId, setInProgressId] = useState<string | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyingToTicket, setReplyingToTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const assignedToFilter = activeTab === "all" && user?.role === "admin" ? "all" : undefined;
      // Convertir le filtre en format accepté par getTickets
      let statusFilter: "open" | "closed" | "resolved" | undefined = undefined;
      if (filter === "open") statusFilter = "open";
      else if (filter === "resolved") statusFilter = "resolved";
      else if (filter === "closed") statusFilter = "closed";
      // Note: "in_progress" sera filtré côté client car getTickets ne l'accepte pas encore
      
      const result = await getTickets({
        status: statusFilter,
        assignedTo: assignedToFilter as "admin" | "moderator" | "all" | undefined,
      });
      
      if (result.success && result.tickets) {
        // Filtrer côté client pour "in_progress" si nécessaire
        let filteredTickets = result.tickets;
        if (filter === "in_progress") {
          filteredTickets = filteredTickets.filter((t: any) => t.status === "in_progress");
        }
        setTickets(filteredTickets);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Erreur chargement tickets:", error);
      showToast("Erreur lors du chargement des tickets", "error");
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [activeTab, filter, user]);

  // Subscription en temps réel pour les tickets
  useEffect(() => {
    if (!user) return;
    
    const supabase = createClient();
    
    // Créer la subscription pour les changements sur la table tickets
    const channel = supabase
      .channel('admin-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Tous les événements (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          console.log('🔄 [Admin Tickets] Changement détecté:', payload.eventType, payload.new || payload.old);
          
          // Recharger les tickets après un changement
          loadTickets();
          
          // Afficher une notification pour les nouveaux tickets
          if (payload.eventType === 'INSERT' && payload.new) {
            const newTicket = payload.new as any;
            if (newTicket.assigned_to === user?.role || user?.role === 'admin') {
              showToast(`Nouveau ticket ${newTicket.category} reçu`, "info");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, showToast]);

  const handleResolve = async (ticketId: string) => {
    if (resolvingId) return;
    setResolvingId(ticketId);
    try {
      const result = await resolveTicket(ticketId);
      if (result.success) {
        showToast("Ticket marqué comme résolu", "success");
        loadTickets();
      } else {
        showToast(result.error || "Erreur", "error");
      }
    } catch (error) {
      console.error("Erreur résolution ticket:", error);
      showToast("Erreur lors de la résolution", "error");
    } finally {
      setResolvingId(null);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.")) {
      return;
    }
    if (deletingId) return;
    setDeletingId(ticketId);
    try {
      const result = await deleteTicket(ticketId);
      if (result.success) {
        showToast("Ticket supprimé", "success");
        loadTickets();
      } else {
        showToast(result.error || "Erreur", "error");
      }
    } catch (error) {
      console.error("Erreur suppression ticket:", error);
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClose = async (ticketId: string) => {
    if (closingId) return;
    setClosingId(ticketId);
    try {
      const result = await closeTicket(ticketId);
      if (result.success) {
        showToast("Ticket clôturé", "success");
        loadTickets();
      } else {
        showToast(result.error || "Erreur", "error");
      }
    } catch (error) {
      console.error("Erreur clôture ticket:", error);
      showToast("Erreur lors de la clôture", "error");
    } finally {
      setClosingId(null);
    }
  };

  const handleReassign = async (ticketId: string, newAssignee: "admin" | "moderator") => {
    if (reassigningId) return;
    setReassigningId(ticketId);
    try {
      const result = await reassignTicket(ticketId, newAssignee);
      if (result.success) {
        showToast(`Ticket réassigné à ${newAssignee === "admin" ? "l'admin" : "le modérateur"}`, "success");
        loadTickets();
      } else {
        showToast(result.error || "Erreur", "error");
      }
    } catch (error) {
      console.error("Erreur réassignation ticket:", error);
      showToast("Erreur lors de la réassignation", "error");
    } finally {
      setReassigningId(null);
    }
  };

  const handleSetInProgress = async (ticketId: string) => {
    try {
      const result = await setTicketInProgress(ticketId);
      if (result.success) {
        showToast("Ticket mis en traitement", "success");
        loadTickets();
      } else {
        showToast(result.error || "Erreur", "error");
      }
    } catch (error) {
      console.error("Erreur mise en traitement:", error);
      showToast("Erreur", "error");
    }
  };

  const handleAddReply = async (ticketId: string) => {
    if (!replyText.trim()) {
      showToast("Veuillez saisir une réponse", "error");
      return;
    }
    
    setSubmittingReply(true);
    try {
      const result = await addAdminReply(ticketId, replyText);
      if (result.success) {
        showToast("Réponse envoyée avec succès", "success");
        setReplyText("");
        setReplyingToTicket(null);
        loadTickets();
      } else {
        showToast(result.error || "Erreur lors de l'envoi", "error");
      }
    } catch (error) {
      console.error("Erreur ajout réponse:", error);
      showToast("Erreur lors de l'envoi de la réponse", "error");
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const myTickets = tickets.filter((t) => t.assigned_to === user?.role);
  const openTickets = tickets.filter((t) => t.status === "open");
  const resolvedTickets = tickets.filter((t) => t.status === "resolved");

  const categoryLabels: Record<string, { label: string; emoji: string; color: string }> = {
    Technique: { label: "Technique", emoji: "🔧", color: "bg-blue-100 text-blue-800 border-blue-200" },
    Contenu: { label: "Contenu", emoji: "📝", color: "bg-orange-100 text-orange-800 border-orange-200" },
    Commercial: { label: "Commercial", emoji: "💼", color: "bg-purple-100 text-purple-800 border-purple-200" },
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
          <MessageSquare className="text-red-600" size={28} />
          Support
        </h2>
      </header>

      <div className="p-8">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-200">
          <button onClick={() => setActiveTab("mine")} className={`px-6 py-3 font-bold transition-all border-b-2 ${activeTab === "mine" ? "border-red-600 text-red-600" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
            Mes Tickets
            {myTickets.filter((t) => t.status === "open").length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">{myTickets.filter((t) => t.status === "open").length}</span>
            )}
          </button>
          {user?.role === "admin" && (
            <button onClick={() => setActiveTab("all")} className={`px-6 py-3 font-bold transition-all border-b-2 ${activeTab === "all" ? "border-red-600 text-red-600" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
              Tous les Tickets
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Tickets ouverts</h3>
            <p className="text-3xl font-black text-slate-900">{openTickets.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Tickets résolus</h3>
            <p className="text-3xl font-black text-slate-900">{resolvedTickets.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="text-blue-600" size={24} />
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Total tickets</h3>
            <p className="text-3xl font-black text-slate-900">{tickets.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {(["all", "open", "in_progress", "resolved", "closed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl font-medium transition-all ${filter === f ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
              {f === "all" ? "Tous" : f === "open" ? "Ouverts" : f === "in_progress" ? "En traitement" : f === "resolved" ? "Résolus" : "Fermés"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="animate-spin text-red-600 mx-auto mb-4" size={32} />
            <p className="text-slate-600">Chargement des tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-12 text-center">
            <MessageSquare className="text-slate-400 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun ticket</h3>
            <p className="text-slate-600">{activeTab === "mine" ? "Aucun ticket ne vous est assigné." : "Aucun ticket ne correspond aux filtres sélectionnés."}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const categoryInfo = categoryLabels[ticket.category] || categoryLabels.Commercial;
              const isResolved = ticket.status === "resolved";
              const isClosed = ticket.status === "closed";
              const isInProgress = ticket.status === "in_progress";
              const isAssignedToMe = ticket.assigned_to === user?.role;
              const isAdmin = user?.role === "admin";
              const isExpanded = expandedTicket === ticket.id;
              
              return (
                <div key={ticket.id} className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6 hover:shadow-2xl transition-all">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${categoryInfo.color}`}>{categoryInfo.emoji} {categoryInfo.label}</span>
                        {isClosed ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            <XCircle size={12} className="inline mr-1" />
                            Fermé
                          </span>
                        ) : isResolved ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle size={12} className="inline mr-1" />
                            Résolu
                          </span>
                        ) : isInProgress ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Clock size={12} className="inline mr-1" />
                            En traitement
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                            <Clock size={12} className="inline mr-1" />
                            Ouvert
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          Assigné à: {ticket.assigned_to === "admin" ? "Admin (Dimitri)" : "Modérateur (Antoine)"}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail size={16} />
                          <span className="font-medium">{ticket.email_contact}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar size={16} />
                          <span>{formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <p className="text-slate-900 whitespace-pre-wrap line-clamp-3">{ticket.message}</p>
                      </div>
                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <h5 className="text-sm font-bold text-slate-700 mb-2">Message complet :</h5>
                            <div className="bg-slate-50 rounded-xl p-4">
                              <p className="text-slate-900 whitespace-pre-wrap">{ticket.message}</p>
                            </div>
                          </div>
                          {ticket.admin_reply && (
                            <div className="mb-4">
                              <h5 className="text-sm font-bold text-green-700 mb-2">Réponse du support :</h5>
                              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                <p className="text-green-900 whitespace-pre-wrap">{ticket.admin_reply}</p>
                              </div>
                            </div>
                          )}
                          {ticket.user_reply && (
                            <div className="mb-4">
                              <h5 className="text-sm font-bold text-blue-700 mb-2">Réponse de l'utilisateur :</h5>
                              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                <p className="text-blue-900 whitespace-pre-wrap">{ticket.user_reply}</p>
                              </div>
                            </div>
                          )}
                          {!isClosed && isAssignedToMe && (
                            <div className="mt-4">
                              {replyingToTicket === ticket.id ? (
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                  <h5 className="text-sm font-bold text-slate-700 mb-3">Ajouter une réponse :</h5>
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Tapez votre réponse ici..."
                                    className="w-full min-h-[120px] p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-y text-slate-900 bg-white"
                                    disabled={submittingReply}
                                  />
                                  <div className="flex items-center gap-2 mt-3">
            <button
                                      onClick={() => handleAddReply(ticket.id)}
                                      disabled={submittingReply || !replyText.trim()}
                                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {submittingReply ? (
                                        <>
                                          <Loader2 size={16} className="animate-spin" />
                                          Envoi...
                                        </>
                                      ) : (
                                        <>
                                          <Send size={16} />
                                          Envoyer la réponse
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReplyingToTicket(null);
                                        setReplyText("");
                                      }}
                                      disabled={submittingReply}
                                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-all disabled:opacity-50"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setReplyingToTicket(ticket.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
                                >
                                  <MessageSquare size={16} />
                                  {ticket.admin_reply ? "Modifier la réponse" : "Ajouter une réponse"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      <button
                        onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all"
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        {isExpanded ? "Réduire" : "Détails"}
                      </button>
                      {!isClosed && isAssignedToMe && (
                        <>
                          {!isInProgress && ticket.status === "open" && (
                            <button
                              onClick={() => handleSetInProgress(ticket.id)}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all"
                            >
                              <Clock size={18} />
                              En traitement
                            </button>
                          )}
                          <button
                            onClick={() => handleResolve(ticket.id)}
                            disabled={resolvingId === ticket.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resolvingId === ticket.id ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                  Traitement...
                </>
                            ) : (
                              <>
                                <CheckCircle size={18} />
                                Résoudre
                              </>
                            )}
                          </button>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          {!isClosed && (
                            <>
                              <button
                                onClick={() => handleReassign(ticket.id, ticket.assigned_to === "admin" ? "moderator" : "admin")}
                                disabled={reassigningId === ticket.id}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {reassigningId === ticket.id ? (
                                  <>
                                    <Loader2 size={18} className="animate-spin" />
                                    ...
                </>
              ) : (
                <>
                                    <Users size={18} />
                                    {ticket.assigned_to === "admin" ? "→ Modérateur" : "→ Admin"}
                </>
              )}
            </button>
                              <button
                                onClick={() => handleClose(ticket.id)}
                                disabled={closingId === ticket.id}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {closingId === ticket.id ? (
                                  <>
                                    <Loader2 size={18} className="animate-spin" />
                                    ...
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={18} />
                                    Clôturer
                                  </>
                                )}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(ticket.id)}
                            disabled={deletingId === ticket.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === ticket.id ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                Suppression...
                              </>
                            ) : (
                              <>
                                <Trash2 size={18} />
                                Supprimer
                              </>
                            )}
                          </button>
                        </>
                      )}
          </div>
        </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Composant Content Tab (FAQ - complet)
function ContentTab() {
  const { showToast } = useToast();
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [isLoadingFAQ, setIsLoadingFAQ] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<FAQItem>>({});
  const [newItem, setNewItem] = useState({
    question: "",
    answer: "",
    order: 0,
    is_active: true,
  });

  useEffect(() => {
    const loadFAQ = async () => {
      try {
        setIsLoadingFAQ(true);
        const allFAQ = await getAllFAQ();
        setFaqItems(allFAQ);
      } catch (error) {
        console.error("Erreur chargement FAQ:", error);
        showToast("Erreur lors du chargement de la FAQ", "error");
      } finally {
        setIsLoadingFAQ(false);
      }
    };
    loadFAQ();
  }, [showToast]);

  const handleCreate = async () => {
    if (!newItem.question.trim() || !newItem.answer.trim()) {
      showToast("Veuillez remplir tous les champs", "error");
      return;
    }
    try {
      const maxOrder = Math.max(...faqItems.map((f) => f.order), -1);
      await createFAQItem({ ...newItem, order: maxOrder + 1 });
      showToast("FAQ créée avec succès", "success");
      setIsCreating(false);
      setNewItem({ question: "", answer: "", order: 0, is_active: true });
      const allFAQ = await getAllFAQ();
      setFaqItems(allFAQ);
    } catch (error) {
      console.error("Erreur création FAQ:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors de la création", "error");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingItem.question?.trim() || !editingItem.answer?.trim()) {
      showToast("Veuillez remplir tous les champs", "error");
      return;
    }
    try {
      await updateFAQItem(id, editingItem);
      showToast("FAQ modifiée avec succès", "success");
      setIsEditing(null);
      setEditingItem({});
      const allFAQ = await getAllFAQ();
      setFaqItems(allFAQ);
    } catch (error) {
      console.error("Erreur modification FAQ:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors de la modification", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette FAQ ?")) return;
    try {
      await deleteFAQItem(id);
      showToast("FAQ supprimée avec succès", "success");
      const allFAQ = await getAllFAQ();
      setFaqItems(allFAQ);
    } catch (error) {
      console.error("Erreur suppression FAQ:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors de la suppression", "error");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateFAQItem(id, { is_active: !currentStatus });
      showToast(!currentStatus ? "FAQ activée" : "FAQ désactivée", "success");
      const allFAQ = await getAllFAQ();
      setFaqItems(allFAQ);
    } catch (error) {
      console.error("Erreur modification statut:", error);
      showToast("Erreur lors de la modification", "error");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
            <FileText className="text-red-600" size={28} />
            Gestion de la FAQ
          </h2>
          <button onClick={() => setIsCreating(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2">
            <Plus size={20} />
            Ajouter une FAQ
          </button>
        </div>
      </header>

      <div className="p-8">
        {isCreating && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-red-600 p-6 mb-6">
            <h3 className="text-xl font-black text-slate-900 mb-4">Nouvelle Question FAQ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Question *</label>
                <input type="text" value={newItem.question} onChange={(e) => setNewItem({ ...newItem, question: e.target.value })} placeholder="Ex: Qu'est-ce que RedZone ?" className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-red-600/20 focus:border-red-600" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Réponse *</label>
                <textarea value={newItem.answer} onChange={(e) => setNewItem({ ...newItem, answer: e.target.value })} placeholder="Ex: RedZone est une plateforme..." rows={4} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-red-600/20 focus:border-red-600 resize-none" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-900 mb-2">Ordre d'affichage</label>
                  <input type="number" value={newItem.order} onChange={(e) => setNewItem({ ...newItem, order: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-red-600/20 focus:border-red-600" />
                </div>
                <div className="flex items-center gap-2 mt-8">
                  <input type="checkbox" checked={newItem.is_active} onChange={(e) => setNewItem({ ...newItem, is_active: e.target.checked })} className="w-5 h-5 text-red-600 rounded" />
                  <label className="text-sm font-bold text-slate-900">Active</label>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleCreate} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                  <Save size={20} />
                  Créer
                </button>
                <button onClick={() => { setIsCreating(false); setNewItem({ question: "", answer: "", order: 0, is_active: true }); }} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-xl font-black text-slate-900 mb-6">Questions FAQ ({faqItems.length})</h3>
          {isLoadingFAQ ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin text-red-600 mx-auto mb-4" size={32} />
              <p className="text-slate-600">Chargement...</p>
            </div>
          ) : faqItems.length === 0 ? (
            <div className="text-center py-12 text-slate-600">Aucune FAQ trouvée. Créez-en une !</div>
          ) : (
            <div className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.id} className={`p-6 rounded-2xl border-2 ${item.is_active ? "border-slate-200 bg-white" : "border-slate-300 bg-slate-50 opacity-60"}`}>
                  {isEditing === item.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">Question *</label>
                        <input type="text" value={editingItem.question || item.question} onChange={(e) => setEditingItem({ ...editingItem, question: e.target.value })} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-red-600/20 focus:border-red-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">Réponse *</label>
                        <textarea value={editingItem.answer || item.answer} onChange={(e) => setEditingItem({ ...editingItem, answer: e.target.value })} rows={4} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-red-600/20 focus:border-red-600 resize-none" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-bold text-slate-900 mb-2">Ordre</label>
                          <input type="number" value={editingItem.order !== undefined ? editingItem.order : item.order} onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-red-600/20 focus:border-red-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-8">
                          <input type="checkbox" checked={editingItem.is_active !== undefined ? editingItem.is_active : item.is_active} onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })} className="w-5 h-5 text-red-600 rounded" />
                          <label className="text-sm font-bold text-slate-900">Active</label>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleUpdate(item.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                          <Save size={20} />
                          Enregistrer
                        </button>
                        <button onClick={() => { setIsEditing(null); setEditingItem({}); }} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl transition-all">
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-black text-slate-900 mb-2">{item.question}</h4>
                          <p className="text-slate-700 whitespace-pre-wrap">{item.answer}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                            <span>Ordre: {item.order}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {item.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setIsEditing(item.id); setEditingItem({ question: item.question, answer: item.answer, order: item.order, is_active: item.is_active }); }} className="p-2 bg-blue-100 text-blue-800 rounded-xl hover:bg-blue-200 transition-colors" title="Modifier">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleToggleActive(item.id, item.is_active)} className={`p-2 rounded-xl transition-colors ${item.is_active ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-green-100 text-green-800 hover:bg-green-200"}`} title={item.is_active ? "Désactiver" : "Activer"}>
                            {item.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-100 text-red-800 rounded-xl hover:bg-red-200 transition-colors" title="Supprimer">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant Articles Tab (complet)
function ArticlesTab() {
  const { showToast } = useToast();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setIsLoading(true);
        const fetchedArticles = await getAllArticles();
        setArticles(fetchedArticles);
      } catch (error) {
        console.error("Erreur chargement articles:", error);
        showToast("Erreur lors du chargement des articles", "error");
      } finally {
        setIsLoading(false);
      }
    };
    loadArticles();
  }, [showToast]);

  const handleToggleStatus = async (articleId: string, currentStatus: string) => {
    setUpdatingIds((prev) => new Set(prev).add(articleId));
    try {
      const supabase = createClient();
      const newStatus = currentStatus === "published" ? "draft" : "published";
      const { error } = await supabase.from("articles").update({ status: newStatus }).eq("id", articleId);
      if (error) throw error;
      setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, status: newStatus as any } : a)));
      showToast(`Article ${newStatus === "published" ? "publié" : "dépublié"} !`, "success");
      router.refresh();
    } catch (error: any) {
      console.error("Erreur changement statut:", error);
      showToast(error?.message || "Erreur lors du changement de statut", "error");
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(articleId);
        return newSet;
      });
    }
  };

  const handleDelete = async (articleId: string, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'article "${title}" ?`)) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("articles").delete().eq("id", articleId);
      if (error) throw error;
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      showToast("Article supprimé !", "success");
    } catch (error) {
      console.error("Erreur suppression:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
            <BookOpen className="text-red-600" size={28} />
            Gestion des Articles ({articles.length})
          </h2>
          <Link href="/admin/articles/new" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all">
            <Plus size={20} />
            Nouvel Article
          </Link>
        </div>
      </header>

      <div className="p-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={48} className="animate-spin text-red-600" />
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-xl shadow-slate-100/50 border-0">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Aucun article pour le moment</h3>
            <p className="text-slate-600">Créez votre premier article pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-black text-slate-900 mb-2">{article.title}</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Slug: <code className="bg-slate-100 px-2 py-1 rounded">{article.slug}</code>
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{new Date(article.created_at).toLocaleDateString("fr-BE")}</span>
                    <span className={`px-3 py-1 rounded-full font-bold ${article.status === "published" ? "bg-green-100 text-green-800" : article.status === "draft" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                      {article.status === "published" ? "Publié" : article.status === "draft" ? "Brouillon" : "Archivé"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleStatus(article.id, article.status)} disabled={updatingIds.has(article.id)} className={`p-3 rounded-xl font-bold transition-colors ${updatingIds.has(article.id) ? "bg-slate-200 text-slate-500 cursor-not-allowed" : article.status === "published" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-green-100 text-green-800 hover:bg-green-200"}`} title={article.status === "published" ? "Dépublier" : "Publier"}>
                    {updatingIds.has(article.id) ? <Loader2 size={20} className="animate-spin" /> : article.status === "published" ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {article.status === "published" ? (
                    <Link href={`/recits/${article.slug}`} target="_blank" className="p-3 bg-blue-100 text-blue-800 rounded-xl hover:bg-blue-200 transition-colors" title="Voir l'article">
                      <Eye size={20} />
                    </Link>
                  ) : (
                    <button disabled className="p-3 bg-slate-100 text-slate-400 rounded-xl cursor-not-allowed" title="L'article doit être publié pour être visible">
                      <Eye size={20} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(article.id, article.title)} className="p-3 bg-red-100 text-red-800 rounded-xl hover:bg-red-200 transition-colors" title="Supprimer">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
