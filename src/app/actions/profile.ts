"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  // Professionnel uniquement
  garageName?: string;
  logoUrl?: string;
  website?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  garageDescription?: string;
  // Premium
  speciality?: string;
  foundedYear?: number;
  coverImageUrl?: string;
  isVerified?: boolean;
}

export async function updateProfile(data: UpdateProfileData) {
  try {
    const supabase = await createClient();
    
    // Récupérer l'utilisateur actuel
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Vous devez être connecté pour mettre à jour votre profil",
      };
    }

    // Récupérer le profil actuel (optionnel, pour récupérer les valeurs existantes)
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Préparer les métadonnées à mettre à jour
    const currentMetadata = user.user_metadata || {};
    const newMetadata = {
      ...currentMetadata,
      firstName: data.firstName || currentMetadata.firstName,
      lastName: data.lastName || currentMetadata.lastName,
      bio: data.bio || currentMetadata.bio,
      phone: data.phone || currentMetadata.phone,
      // Données professionnelles
      garageName: data.garageName || currentMetadata.garageName,
      logoUrl: data.logoUrl || currentMetadata.logoUrl,
      website: data.website || currentMetadata.website,
      address: data.address || currentMetadata.address,
      city: data.city || currentMetadata.city,
      postalCode: data.postalCode || currentMetadata.postalCode,
      garageDescription: data.garageDescription || currentMetadata.garageDescription,
      // Données premium
      speciality: data.speciality !== undefined ? data.speciality : currentMetadata.speciality,
      foundedYear: data.foundedYear !== undefined ? data.foundedYear : currentMetadata.foundedYear,
      coverImageUrl: data.coverImageUrl !== undefined ? data.coverImageUrl : currentMetadata.coverImageUrl,
      isVerified: data.isVerified !== undefined ? data.isVerified : currentMetadata.isVerified,
    };

    // Mettre à jour les métadonnées utilisateur
    const { error: updateError } = await supabase.auth.updateUser({
      data: newMetadata,
    });

    if (updateError) {
      return {
        success: false,
        error: updateError.message || "Erreur lors de la mise à jour",
      };
    }

    // Préparer les données pour l'upsert (créer ou mettre à jour)
    const fullName = data.firstName && data.lastName
      ? `${data.firstName} ${data.lastName}`
      : (profile?.full_name || `${data.firstName || ""} ${data.lastName || ""}`.trim() || user.email);

    // Utiliser UPSERT pour créer le profil s'il n'existe pas, ou le mettre à jour s'il existe
    const profileData = {
      id: user.id,
      email: user.email,
      full_name: fullName,
      role: user.user_metadata?.role || profile?.role || "particulier",
      // Si c'est un pro et qu'il y a un logo, mettre à jour avatar_url
      avatar_url: data.logoUrl !== undefined ? data.logoUrl : (profile?.avatar_url || null),
      // Nouvelles colonnes pour la vitrine garage
      garage_name: data.garageName !== undefined ? data.garageName : (profile?.garage_name || null),
      garage_description: data.garageDescription !== undefined ? data.garageDescription : (profile?.garage_description || null),
      website: data.website !== undefined ? data.website : (profile?.website || null),
      address: data.address !== undefined ? data.address : (profile?.address || null),
      city: data.city !== undefined ? data.city : (profile?.city || null),
      postal_code: data.postalCode !== undefined ? data.postalCode : (profile?.postal_code || null),
      phone: data.phone !== undefined ? data.phone : (profile?.phone || null),
      bio: data.bio !== undefined ? data.bio : (profile?.bio || null),
      // Colonnes premium
      speciality: data.speciality !== undefined ? data.speciality : (profile?.speciality || null),
      founded_year: data.foundedYear !== undefined ? data.foundedYear : (profile?.founded_year || null),
      cover_image_url: data.coverImageUrl !== undefined ? data.coverImageUrl : (profile?.cover_image_url || null),
      is_verified: data.isVerified !== undefined ? data.isVerified : (profile?.is_verified || false),
    };

    const { error: profileUpsertError } = await supabase
      .from("profiles")
      .upsert(profileData, {
        onConflict: "id",
      });

    if (profileUpsertError) {
      console.error("Erreur upsert profil:", profileUpsertError);
      return {
        success: false,
        error: `Erreur lors de la sauvegarde du profil: ${profileUpsertError.message}`,
      };
    }

    // Logger la mise à jour du profil (RGPD)
    try {
      const { logAuditEventServer } = await import("@/lib/supabase/audit-logs");
      await logAuditEventServer({
        action_type: "profile_update",
        user_id: user.id,
        user_email: user.email || undefined,
        resource_type: "profile",
        resource_id: user.id,
        description: "Mise à jour du profil utilisateur",
        status: "success",
        metadata: {
          updatedFields: Object.keys(data),
        },
      });
    } catch (logError) {
      // Ne pas bloquer la mise à jour en cas d'erreur de logging
      console.error("Erreur lors du logging d'audit:", logError);
    }

    // Revalider les pages qui affichent le profil
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard");
    revalidatePath(`/garage/${user.id}`);

    return {
      success: true,
      message: "Profil mis à jour avec succès",
    };
  } catch (error) {
    console.error("Erreur updateProfile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

