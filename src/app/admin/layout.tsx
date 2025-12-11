"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  BookOpen,
  Users,
  Settings,
  LogOut,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Protection : Rediriger si non admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      showToast("Accès refusé - Administrateur uniquement", "error");
      router.push("/");
    }
  }, [user, isLoading, router, showToast]);

  const handleLogout = () => {
    logout();
    showToast("Déconnexion administrateur", "success");
    router.push("/");
  };

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

  const navItems = [
    { href: "/admin", label: "Tableau de Bord", icon: LayoutDashboard },
    { href: "/admin/moderation", label: "Modération", icon: ShieldCheck },
    { href: "/admin/support", label: "Support", icon: MessageSquare },
    { href: "/admin/contenu", label: "Contenu", icon: FileText },
    { href: "/admin/encyclopedie", label: "Encyclopédie", icon: BookOpen },
    { href: "/admin/equipe", label: "Équipe", icon: Users },
  ];

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
              <p className="text-xs text-slate-400">RedZone Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
                  isActive
                    ? "bg-red-600 text-slate-900"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

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
      <div className="flex-1 bg-white overflow-auto">
        {children}
      </div>
    </main>
  );
}

