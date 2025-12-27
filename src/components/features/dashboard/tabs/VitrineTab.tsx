"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Building2, 
  Upload, 
  X, 
  Loader2, 
  Image as ImageIcon,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/uploads";
import { useToast } from "@/components/ui/Toast";

interface VitrineTabProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function VitrineTab({ user }: VitrineTabProps) {
  const { user: authUser } = useAuth();
  const { showToast } = useToast();
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isLoadingCover, setIsLoadingCover] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger la photo de couverture actuelle
  useEffect(() => {
    const loadProfile = async () => {
      if (!authUser?.id) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("profiles")
          .select("cover_image_url")
          .eq("id", authUser.id)
          .single();

        if (!error && data?.cover_image_url) {
          setCoverImageUrl(data.cover_image_url);
        }
      } catch (error) {
        console.error("Erreur chargement profil:", error);
      }
    };

    loadProfile();
  }, [authUser?.id]);

  // Gérer la sélection de fichier
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valider le type de fichier
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("Format non supporté. Utilisez JPG, PNG ou WebP.", "error");
      return;
    }

    // Valider la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast("Fichier trop volumineux. Taille maximale : 10MB", "error");
      return;
    }

    // Créer une preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Gérer l'upload
  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !authUser?.id) {
      showToast("Aucun fichier sélectionné", "error");
      return;
    }

    setIsUploading(true);
    setIsLoadingCover(true);

    try {
      // Upload de l'image avec compression WebP automatique
      const uploadResult = await uploadImage(file, authUser.id);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      const imageUrl = uploadResult.url;

      // Mettre à jour le profil dans la base de données
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ cover_image_url: imageUrl })
        .eq("id", authUser.id);

      if (updateError) {
        throw new Error(`Erreur mise à jour profil: ${updateError.message}`);
      }

      // Mettre à jour l'état local
      setCoverImageUrl(imageUrl);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showToast("Photo de couverture mise à jour avec succès ! 🎉", "success");
    } catch (error) {
      console.error("Erreur upload couverture:", error);
      showToast(
        error instanceof Error 
          ? error.message 
          : "Erreur lors de l'upload. Réessayez.",
        "error"
      );
    } finally {
      setIsUploading(false);
      setIsLoadingCover(false);
    }
  };

  // Supprimer la photo de couverture
  const handleRemoveCover = async () => {
    if (!authUser?.id) return;

    setIsLoadingCover(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ cover_image_url: null })
        .eq("id", authUser.id);

      if (error) {
        throw new Error(`Erreur suppression: ${error.message}`);
      }

      setCoverImageUrl(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      showToast("Photo de couverture supprimée", "success");
    } catch (error) {
      console.error("Erreur suppression couverture:", error);
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setIsLoadingCover(false);
    }
  };

  const displayCoverUrl = previewUrl || coverImageUrl;

  return (
    <div>
      <h1 className="text-4xl font-black text-white tracking-tight mb-2">
        Ma Vitrine
      </h1>
      <p className="text-neutral-400 mb-8">
        Personnalisez votre page publique de garage
      </p>

      {/* Section Photo de Couverture */}
      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white mb-2">
              Photo de Couverture
            </h2>
            <p className="text-neutral-400 text-sm">
              Ajoutez une bannière attractive pour votre vitrine (recommandé: 1920x800px)
            </p>
          </div>
        </div>

        {/* Preview de la couverture */}
        {displayCoverUrl ? (
          <div className="relative w-full h-64 rounded-2xl overflow-hidden mb-4 border border-white/10">
            <Image
              src={displayCoverUrl}
              alt="Couverture du garage"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 100vw"
            />
            {previewUrl && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white font-medium mb-2">Aperçu</p>
                  <p className="text-neutral-300 text-sm">Cliquez sur "Enregistrer" pour confirmer</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-64 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center mb-4 bg-neutral-900/50">
            <div className="text-center">
              <ImageIcon className="text-neutral-500 mx-auto mb-3" size={48} />
              <p className="text-neutral-400 font-medium mb-1">Aucune photo de couverture</p>
              <p className="text-neutral-500 text-sm">Ajoutez une image pour personnaliser votre vitrine</p>
            </div>
          </div>
        )}

        {/* Zone d'upload */}
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading || isLoadingCover}
          />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isLoadingCover}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
            >
              <Upload size={18} />
              {displayCoverUrl ? "Changer la photo" : "Ajouter une photo"}
            </button>

            {previewUrl && (
              <>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Enregistrer
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-800/50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all"
                >
                  <X size={18} />
                  Annuler
                </button>
              </>
            )}

            {coverImageUrl && !previewUrl && (
              <button
                onClick={handleRemoveCover}
                disabled={isLoadingCover}
                className="flex items-center gap-2 px-6 py-3 bg-red-600/20 hover:bg-red-600/30 disabled:bg-red-600/10 disabled:cursor-not-allowed text-red-400 font-medium rounded-xl transition-all border border-red-600/30"
              >
                <X size={18} />
                Supprimer
              </button>
            )}
          </div>

          {/* Info compression */}
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Optimisation automatique</p>
                <p className="text-blue-400/80">
                  L'image sera automatiquement compressée en WebP pour un chargement plus rapide. Taille maximale : 10MB.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lien de prévisualisation */}
      <div className="bg-neutral-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-white mb-2">
              Prévisualiser ma vitrine
            </h3>
            <p className="text-neutral-400 text-sm">
              Votre vitrine publique est accessible à l'adresse suivante :
            </p>
          </div>
          <Link
            href={`/garage/${user.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20 hover:scale-105"
          >
            <ExternalLink size={18} />
            Voir ma vitrine
          </Link>
        </div>
      </div>
    </div>
  );
}
