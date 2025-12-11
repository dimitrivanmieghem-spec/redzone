"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Supprimer un véhicule par token (pour les invités)
 */
export async function deleteVehiculeByToken(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Appeler la fonction SQL qui vérifie le token et supprime
    const { data, error } = await supabase.rpc('delete_vehicule_by_token', {
      token_uuid: token
    });
    
    if (error) {
      console.error('Erreur suppression par token:', error);
      return { success: false, error: error.message };
    }
    
    if (!data) {
      return { success: false, error: 'Token invalide ou véhicule introuvable' };
    }
    
    revalidatePath('/search');
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression véhicule:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Supprimer un véhicule (pour les membres connectés)
 * Supprime aussi les images du Storage
 */
export async function deleteVehiculeForUser(vehiculeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Non autorisé' };
    }
    
    // Récupérer le véhicule pour vérifier la propriété et les images
    const { data: vehicule, error: fetchError } = await supabase
      .from('vehicules')
      .select('id, user_id, image, images')
      .eq('id', vehiculeId)
      .single();
    
    if (fetchError || !vehicule) {
      return { success: false, error: 'Véhicule introuvable' };
    }
    
    // Vérifier que l'utilisateur est propriétaire
    if (vehicule.user_id !== user.id) {
      return { success: false, error: 'Non autorisé' };
    }
    
    // Supprimer les images du Storage
    const imagesToDelete: string[] = [];
    
    if (vehicule.images && Array.isArray(vehicule.images)) {
      imagesToDelete.push(...vehicule.images);
    } else if (vehicule.image) {
      imagesToDelete.push(vehicule.image);
    }
    
    // Supprimer chaque image du Storage
    for (const imagePath of imagesToDelete) {
      // Extraire le chemin du bucket (format: files/path/to/image.jpg)
      if (imagePath.includes('/storage/v1/object/public/')) {
        const pathMatch = imagePath.match(/\/storage\/v1\/object\/public\/files\/(.+)/);
        if (pathMatch) {
          const filePath = pathMatch[1];
          await supabase.storage.from('files').remove([filePath]);
        }
      }
    }
    
    // Supprimer le véhicule
    const { error: deleteError } = await supabase
      .from('vehicules')
      .delete()
      .eq('id', vehiculeId);
    
    if (deleteError) {
      return { success: false, error: deleteError.message };
    }
    
    revalidatePath('/dashboard');
    revalidatePath('/search');
    return { success: true };
  } catch (error) {
    console.error('Erreur suppression véhicule:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

