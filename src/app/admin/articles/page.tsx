"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { getAllArticles, Article } from "@/lib/supabase/articles";
import { createClient } from "@/lib/supabase/client";

export default function AdminArticlesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Protection : Rediriger si non admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      showToast("Accès refusé - Administrateur uniquement", "error");
      router.push("/");
    }
  }, [user, authLoading, router, showToast]);

  // Charger les articles
  useEffect(() => {
    const loadArticles = async () => {
      if (user && user.role === "admin") {
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
      }
    };

    loadArticles();
  }, [user, showToast]);

  const handleToggleStatus = async (articleId: string, currentStatus: string) => {
    setUpdatingIds((prev) => new Set(prev).add(articleId));

    try {
      const supabase = createClient();
      const newStatus = currentStatus === "published" ? "draft" : "published";

      const { error } = await supabase
        .from("articles")
        .update({ status: newStatus })
        .eq("id", articleId);

      if (error) {
        console.error("Erreur Supabase:", error);
        throw error;
      }

      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, status: newStatus as any } : a))
      );
      showToast(`Article ${newStatus === "published" ? "publié" : "dépublié"} !`, "success");
      router.refresh(); // Rafraîchir les données
    } catch (error: any) {
      console.error("Erreur changement statut:", error);
      showToast(
        error?.message || error?.error_description || "Erreur lors du changement de statut",
        "error"
      );
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(articleId);
        return newSet;
      });
    }
  };

  const handleDelete = async (articleId: string, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'article "${title}" ?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from("articles").delete().eq("id", articleId);

      if (error) throw error;

      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      showToast("Article supprimé !", "success");
    } catch (error) {
      console.error("Erreur suppression:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  if (authLoading) {
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
              <FileText size={20} className="text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Gestion Articles</h1>
              <p className="text-xs text-slate-400">Récits de Puristes</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          <Link
            href="/admin/dashboard"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-2xl font-bold transition-all"
          >
            <FileText size={18} />
            Modération
          </Link>
          <Link
            href="/admin/articles"
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 text-slate-900 rounded-2xl font-bold transition-all"
          >
            <FileText size={18} />
            Articles
          </Link>
        </nav>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 bg-white p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Gestion des Articles ({articles.length})
          </h2>
          <Link
            href="/admin/articles/new"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
          >
            <Plus size={20} />
            Nouvel Article
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={48} className="animate-spin text-red-600" />
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-xl shadow-slate-100/50 border-0">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Aucun article pour le moment
            </h3>
            <p className="text-slate-600">
              Créez votre premier article pour commencer.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="text-xl font-black text-slate-900 mb-2">{article.title}</h3>
                  <p className="text-sm text-slate-600 mb-2">
                    Slug: <code className="bg-slate-100 px-2 py-1 rounded">{article.slug}</code>
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>
                      {new Date(article.created_at).toLocaleDateString("fr-BE")}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full font-bold ${
                        article.status === "published"
                          ? "bg-green-100 text-green-800"
                          : article.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {article.status === "published"
                        ? "Publié"
                        : article.status === "draft"
                        ? "Brouillon"
                        : "Archivé"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleStatus(article.id, article.status)}
                    disabled={updatingIds.has(article.id)}
                    className={`p-3 rounded-xl font-bold transition-colors ${
                      updatingIds.has(article.id)
                        ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                        : article.status === "published"
                        ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                    title={article.status === "published" ? "Dépublier" : "Publier"}
                  >
                    {updatingIds.has(article.id) ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : article.status === "published" ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                  {article.status === "published" ? (
                    <Link
                      href={`/recits/${article.slug}`}
                      target="_blank"
                      className="p-3 bg-blue-100 text-blue-800 rounded-xl hover:bg-blue-200 transition-colors"
                      title="Voir l'article"
                    >
                      <Eye size={20} />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="p-3 bg-slate-100 text-slate-400 rounded-xl cursor-not-allowed"
                      title="L'article doit être publié pour être visible"
                    >
                      <Eye size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(article.id, article.title)}
                    className="p-3 bg-red-100 text-red-800 rounded-xl hover:bg-red-200 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

