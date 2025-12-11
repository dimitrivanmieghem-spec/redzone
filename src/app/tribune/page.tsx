"use client";

import { useState, useEffect, Suspense } from "react";
import { MessageSquare, HelpCircle, Car, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/supabase/articles";
import PassionPostForm from "@/components/PassionPostForm";
import { useAuth } from "@/contexts/AuthContext";

type PostType = "all" | "question" | "presentation" | "article";

function TribuneContent() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<PostType>("all");
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Charger les articles
  useEffect(() => {
    const loadArticles = async () => {
      setIsLoading(true);
      try {
        const allArticles = await getPublishedArticles();
        setArticles(allArticles);
      } catch (error) {
        console.error("Erreur chargement articles:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadArticles();
  }, []);

  // Filtrer les articles selon le type
  const filteredArticles = articles.filter((article) => {
    if (activeFilter === "all") return true;
    return article.post_type === activeFilter;
  });

  return (
    <main className="min-h-0 sm:min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-6 sm:py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl mb-6 shadow-2xl shadow-red-600/40">
            <MessageSquare size={40} className="text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
            Tribune <span className="text-red-600">Passion</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-6">
            L&apos;espace communautaire RedZone. Questions, présentations et partages entre puristes.
          </p>
          {user && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
            >
              <Plus size={20} />
              {showForm ? "Annuler" : "Publier un Post"}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Formulaire UGC */}
        {showForm && (
          <div className="mb-12">
            <PassionPostForm />
          </div>
        )}

        {/* Filtres */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeFilter === "all"
                ? "bg-red-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Tout voir
          </button>
          <button
            onClick={() => setActiveFilter("question")}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeFilter === "question"
                ? "bg-red-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <HelpCircle size={20} />
            Questions
          </button>
          <button
            onClick={() => setActiveFilter("presentation")}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeFilter === "presentation"
                ? "bg-red-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Car size={20} />
            Présentations
          </button>
          <button
            onClick={() => setActiveFilter("article")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeFilter === "article"
                ? "bg-red-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Articles Éditoriaux
          </button>
        </div>

        {/* Liste des posts */}
        {isLoading ? (
          <div className="flex justify-center py-6 sm:py-20">
            <Loader2 size={48} className="animate-spin text-red-600" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-6 sm:py-20 bg-white rounded-3xl shadow-lg shadow-slate-100/50">
            <div className="text-6xl mb-4">
              {activeFilter === "question" ? "❓" : activeFilter === "presentation" ? "🚗" : "📖"}
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Aucun post pour le moment
            </h3>
            <p className="text-slate-600 mb-6">
              {activeFilter === "all"
                ? "Soyez le premier à publier dans la Tribune Passion !"
                : `Aucun ${activeFilter === "question" ? "question" : activeFilter === "presentation" ? "présentation" : "article"} pour le moment.`}
            </p>
            {user && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
              >
                <Plus size={20} />
                Publier le premier post
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={`/tribune/${article.slug}`}
                className="bg-white rounded-3xl shadow-xl shadow-slate-100/50 border-0 overflow-hidden hover:shadow-2xl transition-all hover:scale-105 group"
              >
                {/* Badge Type */}
                <div className="absolute top-4 right-4 z-10">
                  {article.post_type === "question" && (
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <HelpCircle size={14} />
                      Question
                    </span>
                  )}
                  {article.post_type === "presentation" && (
                    <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Car size={14} />
                      Présentation
                    </span>
                  )}
                  {article.post_type === "article" && (
                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Article
                    </span>
                  )}
                </div>

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
                    <MessageSquare size={48} className="text-white opacity-50" />
                  </div>
                )}

                {/* Contenu */}
                <div className="p-6">
                  <h2 className="text-xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-red-600 transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-sm text-slate-600 mb-4">
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

export default function TribunePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 size={48} className="animate-spin text-red-600" />
        </div>
      }
    >
      <TribuneContent />
    </Suspense>
  );
}

