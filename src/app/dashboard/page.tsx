"use client";

import { useState, useEffect } from "react";
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
  LogOut,
  Gauge,
  AlertTriangle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBanSimulation } from "@/contexts/BanSimulationContext";
import NotificationsPanel from "@/components/NotificationsPanel";
import { getAllNotifications } from "@/lib/supabase/notifications";
import type { Notification } from "@/lib/supabase/notifications";
// Import des composants Tab modulaires
import GarageTab from "@/components/features/dashboard/tabs/GarageTab";
import FavoritesTab from "@/components/features/dashboard/tabs/FavoritesTab";
import MessagesTab from "@/components/features/dashboard/tabs/MessagesTab";
import SettingsTab from "@/components/features/dashboard/tabs/SettingsTab";
import SentinelleTab from "@/components/features/dashboard/tabs/SentinelleTab";
import SupportTab from "@/components/features/dashboard/tabs/SupportTab";
import VitrineTab from "@/components/features/dashboard/tabs/VitrineTab";
import StatsTab from "@/components/features/dashboard/tabs/StatsTab";
import EquipeTab from "@/components/features/dashboard/tabs/EquipeTab";

type TabType = "garage" | "favorites" | "messages" | "settings" | "support" | "sentinelle" | "vitrine" | "stats" | "equipe";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const { isSimulatingBan } = useBanSimulation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  
  // Initialiser activeTab depuis l'URL directement (correction race condition)
  const tabParam = searchParams.get("tab");
  const validTabs = ["garage", "favorites", "messages", "settings", "support", "sentinelle", "vitrine", "stats", "equipe"];
  const initialTab = (tabParam && validTabs.includes(tabParam)) ? (tabParam as TabType) : "garage";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Calculer la date actuelle uniquement côté client pour éviter les problèmes d'hydratation
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Rediriger vers login si non connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [user, isLoading, router]);

  // Synchroniser activeTab avec l'URL (si l'URL change depuis l'extérieur)
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && validTabs.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams, activeTab, validTabs]);

  // Fonction pour changer d'onglet avec synchronisation URL
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.replace(`/dashboard?tab=${tab}`, { scroll: false });
  };

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
        {/* Logo Octane98 */}
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
                onClick={() => handleTabChange(tab.id)}
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
                  onClick={() => handleTabChange(tab.id)}
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
                        {user.ban_until && currentDate && new Date(user.ban_until) > currentDate ? (
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
            {activeTab === "garage" && (
              <GarageTab
                user={user}
                notifications={notifications}
                unreadCount={unreadCount}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
                isLoadingNotifications={isLoadingNotifications}
              />
            )}
            {activeTab === "favorites" && <FavoritesTab />}
            {activeTab === "messages" && <MessagesTab />}
            {activeTab === "support" && <SupportTab user={user} />}
            {activeTab === "settings" && <SettingsTab user={user} />}
            {activeTab === "sentinelle" && <SentinelleTab user={user} />}
            {activeTab === "vitrine" && isPro && <VitrineTab user={user} />}
            {activeTab === "stats" && isPro && <StatsTab user={user} />}
            {activeTab === "equipe" && isPro && <EquipeTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
