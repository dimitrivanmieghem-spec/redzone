"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, XCircle, Car, AlertCircle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { useVehicules } from "@/hooks/useVehicules";
import { approveVehicule, rejectVehicule } from "@/lib/supabase/vehicules";
import { getAdminStats } from "@/lib/supabase/settings";
import { Vehicule } from "@/lib/supabase/types";
import { logInfo, logError } from "@/lib/supabase/logs";

export default function AdminModerationPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [pendingVehicules, setPendingVehicules] = useState<Vehicule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Récupérer tous les véhicules et filtrer les pending
  const { vehicules: allVehicules, isLoading: vehiculesLoading } = useVehicules({});

  useEffect(() => {
    if (!vehiculesLoading) {
      const pending = allVehicules.filter((v) => v.status === "pending");
      setPendingVehicules(pending);
      setIsLoading(false);
    }
  }, [allVehicules, vehiculesLoading]);

  const handleApprove = async (id: string) => {
    if (isProcessing) return;

    const vehicule = pendingVehicules.find((v) => v.id === id);
    if (!vehicule || !user) return;

    try {
      setIsProcessing(id);
      
      // Mise à jour optimiste
      setPendingVehicules((prev) => prev.filter((v) => v.id !== id));

      // Appel Supabase
      await approveVehicule(id);

      // Log
      await logInfo(
        `Ad [${id}] validated successfully by Admin [${user.id}]`,
        user.id,
        {
          vehicule_id: id,
          marque: vehicule.marque || null,
          modele: vehicule.modele || null,
          action: "approve",
        }
      );

      // Mise à jour des stats
      await getAdminStats();

      showToast("Annonce validée ! ✓", "success");
      router.refresh();
    } catch (error: any) {
      console.error("Erreur approbation:", error);
      
      // Restaurer l'annonce en cas d'erreur
      setPendingVehicules((prev) => [...prev, vehicule].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));

      await logError(
        `Validation failed for Ad [${id}] by Admin [${user.id}]: ${error?.message || "Unknown error"}`,
        user.id,
        {
          vehicule_id: id,
          error_message: error?.message || "Unknown error",
          action: "approve",
        }
      );

      showToast(error instanceof Error ? error.message : "Erreur lors de l'approbation", "error");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (isProcessing || !rejectReason.trim()) return;

    const vehicule = pendingVehicules.find((v) => v.id === id);
    if (!vehicule || !user) return;

    try {
      setIsProcessing(id);

      // Mise à jour optimiste
      setPendingVehicules((prev) => prev.filter((v) => v.id !== id));

      // Appel Supabase
      await rejectVehicule(id);

      // Log
      await logInfo(
        `Ad [${id}] rejected by Admin [${user.id}]. Reason: ${rejectReason}`,
        user.id,
        {
          vehicule_id: id,
          marque: vehicule.marque || null,
          modele: vehicule.modele || null,
          reject_reason: rejectReason,
          action: "reject",
        }
      );

      // Fermer la modale
      setRejectModalOpen(null);
      setRejectReason("");

      // Mise à jour des stats
      await getAdminStats();

      showToast("Annonce rejetée ✓", "success");
      router.refresh();
    } catch (error: any) {
      console.error("Erreur rejet:", error);

      // Restaurer l'annonce en cas d'erreur
      setPendingVehicules((prev) => [...prev, vehicule].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));

      await logError(
        `Rejection failed for Ad [${id}] by Admin [${user.id}]: ${error?.message || "Unknown error"}`,
        user.id,
        {
          vehicule_id: id,
          error_message: error?.message || "Unknown error",
          action: "reject",
        }
      );

      showToast(error instanceof Error ? error.message : "Erreur lors du rejet", "error");
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
          <AlertCircle className="text-red-600" size={28} />
          Modération des Annonces
          <span className="text-slate-900 text-lg font-normal">
            ({pendingVehicules.length})
          </span>
        </h2>
      </header>

      {/* Liste des annonces */}
      <div className="p-8">
        {pendingVehicules.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-xl shadow-slate-100/50 border-0">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Aucune annonce en attente
            </h3>
            <p className="text-slate-600">
              Toutes les annonces ont été traitées.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingVehicules.map((vehicule) => (
              <div
                key={vehicule.id}
                className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                {/* Image */}
                <div className="w-32 h-24 bg-slate-200 rounded-2xl overflow-hidden flex-shrink-0 relative">
                  <Image
                    src={vehicule.image}
                    alt={`${vehicule.marque} ${vehicule.modele}`}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Informations */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {vehicule.marque} {vehicule.modele}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {vehicule.annee || 'N/A'} • {vehicule.km ? vehicule.km.toLocaleString("fr-BE") : 'N/A'} km •{" "}
                        {vehicule.carburant || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {vehicule.prix ? vehicule.prix.toLocaleString("fr-BE") : 'N/A'} €
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-900 text-xs font-medium rounded">
                      {vehicule.transmission}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-900 text-xs font-medium rounded">
                      {vehicule.carrosserie}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                      {vehicule.norme_euro.toUpperCase()}
                    </span>
                    {vehicule.car_pass && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">
                        ✓ Car-Pass
                      </span>
                    )}
                  </div>

                  {/* Lien vers la page détaillée */}
                  <Link
                    href={`/cars/${vehicule.id}`}
                    target="_blank"
                    className="text-sm text-red-600 hover:text-red-700 font-medium mb-3 inline-block"
                  >
                    Voir l'annonce complète →
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApprove(vehicule.id)}
                      disabled={isProcessing === vehicule.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle size={16} />
                      {isProcessing === vehicule.id ? "Traitement..." : "Approuver"}
                    </button>
                    <button
                      onClick={() => setRejectModalOpen(vehicule.id)}
                      disabled={isProcessing === vehicule.id}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle size={16} />
                      Rejeter
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale de rejet */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Rejeter l'annonce
              </h3>
              <button
                onClick={() => {
                  setRejectModalOpen(null);
                  setRejectReason("");
                }}
                className="text-slate-400 hover:text-slate-900"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Veuillez choisir la raison du rejet :
            </p>
            <div className="space-y-2 mb-4">
              {["Photo floue", "Doublon", "Autre"].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectReason(reason)}
                  className={`w-full text-left px-4 py-2 rounded-xl border-2 transition-all ${
                    rejectReason === reason
                      ? "border-red-600 bg-red-50 text-red-900"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  {reason}
                </button>
              ))}
              {rejectReason === "Autre" && (
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Précisez la raison..."
                  className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
                  rows={3}
                />
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleReject(rejectModalOpen)}
                disabled={!rejectReason.trim() || isProcessing === rejectModalOpen}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing === rejectModalOpen ? "Traitement..." : "Confirmer le rejet"}
              </button>
              <button
                onClick={() => {
                  setRejectModalOpen(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

