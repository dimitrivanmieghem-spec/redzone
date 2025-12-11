"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Heart,
  MessageSquare,
  Settings,
  Building2,
  BarChart3,
  Users,
  Bell,
  Menu,
  X,
  LogOut,
  Gauge,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Rediriger vers login si non connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/dashboard");
    }
  }, [user, isLoading, router]);

  // Fermer la sidebar sur mobile quand on change de page
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Menu commun à tous
  const commonMenuItems = [
    {
      href: "/dashboard",
      label: "Mes Annonces",
      icon: Car,
      exact: true,
    },
    {
      href: "/favorites",
      label: "Mes Favoris",
      icon: Heart,
    },
    {
      href: "#",
      label: "Messages",
      icon: MessageSquare,
    },
    {
      href: "#",
      label: "Paramètres",
      icon: Settings,
    },
  ];

  // Menu PRO uniquement
  const proMenuItems = [
    {
      href: "#",
      label: "Mon Showroom",
      icon: Building2,
    },
    {
      href: "#",
      label: "Statistiques",
      icon: BarChart3,
    },
    {
      href: "#",
      label: "Mon Équipe",
      icon: Users,
    },
  ];

  // Menu Particulier uniquement
  const particulierMenuItems = [
    {
      href: "#",
      label: "Ma 'Sentinelle' (Alertes Recherche)",
      icon: Bell,
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Afficher un loader pendant la vérification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-300">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas d'utilisateur, ne rien afficher (redirection en cours)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10">
        {/* Logo RedZone */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:shadow-red-900/50 transition-all duration-300 group-hover:scale-105">
              <Gauge className="text-white" size={20} />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              Red<span className="text-red-500">Zone</span>
            </span>
          </Link>
        </div>

        {/* Profil utilisateur */}
        <div className="p-6 border-b border-white/10">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full border-2 border-white/20 overflow-hidden ring-2 ring-red-600/30 mb-3">
              <Image
                src={user.avatar}
                alt={user.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-white font-semibold text-base mb-1">
              {user.name.split(" ")[0]}
            </p>
            {/* Badge MEMBRE FONDATEUR (pour les 100 premiers utilisateurs) */}
            <div className="mt-2 px-3 py-1 bg-gradient-to-r from-yellow-500/20 via-yellow-600/20 to-yellow-500/20 border border-yellow-500/40 rounded-full">
              <span className="text-yellow-400 text-[10px] font-black uppercase tracking-wider">
                ⭐ MEMBRE FONDATEUR
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {/* Menu commun */}
          {commonMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-red-600/20 text-red-400 border border-red-600/30"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}

          {/* Séparateur */}
          <div className="my-4 border-t border-white/10" />

          {/* Menu PRO */}
          {user.role === "pro" &&
            proMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <Icon size={20} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}

          {/* Menu Particulier */}
          {user.role === "particulier" &&
            particulierMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <Icon size={20} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
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

      {/* Sidebar Mobile - Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Mobile - Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 z-50 lg:hidden transform transition-transform duration-300 ease-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header mobile */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
              <Gauge className="text-white" size={20} />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              Red<span className="text-red-500">Zone</span>
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-white hover:text-slate-300 hover:bg-white/10 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Profil utilisateur mobile */}
        <div className="p-6 border-b border-white/10">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full border-2 border-white/20 overflow-hidden ring-2 ring-red-600/30 mb-3">
              <Image
                src={user.avatar}
                alt={user.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-white font-semibold text-base mb-1">
              {user.name.split(" ")[0]}
            </p>
            {/* Badge MEMBRE FONDATEUR */}
            <div className="mt-2 px-3 py-1 bg-gradient-to-r from-yellow-500/20 via-yellow-600/20 to-yellow-500/20 border border-yellow-500/40 rounded-full">
              <span className="text-yellow-400 text-[10px] font-black uppercase tracking-wider">
                ⭐ MEMBRE FONDATEUR
              </span>
            </div>
          </div>
        </div>

        {/* Navigation mobile */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {commonMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-red-600/20 text-red-400 border border-red-600/30"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}

          <div className="my-4 border-t border-white/10" />

          {user.role === "pro" &&
            proMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <Icon size={20} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}

          {user.role === "particulier" &&
            particulierMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <Icon size={20} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
        </nav>

        {/* Déconnexion mobile */}
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
        {/* Header mobile avec bouton menu */}
        <header className="lg:hidden sticky top-0 z-30 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-white hover:text-slate-300 hover:bg-white/10 rounded-xl transition-all"
          >
            <Menu size={24} />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
              <Gauge className="text-white" size={16} />
            </div>
            <span className="text-white font-semibold text-sm tracking-tight">
              Red<span className="text-red-500">Zone</span>
            </span>
          </Link>
          <div className="w-10" /> {/* Spacer pour centrer */}
        </header>

        {/* Zone de contenu */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

