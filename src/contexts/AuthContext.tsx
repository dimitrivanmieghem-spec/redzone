"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: "particulier" | "pro" | "admin" | "moderator" | "support" | "editor" | "viewer";
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

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Utiliser getUser() au lieu de getSession() pour plus de sécurité
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
      if (session?.user) {
        await updateUserFromSession(session.user);
      } else {
        setUser(null);
      }
    });

    // Démarrer le monitoring de connexion (côté client uniquement)
    if (typeof window !== "undefined") {
      import("@/lib/supabase/connection-monitor").then(({ startConnectionMonitoring }) => {
        startConnectionMonitoring();
      }).catch((err) => {
        console.warn("Impossible de démarrer le monitoring de connexion:", err);
      });
    }

    return () => {
      subscription.unsubscribe();
      if (typeof window !== "undefined") {
        const { stopConnectionMonitoring } = require("@/lib/supabase/connection-monitor");
        stopConnectionMonitoring();
      }
    };
  }, [supabase.auth]);

  // Transformer SupabaseUser en User
  async function updateUserFromSession(supabaseUser: SupabaseUser) {
    try {
      // Récupérer le profil depuis la table profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", supabaseUser.id)
        .single();

      // Logger l'accès au profil (RGPD - accès aux données personnelles)
      if (profile) {
        try {
          const { logDataAccess } = await import("@/lib/supabase/audit-logs-client");
          await logDataAccess("profile", supabaseUser.id, "Accès au profil utilisateur");
        } catch (logError) {
          // Ne pas bloquer le chargement en cas d'erreur de logging
          console.error("Erreur lors du logging d'audit:", logError);
        }
      }

      // Vérifier si le ban a expiré
      if (profile?.is_banned && profile?.ban_until) {
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

      // Vérifier si l'utilisateur est fondateur (depuis user_metadata ou simulation)
      const isFounder = Boolean(
        supabaseUser.user_metadata?.is_founder === true ||
        supabaseUser.user_metadata?.isFounder === true ||
        // Simulation : les 500 premiers utilisateurs (basé sur l'ID ou la date de création)
        (supabaseUser.created_at && new Date(supabaseUser.created_at) < new Date("2025-02-01"))
      );

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email || "",
        name: profile?.full_name || supabaseUser.email?.split("@")[0] || "Utilisateur",
        avatar: profile?.avatar_url || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            profile?.full_name || supabaseUser.email?.split("@")[0] || "U"
          )}&background=DC2626&color=fff&bold=true`,
        role: (profile?.role as "particulier" | "pro" | "admin") || "particulier",
        is_banned: profile?.is_banned || false,
        ban_reason: profile?.ban_reason || null,
        ban_until: profile?.ban_until || null,
        is_founder: isFounder,
      });
    } catch (error) {
      console.error("Erreur chargement profil:", error);
      if (error instanceof Error && error.message.includes("banni")) {
        throw error;
      }
    }
  }

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
          role: "particulier", // Par défaut, mais peut être modifié via metadata
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
    // Remplacez "admin@redzone.be" par votre email admin réel
    const adminEmail = "admin@redzone.be"; // ⚠️ CHANGEZ CET EMAIL
    
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
        
        if (!profile || profile.role !== "admin") {
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

