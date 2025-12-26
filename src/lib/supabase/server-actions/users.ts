"use server";

// Octane98 - Server Actions pour la Gestion des Utilisateurs (Admin)
// Ces actions utilisent le service_role pour les opérations sensibles

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "../server";
import { createAdminClient } from "../admin";
import { requireAdmin } from "../auth-utils-server";
import type { UserRole } from "@/lib/permissions";
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
    "Votre compte a été réactivé. Vous pouvez à nouveau utiliser Octane98.",
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

/**
 * Créer un utilisateur manuellement (admin uniquement)
 * @param email - Email de l'utilisateur
 * @param password - Mot de passe
 * @param fullName - Nom complet
 * @param role - Rôle à attribuer
 * @returns ID de l'utilisateur créé
 */
export async function createUserManually(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
): Promise<{ success: boolean; userId: string | null; error?: string }> {
  try {
    // Vérification admin avec le client serveur
    const supabase = await createServerClient();
    await requireAdmin(supabase);

    // Validation des données
    if (!email || !email.includes("@")) {
      return { success: false, userId: null, error: "Email invalide" };
    }
    if (!password || password.length < 6) {
      return { success: false, userId: null, error: "Le mot de passe doit contenir au moins 6 caractères" };
    }
    if (!fullName || fullName.trim().length === 0) {
      return { success: false, userId: null, error: "Le nom complet est obligatoire" };
    }
    // Vérifier que le rôle est valide (pour l'instant, on accepte les rôles actuels + les nouveaux proposés)
    const validRoles = ["particulier", "pro", "admin", "moderator", "support", "editor", "viewer"];
    if (!validRoles.includes(role)) {
      return { success: false, userId: null, error: "Rôle invalide" };
    }

    // Utiliser le client admin pour créer l'utilisateur auth
    const serviceClient = createAdminClient();

    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirmer l'email
      user_metadata: {
        full_name: fullName.trim(),
        role: role,
      },
    });

    if (authError || !authData.user) {
      return { success: false, userId: null, error: authError?.message || "Erreur lors de la création de l'utilisateur" };
    }

    const userId = authData.user.id;

    // Attendre un peu pour que le trigger s'exécute (si présent)
    // Le trigger handle_new_user() s'exécute immédiatement après l'INSERT dans auth.users
    await new Promise(resolve => setTimeout(resolve, 100));

    // Créer ou mettre à jour le profil dans la table profiles
    // Le trigger peut avoir déjà créé le profil, donc on utilise upsert avec onConflict
    const { error: profileError } = await serviceClient
      .from("profiles")
      .upsert({
        id: userId,
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        role: role,
      }, {
        onConflict: "id",
      });

    if (profileError) {
      // Détecter le type d'erreur
      const isDuplicateError = 
        profileError.code === '23505' || // PostgreSQL unique violation
        profileError.message?.toLowerCase().includes('duplicate') ||
        profileError.message?.toLowerCase().includes('unique') ||
        profileError.message?.toLowerCase().includes('already exists');

      if (isDuplicateError) {
        // Le profil existe déjà (créé par trigger), faire un UPDATE
        const { error: updateError } = await serviceClient
          .from("profiles")
          .update({
            email: email.trim().toLowerCase(),
            full_name: fullName.trim(),
            role: role,
          })
          .eq("id", userId);

        if (updateError) {
          console.error("Erreur mise à jour profil après trigger:", updateError);
          // Ne pas échouer complètement, le profil existe déjà (créé par trigger)
          // L'utilisateur peut toujours se connecter, même si le rôle n'est pas mis à jour immédiatement
        }
      } else {
        // Autre erreur (contrainte, RLS, etc.)
        console.error("Erreur upsert profil (non-duplicate):", profileError);
        // Essayer quand même un UPDATE au cas où le profil existe
        const { error: updateError } = await serviceClient
          .from("profiles")
          .update({
            email: email.trim().toLowerCase(),
            full_name: fullName.trim(),
            role: role,
          })
          .eq("id", userId);

        if (updateError) {
          // Si l'UPDATE échoue aussi, le profil n'existe probablement pas
          // Le trigger a peut-être échoué, mais on ne bloque pas la création de l'utilisateur auth
          console.warn("⚠️ Le profil n'a pas pu être créé/mis à jour, mais l'utilisateur auth a été créé avec succès.");
          console.warn("   → L'utilisateur pourra se connecter, mais devra peut-être compléter son profil.");
        }
      }
    }

    // Logger la création
    try {
      const { logAuditEventServer } = await import("@/lib/supabase/audit-logs");
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      await logAuditEventServer({
        action_type: "data_modification",
        user_id: currentUser?.id || null,
        user_email: currentUser?.email || undefined,
        resource_type: "user",
        resource_id: userId,
        description: `Création manuelle d'utilisateur: ${email} avec rôle ${role}`,
        status: "success",
        metadata: { created_user_email: email, created_user_role: role },
      });
    } catch (logError) {
      console.error("Erreur lors du logging d'audit:", logError);
    }

    // Invalider le cache
    revalidatePath("/admin/users");
    revalidatePath("/admin/dashboard");

    return { success: true, userId };
  } catch (error) {
    console.error("Erreur createUserManually:", error);
    return { success: false, userId: null, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

