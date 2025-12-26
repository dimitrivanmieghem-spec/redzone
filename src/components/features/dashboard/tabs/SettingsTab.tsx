"use client";

import { useState, useEffect } from "react";
import { FileText, Building2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { updateProfile, UpdateProfileData } from "@/app/actions/profile";
import { createClient } from "@/lib/supabase/client";

interface SettingsTabProps {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export default function SettingsTab({ user }: SettingsTabProps) {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileData>({
    firstName: "",
    lastName: "",
    bio: "",
    phone: "",
    garageName: "",
    logoUrl: "",
    website: "",
    address: "",
    city: "",
    postalCode: "",
    garageDescription: "",
  });

  useEffect(() => {
    const loadUserMetadata = async () => {
      if (!user) return;
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();

        let firstName = "";
        let lastName = "";
        if (authUser?.user_metadata?.firstName && authUser?.user_metadata?.lastName) {
          firstName = authUser.user_metadata.firstName;
          lastName = authUser.user_metadata.lastName;
        } else if (profile?.full_name) {
          const nameParts = profile.full_name.split(" ");
          firstName = nameParts[0] || "";
          lastName = nameParts.slice(1).join(" ") || "";
        }

        const metadata = authUser?.user_metadata || {};
        setFormData({
          firstName: metadata.firstName || firstName,
          lastName: metadata.lastName || lastName,
          bio: metadata.bio || "",
          phone: metadata.phone || "",
          garageName: metadata.garageName || "",
          logoUrl: metadata.logoUrl || profile?.avatar_url || "",
          website: metadata.website || "",
          address: metadata.address || "",
          city: metadata.city || "",
          postalCode: metadata.postalCode || "",
          garageDescription: metadata.garageDescription || "",
        });
      } catch (error) {
        console.error("Erreur chargement métadonnées:", error);
      }
    };
    loadUserMetadata();
  }, [user]);

  const isPro = user?.role === "pro";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile(formData);
      showToast("Profil mis à jour avec succès ✓", "success");
    } catch (error) {
      showToast("Erreur lors de la mise à jour", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-black text-white tracking-tight mb-2">
        Paramètres
      </h1>
      <p className="text-slate-400 mb-8">
        Gérez vos informations personnelles
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations personnelles */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 p-6">
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <FileText size={20} className="text-red-600" />
            Informations Personnelles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Prénom</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Nom</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white resize-y"
              />
            </div>
          </div>
        </div>

        {/* Informations professionnelles (PRO uniquement) */}
        {isPro && (
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 p-6">
            <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-red-600" />
              Informations Professionnelles
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Nom du Garage</label>
                <input
                  type="text"
                  name="garageName"
                  value={formData.garageName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Site Web</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Adresse</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white resize-y"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Ville</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Code Postal</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Description du Garage</label>
                <textarea
                  name="garageDescription"
                  value={formData.garageDescription}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white resize-y"
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all disabled:opacity-50"
        >
          {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </form>
    </div>
  );
}

