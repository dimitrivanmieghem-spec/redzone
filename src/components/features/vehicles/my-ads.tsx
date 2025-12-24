"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { Vehicule } from "@/lib/supabase/types";
import { deleteVehicule } from "@/lib/supabase/vehicules";
import { deleteVehiculeForUser } from "@/app/actions/vehicules";
import Image from "next/image";
import Link from "next/link";
import {
  Car,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Ban,
} from "lucide-react";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
  emoji: string;
}

const statusConfig: Record<string, StatusConfig> = {
  active: {
    label: "En Ligne",
    color: "text-green-400",
    bgColor: "bg-green-600/20",
    borderColor: "border-green-600/30",
    icon: CheckCircle,
    emoji: "🟢",
  },
  validated: {
    // Alias pour 'active' (compatibilité)
    label: "En Ligne",
    color: "text-green-400",
    bgColor: "bg-green-600/20",
    borderColor: "border-green-600/30",
    icon: CheckCircle,
    emoji: "🟢",
  },
  pending: {
    label: "En Attente",
    color: "text-orange-400",
    bgColor: "bg-orange-600/20",
    borderColor: "border-orange-600/30",
    icon: Clock,
    emoji: "🟠",
  },
  pending_validation: {
    label: "En Attente",
    color: "text-orange-400",
    bgColor: "bg-orange-600/20",
    borderColor: "border-orange-600/30",
    icon: Clock,
    emoji: "🟠",
  },
  waiting_email_verification: {
    label: "En Attente",
    color: "text-orange-400",
    bgColor: "bg-orange-600/20",
    borderColor: "border-orange-600/30",
    icon: Clock,
    emoji: "🟠",
  },
  waiting_email: {
    // Alias pour 'waiting_email_verification'
    label: "En Attente",
    color: "text-orange-400",
    bgColor: "bg-orange-600/20",
    borderColor: "border-orange-600/30",
    icon: Clock,
    emoji: "🟠",
  },
  rejected: {
    label: "Refusé",
    color: "text-red-400",
    bgColor: "bg-red-600/20",
    borderColor: "border-red-600/30",
    icon: XCircle,
    emoji: "🔴",
  },
  sold: {
    label: "Vendu",
    color: "text-slate-400",
    bgColor: "bg-slate-700/30",
    borderColor: "border-slate-600/30",
    icon: Ban,
    emoji: "⚫",
  },
};

// Skeleton Loader Premium
function AdSkeleton() {
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 animate-pulse">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Photo skeleton */}
        <div className="w-full md:w-48 h-40 bg-slate-800 rounded-xl flex-shrink-0"></div>
        {/* Contenu skeleton */}
        <div className="flex-1 space-y-4">
          <div className="h-6 bg-slate-800 rounded w-3/4"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          <div className="h-8 bg-slate-800 rounded w-1/4"></div>
          <div className="flex gap-3">
            <div className="h-10 bg-slate-800 rounded-lg w-24"></div>
            <div className="h-10 bg-slate-800 rounded-lg w-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyAds() {
  const { user } = useAuth();
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Helper function pour convertir les valeurs numériques
  function parseNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  // Récupérer les véhicules de l'utilisateur
  useEffect(() => {
    async function fetchMyVehicules() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: fetchError } = await supabase
          .from("vehicles")
          .select("*")
          .eq("owner_id", user.id) // La table vehicles utilise owner_id
          .order("created_at", { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        // Utiliser directement les colonnes anglaises (pas de mapping)
        // S'assurer que les valeurs numériques sont bien des nombres
        const mappedVehicules = ((data || []).map(v => ({
          ...v,
          price: parseNumber(v.price),
          year: parseNumber(v.year),
          mileage: parseNumber(v.mileage),
          power_hp: parseNumber(v.power_hp),
          fiscal_horsepower: parseNumber(v.fiscal_horsepower),
          seats_count: parseNumber(v.seats_count),
        })) as Vehicule[]) || [];
        setVehicules(mappedVehicules);
      } catch (err) {
        console.error("Erreur récupération véhicules:", err);
        setError(
          err instanceof Error ? err.message : "Erreur de chargement"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchMyVehicules();
  }, [user]);

  // Supprimer un véhicule
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    setDeletingId(id);
    setConfirmDeleteId(null);

    try {
      // Utiliser la nouvelle Server Action qui supprime aussi les images
      const result = await deleteVehiculeForUser(id);
      
      if (!result.success) {
        throw new Error(result.error || "Erreur lors de la suppression");
      }
      
      // Retirer le véhicule de la liste
      setVehicules((prev) => prev.filter((v) => v.id !== id));
      
      // Rafraîchir avec transition pour synchroniser avec le serveur
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error("Erreur suppression:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Annuler la confirmation de suppression
  const cancelDelete = () => {
    setConfirmDeleteId(null);
  };

  // Afficher un skeleton loader premium
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-slate-800 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-slate-800 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          <AdSkeleton />
          <AdSkeleton />
          <AdSkeleton />
        </div>
      </div>
    );
  }

  // Afficher une erreur
  if (error) {
    return (
      <div className="bg-red-600/20 border border-red-600/30 rounded-2xl p-6 text-center">
        <AlertCircle className="text-red-400 mx-auto mb-3" size={32} />
        <p className="text-red-400 font-medium">Erreur de chargement</p>
        <p className="text-slate-400 text-sm mt-1">{error}</p>
      </div>
    );
  }

  // État vide
  if (vehicules.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-12 md:p-16 text-center border border-white/10">
        <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
          <Car className="text-slate-500" size={40} />
        </div>
        <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
          Votre garage est vide.
        </h3>
        <p className="text-slate-400 mb-8 text-lg max-w-md mx-auto">
          Vendez votre première voiture d&apos;exception ! Publiez votre annonce
          en quelques minutes.
        </p>
        <Link
          href="/sell"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-8 py-4 rounded-full transition-all shadow-lg shadow-red-900/20 hover:scale-105"
        >
          <Plus size={20} />
          Vendre un véhicule d&apos;exception
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec bouton d'action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight mb-2">
            Mes Annonces
          </h2>
          <p className="text-slate-400">
            {vehicules.length} annonce{vehicules.length > 1 ? "s" : ""} au total
          </p>
        </div>
        <Link
          href="/sell"
          className="hidden md:flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-6 py-3 rounded-full transition-all shadow-lg shadow-red-900/20 hover:scale-105"
        >
          <Plus size={18} />
          Nouvelle annonce
        </Link>
      </div>

      {/* Liste des véhicules */}
      <div className="space-y-4">
        {vehicules.map((vehicule, index) => {
          // Gérer les alias de statut (normaliser "validated" vers "active")
          const rawStatus = vehicule.status as string;
          const statusKey = rawStatus === "validated" ? "active" : vehicule.status;
          const status =
            statusConfig[statusKey] || statusConfig.pending;
          const StatusIcon = status.icon;
          const isDeleting = deletingId === vehicule.id;
          const isConfirming = confirmDeleteId === vehicule.id;
          // Priorité pour la première image (LCP optimization)
          const isFirstImage = index === 0;

          return (
            <div
              key={vehicule.id}
              className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-red-600/30 transition-all duration-300 group"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Photo */}
                <div className="w-full md:w-48 h-40 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 relative group-hover:scale-105 transition-transform duration-300">
                  <Image
                    src={vehicule.image}
                    alt={`${vehicule.brand || 'Véhicule'} ${vehicule.model || ''}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 192px"
                    className="object-cover"
                    priority={isFirstImage}
                    loading={isFirstImage ? "eager" : "lazy"}
                  />
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-black text-white tracking-tight mb-1">
                        {vehicule.brand || 'N/A'} {vehicule.model || ''}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span>{vehicule.year || 'N/A'}</span>
                        <span>•</span>
                        <span>{vehicule.mileage ? vehicule.mileage.toLocaleString("fr-BE") : 'N/A'} km</span>
                        <span>•</span>
                        <span className="capitalize">{vehicule.fuel_type || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Badge statut premium */}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bgColor} ${status.borderColor} border shadow-lg`}
                    >
                      <span className="text-sm">{status.emoji}</span>
                      <StatusIcon
                        className={status.color}
                        size={16}
                      />
                      <span className={`text-xs font-bold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Prix en gras */}
                  <div className="mb-4">
                    <p className="text-3xl font-black text-red-500 tracking-tight">
                      {vehicule.price ? vehicule.price.toLocaleString("fr-BE") : 'N/A'} €
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/sell?edit=${vehicule.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-lg transition-all"
                    >
                      <Edit size={16} />
                      Modifier
                    </Link>

                    {isConfirming ? (
                      <>
                        <button
                          onClick={() => handleDelete(vehicule.id)}
                          disabled={isDeleting}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-lg transition-all disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                          {isDeleting ? "Suppression..." : "Confirmer"}
                        </button>
                        <button
                          onClick={cancelDelete}
                          disabled={isDeleting}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm rounded-lg transition-all disabled:opacity-50"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDelete(vehicule.id)}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-medium text-sm rounded-lg transition-all border border-red-600/30 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Supprimer
                      </button>
                    )}

                    {(vehicule.status === "active" ||
                      (vehicule.status as string) === "validated") && (
                      <Link
                        href={`/cars/${vehicule.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white font-medium text-sm transition-all"
                      >
                        Voir l&apos;annonce
                        <ArrowRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bouton mobile pour nouvelle annonce */}
      <div className="md:hidden pt-4">
        <Link
          href="/sell"
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold px-6 py-4 rounded-full transition-all shadow-lg shadow-red-900/20"
        >
          <Plus size={20} />
          Nouvelle annonce
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
