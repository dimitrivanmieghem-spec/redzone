"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  GripVertical,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import {
  getAllFAQ,
  createFAQItem,
  updateFAQItem,
  deleteFAQItem,
  type FAQItem,
} from "@/lib/supabase/faq";

export default function AdminContentPage() {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [isLoadingFAQ, setIsLoadingFAQ] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<FAQItem>>({});
  const [newItem, setNewItem] = useState({
    question: "",
    answer: "",
    order: 0,
    is_active: true,
  });

  // Protection : Rediriger si non admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      showToast("Accès refusé - Administrateur uniquement", "error");
      router.push("/");
    }
  }, [user, isLoading, router, showToast]);

  // Charger les FAQ
  useEffect(() => {
    const loadFAQ = async () => {
      if (user && user.role === "admin") {
        try {
          setIsLoadingFAQ(true);
          const allFAQ = await getAllFAQ();
          setFaqItems(allFAQ);
        } catch (error) {
          console.error("Erreur chargement FAQ:", error);
          showToast("Erreur lors du chargement de la FAQ", "error");
        } finally {
          setIsLoadingFAQ(false);
        }
      }
    };

    loadFAQ();
  }, [user, showToast]);

  // Créer une nouvelle FAQ
  const handleCreate = async () => {
    if (!newItem.question.trim() || !newItem.answer.trim()) {
      showToast("Veuillez remplir tous les champs", "error");
      return;
    }

    try {
      const maxOrder = Math.max(...faqItems.map((f) => f.order), -1);
      await createFAQItem({
        ...newItem,
        order: maxOrder + 1,
      });
      showToast("FAQ créée avec succès", "success");
      setIsCreating(false);
      setNewItem({ question: "", answer: "", order: 0, is_active: true });
      // Recharger
      const allFAQ = await getAllFAQ();
      setFaqItems(allFAQ);
    } catch (error) {
      console.error("Erreur création FAQ:", error);
      showToast(
        error instanceof Error ? error.message : "Erreur lors de la création",
        "error"
      );
    }
  };

  // Modifier une FAQ
  const handleUpdate = async (id: string) => {
    if (!editingItem.question?.trim() || !editingItem.answer?.trim()) {
      showToast("Veuillez remplir tous les champs", "error");
      return;
    }

    try {
      await updateFAQItem(id, editingItem);
      showToast("FAQ modifiée avec succès", "success");
      setIsEditing(null);
      setEditingItem({});
      // Recharger
      const allFAQ = await getAllFAQ();
      setFaqItems(allFAQ);
    } catch (error) {
      console.error("Erreur modification FAQ:", error);
      showToast(
        error instanceof Error ? error.message : "Erreur lors de la modification",
        "error"
      );
    }
  };

  // Supprimer une FAQ
  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette FAQ ?")) {
      return;
    }

    try {
      await deleteFAQItem(id);
      showToast("FAQ supprimée avec succès", "success");
      // Recharger
      const allFAQ = await getAllFAQ();
      setFaqItems(allFAQ);
    } catch (error) {
      console.error("Erreur suppression FAQ:", error);
      showToast(
        error instanceof Error ? error.message : "Erreur lors de la suppression",
        "error"
      );
    }
  };

  // Changer l'ordre
  const handleOrderChange = async (id: string, newOrder: number) => {
    try {
      await updateFAQItem(id, { order: newOrder });
      // Recharger
      const allFAQ = await getAllFAQ();
      setFaqItems(allFAQ);
    } catch (error) {
      console.error("Erreur modification ordre:", error);
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateFAQItem(id, { is_active: !currentStatus });
      showToast(
        !currentStatus ? "FAQ activée" : "FAQ désactivée",
        "success"
      );
      // Recharger
      const allFAQ = await getAllFAQ();
      setFaqItems(allFAQ);
    } catch (error) {
      console.error("Erreur modification statut:", error);
      showToast("Erreur lors de la modification", "error");
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
      <div className="max-w-5xl mx-auto px-4 py-8">
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
                <FileText size={32} className="text-red-600" />
                Gestion du Contenu (FAQ)
              </h1>
              <p className="text-slate-400">
                Ajoutez, modifiez ou supprimez les questions fréquentes
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105 flex items-center gap-2"
          >
            <Plus size={20} />
            Ajouter une FAQ
          </button>
        </div>

        {/* Formulaire de création */}
        {isCreating && (
          <div className="bg-slate-800 rounded-3xl p-6 mb-6 shadow-2xl border-2 border-red-600">
            <h2 className="text-xl font-black text-white mb-4">
              Nouvelle Question FAQ
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  Question *
                </label>
                <input
                  type="text"
                  value={newItem.question}
                  onChange={(e) =>
                    setNewItem({ ...newItem, question: e.target.value })
                  }
                  placeholder="Ex: Qu'est-ce que RedZone ?"
                  className="w-full p-4 bg-slate-700 border-2 border-slate-600 rounded-2xl text-white focus:ring-4 focus:ring-red-600/20 focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">
                  Réponse *
                </label>
                <textarea
                  value={newItem.answer}
                  onChange={(e) =>
                    setNewItem({ ...newItem, answer: e.target.value })
                  }
                  placeholder="Ex: RedZone est une plateforme..."
                  rows={4}
                  className="w-full p-4 bg-slate-700 border-2 border-slate-600 rounded-2xl text-white focus:ring-4 focus:ring-red-600/20 focus:border-red-600 resize-none"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-300 mb-2">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={newItem.order}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full p-4 bg-slate-700 border-2 border-slate-600 rounded-2xl text-white focus:ring-4 focus:ring-red-600/20 focus:border-red-600"
                  />
                </div>
                <div className="flex items-center gap-2 mt-8">
                  <input
                    type="checkbox"
                    checked={newItem.is_active}
                    onChange={(e) =>
                      setNewItem({ ...newItem, is_active: e.target.checked })
                    }
                    className="w-5 h-5 text-red-600 rounded"
                  />
                  <label className="text-sm font-bold text-slate-300">
                    Active
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Créer
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewItem({
                      question: "",
                      answer: "",
                      order: 0,
                      is_active: true,
                    });
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Liste des FAQ */}
        <div className="bg-slate-800 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-xl font-black text-white mb-6">
            Questions FAQ ({faqItems.length})
          </h2>

          {isLoadingFAQ ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-slate-400">Chargement...</p>
            </div>
          ) : faqItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Aucune FAQ trouvée. Créez-en une !
            </div>
          ) : (
            <div className="space-y-4">
              {faqItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-6 rounded-2xl border-2 ${
                    item.is_active
                      ? "border-slate-700 bg-slate-700/50"
                      : "border-slate-800 bg-slate-800/50 opacity-60"
                  }`}
                >
                  {isEditing === item.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                          Question *
                        </label>
                        <input
                          type="text"
                          value={editingItem.question || item.question}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              question: e.target.value,
                            })
                          }
                          className="w-full p-4 bg-slate-600 border-2 border-slate-500 rounded-2xl text-white focus:ring-4 focus:ring-red-600/20 focus:border-red-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-300 mb-2">
                          Réponse *
                        </label>
                        <textarea
                          value={editingItem.answer || item.answer}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              answer: e.target.value,
                            })
                          }
                          rows={4}
                          className="w-full p-4 bg-slate-600 border-2 border-slate-500 rounded-2xl text-white focus:ring-4 focus:ring-red-600/20 focus:border-red-600 resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-bold text-slate-300 mb-2">
                            Ordre
                          </label>
                          <input
                            type="number"
                            value={
                              editingItem.order !== undefined
                                ? editingItem.order
                                : item.order
                            }
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                order: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-full p-4 bg-slate-600 border-2 border-slate-500 rounded-2xl text-white focus:ring-4 focus:ring-red-600/20 focus:border-red-600"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-8">
                          <input
                            type="checkbox"
                            checked={
                              editingItem.is_active !== undefined
                                ? editingItem.is_active
                                : item.is_active
                            }
                            onChange={(e) =>
                              setEditingItem({
                                ...editingItem,
                                is_active: e.target.checked,
                              })
                            }
                            className="w-5 h-5 text-red-600 rounded"
                          />
                          <label className="text-sm font-bold text-slate-300">
                            Active
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleUpdate(item.id)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105 flex items-center justify-center gap-2"
                        >
                          <Save size={20} />
                          Enregistrer
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(null);
                            setEditingItem({});
                          }}
                          className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-full transition-all"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <GripVertical
                              size={20}
                              className="text-slate-500 cursor-move"
                            />
                            <span className="text-xs font-bold text-slate-400 bg-slate-600 px-2 py-1 rounded-full">
                              Ordre: {item.order}
                            </span>
                            {item.is_active ? (
                              <span className="text-xs font-bold text-green-500 bg-green-500/20 px-2 py-1 rounded-full">
                                Active
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-slate-500 bg-slate-600 px-2 py-1 rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-black text-white mb-2">
                            {item.question}
                          </h3>
                          <p className="text-slate-300 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => {
                              setIsEditing(item.id);
                              setEditingItem({
                                question: item.question,
                                answer: item.answer,
                                order: item.order,
                                is_active: item.is_active,
                              });
                            }}
                            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full transition-all"
                            title="Modifier"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(item.id, item.is_active)}
                            className={`p-2 rounded-full transition-all ${
                              item.is_active
                                ? "bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-500"
                                : "bg-green-600/20 hover:bg-green-600/30 text-green-500"
                            }`}
                            title={item.is_active ? "Désactiver" : "Activer"}
                          >
                            {item.is_active ? (
                              <X size={18} />
                            ) : (
                              <Save size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded-full transition-all"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

