"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Mail,
  Calendar,
  Shield,
  Search,
  Ban,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import {
  getAllUsers,
  toggleUserBan,
  updateUserRole,
  type UserProfile,
} from "@/lib/supabase/users";

export default function AdminEquipePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Charger les utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      if (user && user.role === "admin") {
        try {
          setIsLoading(true);
          const allUsers = await getAllUsers();
          setUsers(allUsers);
        } catch (error) {
          console.error("Erreur chargement utilisateurs:", error);
          showToast("Erreur lors du chargement des utilisateurs", "error");
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadUsers();
  }, [user, showToast]);

  // Filtrer selon la recherche
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.full_name &&
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRoleChange = async (
    userId: string,
    newRole: "particulier" | "pro" | "admin"
  ) => {
    // Protection : ne pas modifier son propre rôle
    if (user && user.id === userId) {
      showToast("Vous ne pouvez pas modifier votre propre rôle", "error");
      return;
    }

    // Protection : ne pas dégrader un autre admin
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser?.role === "admin" && newRole !== "admin") {
      if (
        !confirm(
          "Attention : Vous essayez de dégrader un autre administrateur. Êtes-vous sûr ?"
        )
      ) {
        return;
      }
    }

    try {
      setIsProcessing(userId);
      await updateUserRole(userId, newRole);
      
      // Mettre à jour l'état local
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      
      showToast("Rôle mis à jour avec succès ✓", "success");
    } catch (error) {
      console.error("Erreur modification rôle:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Erreur lors de la modification du rôle",
        "error"
      );
    } finally {
      setIsProcessing(null);
    }
  };

  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
    // Protection : ne pas bannir/débannir soi-même
    if (user && user.id === userId) {
      showToast("Vous ne pouvez pas modifier votre propre statut", "error");
      return;
    }

    try {
      setIsProcessing(userId);
      await toggleUserBan(userId, !currentStatus);
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, is_banned: !currentStatus } : u
        )
      );
      showToast(
        currentStatus
          ? "Utilisateur débanni avec succès ✓"
          : "Utilisateur banni avec succès ✓",
        "success"
      );
    } catch (error) {
      console.error("Erreur modification statut:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Erreur lors de la modification",
        "error"
      );
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
          <Users className="text-red-600" size={28} />
          Gestion de l&apos;Équipe
        </h2>
      </header>

      <div className="p-8">
        {/* Recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par email ou nom..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
            />
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Utilisateurs ({filteredUsers.length})
          </h3>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {searchTerm
                ? "Aucun résultat trouvé"
                : "Aucun utilisateur trouvé"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-bold text-slate-900">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900">
                      Nom
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900">
                      Rôle
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900">
                      Inscrit le
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900">
                      Statut
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isCurrentUser = user && user.id === u.id;
                    return (
                      <tr
                        key={u.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 ${
                          isCurrentUser ? "bg-amber-50" : ""
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-slate-400" />
                            <span className="font-medium text-slate-900">
                              {u.email}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {u.full_name || "Non renseigné"}
                        </td>
                        <td className="py-3 px-4">
                          {isCurrentUser ? (
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                                {u.role === "admin"
                                  ? "Admin"
                                  : u.role === "pro"
                                  ? "Pro"
                                  : "Particulier"}
                              </span>
                              <span className="text-xs text-slate-500">
                                (Vous)
                              </span>
                            </div>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) =>
                                handleRoleChange(
                                  u.id,
                                  e.target.value as "particulier" | "pro" | "admin"
                                )
                              }
                              disabled={isProcessing === u.id}
                              className={`px-3 py-1 rounded-lg border-2 font-medium transition-all ${
                                u.role === "admin"
                                  ? "bg-red-600 text-white border-red-600"
                                  : u.role === "pro"
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              <option value="particulier">Particulier</option>
                              <option value="pro">Pro</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(u.created_at).toLocaleDateString("fr-BE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {u.is_banned ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                              <Ban size={12} />
                              Banni
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1 w-fit">
                              <CheckCircle size={12} />
                              Actif
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {!isCurrentUser && (
                            <button
                              onClick={() => handleToggleBan(u.id, u.is_banned)}
                              disabled={isProcessing === u.id}
                              className={`px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                u.is_banned
                                  ? "bg-green-600 hover:bg-green-700 text-white"
                                  : "bg-red-600 hover:bg-red-700 text-white"
                              }`}
                            >
                              {isProcessing === u.id
                                ? "..."
                                : u.is_banned
                                ? "Débannir"
                                : "Bannir"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

