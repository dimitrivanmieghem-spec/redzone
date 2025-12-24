"use client";

// RedZone - Gestionnaire de Médias Pro (Photos & Audio)
// Design harmonisé avec le thème Puriste

import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, Music, Star, Loader2, AlertCircle } from "lucide-react";
import { uploadImages, uploadAudio, deleteFile } from "@/lib/supabase/uploads";
import { useToast } from "@/components/ui/Toast";

interface MediaManagerProps {
  photos: string[];
  audioUrl: string | null;
  onPhotosChange: (photos: string[]) => void;
  onAudioChange: (audioUrl: string | null) => void;
  userId?: string | null;
  disabled?: boolean;
}

export default function MediaManager({
  photos,
  audioUrl,
  onPhotosChange,
  onAudioChange,
  userId,
  disabled = false,
}: MediaManagerProps) {
  const { showToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [deletingPhotoIndex, setDeletingPhotoIndex] = useState<number | null>(null);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Gestion drag-and-drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));

    if (imageFiles.length > 0) {
      await handlePhotoUpload(imageFiles);
    }

    if (audioFiles.length > 0 && audioFiles[0]) {
      await handleAudioUpload(audioFiles[0]);
    }
  }, [disabled]);

  // Upload photos
  const handlePhotoUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploadingPhotos(true);
    try {
      const uploadedUrls = await uploadImages(files, userId || null);
      onPhotosChange([...photos, ...uploadedUrls]);
      showToast(`${uploadedUrls.length} photo(s) ajoutée(s) avec succès !`, "success");
    } catch (error: any) {
      console.error("Erreur upload photos:", error);
      showToast("Erreur lors de l'upload des photos", "error");
    } finally {
      setIsUploadingPhotos(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  // Upload audio
  const handleAudioUpload = async (file: File) => {
    setIsUploadingAudio(true);
    try {
      const uploadedUrl = await uploadAudio(file, userId || null);
      onAudioChange(uploadedUrl);
      showToast("Son uploadé avec succès !", "success");
    } catch (error: any) {
      console.error("Erreur upload audio:", error);
      showToast("Erreur lors de l'upload du son", "error");
    } finally {
      setIsUploadingAudio(false);
      if (audioInputRef.current) {
        audioInputRef.current.value = "";
      }
    }
  };

  // Supprimer une photo (avec nettoyage du bucket)
  const handleRemovePhoto = async (index: number) => {
    const photoUrl = photos[index];
    if (!photoUrl) return;

    setDeletingPhotoIndex(index);
    try {
      // Supprimer du bucket Supabase
      await deleteFile(photoUrl);
      
      // Mettre à jour la liste
      const newPhotos = photos.filter((_, i) => i !== index);
      onPhotosChange(newPhotos);
      
      showToast("Photo supprimée avec succès", "success");
    } catch (error: any) {
      console.error("Erreur suppression photo:", error);
      showToast("Erreur lors de la suppression de la photo", "error");
    } finally {
      setDeletingPhotoIndex(null);
    }
  };

  // Définir la photo de couverture (déplacer en première position)
  const setCoverPhoto = (index: number) => {
    if (index === 0) return; // Déjà en première position
    
    const newPhotos = [...photos];
    const [selectedPhoto] = newPhotos.splice(index, 1);
    newPhotos.unshift(selectedPhoto);
    onPhotosChange(newPhotos);
    showToast("Photo de couverture définie", "success");
  };

  // Réorganiser les photos (drag-and-drop dans la liste)
  const movePhoto = (fromIndex: number, toIndex: number) => {
    const newPhotos = [...photos];
    const [movedPhoto] = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, movedPhoto);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-6">
      {/* Zone de dépôt photos */}
      <div
        ref={dropZoneRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${
          isDragging
            ? "border-red-600 bg-red-50/50"
            : disabled
            ? "border-slate-300 bg-slate-50 cursor-not-allowed"
            : "border-slate-300 hover:border-red-400 bg-white"
        }`}
      >
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
              handlePhotoUpload(files);
            }
          }}
          disabled={disabled || isUploadingPhotos}
          className="hidden"
        />

        <div className="text-center">
          <ImageIcon
            size={48}
            className={`mx-auto mb-4 ${
              isDragging ? "text-red-600" : disabled ? "text-slate-400" : "text-slate-600"
            }`}
          />
          <p className="font-black text-lg text-slate-900 mb-2">
            {isDragging ? "Déposez vos photos ici" : "Glissez-déposez vos photos"}
          </p>
          <p className="text-sm text-slate-600 mb-4">
            ou cliquez pour sélectionner des fichiers
          </p>
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={disabled || isUploadingPhotos}
            className={`px-6 py-3 rounded-2xl font-bold transition-all ${
              disabled || isUploadingPhotos
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white hover:shadow-lg hover:shadow-red-600/30"
            }`}
          >
            {isUploadingPhotos ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Upload en cours...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload size={18} />
                Ajouter des photos
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Liste des photos existantes */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
            <ImageIcon size={20} />
            Photos ({photos.length})
            <span className="text-sm font-medium text-slate-500 ml-2">
              (La première photo sera la photo de couverture)
            </span>
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div
                key={`${photo}-${index}`}
                className="relative group aspect-square rounded-xl overflow-hidden border-2 border-slate-200 hover:border-red-400 transition-all"
              >
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Badge photo de couverture */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1">
                    <Star size={12} fill="white" />
                    Couverture
                  </div>
                )}

                {/* Overlay avec actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => setCoverPhoto(index)}
                      disabled={disabled || deletingPhotoIndex !== null}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                      title="Définir comme photo de couverture"
                    >
                      <Star size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(index)}
                    disabled={disabled || deletingPhotoIndex === index}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                    title="Supprimer la photo"
                  >
                    {deletingPhotoIndex === index ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <X size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload audio */}
      <div className="border-2 border-slate-300 rounded-2xl p-6 bg-white">
        <h3 className="font-black text-lg text-slate-900 mb-4 flex items-center gap-2">
          <Music size={20} />
          Son du moteur (optionnel)
        </h3>
        
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleAudioUpload(file);
            }
          }}
          disabled={disabled || isUploadingAudio}
          className="hidden"
        />

        {audioUrl ? (
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
            <div className="flex items-center gap-3">
              <Music size={24} className="text-red-600" />
              <div>
                <p className="font-bold text-slate-900">Son uploadé</p>
                <p className="text-sm text-slate-600">Fichier audio prêt</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                // Supprimer l'audio (optionnel : nettoyer le bucket)
                onAudioChange(null);
                showToast("Son supprimé", "success");
              }}
              disabled={disabled}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            disabled={disabled || isUploadingAudio}
            className={`w-full px-6 py-4 rounded-2xl font-bold transition-all border-2 ${
              disabled || isUploadingAudio
                ? "border-slate-300 bg-slate-50 text-slate-400 cursor-not-allowed"
                : "border-slate-300 hover:border-red-600 bg-white text-slate-900 hover:bg-red-50"
            }`}
          >
            {isUploadingAudio ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                Upload en cours...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Upload size={18} />
                Ajouter un son
              </span>
            )}
          </button>
        )}
      </div>

      {/* Avertissement si aucune photo */}
      {photos.length === 0 && (
        <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900 mb-1">Photo obligatoire</p>
            <p className="text-sm text-amber-800">
              Une annonce de sportive doit avoir au moins une photo pour être validée.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

