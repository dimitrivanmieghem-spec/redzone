"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  ArrowLeft,
  Ban,
  CheckCircle,
  XCircle,
  Car,
  Mail,
  Calendar,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import {
  getAllUsers,
  toggleUserBan,
  getUserWithVehicles,
  getUserVehicles,
  type UserProfile,
  type UserWithVehicles,
} from "@/lib/supabase/users";
import { Vehicule } from "@/lib/supabase/types";

export default function AdminUsersPage() {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithVehicles | null>(
    null
  );
  const [userVehicles, setUserVehicles] = useState<Vehicule[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

  // Protection : Rediriger si non admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      showToast("Accès refusé - Administrateur uniquement", "error");
      router.push("/");
    }
  }, [user, isLoading, router, showToast]);

  // Charger les utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      if (user && user.role === "admin") {
        try {
          setIsLoadingUsers(true);
          const allUsers = await getAllUsers();
          setUsers(allUsers);
        } catch (error) {
          console.error("Erreur chargement utilisateurs:", error);
          showToast("Erreur lors du chargement des utilisateurs", "error");
        } finally {
          setIsLoadingUsers(false);
        }
      }
    };

    loadUsers();
  }, [user, showToast]);

  // Charger les véhicules d'un utilisateur
  const loadUserVehicles = async (userId: string) => {
    try {
      setIsLoadingVehicles(true);
      const userData = await getUserWithVehicles(userId);
      if (userData) {
        setSelectedUser(userData);
        const vehicles = await getUserVehicles(userId);
        setUserVehicles(vehicles);
      }
    } catch (error) {
      console.error("Erreur chargement véhicules:", error);
      showToast("Erreur lors du chargement des véhicules", "error");
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  // Bannir/Débannir un utilisateur
  const handleToggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserBan(userId, !currentStatus);
      showToast(
        currentStatus
          ? "Utilisateur débanni avec succès"
          : "Utilisateur banni avec succès",
        "success"
      );
      // Recharger la liste
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      // Mettre à jour l'utilisateur sélectionné si c'est le même
      if (selectedUser && selectedUser.id === userId) {
        const updatedUser = await getUserWithVehicles(userId);
        if (updatedUser) setSelectedUser(updatedUser);
      }
    } catch (error) {
      console.error("Erreur modification statut:", error);
      showToast(
        error instanceof Error ? error.message : "Erreur lors de la modification",
        "error"
      );
    }
  };

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

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                <Users size={32} className="text-red-600" />
                Gestion des Utilisateurs
              </h1>
              <p className="text-slate-400">
                Gérez les utilisateurs, bannissements et statistiques
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des utilisateurs */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-3xl p-6 shadow-2xl">
              <h2 className="text-xl font-black text-white mb-6">
                Liste des Utilisateurs ({users.length})
              </h2>

              {isLoadingUsers ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                  <p className="text-slate-400">Chargement...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  Aucun utilisateur trouvé
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        selectedUser?.id === u.id
                          ? "border-red-600 bg-red-600/10"
                          : "border-slate-700 hover:border-slate-600 bg-slate-700/50"
                      }`}
                      onClick={() => loadUserVehicles(u.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Mail size={18} className="text-slate-400" />
                            <span className="font-bold text-white">
                              {u.email}
                            </span>
                            {u.role === "admin" && (
                              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <Shield size={12} />
                                Admin
                              </span>
                            )}
                            {u.is_banned && (
                              <span className="px-2 py-1 bg-red-900 text-red-200 text-xs font-bold rounded-full flex items-center gap-1">
                                <Ban size={12} />
                                Banni
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(u.created_at).toLocaleDateString("fr-BE")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Car size={14} />
                              Véhicules
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBan(u.id, u.is_banned);
                          }}
                          className={`px-4 py-2 rounded-full font-bold transition-all ${
                            u.is_banned
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-red-600 hover:bg-red-700 text-white"
                          }`}
                        >
                          {u.is_banned ? (
                            <>
                              <CheckCircle size={16} className="inline mr-2" />
                              Débannir
                            </>
                          ) : (
                            <>
                              <Ban size={16} className="inline mr-2" />
                              Bannir
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Détails utilisateur */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-3xl p-6 shadow-2xl sticky top-8">
              <h2 className="text-xl font-black text-white mb-6">
                Détails Utilisateur
              </h2>

              {!selectedUser ? (
                <div className="text-center py-12 text-slate-400">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez un utilisateur pour voir les détails</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Infos utilisateur */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 mb-2">
                      Informations
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-white font-bold">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Nom</p>
                        <p className="text-white">
                          {selectedUser.full_name || "Non renseigné"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Rôle</p>
                        <p className="text-white font-bold">
                          {selectedUser.role === "admin" ? "Administrateur" : "Utilisateur"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Statut</p>
                        <p
                          className={`font-bold ${
                            selectedUser.is_banned
                              ? "text-red-500"
                              : "text-green-500"
                          }`}
                        >
                          {selectedUser.is_banned ? "Banni" : "Actif"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Inscrit le</p>
                        <p className="text-white">
                          {new Date(selectedUser.created_at).toLocaleDateString(
                            "fr-BE",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Statistiques */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 mb-2">
                      Statistiques
                    </h3>
                    <div className="bg-slate-700/50 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Véhicules publiés</span>
                        <span className="text-white font-black text-xl">
                          {selectedUser.vehicles_count}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Liste des véhicules */}
                  {isLoadingVehicles ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-2"></div>
                      <p className="text-xs text-slate-400">Chargement...</p>
                    </div>
                  ) : userVehicles.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 mb-3">
                        Véhicules ({userVehicles.length})
                      </h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {userVehicles.map((v) => (
                          <Link
                            key={v.id}
                            href={`/cars/${v.id}`}
                            className="block p-3 bg-slate-700/50 rounded-xl hover:bg-slate-700 transition-colors"
                          >
                            <p className="text-white font-bold text-sm">
                              {v.marque} {v.modele}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {v.prix.toLocaleString("fr-BE")} € •{" "}
                              {v.status === "active" ? (
                                <span className="text-green-500">Actif</span>
                              ) : v.status === "pending" ? (
                                <span className="text-yellow-500">En attente</span>
                              ) : (
                                <span className="text-red-500">Rejeté</span>
                              )}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Car size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun véhicule publié</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

