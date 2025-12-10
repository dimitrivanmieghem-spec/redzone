"use client";

import { Home, Search, Plus, Heart, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";

export default function MobileNav() {
  const pathname = usePathname();
  const { favorites } = useFavorites();
  const { user } = useAuth();

  const navItems = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/search", label: "Explorer", icon: Search },
    { href: "/sell", label: "Vendre", icon: Plus, isPrimary: true },
    { href: "/favorites", label: "Favoris", icon: Heart, badge: favorites.length },
    { href: user ? "/dashboard" : "/login", label: "Profil", icon: User },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 block md:hidden">
      {/* Fond glassmorphism avec bordure haute */}
      <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-2xl shadow-black/10 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isPrimary = item.isPrimary;

            if (isPrimary) {
              // Bouton central en relief (Rouge RedZone)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center gap-1 -mt-6 relative z-10"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-700 shadow-lg shadow-red-600/40 flex items-center justify-center border-4 border-white">
                    <Plus size={28} className="text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-red-600 mt-1">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 min-w-[60px] py-1 relative"
              >
                <div className="relative">
                  <Icon
                    size={24}
                    className={`transition-colors ${
                      active ? "text-red-600" : "text-slate-600"
                    }`}
                  />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium transition-colors ${
                    active ? "text-red-600 font-bold" : "text-slate-600"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

