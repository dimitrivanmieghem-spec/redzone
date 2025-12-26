"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Loader2,
  Save,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getSiteSettings, type SiteSettings } from "@/lib/supabase/settings";
import { updateSiteSettings } from "@/lib/supabase/server-actions/settings";

export default function SettingsPage() {
  const { showToast } = useToast();
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

  useEffect(() => {
    const loadSettings = async () => {
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
    };
    loadSettings();
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateSiteSettings(formData);
      showToast("Réglages sauvegardés avec succès ✓", "success");
      const updatedSettings = await getSiteSettings();
      if (updatedSettings) {
        setSettings(updatedSettings);
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      showToast(error instanceof Error ? error.message : "Erreur lors de la sauvegarde", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.")) return;
    try {
      setIsSaving(true);
      await updateSiteSettings({
        banner_message: "Bienvenue sur Octane98",
        maintenance_mode: false,
        tva_rate: 21.00,
        site_name: "Octane98",
        site_description: "Le sanctuaire du moteur thermique",
        home_title: "Le Sanctuaire du Moteur Thermique",
      });
      showToast("Données réinitialisées ✓", "success");
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

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="bg-neutral-950 border-b border-white/10 px-8 py-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
          <Settings className="text-red-600" size={28} />
          Paramètres du Site
        </h2>
      </header>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <label className="block text-sm font-bold text-white mb-3">Message de la bannière</label>
            <input type="text" value={formData.banner_message} onChange={(e) => setFormData({ ...formData, banner_message: e.target.value })} placeholder="Bienvenue sur Octane98" className="w-full px-4 py-3 rounded-2xl border-2 border-neutral-700 bg-neutral-800 focus:border-red-600 focus:outline-none text-white placeholder:text-neutral-500" />
            <p className="text-xs text-slate-500 mt-2">Ce message s'affichera en haut du site (optionnel)</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Mode Maintenance</label>
                <p className="text-xs text-neutral-400">Activez pour bloquer l'accès au site (sauf admins)</p>
              </div>
              <button type="button" onClick={() => setFormData({ ...formData, maintenance_mode: !formData.maintenance_mode })} className={`relative w-16 h-8 rounded-full transition-colors duration-200 ${formData.maintenance_mode ? "bg-red-600" : "bg-slate-300"}`}>
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 shadow-lg ${formData.maintenance_mode ? "translate-x-8" : ""}`} />
              </button>
            </div>
          </div>

          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <label className="block text-sm font-bold text-white mb-3">Taux TVA (%)</label>
            <input type="number" min="0" max="100" step="0.01" value={formData.tva_rate} onChange={(e) => setFormData({ ...formData, tva_rate: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-3 rounded-2xl border-2 border-neutral-700 bg-neutral-800 focus:border-red-600 focus:outline-none text-white" />
            <p className="text-xs text-neutral-400 mt-2">Taux de TVA belge par défaut : 21%</p>
          </div>

          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <label className="block text-sm font-bold text-white mb-3">Nom du site</label>
            <input type="text" value={formData.site_name} onChange={(e) => setFormData({ ...formData, site_name: e.target.value })} placeholder="Octane98" className="w-full px-4 py-3 rounded-2xl border-2 border-neutral-700 bg-neutral-800 focus:border-red-600 focus:outline-none text-white placeholder:text-neutral-500" />
          </div>

          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <label className="block text-sm font-bold text-white mb-3">Description du site</label>
            <textarea value={formData.site_description} onChange={(e) => setFormData({ ...formData, site_description: e.target.value })} placeholder="Le sanctuaire du moteur thermique" rows={3} className="w-full px-4 py-3 rounded-2xl border-2 border-neutral-700 bg-neutral-800 focus:border-red-600 focus:outline-none text-white placeholder:text-neutral-500 resize-none" />
          </div>

          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <label className="block text-sm font-bold text-white mb-3">Titre de la page d'accueil</label>
            <input type="text" value={formData.home_title} onChange={(e) => setFormData({ ...formData, home_title: e.target.value })} placeholder="Le Sanctuaire du Moteur Thermique" className="w-full px-4 py-3 rounded-2xl border-2 border-neutral-700 bg-neutral-800 focus:border-red-600 focus:outline-none text-white placeholder:text-neutral-500" />
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <Save size={20} />
              {isSaving ? "Sauvegarde..." : "Enregistrer les réglages"}
            </button>
          </div>

          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-black text-white mb-2">Zone Danger</h3>
                <p className="text-sm text-neutral-300 mb-4">Réinitialiser toutes les données aux valeurs par défaut. Cette action est irréversible.</p>
                <button type="button" onClick={handleReset} disabled={isSaving} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  Réinitialiser les données
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

