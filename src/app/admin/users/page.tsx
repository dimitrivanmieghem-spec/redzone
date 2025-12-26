"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Loader2,
  Ban,
  Trash2,
  Calendar,
  Shield,
  MessageSquare,
  FileText,
  Eye,
  Mail,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Car,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { getAllUsers, getUserWithVehicles, getUserVehicles, type UserProfile, type UserWithVehicles } from "@/lib/supabase/users";
import { banUser, unbanUser, deleteUser, createUserManually } from "@/lib/supabase/server-actions/users";
import { Vehicule } from "@/lib/supabase/types";

export default function UsersPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [minDateTime, setMinDateTime] = useState<string>("");

  // Calculer la date actuelle uniquement côté client pour éviter les problèmes d'hydratation
  useEffect(() => {
    const now = new Date();
    setCurrentDate(now);
    setMinDateTime(now.toISOString().slice(0, 16));
  }, []);
  const [selectedUser, setSelectedUser] = useState<UserWithVehicles | null>(null);
  const [userVehicles, setUserVehicles] = useState<Vehicule[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [banModalOpen, setBanModalOpen] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banUntil, setBanUntil] = useState("");
  const [isPermanentBan, setIsPermanentBan] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    role: "particulier" as "particulier" | "pro" | "admin" | "moderator" | "support" | "editor" | "viewer",
  });

  useEffect(() => {
    const loadUsers = async () => {
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
    };
    loadUsers();
  }, [showToast]);

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

  const handleOpenBanModal = (userId: string, isBanned: boolean) => {
    if (isBanned) {
      handleUnban(userId);
    } else {
      setBanModalOpen(userId);
      setBanReason("");
      setBanUntil("");
      setIsPermanentBan(false);
    }
  };

  const handleBan = async () => {
    if (!banModalOpen || !banReason.trim()) {
      showToast("Veuillez saisir une raison", "error");
      return;
    }
    try {
      setIsProcessing(true);
      await banUser({
        userId: banModalOpen,
        reason: banReason.trim(),
        banUntil: isPermanentBan ? null : banUntil || null,
      });
      showToast("Utilisateur banni avec succès", "success");
      setBanModalOpen(null);
      setBanReason("");
      setBanUntil("");
      setIsPermanentBan(false);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      if (selectedUser && selectedUser.id === banModalOpen) {
        const updatedUser = await getUserWithVehicles(banModalOpen);
        if (updatedUser) setSelectedUser(updatedUser);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Erreur bannissement:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors du bannissement", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      setIsProcessing(true);
      await unbanUser(userId);
      showToast("Utilisateur débanni avec succès", "success");
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      if (selectedUser && selectedUser.id === userId) {
        const updatedUser = await getUserWithVehicles(userId);
        if (updatedUser) setSelectedUser(updatedUser);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Erreur débannissement:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors du débannissement", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const isDeleteConfirmed = deleteConfirmText.trim().toUpperCase() === 'SUPPRIMER';

  const handleDelete = async () => {
    if (!deleteModalOpen) return;
    if (!isDeleteConfirmed) {
      showToast('Veuillez taper "SUPPRIMER" pour confirmer', "error");
      return;
    }
    try {
      setIsProcessing(true);
      await deleteUser(deleteModalOpen);
      showToast("Utilisateur supprimé définitivement", "success");
      setDeleteModalOpen(null);
      setDeleteConfirmText("");
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      if (selectedUser && selectedUser.id === deleteModalOpen) {
        setSelectedUser(null);
        setUserVehicles([]);
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Erreur suppression:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors de la suppression", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedUserForBan = banModalOpen ? users.find(u => u.id === banModalOpen) : null;
  const selectedUserForDelete = deleteModalOpen ? users.find(u => u.id === deleteModalOpen) : null;

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="bg-neutral-950 border-b border-white/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
            <Users className="text-red-600" size={28} />
            Gestion des Utilisateurs
          </h2>
          <button
            onClick={() => {
              setCreateUserModalOpen(true);
              setNewUserData({
                email: "",
                password: "",
                confirmPassword: "",
                fullName: "",
                role: "particulier",
              });
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Créer un utilisateur
          </button>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des utilisateurs */}
          <div className="lg:col-span-2">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h3 className="text-xl font-black text-white mb-6">Liste des Utilisateurs ({users.length})</h3>
              {isLoadingUsers ? (
                <div className="text-center py-12">
                  <Loader2 className="animate-spin text-red-600 mx-auto mb-4" size={32} />
                  <p className="text-neutral-400">Chargement...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">Aucun utilisateur trouvé</div>
              ) : (
                <div className="space-y-3">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        selectedUser?.id === u.id
                          ? "border-red-600 bg-red-50 shadow-lg"
                          : "border-neutral-700 hover:border-neutral-600 bg-neutral-900 hover:bg-neutral-800"
                      }`}
                      onClick={() => loadUserVehicles(u.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Mail size={18} className="text-slate-400" />
                            <span className="font-black text-white">{u.email}</span>
                            {u.role === "admin" && (
                              <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <Shield size={12} />
                                Admin
                              </span>
                            )}
                            {u.role === "moderator" && (
                              <span className="px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <Shield size={12} />
                                Modérateur
                              </span>
                            )}
                            {u.role === "support" && (
                              <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <MessageSquare size={12} />
                                Support
                              </span>
                            )}
                            {u.role === "editor" && (
                              <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <FileText size={12} />
                                Éditeur
                              </span>
                            )}
                            {u.role === "viewer" && (
                              <span className="px-2 py-1 bg-gray-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                                <Eye size={12} />
                                Lecteur
                              </span>
                            )}
                            {u.is_banned && (
                              <span className="px-2 py-1 bg-red-900 text-red-200 text-xs font-bold rounded-full flex items-center gap-1">
                                <Ban size={12} />
                                Banni
                                {u.ban_until && currentDate && new Date(u.ban_until) > currentDate && (
                                  <span className="ml-1">(jusqu'au {new Date(u.ban_until).toLocaleDateString("fr-BE")})</span>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-neutral-400">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(u.created_at).toLocaleDateString("fr-BE")}
                            </div>
                            {u.ban_reason && (
                              <div className="text-xs text-red-600">Raison: {u.ban_reason}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBanModal(u.id, u.is_banned);
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
                                Gérer le Ban
                              </>
                            )}
                          </button>
                          {u.role !== "admin" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteModalOpen(u.id);
                                setDeleteConfirmText("");
                              }}
                              className="px-4 py-2 bg-red-900 hover:bg-red-950 text-white rounded-full font-bold transition-all flex items-center gap-2"
                            >
                              <Trash2 size={16} />
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Détails utilisateur */}
          <div className="lg:col-span-1">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 sticky top-8">
              <h3 className="text-xl font-black text-white mb-6">Détails Utilisateur</h3>
              {!selectedUser ? (
                <div className="text-center py-12 text-neutral-400">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez un utilisateur pour voir les détails</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-400 mb-2">Informations</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-neutral-500">Email</p>
                        <p className="text-white font-black">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Nom</p>
                        <p className="text-white">{selectedUser.full_name || "Non renseigné"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Rôle</p>
                        <p className="text-white font-black">
                          {selectedUser.role === "admin" ? "Administrateur" : selectedUser.role === "pro" ? "Professionnel" : "Particulier"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-neutral-500">Statut</p>
                        <p className={`font-bold ${selectedUser.is_banned ? "text-red-400" : "text-green-400"}`}>
                          {selectedUser.is_banned ? "Banni" : "Actif"}
                        </p>
                        {selectedUser.is_banned && selectedUser.ban_reason && (
                          <p className="text-xs text-red-400 mt-1">Raison: {selectedUser.ban_reason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {isLoadingVehicles ? (
                    <div className="text-center py-8">
                      <Loader2 className="animate-spin text-red-600 mx-auto mb-2" size={24} />
                      <p className="text-xs text-slate-600">Chargement...</p>
                    </div>
                  ) : userVehicles.length > 0 ? (
                    <div>
                      <h4 className="text-sm font-bold text-neutral-400 mb-3">Véhicules ({userVehicles.length})</h4>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {userVehicles.map((v) => (
                          <Link
                            key={v.id}
                            href={`/cars/${v.id}`}
                            className="block p-3 bg-neutral-800 border border-neutral-700 rounded-xl hover:bg-neutral-700 transition-colors"
                          >
                            <p className="text-white font-black text-sm">
                              {v.brand || 'N/A'} {v.model || ''}
                            </p>
                            <p className="text-neutral-400 text-xs">
                              {v.price ? v.price.toLocaleString("fr-BE") : 'N/A'} € •{" "}
                              {v.status === "active" ? (
                                <span className="text-green-600">Actif</span>
                              ) : v.status === "pending" ? (
                                <span className="text-yellow-600">En attente</span>
                              ) : (
                                <span className="text-red-600">Rejeté</span>
                              )}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-400">
                      <Car size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Aucun véhicule publié</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modale de Bannissement */}
        {banModalOpen && selectedUserForBan && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Ban className="text-red-600" size={24} />
                  Bannir l'utilisateur
                </h3>
                <button onClick={() => { setBanModalOpen(null); setBanReason(""); setBanUntil(""); setIsPermanentBan(false); }} className="text-neutral-400 hover:text-neutral-300">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Email de l'utilisateur</label>
                  <p className="text-white font-medium">{selectedUserForBan.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Raison du bannissement <span className="text-red-600">*</span></label>
                  <textarea
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Ex: Spam, comportement inapproprié..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-700 bg-neutral-800 text-white focus:border-red-600 focus:outline-none placeholder:text-neutral-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input type="checkbox" checked={isPermanentBan} onChange={(e) => setIsPermanentBan(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-600" />
                    <span className="text-sm font-bold text-white">Bannissement permanent</span>
                  </label>
                </div>
                {!isPermanentBan && (
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Date de fin du bannissement</label>
                    <input type="datetime-local" value={banUntil} onChange={(e) => setBanUntil(e.target.value)} min={minDateTime} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-slate-900 focus:border-red-600 focus:outline-none" />
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button onClick={handleBan} disabled={!banReason.trim() || isProcessing} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black transition-all disabled:opacity-50">
                    {isProcessing ? "Traitement..." : "Confirmer le bannissement"}
                  </button>
                  <button onClick={() => { setBanModalOpen(null); setBanReason(""); setBanUntil(""); setIsPermanentBan(false); }} className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-black transition-all border border-neutral-700">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modale de Création d'Utilisateur */}
        {createUserModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Plus className="text-red-600" size={24} />
                  Créer un utilisateur
                </h3>
                <button onClick={() => { setCreateUserModalOpen(false); setNewUserData({ email: "", password: "", confirmPassword: "", fullName: "", role: "particulier" }); }} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (newUserData.password !== newUserData.confirmPassword) {
                    showToast("Les mots de passe ne correspondent pas", "error");
                    return;
                  }
                  if (newUserData.password.length < 6) {
                    showToast("Le mot de passe doit contenir au moins 6 caractères", "error");
                    return;
                  }
                  try {
                    setIsProcessing(true);
                    const result = await createUserManually(
                      newUserData.email,
                      newUserData.password,
                      newUserData.fullName,
                      newUserData.role
                    );
                    if (result.success) {
                      showToast("Utilisateur créé avec succès", "success");
                      setCreateUserModalOpen(false);
                      setNewUserData({ email: "", password: "", confirmPassword: "", fullName: "", role: "particulier" });
                      const allUsers = await getAllUsers();
                      setUsers(allUsers);
                      startTransition(() => {
                        router.refresh();
                      });
                    } else {
                      showToast(result.error || "Erreur lors de la création", "error");
                    }
                  } catch (error) {
                    console.error("Erreur création:", error);
                    showToast(error instanceof Error ? error.message : "Erreur lors de la création", "error");
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Email <span className="text-red-600">*</span></label>
                  <input
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="utilisateur@exemple.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-700 bg-neutral-800 text-white focus:border-red-600 focus:outline-none placeholder:text-neutral-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Nom complet <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={newUserData.fullName}
                    onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                    placeholder="Prénom Nom"
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-700 bg-neutral-800 text-white focus:border-red-600 focus:outline-none placeholder:text-neutral-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Mot de passe <span className="text-red-600">*</span></label>
                  <input
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    placeholder="Minimum 6 caractères"
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-700 bg-neutral-800 text-white focus:border-red-600 focus:outline-none placeholder:text-neutral-500"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Confirmer le mot de passe <span className="text-red-600">*</span></label>
                  <input
                    type="password"
                    value={newUserData.confirmPassword}
                    onChange={(e) => setNewUserData({ ...newUserData, confirmPassword: e.target.value })}
                    placeholder="Répétez le mot de passe"
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-700 bg-neutral-800 text-white focus:border-red-600 focus:outline-none placeholder:text-neutral-500"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Rôle <span className="text-red-600">*</span></label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as typeof newUserData.role })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-700 bg-neutral-800 text-white focus:border-red-600 focus:outline-none placeholder:text-neutral-500"
                    required
                  >
                    <option value="particulier">Particulier</option>
                    <option value="pro">Professionnel</option>
                    <option value="moderator">Modérateur</option>
                    <option value="admin">Administrateur</option>
                    <option value="support">Support</option>
                    <option value="editor">Éditeur</option>
                    <option value="viewer">Lecteur/Auditeur</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isProcessing || !newUserData.email || !newUserData.password || !newUserData.fullName}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black transition-all disabled:opacity-50"
                  >
                    {isProcessing ? "Création..." : "Créer l'utilisateur"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCreateUserModalOpen(false); setNewUserData({ email: "", password: "", confirmPassword: "", fullName: "", role: "particulier" }); }}
                    className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl font-black transition-all"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modale de Suppression */}
        {deleteModalOpen && selectedUserForDelete && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 rounded-2xl border-2 border-red-600 p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-red-600 flex items-center gap-2">
                  <AlertTriangle size={24} />
                  Supprimer le compte
                </h3>
                <button onClick={() => { setDeleteModalOpen(null); setDeleteConfirmText(""); }} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-red-900 font-bold mb-2">⚠️ Action irréversible</p>
                  <p className="text-sm text-slate-700">Cette action supprimera définitivement le compte, le profil et toutes les annonces associées.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-white mb-2">Pour confirmer, tapez <span className="text-red-600 font-black">SUPPRIMER</span></label>
                  <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="SUPPRIMER" className="w-full px-4 py-3 rounded-xl border-2 border-neutral-700 bg-neutral-800 text-white focus:border-red-600 focus:outline-none uppercase placeholder:text-neutral-500" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={handleDelete} disabled={!isDeleteConfirmed || isProcessing} className={`flex-1 px-4 py-3 text-white rounded-xl font-black transition-all disabled:opacity-50 ${isDeleteConfirmed && !isProcessing ? "bg-red-600 hover:bg-red-700" : "bg-red-900"}`}>
                    {isProcessing ? "Suppression..." : "Supprimer définitivement"}
                  </button>
                  <button onClick={() => { setDeleteModalOpen(null); setDeleteConfirmText(""); }} className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl font-black transition-all">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

