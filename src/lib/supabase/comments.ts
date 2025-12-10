// RedZone - Actions Supabase pour les Commentaires

import { createClient } from "./client";

export interface Comment {
  id: string;
  created_at: string;
  article_id: string;
  user_id: string;
  content: string;
  status: "pending" | "approved" | "rejected";
}

export interface CommentWithAuthor extends Comment {
  author?: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  article?: {
    id: string;
    title: string;
    slug: string;
  };
}

/**
 * Récupérer les commentaires approuvés d'un article (pour le public)
 * @param articleId - ID de l'article
 * @returns Liste des commentaires approuvés
 */
export async function getApprovedComments(articleId: string): Promise<CommentWithAuthor[]> {
  const supabase = createClient();

  // Récupérer les commentaires
  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("*")
    .eq("article_id", articleId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  if (commentsError) {
    throw new Error(`Erreur récupération commentaires: ${commentsError.message}`);
  }

  if (!comments || comments.length === 0) {
    return [];
  }

  // Récupérer les profils des utilisateurs
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url")
    .in("id", userIds);

  if (profilesError) {
    console.warn("Erreur récupération profils:", profilesError);
    // Continuer sans les profils si erreur
  }

  // Combiner les données
  const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

  return comments.map((comment) => ({
    ...comment,
    author: profilesMap.get(comment.user_id) ? {
      email: profilesMap.get(comment.user_id)!.email || "",
      full_name: profilesMap.get(comment.user_id)!.full_name,
      avatar_url: profilesMap.get(comment.user_id)!.avatar_url,
    } : undefined,
  })) as CommentWithAuthor[];
}

/**
 * Créer un nouveau commentaire (statut 'pending' par défaut)
 * @param articleId - ID de l'article
 * @param userId - ID de l'utilisateur
 * @param content - Contenu du commentaire
 * @returns ID du commentaire créé
 */
export async function createComment(
  articleId: string,
  userId: string,
  content: string
): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("comments")
    .insert({
      article_id: articleId,
      user_id: userId,
      content,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Erreur création commentaire: ${error.message}`);
  }

  return data.id;
}

/**
 * Récupérer tous les commentaires en attente (pour l'admin)
 * @returns Liste des commentaires en attente
 * Note: Utilise createClient car appelé depuis un Client Component
 */
export async function getPendingComments(): Promise<CommentWithAuthor[]> {
  const supabase = createClient();

  // Récupérer les commentaires
  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (commentsError) {
    throw new Error(`Erreur récupération commentaires en attente: ${commentsError.message}`);
  }

  if (!comments || comments.length === 0) {
    return [];
  }

  // Récupérer les profils et articles
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const articleIds = [...new Set(comments.map((c) => c.article_id))];

  const [profilesResult, articlesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .in("id", userIds),
    supabase
      .from("articles")
      .select("id, title, slug")
      .in("id", articleIds),
  ]);

  if (profilesResult.error) {
    console.warn("Erreur récupération profils:", profilesResult.error);
  }
  if (articlesResult.error) {
    console.warn("Erreur récupération articles:", articlesResult.error);
  }

  // Créer des maps pour un accès rapide
  const profilesMap = new Map((profilesResult.data || []).map((p) => [p.id, p]));
  const articlesMap = new Map((articlesResult.data || []).map((a) => [a.id, a]));

  // Combiner les données
  return comments.map((comment) => ({
    ...comment,
    author: profilesMap.get(comment.user_id) ? {
      email: profilesMap.get(comment.user_id)!.email || "",
      full_name: profilesMap.get(comment.user_id)!.full_name,
      avatar_url: profilesMap.get(comment.user_id)!.avatar_url,
    } : undefined,
    article: articlesMap.get(comment.article_id) ? {
      id: articlesMap.get(comment.article_id)!.id,
      title: articlesMap.get(comment.article_id)!.title,
      slug: articlesMap.get(comment.article_id)!.slug,
    } : undefined,
  })) as CommentWithAuthor[];
}

/**
 * Approuver un commentaire (admin uniquement)
 * @param commentId - ID du commentaire
 */
export async function approveComment(commentId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("comments")
    .update({ status: "approved" })
    .eq("id", commentId);

  if (error) {
    throw new Error(`Erreur approbation commentaire: ${error.message}`);
  }
}

/**
 * Rejeter un commentaire (admin uniquement)
 * @param commentId - ID du commentaire
 */
export async function rejectComment(commentId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("comments")
    .update({ status: "rejected" })
    .eq("id", commentId);

  if (error) {
    throw new Error(`Erreur rejet commentaire: ${error.message}`);
  }
}

