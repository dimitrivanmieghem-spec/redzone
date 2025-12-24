"use client";

import { useEffect, useState } from "react";
import { Save, Image as ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { getSiteSettings, SiteSettings } from "@/lib/supabase/settings";
import { updateSiteSettings } from "@/lib/supabase/server-actions/settings";

export default function AdminContenuPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    home_title: "",
    home_subtitle: "",
    hero_image_url: "",
    banner_promo: "",
  });

  // Charger les réglages
  useEffect(() => {
    const loadSettings = async () => {
      if (user && user.role === "admin") {
        try {
          setIsLoading(true);
          const siteSettings = await getSiteSettings();
          if (siteSettings) {
            setSettings(siteSettings);
            setFormData({
              home_title: siteSettings.home_title || "",
              home_subtitle: siteSettings.site_description || "",
              hero_image_url: "",
              banner_promo: siteSettings.banner_message || "",
            });
          }
        } catch (error) {
          console.error("Erreur chargement réglages:", error);
          showToast("Erreur lors du chargement des réglages", "error");
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSettings();
  }, [user, showToast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user || user.role !== "admin") {
      showToast("Accès refusé", "error");
      return;
    }

    try {
      setIsSaving(true);
      await updateSiteSettings({
        home_title: formData.home_title,
        site_description: formData.home_subtitle,
        banner_message: formData.banner_promo,
      });
      showToast("Contenu sauvegardé avec succès ✓", "success");

      // Recharger les réglages
      const updatedSettings = await getSiteSettings();
      if (updatedSettings) {
        setSettings(updatedSettings);
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      showToast(
        error instanceof Error ? error.message : "Erreur lors de la sauvegarde",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
          <ImageIcon className="text-red-600" size={28} />
          Contenu du Site (Mini-CMS)
        </h2>
      </header>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          {/* Titre H1 Accueil */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <label className="block text-sm font-bold text-slate-900 mb-3">
              Titre H1 Accueil
            </label>
            <input
              type="text"
              value={formData.home_title}
              onChange={(e) =>
                setFormData({ ...formData, home_title: e.target.value })
              }
              placeholder="Ex: Le Sanctuaire du Moteur Thermique"
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
            />
            <p className="text-xs text-slate-500 mt-2">
              Titre principal affiché sur la page d&apos;accueil
            </p>
          </div>

          {/* Sous-titre */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <label className="block text-sm font-bold text-slate-900 mb-3">
              Sous-titre
            </label>
            <textarea
              value={formData.home_subtitle}
              onChange={(e) =>
                setFormData({ ...formData, home_subtitle: e.target.value })
              }
              placeholder="Ex: Découvrez une sélection unique de véhicules thermiques passionnants"
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900 resize-none"
            />
            <p className="text-xs text-slate-500 mt-2">
              Description ou sous-titre de la page d&apos;accueil
            </p>
          </div>

          {/* Lien Image Hero */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <label className="block text-sm font-bold text-slate-900 mb-3">
              Lien Image Hero
            </label>
            <input
              type="url"
              value={formData.hero_image_url}
              onChange={(e) =>
                setFormData({ ...formData, hero_image_url: e.target.value })
              }
              placeholder="https://exemple.com/image.jpg"
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
            />
            <p className="text-xs text-slate-500 mt-2">
              URL de l&apos;image hero (bannière principale) de la page d&apos;accueil
            </p>
          </div>

          {/* Annonce Bannière (Promo) */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <label className="block text-sm font-bold text-slate-900 mb-3">
              Annonce Bannière (Promo)
            </label>
            <textarea
              value={formData.banner_promo}
              onChange={(e) =>
                setFormData({ ...formData, banner_promo: e.target.value })
              }
              placeholder="Ex: Nouvelle collection disponible - Découvrez nos véhicules d'exception"
              rows={2}
              className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900 resize-none"
            />
            <p className="text-xs text-slate-500 mt-2">
              Message promotionnel affiché en bannière sur le site
            </p>
          </div>

          {/* Bouton Sauvegarder */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

