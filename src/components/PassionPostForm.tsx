"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, Loader2, HelpCircle, Car, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { uploadImages } from "@/lib/supabase/uploads";
import { createClient } from "@/lib/supabase/client";
import { logInfo, logError } from "@/lib/supabase/logs";

type PostType = "question" | "presentation";

export default function PassionPostForm() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    postType: "question" as PostType,
    content: "",
    photos: [] as File[],
    photoUrls: [] as string[],
  });

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
    
    // Limiter à 3 photos
    if (formData.photos.length + files.length > 3) {
      showToast("Maximum 3 photos par post", "error");
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
      showToast("Vous devez être connecté pour publier un post", "error");
      router.push("/login");
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      showToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

    if (formData.content.trim().length < 20) {
      showToast("Le contenu doit faire au moins 20 caractères", "error");
      return;
    }

    setIsSubmitting(true);
    setIsUploadingPhotos(true);

    try {
      // 1. Upload des photos si présentes
      let mainImageUrl: string | null = null;
      if (formData.photos.length > 0) {
        const uploadedUrls = await uploadImages(formData.photos, user.id);
        mainImageUrl = uploadedUrls[0] || null; // Première photo comme image principale
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

      // 3. Insérer le post avec status 'pending'
      const { data, error } = await supabase
        .from("articles")
        .insert({
          title: formData.title.trim(),
          slug: finalSlug,
          content: formData.content.trim(),
          main_image_url: mainImageUrl,
          author_id: user.id,
          status: "pending", // En attente de modération
          post_type: formData.postType,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      // Log de succès
      logInfo(
        `Post ${data.id} submitted by User ${user.id}`,
        user.id,
        {
          post_id: data.id,
          post_type: formData.postType,
          title: formData.title,
        }
      );

      showToast(
        "Post soumis avec succès ! Il sera visible après validation par l'admin.",
        "success"
      );

      // Réinitialiser le formulaire
      setFormData({
        title: "",
        postType: "question",
        content: "",
        photos: [],
        photoUrls: [],
      });
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }

      // Rediriger vers la tribune
      setTimeout(() => {
        router.push("/tribune");
        router.refresh();
      }, 1000);
    } catch (error: any) {
      console.error("Erreur soumission post:", error);
      logError(
        `Post submission failed for User ${user?.id}: ${error?.message || "Unknown error"}`,
        user?.id,
        {
          post_type: formData.postType,
          title: formData.title,
          error_message: error?.message,
        }
      );
      showToast(
        error?.message || "Erreur lors de la soumission du post",
        "error"
      );
    } finally {
      setIsSubmitting(false);
      setIsUploadingPhotos(false);
    }
  };

  // Si non connecté, afficher un message
  if (!user) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle size={32} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Connexion requise
        </h3>
        <p className="text-slate-600 mb-6">
          Vous devez être connecté pour publier un post dans la Tribune Passion.
        </p>
        <a
          href="/login"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
        >
          Se connecter
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-black text-slate-900 mb-2">
          Publier dans la Tribune Passion
        </h2>
        <p className="text-slate-600">
          Partagez une question, une présentation de véhicule ou une expérience.
        </p>
      </div>

      {/* Type de Post */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-900 mb-3">
          Type de contenu <span className="text-red-600">*</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, postType: "question" }))}
            className={`p-4 rounded-2xl border-2 transition-all ${
              formData.postType === "question"
                ? "border-red-600 bg-red-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <HelpCircle
              size={32}
              className={`mb-2 ${
                formData.postType === "question" ? "text-red-600" : "text-slate-400"
              }`}
            />
            <p className="font-bold text-slate-900">Question / Aide</p>
            <p className="text-xs text-slate-600 mt-1">
              Besoin d&apos;aide ou conseil
            </p>
          </button>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, postType: "presentation" }))}
            className={`p-4 rounded-2xl border-2 transition-all ${
              formData.postType === "presentation"
                ? "border-red-600 bg-red-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <Car
              size={32}
              className={`mb-2 ${
                formData.postType === "presentation" ? "text-red-600" : "text-slate-400"
              }`}
            />
            <p className="font-bold text-slate-900">Présentation Véhicule</p>
            <p className="text-xs text-slate-600 mt-1">
              Présentez votre bolide
            </p>
          </button>
        </div>
      </div>

      {/* Titre */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-900 mb-2">
          Titre du Post <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder={
            formData.postType === "question"
              ? "Ex: Aide pour turbo sur Golf 7 GTI"
              : "Ex: Présentation de ma M3 E46"
          }
          className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-red-600 transition-all"
          maxLength={100}
          required
        />
        <p className="text-xs text-slate-500 mt-2">
          {formData.title.length}/100 caractères
        </p>
      </div>

      {/* Contenu */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-900 mb-2">
          Contenu <span className="text-red-600">*</span>
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
          placeholder="Décrivez votre question ou présentez votre véhicule..."
          className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-red-600 transition-all min-h-[200px] resize-y"
          required
        />
        <p className="text-xs text-slate-500 mt-2">
          {formData.content.length} caractères (minimum 20)
        </p>
      </div>

      {/* Photos */}
      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-900 mb-2">
          Photos (max 3)
        </label>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoChange}
          className="hidden"
          id="photo-upload"
        />
        <label
          htmlFor="photo-upload"
          className="block w-full p-6 border-2 border-dashed border-slate-300 rounded-2xl text-center cursor-pointer hover:border-red-600 hover:bg-red-50 transition-all"
        >
          <Upload size={32} className="text-slate-400 mx-auto mb-2" />
          <p className="text-slate-600 font-medium">
            Cliquez pour ajouter des photos
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Maximum 3 photos, 5MB par photo
          </p>
        </label>

        {/* Aperçu des photos */}
        {formData.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {formData.photos.map((photo, index) => {
              const photoUrl = URL.createObjectURL(photo);
              return (
              <div key={`${photo.name}-${photo.size}-${index}`} className="relative group">
                <img
                  src={photoUrl}
                  alt={`Preview photo`}
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
            )})}
          </div>
        )}
      </div>

      {/* Bouton Submit */}
      <button
        type="submit"
        disabled={isSubmitting || isUploadingPhotos}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
      >
        {isSubmitting || isUploadingPhotos ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            {isUploadingPhotos ? "Upload des photos..." : "Publication..."}
          </>
        ) : (
          <>
            <FileText size={20} />
            Publier dans la Tribune
          </>
        )}
      </button>

      <p className="text-xs text-slate-500 text-center mt-4">
        ⚠️ Votre post sera soumis à modération avant d&apos;être visible publiquement.
      </p>
    </form>
  );
}

