"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Vehicule } from "@/lib/supabase/types";
import CarCard from "@/components/features/vehicles/car-card";
import type { UserRole } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  Globe,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Car,
  Sparkles,
  Calendar,
  Award,
  Crown,
  ArrowRight,
  Lock,
} from "lucide-react";

interface PremiumGarageProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  garage_name: string | null;
  garage_description: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  bio: string | null;
  speciality: string | null;
  founded_year: number | null;
  cover_image_url: string | null;
  is_verified: boolean | null;
  created_at: string;
}

export default function GaragePage() {
  const params = useParams();
  const userId = Array.isArray(params.userId) ? params.userId[0] : (params.userId as string);
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<PremiumGarageProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicule[]>([]);
  const [soldVehicles, setSoldVehicles] = useState<Vehicule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Vérifier si le visiteur est connecté (RGPD - protection des données sensibles)
  const isVisitorConnected = Boolean(user && !authLoading);

  useEffect(() => {
    const loadGarageData = async () => {
      if (!userId) return;

      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Récupérer le profil
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError || !profileData) {
          setError("Garage introuvable");
          setIsLoading(false);
          return;
        }

        // Vérifier que c'est un professionnel
        if (profileData.role !== "pro") {
          setError("Cette page est réservée aux garages professionnels");
          setIsLoading(false);
          return;
        }

        setProfile(profileData as PremiumGarageProfile);

        // Récupérer les véhicules actifs du garage (la table vehicles utilise owner_id)
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from("vehicles")
          .select("*")
          .eq("owner_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (vehiclesError) {
          console.error("Erreur récupération véhicules:", vehiclesError);
        }

        setVehicles((vehiclesData as Vehicule[]) || []);

        // Récupérer les véhicules "vendus" (rejected ou les plus anciens actifs pour l'exemple)
        // Note: Dans un vrai système, on aurait un statut 'sold' ou une table de ventes
        const { data: soldData } = await supabase
          .from("vehicles")
          .select("*")
          .eq("owner_id", userId) // La table vehicles utilise owner_id
          .eq("status", "rejected")
          .order("created_at", { ascending: false })
          .limit(6);

        setSoldVehicles((soldData as Vehicule[]) || []);
      } catch (err) {
        console.error("Erreur chargement garage:", err);
        setError("Erreur lors du chargement du garage");
      } finally {
        setIsLoading(false);
      }
    };

    loadGarageData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement du showroom...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="text-slate-400" size={40} />
          </div>
          <h1 className="text-2xl font-black text-white mb-4">Garage introuvable</h1>
          <p className="text-slate-400 mb-8">{error || "Ce garage n'existe pas ou n'est pas accessible"}</p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-full transition-all"
          >
            Retour aux annonces
          </Link>
        </div>
      </div>
    );
  }

  // RGPD : Construire l'adresse selon l'état de connexion du visiteur
  // Si non connecté : seulement ville + code postal (pas la rue)
  // Si connecté : adresse complète
  const getDisplayAddress = () => {
    if (isVisitorConnected) {
      // Visiteur connecté : adresse complète
      return [profile.address, profile.postal_code, profile.city]
        .filter(Boolean)
        .join(", ");
    } else {
      // Visiteur non connecté : seulement ville + code postal (RGPD)
      return [profile.postal_code, profile.city]
        .filter(Boolean)
        .join(", ");
    }
  };
  const displayAddress = getDisplayAddress();

  // Calculer l'année de création (depuis created_at ou founded_year)
  const memberSince = profile.founded_year || new Date(profile.created_at).getFullYear();
  const yearsActive = new Date().getFullYear() - memberSince;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Hero Header - Bannière Immersive */}
      <div className="relative h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden">
        {/* Image de couverture ou gradient */}
        {profile.cover_image_url ? (
          <div className="absolute inset-0">
            <Image
              src={profile.cover_image_url}
              alt={profile.garage_name || "Cover"}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/80 to-neutral-950" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900" />
        )}

        {/* Contenu Hero */}
        <div className="relative z-10 h-full flex flex-col justify-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
            <div className="flex flex-col md:flex-row items-end gap-8">
              {/* Logo Cerclé Or/Argent */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-amber-500/50 shadow-2xl ring-4 ring-amber-500/20 bg-gradient-to-br from-amber-500/20 to-amber-600/30">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.garage_name || "Logo"}
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/30 to-amber-600/40">
                        <Building2 className="text-amber-200" size={64} />
                      </div>
                    )}
                  </div>
                  {/* Badge Vérifié */}
                  {profile.is_verified && (
                    <div className="absolute -bottom-2 -right-2 bg-amber-500 rounded-full p-2 border-4 border-neutral-950 shadow-xl">
                      <CheckCircle className="text-neutral-950" size={20} />
                    </div>
                  )}
                </div>
              </div>

              {/* Informations Premium */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight">
                    {profile.garage_name || profile.full_name || "Garage"}
                  </h1>
                  {profile.is_verified && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-full backdrop-blur-sm">
                      <Crown className="text-amber-400" size={20} />
                      <span className="text-amber-300 text-sm font-bold uppercase tracking-wider">
                        Vérifié
                      </span>
                    </div>
                  )}
                </div>

                {/* Badges de Confiance */}
                <div className="flex flex-wrap items-center gap-4 mb-6 text-slate-300">
                  {memberSince && (
                    <div className="flex items-center gap-2">
                      <Calendar className="text-amber-500" size={18} />
                      <span className="text-sm font-medium">
                        Membre depuis {memberSince}
                        {yearsActive > 0 && ` • ${yearsActive} an${yearsActive > 1 ? "s" : ""} d'expérience`}
                      </span>
                    </div>
                  )}
                  {profile.speciality && (
                    <div className="flex items-center gap-2">
                      <Award className="text-amber-500" size={18} />
                      <span className="text-sm font-medium">Expertise : {profile.speciality}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                {(profile.garage_description || profile.bio) && (
                  <p className="text-slate-300 text-lg md:text-xl mb-8 leading-relaxed max-w-3xl">
                    {profile.garage_description || profile.bio}
                  </p>
                )}

                {/* CTA Premium */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* RGPD : Email - Affichage conditionnel selon connexion */}
                  {isVisitorConnected ? (
                    // Visiteur connecté : afficher le lien email normal
                    <a
                      href={`mailto:${profile.email}?subject=Demande de rendez-vous privé&body=Bonjour,%0D%0A%0D%0AJe souhaiterais solliciter un rendez-vous privé pour découvrir votre collection.`}
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-black px-8 py-4 rounded-full transition-all shadow-2xl shadow-amber-500/30 hover:scale-105"
                    >
                      <Sparkles size={20} />
                      <span>Solliciter un rendez-vous privé</span>
                      <ArrowRight size={18} />
                    </a>
                  ) : (
                    // Visiteur non connecté : bouton de connexion (RGPD - email non exposé)
                    <Link
                      href={`/login?redirect=/garage/${userId}`}
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-neutral-950 font-black px-8 py-4 rounded-full transition-all shadow-2xl shadow-amber-500/30 hover:scale-105"
                    >
                      <Lock size={20} />
                      <span>Connectez-vous pour voir les coordonnées</span>
                      <ArrowRight size={18} />
                    </Link>
                  )}

                  {/* Infos pratiques */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-amber-400 transition-colors"
                      >
                        <Globe size={16} />
                        <span>Site web</span>
                      </a>
                    )}
                    {/* RGPD : Adresse - Affichage conditionnel selon connexion */}
                    {displayAddress && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} />
                        <span>{displayAddress}</span>
                      </div>
                    )}
                    {/* RGPD : Téléphone - Affichage conditionnel selon connexion */}
                    {isVisitorConnected && profile.phone ? (
                      // Visiteur connecté : afficher le téléphone
                      <a
                        href={`tel:${profile.phone}`}
                        className="flex items-center gap-2 hover:text-amber-400 transition-colors"
                      >
                        <Phone size={16} />
                        <span>{profile.phone}</span>
                      </a>
                    ) : profile.phone ? (
                      // Visiteur non connecté : bouton de connexion (RGPD - téléphone non exposé)
                      <Link
                        href={`/login?redirect=/garage/${userId}`}
                        className="flex items-center gap-2 hover:text-amber-400 transition-colors"
                      >
                        <Lock size={16} />
                        <span>Connectez-vous pour voir les coordonnées</span>
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collection - Stock Actif */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-12 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full" />
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                La Collection
              </h2>
              <p className="text-slate-400 text-lg">
                {vehicles.length === 0
                  ? "Aucun véhicule en stock"
                  : vehicles.length === 1
                  ? "1 véhicule exclusif disponible"
                  : `${vehicles.length} véhicules exclusifs disponibles`}
              </p>
            </div>
          </div>
        </div>

        {/* État vide */}
        {vehicles.length === 0 ? (
          <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm rounded-3xl border border-white/10 p-12 md:p-16 text-center">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="text-slate-400" size={48} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
              Collection en préparation
            </h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Notre collection de pépites est en cours de constitution. Revenez bientôt pour découvrir nos prochaines arrivées.
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-full transition-all"
            >
              Explorer toutes les annonces
            </Link>
          </div>
        ) : (
          /* Grille de véhicules */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map((vehicle) => (
              <CarCard key={vehicle.id} vehicule={vehicle} />
            ))}
          </div>
        )}
      </div>

      {/* Section Vendus Récemment */}
      {soldVehicles.length > 0 && (
        <div className="bg-slate-900/30 border-t border-white/5 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-12 bg-gradient-to-b from-slate-600 to-slate-700 rounded-full opacity-50" />
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-400 mb-2 tracking-tight">
                    Vendus Récemment
                  </h2>
                  <p className="text-slate-500 text-base">
                    Découvrez les véhicules qui ont rejoint de nouvelles collections
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 opacity-60 grayscale-[30%]">
              {soldVehicles.map((vehicle) => (
                <div key={vehicle.id} className="relative">
                  <CarCard vehicule={vehicle} />
                  <div className="absolute inset-0 bg-slate-900/40 rounded-3xl pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
