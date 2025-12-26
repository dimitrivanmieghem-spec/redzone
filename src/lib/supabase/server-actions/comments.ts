"use server";

// Octane98 - Server Actions pour les Commentaires (Admin)

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "../server";
import { requireAdmin } from "../auth-utils-server";

/**
 * Approuver un commentaire (admin uniquement)
 */
export async function approveComment(commentId: string): Promise<void> {
  // Vérification admin avec le client serveur
  const supabase = await createServerClient();
  await requireAdmin(supabase);
  
  const { error } = await supabase
    .from("comments")
    .update({ status: "approved" })
    .eq("id", commentId);

  if (error) {
    throw new Error(`Erreur approbation commentaire: ${error.message}`);
  }

  // Invalider le cache global
  revalidatePath('/', 'layout');
  revalidatePath("/admin/dashboard");
  revalidatePath("/tribune");
  revalidatePath("/recits");
}

/**
 * Rejeter un commentaire (admin uniquement)
 */
export async function rejectComment(commentId: string): Promise<void> {
  // Vérification admin avec le client serveur
  const supabase = await createServerClient();
  await requireAdmin(supabase);
  
  const { error } = await supabase
    .from("comments")
    .update({ status: "rejected" })
    .eq("id", commentId);

  if (error) {
    throw new Error(`Erreur rejet commentaire: ${error.message}`);
  }

  // Invalider le cache global
  revalidatePath('/', 'layout');
  revalidatePath("/admin/dashboard");
  revalidatePath("/tribune");
  revalidatePath("/recits");
}

