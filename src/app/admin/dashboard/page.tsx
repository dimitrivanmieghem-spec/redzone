"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  AlertCircle,
  Users,
  Car,
  TrendingUp,
  BarChart3,
  CheckCircle,
  XCircle,
  Loader2,
  MessageSquare,
  FileText,
  Power,
  PowerOff,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { approveVehicule, rejectVehicule } from "@/lib/supabase/server-actions/vehicules";
import { getAdminStats, getSiteSettings } from "@/lib/supabase/settings";
import { updateSiteSettings } from "@/lib/supabase/server-actions/settings";
import { Vehicule } from "@/lib/supabase/types";
import { logInfo, logError } from "@/lib/supabase/logs";
import { getPendingComments, CommentWithAuthor } from "@/lib/supabase/comments";
import { approveComment, rejectComment } from "@/lib/supabase/server-actions/comments";
import { getAllArticles, Article } from "@/lib/supabase/articles";
import { useVehicules } from "@/hooks/useVehicules";
import { approveArticle, rejectArticle } from "@/lib/supabase/server-actions/articles";
import { LucideIcon } from "lucide-react";

// Composant StatCard réutilisable pour les cartes de statistiques
interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: "amber" | "blue" | "green" | "purple" | "red";
  isLoading?: boolean;
}

function StatCard({ title, value, icon: Icon, color, isLoading }: StatCardProps) {
  const colorClasses = {
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      border: "border-amber-500/20",
    },
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      border: "border-blue-500/20",
    },
    green: {
      bg: "bg-green-500/10",
      text: "text-green-500",
      border: "border-green-500/20",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-500",
      border: "border-purple-500/20",
    },
    red: {
      bg: "bg-red-500/10",
      text: "text-red-500",
      border: "border-red-500/20",
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 hover:border-neutral-700 transition-all">
      <div className={`w-12 h-12 ${colors.bg} rounded-2xl flex items-center justify-center mb-4 border ${colors.border}`}>
        <Icon className={colors.text} size={24} />
      </div>
      <h3 className="text-sm font-medium text-neutral-400 mb-1">{title}</h3>
      <p className="text-3xl font-black text-white">{isLoading ? "..." : value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
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
      await logInfo(`Ad [${id}] validated successfully by Admin [${user?.id}]`, user?.id, { vehicule_id: id, brand: vehicule?.brand || null, model: vehicule?.model || null, action: "approve" });
      const adminStats = await getAdminStats();
      if (adminStats) setStats(adminStats);
      showToast("Annonce validée ! ✓", "success");
      startTransition(() => { router.refresh(); });
    } catch (error: any) {
      setAllVehicules(previousVehicules);
      await logError(`Validation failed for Ad [${id}] by Admin [${user?.id}]: ${error?.message || "Unknown error"}`, user?.id, { vehicule_id: id, error_message: error?.message || "Unknown error", action: "approve" });
      showToast(error instanceof Error ? error.message : "Erreur lors de l'approbation", "error");
    }
  };

  const handleReject = async (id: string) => {
    const previousVehicules = [...allVehicules];
    const vehicule = allVehicules.find((v) => v.id === id);
    try {
      setAllVehicules((prev) => prev.filter((v) => v.id !== id));
      await rejectVehicule(id);
      await logInfo(`Ad [${id}] rejected by Admin [${user?.id}]`, user?.id, { vehicule_id: id, brand: vehicule?.brand || null, model: vehicule?.model || null, action: "reject" });
      const adminStats = await getAdminStats();
      if (adminStats) setStats(adminStats);
      showToast("Annonce rejetée ✓", "success");
      startTransition(() => { router.refresh(); });
    } catch (error: any) {
      setAllVehicules(previousVehicules);
      await logError(`Rejection failed for Ad [${id}] by Admin [${user?.id}]: ${error?.message || "Unknown error"}`, user?.id, { vehicule_id: id, error_message: error?.message || "Unknown error", action: "reject" });
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
    <div className="min-h-screen bg-neutral-950">
      <header className="bg-neutral-950 border-b border-white/10 px-8 py-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
          <LayoutDashboard className="text-red-600" size={28} />
          Tableau de Bord
        </h2>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Annonces en attente"
            value={stats?.pending_vehicles ?? 0}
            icon={AlertCircle}
            color="amber"
            isLoading={statsLoading}
          />
          <StatCard
            title="Utilisateurs inscrits"
            value={stats?.total_users ?? 0}
            icon={Users}
            color="blue"
            isLoading={statsLoading}
          />
          <StatCard
            title="Annonces actives"
            value={stats?.active_vehicles ?? 0}
            icon={TrendingUp}
            color="green"
            isLoading={statsLoading}
          />
          <StatCard
            title="Total annonces"
            value={stats?.total_vehicles ?? 0}
            icon={Car}
            color="purple"
            isLoading={statsLoading}
          />
        </div>

        {/* Graphiques visuels des statistiques */}
        {stats && !statsLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Graphique en barres - Statut des annonces */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <BarChart3 className="text-red-600" size={24} />
                Répartition des annonces
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-400">Actives</span>
                    <span className="text-sm font-black text-white">{stats.active_vehicles}</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-3">
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
                    <span className="text-sm font-medium text-neutral-400">En attente</span>
                    <span className="text-sm font-black text-white">{stats.pending_vehicles}</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-3">
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
                    <span className="text-sm font-medium text-neutral-400">Rejetées</span>
                    <span className="text-sm font-black text-white">{stats.rejected_vehicles}</span>
                  </div>
                  <div className="w-full bg-neutral-800 rounded-full h-3">
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
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <TrendingUp className="text-blue-500" size={24} />
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
                      className="text-neutral-800"
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
                    <p className="text-3xl font-black text-white">{stats.active_vehicles}</p>
                    <p className="text-sm text-neutral-400">Annonces actives</p>
                    <p className="text-xs text-neutral-500 mt-1">sur {stats.total_vehicles} total</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-neutral-800 rounded-xl border border-neutral-700">
                  <p className="text-2xl font-black text-white">{stats.total_users}</p>
                  <p className="text-xs text-neutral-400">Utilisateurs</p>
                </div>
                <div className="text-center p-4 bg-neutral-800 rounded-xl border border-neutral-700">
                  <p className="text-2xl font-black text-white">
                    {stats.total_users > 0 ? Math.round((stats.total_vehicles / stats.total_users) * 10) / 10 : 0}
                  </p>
                  <p className="text-xs text-neutral-400">Annonces/user</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglets de modération */}
        <div className="mb-6 flex items-center gap-2 border-b border-white/10">
          {(["pending", "active", "rejected", "comments", "posts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-6 py-3 font-bold transition-all border-b-2 ${
                activeSubTab === tab
                  ? "border-red-600 text-red-400"
                  : "border-transparent text-neutral-400 hover:text-white"
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
              <div className="text-center py-12 bg-neutral-900 rounded-2xl border border-neutral-800">
                <CheckCircle className="text-green-600 mx-auto mb-4" size={48} />
                <p className="text-neutral-400 font-medium">Aucune annonce en attente</p>
              </div>
            ) : (
              vehicules.map((vehicule) => (
                <div key={vehicule.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 hover:border-neutral-700 transition-all">
                  <div className="flex items-start gap-6">
                    <div className="w-32 h-24 bg-neutral-800 rounded-xl overflow-hidden relative flex-shrink-0">
                      <Image src={vehicule.image} alt={`${vehicule.brand || 'Véhicule'} ${vehicule.model || ''}`} fill sizes="128px" className="object-cover" loading="lazy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-black text-white">{vehicule.brand || 'N/A'} {vehicule.model || ''}</h3>
                          <p className="text-sm text-neutral-400">{vehicule.year || 'N/A'} • {vehicule.mileage ? vehicule.mileage.toLocaleString("fr-BE") : 'N/A'} km • {vehicule.fuel_type || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-extrabold text-white tracking-tight">{vehicule.price ? vehicule.price.toLocaleString("fr-BE") : 'N/A'} €</p>
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
                        <Link href={`/cars/${vehicule.id}`} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all border border-neutral-700">
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
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-12 text-center">
                <MessageSquare size={48} className="text-neutral-500 mx-auto mb-4" />
                <h3 className="text-lg font-black text-white mb-2">Aucun commentaire en attente</h3>
                <p className="text-neutral-400">Tous les commentaires ont été traités.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingComments.map((comment) => (
                  <div key={comment.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 hover:border-neutral-700 transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-black text-white">{comment.author?.full_name || comment.author?.email?.split("@")[0] || "Utilisateur"}</span>
                          <span className="text-xs text-neutral-500">{new Date(comment.created_at).toLocaleDateString("fr-BE", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-neutral-300 mb-3 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                        {comment.article && (
                          <div className="bg-neutral-800 rounded-xl p-3 mb-3 border border-neutral-700">
                            <p className="text-xs text-neutral-500 mb-1">Article :</p>
                            <Link href={`/tribune/${comment.article.slug}`} target="_blank" className="text-sm font-black text-red-500 hover:text-red-400">
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
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-12 text-center">
                <FileText size={48} className="text-neutral-500 mx-auto mb-4" />
                <h3 className="text-lg font-black text-white mb-2">Aucun post en attente</h3>
                <p className="text-neutral-400">Tous les posts de la Tribune ont été traités.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPosts.map((post) => (
                  <div key={post.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 hover:border-neutral-700 transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      {post.main_image_url && (
                        <img src={post.main_image_url} alt={post.title} className="w-32 h-32 object-cover rounded-xl border border-neutral-700" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-black text-white">{post.title}</h3>
                          {post.post_type === "question" && (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black px-3 py-1 rounded-full">Question</span>
                          )}
                          {post.post_type === "presentation" && (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black px-3 py-1 rounded-full">Présentation</span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mb-3">{new Date(post.created_at).toLocaleDateString("fr-BE", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        <p className="text-neutral-300 mb-3 leading-relaxed line-clamp-3">{post.content.substring(0, 200)}...</p>
                        <p className="text-xs text-neutral-500">Slug: <code className="bg-neutral-800 px-2 py-1 rounded border border-neutral-700 text-neutral-300">{post.slug}</code></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          try {
                            await approveArticle(post.id);
                            setPendingPosts((prev) => prev.filter((p) => p.id !== post.id));
                            showToast("Post approuvé !", "success");
                            router.refresh();
                          } catch (error: any) {
                            console.error("Erreur approbation:", error);
                            showToast(error?.message || "Erreur lors de l'approbation", "error");
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
                            await rejectArticle(post.id);
                            setPendingPosts((prev) => prev.filter((p) => p.id !== post.id));
                            showToast("Post rejeté.", "success");
                            router.refresh();
                          } catch (error: any) {
                            console.error("Erreur rejet:", error);
                            showToast(error?.message || "Erreur lors du rejet", "error");
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

        {user?.role === "admin" && (
          <div className="mt-8 bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${maintenanceMode ? "bg-red-500/10 border-red-500/30" : "bg-green-500/10 border-green-500/30"}`}>
                  {maintenanceMode ? <AlertTriangle className="text-red-500" size={32} /> : <Power className="text-green-500" size={32} />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white mb-1">Mode Maintenance</h3>
                  <p className="text-sm text-neutral-400">{maintenanceMode ? "Le site est actuellement en mode maintenance" : "Le site est actuellement accessible"}</p>
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

