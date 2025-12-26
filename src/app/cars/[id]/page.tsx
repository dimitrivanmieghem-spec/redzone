import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle, Calendar, Gauge, Fuel, Zap, Settings, Shield, Timer, Wind, Cog, FileCheck, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Vehicule } from "@/lib/supabase/types";
import ContactZone from "@/components/features/vehicles/contact-zone";
import TaxCalculator from "@/components/TaxCalculator";
import AudioPlayer from "@/components/AudioPlayer";
import PriceGauge from "@/components/PriceGauge";
import TrustScore from "@/components/TrustScore";
import ImageGallery from "@/components/features/vehicles/image-gallery";
import CollapsibleSection from "@/components/features/vehicles/CollapsibleSection";
import ShareButtons from "@/components/features/vehicles/ShareButtons";
import { analyzePrice, getPriceAnalysisText } from "@/lib/priceUtils";
import { calculatePowerToWeightRatio, evaluatePowerToWeightRatio } from "@/lib/vehicleUtils";
import { formatEuroNorm, formatCarburant } from "@/lib/formatters";
import type { Metadata } from "next";

// Force dynamic rendering pour toujours avoir les données fraîches
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

function getEuroNormColor(normeEuro: string | null | undefined): string {
  if (!normeEuro) return "bg-neutral-800 text-neutral-300 border-neutral-700";
  const colors: Record<string, string> = {
    euro6d: "bg-green-600/20 text-green-400 border-green-600/50",
    euro6b: "bg-red-600/20 text-red-400 border-red-600/50",
    euro5: "bg-yellow-600/20 text-yellow-400 border-yellow-600/50",
    euro4: "bg-orange-600/20 text-orange-400 border-orange-600/50",
    euro3: "bg-red-600/20 text-red-400 border-red-600/50",
    euro2: "bg-red-700/20 text-red-300 border-red-700/50",
    euro1: "bg-red-800/20 text-red-200 border-red-800/50",
  };
  return colors[normeEuro.toLowerCase()] || "bg-neutral-800 text-neutral-300 border-neutral-700";
}

// Utilisation des formatters centralisés - fonctions locales supprimées

// Helper function pour convertir les valeurs numériques
function parseNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

// Génération des métadonnées SEO dynamiques
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  // Vérifier si l'utilisateur est admin ou moderator pour autoriser la prévisualisation
  let canViewInactiveVehicles = false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profile && (profile.role === "admin" || profile.role === "moderator")) {
        canViewInactiveVehicles = true;
      }
    }
  } catch (error) {
    // En cas d'erreur, on reste en mode visiteur (sécurité par défaut)
  }

  // Construire la requête avec ou sans filtre de status selon le rôle
  let query = supabase
    .from("vehicles")
    .select("*")
    .eq("id", id);

  if (!canViewInactiveVehicles) {
    query = query.eq("status", "active");
  }

  const { data: vehiculeRaw } = await query.single();

  if (!vehiculeRaw) {
    return {
      title: "Véhicule introuvable | Octane98",
      description: "Ce véhicule n'existe pas ou a été vendu.",
    };
  }

  // Utiliser directement les colonnes anglaises
  const vehicule = vehiculeRaw as any;
  const price = parseNumber(vehicule.price);
  const year = parseNumber(vehicule.year);
  const powerHp = parseNumber(vehicule.power_hp);

  // Format selon les spécifications : [Marque] [Modèle] - [Prix]€ | Octane98
  const prixFormatted = price ? price.toLocaleString("fr-BE") : 'N/A';
  const title = `${vehicule.brand || 'Véhicule'} ${vehicule.model || ''} - ${prixFormatted}€ | Octane98`;
  
  // Description selon les spécifications
  const description = `Découvrez cette ${vehicule.brand || 'Véhicule'} ${vehicule.model || ''} de ${year || 'N/A'}, ${powerHp || 'N/A'}ch. En vente sur Octane98, le sanctuaire du moteur thermique.`;
  
  // Image OpenGraph : première photo du véhicule (stockée sur Supabase)
  // Si images est un tableau, prendre la première, sinon utiliser image
  let imageUrl = "/og-default.jpg";
  if (vehicule.images && Array.isArray(vehicule.images) && vehicule.images.length > 0) {
    imageUrl = vehicule.images[0];
  } else if (vehicule.image) {
    imageUrl = vehicule.image;
  }
  
  // URL dynamique basée sur la variable d'environnement ou localhost en dev
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://octane98.be";
  const url = `${baseUrl}/cars/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Octane98",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${vehicule.marque} ${vehicule.modele}`,
        },
      ],
      locale: "fr_BE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function CarDetailPage({ params }: PageProps) {
  // Next.js 15 : await params
  const { id } = await params;
  
  const supabase = await createClient();

  // Vérifier si l'utilisateur est admin ou moderator pour autoriser la prévisualisation
  let canViewInactiveVehicles = false;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Récupérer le profil pour vérifier le rôle
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profile && (profile.role === "admin" || profile.role === "moderator")) {
        canViewInactiveVehicles = true;
      }
    }
  } catch (error) {
    // En cas d'erreur, on reste en mode visiteur (sécurité par défaut)
    console.warn("Erreur vérification rôle utilisateur:", error);
  }

  // Construire la requête avec ou sans filtre de status selon le rôle
  let query = supabase
    .from("vehicles")
    .select("*")
    .eq("id", id);

  // Si l'utilisateur n'est pas admin/moderator, filtrer uniquement les véhicules actifs
  if (!canViewInactiveVehicles) {
    query = query.eq("status", "active");
  }

  const { data: vehiculeRaw, error } = await query.single();

  // Si erreur ou pas de données, afficher 404
  if (error || !vehiculeRaw || !vehiculeRaw.id) {
    console.error('Server CarDetailPage: Véhicule introuvable', id, error);
    notFound();
  }

  // Utiliser directement les colonnes anglaises
  const vehicule = vehiculeRaw as any;
  const price = parseNumber(vehicule.price);
  const year = parseNumber(vehicule.year);
  const mileage = parseNumber(vehicule.mileage);
  const powerHp = parseNumber(vehicule.power_hp);

  // Vérifications de sécurité pour les champs obligatoires
  if (
    price === null || 
    isNaN(price) ||
    year === null || 
    isNaN(year) ||
    mileage === null || 
    isNaN(mileage)
  ) {
    console.error('Server CarDetailPage: Données incomplètes pour le véhicule', vehicule.id, {
      price: vehicule.price,
      year: vehicule.year,
      mileage: vehicule.mileage,
    });
    notFound();
  }

  // Récupérer tous les véhicules actifs pour l'analyse de prix (colonnes nécessaires uniquement pour optimiser)
  const { data: allVehiculesRaw } = await supabase
    .from("vehicles")
    .select("id, brand, model, price, year, mileage, fuel_type, transmission, body_type, power_hp, condition, euro_standard, engine_architecture, fiscal_horsepower, interior_color, seats_count, phone, city, postal_code, owner_id, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Utiliser directement les données en anglais (analyzePrice utilise déjà les colonnes anglaises)
  const allVehicules = (allVehiculesRaw || []).map(v => ({
    ...v,
    price: parseNumber(v.price) || 0,
    year: parseNumber(v.year) || 0,
    mileage: parseNumber(v.mileage) || 0,
    power_hp: parseNumber(v.power_hp) || 0,
  })) as Vehicule[];

  // Convertir le véhicule actuel pour l'analyse
  const vehiculeForAnalysis = {
    ...vehicule,
    price: price || 0,
  } as Vehicule;

  // Analyse de prix
  const priceAnalysis = vehiculeForAnalysis ? analyzePrice(vehiculeForAnalysis, allVehicules) : null;
  const priceAnalysisText = vehiculeForAnalysis && priceAnalysis 
    ? getPriceAnalysisText(priceAnalysis, vehiculeForAnalysis) 
    : "";

  // Préparer les images (images est un tableau ou null, image est une string)
  const images: string[] = vehicule.images && vehicule.images.length > 0 
    ? vehicule.images 
    : vehicule.image 
      ? [vehicule.image] 
      : ["https://via.placeholder.com/800x600?text=No+Image"];

  // URL pour le partage (sera utilisée côté client)
  const shareTitle = `${vehicule.brand || 'Véhicule'} ${vehicule.model || ''} - ${price ? price.toLocaleString("fr-BE") : 'N/A'}€`;
  const shareDescription = `Découvrez cette ${vehicule.brand || 'Véhicule'} ${vehicule.model || ''} de ${year || 'N/A'} sur Octane98`;

  // URL de base pour les liens absolus
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://octane98.be';
  const vehicleUrl = `${baseUrl}/cars/${id}`;

  // Données structurées JSON-LD (Schema.org) pour SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${vehicule.brand || 'Véhicule'} ${vehicule.model || ''}`,
    description: vehicule.description || shareDescription,
    image: images.length > 0 ? images : [vehicule.image || ''],
    brand: {
      '@type': 'Brand',
      name: vehicule.brand || 'Unknown',
    },
    category: vehicule.type === 'car' ? 'Automobile' : 'Motorcycle',
    offers: {
      '@type': 'Offer',
      price: price || 0,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: vehicleUrl,
      seller: {
        '@type': 'Organization',
        name: 'Octane98',
        url: baseUrl,
      },
    },
    // Propriétés spécifiques au véhicule (extension Car)
    vehicleIdentificationNumber: vehicule.vin || undefined,
    productionDate: year ? `${year}-01-01` : undefined,
    mileageFromOdometer: {
      '@type': 'QuantitativeValue',
      value: mileage || 0,
      unitCode: 'KMT', // Kilomètres
    },
    fuelType: vehicule.fuel_type === 'essence' 
      ? 'https://schema.org/Gasoline' 
      : vehicule.fuel_type === 'e85'
      ? 'https://schema.org/E85'
      : 'https://schema.org/LPG',
    numberOfDoors: vehicule.seats_count ? vehicule.seats_count.toString() : undefined,
    vehicleEngine: vehicule.engine_architecture ? {
      '@type': 'EngineSpecification',
      name: vehicule.engine_architecture,
    } : undefined,
    // Propriétés additionnelles
    ...(vehicule.power_hp && {
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Puissance',
          value: `${vehicule.power_hp} CH`,
        },
        ...(vehicule.co2 ? [{
          '@type': 'PropertyValue',
          name: 'Émissions CO2',
          value: `${vehicule.co2} g/km`,
        }] : []),
        ...(vehicule.transmission ? [{
          '@type': 'PropertyValue',
          name: 'Transmission',
          value: vehicule.transmission,
        }] : []),
      ],
    }),
  };

  return (
    <main className="min-h-screen bg-neutral-950">
      {/* Données structurées JSON-LD pour SEO (Schema.org) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Retour */}
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-slate-300 hover:text-red-500 mb-8 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          <span>Retour aux résultats</span>
        </Link>

        {/* Layout 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Colonne Gauche - Galerie BENTO (2 colonnes sur 3) */}
          <div className="lg:col-span-2">
            {/* Galerie Bento avec Lightbox */}
            <ImageGallery
              images={images}
              alt={`${vehicule.brand || 'Véhicule'} ${vehicule.model || ''}`}
            />

            {/* SPECS PASSION - Pour Puristes - Section Repliable */}
            <CollapsibleSection
              title="Fiche Technique"
              icon={<Cog className="text-red-600" size={32} />}
              defaultExpanded={true}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Architecture Moteur */}
                {vehicule.engine_architecture && (
                  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-red-600/50 transition-all hover:scale-[1.02] group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                        <Cog size={24} className="text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-red-600 uppercase mb-1">ARCHITECTURE</p>
                        <p className="text-2xl font-black text-white">{vehicule.engine_architecture}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admission */}
                {vehicule.admission && (
                  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-orange-600/50 transition-all hover:scale-[1.02] group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center group-hover:bg-orange-600/30 transition-colors">
                        <Wind size={24} className="text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-orange-600 uppercase mb-1">ADMISSION</p>
                        <p className="text-xl font-black text-white">{vehicule.admission}</p>
                        {vehicule.admission === "Atmosphérique" && (
                          <p className="text-xs text-green-400 font-bold mt-1">🏆 Le Graal</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 0-100 km/h */}
                {vehicule.zero_a_cent && (
                  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-yellow-600/50 transition-all hover:scale-[1.02] group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center group-hover:bg-yellow-600/30 transition-colors">
                        <Timer size={24} className="text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-yellow-600 uppercase mb-1">0-100 KM/H</p>
                        <p className="text-3xl font-black text-white">{vehicule.zero_a_cent}s</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Puissance */}
                {powerHp && (
                  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-red-600/50 transition-all hover:scale-[1.02] group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                        <Zap size={24} className="text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-red-600 uppercase mb-1">PUISSANCE</p>
                        <p className="text-3xl font-black text-white">
                          {powerHp} <span className="text-lg text-slate-300">CH</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transmission */}
                {vehicule.transmission && (
                  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-green-600/50 transition-all hover:scale-[1.02] group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center group-hover:bg-green-600/30 transition-colors">
                        <Settings size={24} className="text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-green-600 uppercase mb-1">BOÎTE</p>
                        <p className="text-xl font-black text-white capitalize">
                          {vehicule.transmission}
                        </p>
                        {vehicule.transmission === "manuelle" && (
                          <p className="text-xs text-green-400 font-bold mt-1">❤️ Puriste</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Kilométrage */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-neutral-700 transition-all hover:scale-[1.02] group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center group-hover:bg-neutral-700 transition-colors">
                      <Gauge size={24} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">KILOMÉTRAGE</p>
                      <p className="text-2xl font-black text-white">
                        {mileage ? mileage.toLocaleString("fr-BE") : 'N/A'} <span className="text-sm text-slate-400">km</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Année */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-neutral-700 transition-all hover:scale-[1.02] group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center group-hover:bg-neutral-700 transition-colors">
                      <Calendar size={24} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">ANNÉE</p>
                      <p className="text-2xl font-black text-white">{year || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Carburant */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-orange-600/50 transition-all hover:scale-[1.02] group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center group-hover:bg-orange-600/30 transition-colors">
                      <Fuel size={24} className="text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-orange-600 uppercase mb-1">CARBURANT</p>
                      <p className="text-xl font-black text-white capitalize">
                        {vehicule.fuel_type ? formatCarburant(vehicule.fuel_type) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Norme Euro */}
                <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-teal-600/50 transition-all hover:scale-[1.02] group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-teal-600/20 rounded-xl flex items-center justify-center group-hover:bg-teal-600/30 transition-colors">
                      <Shield size={24} className="text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-teal-600 uppercase mb-1">NORME EURO</p>
                      <p className="text-lg font-black text-white">
                        {formatEuroNorm(vehicule.euro_standard)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vitesse max */}
                {vehicule.top_speed && (
                  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-red-600/50 transition-all hover:scale-[1.02] group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                        <Gauge size={24} className="text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-red-600 uppercase mb-1">VITESSE MAX</p>
                        <p className="text-2xl font-black text-white">
                          {vehicule.top_speed} <span className="text-sm text-slate-300">km/h</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Transmission (RWD/FWD/AWD) */}
                {vehicule.drivetrain && (
                  <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl hover:border-red-600/50 transition-all hover:scale-[1.02] group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                        <Settings size={24} className="text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-red-600 uppercase mb-1">TRANSMISSION</p>
                        <p className="text-xl font-black text-white">
                          {vehicule.drivetrain}
                          {vehicule.drivetrain === "RWD" && <span className="text-xs text-red-400 ml-2">(Propulsion)</span>}
                          {vehicule.drivetrain === "FWD" && <span className="text-xs text-red-400 ml-2">(Traction)</span>}
                          {vehicule.drivetrain === "AWD" && <span className="text-xs text-red-400 ml-2">(4x4)</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* BADGES PURISTES */}
            {(vehicule.admission === "Atmosphérique" || vehicule.transmission === "manuelle" || vehicule.drivetrain === "RWD" || (year && (new Date().getFullYear() - year) >= 30)) && (
              <CollapsibleSection
                title="Badges Puristes"
                icon={<Shield className="text-red-600" size={28} />}
                defaultExpanded={true}
              >
                <div className="flex flex-wrap gap-3">
                  {vehicule.admission === "Atmosphérique" && (
                    <span className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 border border-red-600/50 px-4 py-2 rounded-full text-sm font-bold">
                      🏆 Atmosphérique
                    </span>
                  )}
                  {vehicule.transmission === "manuelle" && (
                    <span className="inline-flex items-center gap-2 bg-green-600/20 text-green-400 border border-green-600/50 px-4 py-2 rounded-full text-sm font-bold">
                      ❤️ Manuelle
                    </span>
                  )}
                  {vehicule.drivetrain === "RWD" && (
                    <span className="inline-flex items-center gap-2 bg-red-600/20 text-red-400 border border-red-600/50 px-4 py-2 rounded-full text-sm font-bold">
                      🏁 Propulsion
                    </span>
                  )}
                  {year && (new Date().getFullYear() - year) >= 30 && (
                    <span className="inline-flex items-center gap-2 bg-neutral-600/20 text-neutral-400 border border-neutral-600/50 px-4 py-2 rounded-full text-sm font-bold">
                      🏛️ Collection
                    </span>
                  )}
                </div>
              </CollapsibleSection>
            )}

            {/* HÉRITAGE SPORTIF */}
            {vehicule.racing_heritage && (
              <CollapsibleSection
                title="Héritage Sportif"
                icon={<Shield className="text-red-400" size={36} />}
                defaultExpanded={false}
              >
                <div className="p-6 bg-neutral-900 border border-red-600/30 rounded-3xl shadow-xl">
                  <p className="text-red-400 text-sm mb-3">Prestige & Performance</p>
                  <p className="text-slate-300 text-lg font-medium">{vehicule.racing_heritage}</p>
                </div>
              </CollapsibleSection>
            )}

            {/* MODIFICATIONS */}
            {vehicule.modifications && vehicule.modifications.length > 0 && (
              <CollapsibleSection
                title="Modifications"
                icon={<Settings className="text-orange-600" size={28} />}
                defaultExpanded={false}
              >
                <div className="p-6 bg-neutral-900 border border-orange-600/30 rounded-3xl shadow-xl">
                  <div className="flex flex-wrap gap-3">
                    {vehicule.modifications.map((mod: string) => (
                      <span
                        key={mod}
                        className="inline-flex items-center gap-2 bg-orange-600/20 text-orange-400 border border-orange-600/50 px-4 py-2 rounded-full text-sm font-bold"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* LECTEUR AUDIO - SONORITÉ MOTEUR */}
            {vehicule.audio_file && (
              <CollapsibleSection
                title="Sonorité Moteur"
                icon={<Zap className="text-yellow-600" size={28} />}
                defaultExpanded={false}
              >
                <AudioPlayer
                  audioSrc={vehicule.audio_file}
                  architecture={vehicule.engine_architecture || undefined}
                />
              </CollapsibleSection>
            )}

            {/* TRANSPARENCE & HISTORIQUE */}
            {vehicule.history && vehicule.history.length > 0 && (
              <CollapsibleSection
                title="Transparence & Historique"
                icon={<FileCheck className="text-green-400" size={36} />}
                defaultExpanded={false}
              >
                <div className="p-6 bg-neutral-900 border border-green-600/30 rounded-3xl shadow-xl">
                  <p className="text-green-400 text-sm mb-6">Documentation & garanties ✓</p>
                  <div className="flex flex-wrap gap-3">
                    {vehicule.history.map((item: string) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 bg-neutral-800 border border-green-600/30 px-5 py-3 rounded-full hover:border-green-600/50 hover:scale-105 transition-all"
                      >
                        <Shield className="text-green-400" size={20} />
                        <span className="text-white font-bold">{item}</span>
                        <CheckCircle className="text-green-400" size={18} />
                      </div>
                    ))}
                  </div>
                  <p className="text-green-400 text-sm mt-6 bg-green-600/10 border border-green-600/30 p-4 rounded-2xl">
                    ✅ <strong className="text-green-300">Confiance Octane98</strong> : Tous les documents sont vérifiables. Le vendeur s&apos;engage sur l&apos;authenticité de l&apos;historique.
                  </p>
                </div>
              </CollapsibleSection>
            )}

            {/* CAR-PASS - Lien de Vérification */}
            {vehicule.car_pass && vehicule.car_pass_url && (
              <CollapsibleSection
                title="Car-Pass Vérifié"
                icon={<Shield className="text-green-400" size={36} />}
                defaultExpanded={false}
              >
                <div className="p-6 bg-neutral-900 border border-green-600/50 rounded-3xl shadow-xl">
                  <p className="text-green-400 text-sm mb-6">Historique officiel disponible ✓</p>
                  <p className="text-slate-300 mb-6 leading-relaxed">
                    Le vendeur a fourni un lien Car-Pass officiel pour vérifier l&apos;historique du véhicule. 
                    Consultez le kilométrage réel et l&apos;historique des contrôles techniques.
                  </p>
                  <a
                    href={vehicule.car_pass_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl transition-all transform hover:scale-105"
                  >
                    <FileCheck size={24} />
                    <span>Vérifier l&apos;Historique Car-Pass</span>
                    <ExternalLink size={20} />
                  </a>
                  <p className="text-green-400 text-sm mt-4 bg-green-600/10 border border-green-600/30 p-3 rounded-xl">
                    🔒 <strong className="text-green-300">Sécurité</strong> : Le lien s&apos;ouvre dans un nouvel onglet pour que vous ne perdiez pas cette page.
                  </p>
                </div>
              </CollapsibleSection>
            )}

            {/* Description */}
            {vehicule.description && (
              <CollapsibleSection
                title="Description"
                defaultExpanded={true}
              >
                <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-3xl shadow-xl">
                  <p className="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap">
                    {vehicule.description}
                  </p>
                </div>
              </CollapsibleSection>
            )}
          </div>

          {/* Colonne Droite - Infos & Action STICKY */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Titre et Prix */}
              <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl shadow-xl">
                <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                  {vehicule.brand || 'Véhicule'} {vehicule.model || ''}
                </h1>

                {/* Prix */}
                <div className="mb-6">
                  <p className="text-5xl font-black text-red-600 tracking-tight">
                    {price ? price.toLocaleString("fr-BE") : 'N/A'} €
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {vehicule.car_pass && (
                    <span className="inline-flex items-center gap-2 bg-green-600/20 text-green-400 border border-green-600/50 px-4 py-2 rounded-full text-sm font-bold">
                      <CheckCircle size={18} />
                      Car-Pass
                    </span>
                  )}
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-bold border ${getEuroNormColor(
                      vehicule.euro_standard
                    )}`}
                  >
                    {formatEuroNorm(vehicule.euro_standard)}
                  </span>
                </div>

                {/* Localisation */}
                {(vehicule.city || vehicule.postal_code) && (
                  <div className="mb-6 pb-6 border-b border-neutral-800">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={18} className="text-slate-400" />
                      <span className="text-slate-300 font-medium text-sm">
                        {vehicule.postal_code && vehicule.city
                          ? `${vehicule.postal_code} ${vehicule.city}`
                          : vehicule.city || vehicule.postal_code}
                      </span>
                    </div>
                    {vehicule.postal_code && vehicule.city && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vehicule.postal_code)}+${encodeURIComponent(vehicule.city)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-500 text-sm font-medium underline transition-colors"
                      >
                        <MapPin size={14} />
                        Voir sur la carte
                      </a>
                    )}
                  </div>
                )}

                {/* Zone de Contact Dynamique */}
                <ContactZone
                  vehicleId={vehicule.id}
                  ownerId={vehicule.owner_id || ''}
                  marque={vehicule.brand || ''}
                  modele={vehicule.model || ''}
                  prix={price || 0}
                  telephone={vehicule.phone}
                  contactEmail={vehicule.contact_email}
                  contactMethods={vehicule.contact_methods}
                />
              </div>

              {/* Boutons de Partage Social */}
              <ShareButtons
                url={`https://octane98.be/cars/${id}`}
                title={shareTitle}
                description={shareDescription}
              />

              {/* Analyse de Prix Intelligente */}
              {priceAnalysis && (
                <PriceGauge
                  analysis={priceAnalysis}
                  currentPrice={price || 0}
                  analysisText={priceAnalysisText}
                />
              )}

              {/* Score de Confiance */}
              <TrustScore vehicule={vehiculeForAnalysis} />

              {/* Calculateur de Taxes */}
              <TaxCalculator
                puissanceKw={powerHp ? powerHp / 1.3596 : 0}
                puissanceCv={powerHp || 0}
                cvFiscaux={parseNumber(vehicule.fiscal_horsepower) || 0}
                co2={parseNumber(vehicule.co2) || 200}
                co2Wltp={parseNumber(vehicule.co2_wltp) || undefined}
                carburant={vehicule.fuel_type || 'essence'}
                annee={year || 0}
                firstRegistrationDate={vehicule.first_registration_date || undefined}
                isHybrid={vehicule.is_hybrid || false}
                isElectric={vehicule.is_electric || false}
              />

              {/* Info supplémentaire */}
              <div className="bg-neutral-900 border border-red-600/30 p-6 rounded-3xl shadow-xl">
                <p className="text-sm text-slate-300 leading-relaxed">
                  <span className="font-bold text-red-600">💡 Conseil :</span> Vérifiez toujours le Car-Pass et
                  demandez un historique complet avant l&apos;achat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
