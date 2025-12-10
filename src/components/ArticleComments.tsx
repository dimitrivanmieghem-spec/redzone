"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { getApprovedComments, createComment, CommentWithAuthor } from "@/lib/supabase/comments";
import Link from "next/link";

interface ArticleCommentsProps {
  articleId: string;
}

export default function ArticleComments({ articleId }: ArticleCommentsProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Charger les commentaires
  useEffect(() => {
    const loadComments = async () => {
      try {
        setIsLoading(true);
        const fetchedComments = await getApprovedComments(articleId);
        setComments(fetchedComments);
      } catch (error) {
        console.error("Erreur chargement commentaires:", error);
        showToast("Erreur lors du chargement des commentaires", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [articleId, showToast]);

  // Soumettre un nouveau commentaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast("Vous devez être connecté pour commenter", "error");
      return;
    }

    if (!newComment.trim()) {
      showToast("Le commentaire ne peut pas être vide", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      await createComment(articleId, user.id, newComment.trim());
      showToast("Commentaire soumis ! Il sera visible après modération.", "success");
      setNewComment("");

      // Recharger les commentaires
      const fetchedComments = await getApprovedComments(articleId);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Erreur soumission commentaire:", error);
      showToast(
        error instanceof Error ? error.message : "Erreur lors de la soumission du commentaire",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="border-t border-slate-200 pt-8">
        <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
          <MessageSquare size={28} className="text-red-600" />
          Commentaires ({comments.length})
        </h2>

        {/* Formulaire de commentaire */}
        {user ? (
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="bg-slate-50 rounded-2xl p-6">
              <label htmlFor="comment" className="block text-sm font-bold text-slate-900 mb-3">
                Votre commentaire
              </label>
              <textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                placeholder="Partagez vos pensées sur cet article..."
                className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent text-slate-900 resize-y mb-4"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  isSubmitting || !newComment.trim()
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 text-white hover:scale-105"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Publier
                  </>
                )}
              </button>
              <p className="text-xs text-slate-500 mt-2">
                ⚠️ Votre commentaire sera visible après modération par l&apos;équipe.
              </p>
            </div>
          </form>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-center">
            <p className="text-slate-700 mb-4">
              Connectez-vous pour laisser un commentaire
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
            >
              Se connecter
            </Link>
          </div>
        )}

        {/* Liste des commentaires */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={32} className="animate-spin text-red-600" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl">
            <MessageSquare size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Aucun commentaire pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <Image
                      src={
                        comment.author?.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          comment.author?.full_name || comment.author?.email?.split("@")[0] || "U"
                        )}&background=DC2626&color=fff&bold=true`
                      }
                      alt={comment.author?.full_name || "Utilisateur"}
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-slate-900">
                        {comment.author?.full_name || comment.author?.email?.split("@")[0] || "Utilisateur"}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {new Date(comment.created_at).toLocaleDateString("fr-BE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

