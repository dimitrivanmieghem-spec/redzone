"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Loader2,
  Plus,
  Save,
  X,
  Edit,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getAllFAQ, createFAQItem, updateFAQItem, deleteFAQItem, type FAQItem } from "@/lib/supabase/faq";

export default function ContentPage() {
  const { showToast } = useToast();
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

  useEffect(() => {
    const loadFAQ = async () => {
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
    };
    loadFAQ();
  }, [showToast]);

  const handleCreate = async () => {
    if (!newItem.question.trim() || !newItem.answer.trim()) {
      showToast("Veuillez remplir tous les champs", "error");
      return;
    }
    try {
      const maxOrder = Math.max(...faqItems.map((f) => f.order), -1);
      await createFAQItem({ ...newItem, order: maxOrder + 1 });
      showToast("FAQ créée avec succès", "success");
      setIsCreating(false);
      setNewItem({ question: "", answer: "", order: 0, is_active: true });
      const allFAQ = await getAllFAQ();
      setFaqItems(allFAQ);
    } catch (error) {
      console.error("Erreur création FAQ:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors de la création", "error");
    }
  };

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
      const allFAQ = await getAllFAQ();
      setFaqItems(allFAQ);
    } catch (error) {
      console.error("Erreur modification FAQ:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors de la modification", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette FAQ ?")) return;
    try {
      await deleteFAQItem(id);
      showToast("FAQ supprimée avec succès", "success");
      const allFAQ = await getAllFAQ();
      setFaqItems(allFAQ);
    } catch (error) {
      console.error("Erreur suppression FAQ:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors de la suppression", "error");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateFAQItem(id, { is_active: !currentStatus });
      showToast(!currentStatus ? "FAQ activée" : "FAQ désactivée", "success");
      const allFAQ = await getAllFAQ();
      setFaqItems(allFAQ);
    } catch (error) {
      console.error("Erreur modification statut:", error);
      showToast("Erreur lors de la modification", "error");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
            <FileText className="text-red-600" size={28} />
            Gestion de la FAQ
          </h2>
          <button onClick={() => setIsCreating(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center gap-2">
            <Plus size={20} />
            Ajouter une FAQ
          </button>
        </div>
      </header>

      <div className="p-8">
        {isCreating && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-red-600 p-6 mb-6">
            <h3 className="text-xl font-black text-slate-900 mb-4">Nouvelle Question FAQ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Question *</label>
                <input type="text" value={newItem.question} onChange={(e) => setNewItem({ ...newItem, question: e.target.value })} placeholder="Ex: Qu'est-ce que Octane98 ?" className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-red-600/20 focus:border-red-600" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">Réponse *</label>
                <textarea value={newItem.answer} onChange={(e) => setNewItem({ ...newItem, answer: e.target.value })} placeholder="Ex: Octane98 est une plateforme..." rows={4} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-red-600/20 focus:border-red-600 resize-none" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-900 mb-2">Ordre d'affichage</label>
                  <input type="number" value={newItem.order} onChange={(e) => setNewItem({ ...newItem, order: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-red-600/20 focus:border-red-600" />
                </div>
                <div className="flex items-center gap-2 mt-8">
                  <input type="checkbox" checked={newItem.is_active} onChange={(e) => setNewItem({ ...newItem, is_active: e.target.checked })} className="w-5 h-5 text-red-600 rounded" />
                  <label className="text-sm font-bold text-slate-900">Active</label>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleCreate} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                  <Save size={20} />
                  Créer
                </button>
                <button onClick={() => { setIsCreating(false); setNewItem({ question: "", answer: "", order: 0, is_active: true }); }} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-xl font-black text-slate-900 mb-6">Questions FAQ ({faqItems.length})</h3>
          {isLoadingFAQ ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin text-red-600 mx-auto mb-4" size={32} />
              <p className="text-slate-600">Chargement...</p>
            </div>
          ) : faqItems.length === 0 ? (
            <div className="text-center py-12 text-slate-600">Aucune FAQ trouvée. Créez-en une !</div>
          ) : (
            <div className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.id} className={`p-6 rounded-2xl border-2 ${item.is_active ? "border-slate-200 bg-white" : "border-slate-300 bg-slate-50 opacity-60"}`}>
                  {isEditing === item.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">Question *</label>
                        <input type="text" value={editingItem.question || item.question} onChange={(e) => setEditingItem({ ...editingItem, question: e.target.value })} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-red-600/20 focus:border-red-600" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-900 mb-2">Réponse *</label>
                        <textarea value={editingItem.answer || item.answer} onChange={(e) => setEditingItem({ ...editingItem, answer: e.target.value })} rows={4} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-red-600/20 focus:border-red-600 resize-none" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-bold text-slate-900 mb-2">Ordre</label>
                          <input type="number" value={editingItem.order !== undefined ? editingItem.order : item.order} onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) || 0 })} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:ring-4 focus:ring-red-600/20 focus:border-red-600" />
                        </div>
                        <div className="flex items-center gap-2 mt-8">
                          <input type="checkbox" checked={editingItem.is_active !== undefined ? editingItem.is_active : item.is_active} onChange={(e) => setEditingItem({ ...editingItem, is_active: e.target.checked })} className="w-5 h-5 text-red-600 rounded" />
                          <label className="text-sm font-bold text-slate-900">Active</label>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleUpdate(item.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                          <Save size={20} />
                          Enregistrer
                        </button>
                        <button onClick={() => { setIsEditing(null); setEditingItem({}); }} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-xl transition-all">
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-black text-slate-900 mb-2">{item.question}</h4>
                          <p className="text-slate-700 whitespace-pre-wrap">{item.answer}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                            <span>Ordre: {item.order}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {item.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setIsEditing(item.id); setEditingItem({ question: item.question, answer: item.answer, order: item.order, is_active: item.is_active }); }} className="p-2 bg-blue-100 text-blue-800 rounded-xl hover:bg-blue-200 transition-colors" title="Modifier">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleToggleActive(item.id, item.is_active)} className={`p-2 rounded-xl transition-colors ${item.is_active ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-green-100 text-green-800 hover:bg-green-200"}`} title={item.is_active ? "Désactiver" : "Activer"}>
                            {item.is_active ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-100 text-red-800 rounded-xl hover:bg-red-200 transition-colors" title="Supprimer">
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
    </div>
  );
}

