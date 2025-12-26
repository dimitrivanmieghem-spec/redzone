"use server";

// Octane98 - Server Actions pour la Gestion des Articles (Admin)
// Ces actions vérifient les permissions admin et loggent toutes les actions

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "../server";
import { requireAdmin } from "../auth-utils-server";
import { logAuditEventServer } from "../audit-logs";

/**
 * Approuver un article (publier)
 * @param id - ID de l'article
 */
export async function approveArticle(id: string) {
  // Vérification admin avec le client serveur
  const supabase = await createServerClient();
  await requireAdmin(supabase);

  // Récupérer l'article avant modification pour le logging
  const { data: article, error: fetchError } = await supabase
    .from("articles")
    .select("id, title, author_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !article) {
    throw new Error(`Article non trouvé: ${fetchError?.message || "ID invalide"}`);
  }

  // Mettre à jour le statut
  const { error } = await supabase
    .from("articles")
    .update({ status: "published" })
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur lors de la publication: ${error.message}`);
  }

  // Logger l'action d'audit
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    await logAuditEventServer({
      action_type: "data_modification",
      user_id: currentUser?.id || null,
      user_email: currentUser?.email || undefined,
      resource_type: "article",
      resource_id: id,
      description: `Article approuvé et publié: "${article.title}"`,
      status: "success",
      metadata: {
        article_id: id,
        article_title: article.title,
        previous_status: article.status,
        new_status: "published",
        action: "approve",
      },
    });
  } catch (logError) {
    console.error("Erreur lors du logging d'audit:", logError);
    // Ne pas bloquer l'action si le logging échoue
  }

  // Invalider le cache
  revalidatePath("/admin/articles");
  revalidatePath("/admin/content");
  revalidatePath("/admin/moderation");
  revalidatePath("/");

  return { success: true };
}

/**
 * Rejeter un article
 * @param id - ID de l'article
 * @param rejectionReason - Motif du refus (optionnel)
 */
export async function rejectArticle(id: string, rejectionReason?: string) {
  // Vérification admin avec le client serveur
  const supabase = await createServerClient();
  await requireAdmin(supabase);

  // Récupérer l'article avant modification pour le logging
  const { data: article, error: fetchError } = await supabase
    .from("articles")
    .select("id, title, author_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !article) {
    throw new Error(`Article non trouvé: ${fetchError?.message || "ID invalide"}`);
  }

  // Mettre à jour le statut
  const { error } = await supabase
    .from("articles")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur lors du rejet: ${error.message}`);
  }

  // Logger l'action d'audit
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    await logAuditEventServer({
      action_type: "data_modification",
      user_id: currentUser?.id || null,
      user_email: currentUser?.email || undefined,
      resource_type: "article",
      resource_id: id,
      description: `Article rejeté: "${article.title}"${rejectionReason ? ` - Raison: ${rejectionReason}` : ""}`,
      status: "success",
      metadata: {
        article_id: id,
        article_title: article.title,
        previous_status: article.status,
        new_status: "rejected",
        rejection_reason: rejectionReason || null,
        action: "reject",
      },
    });
  } catch (logError) {
    console.error("Erreur lors du logging d'audit:", logError);
    // Ne pas bloquer l'action si le logging échoue
  }

  // Invalider le cache
  revalidatePath("/admin/articles");
  revalidatePath("/admin/content");
  revalidatePath("/admin/moderation");
  revalidatePath("/");

  return { success: true };
}

/**
 * Supprimer un article définitivement
 * @param id - ID de l'article
 */
export async function deleteArticle(id: string) {
  // Vérification admin avec le client serveur
  const supabase = await createServerClient();
  await requireAdmin(supabase);

  // Récupérer l'article avant suppression pour le logging
  const { data: article, error: fetchError } = await supabase
    .from("articles")
    .select("id, title, author_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !article) {
    throw new Error(`Article non trouvé: ${fetchError?.message || "ID invalide"}`);
  }

  // Supprimer l'article
  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur lors de la suppression: ${error.message}`);
  }

  // Logger l'action d'audit
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    await logAuditEventServer({
      action_type: "data_deletion",
      user_id: currentUser?.id || null,
      user_email: currentUser?.email || undefined,
      resource_type: "article",
      resource_id: id,
      description: `Article supprimé définitivement: "${article.title}"`,
      status: "success",
      metadata: {
        article_id: id,
        article_title: article.title,
        previous_status: article.status,
        action: "delete",
      },
    });
  } catch (logError) {
    console.error("Erreur lors du logging d'audit:", logError);
    // Ne pas bloquer l'action si le logging échoue
  }

  // Invalider le cache
  revalidatePath("/admin/articles");
  revalidatePath("/admin/content");
  revalidatePath("/admin/moderation");
  revalidatePath("/");

  return { success: true };
}

/**
 * Changer le statut d'un article (toggle published/draft)
 * @param id - ID de l'article
 * @param newStatus - Nouveau statut ('published' ou 'draft')
 */
export async function updateArticleStatus(id: string, newStatus: "published" | "draft") {
  // Vérification admin avec le client serveur
  const supabase = await createServerClient();
  await requireAdmin(supabase);

  // Récupérer l'article avant modification pour le logging
  const { data: article, error: fetchError } = await supabase
    .from("articles")
    .select("id, title, author_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !article) {
    throw new Error(`Article non trouvé: ${fetchError?.message || "ID invalide"}`);
  }

  // Mettre à jour le statut
  const { error } = await supabase
    .from("articles")
    .update({ status: newStatus })
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
  }

  // Logger l'action d'audit
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    await logAuditEventServer({
      action_type: "data_modification",
      user_id: currentUser?.id || null,
      user_email: currentUser?.email || undefined,
      resource_type: "article",
      resource_id: id,
      description: `Statut de l'article modifié: "${article.title}" (${article.status} → ${newStatus})`,
      status: "success",
      metadata: {
        article_id: id,
        article_title: article.title,
        previous_status: article.status,
        new_status: newStatus,
        action: "update_status",
      },
    });
  } catch (logError) {
    console.error("Erreur lors du logging d'audit:", logError);
    // Ne pas bloquer l'action si le logging échoue
  }

  // Invalider le cache
  revalidatePath("/admin/articles");
  revalidatePath("/admin/content");
  revalidatePath("/");

  return { success: true };
}

