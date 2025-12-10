"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, Save, AlertTriangle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { getSiteSettings, updateSiteSettings, SiteSettings } from "@/lib/supabase/settings";

export default function AdminSettingsPage() {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    banner_message: "",
    maintenance_mode: false,
    tva_rate: 21.00,
    site_name: "",
    site_description: "",
    home_title: "",
  });

  // Protection : Rediriger si non admin
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      showToast("Accès refusé - Administrateur uniquement", "error");
      router.push("/");
    }
  }, [user, isLoading, router, showToast]);

  // Charger les réglages
  useEffect(() => {
    const loadSettings = async () => {
      if (user && user.role === "admin") {
        try {
          setIsLoadingSettings(true);
          const siteSettings = await getSiteSettings();
          if (siteSettings) {
            setSettings(siteSettings);
            setFormData({
              banner_message: siteSettings.banner_message || "",
              maintenance_mode: siteSettings.maintenance_mode || false,
              tva_rate: siteSettings.tva_rate || 21.00,
              site_name: siteSettings.site_name || "",
              site_description: siteSettings.site_description || "",
              home_title: siteSettings.home_title || "Le Sanctuaire du Moteur Thermique",
            });
          }
        } catch (error) {
          console.error("Erreur chargement réglages:", error);
          showToast("Erreur lors du chargement des réglages", "error");
        } finally {
          setIsLoadingSettings(false);
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
      await updateSiteSettings(formData);
      showToast("Réglages sauvegardés avec succès ✓", "success");
      
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

  const handleReset = async () => {
    if (!confirm("Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.")) {
      return;
    }

    try {
      setIsSaving(true);
      await updateSiteSettings({
        banner_message: "Bienvenue sur RedZone",
        maintenance_mode: false,
        tva_rate: 21.00,
        site_name: "RedZone",
        site_description: "Le sanctuaire du moteur thermique",
        home_title: "Le Sanctuaire du Moteur Thermique",
      });
      showToast("Données réinitialisées ✓", "success");
      
      // Recharger les réglages
      const updatedSettings = await getSiteSettings();
      if (updatedSettings) {
        setSettings(updatedSettings);
        setFormData({
          banner_message: updatedSettings.banner_message || "",
          maintenance_mode: updatedSettings.maintenance_mode || false,
          tva_rate: updatedSettings.tva_rate || 21.00,
          site_name: updatedSettings.site_name || "",
          site_description: updatedSettings.site_description || "",
          home_title: updatedSettings.home_title || "Le Sanctuaire du Moteur Thermique",
        });
      }
    } catch (error) {
      console.error("Erreur réinitialisation:", error);
      showToast("Erreur lors de la réinitialisation", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Afficher un loader pendant la vérification
  if (isLoading || isLoadingSettings) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </main>
    );
  }

  // Si pas admin, ne rien afficher (redirection en cours)
  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-900 flex">
      {/* Sidebar (même que dashboard) */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <Link href="/admin/dashboard" className="flex items-center gap-3 mb-4 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium">Retour Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center">
              <Settings size={20} className="text-slate-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Réglages Site</h1>
              <p className="text-xs text-slate-400">Configuration</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 bg-white">
        <div className="max-w-4xl mx-auto p-8">
          <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">
            ⚙️ Réglages du Site
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Message de la bannière */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Message de la bannière
              </label>
              <input
                type="text"
                value={formData.banner_message}
                onChange={(e) => setFormData({ ...formData, banner_message: e.target.value })}
                placeholder="Bienvenue sur RedZone"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
              />
              <p className="text-xs text-slate-500 mt-2">
                Ce message s'affichera en haut du site (optionnel)
              </p>
            </div>

            {/* Mode maintenance */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Mode Maintenance
                  </label>
                  <p className="text-xs text-slate-500">
                    Activez pour bloquer l'accès au site (sauf admins)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, maintenance_mode: !formData.maintenance_mode })}
                  className={`relative w-16 h-8 rounded-full transition-colors duration-200 ${
                    formData.maintenance_mode ? "bg-red-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 shadow-lg ${
                      formData.maintenance_mode ? "translate-x-8" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Taux TVA */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Taux TVA (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.tva_rate}
                onChange={(e) => setFormData({ ...formData, tva_rate: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
              />
              <p className="text-xs text-slate-500 mt-2">
                Taux de TVA belge par défaut : 21%
              </p>
            </div>

            {/* Nom du site */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Nom du site
              </label>
              <input
                type="text"
                value={formData.site_name}
                onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                placeholder="RedZone"
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900"
              />
            </div>

            {/* Description du site */}
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Description du site
              </label>
              <textarea
                value={formData.site_description}
                onChange={(e) => setFormData({ ...formData, site_description: e.target.value })}
                placeholder="Le sanctuaire du moteur thermique"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-red-600 focus:outline-none text-slate-900 resize-none"
              />
            </div>

            {/* Boutons */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={20} />
                {isSaving ? "Sauvegarde..." : "Enregistrer les réglages"}
              </button>
            </div>

            {/* Zone Danger */}
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Zone Danger</h3>
                  <p className="text-sm text-slate-700 mb-4">
                    Réinitialiser toutes les données aux valeurs par défaut. Cette action est irréversible.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isSaving}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Réinitialiser les données
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
