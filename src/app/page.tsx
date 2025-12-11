"use client";

import { Search, Car, HelpCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import CarCard from "@/components/CarCard";
import { useVehicules } from "@/hooks/useVehicules";
import { useModelData } from "@/hooks/useModelData";
import { VehicleType } from "@/lib/supabase/modelSpecs";
import { getSiteSettings } from "@/lib/supabase/settings";
import { getActiveFAQ } from "@/lib/supabase/faq";
import type { FAQItem } from "@/lib/supabase/faq";

export default function Home() {
  const router = useRouter();
  const typeVehicule: VehicleType = "car"; // Pour l'instant, uniquement voitures
  const [selectedMarque, setSelectedMarque] = useState<string>("");
  const [selectedModele, setSelectedModele] = useState<string>("");
  const [selectedBudget, setSelectedBudget] = useState<string>("");
  const [selectedCarburant, setSelectedCarburant] = useState<string>("");
  const [homeTitle, setHomeTitle] = useState<string>("Le sanctuaire du moteur thermique");
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);

  // Utiliser le hook robuste pour charger les marques et modèles
  const { brands: marques, loadingBrands: loadingMarques, refetchModels, models: modeles, loadingModels: loadingModeles } = useModelData({ type: typeVehicule });

  // Charger les modèles quand la marque change
  useEffect(() => {
    if (selectedMarque) {
      refetchModels(selectedMarque);
    }
  }, [selectedMarque, refetchModels]);

  // Options de budget prédéfinies
  const budgetOptions = [
    { value: "", label: "Budget Max" },
    { value: "10000", label: "Jusqu'à 10.000 €" },
    { value: "15000", label: "Jusqu'à 15.000 €" },
    { value: "20000", label: "Jusqu'à 20.000 €" },
    { value: "25000", label: "Jusqu'à 25.000 €" },
    { value: "30000", label: "Jusqu'à 30.000 €" },
    { value: "40000", label: "Jusqu'à 40.000 €" },
    { value: "50000", label: "Jusqu'à 50.000 €" },
  ];

  // Options de carburant (Thermiques uniquement - RedZone)
  const carburantOptions = [
    { value: "", label: "Tous les carburants" },
    { value: "essence", label: "Essence" },
    { value: "e85", label: "E85 (Éthanol)" },
    { value: "lpg", label: "LPG (GPL)" },
  ];

  // Récupérer les annonces actives depuis Supabase
  // Note: useVehicules filtre déjà par défaut sur status: "active"
  const { vehicules, isLoading, error } = useVehicules({ 
    status: "active", 
    type: "car" 
  });

  // Charger le titre dynamique et la FAQ
  useEffect(() => {
    const loadContent = async () => {
      try {
        const settings = await getSiteSettings();
        if (settings?.home_title) {
          setHomeTitle(settings.home_title);
        }
        const faq = await getActiveFAQ();
        setFaqItems(faq);
      } catch (error) {
        console.error("Erreur chargement contenu:", error);
      }
    };
    loadContent();
  }, []);

  // 6 dernières annonces (les plus récentes) pour la vitrine
  const dernieresAnnonces = useMemo(() => {
    if (!vehicules || !Array.isArray(vehicules)) return [];
    return [...vehicules]
      .filter(v => v && v.id && v.created_at) // Filtrer les véhicules invalides
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);
  }, [vehicules]);

  // Réinitialiser le modèle quand la marque change
  const handleMarqueChange = (marque: string) => {
    setSelectedMarque(marque);
    setSelectedModele("");
  };

  // Rediriger vers la page de recherche avec les paramètres
  const handleSearch = () => {
    const params = new URLSearchParams();

    // Toujours ajouter le type (car par défaut)
    params.set("type", typeVehicule);

    // Ajouter les filtres sélectionnés
    if (selectedMarque) params.set("marque", selectedMarque);
    if (selectedModele) params.set("modele", selectedModele);
    if (selectedBudget) params.set("prixMax", selectedBudget);
    if (selectedCarburant) params.set("carburants", selectedCarburant);

    const queryString = params.toString();
    const searchUrl = `/search?${queryString}`;

    router.push(searchUrl);
  };

  return (
    <main className="min-h-0 sm:min-h-screen bg-white text-slate-900 font-sans">
      {/* HERO SECTION - PASSION THERMIQUE */}
      <section className="py-6 sm:py-20 px-4 bg-gradient-to-b from-slate-900 via-slate-800 to-white text-center">
        <h1 className="text-5xl md:text-7xl font-black mb-6 text-white tracking-tight">
          La mécanique des <span className="text-red-600">puristes</span>.
        </h1>
        <p className="text-slate-300 mb-8 text-xl max-w-3xl mx-auto font-medium">
          Du Youngtimer au Supercar. Ici, seule la passion compte.
        </p>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto mb-6 sm:mb-12 flex items-center justify-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Car size={16} className="text-red-500" />
            Supercars
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Car size={16} className="text-red-500" />
            Youngtimers
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Car size={16} className="text-red-500" />
            GTI
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Car size={16} className="text-red-500" />
            Roadsters
          </span>
          <span>•</span>
          <span>Le graal des puristes</span>
        </p>

        {/* MOTEUR DE RECHERCHE */}
        <div className="max-w-5xl mx-auto bg-white p-4 rounded-2xl shadow-xl shadow-xl shadow-slate-100/50 border-0 grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-4">
          <select
            value={selectedMarque}
            onChange={(e) => handleMarqueChange(e.target.value)}
            className="p-4 border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
          >
            <option value="">Toutes les marques</option>
            {marques.map((marque) => (
              <option key={marque} value={marque}>
                {marque}
              </option>
            ))}
          </select>
          <select
            value={selectedModele}
            onChange={(e) => setSelectedModele(e.target.value)}
            disabled={!selectedMarque}
            className="p-4 border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Tous les modèles</option>
            {modeles.map((modele) => (
              <option key={modele} value={modele}>
                {modele}
              </option>
            ))}
          </select>
          <select
            value={selectedCarburant}
            onChange={(e) => setSelectedCarburant(e.target.value)}
            className="p-4 border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
          >
            {carburantOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={selectedBudget}
            onChange={(e) => setSelectedBudget(e.target.value)}
            className="p-4 border rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
          >
            {budgetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="bg-black text-white font-bold rounded-2xl p-4 hover:bg-slate-800 flex items-center justify-center gap-2 transition-all"
          >
            <Search size={20} /> Rechercher
          </button>
        </div>
      </section>

      {/* DERNIÈRES ANNONCES */}
      <section className="max-w-6xl mx-auto py-6 sm:py-16 px-4">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold flex items-center gap-2 tracking-tight">
            <Car className="text-red-600" /> Dernières Annonces
          </h3>
          <button
            onClick={() => router.push("/search")}
            className="text-sm text-slate-900 hover:text-slate-900 font-medium underline transition-colors"
          >
            Voir toutes les annonces →
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-100 rounded-3xl overflow-hidden animate-pulse">
                <div className="h-64 bg-slate-200" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 font-medium mb-4">Erreur de chargement des annonces</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-2xl transition-all"
            >
              Réessayer
            </button>
          </div>
        ) : dernieresAnnonces.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-600 font-medium">Aucune annonce disponible pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dernieresAnnonces.map((vehicule) => (
              <CarCard key={vehicule.id} car={vehicule} />
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <p className="text-slate-900 mb-4">
            Vous cherchez quelque chose de spécifique ?
          </p>
          <button
            onClick={() => router.push("/search")}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-2xl transition-all shadow-xl hover:shadow-md inline-flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Search size={20} />
            Recherche avancée
          </button>
        </div>
      </section>

      {/* SECTION FAQ */}
      {faqItems.length > 0 && (
        <section className="max-w-6xl mx-auto py-6 sm:py-16 px-4 bg-gradient-to-b from-white to-slate-50">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 flex items-center justify-center gap-3">
              <HelpCircle className="text-red-600" size={36} />
              Questions Fréquentes
            </h2>
            <p className="text-slate-600 text-lg">
              Tout ce que vous devez savoir sur RedZone
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {faqItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 border-2 border-slate-100 hover:border-red-200 transition-all hover:shadow-xl"
              >
                <h3 className="text-xl font-black text-slate-900 mb-3">
                  {item.question}
                </h3>
                <p className="text-slate-700 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
