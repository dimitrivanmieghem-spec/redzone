"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";

export default function NewArticlePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    main_image_url: "",
    status: "draft" as "draft" | "published" | "archived",
  });

  // Protection : Rediriger si non admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      showToast("Accès refusé - Administrateur uniquement", "error");
      router.push("/");
    }
  }, [user, authLoading, router, showToast]);

  // Générer le slug automatiquement depuis le titre
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
        .replace(/[^a-z0-9]+/g, "-") // Remplacer les caractères spéciaux par des tirets
        .replace(/^-+|-+$/g, ""); // Supprimer les tirets en début/fin
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || user.role !== "admin") {
      showToast("Accès refusé", "error");
      return;
    }

    if (!formData.title.trim() || !formData.slug.trim() || !formData.content.trim()) {
      showToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

    setIsSubmitting(true); // Début du chargement

    try {
      const supabase = createClient();
      
      // Vérifier que le slug est unique
      const { data: existingArticle } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", formData.slug.trim())
        .single();

      if (existingArticle) {
        throw new Error("Un article avec ce slug existe déjà. Veuillez modifier le slug.");
      }

      const { data, error } = await supabase
        .from("articles")
        .insert({
          title: formData.title.trim(),
          slug: formData.slug.trim(),
          content: formData.content.trim(),
          main_image_url: formData.main_image_url.trim() || null,
          author_id: user.id,
          status: formData.status,
        })
        .select("id")
        .single();

      if (error) {
        console.error("Erreur Supabase:", error);
        throw error;
      }

      // Si on est là, c'est que c'est bon
      showToast("Article créé avec succès !", "success");
      
      // Petit délai pour voir le toast, puis redirection
      setTimeout(() => {
        router.push("/admin/articles");
        router.refresh(); // Rafraîchir les données
      }, 500);
    } catch (error: any) {
      console.error("Erreur création article:", error);
      showToast(
        error?.message || error?.error_description || "Erreur lors de la création de l'article",
        "error"
      );
    } finally {
      // C'EST LA LIGNE LA PLUS IMPORTANTE :
      setIsSubmitting(false); // Arrête le spinner quoiqu'il arrive
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
          <Link href="/admin/articles" className="flex items-center gap-3 mb-4 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium">Retour Articles</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center">
              <ImageIcon size={20} className="text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Nouvel Article</h1>
              <p className="text-xs text-slate-400">Récits de Puristes</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">
            Créer un nouvel article
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titre */}
            <div>
              <label htmlFor="title" className="block text-sm font-bold text-slate-900 mb-3">
                Titre <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 text-slate-900 font-medium"
                placeholder="Ex: Ma première Porsche 911"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-bold text-slate-900 mb-3">
                Slug (URL) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 text-slate-900 font-medium"
                placeholder="ex-ma-premiere-porsche-911"
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Généré automatiquement depuis le titre. Vous pouvez le modifier.
              </p>
            </div>

            {/* Image principale */}
            <div>
              <label htmlFor="main_image_url" className="block text-sm font-bold text-slate-900 mb-3">
                URL de l&apos;image principale (optionnel)
              </label>
              <input
                type="url"
                id="main_image_url"
                value={formData.main_image_url}
                onChange={(e) => setFormData({ ...formData, main_image_url: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 text-slate-900 font-medium"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Contenu */}
            <div>
              <label htmlFor="content" className="block text-sm font-bold text-slate-900 mb-3">
                Contenu <span className="text-red-600">*</span>
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={15}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 text-slate-900 font-medium resize-y"
                placeholder="Rédigez votre article ici..."
                required
              />
              <p className="text-xs text-slate-500 mt-2">
                Utilisez des sauts de ligne pour créer des paragraphes.
              </p>
            </div>

            {/* Statut */}
            <div>
              <label htmlFor="status" className="block text-sm font-bold text-slate-900 mb-3">
                Statut
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/20 text-slate-900 font-medium"
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
                <option value="archived">Archivé</option>
              </select>
            </div>

            {/* Boutons */}
            <div className="flex items-center gap-4 pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg transition-all shadow-xl ${
                  isSubmitting
                    ? "bg-slate-400 cursor-not-allowed text-white opacity-60"
                    : "bg-red-600 hover:bg-red-700 text-white hover:scale-105 shadow-red-600/50 active:scale-95"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Créer l&apos;article
                  </>
                )}
              </button>
              <Link
                href="/admin/articles"
                className="px-6 py-3 rounded-xl font-bold text-lg bg-slate-200 hover:bg-slate-300 text-slate-900 transition-all"
              >
                Annuler
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

