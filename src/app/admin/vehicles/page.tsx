"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Car,
  Loader2,
  Trash2,
  MessageSquare,
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  ChevronDown,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { getVehiculesPaginated, deleteVehicule } from "@/lib/supabase/vehicules";
import { createAdminConversation } from "@/app/actions/admin-messages";
import { Vehicule } from "@/lib/supabase/types";
import { getUserWithVehicles, type UserProfile } from "@/lib/supabase/users";
import { createClient } from "@/lib/supabase/client";

export default function VehiclesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [owners, setOwners] = useState<Map<string, UserProfile>>(new Map());
  const [isLoadingVehicules, setIsLoadingVehicules] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<"pending" | "active" | "rejected" | "all">("all");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [contactingIds, setContactingIds] = useState<Set<string>>(new Set());
  const [openContactMenu, setOpenContactMenu] = useState<string | null>(null);

  useEffect(() => {
    const loadVehicules = async () => {
      if (user && (user.role === "admin" || user.role === "moderator")) {
        try {
          setIsLoadingVehicules(true);
          const filters = statusFilter !== "all" ? { status: statusFilter } : undefined;
          const result = await getVehiculesPaginated(currentPage, pageSize, filters);
          setVehicules(result.data);
          setTotal(result.total);

          // Charger les profils des propriétaires
          const ownerIds = result.data
            .map(v => v.owner_id)
            .filter((id): id is string => id !== null && id !== undefined);
          
          if (ownerIds.length > 0) {
            const supabase = createClient();
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, email, full_name, avatar_url")
              .in("id", ownerIds);
            
            if (profiles) {
              const ownersMap = new Map<string, UserProfile>();
              profiles.forEach((profile: any) => {
                ownersMap.set(profile.id, profile as UserProfile);
              });
              setOwners(ownersMap);
            }
          }
        } catch (error) {
          console.error("Erreur chargement véhicules:", error);
          showToast("Erreur lors du chargement des véhicules", "error");
        } finally {
          setIsLoadingVehicules(false);
        }
      }
    };
    loadVehicules();
  }, [user, currentPage, statusFilter, pageSize, showToast]);

  const handleDelete = async (vehiculeId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.")) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(vehiculeId));
    try {
      await deleteVehicule(vehiculeId);
      setVehicules(prev => prev.filter(v => v.id !== vehiculeId));
      showToast("Annonce supprimée avec succès", "success");
    } catch (error) {
      console.error("Erreur suppression:", error);
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(vehiculeId);
        return next;
      });
    }
  };

  const handleContact = async (vehicule: Vehicule) => {
    if (!vehicule.owner_id) {
      showToast("Cette annonce n'a pas de propriétaire (invité)", "error");
      return;
    }

    setContactingIds(prev => new Set(prev).add(vehicule.id));
    try {
      const senderRole = user?.role === "admin" ? "Administrateur" : 
                         user?.role === "moderator" ? "Modérateur" :
                         user?.role === "support" ? "Support" :
                         user?.role === "editor" ? "Éditeur" :
                         "Octane98";
      const vehicleName = `${vehicule.brand || ''} ${vehicule.model || ''}`.trim() || "ce véhicule";
      const initialMessage = `Bonjour,\n\nJe vous contacte en tant que ${senderRole} de Octane98 concernant votre annonce "${vehicleName}".\n\nComment pouvons-nous vous aider ?\n\nCordialement,\nL'équipe Octane98`;

      const result = await createAdminConversation(
        vehicule.id,
        vehicule.owner_id,
        initialMessage
      );

      if (result.success && result.conversationId) {
        showToast("Conversation créée avec notification envoyée", "success");
        router.push(`/dashboard?tab=messages&conversation=${result.conversationId}`);
      } else {
        showToast(result.error || "Erreur lors de la création de la conversation", "error");
      }
    } catch (error) {
      console.error("Erreur contact:", error);
      showToast("Erreur lors du contact", "error");
    } finally {
      setContactingIds(prev => {
        const next = new Set(prev);
        next.delete(vehicule.id);
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="bg-neutral-950 border-b border-white/10 px-8 py-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
          <Car className="text-red-600" size={28} />
          Gestion des Véhicules
        </h2>
      </header>

      <div className="p-8">
        {/* Filtres */}
        <div className="mb-6 flex items-center gap-3">
          {(["all", "pending", "active", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl font-bold transition-all ${
                statusFilter === status
                  ? "bg-red-600 text-white"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700"
              }`}
            >
              {status === "all" ? "Tous" : status === "pending" ? "En attente" : status === "active" ? "Actifs" : "Rejetés"}
            </button>
          ))}
        </div>

        {isLoadingVehicules ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-red-600" size={32} />
          </div>
        ) : (
          <div className="space-y-4">
            {vehicules.length === 0 ? (
              <div className="text-center py-12 bg-neutral-900 rounded-2xl border border-neutral-800">
                <Car className="mx-auto text-neutral-500 mb-4" size={48} />
                <p className="text-neutral-400 font-medium">Aucun véhicule trouvé</p>
              </div>
            ) : (
              vehicules.map((vehicule) => {
                const owner = vehicule.owner_id ? owners.get(vehicule.owner_id) : null;
                const isDeleting = deletingIds.has(vehicule.id);
                const isContacting = contactingIds.has(vehicule.id);

                return (
                  <div key={vehicule.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 hover:border-neutral-700 transition-all">
                    <div className="flex items-start gap-6">
                      <div className="w-20 h-16 bg-neutral-800 rounded-xl overflow-hidden relative flex-shrink-0 border border-neutral-700">
                        <Image
                          src={vehicule.image}
                          alt={`${vehicule.brand || 'Véhicule'} ${vehicule.model || ''}`}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                              {vehicule.brand || 'N/A'} {vehicule.model || ''}
                            </p>
                            <p className="text-xs text-neutral-400 mt-1">
                              {vehicule.year || "N/A"} • {vehicule.mileage ? vehicule.mileage.toLocaleString("fr-BE") : "N/A"} km
                            </p>
                            {owner && (
                              <div className="mt-2 flex items-center gap-2">
                                <User size={14} className="text-neutral-500" />
                                <span className="text-xs text-neutral-400">
                                  {owner.full_name || owner.email || "Propriétaire inconnu"}
                                </span>
                              </div>
                            )}
                            {!vehicule.owner_id && (
                              <div className="mt-2 flex items-center gap-2">
                                <Mail size={14} className="text-neutral-500" />
                                <span className="text-xs text-neutral-400">
                                  Invité {vehicule.guest_email ? `(${vehicule.guest_email})` : ""}
                                </span>
                              </div>
                            )}
                            {/* Affichage des informations de contact directes */}
                            {(vehicule.contact_email || vehicule.phone) && (
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                                {vehicule.contact_email && (
                                  <div className="flex items-center gap-1.5">
                                    <Mail size={12} className="text-green-400" />
                                    <span className="text-neutral-400">{vehicule.contact_email}</span>
                                  </div>
                                )}
                                {vehicule.phone && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone size={12} className="text-blue-400" />
                                    <span className="text-neutral-400">{vehicule.phone}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-white">
                              {vehicule.price ? vehicule.price.toLocaleString("fr-BE") : "N/A"} €
                            </p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                              vehicule.status === "active" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                              vehicule.status === "pending" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                              "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}>
                              {vehicule.status === "active" ? "Actif" : vehicule.status === "pending" ? "En attente" : "Rejeté"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Link
                            href={`/cars/${vehicule.id}`}
                            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-neutral-700"
                          >
                            <Eye size={14} />
                            Voir
                          </Link>
                          {/* Bouton Contact Direct */}
                          {(() => {
                            const contactEmail = vehicule.contact_email || (owner ? owner.email : null) || vehicule.guest_email;
                            const contactPhone = vehicule.phone;
                            const hasDirectContact = contactEmail || contactPhone;
                            
                            if (!hasDirectContact) return null;

                            const isMenuOpen = openContactMenu === vehicule.id;

                            return (
                              <div className="relative">
                                <button
                                  onClick={() => setOpenContactMenu(isMenuOpen ? null : vehicule.id)}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                                >
                                  <Mail size={14} />
                                  Contacter
                                  <ChevronDown size={12} className={`transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isMenuOpen && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-10" 
                                      onClick={() => setOpenContactMenu(null)}
                                    />
                                    <div className="absolute top-full left-0 mt-2 z-20 bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl min-w-[200px] overflow-hidden">
                                      {contactEmail && (
                                        <a
                                          href={`mailto:${contactEmail}`}
                                          className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-neutral-800 transition-colors border-b border-neutral-800"
                                          onClick={() => setOpenContactMenu(null)}
                                        >
                                          <Mail size={16} className="text-green-400" />
                                          <span>Email</span>
                                          <span className="ml-auto text-xs text-neutral-500 truncate max-w-[120px]">{contactEmail}</span>
                                        </a>
                                      )}
                                      {contactPhone && (
                                        <a
                                          href={`tel:${contactPhone.replace(/\s/g, '')}`}
                                          className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-neutral-800 transition-colors border-b border-neutral-800"
                                          onClick={() => setOpenContactMenu(null)}
                                        >
                                          <Phone size={16} className="text-blue-400" />
                                          <span>Téléphone</span>
                                          <span className="ml-auto text-xs text-neutral-500">{contactPhone}</span>
                                        </a>
                                      )}
                                      {vehicule.owner_id && (
                                        <button
                                          onClick={() => {
                                            setOpenContactMenu(null);
                                            handleContact(vehicule);
                                          }}
                                          disabled={isContacting}
                                          className="w-full flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
                                        >
                                          {isContacting ? (
                                            <>
                                              <Loader2 size={16} className="animate-spin" />
                                              <span>Création...</span>
                                            </>
                                          ) : (
                                            <>
                                              <MessageSquare size={16} className="text-purple-400" />
                                              <span>Via messagerie</span>
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                          <button
                            onClick={() => handleDelete(vehicule.id)}
                            disabled={isDeleting}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />
                                Suppression...
                              </>
                            ) : (
                              <>
                                <Trash2 size={14} />
                                Supprimer
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl disabled:opacity-50 border border-neutral-700 text-white"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-neutral-400 font-medium">
              Page {currentPage} sur {Math.ceil(total / pageSize)}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))}
              disabled={currentPage >= Math.ceil(total / pageSize)}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl disabled:opacity-50 border border-neutral-700 text-white"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

