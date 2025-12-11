"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import {
  getAllModelSpecs,
  createModelSpec,
  updateModelSpec,
  deleteModelSpec,
  type ModelSpec,
  type ModelSpecInsert,
} from "@/lib/supabase/modelSpecsAdmin";

export default function AdminEncyclopediePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [specs, setSpecs] = useState<ModelSpec[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newSpec, setNewSpec] = useState<ModelSpecInsert>({
    marque: "",
    modele: "",
    type: "car",
    kw: 0,
    ch: 0,
    cv_fiscaux: 0,
    co2: null,
    cylindree: 0,
    moteur: "",
    transmission: "Manuelle",
    is_active: true,
  });
  const [editingSpec, setEditingSpec] = useState<Partial<ModelSpec>>({});

  // Charger les specs
  useEffect(() => {
    const loadSpecs = async () => {
      if (user && user.role === "admin") {
        try {
          setIsLoading(true);
          const allSpecs = await getAllModelSpecs();
          setSpecs(allSpecs);
        } catch (error) {
          console.error("Erreur chargement specs:", error);
          showToast("Erreur lors du chargement des spécifications", "error");
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSpecs();
  }, [user, showToast]);

  const handleCreate = async () => {
    if (
      !newSpec.marque.trim() ||
      !newSpec.modele.trim() ||
      newSpec.kw <= 0 ||
      newSpec.ch <= 0 ||
      newSpec.cv_fiscaux <= 0 ||
      newSpec.cylindree <= 0 ||
      !newSpec.moteur.trim()
    ) {
      showToast("Veuillez remplir tous les champs requis", "error");
      return;
    }

    try {
      const created = await createModelSpec(newSpec);
      setSpecs([...specs, created]);
      setIsCreating(false);
      setNewSpec({
        marque: "",
        modele: "",
        type: "car",
        kw: 0,
        ch: 0,
        cv_fiscaux: 0,
        co2: null,
        cylindree: 0,
        moteur: "",
        transmission: "Manuelle",
        is_active: true,
      });
      showToast("Modèle ajouté avec succès ✓", "success");
    } catch (error) {
      console.error("Erreur création:", error);
      showToast(
        error instanceof Error ? error.message : "Erreur lors de la création",
        "error"
      );
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const updated = await updateModelSpec(id, editingSpec);
      setSpecs(specs.map((s) => (s.id === id ? updated : s)));
      setEditingId(null);
      setEditingSpec({});
      showToast("Modèle mis à jour avec succès ✓", "success");
    } catch (error) {
      console.error("Erreur mise à jour:", error);
      showToast(
        error instanceof Error ? error.message : "Erreur lors de la mise à jour",
        "error"
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) {
      return;
    }

    try {
      await deleteModelSpec(id);
      setSpecs(specs.filter((s) => s.id !== id));
      showToast("Modèle supprimé avec succès ✓", "success");
    } catch (error) {
      console.error("Erreur suppression:", error);
      showToast(
        error instanceof Error ? error.message : "Erreur lors de la suppression",
        "error"
      );
    }
  };

  // Filtrer selon la recherche
  const filteredSpecs = specs.filter(
    (s) =>
      s.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.modele.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
            <BookOpen className="text-red-600" size={28} />
            Encyclopédie (Gestion des Modèles)
          </h2>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all"
          >
            <Plus size={20} />
            Ajouter un Modèle
          </button>
        </div>
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
              placeholder="Rechercher par marque ou modèle..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
            />
          </div>
        </div>

        {/* Formulaire de création */}
        {isCreating && (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-2 border-red-600 p-6 mb-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Nouveau Modèle
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Marque *
                </label>
                <input
                  type="text"
                  value={newSpec.marque}
                  onChange={(e) =>
                    setNewSpec({ ...newSpec, marque: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Modèle *
                </label>
                <input
                  type="text"
                  value={newSpec.modele}
                  onChange={(e) =>
                    setNewSpec({ ...newSpec, modele: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Type *
                </label>
                <select
                  value={newSpec.type}
                  onChange={(e) =>
                    setNewSpec({
                      ...newSpec,
                      type: e.target.value as "car" | "moto",
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
                >
                  <option value="car">Voiture</option>
                  <option value="moto">Moto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Transmission *
                </label>
                <select
                  value={newSpec.transmission}
                  onChange={(e) =>
                    setNewSpec({
                      ...newSpec,
                      transmission: e.target.value as
                        | "Manuelle"
                        | "Automatique"
                        | "Séquentielle",
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
                >
                  <option value="Manuelle">Manuelle</option>
                  <option value="Automatique">Automatique</option>
                  <option value="Séquentielle">Séquentielle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Puissance (kW) *
                </label>
                <input
                  type="number"
                  value={newSpec.kw}
                  onChange={(e) =>
                    setNewSpec({ ...newSpec, kw: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Puissance (ch) *
                </label>
                <input
                  type="number"
                  value={newSpec.ch}
                  onChange={(e) =>
                    setNewSpec({ ...newSpec, ch: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  CV Fiscaux *
                </label>
                <input
                  type="number"
                  value={newSpec.cv_fiscaux}
                  onChange={(e) =>
                    setNewSpec({
                      ...newSpec,
                      cv_fiscaux: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  CO2 (g/km)
                </label>
                <input
                  type="number"
                  value={newSpec.co2 || ""}
                  onChange={(e) =>
                    setNewSpec({
                      ...newSpec,
                      co2: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Cylindrée (cc) *
                </label>
                <input
                  type="number"
                  value={newSpec.cylindree}
                  onChange={(e) =>
                    setNewSpec({
                      ...newSpec,
                      cylindree: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Moteur *
                </label>
                <input
                  type="text"
                  value={newSpec.moteur}
                  onChange={(e) =>
                    setNewSpec({ ...newSpec, moteur: e.target.value })
                  }
                  placeholder="Ex: L6 Bi-Turbo, V8 Atmo"
                  className="w-full px-4 py-2 rounded-xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all"
              >
                <Save size={18} />
                Créer
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewSpec({
                    marque: "",
                    modele: "",
                    type: "car",
                    kw: 0,
                    ch: 0,
                    cv_fiscaux: 0,
                    co2: null,
                    cylindree: 0,
                    moteur: "",
                    transmission: "Manuelle",
                    is_active: true,
                  });
                }}
                className="flex items-center gap-2 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
              >
                <X size={18} />
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Liste des modèles */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Modèles ({filteredSpecs.length})
          </h3>
          {filteredSpecs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {searchTerm
                ? "Aucun résultat trouvé"
                : "Aucun modèle. Ajoutez-en un !"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-bold text-slate-900">
                      Marque
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900">
                      Modèle
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900">
                      Ch / CV Fiscaux
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900">
                      CO2
                    </th>
                    <th className="text-left py-3 px-4 font-bold text-slate-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSpecs.map((spec) => (
                    <tr
                      key={spec.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      {editingId === spec.id ? (
                        <>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editingSpec.marque ?? spec.marque}
                              onChange={(e) =>
                                setEditingSpec({
                                  ...editingSpec,
                                  marque: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 rounded border border-slate-200 text-slate-900"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={editingSpec.modele ?? spec.modele}
                              onChange={(e) =>
                                setEditingSpec({
                                  ...editingSpec,
                                  modele: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 rounded border border-slate-200 text-slate-900"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={editingSpec.type ?? spec.type}
                              onChange={(e) =>
                                setEditingSpec({
                                  ...editingSpec,
                                  type: e.target.value as "car" | "moto",
                                })
                              }
                              className="w-full px-2 py-1 rounded border border-slate-200 text-slate-900"
                            >
                              <option value="car">Voiture</option>
                              <option value="moto">Moto</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            {spec.ch} ch / {spec.cv_fiscaux} CV
                          </td>
                          <td className="py-3 px-4">
                            {spec.co2 ? `${spec.co2} g/km` : "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdate(spec.id)}
                                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-all"
                                title="Enregistrer"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingSpec({});
                                }}
                                className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-all"
                                title="Annuler"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            {spec.marque}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {spec.modele}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                              {spec.type === "car" ? "Voiture" : "Moto"}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {spec.ch} ch / {spec.cv_fiscaux} CV
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {spec.co2 ? `${spec.co2} g/km` : "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingId(spec.id);
                                  setEditingSpec({
                                    marque: spec.marque,
                                    modele: spec.modele,
                                    type: spec.type,
                                  });
                                }}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-all"
                                title="Modifier"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(spec.id)}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-all"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

