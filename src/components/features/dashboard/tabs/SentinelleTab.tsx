"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, BellRing, Clock, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface SentinelleTabProps {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export default function SentinelleTab({ user }: SentinelleTabProps) {
  const { showToast } = useToast();
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      setIsLoading(true);
      const { getSavedSearches } = await import("@/lib/supabase/savedSearches");
      const searches = await getSavedSearches();
      setSavedSearches(searches);
    } catch (error) {
      console.error("Erreur chargement recherches:", error);
      showToast("Erreur lors du chargement des recherches", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (searchId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette recherche ?")) return;
    
    try {
      const { deleteSavedSearch } = await import("@/lib/supabase/savedSearches");
      await deleteSavedSearch(searchId);
      setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
      showToast("Recherche supprimée avec succès", "success");
    } catch (error) {
      console.error("Erreur suppression:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const handleToggle = async (searchId: string, isActive: boolean) => {
    try {
      const { toggleSavedSearch } = await import("@/lib/supabase/savedSearches");
      await toggleSavedSearch(searchId, !isActive);
      setSavedSearches((prev) =>
        prev.map((s) => (s.id === searchId ? { ...s, is_active: !isActive } : s))
      );
      showToast(isActive ? "Recherche désactivée" : "Recherche activée", "success");
    } catch (error) {
      console.error("Erreur toggle:", error);
      showToast("Erreur lors de la modification", "error");
    }
  };

  const formatSearchCriteria = (search: any) => {
    const criteria: string[] = [];
    if (search.marque) criteria.push(`Marque: ${search.marque}`);
    if (search.modele) criteria.push(`Modèle: ${search.modele}`);
    if (search.prix_min || search.prix_max) {
      const prixMin = search.prix_min ? `${search.prix_min.toLocaleString('fr-BE')}€` : '';
      const prixMax = search.prix_max ? `${search.prix_max.toLocaleString('fr-BE')}€` : '';
      criteria.push(`Prix: ${prixMin}${prixMin && prixMax ? ' - ' : ''}${prixMax}`);
    }
    if (search.annee_min || search.annee_max) {
      criteria.push(`Année: ${search.annee_min || ''}${search.annee_min && search.annee_max ? ' - ' : ''}${search.annee_max || ''}`);
    }
    if (search.km_max) criteria.push(`Km max: ${search.km_max.toLocaleString('fr-BE')}`);
    if (search.carburants && search.carburants.length > 0) criteria.push(`Carburant: ${search.carburants.join(', ')}`);
    if (search.transmissions && search.transmissions.length > 0) criteria.push(`Transmission: ${search.transmissions.join(', ')}`);
    return criteria.length > 0 ? criteria.join(' • ') : 'Recherche personnalisée';
  };

  // Construire l'URL de recherche à partir d'une recherche sauvegardée
  const buildSearchUrl = (search: any): string => {
    const params = new URLSearchParams();
    if (search.marque && search.marque !== "Toutes les marques") params.set("marque", search.marque);
    if (search.modele) params.set("modele", search.modele);
    if (search.prix_min) params.set("prixMin", search.prix_min.toString());
    if (search.prix_max) params.set("prixMax", search.prix_max.toString());
    if (search.annee_min) params.set("anneeMin", search.annee_min.toString());
    if (search.annee_max) params.set("anneeMax", search.annee_max.toString());
    if (search.km_max) params.set("mileageMax", search.km_max.toString());
    if (search.type && search.type.length > 0) params.set("type", search.type.join(","));
    if (search.carburants && search.carburants.length > 0) params.set("carburant", search.carburants[0]);
    if (search.transmissions && search.transmissions.length > 0) params.set("transmission", search.transmissions.join(","));
    if (search.carrosseries && search.carrosseries.length > 0) params.set("carrosserie", search.carrosseries.join(","));
    if (search.norme_euro) params.set("normeEuro", search.norme_euro);
    if (search.car_pass_only) params.set("carPassOnly", "true");
    return params.toString();
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Ma Sentinelle
          </h1>
          <p className="text-slate-400">
            Gérez vos alertes de recherche sauvegardées
          </p>
        </div>
        <Link
          href="/search"
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Créer une alerte
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-red-600" size={32} />
        </div>
      ) : savedSearches.length === 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-12 text-center">
          <Bell size={48} className="text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">Aucune alerte configurée</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Créez une recherche et sauvegardez-la pour recevoir des notifications lorsqu'une nouvelle annonce correspond à vos critères.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
          >
            <Plus size={20} />
            Créer ma première alerte
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {savedSearches.map((search) => (
            <div
              key={search.id}
              className={`bg-neutral-900/50 backdrop-blur-sm rounded-2xl border-2 p-6 transition-all hover:scale-[1.01] ${
                search.is_active
                  ? "border-green-600/50 bg-green-900/10 hover:border-green-600/70"
                  : "border-neutral-700 bg-neutral-800/30 hover:border-neutral-600"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Bell size={20} className={search.is_active ? "text-green-500" : "text-neutral-500"} />
                    <h3 className="text-xl font-black text-white flex-1">
                      {search.name || "Recherche sans nom"}
                    </h3>
                    {search.is_active ? (
                      <span className="px-3 py-1 bg-green-600/20 text-green-400 text-xs font-bold rounded-full border border-green-600/30 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Active
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-neutral-700/50 text-neutral-400 text-xs font-bold rounded-full border border-neutral-600/30">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-300 mb-4 text-sm leading-relaxed">{formatSearchCriteria(search)}</p>
                  <div className="flex items-center gap-4 text-xs text-neutral-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Créée le {new Date(search.created_at).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    {search.last_notified_at && (
                      <span className="flex items-center gap-1">
                        <BellRing size={14} />
                        Dernière alerte: {new Date(search.last_notified_at).toLocaleDateString("fr-BE", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
                  <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => router.push(`/search?${buildSearchUrl(search)}`)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                    title="Appliquer cette recherche"
                  >
                    <Search size={16} />
                    Voir résultats
                  </button>
                  <button
                    onClick={() => handleToggle(search.id, search.is_active)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      search.is_active
                        ? "bg-slate-700 hover:bg-slate-600 text-slate-300"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                    title={search.is_active ? "Désactiver les alertes" : "Activer les alertes"}
                  >
                    {search.is_active ? "Désactiver" : "Activer"}
                  </button>
                  <button
                    onClick={() => handleDelete(search.id)}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 rounded-xl font-bold text-sm transition-all"
                    title="Supprimer cette recherche"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

