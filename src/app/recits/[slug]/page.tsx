import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { getArticleBySlug } from "@/lib/supabase/articles-server";
import ArticleComments from "@/components/ArticleComments";
import { sanitizeHTML } from "@/lib/validation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* Header avec image */}
      <div className="relative bg-gradient-to-b from-neutral-950 via-red-950/20 to-neutral-950 text-white">
        {article.main_image_url ? (
          <div className="relative w-full h-96 overflow-hidden">
            {/* Utiliser img standard pour les images externes non configurées */}
            <img
              src={article.main_image_url}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-96 bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-5xl font-black mb-4">{article.title}</h1>
            </div>
          </div>
        )}

        {/* Contenu du header */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/recits"
              className="inline-flex items-center gap-2 text-white/80 hover:text-red-500 mb-6 font-medium transition-colors"
            >
              <ArrowLeft size={20} />
              Retour aux récits
            </Link>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <span className="text-sm">
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
      </div>

      {/* Contenu de l'article */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg prose-slate max-w-none">
          <div className="bg-neutral-900/50 backdrop-blur-sm rounded-3xl shadow-xl border border-white/10 p-8 md:p-12">
            <div
              className="text-neutral-200 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(article.content.replace(/\n/g, "<br />")) }}
            />
          </div>
        </div>
      </article>

      {/* Section Commentaires */}
      <ArticleComments articleId={article.id} />

      {/* Footer de l'article */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <div className="border-t border-white/10 pt-8">
          <Link
            href="/recits"
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-bold transition-colors"
          >
            <ArrowLeft size={20} />
            Retour aux récits
          </Link>
        </div>
      </div>
    </main>
  );
}

