// RedZone - Actions Supabase pour les Articles (Blog)
// Note: Ce fichier est pour les Client Components
// Pour les Server Components, utilisez articles-server.ts

import { createClient } from "./client";

export interface Article {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  slug: string;
  content: string;
  main_image_url: string | null;
  author_id: string;
  status: "draft" | "pending" | "published" | "archived";
  post_type?: "question" | "presentation" | "article" | null;
}

/**
 * Récupérer tous les articles publiés (pour le public)
 * @returns Liste des articles publiés
 */
export async function getPublishedArticles(): Promise<Article[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erreur récupération articles: ${error.message}`);
  }

  return (data as Article[]) || [];
}

/**
 * Récupérer tous les articles (pour l'admin)
 * @returns Liste de tous les articles
 * Note: Utilise createClient car appelé depuis un Client Component
 */
export async function getAllArticles(): Promise<Article[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erreur récupération articles admin: ${error.message}`);
  }

  return (data as Article[]) || [];
}

