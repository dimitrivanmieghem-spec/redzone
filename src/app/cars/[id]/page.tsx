import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle, Calendar, Gauge, Fuel, Zap, Settings, Shield, Timer, Wind, Cog, FileCheck, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Vehicule } from "@/lib/supabase/types";
import ContactZone from "./ContactZone";
import TaxCalculator from "@/components/TaxCalculator";
import AudioPlayer from "@/components/AudioPlayer";
import PriceGauge from "@/components/PriceGauge";
import TrustScore from "@/components/TrustScore";
import ImageGallery from "./ImageGallery";
import { analyzePrice, getPriceAnalysisText } from "@/lib/priceUtils";
import { calculatePowerToWeightRatio, evaluatePowerToWeightRatio } from "@/lib/vehicleUtils";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

function getEuroNormColor(normeEuro: string): string {
  const colors: Record<string, string> = {
    euro6d: "bg-green-100/80 text-green-800 border-green-200",
    euro6b: "bg-blue-100/80 text-blue-800 border-blue-200",
    euro5: "bg-yellow-100/80 text-yellow-800 border-yellow-200",
    euro4: "bg-orange-100/80 text-orange-800 border-orange-200",
    euro3: "bg-red-100/80 text-red-800 border-red-200",
    euro2: "bg-red-200/80 text-red-900 border-red-300",
    euro1: "bg-red-300/80 text-red-950 border-red-400",
  };
  return colors[normeEuro.toLowerCase()] || "bg-slate-100/80 text-slate-800 border-slate-200";
}

function formatEuroNorm(normeEuro: string): string {
  return normeEuro.replace("euro", "Euro ").toUpperCase();
}

function formatCarburant(carburant: string): string {
  const carburantMap: Record<string, string> = {
    essence: "Essence",
    e85: "E85 (Ethanol)",
    lpg: "LPG",
  };
  return carburantMap[carburant] || carburant;
}

// Génération des métadonnées SEO dynamiques
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicule } = await supabase
    .from("vehicules")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!vehicule) {
    return {
      title: "Véhicule introuvable | RedZone",
      description: "Ce véhicule n'existe pas ou a été vendu.",
    };
  }

  // Format selon les spécifications : [Marque] [Modèle] - [Prix]€ | RedZone
  const prixFormatted = vehicule.prix ? vehicule.prix.toLocaleString("fr-BE") : 'N/A';
  const title = `${vehicule.marque || 'Véhicule'} ${vehicule.modele || ''} - ${prixFormatted}€ | RedZone`;
  
  // Description selon les spécifications
  const description = `Découvrez cette ${vehicule.marque || 'Véhicule'} ${vehicule.modele || ''} de ${vehicule.annee || 'N/A'}, ${vehicule.puissance || 'N/A'}ch. En vente sur RedZone, le sanctuaire du moteur thermique.`;
  
  // Image OpenGraph : première photo du véhicule (stockée sur Supabase)
  // Si images est un tableau, prendre la première, sinon utiliser image
  let imageUrl = "/og-default.jpg";
  if (vehicule.images && Array.isArray(vehicule.images) && vehicule.images.length > 0) {
    imageUrl = vehicule.images[0];
  } else if (vehicule.image) {
    imageUrl = vehicule.image;
  }
  
  // URL dynamique basée sur la variable d'environnement ou localhost en dev
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://redzone.be";
  const url = `${baseUrl}/cars/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "RedZone",
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

  // Récupérer le véhicule depuis Supabase
  const { data: vehicule, error } = await supabase
    .from("vehicules")
    .select("*")
    .eq("id", id)
    .eq("status", "active") // Seulement les véhicules actifs
    .single();

  // Si erreur ou pas de données, afficher 404
  if (error || !vehicule || !vehicule.id) {
    notFound();
  }

  // Vérifications de sécurité pour les champs obligatoires
  if (
    typeof vehicule.prix !== 'number' || 
    isNaN(vehicule.prix) ||
    typeof vehicule.annee !== 'number' || 
    isNaN(vehicule.annee) ||
    typeof vehicule.km !== 'number' || 
    isNaN(vehicule.km)
  ) {
    console.error('CarDetailPage: Données incomplètes pour le véhicule', vehicule.id);
    notFound();
  }

  // Récupérer tous les véhicules actifs pour l'analyse de prix
  const { data: allVehicules } = await supabase
    .from("vehicules")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Analyse de prix
  const priceAnalysis = vehicule ? analyzePrice(vehicule, (allVehicules as Vehicule[]) || []) : null;
  const priceAnalysisText = vehicule && priceAnalysis 
    ? getPriceAnalysisText(priceAnalysis, vehicule) 
    : "";

  // Préparer les images (images est un tableau ou null, image est une string)
  const images: string[] = vehicule.images && vehicule.images.length > 0 
    ? vehicule.images 
    : vehicule.image 
      ? [vehicule.image] 
      : ["https://via.placeholder.com/800x600?text=No+Image"];

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Retour */}
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 mb-8 transition-colors font-medium"
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
              alt={`${vehicule.marque} ${vehicule.modele}`}
            />

            {/* SPECS PASSION - Pour Puristes */}
            <div className="mt-12">
              <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight flex items-center gap-3">
                <Cog className="text-red-600" size={32} />
                Fiche Technique
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Architecture Moteur */}
                {vehicule.architecture_moteur && (
                  <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-red-200">
                    <Cog size={32} className="text-red-600 mb-3" />
                    <p className="text-xs font-bold text-red-700 uppercase mb-1">ARCHITECTURE</p>
                    <p className="text-2xl font-black text-slate-900">{vehicule.architecture_moteur}</p>
                  </div>
                )}

                {/* Admission */}
                {vehicule.admission && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-orange-200">
                    <Wind size={32} className="text-orange-600 mb-3" />
                    <p className="text-xs font-bold text-orange-700 uppercase mb-1">ADMISSION</p>
                    <p className="text-xl font-black text-slate-900">{vehicule.admission}</p>
                    {vehicule.admission === "Atmosphérique" && (
                      <p className="text-xs text-green-600 font-bold mt-1">🏆 Le Graal</p>
                    )}
                  </div>
                )}

                {/* 0-100 km/h */}
                {vehicule.zero_a_cent && (
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-yellow-200">
                    <Timer size={32} className="text-yellow-600 mb-3" />
                    <p className="text-xs font-bold text-yellow-700 uppercase mb-1">0-100 KM/H</p>
                    <p className="text-3xl font-black text-slate-900">{vehicule.zero_a_cent}s</p>
                  </div>
                )}

                {/* Puissance */}
                {vehicule.puissance && (
                  <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-red-200">
                    <Zap size={32} className="text-red-600 mb-3" />
                    <p className="text-xs font-bold text-red-700 uppercase mb-1">PUISSANCE</p>
                    <p className="text-3xl font-black text-slate-900">
                      {vehicule.puissance} <span className="text-lg">CH</span>
                    </p>
                  </div>
                )}

                {/* Transmission */}
                {vehicule.transmission && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-green-200">
                    <Settings size={32} className="text-green-600 mb-3" />
                    <p className="text-xs font-bold text-green-700 uppercase mb-1">BOÎTE</p>
                    <p className="text-xl font-black text-slate-900 capitalize">
                      {vehicule.transmission}
                    </p>
                    {vehicule.transmission === "manuelle" && (
                      <p className="text-xs text-green-600 font-bold mt-1">❤️ Puriste</p>
                    )}
                  </div>
                )}

                {/* Kilométrage */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Gauge size={28} className="text-slate-600 mb-3" />
                  <p className="text-xs font-bold text-slate-600 mb-1">KILOMÉTRAGE</p>
                  <p className="text-2xl font-black text-slate-900">
                    {vehicule.km.toLocaleString("fr-BE")} km
                  </p>
                </div>

                {/* Année */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Calendar size={28} className="text-slate-600 mb-3" />
                  <p className="text-xs font-bold text-slate-600 mb-1">ANNÉE</p>
                  <p className="text-2xl font-black text-slate-900">{vehicule.annee}</p>
                </div>

                {/* Carburant */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Fuel size={28} className="text-orange-600 mb-3" />
                  <p className="text-xs font-bold text-slate-600 mb-1">CARBURANT</p>
                  <p className="text-xl font-black text-slate-900 capitalize">
                    {formatCarburant(vehicule.carburant)}
                  </p>
                </div>

                {/* Norme Euro */}
                <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Shield size={28} className="text-teal-600 mb-3" />
                  <p className="text-xs font-bold text-slate-600 mb-1">NORME EURO</p>
                  <p className="text-lg font-black text-slate-900">
                    {formatEuroNorm(vehicule.norme_euro)}
                  </p>
                </div>
              </div>
            </div>

            {/* LECTEUR AUDIO - SONORITÉ MOTEUR */}
            {vehicule.audio_file && (
              <div className="mt-12">
                <AudioPlayer
                  audioSrc={vehicule.audio_file}
                  architecture={vehicule.architecture_moteur || undefined}
                />
              </div>
            )}

            {/* TRANSPARENCE & HISTORIQUE */}
            {vehicule.history && vehicule.history.length > 0 && (
              <div className="mt-12 p-8 bg-gradient-to-br from-green-50 to-green-100/50 rounded-3xl shadow-2xl border-2 border-green-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center">
                    <FileCheck className="text-white" size={36} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
                      Transparence & Historique
                    </h2>
                    <p className="text-green-700 text-sm">Documentation & garanties ✓</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {vehicule.history.map((item: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-white px-5 py-3 rounded-full shadow-lg border-2 border-green-300 hover:scale-105 transition-all"
                    >
                      <Shield className="text-green-600" size={20} />
                      <span className="text-slate-900 font-bold">{item}</span>
                      <CheckCircle className="text-green-600" size={18} />
                    </div>
                  ))}
                </div>
                <p className="text-green-700 text-xs mt-6 bg-white/70 p-4 rounded-2xl">
                  ✅ <strong>Confiance RedZone</strong> : Tous les documents sont vérifiables. Le vendeur s&apos;engage sur l&apos;authenticité de l&apos;historique.
                </p>
              </div>
            )}

            {/* CAR-PASS - Lien de Vérification */}
            {vehicule.car_pass && vehicule.car_pass_url && (
              <div className="mt-12 p-8 bg-gradient-to-br from-green-50 to-green-100/50 rounded-3xl shadow-2xl border-2 border-green-300">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center">
                    <Shield className="text-white" size={36} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
                      Car-Pass Vérifié
                    </h2>
                    <p className="text-green-700 text-sm">Historique officiel disponible ✓</p>
                  </div>
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed">
                  Le vendeur a fourni un lien Car-Pass officiel pour vérifier l&apos;historique du véhicule. 
                  Consultez le kilométrage réel et l&apos;historique des contrôles techniques.
                </p>
                <a
                  href={vehicule.car_pass_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  <FileCheck size={24} />
                  <span>Vérifier l&apos;Historique Car-Pass</span>
                  <ExternalLink size={20} />
                </a>
                <p className="text-green-700 text-xs mt-4 bg-white/70 p-3 rounded-xl">
                  🔒 <strong>Sécurité</strong> : Le lien s&apos;ouvre dans un nouvel onglet pour que vous ne perdiez pas cette page.
                </p>
              </div>
            )}

            {/* Description */}
            {vehicule.description && (
              <div className="mt-12 p-8 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-3xl shadow-xl">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">
                  Description
                </h2>
                <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
                  {vehicule.description}
                </p>
              </div>
            )}
          </div>

          {/* Colonne Droite - Infos & Action STICKY */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Titre et Prix */}
              <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-slate-300/50">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                  {vehicule.marque} {vehicule.modele}
                </h1>

                {/* Prix */}
                <div className="mb-6">
                  <p className="text-5xl font-black text-red-600 tracking-tight">
                    {vehicule.prix ? vehicule.prix.toLocaleString("fr-BE") : 'N/A'} €
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {vehicule.car_pass && (
                    <span className="inline-flex items-center gap-2 bg-green-100/80 text-green-800 px-4 py-2 rounded-full text-sm font-bold shadow-lg border border-green-200">
                      <CheckCircle size={18} />
                      Car-Pass
                    </span>
                  )}
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg border ${getEuroNormColor(
                      vehicule.norme_euro
                    )}`}
                  >
                    {formatEuroNorm(vehicule.norme_euro)}
                  </span>
                </div>

                {/* Localisation */}
                {(vehicule.ville || vehicule.code_postal) && (
                  <div className="mb-6 pb-6 border-b border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={18} className="text-slate-600" />
                      <span className="text-slate-700 font-medium text-sm">
                        {vehicule.code_postal && vehicule.ville
                          ? `${vehicule.code_postal} ${vehicule.ville}`
                          : vehicule.ville || vehicule.code_postal}
                      </span>
                    </div>
                    {vehicule.code_postal && vehicule.ville && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vehicule.code_postal)}+${encodeURIComponent(vehicule.ville)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium underline transition-colors"
                      >
                        <MapPin size={14} />
                        Voir sur la carte
                      </a>
                    )}
                  </div>
                )}

                {/* Zone de Contact Dynamique */}
                <ContactZone
                  marque={vehicule.marque}
                  modele={vehicule.modele}
                  prix={vehicule.prix}
                  telephone={vehicule.telephone}
                  contactEmail={vehicule.contact_email}
                  contactMethods={vehicule.contact_methods}
                />
              </div>

              {/* Analyse de Prix Intelligente */}
              {priceAnalysis && (
                <PriceGauge
                  analysis={priceAnalysis}
                  currentPrice={vehicule.prix}
                  analysisText={priceAnalysisText}
                />
              )}

              {/* Score de Confiance */}
              <TrustScore vehicule={vehicule} />

              {/* Calculateur de Taxes */}
              <TaxCalculator
                puissanceKw={vehicule.puissance ? vehicule.puissance / 1.3596 : 0}
                puissanceCv={vehicule.puissance || 0}
                cvFiscaux={vehicule.cv_fiscaux || 0}
                co2={vehicule.co2 || 200}
                carburant={vehicule.carburant}
                annee={vehicule.annee}
              />

              {/* Info supplémentaire */}
              <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-6 rounded-3xl shadow-lg">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <span className="font-bold">💡 Conseil :</span> Vérifiez toujours le Car-Pass et
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
