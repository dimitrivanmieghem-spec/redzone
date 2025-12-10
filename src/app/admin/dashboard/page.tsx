"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  Car,
  Users,
  TrendingUp,
  Settings as SettingsIcon,
  FileText,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { useVehicules } from "@/hooks/useVehicules";
import { approveVehicule, rejectVehicule, deleteVehicule } from "@/lib/supabase/vehicules";
import { getAdminStats } from "@/lib/supabase/settings";
import { Vehicule } from "@/lib/supabase/types";
import { getPendingComments, approveComment, rejectComment, CommentWithAuthor } from "@/lib/supabase/comments";
import { getAllArticles, Article } from "@/lib/supabase/articles";
import { createClient } from "@/lib/supabase/client";
import { logInfo, logError } from "@/lib/supabase/logs";

export default function AdminDashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pending" | "active" | "rejected" | "comments" | "posts">("pending");
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
  
  // IMPORTANT : Toujours appeler useVehicules au même endroit (règle des hooks)
  // Récupérer TOUS les véhicules une seule fois, puis filtrer côté client
  const { vehicules: allVehiculesFromHook, isLoading: vehiculesLoading } = useVehicules({});
  
  // État local pour gérer les mises à jour instantanées
  const [allVehicules, setAllVehicules] = useState<Vehicule[]>([]);
  
  // Synchroniser l'état local avec les données du hook
  useEffect(() => {
    setAllVehicules(allVehiculesFromHook);
  }, [allVehiculesFromHook]);

  // Protection : Rediriger si non admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      showToast("Accès refusé - Administrateur uniquement", "error");
      router.push("/");
    }
  }, [user, isLoading, router, showToast]);

  // Charger les stats admin
  useEffect(() => {
    const loadStats = async () => {
      if (user && user.role === "admin") {
        try {
          setStatsLoading(true);
          const adminStats = await getAdminStats();
          if (adminStats) {
            setStats(adminStats);
          }
        } catch (error) {
          console.error("Erreur chargement stats:", error);
        } finally {
          setStatsLoading(false);
        }
      }
    };

    loadStats();
  }, [user]);

  // Charger les commentaires en attente
  useEffect(() => {
    const loadComments = async () => {
      if (user && user.role === "admin" && activeTab === "comments") {
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
  }, [user, activeTab, showToast]);

  // Charger les posts UGC en attente
  useEffect(() => {
    const loadPosts = async () => {
      if (user && user.role === "admin" && activeTab === "posts") {
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
  }, [user, activeTab, showToast]);

  // Filtrer les véhicules selon l'onglet actif (côté client)
  const vehicules = allVehicules.filter((v) => v.status === activeTab);
  
  // Stats (depuis la base de données ou calculées depuis allVehicules en fallback)
  const pendingCount = stats?.pending_vehicles ?? allVehicules.filter((v) => v.status === "pending").length;
  const activeCount = stats?.active_vehicles ?? allVehicules.filter((v) => v.status === "active").length;
  const rejectedCount = stats?.rejected_vehicles ?? allVehicules.filter((v) => v.status === "rejected").length;

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </main>
    );
  }

  // Si pas admin, ne rien afficher (redirection en cours)
  if (!user || user.role !== "admin") {
    return null;
  }

  const handleApprove = async (id: string) => {
    // Sauvegarder l'état précédent pour rollback en cas d'erreur
    const previousVehicules = [...allVehicules];
    const vehicule = allVehicules.find((v) => v.id === id);
    
    try {
      // 1. Mise à jour immédiate de l'état local (disparition instantanée)
      setAllVehicules((prev) => prev.filter((v) => v.id !== id));
      
      // 2. Appel Supabase
      await approveVehicule(id);
      
      // 3. Log de succès
      await logInfo(
        `Ad [${id}] validated successfully by Admin [${user.id}]`,
        user.id,
        {
          vehicule_id: id,
          marque: vehicule?.marque || null,
          modele: vehicule?.modele || null,
          action: "approve",
        }
      );
      
      // 4. Mise à jour des stats
      const adminStats = await getAdminStats();
      if (adminStats) {
        setStats(adminStats);
      }
      
      // 5. Toast de succès
      showToast("Annonce validée ! ✓", "success");
      
      // 6. Synchroniser avec le serveur en arrière-plan
      router.refresh();
    } catch (error: any) {
      console.error("Erreur approbation:", error);
      
      // Log de l'erreur
      await logError(
        `Validation failed for Ad [${id}] by Admin [${user.id}]: ${error?.message || "Unknown error"}`,
        user.id,
        {
          vehicule_id: id,
          error_message: error?.message || "Unknown error",
          error_code: error?.code || null,
          action: "approve",
        }
      );
      
      showToast(error instanceof Error ? error.message : "Erreur lors de l'approbation", "error");
      
      // En cas d'erreur, restaurer l'état précédent
      setAllVehicules(previousVehicules);
    }
  };

  const handleReject = async (id: string) => {
    // Sauvegarder l'état précédent pour rollback en cas d'erreur
    const previousVehicules = [...allVehicules];
    const vehicule = allVehicules.find((v) => v.id === id);
    
    try {
      // 1. Mise à jour immédiate de l'état local (disparition instantanée)
      setAllVehicules((prev) => prev.filter((v) => v.id !== id));
      
      // 2. Appel Supabase
      await rejectVehicule(id);
      
      // 3. Log de succès
      await logInfo(
        `Ad [${id}] rejected by Admin [${user.id}]`,
        user.id,
        {
          vehicule_id: id,
          marque: vehicule?.marque || null,
          modele: vehicule?.modele || null,
          action: "reject",
        }
      );
      
      // 4. Mise à jour des stats
      const adminStats = await getAdminStats();
      if (adminStats) {
        setStats(adminStats);
      }
      
      // 5. Toast de succès
      showToast("Annonce rejetée ✓", "success");
      
      // 6. Synchroniser avec le serveur en arrière-plan
      router.refresh();
    } catch (error: any) {
      console.error("Erreur rejet:", error);
      
      // Log de l'erreur
      await logError(
        `Rejection failed for Ad [${id}] by Admin [${user.id}]: ${error?.message || "Unknown error"}`,
        user.id,
        {
          vehicule_id: id,
          error_message: error?.message || "Unknown error",
          error_code: error?.code || null,
          action: "reject",
        }
      );
      
      showToast(error instanceof Error ? error.message : "Erreur lors du rejet", "error");
      
      // En cas d'erreur, restaurer l'état précédent
      setAllVehicules(previousVehicules);
    }
  };

  const handleLogout = () => {
    logout();
    showToast("Déconnexion administrateur", "success");
    router.push("/");
  };


  return (
    <main className="min-h-screen bg-slate-900 flex">
      {/* Sidebar sombre */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        {/* Logo et titre */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center hover:scale-105 transition-transform">
              <LayoutDashboard size={20} className="text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Back-Office</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/admin/dashboard"
            className="w-full flex items-center gap-3 px-4 py-3 bg-slate-700 text-white rounded-2xl font-bold transition-all"
          >
            <LayoutDashboard size={18} />
            Modération
          </Link>
          <Link
            href="/admin/cars"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-2xl font-bold transition-all"
          >
            <Car size={18} />
            Garage (Stock)
          </Link>
          <Link
            href="/admin/settings"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-2xl font-bold transition-all"
          >
            <SettingsIcon size={18} />
            Réglages
          </Link>
          <Link
            href="/admin/users"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-2xl font-bold transition-all"
          >
            <Users size={18} />
            Utilisateurs
          </Link>
          <Link
            href="/admin/content"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-2xl font-bold transition-all"
          >
            <FileText size={18} />
            Contenu (FAQ)
          </Link>
          <Link
            href="/admin/articles"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-2xl font-bold transition-all"
          >
            <FileText size={18} />
            Articles (Blog)
          </Link>
        </nav>

        {/* Séparateur */}
        <div className="border-t border-slate-700 my-4" />

        {/* Onglets Modération */}
        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
              activeTab === "pending"
                ? "bg-red-600 text-slate-900"
                : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            <AlertCircle size={20} />
            <span>À valider</span>
            {pendingCount > 0 && (
              <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${
                activeTab === "pending" ? "bg-slate-900 text-red-500" : "bg-red-600 text-slate-900"
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("active")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
              activeTab === "active"
                ? "bg-red-600 text-slate-900"
                : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            <CheckCircle size={20} />
            <span>Actives</span>
            <span className="ml-auto text-xs">{activeCount}</span>
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
              activeTab === "rejected"
                ? "bg-red-600 text-slate-900"
                : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            <XCircle size={20} />
            <span>Rejetées</span>
            <span className="ml-auto text-xs">{rejectedCount}</span>
          </button>

          <button
            onClick={() => setActiveTab("comments")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
              activeTab === "comments"
                ? "bg-red-600 text-slate-900"
                : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            <MessageSquare size={20} />
            <span>Commentaires</span>
            {pendingComments.length > 0 && (
              <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${
                activeTab === "comments" ? "bg-slate-900 text-red-500" : "bg-red-600 text-slate-900"
              }`}>
                {pendingComments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("posts")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all ${
              activeTab === "posts"
                ? "bg-red-600 text-slate-900"
                : "text-slate-300 hover:bg-slate-700"
            }`}
          >
            <FileText size={20} />
            <span>Posts Tribune</span>
            {pendingPosts.length > 0 && (
              <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full ${
                activeTab === "posts" ? "bg-slate-900 text-red-500" : "bg-red-600 text-slate-900"
              }`}>
                {pendingPosts.length}
              </span>
            )}
          </button>
        </nav>

        {/* Stats rapides */}
        <div className="p-4 border-t border-slate-700 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-2">
              <Car size={16} />
              Total annonces
            </span>
            <span className="text-white font-bold">
              {statsLoading ? "..." : (stats?.total_vehicles ?? allVehicules.length)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-2">
              <Users size={16} />
              Utilisateurs
            </span>
            <span className="text-white font-bold">
              {statsLoading ? "..." : (stats?.total_users ?? 0)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-2">
              <TrendingUp size={16} />
              Actives
            </span>
            <span className="text-white font-bold">
              {statsLoading ? "..." : activeCount}
            </span>
          </div>
        </div>

        {/* Alerte Stockage Supabase (à partir de 50 annonces) */}
        {!statsLoading && (stats?.total_vehicles ?? allVehicules.length) >= 50 && (
          <div className="p-4 border-t border-slate-700">
            <div className="bg-amber-900/30 border-2 border-amber-600 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-400 mb-1">
                    📊 Vérification Stockage Recommandée
                  </p>
                  <p className="text-xs text-amber-300 leading-relaxed">
                    Le site a atteint <strong>{stats?.total_vehicles ?? allVehicules.length} annonces</strong>.
                    Vérifiez manuellement l&apos;utilisation du stockage Supabase (bucket files) dans le dashboard Supabase pour éviter les dépassements de quota.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User et logout */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <Image
              src={user.avatar}
              alt={user.name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.name}
              </p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-medium transition-all"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 bg-white">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
            {activeTab === "pending" && (
              <>
                <AlertCircle className="text-red-600" size={28} />
                Annonces à valider
              </>
            )}
            {activeTab === "active" && (
              <>
                <CheckCircle className="text-green-500" size={28} />
                Annonces actives
              </>
            )}
            {activeTab === "rejected" && (
              <>
                <XCircle className="text-red-500" size={28} />
                Annonces rejetées
              </>
            )}
            {activeTab === "comments" && (
              <>
                <MessageSquare className="text-red-600" size={28} />
                Modération des Commentaires
              </>
            )}
            {activeTab === "posts" && (
              <>
                <FileText className="text-red-600" size={28} />
                Modération des Posts Tribune
              </>
            )}
            {activeTab !== "comments" && activeTab !== "posts" && (
              <span className="text-slate-900 text-lg font-normal">
                ({vehicules.length})
              </span>
            )}
            {activeTab === "comments" && (
              <span className="text-slate-900 text-lg font-normal">
                ({pendingComments.length})
              </span>
            )}
            {activeTab === "posts" && (
              <span className="text-slate-900 text-lg font-normal">
                ({pendingPosts.length})
              </span>
            )}
          </h2>
        </header>

        {/* Liste des commentaires en attente */}
        {activeTab === "comments" && (
          <div className="p-8">
            {isLoadingComments ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : pendingComments.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-xl shadow-slate-100/50 border-0">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Aucun commentaire en attente
                </h3>
                <p className="text-slate-600">
                  Tous les commentaires ont été traités.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-slate-900">
                            {comment.author?.full_name || comment.author?.email?.split("@")[0] || "Utilisateur"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(comment.created_at).toLocaleDateString("fr-BE", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-slate-700 mb-3 leading-relaxed whitespace-pre-wrap">
                          {comment.content}
                        </p>
                        {comment.article && (
                          <div className="bg-slate-50 rounded-xl p-3 mb-3">
                            <p className="text-xs text-slate-600 mb-1">Article :</p>
                            <Link
                              href={`/tribune/${comment.article.slug}`}
                              target="_blank"
                              className="text-sm font-bold text-red-600 hover:text-red-700"
                            >
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
                            // Log de l'action
                            logInfo(
                              `Comment ${comment.id} approved by Admin ${user?.id}`,
                              user?.id,
                              {
                                comment_id: comment.id,
                                article_id: comment.article_id,
                                article_title: comment.article?.title,
                                action: "approve",
                              }
                            );
                            router.refresh();
                          } catch (error) {
                            console.error("Erreur approbation:", error);
                            showToast("Erreur lors de l'approbation", "error");
                            logError(
                              `Comment approval failed for ${comment.id} by Admin ${user?.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
                              user?.id,
                              {
                                comment_id: comment.id,
                                article_id: comment.article_id,
                                action: "approve",
                                error_message: error instanceof Error ? error.message : "Unknown error",
                              }
                            );
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
                            // Log de l'action
                            logInfo(
                              `Comment ${comment.id} rejected by Admin ${user?.id}`,
                              user?.id,
                              {
                                comment_id: comment.id,
                                article_id: comment.article_id,
                                article_title: comment.article?.title,
                                action: "reject",
                              }
                            );
                            router.refresh();
                          } catch (error) {
                            console.error("Erreur rejet:", error);
                            showToast("Erreur lors du rejet", "error");
                            logError(
                              `Comment rejection failed for ${comment.id} by Admin ${user?.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
                              user?.id,
                              {
                                comment_id: comment.id,
                                article_id: comment.article_id,
                                action: "reject",
                                error_message: error instanceof Error ? error.message : "Unknown error",
                              }
                            );
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

        {/* Liste des posts UGC en attente */}
        {activeTab === "posts" && (
          <div className="p-8">
            {isLoadingPosts ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            ) : pendingPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-xl shadow-slate-100/50 border-0">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Aucun post en attente
                </h3>
                <p className="text-slate-600">
                  Tous les posts de la Tribune ont été traités.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      {post.main_image_url && (
                        <img
                          src={post.main_image_url}
                          alt={post.title}
                          className="w-32 h-32 object-cover rounded-xl"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-black text-slate-900">
                            {post.title}
                          </h3>
                          {post.post_type === "question" && (
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                              Question
                            </span>
                          )}
                          {post.post_type === "presentation" && (
                            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">
                              Présentation
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mb-3">
                          {new Date(post.created_at).toLocaleDateString("fr-BE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-slate-700 mb-3 leading-relaxed line-clamp-3">
                          {post.content.substring(0, 200)}...
                        </p>
                        <p className="text-xs text-slate-500">
                          Slug: <code className="bg-slate-100 px-2 py-1 rounded">{post.slug}</code>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          try {
                            const supabase = createClient();
                            const { error } = await supabase
                              .from("articles")
                              .update({ status: "published" })
                              .eq("id", post.id);

                            if (error) throw error;

                            showToast("Post approuvé et publié !", "success");
                            setPendingPosts((prev) => prev.filter((p) => p.id !== post.id));
                            logInfo(
                              `Post ${post.id} approved by Admin ${user?.id}`,
                              user?.id,
                              {
                                post_id: post.id,
                                post_type: post.post_type,
                                title: post.title,
                                action: "approve",
                              }
                            );
                            router.refresh();
                          } catch (error) {
                            console.error("Erreur approbation:", error);
                            showToast("Erreur lors de l'approbation", "error");
                            logError(
                              `Post approval failed for ${post.id} by Admin ${user?.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
                              user?.id,
                              {
                                post_id: post.id,
                                action: "approve",
                                error_message: error instanceof Error ? error.message : "Unknown error",
                              }
                            );
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
                            const { error } = await supabase
                              .from("articles")
                              .update({ status: "archived" })
                              .eq("id", post.id);

                            if (error) throw error;

                            showToast("Post rejeté.", "success");
                            setPendingPosts((prev) => prev.filter((p) => p.id !== post.id));
                            logInfo(
                              `Post ${post.id} rejected by Admin ${user?.id}`,
                              user?.id,
                              {
                                post_id: post.id,
                                post_type: post.post_type,
                                title: post.title,
                                action: "reject",
                              }
                            );
                            router.refresh();
                          } catch (error) {
                            console.error("Erreur rejet:", error);
                            showToast("Erreur lors du rejet", "error");
                            logError(
                              `Post rejection failed for ${post.id} by Admin ${user?.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
                              user?.id,
                              {
                                post_id: post.id,
                                action: "reject",
                                error_message: error instanceof Error ? error.message : "Unknown error",
                              }
                            );
                          }
                        }}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
                      >
                        <XCircle size={20} />
                        Rejeter
                      </button>
                      <Link
                        href={`/tribune/${post.slug}`}
                        target="_blank"
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl transition-all"
                      >
                        Voir le post
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Liste des véhicules */}
        {activeTab !== "comments" && activeTab !== "posts" && (
        <div className="p-8">
              {vehiculesLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                </div>
              ) : vehicules.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-xl shadow-slate-100/50 border-0">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Aucune annonce {activeTab === "pending" ? "en attente" : activeTab === "active" ? "active" : "rejetée"}
              </h3>
              <p className="text-slate-900">
                {activeTab === "pending" && "Toutes les annonces ont été traitées."}
                {activeTab === "active" && "Aucune annonce n'est actuellement en ligne."}
                {activeTab === "rejected" && "Aucune annonce n'a été rejetée."}
              </p>
            </div>
              ) : (
                <div className="space-y-4">
                  {vehicules.map((vehicule) => (
                <div
                  key={vehicule.id}
                  className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="w-32 h-24 bg-slate-200 rounded-2xl overflow-hidden flex-shrink-0 relative">
                    <Image
                      src={vehicule.image}
                      alt={`${vehicule.marque} ${vehicule.modele}`}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {vehicule.marque} {vehicule.modele}
                        </h3>
                        <p className="text-sm text-slate-900">
                          {vehicule.annee || 'N/A'} • {vehicule.km ? vehicule.km.toLocaleString("fr-BE") : 'N/A'} km •{" "}
                          {vehicule.carburant || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          {vehicule.prix ? vehicule.prix.toLocaleString("fr-BE") : 'N/A'} €
                        </p>
                      </div>
                    </div>

                    {/* Badges techniques */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {vehicule.is_manual_model && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse">
                          ⚠️ Modèle Inconnu
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-900 text-xs font-medium rounded">
                        {vehicule.transmission}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-900 text-xs font-medium rounded">
                        {vehicule.carrosserie}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:scale-105 transition-transform">
                        {vehicule.norme_euro.toUpperCase()}
                      </span>
                      {vehicule.car_pass && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                          ✓ Car-Pass
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                        {vehicule.puissance} ch
                      </span>
                    </div>

                    {/* Actions (uniquement pour pending) */}
                    {activeTab === "pending" && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleApprove(vehicule.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-medium transition-all"
                        >
                          <CheckCircle size={16} />
                          Approuver
                        </button>
                        <button
                          onClick={() => handleReject(vehicule.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-medium transition-all"
                        >
                          <XCircle size={16} />
                          Rejeter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
                </div>
              )}
        </div>
        )}
      </div>
    </main>
  );
}

