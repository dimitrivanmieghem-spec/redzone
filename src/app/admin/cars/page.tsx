"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, ArrowLeft, ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { getVehiculesPaginated, deleteVehicule } from "@/lib/supabase/vehicules";
import { Vehicule } from "@/lib/supabase/types";

export default function AdminCarsPage() {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [isLoadingVehicules, setIsLoadingVehicules] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);

  // Protection : Rediriger si non admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      showToast("Accès refusé - Administrateur uniquement", "error");
      router.push("/");
    }
  }, [user, isLoading, router, showToast]);

  // Charger les véhicules
  useEffect(() => {
    const loadVehicules = async () => {
      if (user && user.role === "admin") {
        try {
          setIsLoadingVehicules(true);
          const result = await getVehiculesPaginated(currentPage, pageSize);
          setVehicules(result.data);
          setTotal(result.total);
        } catch (error) {
          console.error("Erreur chargement véhicules:", error);
          showToast("Erreur lors du chargement des véhicules", "error");
        } finally {
          setIsLoadingVehicules(false);
        }
      }
    };

    loadVehicules();
  }, [user, currentPage, pageSize, showToast]);

  const handleDelete = async (id: string, marque: string, modele: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${marque} ${modele} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await deleteVehicule(id);
      showToast("Véhicule supprimé ✓", "success");
      
      // Recharger la liste
      const result = await getVehiculesPaginated(currentPage, pageSize);
      setVehicules(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error("Erreur suppression:", error);
      showToast(
        error instanceof Error ? error.message : "Erreur lors de la suppression",
        "error"
      );
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  // Afficher un loader pendant la vérification
  if (isLoading || isLoadingVehicules) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </main>
    );
  }

  // Si pas admin, ne rien afficher (redirection en cours)
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <Link href="/admin/dashboard" className="flex items-center gap-3 mb-4 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium">Retour Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center">
              <Car size={20} className="text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Garage (Stock)</h1>
              <p className="text-xs text-slate-400">Gestion du stock</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
                🚗 Garage (Stock)
              </h2>
              <p className="text-slate-600">
                {total} véhicule{total > 1 ? "s" : ""} au total
              </p>
            </div>
            <button
              onClick={() => router.push("/sell")}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all"
            >
              <Plus size={20} />
              Ajouter un véhicule
            </button>
          </div>

          {/* Tableau Excel moderne */}
          {vehicules.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Aucun véhicule
              </h3>
              <p className="text-slate-600 mb-6">
                Commencez par ajouter un véhicule au stock.
              </p>
              <button
                onClick={() => router.push("/sell")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all"
              >
                <Plus size={20} />
                Ajouter un véhicule
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Photo
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Titre
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Prix
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {vehicules.map((vehicule) => (
                        <tr key={vehicule.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="w-20 h-16 bg-slate-200 rounded-xl overflow-hidden relative">
                              <Image
                                src={vehicule.image}
                                alt={`${vehicule.marque} ${vehicule.modele}`}
                                fill
                                sizes="80px"
                                className="object-cover"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {vehicule.marque} {vehicule.modele}
                              </p>
                              <p className="text-xs text-slate-500">
                                {vehicule.annee || 'N/A'} • {vehicule.km ? vehicule.km.toLocaleString("fr-BE") : 'N/A'} km
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-900">
                              {vehicule.prix ? vehicule.prix.toLocaleString("fr-BE") : 'N/A'} €
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                vehicule.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : vehicule.status === "pending"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {vehicule.status === "active"
                                ? "En ligne"
                                : vehicule.status === "pending"
                                ? "En attente"
                                : "Rejeté"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => router.push(`/cars/${vehicule.id}`)}
                                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Voir"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(vehicule.id, vehicule.marque, vehicule.modele)}
                                className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Supprimer"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-slate-600">
                    Page {currentPage} sur {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 text-slate-900 font-bold rounded-full hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={18} />
                      Précédent
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Suivant
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
