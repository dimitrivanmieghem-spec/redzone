// Octane98 - Système de Permissions par Rôle
// Centralise la logique de vérification des permissions
// Source de vérité unique pour tous les types de rôles dans le projet

export type UserRole = 
  | "particulier" 
  | "pro" 
  | "admin" 
  | "moderator" 
  | "support" 
  | "editor" 
  | "viewer";

// ========================================
// CONSTANTES DE RÔLES
// ========================================

/**
 * Rôles qui peuvent accéder au back-office admin
 * Ces rôles ont le droit de voir le bouton '/admin' et d'accéder aux routes /admin
 */
export const BACKOFFICE_ROLES: UserRole[] = ["admin", "moderator", "support", "editor", "viewer"];

// ========================================
// FONCTIONS DE VÉRIFICATION D'ACCÈS
// ========================================

/**
 * Vérifie si un rôle peut accéder au back-office (routes /admin)
 * Utilise la constante BACKOFFICE_ROLES pour centraliser la logique
 * 
 * @param role - Le rôle à vérifier
 * @returns true si le rôle peut accéder au back-office
 * 
 * @example
 * canAccessBackOffice("admin") // true
 * canAccessBackOffice("moderator") // true
 * canAccessBackOffice("particulier") // false
 */
export function canAccessBackOffice(role: UserRole): boolean {
  return BACKOFFICE_ROLES.includes(role);
}

/**
 * Vérifie si un rôle peut accéder à une route admin
 * 
 * @deprecated Utilisez canAccessBackOffice() pour plus de clarté
 * Cette fonction est maintenue pour la rétrocompatibilité
 * 
 * @param role - Le rôle à vérifier
 * @returns true si le rôle peut accéder aux routes admin
 */
export function canAccessAdmin(role: UserRole): boolean {
  return canAccessBackOffice(role);
}

/**
 * Vérifie si un rôle peut accéder aux routes admin strictes (settings, users, etc.)
 */
export function canAccessAdminOnly(role: UserRole): boolean {
  return role === "admin";
}

/**
 * Vérifie si un rôle peut modérer les annonces
 */
export function canModerateVehicles(role: UserRole): boolean {
  return ["admin", "moderator"].includes(role);
}

/**
 * Vérifie si un rôle peut gérer les utilisateurs
 */
export function canManageUsers(role: UserRole): boolean {
  return role === "admin";
}

/**
 * Vérifie si un rôle peut gérer les tickets de support
 */
export function canManageSupport(role: UserRole): boolean {
  return ["admin", "support"].includes(role);
}

/**
 * Vérifie si un rôle peut gérer le contenu éditorial (articles, tribune, récits)
 */
export function canManageContent(role: UserRole): boolean {
  return ["admin", "editor"].includes(role);
}

/**
 * Vérifie si un rôle peut voir les données (lecture seule)
 * Tous les rôles back-office ont accès en lecture
 */
export function canViewData(role: UserRole): boolean {
  return canAccessBackOffice(role);
}

/**
 * Vérifie si un rôle peut modifier les paramètres du site
 */
export function canManageSettings(role: UserRole): boolean {
  return role === "admin";
}

/**
 * Retourne la liste des onglets accessibles pour un rôle donné
 */
export function getAccessibleTabs(role: UserRole): string[] {
  const allTabs = ["dashboard", "moderation", "vehicles", "users", "settings", "support", "content", "articles"];
  
  if (role === "admin") {
    return allTabs; // Admin a accès à tout
  }
  
  if (role === "moderator") {
    return ["dashboard", "moderation", "vehicles", "support"]; // Modération + support
  }
  
  if (role === "support") {
    return ["dashboard", "support"]; // Support uniquement
  }
  
  if (role === "editor") {
    return ["dashboard", "content", "articles"]; // Contenu éditorial
  }
  
  if (role === "viewer") {
    return ["dashboard"]; // Lecture seule - dashboard avec stats
  }
  
  return []; // Autres rôles n'ont pas accès
}

/**
 * Retourne le label d'un rôle en français
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    particulier: "Particulier",
    pro: "Professionnel",
    admin: "Administrateur",
    moderator: "Modérateur",
    support: "Support",
    editor: "Éditeur",
    viewer: "Lecteur/Auditeur",
  };
  return labels[role] || role;
}

/**
 * Retourne la couleur d'un badge de rôle
 */
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    particulier: "bg-slate-100 text-slate-700",
    pro: "bg-blue-100 text-blue-700",
    admin: "bg-red-600 text-white",
    moderator: "bg-orange-100 text-orange-700",
    support: "bg-green-100 text-green-700",
    editor: "bg-purple-100 text-purple-700",
    viewer: "bg-gray-100 text-gray-700",
  };
  return colors[role] || "bg-slate-100 text-slate-700";
}

/**
 * Droits des modérateurs
 * Les modérateurs peuvent :
 * - Valider/rejeter les annonces (modération)
 * - Voir les statistiques du dashboard
 * - Gérer les tickets de support
 * 
 * Les modérateurs NE PEUVENT PAS :
 * - Supprimer des utilisateurs
 * - Modifier les paramètres du site
 * - Accéder aux routes /admin/settings et /admin/users
 */
export const MODERATOR_RIGHTS = {
  // Permissions accordées
  canModerateVehicles: true,        // Validation d'annonces
  canViewDashboard: true,           // Accès au dashboard admin
  canManageSupport: true,           // Gestion des tickets
  canViewData: true,                // Lecture des données
  
  // Permissions refusées
  canManageUsers: false,            // ❌ Suppression d'utilisateurs
  canManageSettings: false,         // ❌ Paramètres du site
  canAccessAdminOnlyRoutes: false,  // ❌ Routes /admin/settings et /admin/users
} as const;

