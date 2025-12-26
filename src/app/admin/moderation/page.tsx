"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Filter,
  Eye,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { approveVehicule, rejectVehicule } from "@/lib/supabase/server-actions/vehicules";
import { Vehicule } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { logInfo } from "@/lib/supabase/logs";

export default function ModerationPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [pendingVehicules, setPendingVehicules] = useState<Vehicule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Actions en masse
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // Filtres avancés
  const [searchFilter, setSearchFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("");
  
  // Modal d'aperçu complet
  const [previewModalOpen, setPreviewModalOpen] = useState<string | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<Map<string, any>>(new Map());

  function parseNumber(value: any): number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  function formatEuroNorm(normeEuro: string | null | undefined): string {
    if (!normeEuro) return 'N/A';
    return normeEuro.replace(/euro/gi, "Euro ").toUpperCase();
  }

  const loadPendingVehicules = async () => {
    if (user && (user.role === "admin" || user.role === "moderator")) {
      try {
        setIsLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("vehicles")
          .select(`
            id, created_at, owner_id, type, brand, model, price, year, mileage, fuel_type, 
            transmission, body_type, power_hp, condition, euro_standard, car_pass, 
            image, images, description, status, engine_architecture, admission, 
            zero_a_cent, co2, city, postal_code, phone, contact_email, contact_methods, 
            guest_email, interior_color, seats_count, fiscal_horsepower, poids_kg,
            displacement_cc, co2_wltp, drivetrain, top_speed, audio_file, history,
            car_pass_url, is_manual_model, first_registration_date, is_hybrid, is_electric,
            region_of_registration, engine_configuration, number_of_cylinders, torque_nm
          `)
          .in("status", ["pending", "pending_validation", "waiting_email_verification"])
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        const mappedVehicules = ((data || []).map((v: any) => ({
          ...v,
          price: parseNumber(v.price),
          year: parseNumber(v.year),
          mileage: parseNumber(v.mileage),
          power_hp: parseNumber(v.power_hp),
          fiscal_horsepower: parseNumber(v.fiscal_horsepower),
          poids_kg: parseNumber(v.poids_kg),
          displacement_cc: parseNumber(v.displacement_cc),
          co2_wltp: parseNumber(v.co2_wltp),
          top_speed: parseNumber(v.top_speed),
          torque_nm: parseNumber(v.torque_nm),
          number_of_cylinders: parseNumber(v.number_of_cylinders),
          seats_count: parseNumber(v.seats_count),
        })) as Vehicule[]) || [];
        setPendingVehicules(mappedVehicules);
        
        // Charger les informations des propriétaires
        const ownerIds = mappedVehicules
          .map(v => v.owner_id)
          .filter((id): id is string => id !== null && id !== undefined);
        
        if (ownerIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, email, full_name, avatar_url")
            .in("id", ownerIds);
          
          if (profiles) {
            const ownersMap = new Map<string, any>();
            profiles.forEach((profile: any) => {
              ownersMap.set(profile.id, profile);
            });
            setOwnerInfo(ownersMap);
          }
        }
      } catch (error) {
        console.error("Erreur chargement annonces en attente:", error);
        showToast("Erreur lors du chargement des annonces", "error");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadPendingVehicules();
  }, [user]);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "moderator")) return;

    const supabase = createClient();
    const channel = supabase
      .channel("vehicles-moderation-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vehicles",
        },
        (payload: any) => {
          const newStatus = (payload.new as any)?.status;
          const oldStatus = (payload.old as any)?.status;
          const pendingStatuses = ["pending", "pending_validation", "waiting_email_verification"];
          
          const shouldReload = 
            (payload.eventType === "INSERT" && pendingStatuses.includes(newStatus)) ||
            (payload.eventType === "UPDATE" && (
              pendingStatuses.includes(oldStatus) || pendingStatuses.includes(newStatus)
            )) ||
            (payload.eventType === "DELETE" && pendingStatuses.includes(oldStatus));
          
          if (shouldReload) {
            loadPendingVehicules();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleApprove = async (id: string) => {
    if (isProcessing) return;
    const vehicule = pendingVehicules.find((v) => v.id === id);
    if (!vehicule || !user) return;

    try {
      setIsProcessing(id);
      setPendingVehicules((prev) => prev.filter((v) => v.id !== id));
      await approveVehicule(id);
      await logInfo(
        `Ad [${id}] validated successfully by Admin [${user.id}]`,
        user.id,
        { vehicule_id: id, brand: vehicule.brand || null, model: vehicule.model || null, action: "approve" }
      );
      showToast("Annonce approuvée avec succès ✓", "success");
      await loadPendingVehicules();
    } catch (error) {
      setPendingVehicules((prev) => {
        const updated = [...prev, vehicule];
        return updated.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      console.error("Erreur approbation:", error);
      showToast("Erreur lors de l'approbation", "error");
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
      setPendingVehicules((prev) => prev.filter((v) => v.id !== id));
      await rejectVehicule(id, rejectReason);
      await logInfo(
        `Ad [${id}] rejected by Admin [${user.id}]. Reason: ${rejectReason}`,
        user.id,
        { vehicule_id: id, brand: vehicule.brand || null, model: vehicule.model || null, reject_reason: rejectReason, action: "reject" }
      );
      showToast("Annonce refusée", "success");
      setRejectModalOpen(null);
      setRejectReason("");
      setSelectedVehicles((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await loadPendingVehicules();
    } catch (error) {
      setPendingVehicules((prev) => {
        const updated = [...prev, vehicule];
        return updated.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
      console.error("Erreur rejet:", error);
      showToast("Erreur lors du rejet", "error");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedVehicles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedVehicles.size === filteredVehicules.length) {
      setSelectedVehicles(new Set());
    } else {
      setSelectedVehicles(new Set(filteredVehicules.map(v => v.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedVehicles.size === 0 || isBulkProcessing) return;
    if (!confirm(`Êtes-vous sûr de vouloir approuver ${selectedVehicles.size} annonce(s) ?`)) return;

    setIsBulkProcessing(true);
    const toProcess = Array.from(selectedVehicles);
    let successCount = 0;
    let errorCount = 0;

    for (const id of toProcess) {
      try {
        await approveVehicule(id);
        const vehicule = pendingVehicules.find((v) => v.id === id);
        await logInfo(
          `Ad [${id}] validated successfully by Admin [${user?.id}] (bulk)`,
          user?.id || "",
          { vehicule_id: id, brand: vehicule?.brand || null, model: vehicule?.model || null, action: "approve_bulk" }
        );
        successCount++;
      } catch (error) {
        console.error(`Erreur approbation ${id}:`, error);
        errorCount++;
      }
    }

    setPendingVehicules((prev) => prev.filter((v) => !selectedVehicles.has(v.id)));
    setSelectedVehicles(new Set());
    showToast(`${successCount} annonce(s) approuvée(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`, successCount > 0 ? "success" : "error");
    setIsBulkProcessing(false);
    await loadPendingVehicules();
  };

  const handleBulkReject = async () => {
    if (selectedVehicles.size === 0 || isBulkProcessing || !rejectReason.trim()) return;
    if (!confirm(`Êtes-vous sûr de vouloir rejeter ${selectedVehicles.size} annonce(s) ?`)) return;

    setIsBulkProcessing(true);
    const toProcess = Array.from(selectedVehicles);
    let successCount = 0;
    let errorCount = 0;

    for (const id of toProcess) {
      try {
        await rejectVehicule(id, rejectReason);
        const vehicule = pendingVehicules.find((v) => v.id === id);
        await logInfo(
          `Ad [${id}] rejected by Admin [${user?.id}] (bulk). Reason: ${rejectReason}`,
          user?.id || "",
          { vehicule_id: id, brand: vehicule?.brand || null, model: vehicule?.model || null, reject_reason: rejectReason, action: "reject_bulk" }
        );
        successCount++;
      } catch (error) {
        console.error(`Erreur rejet ${id}:`, error);
        errorCount++;
      }
    }

    setPendingVehicules((prev) => prev.filter((v) => !selectedVehicles.has(v.id)));
    setSelectedVehicles(new Set());
    setRejectReason("");
    showToast(`${successCount} annonce(s) rejetée(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`, successCount > 0 ? "success" : "error");
    setIsBulkProcessing(false);
    await loadPendingVehicules();
  };

  const filteredVehicules = useMemo(() => {
    return pendingVehicules.filter((vehicule) => {
      if (searchFilter.trim()) {
        const search = searchFilter.toLowerCase();
        const matchesSearch =
          vehicule.brand?.toLowerCase().includes(search) ||
          vehicule.model?.toLowerCase().includes(search) ||
          vehicule.description?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      if (brandFilter && vehicule.brand !== brandFilter) return false;

      if (dateFilter) {
        const vehiculeDate = new Date(vehicule.created_at);
        const filterDate = new Date(dateFilter);
        if (vehiculeDate.toDateString() !== filterDate.toDateString()) return false;
      }

      return true;
    });
  }, [pendingVehicules, searchFilter, brandFilter, dateFilter]);

  const uniqueBrands = useMemo(() => {
    return Array.from(new Set(pendingVehicules.map(v => v.brand).filter(Boolean))).sort();
  }, [pendingVehicules]);

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="bg-neutral-950 border-b border-white/10 px-8 py-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
          <FileCheck className="text-red-600" size={28} />
          Modération des Annonces
        </h2>
      </header>

      <div className="p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-red-600" size={32} />
          </div>
        ) : pendingVehicules.length === 0 ? (
          <div className="text-center py-12 bg-neutral-900 rounded-2xl border border-neutral-800">
            <CheckCircle className="text-green-600 mx-auto mb-4" size={48} />
            <p className="text-neutral-400 font-medium">Aucune annonce en attente de modération</p>
          </div>
        ) : (
          <>
            {/* Filtres avancés */}
            <div className="mb-6 bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
              <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Filter size={20} className="text-red-600" />
                Filtres avancés
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Recherche</label>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Marque, modèle, description..."
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder:text-neutral-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Marque</label>
                  <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 text-white"
                  >
                    <option value="">Toutes les marques</option>
                    {uniqueBrands.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">Date</label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchFilter("");
                      setBrandFilter("");
                      setDateFilter("");
                    }}
                    className="w-full px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all border border-neutral-700"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
              <p className="text-sm text-neutral-400 mt-4">
                {filteredVehicules.length} annonce(s) trouvée(s) sur {pendingVehicules.length}
              </p>
            </div>

            {/* Actions en masse */}
            {filteredVehicules.length > 0 && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedVehicles.size === filteredVehicules.length && filteredVehicules.length > 0}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-600"
                  />
                  <span className="font-bold text-white">
                    {selectedVehicles.size > 0
                      ? `${selectedVehicles.size} annonce(s) sélectionnée(s)`
                      : "Sélectionner tout"}
                  </span>
                </div>
                {selectedVehicles.size > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBulkApprove}
                      disabled={isBulkProcessing}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      {isBulkProcessing ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                      Approuver ({selectedVehicles.size})
                    </button>
                    <button
                      onClick={() => {
                        if (selectedVehicles.size > 0) {
                          setRejectModalOpen("bulk");
                        }
                      }}
                      disabled={isBulkProcessing}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      <XCircle size={16} />
                      Rejeter ({selectedVehicles.size})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Modal de rejet en masse */}
            {rejectModalOpen === "bulk" && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 max-w-md w-full p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-white">Refuser les annonces ({selectedVehicles.size})</h3>
                    <button
                      onClick={() => {
                        setRejectModalOpen(null);
                        setRejectReason("");
                      }}
                      className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
                    >
                      <X size={20} className="text-neutral-400" />
                    </button>
                  </div>
                  <p className="text-neutral-400 mb-4">Veuillez indiquer la raison du refus (pour toutes les annonces sélectionnées) :</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Raison du refus..."
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 mb-4 resize-y min-h-[100px] text-white placeholder:text-neutral-500"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBulkReject}
                      disabled={!rejectReason.trim() || isBulkProcessing}
                      className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBulkProcessing ? "Traitement..." : "Confirmer le refus"}
                    </button>
                    <button
                      onClick={() => {
                        setRejectModalOpen(null);
                        setRejectReason("");
                      }}
                      className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all border border-neutral-700"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            {filteredVehicules.length > 0 && (
              <div className="space-y-4">
                {filteredVehicules.map((vehicule) => (
                  <div key={vehicule.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 hover:border-neutral-700 transition-all">
                    <div className="flex items-start gap-6">
                      <div className="pt-2">
                        <input
                          type="checkbox"
                          checked={selectedVehicles.has(vehicule.id)}
                          onChange={() => handleToggleSelect(vehicule.id)}
                          className="w-5 h-5 text-red-600 rounded focus:ring-red-600"
                        />
                      </div>
                      <div className="w-32 h-24 bg-neutral-800 rounded-xl overflow-hidden relative flex-shrink-0">
                        <Image
                          src={vehicule.image}
                          alt={`${vehicule.brand || 'Véhicule'} ${vehicule.model || ''}`}
                          fill
                          sizes="128px"
                          className="object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-black text-white">
                              {vehicule.brand || 'N/A'} {vehicule.model || ''}
                            </h3>
                            <p className="text-sm text-neutral-400">
                              {vehicule.year || 'N/A'} • {vehicule.mileage ? vehicule.mileage.toLocaleString("fr-BE") : 'N/A'} km •{" "}
                              {vehicule.fuel_type || 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-extrabold text-white tracking-tight">
                              {vehicule.price ? vehicule.price.toLocaleString("fr-BE") : 'N/A'} €
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-800 text-neutral-300 text-xs font-medium rounded border border-neutral-700">
                            {vehicule.transmission || 'N/A'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-800 text-neutral-300 text-xs font-medium rounded border border-neutral-700">
                            {vehicule.body_type || 'N/A'}
                          </span>
                          {vehicule.euro_standard && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded border border-red-500/30">
                              {formatEuroNorm(vehicule.euro_standard)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleApprove(vehicule.id)}
                            disabled={isProcessing === vehicule.id}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                          >
                            {isProcessing === vehicule.id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            Approuver
                          </button>
                          <button
                            onClick={() => setRejectModalOpen(vehicule.id)}
                            disabled={isProcessing === vehicule.id}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                          >
                            <XCircle size={16} />
                            Refuser
                          </button>
                          <button
                            onClick={() => setPreviewModalOpen(vehicule.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
                          >
                            <Eye size={16} />
                            Aperçu complet
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modal d'aperçu complet */}
        {previewModalOpen && (() => {
          const vehicule = pendingVehicules.find(v => v.id === previewModalOpen);
          if (!vehicule) return null;
          const owner = vehicule.owner_id ? ownerInfo.get(vehicule.owner_id) : null;
          
          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 max-w-4xl w-full p-6 my-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-white">Aperçu de l'annonce</h3>
                  <button
                    onClick={() => setPreviewModalOpen(null)}
                    className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
                  >
                    <X size={24} className="text-neutral-400" />
                  </button>
                </div>
                
                <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
                  {/* Images */}
                  <div>
                    <h4 className="text-sm font-bold text-red-500 mb-2">Photos</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {vehicule.images && vehicule.images.length > 0 ? (
                        vehicule.images.map((img) => (
                          <div key={img} className="relative w-full h-32 bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700">
                            <Image src={img} alt={`Photo du véhicule`} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" loading="lazy" />
                          </div>
                        ))
                      ) : (
                        <div className="relative w-full h-32 bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700">
                          <Image src={vehicule.image} alt="Photo principale" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" loading="lazy" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Informations principales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-red-500 mb-2">Informations principales</h4>
                      <div className="space-y-2 text-sm text-neutral-300">
                        <div><span className="font-bold text-white">Marque/Modèle:</span> {vehicule.brand || 'N/A'} {vehicule.model || ''}</div>
                        <div><span className="font-bold text-white">Prix:</span> {vehicule.price ? vehicule.price.toLocaleString("fr-BE") : 'N/A'} €</div>
                        <div><span className="font-bold text-white">Année:</span> {vehicule.year || 'N/A'}</div>
                        <div><span className="font-bold text-white">Kilométrage:</span> {vehicule.mileage ? vehicule.mileage.toLocaleString("fr-BE") : 'N/A'} km</div>
                        <div><span className="font-bold text-white">Carburant:</span> {vehicule.fuel_type || 'N/A'}</div>
                        <div><span className="font-bold text-white">Transmission:</span> {vehicule.transmission || 'N/A'}</div>
                        <div><span className="font-bold text-white">Carrosserie:</span> {vehicule.body_type || 'N/A'}</div>
                        <div><span className="font-bold text-white">Puissance:</span> {vehicule.power_hp || 'N/A'} ch</div>
                        <div><span className="font-bold text-white">CV fiscaux:</span> {vehicule.fiscal_horsepower || 'N/A'}</div>
                        <div><span className="font-bold text-white">État:</span> {vehicule.condition || 'N/A'}</div>
                        <div><span className="font-bold text-white">Norme Euro:</span> {formatEuroNorm(vehicule.euro_standard)}</div>
                        <div><span className="font-bold text-white">Car-Pass:</span> {vehicule.car_pass ? 'Oui' : 'Non'}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-bold text-red-500 mb-2">Détails techniques</h4>
                      <div className="space-y-2 text-sm text-neutral-300">
                        <div><span className="font-bold text-white">Architecture moteur:</span> {vehicule.engine_architecture || 'N/A'}</div>
                        <div><span className="font-bold text-white">Admission:</span> {vehicule.admission || 'N/A'}</div>
                        <div><span className="font-bold text-white">0-100 km/h:</span> {vehicule.zero_a_cent ? `${vehicule.zero_a_cent}s` : 'N/A'}</div>
                        <div><span className="font-bold text-white">CO2:</span> {vehicule.co2 ? `${vehicule.co2} g/km` : 'N/A'}</div>
                        <div><span className="font-bold text-white">CO2 WLTP:</span> {vehicule.co2_wltp ? `${vehicule.co2_wltp} g/km` : 'N/A'}</div>
                        <div><span className="font-bold text-white">Poids:</span> {vehicule.poids_kg ? `${vehicule.poids_kg} kg` : 'N/A'}</div>
                        <div><span className="font-bold text-white">Cylindrée:</span> {vehicule.displacement_cc ? `${vehicule.displacement_cc} cm³` : 'N/A'}</div>
                        <div><span className="font-bold text-white">Drivetrain:</span> {vehicule.drivetrain || 'N/A'}</div>
                        <div><span className="font-bold text-white">Vitesse max:</span> {vehicule.top_speed ? `${vehicule.top_speed} km/h` : 'N/A'}</div>
                        <div><span className="font-bold text-white">Couple:</span> {vehicule.torque_nm ? `${vehicule.torque_nm} Nm` : 'N/A'}</div>
                        <div><span className="font-bold text-white">Configuration:</span> {vehicule.engine_configuration || 'N/A'}</div>
                        <div><span className="font-bold text-white">Cylindres:</span> {vehicule.number_of_cylinders || 'N/A'}</div>
                        <div><span className="font-bold text-white">Couleur intérieure:</span> {vehicule.interior_color || 'N/A'}</div>
                        <div><span className="font-bold text-white">Places:</span> {vehicule.seats_count || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {vehicule.description && (
                    <div>
                      <h4 className="text-sm font-bold text-red-500 mb-2">Description</h4>
                      <p className="text-sm text-neutral-300 whitespace-pre-wrap">{vehicule.description}</p>
                    </div>
                  )}
                  
                  {/* Contact */}
                  <div>
                    <h4 className="text-sm font-bold text-red-500 mb-2">Informations de contact</h4>
                    <div className="space-y-2 text-sm text-neutral-300">
                      {owner ? (
                        <>
                          <div><span className="font-bold text-white">Propriétaire:</span> {owner.full_name || owner.email || 'N/A'}</div>
                          <div><span className="font-bold text-white">Email:</span> {owner.email || 'N/A'}</div>
                        </>
                      ) : vehicule.guest_email ? (
                        <div><span className="font-bold text-white">Email invité:</span> {vehicule.guest_email}</div>
                      ) : null}
                      {vehicule.contact_email && (
                        <div><span className="font-bold text-white">Email de contact:</span> {vehicule.contact_email}</div>
                      )}
                      {vehicule.phone && (
                        <div><span className="font-bold text-white">Téléphone:</span> {vehicule.phone}</div>
                      )}
                      {vehicule.contact_methods && vehicule.contact_methods.length > 0 && (
                        <div><span className="font-bold text-white">Méthodes de contact:</span> {vehicule.contact_methods.join(', ')}</div>
                      )}
                      {vehicule.city && (
                        <div><span className="font-bold text-white">Localisation:</span> {vehicule.city} {vehicule.postal_code || ''}</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Audio */}
                  {vehicule.audio_file && (
                    <div>
                      <h4 className="text-sm font-bold text-red-500 mb-2">Sonorité moteur</h4>
                      <audio controls className="w-full">
                        <source src={vehicule.audio_file} type="audio/mpeg" />
                        Votre navigateur ne supporte pas l'audio.
                      </audio>
                    </div>
                  )}
                  
                  {/* Historique */}
                  {vehicule.history && vehicule.history.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-red-500 mb-2">Historique</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-neutral-300">
                        {vehicule.history.map((item, idx) => (
                          <li key={`${item}-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-neutral-800">
                  <button
                    onClick={() => {
                      setPreviewModalOpen(null);
                      handleApprove(vehicule.id);
                    }}
                    disabled={isProcessing === vehicule.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {isProcessing === vehicule.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Approuver
                  </button>
                  <button
                    onClick={() => {
                      setPreviewModalOpen(null);
                      setRejectModalOpen(vehicule.id);
                    }}
                    disabled={isProcessing === vehicule.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Refuser
                  </button>
                  <button
                    onClick={() => setPreviewModalOpen(null)}
                    className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all border border-neutral-700"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modal de rejet */}
        {rejectModalOpen && rejectModalOpen !== "bulk" && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-800 max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-white">Refuser l'annonce</h3>
                <button
                  onClick={() => {
                    setRejectModalOpen(null);
                    setRejectReason("");
                  }}
                  className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <X size={20} className="text-neutral-400" />
                </button>
              </div>
              <p className="text-neutral-400 mb-4">Veuillez indiquer la raison du refus :</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Photos de mauvaise qualité, véhicule non conforme..."
                className="w-full p-4 bg-neutral-800 border-2 border-neutral-700 rounded-xl focus:outline-none focus:border-red-600 text-white placeholder:text-neutral-500 mb-4"
                rows={4}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleReject(rejectModalOpen)}
                  disabled={!rejectReason.trim() || isProcessing === rejectModalOpen}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isProcessing === rejectModalOpen ? "Traitement..." : "Confirmer le refus"}
                </button>
                <button
                  onClick={() => {
                    setRejectModalOpen(null);
                    setRejectReason("");
                  }}
                  className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-all border border-neutral-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

