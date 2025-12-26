"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Loader2,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  FileText,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getAllArticles, Article } from "@/lib/supabase/articles";
import { updateArticleStatus, deleteArticle } from "@/lib/supabase/server-actions/articles";

export default function ArticlesPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setIsLoading(true);
        const fetchedArticles = await getAllArticles();
        setArticles(fetchedArticles);
      } catch (error) {
        console.error("Erreur chargement articles:", error);
        showToast("Erreur lors du chargement des articles", "error");
      } finally {
        setIsLoading(false);
      }
    };
    loadArticles();
  }, [showToast]);

  const handleToggleStatus = async (articleId: string, currentStatus: string) => {
    setUpdatingIds((prev) => new Set(prev).add(articleId));
    try {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      await updateArticleStatus(articleId, newStatus as "published" | "draft");
      setArticles((prev) => prev.map((a) => (a.id === articleId ? { ...a, status: newStatus as any } : a)));
      showToast(`Article ${newStatus === "published" ? "publié" : "dépublié"} !`, "success");
      router.refresh();
    } catch (error: any) {
      console.error("Erreur changement statut:", error);
      showToast(error?.message || "Erreur lors du changement de statut", "error");
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(articleId);
        return newSet;
      });
    }
  };

  const handleDelete = async (articleId: string, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'article "${title}" ?`)) return;
    try {
      await deleteArticle(articleId);
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      showToast("Article supprimé !", "success");
    } catch (error) {
      console.error("Erreur suppression:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="bg-neutral-950 border-b border-white/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
            <BookOpen className="text-red-600" size={28} />
            Gestion des Articles ({articles.length})
          </h2>
          <Link href="/admin/articles/new" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all">
            <Plus size={20} />
            Nouvel Article
          </Link>
        </div>
      </header>

      <div className="p-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={48} className="animate-spin text-red-600" />
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-12 text-center">
            <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-neutral-700">
              <FileText size={32} className="text-neutral-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Aucun article pour le moment</h3>
            <p className="text-neutral-400">Créez votre premier article pour commencer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div key={article.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 flex items-center justify-between hover:border-neutral-700 transition-all">
                <div className="flex-1">
                  <h3 className="text-xl font-black text-white mb-2">{article.title}</h3>
                  <p className="text-sm text-neutral-400 mb-2">
                    Slug: <code className="bg-neutral-800 px-2 py-1 rounded border border-neutral-700 text-neutral-300">{article.slug}</code>
                  </p>
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span>{new Date(article.created_at).toLocaleDateString("fr-BE")}</span>
                    <span className={`px-3 py-1 rounded-full font-bold ${article.status === "published" ? "bg-green-100 text-green-800" : article.status === "draft" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                      {article.status === "published" ? "Publié" : article.status === "draft" ? "Brouillon" : "Archivé"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleStatus(article.id, article.status)} disabled={updatingIds.has(article.id)} className={`p-3 rounded-xl font-bold transition-colors ${updatingIds.has(article.id) ? "bg-slate-200 text-slate-500 cursor-not-allowed" : article.status === "published" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : "bg-green-100 text-green-800 hover:bg-green-200"}`} title={article.status === "published" ? "Dépublier" : "Publier"}>
                    {updatingIds.has(article.id) ? <Loader2 size={20} className="animate-spin" /> : article.status === "published" ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {article.status === "published" ? (
                    <Link href={`/recits/${article.slug}`} target="_blank" className="p-3 bg-blue-100 text-blue-800 rounded-xl hover:bg-blue-200 transition-colors" title="Voir l'article">
                      <Eye size={20} />
                    </Link>
                  ) : (
                    <button disabled className="p-3 bg-slate-100 text-slate-400 rounded-xl cursor-not-allowed" title="L'article doit être publié pour être visible">
                      <Eye size={20} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(article.id, article.title)} className="p-3 bg-red-100 text-red-800 rounded-xl hover:bg-red-200 transition-colors" title="Supprimer">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

