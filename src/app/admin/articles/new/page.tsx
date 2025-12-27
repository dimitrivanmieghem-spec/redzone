"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, Save, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { uploadImages } from "@/lib/supabase/uploads";
import { createClient } from "@/lib/supabase/client";
import { logInfo, logError } from "@/lib/supabase/logs";
import Link from "next/link";

type ArticleStatus = "draft" | "pending" | "published" | "archived";
type PostType = "question" | "presentation" | "article" | null;

export default function NewArticlePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    postType: "article" as PostType,
    content: "",
    status: "draft" as ArticleStatus,
    photos: [] as File[],
    photoUrls: [] as string[],
  });

  // Protection : Rediriger si pas admin/editor
  useEffect(() => {
    if (user && !["admin", "editor"].includes(user.role)) {
      showToast("Accès refusé - Rôle admin ou editor requis", "error");
      router.push("/admin");
    }
  }, [user, router, showToast]);

  // Générer un slug à partir du titre
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 50);
  };

  // Gestion des photos
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Limiter à 5 photos pour les articles
    if (formData.photos.length + files.length > 5) {
      showToast("Maximum 5 photos par article", "error");
      return;
    }

    // Vérifier la taille (max 5MB par photo)
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      showToast("Chaque photo doit faire moins de 5MB", "error");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      photos: [...prev.photos, ...files],
    }));
  };

  const removePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast("Vous devez être connecté", "error");
      router.push("/login");
      return;
    }

    if (!["admin", "editor"].includes(user.role)) {
      showToast("Accès refusé - Rôle admin ou editor requis", "error");
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      showToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

    if (formData.content.trim().length < 50) {
      showToast("Le contenu doit faire au moins 50 caractères", "error");
      return;
    }

    setIsSubmitting(true);
    setIsUploadingPhotos(true);

    try {
      // 1. Upload des photos si présentes
      let mainImageUrl: string | null = null;
      if (formData.photos.length > 0) {
        const uploadResults = await uploadImages(formData.photos, user.id);

        // Collecter seulement les URLs des uploads réussis
        const successfulUrls = uploadResults
          .filter(result => result.success)
          .map(result => result.url);

        if (successfulUrls.length > 0) {
          mainImageUrl = successfulUrls[0]; // Première photo comme image principale
        } else {
          // Tous les uploads ont échoué
          throw new Error("Échec de l'upload des photos. Veuillez réessayer.");
        }
      }

      setIsUploadingPhotos(false);

      // 2. Générer un slug unique
      let slug = generateSlug(formData.title);
      const supabase = createClient();

      // Vérifier l'unicité du slug
      let slugCounter = 1;
      let finalSlug = slug;
      while (true) {
        const { data: existing } = await supabase
          .from("articles")
          .select("id")
          .eq("slug", finalSlug)
          .single();

        if (!existing) break;
        finalSlug = `${slug}-${slugCounter}`;
        slugCounter++;
      }

      // 3. Insérer l'article
      const { data, error } = await supabase
        .from("articles")
        .insert({
          title: formData.title.trim(),
          slug: finalSlug,
          content: formData.content.trim(),
          main_image_url: mainImageUrl,
          author_id: user.id,
          status: formData.status,
          post_type: formData.postType,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      // Log de succès
      logInfo(
        `Article ${data.id} created by ${user.role} ${user.id}`,
        user.id,
        {
          article_id: data.id,
          post_type: formData.postType,
          status: formData.status,
          title: formData.title,
        }
      );

      showToast(
        formData.status === "published"
          ? "Article publié avec succès !"
          : formData.status === "draft"
          ? "Brouillon enregistré avec succès !"
          : "Article créé avec succès !",
        "success"
      );

      // Rediriger vers la liste des articles
      setTimeout(() => {
        router.push("/admin?tab=articles");
        router.refresh();
      }, 1000);
    } catch (error: any) {
      console.error("Erreur création article:", error);
      logError(
        `Article creation failed for ${user?.role} ${user?.id}: ${error?.message || "Unknown error"}`,
        user?.id,
        {
          post_type: formData.postType,
          status: formData.status,
          title: formData.title,
          error_message: error?.message,
        }
      );
      showToast(
        error?.message || "Erreur lors de la création de l'article",
        "error"
      );
    } finally {
      setIsSubmitting(false);
      setIsUploadingPhotos(false);
    }
  };

  // Si non connecté ou pas autorisé
  if (!user || !["admin", "editor"].includes(user.role)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="text-slate-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Accès refusé</h2>
          <p className="text-slate-600 mb-6">
            Vous devez être administrateur ou éditeur pour créer un article.
          </p>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
            Retour à l'admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin?tab=articles"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft size={20} />
            Retour aux articles
          </Link>
          <h1 className="text-3xl font-black text-slate-900">Nouvel Article</h1>
          <p className="text-slate-600 mt-2">Créez un nouvel article pour le blog</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8">
          {/* Titre */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-bold text-slate-900 mb-2">
              Titre de l'article *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
              placeholder="Ex: Guide d'achat d'une voiture de sport"
              required
            />
          </div>

          {/* Type et Statut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="postType" className="block text-sm font-bold text-slate-900 mb-2">
                Type d'article
              </label>
              <select
                id="postType"
                value={formData.postType || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    postType: e.target.value as PostType,
                  }))
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
              >
                <option value="article">Article</option>
                <option value="question">Question</option>
                <option value="presentation">Présentation</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-bold text-slate-900 mb-2">
                Statut
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as ArticleStatus,
                  }))
                }
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
              >
                <option value="draft">Brouillon</option>
                <option value="pending">En attente de validation</option>
                <option value="published">Publié</option>
                <option value="archived">Archivé</option>
              </select>
            </div>
          </div>

          {/* Contenu */}
          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-bold text-slate-900 mb-2">
              Contenu de l'article *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              rows={15}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all resize-y"
              placeholder="Rédigez votre article ici... (minimum 50 caractères)"
              required
            />
            <p className="text-xs text-slate-500 mt-2">
              {formData.content.length} caractères (minimum 50)
            </p>
          </div>

          {/* Photos */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Photos (optionnel, max 5)
            </label>
            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={formData.photos.length >= 5}
              className="w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-xl hover:border-red-600 transition-colors flex items-center justify-center gap-2 text-slate-600 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={20} />
              Ajouter des photos ({formData.photos.length}/5)
            </button>

            {/* Aperçu des photos */}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className="flex gap-4 justify-end">
            <Link
              href="/admin?tab=articles"
              className="px-6 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingPhotos}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting || isUploadingPhotos ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {isUploadingPhotos ? "Upload en cours..." : "Enregistrement..."}
                </>
              ) : (
                <>
                  <Save size={20} />
                  {formData.status === "published" ? "Publier" : "Enregistrer"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

