import { BookOpen } from "lucide-react";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/supabase/articles";

export default async function RecitsPage() {
  const articles = await getPublishedArticles();

  return (
    <main className="min-h-0 sm:min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-neutral-950 via-red-950/20 to-neutral-950 text-white py-6 sm:py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl mb-6 shadow-2xl shadow-red-600/40">
            <BookOpen size={40} className="text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
            Récits de <span className="text-red-600">Puristes</span>
          </h1>
          <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
            Histoires, témoignages et passion automobile. La communauté Octane98 partage ses expériences.
          </p>
        </div>
      </div>

      {/* Liste des articles */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-12">
        {articles.length === 0 ? (
          <div className="text-center py-6 sm:py-20 bg-neutral-900/50 backdrop-blur-sm rounded-3xl shadow-lg shadow-black/50 border border-white/10">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-2xl font-black text-white mb-2">
              Aucun récit pour le moment
            </h3>
            <p className="text-neutral-400">
              Les premiers récits arriveront bientôt...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/recits/${article.slug}`}
                className="bg-neutral-900/50 backdrop-blur-sm rounded-3xl shadow-xl shadow-black/50 border border-white/10 overflow-hidden hover:shadow-2xl transition-all hover:scale-105 group"
              >
                {/* Image */}
                {article.main_image_url ? (
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={article.main_image_url}
                      alt={article.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                    <BookOpen size={48} className="text-white opacity-50" />
                  </div>
                )}

                {/* Contenu */}
                <div className="p-6">
                  <h2 className="text-xl font-black text-white mb-3 tracking-tight group-hover:text-red-500 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-sm text-neutral-400 mb-4">
                    {new Date(article.created_at).toLocaleDateString("fr-BE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                    <span>Lire la suite</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

