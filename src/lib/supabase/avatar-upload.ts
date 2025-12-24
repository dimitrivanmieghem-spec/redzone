// RedZone - Upload d'avatar/logo vers Supabase Storage

import { createClient } from "./client";

/**
 * Upload un avatar/logo vers Supabase Storage (bucket 'avatars' ou 'files')
 * @param file - Fichier image
 * @param userId - ID de l'utilisateur
 * @returns URL publique de l'image
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const supabase = createClient();

  // Vérifier d'abord si le bucket 'avatars' existe, sinon utiliser 'files'
  const bucketName = "avatars";
  const fileExt = file.name.split(".").pop()?.toLowerCase();
  const fileName = `${userId}/logo-${Date.now()}.${fileExt}`;
  const filePath = fileName;

  // Essayer d'abord le bucket 'avatars', sinon utiliser 'files'
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true, // Remplacer si existe déjà
    });

  // Si le bucket 'avatars' n'existe pas, utiliser 'files'
  if (error && (error.message?.includes("not found") || error.message?.includes("Bucket not found"))) {
    const fallbackPath = `avatars/${filePath}`;
    const { data: fallbackData, error: fallbackError } = await supabase.storage
      .from("files")
      .upload(fallbackPath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (fallbackError) {
      throw new Error(`Erreur upload avatar: ${fallbackError.message}`);
    }

    const { data: publicData } = supabase.storage
      .from("files")
      .getPublicUrl(fallbackData.path);

    return publicData.publicUrl;
  }

  if (error) {
    throw new Error(`Erreur upload avatar: ${error.message}`);
  }

  if (!data) {
    throw new Error("Erreur upload avatar: Aucune donnée retournée");
  }

  // Récupérer l'URL publique
  const { data: publicData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}

