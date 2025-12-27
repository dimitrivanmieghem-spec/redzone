"use client";

import { Menu, X, Heart, ChevronDown, User, LayoutDashboard, LogOut, Gauge, Shield, Settings, FileText, Users, TestTube, XCircle, Bell, BellRing, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBanSimulation } from "@/contexts/BanSimulationContext";
import Image from "next/image";
import { getUnreadNotificationsCount, getAllNotifications, markNotificationAsRead } from "@/lib/supabase/notifications";
import type { Notification } from "@/lib/supabase/notifications";
import { createClient } from "@/lib/supabase/client";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { favorites } = useFavorites();
  const { user, logout } = useAuth();
  const { isSimulatingBan, toggleSimulation, stopSimulation } = useBanSimulation();
  const router = useRouter();

  // Vérification du cookie bypass Alpha
  const hasAlphaBypass = typeof window !== "undefined" && document.cookie.includes("octane_bypass_token=true");

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push("/");
  };

  // Charger le compteur de notifications non lues
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadNotificationsCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Erreur chargement compteur notifications:", error);
        setUnreadCount(0);
      }
    };

    loadUnreadCount();

    // Abonnement en temps réel aux notifications
    if (user) {
      const supabase = createClient();
      const channel = supabase
        .channel("notifications-realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Recharger le compteur quand une nouvelle notification arrive
            loadUnreadCount();
          }
        )
        .subscribe();

      // Recharger toutes les 30 secondes (fallback)
      const interval = setInterval(loadUnreadCount, 30000);
      
      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Charger les notifications quand le dropdown est ouvert
  useEffect(() => {
    if (!user || !isNotificationsOpen) return;

    const loadNotifications = async () => {
      try {
        const allNotifications = await getAllNotifications(5);
        setNotifications(allNotifications);
      } catch (error) {
        console.error("Erreur chargement notifications:", error);
      }
    };

    loadNotifications();
  }, [user, isNotificationsOpen]);

  const navLinks = [
    { href: "/search", label: "Showroom" },
    { href: "/sell", label: "Vendre" },
    { href: "/tribune", label: "La Tribune" },
    { href: "/calculateur", label: "Calculateur de Taxes" },
  ];

  return (
    <>
      {/* Navbar Premium - Design Sombre Glassmorphism */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-white/10 z-[90] hidden md:block">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo Octane98 */}
          <Link 
            href="/" 
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:shadow-red-900/50 transition-all duration-300 group-hover:scale-105">
              <Gauge className="text-white" size={20} />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              Octane<span className="text-red-500">98</span>
            </span>
          </Link>

          {/* Navigation Desktop - MASQUÉE si pas de bypass Alpha */}
          {hasAlphaBypass && (
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-slate-300 hover:text-white font-medium text-sm transition-colors duration-300"
                >
                  {link.label}
                </Link>
              ))}

              {/* Lien Favoris avec badge */}
              <Link
                href="/favorites"
                className="relative text-slate-300 hover:text-white font-medium text-sm transition-colors duration-300 flex items-center gap-1.5"
              >
                <Heart
                  size={18}
                  className={favorites.length > 0 ? "fill-red-500 text-red-500" : ""}
                />
                <span>Favoris</span>
                {favorites.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>

              {/* Utilisateur connecté ou non */}
              {user ? (
                <div className="flex items-center gap-3">
                  {/* Cloche de notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className="relative p-2 rounded-full hover:bg-white/10 transition-colors duration-300"
                      aria-label="Notifications"
                    >
                      {unreadCount > 0 ? (
                        <BellRing size={20} className="text-red-500" />
                      ) : (
                        <Bell size={20} className="text-slate-300" />
                      )}
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Dropdown Notifications */}
                    {isNotificationsOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setIsNotificationsOpen(false)}
                        />
                        <div className="absolute right-0 mt-3 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 border border-white/10 w-80 max-w-[calc(100vw-2rem)] z-20 max-h-[400px] flex flex-col">
                          {/* Header */}
                          <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-white font-bold text-sm flex items-center gap-2">
                              <BellRing size={18} className="text-red-500" />
                              Notifications
                              {unreadCount > 0 && (
                                <span className="bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                                  {unreadCount}
                                </span>
                              )}
                            </h3>
                            <button
                              onClick={() => setIsNotificationsOpen(false)}
                              className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center"
                            >
                              <X size={16} className="text-slate-300" />
                            </button>
                          </div>

                          {/* Liste */}
                          <div className="flex-1 overflow-y-auto">
                            {notifications.length === 0 ? (
                              <div className="text-center py-8 px-4">
                                <Bell size={32} className="text-slate-600 mx-auto mb-2" />
                                <p className="text-slate-400 text-sm">Aucune notification</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-white/10">
                                {notifications.map((notification) => (
                                  <Link
                                    key={notification.id}
                                    href={notification.link || "#"}
                                    onClick={async () => {
                                      if (!notification.is_read) {
                                        await markNotificationAsRead(notification.id);
                                        // Mettre à jour l'état local
                                        setNotifications((prev) =>
                                          prev.map((n) =>
                                            n.id === notification.id
                                              ? { ...n, is_read: true, read_at: new Date().toISOString() }
                                              : n
                                          )
                                        );
                                        // Décrémenter le compteur
                                        setUnreadCount((prev) => Math.max(0, prev - 1));
                                      }
                                      setIsNotificationsOpen(false);
                                    }}
                                    className={`block p-4 hover:bg-white/5 transition-colors ${
                                      !notification.is_read ? "bg-red-600/10" : ""
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="text-white font-medium text-sm truncate">
                                            {notification.title}
                                          </h4>
                                          {!notification.is_read && (
                                            <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                                          )}
                                        </div>
                                        <p className="text-slate-400 text-xs line-clamp-2">
                                          {notification.message}
                                        </p>
                                        <span className="text-slate-500 text-[10px] mt-1 block">
                                          {new Date(notification.created_at).toLocaleDateString("fr-BE", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          {notifications.length > 0 && (
                            <div className="p-3 border-t border-white/10">
                              <Link
                                href="/dashboard"
                                onClick={() => setIsNotificationsOpen(false)}
                                className="block text-center text-slate-300 hover:text-white text-xs font-medium"
                              >
                                Voir toutes les notifications →
                              </Link>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Menu utilisateur */}
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-300"
                      >
                        <div className="w-9 h-9 rounded-full border-2 border-white/20 overflow-hidden ring-2 ring-white/10 relative">
                          <Image
                            src={user.avatar}
                            alt={user.name}
                            width={36}
                            height={36}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </button>
                      {/* Badge Admin cliquable (visible uniquement pour les admins) */}
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full hover:bg-red-700 transition-colors flex items-center gap-1"
                          title="Accéder au panneau d'administration"
                        >
                          ADMIN
                        </Link>
                      )}
                    </div>

                  {/* Menu déroulant utilisateur */}
                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className={`absolute right-0 mt-3 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 border border-white/10 py-2 z-20 ${
                      user.role === "admin" ? "w-72" : "w-56"
                    }`}>
                      {/* Header avec badge ADMIN */}
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-medium text-sm">{user.name}</p>
                          {user.role === "admin" && (
                            <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs">{user.email}</p>
                      </div>

                      {/* Menu Admin (si admin) */}
                      {user.role === "admin" && (
                        <>
                          <div className="px-4 py-2">
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                              Administration
                            </p>
                          </div>
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                          >
                            <LayoutDashboard size={18} className="text-red-500" />
                            <span className="font-medium text-sm">Tableau de Bord Global</span>
                          </Link>
                          <Link
                            href="/admin?tab=moderation"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                          >
                            <FileText size={18} className="text-red-500" />
                            <span className="font-medium text-sm">Modération Annonces</span>
                          </Link>
                          <Link
                            href="/admin?tab=users"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                          >
                            <Users size={18} className="text-red-500" />
                            <span className="font-medium text-sm">Gestion Utilisateurs</span>
                          </Link>
                          <Link
                            href="/admin?tab=settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                          >
                            <Settings size={18} className="text-red-500" />
                            <span className="font-medium text-sm">Paramètres Site</span>
                          </Link>
                          <div className="my-2 border-t border-white/10" />
                          {/* Switch Simulation de Ban */}
                          <div className="px-4 py-2.5">
                            <button
                              onClick={() => {
                                toggleSimulation();
                                setIsUserMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                                isSimulatingBan
                                  ? "bg-red-500/20 border-2 border-red-500/50"
                                  : "bg-slate-800/50 border-2 border-slate-700/50 hover:bg-slate-800/70"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <TestTube size={18} className={isSimulatingBan ? "text-red-400" : "text-slate-400"} />
                                <span className={`font-medium text-sm ${isSimulatingBan ? "text-red-300" : "text-slate-300"}`}>
                                  {isSimulatingBan ? "Mode Test Actif" : "Simuler état banni"}
                                </span>
                              </div>
                              <div className={`w-10 h-6 rounded-full transition-all duration-200 ${
                                isSimulatingBan ? "bg-red-600" : "bg-slate-600"
                              }`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-all duration-200 mt-1 ${
                                  isSimulatingBan ? "ml-5" : "ml-1"
                                }`} />
                              </div>
                            </button>
                            {isSimulatingBan && (
                              <p className="text-[10px] text-red-400/80 mt-1.5 px-3">
                                ⚠️ Interface de test active
                              </p>
                            )}
                          </div>
                          <div className="my-2 border-t border-white/10" />
                          <div className="px-4 py-2">
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                              Mon Compte Perso
                            </p>
                          </div>
                        </>
                      )}

                      {/* Menu Utilisateur (toujours visible) */}
                      <Link
                        href="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                      >
                        <LayoutDashboard size={18} />
                        <span className="font-medium text-sm">Mon Garage / Mes Annonces</span>
                      </Link>
                      <Link
                        href="/favorites"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                      >
                        <Heart size={18} />
                        <span className="font-medium text-sm">Mes Favoris</span>
                      </Link>
                      <Link
                        href="/dashboard?tab=support"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                      >
                        <FileText size={18} />
                        <span className="font-medium text-sm">Mes Tickets Support</span>
                      </Link>
                      <Link
                        href="/dashboard?tab=settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                      >
                        <Settings size={18} />
                        <span className="font-medium text-sm">Paramètres Profil</span>
                      </Link>
                      <div className="my-2 border-t border-white/10" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                      >
                        <LogOut size={18} />
                        <span className="font-medium text-sm">Déconnexion</span>
                      </button>
                    </div>
                  </>
                )}
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-white hover:bg-white/10 font-medium text-sm rounded-full px-4 py-2 transition-all duration-300 tracking-wide"
              >
                Espace Membre
              </Link>
            )}

            {/* Bouton "Confier" - Pilule Premium */}
            {(() => {
              const isEffectivelyBanned = user?.is_banned || (isSimulatingBan && user?.role === "admin");
              if (isEffectivelyBanned) {
                return (
                  <button
                    disabled
                    className="bg-slate-600 text-slate-400 font-semibold text-sm px-6 py-2.5 rounded-full cursor-not-allowed opacity-50"
                    title={isSimulatingBan ? "Mode test actif : Publication désactivée" : "Votre compte est suspendu"}
                  >
                    Confier
                  </button>
                );
              }
              return (
                <Link
                  href="/sell"
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-red-900/20 hover:scale-105 border border-transparent hover:border-amber-500/50 tracking-wide"
                >
                  Confier
                </Link>
              );
            })()}
          </nav>
          )}

          {/* Bouton Menu Burger Mobile - Blanc - MASQUÉ si pas de bypass Alpha */}
          {hasAlphaBypass && (
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 text-white hover:text-slate-300 transition-colors duration-300"
              aria-label="Ouvrir le menu"
            >
              <Menu size={24} />
            </button>
          )}
        </div>
      </header>

      {/* Panneau latéral mobile - Design Sombre Glassmorphism */}
      <>
        {/* Overlay sombre */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] md:hidden"
            onClick={closeMenu}
          />
        )}

        {/* Drawer/Panneau latéral - Thème sombre - MASQUÉ si pas de bypass Alpha */}
        {hasAlphaBypass && (
          <div
            className={`fixed top-0 right-0 h-full w-80 bg-[#0a0a0b]/95 backdrop-blur-xl border-l border-white/10 z-[85] shadow-2xl shadow-black/50 md:hidden transform transition-transform duration-300 ease-out ${
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header du drawer */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                  <Gauge className="text-white" size={18} />
                </div>
                <h2 className="text-white font-semibold text-lg tracking-tight">
                  Octane<span className="text-red-500">98</span>
                </h2>
              </div>
              <button
                onClick={closeMenu}
                className="p-2 text-white hover:text-slate-300 hover:bg-white/10 rounded-full transition-all duration-300"
                aria-label="Fermer le menu"
              >
                <X size={24} />
              </button>
            </div>

          {/* Profil utilisateur (mobile) */}
          {user && (
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden ring-2 ring-white/10 relative">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white text-sm">{user.name}</p>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={closeMenu}
                        className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-bold rounded-full hover:bg-red-700 transition-colors"
                        title="Accéder au panneau d'administration"
                      >
                        ADMIN
                      </Link>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Liens de navigation mobile */}
          <nav className="flex flex-col p-4 space-y-1">
            {user && user.role === "admin" && (
              <>
                <div className="px-4 py-2">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    Administration
                  </p>
                </div>
                <Link
                  href="/admin"
                  onClick={closeMenu}
                  className="py-3 px-4 text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm rounded-xl transition-all duration-300 flex items-center gap-3"
                >
                  <LayoutDashboard size={20} className="text-red-500" />
                  Tableau de Bord Global
                </Link>
                <Link
                  href="/admin?tab=moderation"
                  onClick={closeMenu}
                  className="py-3 px-4 text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm rounded-xl transition-all duration-300 flex items-center gap-3"
                >
                  <FileText size={20} className="text-red-500" />
                  Modération Annonces
                </Link>
                <Link
                  href="/admin?tab=users"
                  onClick={closeMenu}
                  className="py-3 px-4 text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm rounded-xl transition-all duration-300 flex items-center gap-3"
                >
                  <Users size={20} className="text-red-500" />
                  Gestion Utilisateurs
                </Link>
                <Link
                  href="/admin?tab=settings"
                  onClick={closeMenu}
                  className="py-3 px-4 text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm rounded-xl transition-all duration-300 flex items-center gap-3"
                >
                  <Settings size={20} className="text-red-500" />
                  Paramètres Site
                </Link>
                <div className="my-2 border-t border-white/10" />
                {/* Switch Simulation de Ban (Mobile) */}
                <div className="px-4 py-3">
                  <button
                    onClick={() => {
                      toggleSimulation();
                      closeMenu();
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      isSimulatingBan
                        ? "bg-red-500/20 border-2 border-red-500/50"
                        : "bg-slate-800/50 border-2 border-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <TestTube size={20} className={isSimulatingBan ? "text-red-400" : "text-slate-400"} />
                      <span className={`font-medium text-sm ${isSimulatingBan ? "text-red-300" : "text-slate-300"}`}>
                        {isSimulatingBan ? "Mode Test Actif" : "Simuler état banni"}
                      </span>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-all duration-200 ${
                      isSimulatingBan ? "bg-red-600" : "bg-slate-600"
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-all duration-200 mt-1 ${
                        isSimulatingBan ? "ml-5" : "ml-1"
                      }`} />
                    </div>
                  </button>
                  {isSimulatingBan && (
                    <p className="text-[10px] text-red-400/80 mt-1.5 px-3">
                      ⚠️ Interface de test active
                    </p>
                  )}
                </div>
                <div className="my-2 border-t border-white/10" />
                <div className="px-4 py-2">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    Mon Compte Perso
                  </p>
                </div>
              </>
            )}
            {user && (
              <>
                <Link
                  href="/dashboard"
                  onClick={closeMenu}
                  className="py-3 px-4 text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm rounded-xl transition-all duration-300 flex items-center gap-3"
                >
                  <LayoutDashboard size={20} />
                  Mon Garage / Mes Annonces
                </Link>
                <Link
                  href="/dashboard?tab=support"
                  onClick={closeMenu}
                  className="py-3 px-4 text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm rounded-xl transition-all duration-300 flex items-center gap-3"
                >
                  <FileText size={20} />
                  Mes Tickets Support
                </Link>
                <Link
                  href="/dashboard?tab=settings"
                  onClick={closeMenu}
                  className="py-3 px-4 text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm rounded-xl transition-all duration-300 flex items-center gap-3"
                >
                  <Settings size={20} />
                  Paramètres Profil
                </Link>
              </>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="py-3 px-4 text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm rounded-xl transition-all duration-300"
              >
                {link.label}
              </Link>
            ))}

            {/* Lien Favoris avec badge pour mobile */}
            <Link
              href="/favorites"
              onClick={closeMenu}
              className="py-3 px-4 text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm rounded-xl transition-all duration-300 flex items-center justify-between"
            >
              <span className="flex items-center gap-3">
                <Heart
                  size={20}
                  className={favorites.length > 0 ? "fill-red-500 text-red-500" : ""}
                />
                Favoris
              </span>
              {favorites.length > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>

            {user ? (
              <button
                onClick={() => {
                  handleLogout();
                  closeMenu();
                }}
                className="mt-4 py-3 px-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium text-sm rounded-xl transition-all duration-300 flex items-center gap-3"
              >
                <LogOut size={20} />
                Déconnexion
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="mt-4 py-3 px-4 text-white hover:bg-white/10 font-medium text-sm rounded-xl transition-all duration-300 flex items-center gap-3 tracking-wide"
                >
                  <User size={20} />
                  Espace Membre
                </Link>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="mt-2 py-3 px-4 text-white hover:bg-white/10 font-medium text-sm rounded-xl transition-all duration-300 flex items-center gap-3 tracking-wide"
                >
                  Rejoindre
                </Link>
              </>
            )}

            {/* Bouton "Confier" mobile */}
            {(() => {
              const isEffectivelyBanned = user?.is_banned || (isSimulatingBan && user?.role === "admin");
              if (isEffectivelyBanned) {
                return (
                  <button
                    disabled
                    onClick={closeMenu}
                    className="mt-4 bg-slate-600 text-slate-400 font-semibold text-sm px-6 py-3 rounded-full cursor-not-allowed opacity-50 text-center"
                    title={isSimulatingBan ? "Mode test actif : Publication désactivée" : "Votre compte est suspendu"}
                  >
                    Confier
                  </button>
                );
              }
              return (
                <Link
                  href="/sell"
                  onClick={closeMenu}
                  className="mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-sm px-6 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-red-900/20 hover:scale-105 text-center border border-transparent hover:border-amber-500/50 tracking-wide"
                >
                  Confier
                </Link>
              );
            })()}
          </nav>
        </div>
      )}
      </>

      {/* Spacer pour compenser la navbar fixe (ajusté si bannière simulation visible) */}
      <div className={`h-16 ${isSimulatingBan && user?.role === "admin" ? "mt-14" : ""}`} />
    </>
  );
}

export { Navbar };
