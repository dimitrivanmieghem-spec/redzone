// Octane98 - Actions Supabase pour les Articles (Server Components uniquement)

import { createClient } from "./server";
import { Article } from "./articles";

/**
 * Récupérer un article par son slug (pour le public - Server Component uniquement)
 * @param slug - Slug de l'article
 * @returns Article ou null
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    console.error("Erreur récupération article:", error);
    return null;
  }

  return data as Article;
}

