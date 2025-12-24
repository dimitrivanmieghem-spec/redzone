"use server";

// RedZone - Server Actions pour la Gestion des Utilisateurs (Admin)
// Ces actions utilisent le service_role pour les opérations sensibles

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "../server";
import { createAdminClient } from "../admin";
import { requireAdmin } from "../auth-utils-server";
import { createNotification } from "../notifications-server";

// Utiliser le client admin centralisé

export interface BanUserParams {
  userId: string;
  reason: string;
  banUntil: string | null; // ISO string ou null pour permanent
}

/**
 * Bannir un utilisateur avec raison et date de fin
 */
export async function banUser(params: BanUserParams) {
  // Vérification admin avec le client serveur
  const supabase = await createServerClient();
  await requireAdmin(supabase);

  const { userId, reason, banUntil } = params;

  if (!reason.trim()) {
    throw new Error("La raison du bannissement est obligatoire");
  }

  // Convertir banUntil en Date si fourni
  const banUntilDate = banUntil ? new Date(banUntil) : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: true,
      ban_reason: reason.trim(),
      ban_until: banUntilDate ? banUntilDate.toISOString() : null,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Erreur lors du bannissement: ${error.message}`);
  }

  // Récupérer les infos de l'utilisateur pour la notification
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  // Formater la date de fin de bannissement
  const banUntilFormatted = banUntilDate
    ? new Date(banUntilDate).toLocaleDateString("fr-BE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  // Notifier l'utilisateur
  await createNotification(
    userId,
    "Compte suspendu",
    `Votre compte a été suspendu. Raison : ${reason.trim()}${banUntilFormatted ? ` Jusqu'au ${banUntilFormatted}` : " (permanent)"}`,
    "error",
    "/dashboard",
    { action: "ban", reason: reason.trim(), ban_until: banUntilDate?.toISOString() || null }
  );

  // Invalider TOUT le cache (layout racine)
  revalidatePath('/', 'layout');
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Débannir un utilisateur
 */
export async function unbanUser(userId: string) {
  // Vérification admin avec le client serveur
  const supabase = await createServerClient();
  await requireAdmin(supabase);

  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: false,
      ban_reason: null,
      ban_until: null,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(`Erreur lors du débannissement: ${error.message}`);
  }

  // Notifier l'utilisateur
  await createNotification(
    userId,
    "Compte réactivé",
    "Votre compte a été réactivé. Vous pouvez à nouveau utiliser RedZone.",
    "success",
    "/dashboard",
    { action: "unban" }
  );

  // Invalider TOUT le cache (layout racine)
  revalidatePath('/', 'layout');
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Supprimer définitivement un utilisateur (Auth + Profil + Annonces)
 * Utilise service_role car seul un admin Supabase peut supprimer un utilisateur auth
 */
export async function deleteUser(userId: string) {
  // Début suppression utilisateur
  
  // Vérification admin avec le client serveur
  const supabase = await createServerClient();
  await requireAdmin(supabase);

  // Vérifier qu'on ne supprime pas soi-même
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user && user.id === userId) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte");
  }

  // Vérifier qu'on ne supprime pas un autre admin
  const { data: targetUser } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (targetUser?.role === "admin") {
    throw new Error("Vous ne pouvez pas supprimer un autre administrateur");
  }

  // Utiliser le client admin pour supprimer l'utilisateur auth
  const serviceClient = createAdminClient();

  // Supprimer l'utilisateur auth (cela supprimera automatiquement le profil et les annonces par cascade)
  const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);

  if (deleteError) {
    throw new Error(`Erreur lors de la suppression: ${deleteError.message}`);
  }

  // Invalider TOUT le cache (layout racine)
  revalidatePath('/', 'layout');
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/cars");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Vérifier et débannir automatiquement les utilisateurs dont le ban a expiré
 */
export async function checkExpiredBans() {
  // Vérification admin
  await requireAdmin();

  const supabase = await createServerClient();

  const { error } = await supabase.rpc("check_expired_bans");

  if (error) {
    // Si la fonction n'existe pas, on fait la vérification manuellement
    // Récupérer les utilisateurs dont le ban a expiré
    const { data: expiredBans, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_banned", true)
      .not("ban_until", "is", null)
      .lt("ban_until", new Date().toISOString());

    if (fetchError) {
      throw new Error(`Erreur lors de la vérification: ${fetchError.message}`);
    }

    if (expiredBans && expiredBans.length > 0) {
      // Débannir les utilisateurs
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_banned: false,
          ban_reason: null,
          ban_until: null,
        })
        .eq("is_banned", true)
        .not("ban_until", "is", null)
        .lt("ban_until", new Date().toISOString());

      if (updateError) {
        throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
      }

      // Notifier chaque utilisateur dont le ban a expiré
      const notifications = expiredBans.map((user) =>
        createNotification(
          user.id,
          "Compte réactivé automatiquement",
          "Votre suspension temporaire a pris fin. Votre compte est à nouveau actif.",
          "success",
          "/dashboard",
          { action: "ban_expired" }
        )
      );

      await Promise.all(notifications);
    }
  }

  return { success: true };
}

