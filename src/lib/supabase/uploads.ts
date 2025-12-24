// RedZone - Gestion des Uploads Supabase

import { createClient } from "./client";

// Types MIME autorisés
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"];

// Limites de taille (en bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Valider un fichier image
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Vérifier le type MIME
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types acceptés: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }

  // Vérifier l'extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = ["jpg", "jpeg", "png", "webp", "gif"];
  if (!ext || !allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `Extension non autorisée. Extensions acceptées: ${allowedExts.join(", ")}`,
    };
  }

  // Vérifier la taille
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille maximale: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "Le fichier est vide",
    };
  }

  return { valid: true };
}

/**
 * Valider un fichier audio
 */
function validateAudioFile(file: File): { valid: boolean; error?: string } {
  // Vérifier le type MIME
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types acceptés: ${ALLOWED_AUDIO_TYPES.join(", ")}`,
    };
  }

  // Vérifier l'extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = ["mp3", "wav", "ogg", "webm"];
  if (!ext || !allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `Extension non autorisée. Extensions acceptées: ${allowedExts.join(", ")}`,
    };
  }

  // Vérifier la taille
  if (file.size > MAX_AUDIO_SIZE) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille maximale: ${MAX_AUDIO_SIZE / 1024 / 1024}MB`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "Le fichier est vide",
    };
  }

  return { valid: true };
}

/**
 * Upload une image vers Supabase Storage
 * @param file - Fichier image
 * @param userId - ID de l'utilisateur (optionnel pour les invités)
 * @returns URL publique de l'image
 */
export async function uploadImage(file: File, userId?: string | null): Promise<string> {
  // Valider le fichier AVANT l'upload
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Fichier invalide");
  }

  const supabase = createClient();

  // Générer un nom unique
  // Pour les invités, utiliser un UUID temporaire basé sur timestamp
  const folderId = userId || `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const fileExt = file.name.split(".").pop();
  const fileName = `${folderId}/${Date.now()}.${fileExt}`;
  const filePath = `images/${fileName}`;

  // Upload
  const { data, error } = await supabase.storage
    .from("files")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    // Détection spécifique des erreurs RLS
    if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
      console.error('[uploadImage] BLOQUAGE RLS DÉTECTÉ');
      console.error('   → Vérifiez que la politique "guest_upload_files" existe sur storage.objects');
      console.error('   → Le path doit commencer par "images/guest_" ou "audio/guest_"');
    }
    
    throw new Error(`Erreur upload image: ${error.message}`);
  }

  // Récupérer l'URL publique
  const { data: publicData } = supabase.storage
    .from("files")
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}

/**
 * Upload plusieurs images
 * @param files - Liste de fichiers
 * @param userId - ID de l'utilisateur (optionnel pour les invités)
 * @returns Liste des URLs
 */
export async function uploadImages(
  files: File[],
  userId?: string | null
): Promise<string[]> {
  const uploads = files.map((file) => uploadImage(file, userId));
  return Promise.all(uploads);
}

/**
 * Upload un fichier audio vers Supabase Storage
 * @param file - Fichier audio
 * @param userId - ID de l'utilisateur (optionnel pour les invités)
 * @returns URL publique de l'audio
 */
export async function uploadAudio(file: File, userId?: string | null): Promise<string> {
  // Valider le fichier AVANT l'upload
  const validation = validateAudioFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Fichier invalide");
  }

  const supabase = createClient();

  // Pour les invités, utiliser un UUID temporaire basé sur timestamp
  const folderId = userId || `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const fileExt = file.name.split(".").pop();
  const fileName = `${folderId}/${Date.now()}.${fileExt}`;
  const filePath = `audio/${fileName}`;

  const { data, error } = await supabase.storage
    .from("files")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    // Détection spécifique des erreurs RLS
    if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
      console.error('[uploadAudio] BLOQUAGE RLS DÉTECTÉ');
      console.error('   → Vérifiez que la politique "guest_upload_files" existe sur storage.objects');
      console.error('   → Le path doit commencer par "images/guest_" ou "audio/guest_"');
    }
    
    throw new Error(`Erreur upload audio: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from("files")
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}

/**
 * Supprimer un fichier de Supabase Storage
 * @param url - URL du fichier à supprimer
 */
export async function deleteFile(url: string): Promise<void> {
  const supabase = createClient();

  // Extraire le path du fichier depuis l'URL
  // Format attendu : https://xxx.supabase.co/storage/v1/object/public/files/images/...
  let path: string | null = null;

  // Essayer plusieurs formats d'URL
  if (url.includes("/files/")) {
    path = url.split("/files/")[1];
  } else if (url.includes("/storage/v1/object/public/files/")) {
    path = url.split("/storage/v1/object/public/files/")[1];
  } else if (url.startsWith("images/") || url.startsWith("audio/")) {
    // Si c'est déjà un path relatif
    path = url;
  }

  if (!path) {
    // Impossible d'extraire le path de l'URL
    // Ne pas throw d'erreur, juste logger un avertissement
    // Car certaines URLs peuvent être des URLs externes (non Supabase)
    return;
  }

  const { error } = await supabase.storage.from("files").remove([path]);

  if (error) {
    // Logger l'erreur mais ne pas bloquer l'application
    console.error("[deleteFile] Erreur suppression fichier:", {
      error: error.message,
      path,
      url
    });
    // Ne pas throw pour éviter de bloquer l'UI si le fichier n'existe plus
    // throw new Error(`Erreur suppression fichier: ${error.message}`);
  } else {
    // Fichier supprimé avec succès
  }
}

