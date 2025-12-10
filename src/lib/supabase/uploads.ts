// RedZone - Gestion des Uploads Supabase

import { createClient } from "./client";

/**
 * Upload une image vers Supabase Storage
 * @param file - Fichier image
 * @param userId - ID de l'utilisateur
 * @returns URL publique de l'image
 */
export async function uploadImage(file: File, userId: string): Promise<string> {
  const supabase = createClient();

  // Générer un nom unique
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `images/${fileName}`;

  // Upload
  const { data, error } = await supabase.storage
    .from("files")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
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
 * @param userId - ID de l'utilisateur
 * @returns Liste des URLs
 */
export async function uploadImages(
  files: File[],
  userId: string
): Promise<string[]> {
  const uploads = files.map((file) => uploadImage(file, userId));
  return Promise.all(uploads);
}

/**
 * Upload un fichier audio vers Supabase Storage
 * @param file - Fichier audio
 * @param userId - ID de l'utilisateur
 * @returns URL publique de l'audio
 */
export async function uploadAudio(file: File, userId: string): Promise<string> {
  const supabase = createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `audio/${fileName}`;

  const { data, error } = await supabase.storage
    .from("files")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
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
  const path = url.split("/files/")[1];

  if (!path) {
    throw new Error("URL invalide");
  }

  const { error } = await supabase.storage.from("files").remove([path]);

  if (error) {
    throw new Error(`Erreur suppression fichier: ${error.message}`);
  }
}

