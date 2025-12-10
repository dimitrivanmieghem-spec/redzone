"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/supabase/uploads";

export default function GaragePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    garageName: "",
    logoUrl: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    description: "",
  });

  // Charger les données existantes
  useEffect(() => {
    if (user && user.role === "pro") {
      // TODO: Charger les données du garage depuis Supabase si une table existe
      // Pour l'instant, on laisse vide
    }
  }, [user]);

  // Rediriger si non pro
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "pro")) {
      showToast("Accès réservé aux professionnels", "error");
      router.push("/dashboard");
    }
  }, [user, authLoading, router, showToast]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingLogo(true);
    try {
      const url = await uploadImage(file, user.id);
      setFormData((prev) => ({ ...prev, logoUrl: url }));
      showToast("Logo uploadé avec succès !", "success");
    } catch (error) {
      console.error("Erreur upload logo:", error);
      showToast("Erreur lors de l'upload du logo", "error");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== "pro") return;

    setIsLoading(true);
    try {
      // TODO: Sauvegarder les données dans une table Supabase dédiée (ex: garages)
      // Pour l'instant, on affiche juste un message
      showToast("Fonctionnalité en développement. Les données seront bientôt sauvegardées.", "info");
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
      showToast("Erreur lors de la sauvegarde", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-900">Chargement...</p>
        </div>
      </main>
    );
  }

  if (!user || user.role !== "pro") {
    return null;
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-red-600 mb-6 transition-colors font-medium"
          >
            <ArrowLeft size={20} />
            Retour au dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-600/30">
              <Building2 size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Mon Garage
              </h1>
              <p className="text-slate-700 text-lg mt-1">
                Personnalisez votre branding et vos informations de contact
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 p-8 md:p-12">
          {/* Logo */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-900 mb-4">
              Logo du Garage
            </label>
            <div className="flex items-center gap-6">
              {formData.logoUrl ? (
                <div className="relative">
                  <img
                    src={formData.logoUrl}
                    alt="Logo garage"
                    className="w-32 h-32 object-contain rounded-2xl border-2 border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logoUrl: "" }))}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300">
                  <Building2 size={48} className="text-slate-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all cursor-pointer"
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Upload...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      {formData.logoUrl ? "Changer le logo" : "Uploader un logo"}
                    </>
                  )}
                </label>
                <p className="text-xs text-slate-600 mt-2">
                  Format recommandé: PNG ou JPG, max 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Nom du Garage */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-900 mb-3">
              Nom du Garage *
            </label>
            <input
              type="text"
              value={formData.garageName}
              onChange={(e) => setFormData((prev) => ({ ...prev, garageName: e.target.value }))}
              placeholder="Ex: Garage Auto Premium"
              required
              className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 transition-all"
            />
          </div>

          {/* Adresse */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-900 mb-3">
              Adresse
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Rue, Numéro, Code postal, Ville"
              rows={3}
              className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 transition-all resize-y"
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Téléphone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+32 XXX XX XX XX"
                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="contact@garage.be"
                className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 transition-all"
              />
            </div>
          </div>

          {/* Site web */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-900 mb-3">
              Site Web
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
              placeholder="https://www.votre-garage.be"
              className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 transition-all"
            />
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-900 mb-3">
              Description du Garage
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Présentez votre garage, vos spécialités, vos services..."
              rows={5}
              className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/20 transition-all resize-y"
            />
          </div>

          {/* Bouton Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Building2 size={20} />
                Enregistrer les modifications
              </>
            )}
          </button>

          <p className="text-xs text-slate-500 text-center mt-4">
            ⚠️ Cette fonctionnalité est en développement. Les données seront bientôt sauvegardées de manière permanente.
          </p>
        </form>
      </div>
    </main>
  );
}

