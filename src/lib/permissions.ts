// RedZone - Système de Permissions par Rôle
// Centralise la logique de vérification des permissions

export type UserRole = 
  | "particulier" 
  | "pro" 
  | "admin" 
  | "moderator" 
  | "support" 
  | "editor" 
  | "viewer";

/**
 * Vérifie si un rôle peut accéder à une route admin
 */
export function canAccessAdmin(role: UserRole): boolean {
  return ["admin", "moderator", "support", "editor", "viewer"].includes(role);
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
 */
export function canViewData(role: UserRole): boolean {
  return ["admin", "moderator", "support", "editor", "viewer"].includes(role);
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

