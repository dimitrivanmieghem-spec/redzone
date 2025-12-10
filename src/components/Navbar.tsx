"use client";

import { Menu, X, Heart, ChevronDown, User, LayoutDashboard, LogOut, Gauge } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { favorites } = useFavorites();
  const { user, logout } = useAuth();
  const router = useRouter();

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

  const navLinks = [
    { href: "/", label: "Acheter" },
    { href: "/sell", label: "Vendre" },
    { href: "/tribune", label: "Tribune Passion" },
    { href: "/calculateur", label: "Calculateur de Taxes" },
  ];

  return (
    <>
      {/* Navbar Premium - Design Sombre Glassmorphism */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-white/10 z-50 hidden md:block">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo RedZone */}
          <Link 
            href="/" 
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/30 group-hover:shadow-red-900/50 transition-all duration-300 group-hover:scale-105">
              <Gauge className="text-white" size={20} />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              Red<span className="text-red-500">Zone</span>
            </span>
          </Link>

          {/* Navigation Desktop */}
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
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-300"
                >
                  <div className="w-9 h-9 rounded-full border-2 border-white/20 overflow-hidden ring-2 ring-white/10">
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={36}
                      height={36}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>

                {/* Menu déroulant utilisateur */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-56 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 border border-white/10 py-2 z-20">
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-white font-medium text-sm">{user.name}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{user.email}</p>
                      </div>
                      <Link
                        href={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                      >
                        <LayoutDashboard size={18} />
                        <span className="font-medium text-sm">
                          {user.role === "admin" ? "Dashboard Admin" : "Mon Dashboard"}
                        </span>
                      </Link>
                      <Link
                        href="/favorites"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                      >
                        <Heart size={18} />
                        <span className="font-medium text-sm">Mes Favoris</span>
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
            ) : (
              <Link
                href="/login"
                className="text-white hover:bg-white/10 font-medium text-sm rounded-full px-4 py-2 transition-all duration-300"
              >
                Connexion
              </Link>
            )}

            {/* Bouton "Vendre ma voiture" - Pilule Premium */}
            <Link
              href="/sell"
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-sm px-6 py-2.5 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-red-900/20 hover:scale-105"
            >
              Vendre ma voiture
            </Link>
          </nav>

          {/* Bouton Menu Burger Mobile - Blanc */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-white hover:text-slate-300 transition-colors duration-300"
            aria-label="Ouvrir le menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Panneau latéral mobile - Design Sombre Glassmorphism */}
      <>
        {/* Overlay sombre */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMenu}
          />
        )}

        {/* Drawer/Panneau latéral - Thème sombre */}
        <div
          className={`fixed top-0 right-0 h-full w-80 bg-slate-950/95 backdrop-blur-xl border-l border-white/10 z-50 shadow-2xl shadow-black/50 md:hidden transform transition-transform duration-300 ease-out ${
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
                Red<span className="text-red-500">Zone</span>
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
                <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden ring-2 ring-white/10">
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">{user.name}</p>
                  <p className="text-slate-400 text-xs">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Liens de navigation mobile */}
          <nav className="flex flex-col p-4 space-y-1">
            {user && (
              <Link
                href={user.role === "admin" ? "/admin/dashboard" : "/dashboard"}
                onClick={closeMenu}
                className="py-3 px-4 text-slate-300 hover:text-white hover:bg-white/5 font-medium text-sm rounded-xl transition-all duration-300 flex items-center gap-3"
              >
                <LayoutDashboard size={20} />
                {user.role === "admin" ? "Dashboard Admin" : "Mon Dashboard"}
              </Link>
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
              <Link
                href="/login"
                onClick={closeMenu}
                className="mt-4 py-3 px-4 text-white hover:bg-white/10 font-medium text-sm rounded-xl transition-all duration-300 flex items-center gap-3"
              >
                <User size={20} />
                Connexion
              </Link>
            )}

            {/* Bouton "Vendre ma voiture" mobile */}
            <Link
              href="/sell"
              onClick={closeMenu}
              className="mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-sm px-6 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-red-900/20 hover:scale-105 text-center"
            >
              Vendre ma voiture
            </Link>
          </nav>
        </div>
      </>

      {/* Spacer pour compenser la navbar fixe */}
      <div className="h-16" />
    </>
  );
}
