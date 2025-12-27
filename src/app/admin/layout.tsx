"use client";

// Layout Admin - Sidebar de navigation
// Design harmonisé avec Octane98 : fond gris très sombre, typographie bold

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  AlertTriangle,
  LogOut,
  Gauge,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { useBanSimulation } from "@/contexts/BanSimulationContext";

type TabConfig = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  allowedRoles: string[];
  path: string;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const { showToast } = useToast();
  const { isSimulatingBan, toggleSimulation } = useBanSimulation();
  const router = useRouter();
  const pathname = usePathname();

  // Verrou pour empêcher les redirections multiples (race condition)
  const isRedirecting = useRef(false);

  // Protection : Rediriger si pas autorisé (avec verrou anti-race condition)
  useEffect(() => {
    // Si on charge ou si on est déjà en train de partir, on ne fait rien
    if (isLoading || isRedirecting.current) return;

    // Vérification des droits
    const isAuthorized = user && ["admin", "moderator", "support", "editor", "viewer"].includes(user.role);

    if (!isAuthorized) {
      // ON VERROUILLE IMMÉDIATEMENT pour empêcher toute re-exécution
      isRedirecting.current = true;
      console.log("[AdminLayout] Accès refusé. Redirection unique vers home.");
      showToast("Accès refusé - Rôle autorisé requis", "error");

      // Utilise replace pour ne pas casser l'historique de navigation
      router.replace('/');
    }
  }, [user, isLoading, router, showToast]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Rendu conditionnel strict : Gardien de sécurité
  if (isLoading) {
    // État de chargement : Spinner propre
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-300">Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérification finale des droits (après chargement terminé)
  const isAuthorized = user && ["admin", "moderator", "support", "editor", "viewer"].includes(user.role);

  if (!isAuthorized) {
    // Non autorisé : Rien (redirection gérée par useEffect)
    return null;
  }

  // Définir les tabs avec leurs permissions et chemins
  const allTabs: TabConfig[] = [
    { id: "dashboard", label: "Tableau de Bord", icon: LayoutDashboard, allowedRoles: ["admin", "moderator", "support", "editor", "viewer"], path: "/admin/dashboard" },
    { id: "moderation", label: "Modération", icon: FileCheck, allowedRoles: ["admin", "moderator"], path: "/admin/moderation" },
    { id: "vehicles", label: "Gestion Véhicules", icon: Car, allowedRoles: ["admin", "moderator"], path: "/admin/vehicles" },
    { id: "users", label: "Utilisateurs", icon: Users, allowedRoles: ["admin"], path: "/admin/users" },
    { id: "settings", label: "Paramètres", icon: Settings, allowedRoles: ["admin"], path: "/admin/settings" },
    { id: "support", label: "Support", icon: MessageSquare, allowedRoles: ["admin", "support"], path: "/admin/support" },
    { id: "content", label: "FAQ", icon: FileText, allowedRoles: ["admin", "editor"], path: "/admin/content" },
    { id: "articles", label: "Articles", icon: BookOpen, allowedRoles: ["admin", "editor"], path: "/admin/articles" },
  ];

  // Filtrer les tabs selon le rôle de l'utilisateur
  const tabs = allTabs.filter(tab => tab.allowedRoles.includes(user.role));

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
            const isActive = pathname === tab.path || (tab.path === "/admin/dashboard" && pathname === "/admin");
            return (
              <Link
                key={tab.id}
                href={tab.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-red-600/20 text-red-400 border border-red-600/30 shadow-lg shadow-red-900/20"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{tab.label}</span>
              </Link>
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
          {children}
        </main>
      </div>
    </div>
  );
}
