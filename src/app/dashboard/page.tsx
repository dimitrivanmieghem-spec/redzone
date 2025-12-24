"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Car,
  Heart,
  MessageSquare,
  Settings,
  Building2,
  BarChart3,
  Users,
  Bell,
  BellRing,
  CheckCircle,
  Loader2,
  X,
  LogOut,
  Gauge,
  AlertTriangle,
  FileText,
  HelpCircle,
  Clock,
  Send,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { useBanSimulation } from "@/contexts/BanSimulationContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useVehicules } from "@/hooks/useVehicules";
import CarCard from "@/components/features/vehicles/car-card";
import MyAds from "@/components/features/vehicles/my-ads";
import NotificationsPanel from "@/components/NotificationsPanel";
import { getAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/supabase/notifications";
import type { Notification } from "@/lib/supabase/notifications";
import { updateProfile, UpdateProfileData } from "@/app/actions/profile";
import { uploadAvatar } from "@/lib/supabase/avatar-upload";
import { getUserTickets } from "@/lib/supabase/tickets";
import type { UserTicket } from "@/lib/supabase/tickets";
import { createTicket, addUserReply } from "@/app/actions/tickets";
import { createClient } from "@/lib/supabase/client";
import { getUserConversations, markConversationAsRead } from "@/lib/supabase/conversations";
import { getMessages } from "@/lib/supabase/messages";
import { sendMessageWithNotification } from "@/app/actions/messages";
import type { Conversation } from "@/lib/supabase/conversations";
import type { Message } from "@/lib/supabase/messages";
import ConversationsList from "@/components/features/messages/ConversationsList";
import MessageThread from "@/components/features/messages/MessageThread";
import MessageInput from "@/components/features/messages/MessageInput";

type TabType = "garage" | "favorites" | "messages" | "settings" | "support" | "sentinelle" | "vitrine" | "stats" | "equipe";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const { showToast } = useToast();
  const { isSimulatingBan } = useBanSimulation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("garage");
  const [isPending, startTransition] = useTransition();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Rediriger vers login si non connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [user, isLoading, router]);

  // Lire le paramètre tab depuis l'URL
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["garage", "favorites", "messages", "settings", "support", "sentinelle", "vitrine", "stats", "equipe"].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  // Charger les notifications
  useEffect(() => {
    if (!user) return;
    const loadNotifications = async () => {
      try {
        setIsLoadingNotifications(true);
        const allNotifications = await getAllNotifications(10);
        setNotifications(allNotifications);
      } catch (error) {
        console.error("Erreur chargement notifications:", error);
      } finally {
        setIsLoadingNotifications(false);
      }
    };
    loadNotifications();
  }, [user]);

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const unreadCount = unreadNotifications.length;

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

  if (!user) {
    return null;
  }

  const isPro = user.role === "pro";
  const isParticulier = user.role === "particulier";

  // Définir les onglets selon le rôle
  const commonTabs = [
    { id: "garage" as TabType, label: "Mon Garage", icon: Car },
    { id: "favorites" as TabType, label: "Mes Favoris", icon: Heart },
    { id: "messages" as TabType, label: "Messages", icon: MessageSquare },
    { id: "support" as TabType, label: "Support", icon: HelpCircle },
    { id: "settings" as TabType, label: "Paramètres", icon: Settings },
  ];

  const proTabs = [
    { id: "vitrine" as TabType, label: "Ma Vitrine", icon: Building2 },
    { id: "stats" as TabType, label: "Statistiques", icon: BarChart3 },
    { id: "equipe" as TabType, label: "Mon Équipe", icon: Users },
  ];

  const particulierTabs = [
    { id: "sentinelle" as TabType, label: "Ma Sentinelle", icon: Bell },
  ];

  const tabs = [
    ...commonTabs,
    ...(isPro ? proTabs : []),
    ...(isParticulier ? particulierTabs : []),
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex">
      {/* Sidebar Premium */}
      <aside className="hidden lg:flex flex-col w-72 bg-[#0a0a0b]/95 backdrop-blur-xl border-r border-white/10">
        {/* Logo RedZone */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 group mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:shadow-red-900/50 transition-all duration-300 group-hover:scale-105">
              <Gauge className="text-white" size={24} />
            </div>
            <div>
              <span className="text-xl font-black text-white tracking-tight">
                Red<span className="text-red-500">Zone</span>
              </span>
              <p className="text-xs text-slate-400">Mon Espace</p>
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
            {user.is_founder && (
              <div className="group relative">
                <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 text-xs font-black uppercase rounded-full border border-yellow-500/40 flex items-center gap-1.5 cursor-default">
                  <Sparkles size={12} />
                  Membre Fondateur
                </span>
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 p-3 bg-neutral-900 border border-yellow-500/40 rounded-lg text-xs text-neutral-300 z-50 shadow-xl">
                  <p className="font-bold text-yellow-400 mb-1">Membre Fondateur</p>
                  <p>Vous faites partie des 500 premiers membres. Accès prioritaire aux fonctionnalités Pro à vie !</p>
                </div>
              </div>
            )}
            {isPro && (
              <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase rounded-full border border-blue-600/30">
                PRO
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
        {/* Header mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#0a0a0b]/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
              <Gauge className="text-white" size={16} />
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">
              Red<span className="text-red-500">Zone</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationsPanel />
            <div className="w-8 h-8 rounded-full border-2 border-white/20 overflow-hidden">
              <Image
                src={user.avatar}
                alt={user.name}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                priority
                loading="eager"
              />
            </div>
          </div>
        </header>

        {/* Navigation mobile - Tabs */}
        <div className="lg:hidden sticky top-[57px] z-20 bg-[#0a0a0b]/95 backdrop-blur-xl border-b border-white/10 overflow-x-auto">
          <div className="flex items-center gap-2 px-4 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-red-600/20 text-red-400 border border-red-600/30"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Zone de contenu */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          {/* Notification de ban */}
          {(user.is_banned || (isSimulatingBan && user.role === "admin")) && (
            <div className={`border-b-2 px-4 py-4 text-white ${
              isSimulatingBan && user.role === "admin"
                ? "bg-amber-900/90 border-amber-700"
                : "bg-red-900/90 border-red-700"
            }`}>
              <div className="max-w-7xl mx-auto flex items-center gap-3">
                <AlertTriangle size={24} className={`flex-shrink-0 ${
                  isSimulatingBan ? "text-amber-300" : "text-red-300"
                }`} />
                <div className="flex-1">
                  <p className="font-bold text-lg mb-1">
                    {isSimulatingBan && user.role === "admin" ? (
                      <>🧪 MODE TEST : Votre compte est suspendu (simulation)</>
                    ) : (
                      <>⚠️ Votre compte est suspendu</>
                    )}
                  </p>
                  <p className={`text-sm ${
                    isSimulatingBan ? "text-amber-200" : "text-red-200"
                  }`}>
                    {isSimulatingBan && user.role === "admin" ? (
                      <>Raison de test : Simulation de bannissement pour tester l'interface utilisateur</>
                    ) : (
                      <>
                        Raison : {user.ban_reason || "Non spécifiée"}
                        {user.ban_until && new Date(user.ban_until) > new Date() ? (
                          <span> • Fin de la suspension : {new Date(user.ban_until).toLocaleDateString("fr-BE", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}</span>
                        ) : user.ban_until ? (
                          <span> • Suspension expirée</span>
                        ) : (
                          <span> • Suspension définitive</span>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contenu des onglets */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            {activeTab === "garage" && <GarageTab user={user} notifications={notifications} unreadCount={unreadCount} showNotifications={showNotifications} setShowNotifications={setShowNotifications} isLoadingNotifications={isLoadingNotifications} />}
            {activeTab === "favorites" && <FavoritesTab />}
            {activeTab === "messages" && <MessagesTab />}
            {activeTab === "support" && <SupportTab user={user} />}
            {activeTab === "settings" && <SettingsTab user={user} />}
            {activeTab === "sentinelle" && <SentinelleTab user={user} />}
            {activeTab === "vitrine" && isPro && <VitrineTab user={user} />}
            {activeTab === "stats" && isPro && <StatsTab />}
            {activeTab === "equipe" && isPro && <EquipeTab />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Composant Garage Tab
function GarageTab({ user, notifications, unreadCount, showNotifications, setShowNotifications, isLoadingNotifications }: { user: any; notifications: Notification[]; unreadCount: number; showNotifications: boolean; setShowNotifications: (show: boolean) => void; isLoadingNotifications: boolean }) {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Mon Garage
          </h1>
          <p className="text-slate-400">
            Gérez vos annonces et suivez leurs performances
          </p>
        </div>
        <div className="hidden lg:block">
          <NotificationsPanel />
        </div>
      </div>

      {/* Bannière Notifications (si non lues) */}
      {unreadCount > 0 && !showNotifications && (
        <div className="mb-6 bg-red-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <BellRing size={24} className="animate-pulse" />
            <div>
              <p className="font-bold">
                {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""} notification{unreadCount > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-red-100">
                Une nouvelle annonce correspond à vos critères de recherche !
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNotifications(true)}
            className="bg-slate-800 text-red-500 font-bold px-4 py-2 rounded-xl hover:bg-red-900/20 transition-colors"
          >
            Voir
          </button>
        </div>
      )}

      {/* Liste des Notifications (si affichée) */}
      {showNotifications && (
        <div className="mb-8 bg-slate-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BellRing size={24} className="text-red-600" />
              Mes Notifications
            </h2>
            <button
              onClick={() => setShowNotifications(false)}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center"
            >
              <X size={20} className="text-slate-300" />
            </button>
          </div>

          {isLoadingNotifications ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-red-600" size={32} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-2xl border-2 ${
                    !notification.is_read
                      ? "bg-red-900/20 border-red-500/50"
                      : "bg-slate-800/50 border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-white">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-slate-300 mb-3">{notification.message}</p>
                      <div className="flex items-center gap-3">
                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={async () => {
                              if (!notification.is_read) {
                                await markNotificationAsRead(notification.id);
                              }
                            }}
                            className="text-sm text-red-600 hover:text-red-700 font-bold"
                          >
                            Voir l'annonce →
                          </Link>
                        )}
                        <span className="text-xs text-slate-400">
                          {new Date(notification.created_at).toLocaleDateString("fr-BE", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={async () => {
                          await markNotificationAsRead(notification.id);
                        }}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                        title="Marquer comme lu"
                      >
                        <CheckCircle size={20} className="text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section Mes Annonces */}
      <MyAds />
    </div>
  );
}

// Composant Favorites Tab
function FavoritesTab() {
  const { favorites, isLoading: isLoadingFavorites } = useFavorites();
  const { vehicules, isLoading: isLoadingVehicules } = useVehicules({ status: "active" });
  const router = useRouter();

  // Filtrer les véhicules pour ne garder que les favoris
  const favoriteVehicules = vehicules.filter((vehicule) =>
    favorites.includes(vehicule.id)
  );

  const isLoading = isLoadingFavorites || isLoadingVehicules;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Mes Favoris
          </h1>
          <p className="text-slate-400">
            {isLoading
              ? "Chargement..."
              : favorites.length === 0
              ? "Aucun favori pour le moment"
              : favorites.length === 1
              ? "1 véhicule sauvegardé"
              : `${favorites.length} véhicules sauvegardés`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-neutral-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-neutral-400 font-medium">Chargement de vos favoris...</p>
        </div>
      ) : favoriteVehicules.length === 0 ? (
        <div className="bg-neutral-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 p-12 text-center">
          <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart size={48} className="text-neutral-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
            Aucun favori enregistré
          </h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">
            Parcourez nos annonces et cliquez sur le cœur pour sauvegarder vos
            véhicules préférés. Vous les retrouverez ici facilement !
          </p>
          <button
            onClick={() => router.push("/search")}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all shadow-xl hover:shadow-md hover:scale-105"
          >
            Découvrir les annonces
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteVehicules.map((vehicule) => (
            <CarCard key={vehicule.id} car={vehicule} />
          ))}
        </div>
      )}
    </div>
  );
}

// Composant Messages Tab
function MessagesTab() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isInitialConversationsLoad, setIsInitialConversationsLoad] = useState(true);

  // Récupérer la conversation depuis l'URL si présente
  useEffect(() => {
    const conversationParam = searchParams.get("conversation");
    if (conversationParam) {
      setSelectedConversationId(conversationParam);
    }
  }, [searchParams]);

  // Charger les conversations
  useEffect(() => {
    if (!user) return;

    let isFirstLoad = isInitialConversationsLoad;

    const loadConversations = async (isInitial = false) => {
      try {
        // Afficher le loading uniquement lors du premier chargement
        if (isInitial) {
          setIsLoadingConversations(true);
        }
        const convos = await getUserConversations();
        setConversations(convos);
        
        // Si une conversation est dans l'URL et n'est pas encore sélectionnée, la sélectionner
        const conversationParam = searchParams.get("conversation");
        if (conversationParam && !selectedConversationId) {
          setSelectedConversationId(conversationParam);
        }
      } catch (error) {
        console.error("Erreur chargement conversations:", error);
        // Ne pas afficher de toast à chaque rechargement automatique pour éviter le spam
        // Seulement si c'est le premier chargement
        if (conversations.length === 0) {
          const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement des conversations";
          // Vérifier si c'est une erreur de table manquante
          if (errorMessage.includes("does not exist") || errorMessage.includes("relation") || errorMessage.includes("table")) {
            showToast("Les tables de messagerie n'existent pas encore. Veuillez exécuter le script SQL dans Supabase.", "error");
          } else {
            showToast(errorMessage, "error");
          }
        }
      } finally {
        if (isInitial) {
          setIsLoadingConversations(false);
          setIsInitialConversationsLoad(false);
        }
      }
    };

    // Premier chargement avec loading visible
    loadConversations(isFirstLoad);
    
    // Recharger toutes les 30 secondes (comme les notifications) - refresh silencieux
    const interval = setInterval(() => {
      loadConversations(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [user, searchParams, selectedConversationId, showToast]);

  // Charger les messages de la conversation sélectionnée
  useEffect(() => {
    if (!selectedConversationId || !user) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    let isInitialLoad = true;

    const loadMessages = async (isInitial = false) => {
      try {
        // Afficher le loading uniquement lors du premier chargement ou changement de conversation
        if (isInitial) {
          setIsLoadingMessages(true);
        }
        const msgs = await getMessages(selectedConversationId);
        setMessages(msgs);
        
        // Marquer la conversation comme lue (seulement si on a des messages)
        if (msgs.length > 0) {
          await markConversationAsRead(selectedConversationId);
        }
      } catch (error) {
        console.error("Erreur chargement messages:", error);
        // Ne pas afficher de toast à chaque rechargement automatique
        // Seulement si c'est le premier chargement ou si on n'a pas encore de messages
        if (messages.length === 0) {
          const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement des messages";
          if (errorMessage.includes("does not exist") || errorMessage.includes("relation") || errorMessage.includes("table")) {
            showToast("Les tables de messagerie n'existent pas encore. Veuillez exécuter le script SQL dans Supabase.", "error");
          }
        }
      } finally {
        if (isInitial) {
          setIsLoadingMessages(false);
        }
      }
    };

    // Premier chargement avec loading visible
    loadMessages(true);
    isInitialLoad = false;
    
    // Recharger les messages toutes les 5 secondes pour voir les nouveaux messages - refresh silencieux
    const interval = setInterval(() => {
      loadMessages(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedConversationId, user, showToast]);

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    // Mettre à jour l'URL sans recharger la page
    router.replace(`/dashboard?tab=messages&conversation=${conversationId}`, { scroll: false });
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    try {
      const result = await sendMessageWithNotification(selectedConversationId, content);
      if (!result.success) {
        throw new Error(result.error || "Erreur lors de l'envoi");
      }

      // Recharger les messages pour afficher le nouveau
      const msgs = await getMessages(selectedConversationId);
      setMessages(msgs);
      
      // Recharger les conversations pour mettre à jour le dernier message
      const convos = await getUserConversations();
      setConversations(convos);
      
      // Afficher un toast de succès
      showToast("Message envoyé avec succès", "success");
    } catch (error) {
      console.error("Erreur envoi message:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de l'envoi du message";
      showToast(errorMessage, "error");
      throw error; // Re-throw pour que MessageInput puisse gérer l'erreur
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
          Messages
        </h1>
        <p className="text-slate-400">
          Communiquez avec les vendeurs en toute sécurité
        </p>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex h-[600px]">
          {/* Liste des conversations */}
          <div className="w-full md:w-80 border-r border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Conversations</h2>
              <p className="text-xs text-neutral-400 mt-1">
                {conversations.length} conversation{conversations.length > 1 ? "s" : ""}
              </p>
            </div>
            <ConversationsList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              isLoading={isLoadingConversations}
            />
          </div>

          {/* Zone de conversation */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header de la conversation */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    {selectedConversation.vehicle && (
                      <div className="flex-1">
                        <h3 className="font-bold text-white">
                          {selectedConversation.vehicle.brand} {selectedConversation.vehicle.model}
                        </h3>
                        <p className="text-sm text-neutral-400">
                          Avec {selectedConversation.buyer_id === user?.id 
                            ? (selectedConversation.seller?.full_name || "le vendeur")
                            : (selectedConversation.buyer?.full_name || "l'acheteur")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thread de messages */}
                <MessageThread messages={messages} isLoading={isLoadingMessages} />

                {/* Zone de saisie */}
                <MessageInput onSend={handleSendMessage} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare size={48} className="text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-300 font-medium mb-2">Sélectionnez une conversation</p>
                  <p className="text-sm text-neutral-500">
                    Ou contactez un vendeur depuis une annonce
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant Settings Tab
function SettingsTab({ user }: { user: any }) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileData>({
    firstName: "",
    lastName: "",
    bio: "",
    phone: "",
    garageName: "",
    logoUrl: "",
    website: "",
    address: "",
    city: "",
    postalCode: "",
    garageDescription: "",
  });

  useEffect(() => {
    const loadUserMetadata = async () => {
      if (!user) return;
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();

        let firstName = "";
        let lastName = "";
        if (authUser?.user_metadata?.firstName && authUser?.user_metadata?.lastName) {
          firstName = authUser.user_metadata.firstName;
          lastName = authUser.user_metadata.lastName;
        } else if (profile?.full_name) {
          const nameParts = profile.full_name.split(" ");
          firstName = nameParts[0] || "";
          lastName = nameParts.slice(1).join(" ") || "";
        }

        const metadata = authUser?.user_metadata || {};
        setFormData({
          firstName: metadata.firstName || firstName,
          lastName: metadata.lastName || lastName,
          bio: metadata.bio || "",
          phone: metadata.phone || "",
          garageName: metadata.garageName || "",
          logoUrl: metadata.logoUrl || profile?.avatar_url || "",
          website: metadata.website || "",
          address: metadata.address || "",
          city: metadata.city || "",
          postalCode: metadata.postalCode || "",
          garageDescription: metadata.garageDescription || "",
        });
      } catch (error) {
        console.error("Erreur chargement métadonnées:", error);
      }
    };
    loadUserMetadata();
  }, [user]);

  const isPro = user?.role === "pro";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile(formData);
      showToast("Profil mis à jour avec succès ✓", "success");
    } catch (error) {
      showToast("Erreur lors de la mise à jour", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-black text-white tracking-tight mb-2">
        Paramètres
      </h1>
      <p className="text-slate-400 mb-8">
        Gérez vos informations personnelles
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 p-6">
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <FileText size={20} className="text-red-600" />
            Informations Personnelles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Prénom</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Nom</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white resize-y"
              />
            </div>
          </div>
        </div>

        {/* Informations professionnelles (PRO uniquement) */}
        {isPro && (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 p-6">
            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-red-600" />
              Informations Professionnelles
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Nom du Garage</label>
                <input
                  type="text"
                  name="garageName"
                  value={formData.garageName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Site Web</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Adresse</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white resize-y"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Ville</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Code Postal</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Description du Garage</label>
                <textarea
                  name="garageDescription"
                  value={formData.garageDescription}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white resize-y"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all disabled:opacity-50"
        >
          {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}

// Composant Sentinelle Tab
function SentinelleTab({ user }: { user: any }) {
  const { showToast } = useToast();
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      setIsLoading(true);
      const { getSavedSearches } = await import("@/lib/supabase/savedSearches");
      const searches = await getSavedSearches();
      setSavedSearches(searches);
    } catch (error) {
      console.error("Erreur chargement recherches:", error);
      showToast("Erreur lors du chargement des recherches", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (searchId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette recherche ?")) return;
    
    try {
      const { deleteSavedSearch } = await import("@/lib/supabase/savedSearches");
      await deleteSavedSearch(searchId);
      setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
      showToast("Recherche supprimée avec succès", "success");
    } catch (error) {
      console.error("Erreur suppression:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const handleToggle = async (searchId: string, isActive: boolean) => {
    try {
      const { toggleSavedSearch } = await import("@/lib/supabase/savedSearches");
      await toggleSavedSearch(searchId, !isActive);
      setSavedSearches((prev) =>
        prev.map((s) => (s.id === searchId ? { ...s, is_active: !isActive } : s))
      );
      showToast(isActive ? "Recherche désactivée" : "Recherche activée", "success");
    } catch (error) {
      console.error("Erreur toggle:", error);
      showToast("Erreur lors de la modification", "error");
    }
  };

  const formatSearchCriteria = (search: any) => {
    const criteria: string[] = [];
    if (search.marque) criteria.push(`Marque: ${search.marque}`);
    if (search.modele) criteria.push(`Modèle: ${search.modele}`);
    if (search.prix_min || search.prix_max) {
      const prixMin = search.prix_min ? `${search.prix_min.toLocaleString('fr-BE')}€` : '';
      const prixMax = search.prix_max ? `${search.prix_max.toLocaleString('fr-BE')}€` : '';
      criteria.push(`Prix: ${prixMin}${prixMin && prixMax ? ' - ' : ''}${prixMax}`);
    }
    if (search.annee_min || search.annee_max) {
      criteria.push(`Année: ${search.annee_min || ''}${search.annee_min && search.annee_max ? ' - ' : ''}${search.annee_max || ''}`);
    }
    if (search.km_max) criteria.push(`Km max: ${search.km_max.toLocaleString('fr-BE')}`);
    if (search.carburants && search.carburants.length > 0) criteria.push(`Carburant: ${search.carburants.join(', ')}`);
    if (search.transmissions && search.transmissions.length > 0) criteria.push(`Transmission: ${search.transmissions.join(', ')}`);
    return criteria.length > 0 ? criteria.join(' • ') : 'Recherche personnalisée';
  };

  // Construire l'URL de recherche à partir d'une recherche sauvegardée
  const buildSearchUrl = (search: any): string => {
    const params = new URLSearchParams();
    if (search.marque && search.marque !== "Toutes les marques") params.set("marque", search.marque);
    if (search.modele) params.set("modele", search.modele);
    if (search.prix_min) params.set("prixMin", search.prix_min.toString());
    if (search.prix_max) params.set("prixMax", search.prix_max.toString());
    if (search.annee_min) params.set("anneeMin", search.annee_min.toString());
    if (search.annee_max) params.set("anneeMax", search.annee_max.toString());
    if (search.km_max) params.set("mileageMax", search.km_max.toString());
    if (search.type && search.type.length > 0) params.set("type", search.type.join(","));
    if (search.carburants && search.carburants.length > 0) params.set("carburant", search.carburants[0]);
    if (search.transmissions && search.transmissions.length > 0) params.set("transmission", search.transmissions.join(","));
    if (search.carrosseries && search.carrosseries.length > 0) params.set("carrosserie", search.carrosseries.join(","));
    if (search.norme_euro) params.set("normeEuro", search.norme_euro);
    if (search.car_pass_only) params.set("carPassOnly", "true");
    return params.toString();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Ma Sentinelle
          </h1>
          <p className="text-slate-400">
            Gérez vos alertes de recherche sauvegardées
          </p>
        </div>
        <Link
          href="/search"
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Créer une alerte
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-red-600" size={32} />
        </div>
      ) : savedSearches.length === 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-12 text-center">
          <Bell size={48} className="text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Aucune alerte configurée</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Créez une recherche et sauvegardez-la pour recevoir des notifications lorsqu'une nouvelle annonce correspond à vos critères.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
          >
            <Plus size={20} />
            Créer ma première alerte
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {savedSearches.map((search) => (
            <div
              key={search.id}
              className={`bg-neutral-900/50 backdrop-blur-sm rounded-2xl border-2 p-6 transition-all hover:scale-[1.01] ${
                search.is_active
                  ? "border-green-600/50 bg-green-900/10 hover:border-green-600/70"
                  : "border-neutral-700 bg-neutral-800/30 hover:border-neutral-600"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Bell size={20} className={search.is_active ? "text-green-500" : "text-neutral-500"} />
                    <h3 className="text-xl font-black text-white flex-1">
                      {search.name || "Recherche sans nom"}
                    </h3>
                    {search.is_active ? (
                      <span className="px-3 py-1 bg-green-600/20 text-green-400 text-xs font-bold rounded-full border border-green-600/30 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Active
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-neutral-700/50 text-neutral-400 text-xs font-bold rounded-full border border-neutral-600/30">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-300 mb-4 text-sm leading-relaxed">{formatSearchCriteria(search)}</p>
                  <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Créée le {new Date(search.created_at).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    {search.last_notified_at && (
                      <span className="flex items-center gap-1">
                        <BellRing size={14} />
                        Dernière alerte: {new Date(search.last_notified_at).toLocaleDateString("fr-BE", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
                  <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => router.push(`/search?${buildSearchUrl(search)}`)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                    title="Appliquer cette recherche"
                  >
                    <Search size={16} />
                    Voir résultats
                  </button>
                  <button
                    onClick={() => handleToggle(search.id, search.is_active)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      search.is_active
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                    title={search.is_active ? "Désactiver les alertes" : "Activer les alertes"}
                  >
                    {search.is_active ? "Désactiver" : "Activer"}
                  </button>
                  <button
                    onClick={() => handleDelete(search.id)}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-xl font-bold text-sm transition-all"
                    title="Supprimer cette recherche"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Composant Vitrine Tab (PRO)
function VitrineTab({ user }: { user: any }) {
  return (
    <div>
      <h1 className="text-4xl font-black text-white tracking-tight mb-2">
        Ma Vitrine
      </h1>
      <p className="text-slate-400 mb-8">
        Votre page publique de garage
      </p>
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-12 text-center">
        <Building2 size={48} className="text-slate-400 mx-auto mb-4" />
        <p className="text-slate-400 font-medium mb-4">
          Votre vitrine publique est disponible à :
        </p>
        <Link
          href={`/garage/${user.id}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
        >
          Voir ma vitrine
        </Link>
      </div>
    </div>
  );
}

// Composant Stats Tab (PRO)
function StatsTab() {
  return (
    <div>
      <h1 className="text-4xl font-black text-white tracking-tight mb-2">
        Statistiques
      </h1>
      <p className="text-slate-400 mb-8">
        Analysez les performances de vos annonces
      </p>
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-12 text-center">
        <BarChart3 size={48} className="text-slate-400 mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Statistiques à venir</p>
      </div>
    </div>
  );
}

// Composant Support Tab
function SupportTab({ user }: { user: any }) {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingToTicket, setReplyingToTicket] = useState<string | null>(null);
  const [userReplyText, setUserReplyText] = useState<string>("");
  const [submittingUserReply, setSubmittingUserReply] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    category: "Commercial" as "Technique" | "Contenu" | "Commercial",
    message: "",
  });

  // Charger les tickets
  const loadTickets = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userTickets = await getUserTickets();
      setTickets(userTickets);
    } catch (error) {
      console.error("Erreur chargement tickets:", error);
      showToast("Erreur lors du chargement des tickets", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [user, showToast]);

  // Subscription en temps réel pour les tickets de l'utilisateur
  useEffect(() => {
    if (!user) return;
    
    const supabase = createClient();
    
    // Créer la subscription pour les changements sur les tickets de l'utilisateur
    const channel = supabase
      .channel('user-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Tous les événements (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tickets',
          filter: `user_id=eq.${user.id}`, // Seulement les tickets de cet utilisateur
        },
        (payload) => {
          console.log('🔄 [User Tickets] Changement détecté:', payload.eventType, payload.new || payload.old);
          
          // Recharger les tickets après un changement
          loadTickets();
          
          // Afficher une notification pour les mises à jour
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedTicket = payload.new as any;
            if (updatedTicket.status === 'resolved') {
              showToast("Votre ticket a été résolu !", "success");
            } else if (updatedTicket.status === 'closed') {
              showToast("Votre ticket a été clôturé", "info");
            } else if (updatedTicket.status === 'in_progress') {
              showToast("Votre ticket est en cours de traitement", "info");
            } else if (updatedTicket.admin_reply) {
              showToast("Vous avez reçu une réponse à votre ticket", "success");
            }
          } else if (payload.eventType === 'INSERT' && payload.new) {
            showToast("Votre ticket a été créé avec succès", "success");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, showToast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1.5 bg-green-600/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full border border-green-600/30">
            <CheckCircle size={12} />
            Résolu
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-600/20 text-slate-400 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-600/30">
            <X size={12} />
            Fermé
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-600/20 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-600/30">
            <Clock size={12} />
            En traitement
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-600/20 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-600/30">
            <Clock size={12} />
            Reçu
          </span>
        );
    }
  };

  // Fonction pour obtenir le pourcentage de progression du ticket
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "open":
        return 25; // Reçu
      case "in_progress":
        return 50; // En traitement
      case "resolved":
        return 75; // Résolu
      case "closed":
        return 100; // Fermé
      default:
        return 0;
    }
  };

  // Fonction pour obtenir les étapes de progression
  const getProgressSteps = (status: string) => {
    const steps = [
      { label: "Reçu", status: "open", completed: true },
      { label: "En traitement", status: "in_progress", completed: status !== "open" },
      { label: "Résolu", status: "resolved", completed: status === "resolved" || status === "closed" },
      { label: "Fermé", status: "closed", completed: status === "closed" },
    ];
    return steps;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "Technique":
        return "🐛 Technique";
      case "Contenu":
        return "📝 Contenu";
      case "Commercial":
        return "💼 Commercial";
      default:
        return category;
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createTicket({
        email: formData.email,
        category: formData.category,
        message: formData.message,
      });

      if (result.success) {
        showToast("Ticket créé avec succès !", "success");
        setFormData({
          email: user?.email || "",
          category: "Commercial",
          message: "",
        });
        setShowCreateForm(false);
        // Recharger les tickets
        const userTickets = await getUserTickets();
        setTickets(userTickets);
      } else {
        showToast(result.error || "Erreur lors de la création du ticket", "error");
      }
    } catch (error) {
      console.error("Erreur création ticket:", error);
      showToast("Erreur lors de la création du ticket", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserReply = async (ticketId: string) => {
    if (!userReplyText.trim()) {
      showToast("Veuillez saisir une réponse", "error");
      return;
    }
    
    setSubmittingUserReply(true);
    try {
      const result = await addUserReply(ticketId, userReplyText);
      if (result.success) {
        showToast("Réponse envoyée avec succès", "success");
        setUserReplyText("");
        setReplyingToTicket(null);
        // Recharger les tickets
        const userTickets = await getUserTickets();
        setTickets(userTickets);
      } else {
        showToast(result.error || "Erreur lors de l'envoi", "error");
      }
    } catch (error) {
      console.error("Erreur ajout réponse utilisateur:", error);
      showToast("Erreur lors de l'envoi de la réponse", "error");
    } finally {
      setSubmittingUserReply(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
          Support
        </h1>
        <p className="text-slate-400 mb-8">
          Gérez vos tickets de support
        </p>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-red-600" size={48} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Support
          </h1>
          <p className="text-slate-400">
            Créez et suivez vos tickets de support
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <MessageSquare size={18} />
            Créer un ticket
          </button>
        )}
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="mb-8 bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white">Nouveau Ticket</h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setFormData({
                  email: user?.email || "",
                  category: "Commercial",
                  message: "",
                });
              }}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center"
            >
              <X size={20} className="text-slate-300" />
            </button>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
                placeholder="votre@email.com"
                disabled={!!user?.email}
              />
              {user?.email && (
                <p className="text-xs text-slate-500 mt-1">Email de votre compte connecté</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Catégorie <span className="text-red-600">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value as "Technique" | "Contenu" | "Commercial",
                  }))
                }
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
              >
                <option value="Technique">🔧 Technique (Bug, Problème technique)</option>
                <option value="Contenu">📝 Contenu (Signalement annonce/utilisateur)</option>
                <option value="Commercial">💼 Commercial (Question, Facturation)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {formData.category === "Technique" && "→ Routé vers l'Admin (Dimitri)"}
                {formData.category === "Contenu" && "→ Routé vers le Modérateur (Antoine)"}
                {formData.category === "Commercial" && "→ Routé vers l'Admin (Dimitri)"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Message <span className="text-red-600">*</span>
              </label>
              <textarea
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white resize-none"
                placeholder="Décrivez votre problème ou votre question..."
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Envoyer
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({
                    email: user?.email || "",
                    category: "Commercial",
                    message: "",
                  });
                }}
                className="px-6 py-4 border-2 border-slate-700 hover:border-slate-600 text-slate-300 font-bold rounded-xl transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des tickets */}
      {tickets.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <MessageSquare size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">Aucun ticket</h3>
          <p className="text-slate-400 mb-6">
            Vous n&apos;avez pas encore créé de ticket de support.
          </p>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              <MessageSquare size={18} />
              Créer un ticket
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors"
            >
              {/* Header du ticket */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-slate-400 text-sm font-medium">
                        {getCategoryLabel(ticket.category)}
                      </span>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">
                      {ticket.subject === "bug" ? "🐛 Bug" : 
                       ticket.subject === "question" ? "❓ Question" :
                       ticket.subject === "signalement" ? "🚨 Signalement" :
                       ticket.subject}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2">
                      {ticket.message}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-slate-500 text-xs">
                      <span>
                        Créé le {new Date(ticket.created_at).toLocaleDateString("fr-BE", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {ticket.resolved_at && (
                        <span>
                          Résolu le {new Date(ticket.resolved_at).toLocaleDateString("fr-BE", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-white transition-colors">
                    {expandedTicket === ticket.id ? (
                      <ChevronUp size={24} />
                    ) : (
                      <ChevronDown size={24} />
                    )}
                  </button>
                </div>
              </div>

              {/* Contenu détaillé */}
              {expandedTicket === ticket.id && (
                <div className="border-t border-slate-800 p-6 space-y-6">
                  {/* Barre de suivi */}
                  <div>
                    <h4 className="text-slate-300 font-bold text-sm mb-4 uppercase tracking-wide">
                      Suivi du ticket
                    </h4>
                    <div className="bg-slate-800/50 rounded-xl p-6">
                      {/* Barre de progression */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-400 text-xs font-medium">Progression</span>
                          <span className="text-slate-300 text-xs font-bold">{getProgressPercentage(ticket.status)}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
                            style={{ width: `${getProgressPercentage(ticket.status)}%` }}
                          />
                        </div>
                      </div>

                      {/* Étapes */}
                      <div className="grid grid-cols-4 gap-2">
                        {getProgressSteps(ticket.status).map((step, index) => (
                          <div key={step.status} className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                                step.completed
                                  ? "bg-red-600 text-white"
                                  : ticket.status === step.status
                                  ? "bg-red-600/50 text-red-300 border-2 border-red-600"
                                  : "bg-slate-700 text-slate-500"
                              }`}
                            >
                              {step.completed ? (
                                <CheckCircle size={20} />
                              ) : ticket.status === step.status ? (
                                <Clock size={20} />
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-slate-500" />
                              )}
                            </div>
                            <span
                              className={`text-xs text-center font-medium ${
                                step.completed || ticket.status === step.status
                                  ? "text-white"
                                  : "text-slate-500"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Message original */}
                  <div>
                    <h4 className="text-slate-300 font-bold text-sm mb-2 uppercase tracking-wide">
                      Votre message
                    </h4>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-slate-300 whitespace-pre-wrap">{ticket.message}</p>
                    </div>
                  </div>

                  {/* Réponse du support */}
                  {ticket.admin_reply ? (
                    <div className="mb-4">
                      <h4 className="text-green-400 font-bold text-sm mb-2 uppercase tracking-wide flex items-center gap-2">
                        <CheckCircle size={16} />
                        Réponse du Support
                      </h4>
                      <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4">
                        <p className="text-green-300 whitespace-pre-wrap">{ticket.admin_reply}</p>
                        {ticket.resolved_at && (
                          <p className="text-green-400/70 text-xs mt-3">
                            Répondu le {new Date(ticket.resolved_at).toLocaleDateString("fr-BE", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                      
                      {/* Réponse utilisateur existante */}
                      {ticket.user_reply && (
                        <div className="mt-4">
                          <h4 className="text-blue-400 font-bold text-sm mb-2 uppercase tracking-wide flex items-center gap-2">
                            <MessageSquare size={16} />
                            Votre Réponse
                          </h4>
                          <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
                            <p className="text-blue-300 whitespace-pre-wrap">{ticket.user_reply}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Formulaire de réponse utilisateur */}
                      {ticket.status !== "closed" && (
                        <div className="mt-4">
                          {replyingToTicket === ticket.id ? (
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                              <h5 className="text-sm font-bold text-white mb-3">Répondre au support :</h5>
                              <textarea
                                value={userReplyText}
                                onChange={(e) => setUserReplyText(e.target.value)}
                                placeholder="Tapez votre réponse ici..."
                                className="w-full min-h-[120px] p-3 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-y text-white bg-slate-900"
                                disabled={submittingUserReply}
                              />
                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={() => handleUserReply(ticket.id)}
                                  disabled={submittingUserReply || !userReplyText.trim()}
                                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {submittingUserReply ? (
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
                                    setUserReplyText("");
                                  }}
                                  disabled={submittingUserReply}
                                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all disabled:opacity-50"
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
                              {ticket.user_reply ? "Modifier ma réponse" : "Répondre au support"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Clock size={16} />
                        <p className="text-sm font-medium">
                          En attente de réponse du support
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Composant Equipe Tab (PRO)
function EquipeTab() {
  return (
    <div>
      <h1 className="text-4xl font-black text-white tracking-tight mb-2">
        Mon Équipe
      </h1>
      <p className="text-slate-400 mb-8">
        Gérez les membres de votre équipe
      </p>
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-12 text-center">
        <Users size={48} className="text-slate-400 mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Gestion d'équipe à venir</p>
      </div>
    </div>
  );
}
