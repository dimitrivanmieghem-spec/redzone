"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/permissions";

// Valeur par défaut pour le rôle utilisateur
const DEFAULT_USER_ROLE: UserRole = "particulier";

// Rôle admin pour les vérifications spécifiques
const ADMIN_ROLE: UserRole = "admin";

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  is_banned?: boolean;
  ban_reason?: string | null;
  is_founder?: boolean;
  ban_until?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAdmin: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Utiliser le singleton pour éviter les problèmes de connexion
  const supabase = createClient();
  const pathname = usePathname();

  // Détecter si on est sur une page publique (pas besoin de profil complet)
  const isPublicPage = () => {
    const publicRoutes = [
      "/",
      "/login",
      "/register",
      "/forgot-password",
      "/reset-password",
      "/search",
      "/cars",
      "/legal",
      "/auth",
      "/coming-soon",
    ];
    return publicRoutes.some((route) =>
      pathname === route || pathname?.startsWith(`${route}/`)
    );
  };

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const loadUser = async () => {
      try {
        // ⚡ OPTIMISATION : Sur pages publiques, juste vérifier si session existe
        if (isPublicPage()) {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();

          // Sur pages publiques, on ne charge pas le profil complet
          // Juste vérifier si une session existe pour éviter les redirections inutiles
          if (error || !user) {
            setUser(null);
          } else {
            // Session existe, créer un user minimal sans requête DB
            setUser({
              id: user.id,
              email: user.email || "",
              name: user.email?.split("@")[0] || "Utilisateur",
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email?.split("@")[0] || "U")}&background=DC2626&color=fff&bold=true`,
              role: "particulier", // Rôle par défaut temporaire
              is_banned: false,
              ban_reason: null,
              ban_until: null,
              is_founder: Boolean(user.user_metadata?.is_founder),
            });
          }
          setIsLoading(false);
          return;
        }

        // Sur pages protégées : chargement complet avec profil DB
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        // Gérer gracieusement les erreurs de session manquante (normal si non connecté)
        if (error) {
          // Si c'est une erreur de session manquante, c'est normal (utilisateur non connecté)
          if (
            error.name === "AuthSessionMissingError" ||
            error.message?.includes("session") ||
            error.message?.includes("Auth session missing")
          ) {
            setUser(null);
            setIsLoading(false);
            return;
          }
          // Pour les autres erreurs, on les log
          console.error("Erreur récupération utilisateur:", error);
          setUser(null);
          setIsLoading(false);
          return;
        }

        if (user) {
          await updateUserFromSession(user);
        } else {
          setUser(null);
        }
      } catch (error: any) {
        // Gérer gracieusement les exceptions de session manquante
        if (
          error?.name === "AuthSessionMissingError" ||
          error?.message?.includes("session") ||
          error?.message?.includes("Auth session missing")
        ) {
          setUser(null);
        } else {
          console.error("Erreur chargement utilisateur:", error);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Écouter les changements d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      try {
        if (session?.user) {
          await updateUserFromSession(session.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        // Protéger la boucle d'événements Auth : ne pas laisser une erreur silencieuse la briser
        console.error("Erreur dans onAuthStateChange:", error);
        // En cas d'erreur, définir user à null pour éviter un état incohérent
        // (sauf si c'est une erreur de ban qui doit être propagée)
        if (!(error instanceof Error && error.message.includes("banni"))) {
          setUser(null);
        }
      }
    });

    // Démarrer le monitoring de connexion (côté client uniquement)
    // DÉSACTIVÉ TEMPORAIREMENT : peut causer des conflits avec les requêtes de login
    // TODO: Réactiver une fois les problèmes de timeout résolus
    /*
    if (typeof window !== "undefined") {
      import("@/lib/supabase/connection-monitor").then(({ startConnectionMonitoring }) => {
        startConnectionMonitoring();
      }).catch((err) => {
        console.warn("Impossible de démarrer le monitoring de connexion:", err);
      });
    }
    */

    return () => {
      subscription.unsubscribe();
      // DÉSACTIVÉ TEMPORAIREMENT : voir commentaire ci-dessus
      /*
      if (typeof window !== "undefined") {
        const { stopConnectionMonitoring } = require("@/lib/supabase/connection-monitor");
        stopConnectionMonitoring();
      }
      */
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase.auth]);

  // Transformer SupabaseUser en User
  // MODE FAIL-SAFE : Garantit que setUser est TOUJOURS appelé, même si la DB échoue
  const updateUserFromSession = useCallback(async (supabaseUser: SupabaseUser) => {
    try {
      // Récupérer le profil depuis la table profiles (avec gestion d'erreur)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .single();

      // MODE DÉGRADÉ : Si erreur ou profil manquant, créer un utilisateur par défaut
      if (profileError || !profile) {
        // Log l'erreur pour debugging, mais ne bloque pas
        if (profileError) {
          console.warn("Profil non trouvé ou erreur de récupération:", profileError.message);
        } else {
          console.warn("Profil manquant pour l'utilisateur:", supabaseUser.id);
        }

        // Créer un utilisateur minimal en mode dégradé avec les infos de base
        const defaultName = supabaseUser.email?.split("@")[0] || "Utilisateur";
        const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultName)}&background=DC2626&color=fff&bold=true`;
        
        // Lire is_founder depuis user_metadata en fallback
        const isFounder = Boolean(
          supabaseUser.user_metadata?.is_founder === true ||
          supabaseUser.user_metadata?.isFounder === true
        );

        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          name: supabaseUser.user_metadata?.full_name || defaultName,
          avatar: supabaseUser.user_metadata?.avatar_url || defaultAvatar,
          role: DEFAULT_USER_ROLE, // Rôle par défaut en mode dégradé
          is_banned: false,
          ban_reason: null,
          ban_until: null,
          is_founder: isFounder,
        });
        return; // Sortir de la fonction après avoir défini l'utilisateur par défaut
      }

      // PROFIL TROUVÉ : Traitement normal avec toutes les données
      // Logger l'accès au profil (RGPD - accès aux données personnelles)
      try {
        const { logDataAccess } = await import("@/lib/supabase/audit-logs-client");
        await logDataAccess("profile", supabaseUser.id, "Accès au profil utilisateur");
      } catch (logError) {
        // Ne pas bloquer le chargement en cas d'erreur de logging
        console.error("Erreur lors du logging d'audit:", logError);
      }

      // Vérifier si le ban a expiré
      if (profile.is_banned && profile.ban_until) {
        const banUntilDate = new Date(profile.ban_until);
        if (banUntilDate < new Date()) {
          // Ban expiré, débannir automatiquement
          await supabase
            .from("profiles")
            .update({
              is_banned: false,
              ban_reason: null,
              ban_until: null,
            })
            .eq("id", supabaseUser.id);
          profile.is_banned = false;
          profile.ban_reason = null;
          profile.ban_until = null;
        }
      }

      // Lire la vraie valeur is_founder depuis le profil dans la base de données
      // Priorité : 1) profile.is_founder (source de vérité), 2) user_metadata (fallback), 3) false (fail-safe)
      const isFounder = Boolean(
        profile.is_founder === true ||
        supabaseUser.user_metadata?.is_founder === true ||
        supabaseUser.user_metadata?.isFounder === true
      );

      // Définir l'utilisateur avec le profil complet
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        name: profile.full_name || supabaseUser.email?.split("@")[0] || "Utilisateur",
        avatar: profile.avatar_url || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            profile.full_name || supabaseUser.email?.split("@")[0] || "U"
          )}&background=DC2626&color=fff&bold=true`,
        role: (profile.role as UserRole) || DEFAULT_USER_ROLE,
        is_banned: profile.is_banned || false,
        ban_reason: profile.ban_reason || null,
        ban_until: profile.ban_until || null,
        is_founder: isFounder,
      });
    } catch (error) {
      // Gestion d'erreur critique : même en cas d'exception, créer un utilisateur minimal
      console.error("Erreur critique chargement profil:", error);
      
      // Si l'erreur concerne un ban, la propager pour traitement spécial
      if (error instanceof Error && error.message.includes("banni")) {
        throw error;
      }

      // MODE DÉGRADÉ D'URGENCE : Créer un utilisateur minimal pour éviter le blocage
      const defaultName = supabaseUser.email?.split("@")[0] || "Utilisateur";
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultName)}&background=DC2626&color=fff&bold=true`;
      
      const isFounder = Boolean(
        supabaseUser.user_metadata?.is_founder === true ||
        supabaseUser.user_metadata?.isFounder === true
      );

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        name: supabaseUser.user_metadata?.full_name || defaultName,
        avatar: supabaseUser.user_metadata?.avatar_url || defaultAvatar,
        role: DEFAULT_USER_ROLE,
        is_banned: false,
        ban_reason: null,
        ban_until: null,
        is_founder: isFounder,
      });
    }
  }, [supabase]);

  // Connexion
  async function login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await updateUserFromSession(data.user);
      }
    } catch (error) {
      console.error("Erreur login:", error);
      throw new Error(
        error instanceof Error ? error.message : "Erreur de connexion"
      );
    }
  }

  // Inscription
  async function register(email: string, password: string, name: string) {
    try {
      // 1. Créer le compte auth (emailRedirectTo: null pour désactiver la confirmation)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Pas de redirection email
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        console.error("Erreur Supabase signUp:", error);
        throw error;
      }

      if (data.user) {
        // 2. Créer le profil
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email: email,
          full_name: name,
          role: DEFAULT_USER_ROLE, // Par défaut, mais peut être modifié via metadata
        });

        if (profileError) {
          console.error("Erreur création profil:", profileError);
          // Si le profil existe déjà (double clic), on continue
          if (!profileError.message.includes("duplicate") && !profileError.message.includes("unique")) {
            throw profileError;
          }
        }

        // 3. Mettre à jour la session
        await updateUserFromSession(data.user);
      } else {
        throw new Error("Aucun utilisateur créé");
      }
    } catch (error) {
      console.error("Erreur register complète:", error);
      throw error; // Propager l'erreur originale pour affichage détaillé
    }
  }

  // Déconnexion
  async function logout() {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Erreur logout:", error);
    }
  }

  // Login admin - Nécessite un compte admin existant dans Supabase
  async function loginAdmin(password: string) {
    // IMPORTANT : Vous devez d'abord créer un compte admin dans Supabase
    // Voir le guide dans GUIDE_CONNEXION.md
    
    // Option 1 : Si vous avez créé un compte admin avec email/password
    // Utilisez directement login() avec votre email admin
    
    // Option 2 : Pour le dev, on peut utiliser un email admin par défaut
    // Remplacez "admin@octane98.be" par votre email admin réel
    const adminEmail = "admin@octane98.be"; // ⚠️ CHANGEZ CET EMAIL
    
    try {
      await login(adminEmail, password);
      
      // Vérifier que l'utilisateur est bien admin après connexion
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error("Erreur de vérification de l'utilisateur");
      }
      
      if (user) {
        await updateUserFromSession(user);
        
        // Attendre un peu pour que l'état user soit mis à jour
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Vérifier le rôle via la base de données directement
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (profileError) {
          console.error("Erreur récupération profil:", profileError);
          await logout();
          throw new Error("Erreur de vérification du profil administrateur");
        }
        
        if (!profile || (profile.role as UserRole) !== ADMIN_ROLE) {
          await logout();
          throw new Error("Ce compte n'est pas administrateur. Contactez un admin pour obtenir les droits.");
        }
      } else {
        throw new Error("Aucun utilisateur trouvé après connexion");
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("administrateur")) {
        throw error;
      }
      throw new Error("Email ou mot de passe incorrect, ou compte non admin");
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        loginAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

