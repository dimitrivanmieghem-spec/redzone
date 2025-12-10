import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, HelpCircle, Car, FileText } from "lucide-react";
import Link from "next/link";
import { getArticleBySlug } from "@/lib/supabase/articles-server";
import ArticleComments from "@/components/ArticleComments";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getPostTypeIcon(postType?: string | null) {
  switch (postType) {
    case "question":
      return <HelpCircle size={24} className="text-blue-600" />;
    case "presentation":
      return <Car size={24} className="text-green-600" />;
    default:
      return <FileText size={24} className="text-red-600" />;
  }
}

function getPostTypeLabel(postType?: string | null) {
  switch (postType) {
    case "question":
      return "Question / Aide";
    case "presentation":
      return "Présentation Véhicule";
    default:
      return "Article";
  }
}

export default async function TribunePostPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || article.status !== "published") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header avec image */}
      <div className="relative bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        {article.main_image_url ? (
          <div className="relative w-full h-96 overflow-hidden">
            <img
              src={article.main_image_url}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-red-600 to-red-700" />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/tribune"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors font-medium"
            >
              <ArrowLeft size={20} />
              Retour à la Tribune
            </Link>
            <div className="flex items-center gap-3 mb-4">
              {getPostTypeIcon(article.post_type)}
              <span className="text-sm font-bold text-white/80">
                {getPostTypeLabel(article.post_type)}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
              {article.title}
            </h1>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Calendar size={16} />
              <span>
                {new Date(article.created_at).toLocaleDateString("fr-BE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            <div
              className="text-slate-700 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br />") }}
            />
          </div>
        </div>

        {/* Commentaires */}
        <div className="mt-12">
          <ArticleComments articleId={article.id} />
        </div>
      </div>
    </main>
  );
}

