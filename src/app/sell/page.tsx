"use client";

import { ArrowLeft, Check, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBanSimulation } from "@/contexts/BanSimulationContext";
// useCookieConsent n'est plus utilisé dans ce fichier
import { VehicleType } from "@/lib/supabase/modelSpecs";
import { getBrands, getModels, getModelSpecs } from "@/lib/supabase/modelSpecs";
import { checkVehicleModeration } from "@/lib/moderationUtils";
// MediaManager gère maintenant les uploads directement
import { verifyEmailCode, storeVerificationCode } from "@/lib/supabase/vehicules";
import { saveVehicle } from "@/lib/supabase/server-actions/vehicules";
import { getVehiculeById } from "@/lib/supabase/vehicules";
import { logInfo, logError } from "@/lib/supabase/logs";
// Ces imports sont utilisés dans les composants enfants, pas dans ce fichier
import { generateVerificationCode, sendVerificationEmail, getVerificationCodeExpiry } from "@/lib/emailVerification";
import Step1Identity from "@/components/features/sell-form/Step1Identity";
import Step2Mechanic from "@/components/features/sell-form/Step2Mechanic";
import Step3Aesthetic from "@/components/features/sell-form/Step3Aesthetic";
// Step4Gallery est logiquement Step3Media (renommé pour clarté dans le code)
import Step3Media from "@/components/features/sell-form/Step3Media";
const Step4Gallery = Step3Media;
import Step4Finalize from "@/components/features/sell-form/Step4Finalize";
import SellFormNavigation from "@/components/features/sell-form/SellFormNavigation";
import StepperProgress from "@/components/features/sell-form/StepperProgress";
import { motion, AnimatePresence } from "framer-motion";

type Step = 1 | 2 | 3 | 4;

function SellPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { isSimulatingBan } = useBanSimulation();
  // useCookieConsent n'est plus utilisé dans ce fichier

  // Détecter l'ID du véhicule dans l'URL (mode édition)
  const vehiculeId = searchParams.get("id");
  const isEditMode = !!vehiculeId;

  // Combiner le ban réel et la simulation pour bloquer l'accès
  const isEffectivelyBanned = user?.is_banned || (isSimulatingBan && user?.role === "admin");
  const [isPending, startTransition] = useTransition();

  // Bloquer l'accès si l'utilisateur est banni OU en mode simulation
  useEffect(() => {
    if (isEffectivelyBanned) {
      const message = isSimulatingBan && user?.role === "admin"
        ? "Mode test actif : Publication d'annonces désactivée (simulation)"
        : "Votre compte est suspendu. Vous ne pouvez pas publier d'annonces.";
      showToast(message, "error");
      router.push("/dashboard");
    }
  }, [isEffectivelyBanned, isSimulatingBan, user?.role, router, showToast]);

  // Vérification du quota au chargement (uniquement pour les utilisateurs connectés et en mode création)
  useEffect(() => {
    let isMounted = true; // Flag pour éviter les mises à jour après démontage

    const checkQuota = async () => {
      // Ne vérifier que si :
      // - L'utilisateur est connecté
      // - Ce n'est PAS le mode édition (on peut toujours éditer)
      // - L'utilisateur n'est pas banni
      if (!user || isEditMode || isEffectivelyBanned) {
        if (isMounted) {
          setIsCheckingQuota(false);
          setCanCreateAdvert(true); // Autoriser l'édition ou les invités
        }
        return;
      }

      if (isMounted) {
        setIsCheckingQuota(true);
      }

      try {
        // Import dynamique avec gestion d'erreur explicite
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        // Appeler la fonction RPC can_create_advert
        const { data: canCreate, error: quotaError } = await supabase.rpc("can_create_advert", {
          user_id: user.id,
        });

        if (!isMounted) return; // Ne pas mettre à jour si le composant est démonté

        if (quotaError) {
          console.error("Erreur vérification quota:", quotaError);
          // En cas d'erreur, on autorise quand même (fail-open pour ne pas bloquer)
          setCanCreateAdvert(true);
          setIsCheckingQuota(false);
          return;
        }

        // Récupérer les infos de quota pour l'affichage
        const { data: quotaData, error: infoError } = await supabase.rpc("get_user_quota_info", {
          user_id: user.id,
        });

        if (!infoError && quotaData && quotaData.length > 0 && isMounted) {
          setQuotaInfo(quotaData[0]);
        }

        // ✅ FIX : Gérer explicitement undefined/null
        const canCreateValue = canCreate === true;
        if (isMounted) {
          setCanCreateAdvert(canCreateValue);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification du quota:", error);
        // En cas d'erreur, on autorise quand même (fail-open)
        if (isMounted) {
          setCanCreateAdvert(true);
          setIsCheckingQuota(false); // ✅ GARANTIR l'arrêt du spinner même en cas d'erreur
        }
      } finally {
        // ✅ GARANTIR l'arrêt du spinner dans tous les cas
        if (isMounted) {
          setIsCheckingQuota(false);
        }
      }
    };

    checkQuota();

    // Cleanup : marquer le composant comme démonté
    return () => {
      isMounted = false;
    };
  }, [user, isEditMode, isEffectivelyBanned]);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
  
  // État pour la vérification de quota
  const [isCheckingQuota, setIsCheckingQuota] = useState(true);
  const [canCreateAdvert, setCanCreateAdvert] = useState<boolean | null>(null);
  const [quotaInfo, setQuotaInfo] = useState<{
    current_count: number;
    max_limit: number;
    role: string;
    is_founder: boolean;
    remaining_slots: number;
  } | null>(null);
  
  // États pour la sécurité (CAPTCHA et vérification email)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [vehiculeIdForVerification, setVehiculeIdForVerification] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  
  // MediaManager gère maintenant les uploads directement, plus besoin de refs

  // Données du formulaire
  const [formData, setFormData] = useState({
    // Étape 1
    type: "" as VehicleType | "",
    marque: "",
    modele: "",
    modeleManuel: "", // Nom du modèle si "Autre" est sélectionné
    carburant: "",

    // Étape 2
    prix: "",
    annee: "",
    km: "",
    transmission: "",
    puissance: "", // Puissance en ch
    puissanceKw: "", // Puissance en kW (optionnel)
    cvFiscaux: "", // Chevaux fiscaux (pour taxe annuelle)
    co2: "", // Émissions CO2
    cylindree: "", // Cylindrée en cc
    moteur: "", // Architecture moteur (ex: "L6 Bi-Turbo")
    architectureMoteur: "",
    description: "", // Ajout description
    carrosserie: "", // Type de carrosserie
    couleurExterieure: "", // Couleur extérieure
    couleurInterieure: "", // Couleur intérieure
    nombrePlaces: "", // Nombre de places

    // Étape 3
    photos: [] as string[], // URLs après upload
    photoFiles: [] as File[], // Fichiers sélectionnés
    audioFile: null as File | null,
    audioUrl: null as string | null,
    carPassUrl: "", // Lien Car-Pass (URL)
    history: [] as string[],
    
    // Coordonnées de contact
    telephone: "", // Numéro de téléphone (format belge +32...)
    contactEmail: "", // Email de contact (par défaut email utilisateur)
    contactMethods: [] as string[], // Méthodes acceptées: 'whatsapp', 'email', 'tel'
    
    // Localisation
    ville: "", // Ville où se trouve le véhicule
    codePostal: "", // Code postal belge
    
    // Champs professionnels (si role === 'pro')
    tvaNumber: "", // Numéro de TVA
    garageName: "", // Nom du garage
    garageAddress: "", // Adresse du garage
    
    // Champs pour calcul taxes belges (optionnels, pré-remplis si disponibles)
    co2Wltp: "", // CO2 WLTP (pour Flandre) - Pré-rempli depuis la base si disponible
    drivetrain: "", // RWD/FWD/AWD/4WD - Pré-rempli depuis la base si disponible
    topSpeed: "", // Vitesse maximale en km/h - Pré-rempli depuis la base si disponible
    normeEuro: "", // Norme Euro - Modifiable (par défaut euro6d)
  });

  // Auto-modération "Le Videur"
  const moderationCheck = useMemo(() => {
    return checkVehicleModeration(
      formData.marque,
      formData.modele,
      formData.description
    );
  }, [formData.marque, formData.modele, formData.description]);

  // Le Videur V2 - Analyse de la Description uniquement
  const descriptionCheck = useMemo(() => {
    if (!formData.description) return { hasError: false, detectedWords: [] };

    const blacklist = ["diesel", "tdi", "dci", "hdi", "cdti", "utilitaire", "camionnette", "échange", "export"];
    const lowerDesc = formData.description.toLowerCase();
    const detected: string[] = [];

    for (const word of blacklist) {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      if (regex.test(lowerDesc)) {
        detected.push(word);
      }
    }

    return {
      hasError: detected.length > 0,
      detectedWords: detected,
    };
  }, [formData.description]);

  // État pour savoir si le CO2 doit être affiché (basé sur les specs)
  const [hasCo2Data, setHasCo2Data] = useState<boolean>(false);
  
  // État pour gérer les erreurs de validation par champ
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Listes dynamiques depuis Supabase
  const [marques, setMarques] = useState<string[]>([]);
  const [modeles, setModeles] = useState<string[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [errorBrands, setErrorBrands] = useState<string | null>(null);
  const [errorModels, setErrorModels] = useState<string | null>(null);

  // Charger les données du véhicule si on est en mode édition
  useEffect(() => {
    if (!isEditMode || !vehiculeId) return;

    const loadVehicleData = async () => {
      setIsLoadingVehicle(true);
      try {
        // Vérifier l'authentification avec getUser()
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          showToast("Vous devez être connecté pour modifier une annonce.", "error");
          router.push("/login?redirect=/sell?id=" + vehiculeId);
          return;
        }

        // Récupérer le véhicule
        const vehicule = await getVehiculeById(vehiculeId);

        if (!vehicule) {
          showToast("Annonce introuvable.", "error");
          router.push("/dashboard");
          return;
        }

        // Vérifier que l'utilisateur est propriétaire ou admin
        const isOwner = vehicule.owner_id === authUser.id;
        const isAdmin = user?.role === "admin";

        if (!isOwner && !isAdmin) {
          showToast("Vous n'avez pas l'autorisation de modifier cette annonce.", "error");
          router.push("/dashboard");
          return;
        }

        // Pré-remplir le formulaire avec les données du véhicule (convertir colonnes anglaises vers françaises pour le formulaire)
        setFormData({
          type: vehicule.type || "",
          marque: vehicule.brand || "",
          modele: vehicule.is_manual_model ? "__AUTRE__" : (vehicule.model || ""),
          modeleManuel: vehicule.is_manual_model ? vehicule.model : "",
          carburant: vehicule.fuel_type || "",
          prix: vehicule.price?.toString() || "",
          annee: vehicule.year?.toString() || "",
          km: vehicule.mileage?.toString() || "",
          transmission: vehicule.transmission || "",
          puissance: vehicule.power_hp?.toString() || "",
          puissanceKw: "", // Calculer si nécessaire
          cvFiscaux: vehicule.fiscal_horsepower?.toString() || "",
          co2: vehicule.co2?.toString() || "",
          cylindree: vehicule.displacement_cc?.toString() || "",
          moteur: vehicule.engine_architecture || "",
          architectureMoteur: vehicule.engine_architecture || "",
          description: vehicule.description || "",
          carrosserie: vehicule.body_type || "",
          couleurExterieure: "", // Pas dans le type actuel
          couleurInterieure: vehicule.interior_color || "",
          nombrePlaces: vehicule.seats_count?.toString() || "",
          photos: vehicule.images && Array.isArray(vehicule.images) ? vehicule.images : (vehicule.image ? [vehicule.image] : []),
          photoFiles: [],
          audioFile: null,
          audioUrl: vehicule.audio_file || null,
          carPassUrl: vehicule.car_pass_url || "",
          history: vehicule.history && Array.isArray(vehicule.history) ? vehicule.history : [],
          telephone: vehicule.phone || "",
          contactEmail: vehicule.contact_email || user?.email || "",
          contactMethods: vehicule.contact_methods && Array.isArray(vehicule.contact_methods) ? vehicule.contact_methods : [],
          ville: vehicule.city || "",
          codePostal: vehicule.postal_code || "",
          tvaNumber: "",
          garageName: "",
          garageAddress: "",
          // Champs optionnels (pré-remplis si disponibles)
          co2Wltp: vehicule.co2_wltp?.toString() || "",
          drivetrain: vehicule.drivetrain || "",
          topSpeed: vehicule.top_speed?.toString() || "",
          normeEuro: vehicule.euro_standard || "euro6d",
        });

        // Définir hasCo2Data si CO2 existe
        if (vehicule.co2 !== null && vehicule.co2 !== undefined) {
          setHasCo2Data(true);
        }

      } catch (error: any) {
        console.error("❌ [Sell] Erreur chargement véhicule:", error);
        showToast("Erreur lors du chargement de l'annonce. Veuillez réessayer.", "error");
        router.push("/dashboard");
      } finally {
        setIsLoadingVehicle(false);
      }
    };

    loadVehicleData();
  }, [isEditMode, vehiculeId, user, router, showToast]);

  // Charger les marques quand le type change (avec gestion d'erreur robuste)
  useEffect(() => {
    if (!formData.type) {
      setMarques([]);
      setErrorBrands(null);
      return;
    }
    
    // Vérifier que l'utilisateur n'est pas banni avant de charger
    if (isEffectivelyBanned) {
      setMarques([]);
      setErrorBrands(
        isSimulatingBan && user?.role === "admin"
          ? "Mode test actif : Publication d'annonces désactivée (simulation)"
          : "Votre compte est suspendu. Vous ne pouvez pas publier d'annonces."
      );
      return;
    }

    // Charger les marques avec le client Browser (plus rapide, indépendant de la session serveur)
    const loadBrands = async () => {
      try {
        // Vérifier l'authentification avec getUser() si l'utilisateur est connecté
        if (user) {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
          
          if (authError || !authUser) {
            console.warn("⚠️ [Sell] Utilisateur non authentifié, chargement marques en mode invité");
          }
        }

        setLoadingBrands(true);
        setErrorBrands(null);
        
        // Ajouter un timeout pour éviter les blocages
        const brandsPromise = getBrands(formData.type as VehicleType);
        const timeoutPromise = new Promise<string[]>((_, reject) => {
          setTimeout(() => reject(new Error("Timeout: Le chargement des marques prend trop de temps")), 12000);
        });
        
        // Utiliser getBrands qui utilise déjà le client browser avec timeout
        const brands = await Promise.race([brandsPromise, timeoutPromise]);
        
        if (brands.length === 0) {
          setErrorBrands("Impossible de charger les marques. Réessayez.");
          console.error("❌ [Sell] Aucune marque récupérée");
        } else {
          setMarques(brands);
          setErrorBrands(null);
        }
      } catch (error: any) {
        console.error('❌ [Sell] Erreur chargement marques:', error);
        const errorMessage = error?.message?.includes("Timeout") 
          ? "Le chargement prend trop de temps. Vérifiez votre connexion."
          : "Impossible de charger les marques. Réessayez.";
        setErrorBrands(errorMessage);
        setMarques([]);
        showToast(errorMessage, "error");
      } finally {
        setLoadingBrands(false);
      }
    };

    loadBrands();
  }, [formData.type, isEffectivelyBanned, user, showToast]);

  // Charger les modèles quand la marque change (avec gestion d'erreur robuste)
  useEffect(() => {
    if (!formData.marque || !formData.type) {
      setModeles([]);
      setErrorModels(null);
      return;
    }
    
    setLoadingModels(true);
    setErrorModels(null);
    
    // Ajouter un timeout pour éviter les blocages
    const modelsPromise = getModels(formData.type as VehicleType, formData.marque);
    const timeoutPromise = new Promise<string[]>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout: Le chargement des modèles prend trop de temps")), 12000);
    });
    
    Promise.race([modelsPromise, timeoutPromise])
      .then((models) => {
        if (models.length === 0) {
          setErrorModels("Aucun modèle trouvé pour cette marque");
        } else {
          setModeles(models);
          setErrorModels(null);
        }
      })
      .catch((error) => {
        console.error('❌ [Sell] Erreur chargement modèles:', error);
        const errorMessage = error?.message?.includes("Timeout")
          ? "Le chargement prend trop de temps. Vérifiez votre connexion."
          : "Impossible de charger les modèles. Réessayez.";
        setErrorModels(errorMessage);
        setModeles([]);
        showToast(errorMessage, "error");
      })
      .finally(() => {
        setLoadingModels(false);
      });
  }, [formData.type, formData.marque, showToast]);

  // Vérifier si le modèle est "Autre / Modèle non listé"
  const isManualModel = formData.modele === "__AUTRE__";

  // Pré-remplir l'email avec l'email de l'utilisateur
  useEffect(() => {
    if (user?.email && !formData.contactEmail) {
      setFormData(prev => ({ ...prev, contactEmail: user.email }));
    }
  }, [user?.email]);

  // Fonction helper pour extraire l'architecture de base depuis le moteur
  const extractArchitecture = (moteur: string): string => {
    if (!moteur) return "";
    const moteurUpper = moteur.toUpperCase();
    // Liste des architectures possibles (ordre important : les plus spécifiques en premier)
    const architectures = [
      "MOTEUR ROTATIF",
      "FLAT-6",
      "V12",
      "V10",
      "V8",
      "V6",
      "L6",
      "L5",
      "L4",
    ];
    for (const arch of architectures) {
      if (moteurUpper.includes(arch)) {
        return arch === "MOTEUR ROTATIF" ? "Moteur Rotatif" : arch;
      }
    }
    return "";
  };

  // Pré-remplissage automatique quand un modèle est sélectionné
  useEffect(() => {
    if (formData.type && formData.marque && formData.modele && !isManualModel) {
      // Ajouter un timeout pour éviter les blocages
      const specsPromise = getModelSpecs(formData.type as VehicleType, formData.marque, formData.modele);
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn('⚠️ [Sell] Timeout lors de la récupération des specs');
          resolve(null);
        }, 10000); // 10 secondes max
      });

      Promise.race([specsPromise, timeoutPromise])
        .then((specs) => {
          if (specs) {
            const extractedArch = extractArchitecture(specs.moteur || "");
            
            // Mettre à jour l'état hasCo2Data basé sur les specs
            const co2Exists = specs.co2 !== null && specs.co2 !== undefined;
            setHasCo2Data(co2Exists);
            
            setFormData((prev) => ({
              ...prev,
              // Pré-remplir TOUJOURS (même si les champs sont remplis) pour forcer la mise à jour
              // Cela garantit que les données sont toujours à jour quand on change de modèle
              puissance: specs.ch.toString(),
              puissanceKw: specs.kw.toString(),
              cvFiscaux: specs.cv_fiscaux.toString(),
              co2: specs.co2 ? specs.co2.toString() : "",
              cylindree: specs.cylindree.toString(),
              moteur: specs.moteur,
              architectureMoteur: extractedArch,
              transmission: specs.transmission.toLowerCase(),
              carrosserie: specs.default_carrosserie || prev.carrosserie || "",
              // Nouveaux champs pré-remplis si disponibles
              co2Wltp: specs.co2_wltp ? specs.co2_wltp.toString() : prev.co2Wltp || "",
              drivetrain: specs.drivetrain || prev.drivetrain || "",
              topSpeed: specs.top_speed ? specs.top_speed.toString() : prev.topSpeed || "",
              couleurExterieure: specs.default_color || prev.couleurExterieure || "",
              nombrePlaces: specs.default_seats ? specs.default_seats.toString() : prev.nombrePlaces || "",
            }));
            
            // Afficher un message de succès pour informer l'utilisateur
            showToast("Données constructeur pré-remplies automatiquement", "success");
          } else {
            // Si pas de specs, on cache le champ CO2
            setHasCo2Data(false);
            console.warn(`⚠️ [Sell] Aucune spec trouvée pour ${formData.marque} ${formData.modele}`);
          }
        })
        .catch((error) => {
          console.error('❌ [Sell] Erreur récupération specs:', error);
          // Ne pas afficher d'erreur à l'utilisateur car c'est optionnel
          // L'utilisateur peut toujours remplir manuellement
        });
    } else if (isManualModel) {
      // Si "Autre" est sélectionné, vider les champs techniques
      // Cacher le champ CO2 en mode manuel
      setHasCo2Data(false);
      setFormData((prev) => ({
        ...prev,
        puissance: "",
        puissanceKw: "",
        cvFiscaux: "",
        co2: "",
        cylindree: "",
        moteur: "",
        architectureMoteur: "",
        transmission: "",
        co2Wltp: "",
        drivetrain: "",
        topSpeed: "",
      }));
    }
  }, [formData.type, formData.marque, formData.modele, isManualModel, showToast]);

  // Constantes pour validation carburant (thermique uniquement)
  const VALID_CARBURANTS = ["essence", "e85", "lpg"] as const;
  const FORBIDDEN_CARBURANTS = ["electrique", "electric", "électrique", "ELECTRIQUE", "hybride", "diesel"];

  // Validation des étapes
  const isStep1Valid = useMemo(() => {
    // Validation stricte : Rejeter tout carburant non-thermique
    const carburant = formData.carburant?.toLowerCase() || "";
    const isValidCarburant = carburant && 
      !FORBIDDEN_CARBURANTS.includes(carburant) &&
      VALID_CARBURANTS.includes(carburant as typeof VALID_CARBURANTS[number]);
    
    return !!(
      formData.type &&
      formData.marque &&
      formData.modele &&
      (isManualModel ? formData.modeleManuel.trim() : true) &&
      isValidCarburant &&
      moderationCheck.isAllowed
    );
  }, [formData.type, formData.marque, formData.modele, formData.carburant, moderationCheck.isAllowed, isManualModel]);

  // Validation Étape 2 : Mécanique
  const isStep2Valid = useMemo(() => {
    const prixNum = parseFloat(formData.prix);
    const anneeNum = parseInt(formData.annee);
    const kmNum = parseInt(formData.km);
    const puissanceNum = parseInt(formData.puissance);
    const cvFiscauxNum = parseInt(formData.cvFiscaux);
    const co2Num = parseInt(formData.co2);
    const cylindreeNum = parseInt(formData.cylindree);

    return !!(
      formData.prix &&
      !isNaN(prixNum) &&
      prixNum > 0 &&
      formData.annee &&
      !isNaN(anneeNum) &&
      anneeNum >= 1950 &&
      anneeNum <= new Date().getFullYear() + 1 &&
      formData.km &&
      !isNaN(kmNum) &&
      kmNum >= 0 &&
      formData.transmission &&
      formData.puissance &&
      !isNaN(puissanceNum) &&
      puissanceNum > 0 &&
      formData.cvFiscaux &&
      !isNaN(cvFiscauxNum) &&
      cvFiscauxNum > 0 &&
      // CO2 est optionnel : seulement requis si hasCo2Data est true
      (!hasCo2Data || (formData.co2 && !isNaN(co2Num) && co2Num >= 0)) &&
      // Pour les modèles manuels, cylindrée et moteur sont obligatoires
      (!isManualModel || (formData.cylindree && !isNaN(cylindreeNum) && cylindreeNum > 0)) &&
      (!isManualModel || formData.moteur.trim())
    );
  }, [formData.prix, formData.annee, formData.km, formData.transmission, formData.puissance, formData.cvFiscaux, formData.co2, formData.cylindree, formData.moteur, isManualModel, hasCo2Data]);

  // Validation Étape 3 : Esthétique
  const isStep3Valid = useMemo(() => {
    return !!(
      formData.description.trim().length >= 20 && // Description min 20 caractères
      !descriptionCheck.hasError // Pas de mots interdits dans description
    );
  }, [formData.description, descriptionCheck.hasError]);

  // Validation étape 4 : Au moins une photo obligatoire + coordonnées
  const isStep4Valid = useMemo(() => {
    const hasPhotos = formData.photos.length > 0;
    // Email obligatoire si invité, sinon optionnel (utilisera user.email)
    const hasContactEmail = !!formData.contactEmail && formData.contactEmail.includes('@');
    const emailRequired = !user; // Email obligatoire pour les invités
    const hasContactMethods = formData.contactMethods.length > 0;
    const needsPhone = formData.contactMethods.includes('whatsapp') || formData.contactMethods.includes('tel');
    const hasPhone = needsPhone ? !!formData.telephone && formData.telephone.length >= 10 : true;
    const hasLocation = !!formData.ville && !!formData.codePostal && formData.codePostal.length === 4;
    
    return hasPhotos && (!emailRequired || hasContactEmail) && hasContactMethods && hasPhone && hasLocation;
  }, [formData.photos.length, formData.contactEmail, formData.contactMethods, formData.telephone, formData.ville, formData.codePostal, user]);

  // Navigation
  const handleNext = () => {
    if (currentStep === 1 && !isStep1Valid) {
      showToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }
    if (currentStep === 2 && !isStep2Valid) {
      showToast("Veuillez remplir tous les champs mécaniques correctement", "error");
      return;
    }
    if (currentStep === 3 && !isStep3Valid) {
      showToast("La description doit contenir au moins 20 caractères", "error");
      return;
    }
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStepClick = (step: number) => {
    // Permettre de revenir en arrière uniquement
    if (step < currentStep) {
      setCurrentStep(step as Step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Animation variants pour framer-motion
  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const stepTransition = {
    duration: 0.3,
    ease: [0.42, 0, 0.58, 1] as [number, number, number, number], // Courbe de Bézier équivalente à easeInOut
  };

  // Vérification du code email
  const handleVerifyCode = async () => {
    if (!vehiculeIdForVerification) {
      showToast("Erreur : ID véhicule manquant", "error");
      return;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      showToast("Veuillez entrer un code à 6 chiffres", "error");
      return;
    }

    setIsVerifyingCode(true);

    try {
      const isValid = await verifyEmailCode(vehiculeIdForVerification, verificationCode);

      if (isValid) {
        showToast("Email vérifié avec succès ! Votre annonce est en attente de validation.", "success");
        router.push("/sell/congrats");
      } else {
        showToast("Code incorrect. Veuillez réessayer.", "error");
        setVerificationCode("");
      }
    } catch (error: any) {
      console.error("Erreur vérification code:", error);
      showToast(error?.message || "Erreur lors de la vérification", "error");
      setVerificationCode("");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Soumission
  const handleSubmit = async () => {
    if (!moderationCheck.isAllowed) {
      showToast("⛔ Ce véhicule ne peut pas être publié sur Octane98", "error");
      return;
    }

    // Vérifier l'email pour les invités
    if (!user && (!formData.contactEmail || !formData.contactEmail.includes('@'))) {
      showToast("Veuillez renseigner un email de contact valide", "error");
      return;
    }

    // Vérification CAPTCHA pour les invités
    if (!user && !turnstileToken) {
      showToast("Veuillez compléter la vérification anti-robot", "error");
      return;
    }

    // Validation stricte : Rejeter tout carburant non-thermique
    const carburant = formData.carburant?.toLowerCase() || "";
    if (!carburant || FORBIDDEN_CARBURANTS.includes(carburant) || !VALID_CARBURANTS.includes(carburant as typeof VALID_CARBURANTS[number])) {
      showToast("⛔ Octane98 est dédié aux sportives thermiques uniquement. Les véhicules électriques, hybrides et diesel ne sont pas acceptés.", "error");
      return;
    }

    // Vérification stricte : Au moins une photo obligatoire
    if (formData.photos.length === 0) {
      showToast("Photo obligatoire ! Une annonce de sportive doit avoir au moins une photo pour être validée.", "error");
      return;
    }

    // Vérifier le mode simulation banni
    if (isEffectivelyBanned) {
      const message = isSimulatingBan && user?.role === "admin"
        ? "Mode test actif : Publication d'annonces désactivée (simulation)"
        : "Votre compte est suspendu. Vous ne pouvez pas publier d'annonces.";
      showToast(message, "error");
      return;
    }

    setIsSubmitting(true); // Début du chargement

    try {
      // Déterminer l'email de contact
      const contactEmail = formData.contactEmail || user?.email || null;
      if (!contactEmail) {
        throw new Error("Email de contact requis");
      }

      // Préparer les données du véhicule (colonnes anglaises)
      const vehiculeData = {
        type: formData.type as "car" | "moto",
        brand: formData.marque,
        model: isManualModel ? formData.modeleManuel : formData.modele,
        price: parseFloat(formData.prix),
        year: parseInt(formData.annee),
        mileage: parseInt(formData.km),
        fuel_type: formData.carburant as "essence" | "e85" | "lpg",
        transmission: formData.transmission as "manuelle" | "automatique" | "sequentielle",
        body_type: formData.carrosserie || (formData.type === "car" ? "Coupé" : "Sportive"),
        power_hp: parseInt(formData.puissance),
        condition: "Occasion" as "Neuf" | "Occasion",
        euro_standard: formData.normeEuro || "euro6d",
        car_pass: !!formData.carPassUrl, // true si URL fournie
        image: formData.photos[0] || "",
        images: formData.photos.length > 0 ? formData.photos : null,
        description: formData.description || null,
        engine_architecture: formData.moteur || formData.architectureMoteur || null,
        admission: null,
        interior_color: formData.couleurInterieure || null,
        seats_count: formData.nombrePlaces ? parseInt(formData.nombrePlaces) : null,
        zero_a_cent: null,
        co2: formData.co2 ? parseInt(formData.co2) : null,
        poids_kg: null,
        fiscal_horsepower: formData.cvFiscaux ? parseInt(formData.cvFiscaux) : null,
        car_pass_url: formData.carPassUrl || null,
        audio_file: formData.audioUrl || null,
        history: formData.history.length > 0 ? formData.history : null,
        is_manual_model: isManualModel, // Flag pour l'admin
        phone: formData.telephone || null,
        contact_email: contactEmail,
        contact_methods: formData.contactMethods.length > 0 ? formData.contactMethods : null,
        city: formData.ville || null,
        postal_code: formData.codePostal || null,
        // Champs pour taxes (optionnels, pré-remplis si disponibles)
        displacement_cc: formData.cylindree ? parseInt(formData.cylindree) : null,
        co2_wltp: formData.co2Wltp ? parseInt(formData.co2Wltp) : null,
        drivetrain: formData.drivetrain as "RWD" | "FWD" | "AWD" | "4WD" | null || null,
        top_speed: formData.topSpeed ? parseInt(formData.topSpeed) : null,
      };

      // Sauvegarder le véhicule (CREATE ou UPDATE selon le mode)
      const savedVehiculeId = await saveVehicle(
        isEditMode ? vehiculeId : null, // ID si édition, null si création
        vehiculeData,
        user?.id || null,
        user ? null : contactEmail // userId si connecté, sinon guestEmail
      );

      // Mettre à jour le profil utilisateur avec les données business (si Pro et champs remplis)
      if (user && user.role === "pro" && (formData.tvaNumber || formData.garageName || formData.garageAddress)) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          const supabase = createClient();

          const profileUpdate: {
            vat_number?: string;
            garage_name?: string;
            address?: string;
          } = {};

          // Ajouter uniquement les champs remplis
          if (formData.tvaNumber && formData.tvaNumber.trim()) {
            profileUpdate.vat_number = formData.tvaNumber.trim();
          }
          if (formData.garageName && formData.garageName.trim()) {
            profileUpdate.garage_name = formData.garageName.trim();
          }
          if (formData.garageAddress && formData.garageAddress.trim()) {
            profileUpdate.address = formData.garageAddress.trim();
          }

          // Mettre à jour le profil uniquement si au moins un champ est rempli
          if (Object.keys(profileUpdate).length > 0) {
            const { error: profileUpdateError } = await supabase
              .from("profiles")
              .update(profileUpdate)
              .eq("id", user.id);

            if (profileUpdateError) {
              console.error("Erreur mise à jour profil business:", profileUpdateError);
              // ✅ FIX : Afficher un toast d'avertissement (non-bloquant)
              showToast(
                "Votre annonce a été publiée, mais les informations professionnelles n'ont pas pu être sauvegardées. Veuillez les mettre à jour dans vos paramètres.",
                "info"
              );
            } else {
              // ✅ FIX : Confirmer la sauvegarde
              showToast("Informations professionnelles sauvegardées.", "success");
            }
          }
        } catch (profileError) {
          console.error("Erreur lors de la mise à jour du profil business:", profileError);
          // ✅ FIX : Afficher un toast d'avertissement
          showToast(
            "Votre annonce a été publiée, mais les informations professionnelles n'ont pas pu être sauvegardées.",
            "info"
          );
        }
      }

      // Log de succès (seulement si connecté) - Non bloquant
      if (user) {
        try {
          await logInfo(
            `Ad [${savedVehiculeId}] ${isEditMode ? "updated" : "submitted"} successfully by User [${user.id}]`,
            user.id,
            {
              vehicule_id: savedVehiculeId,
              marque: formData.marque,
              modele: isManualModel ? formData.modeleManuel : formData.modele,
              prix: parseFloat(formData.prix),
              is_manual_model: isManualModel,
              is_edit: isEditMode,
            }
          );
        } catch (logError) {
          // Ne pas bloquer la soumission si le log échoue
          console.warn("Erreur logging (non-bloquant):", logError);
        }
        
        // Utilisateur connecté : redirection selon le mode
        if (isEditMode) {
          showToast("Annonce modifiée avec succès !", "success");
          
          // Rafraîchir avant la redirection pour synchroniser
          startTransition(() => {
            router.refresh();
          });
          
          router.push("/dashboard");
        } else {
          showToast("Annonce publiée ! En attente de validation par l'admin.", "success");
          
          // Rafraîchir avant la redirection pour synchroniser
          startTransition(() => {
            router.refresh();
          });
          
          router.push("/sell/congrats");
        }
      } else {
        // Invité : générer et envoyer le code de vérification (uniquement en mode création)
        if (!isEditMode) {
          const code = generateVerificationCode();
          const expiresAt = getVerificationCodeExpiry();
          
          // Stocker le code hashé dans la base
          await storeVerificationCode(savedVehiculeId, code, expiresAt);
          
          // Envoyer l'email (simulation pour l'instant)
          await sendVerificationEmail(contactEmail, code, savedVehiculeId);
          
          // Log pour invité - Non bloquant
          try {
            await logInfo(
              `Ad [${savedVehiculeId}] submitted by Guest [${contactEmail}], waiting email verification`,
              undefined,
              {
                vehicule_id: savedVehiculeId,
                marque: formData.marque,
                modele: isManualModel ? formData.modeleManuel : formData.modele,
                prix: parseFloat(formData.prix),
                is_manual_model: isManualModel,
                guest_email: contactEmail,
              }
            );
          } catch (logError) {
            // Ne pas bloquer la soumission si le log échoue
            console.warn("Erreur logging (non-bloquant):", logError);
          }
          
          // Passer à l'étape 4 : vérification email
          setVehiculeIdForVerification(savedVehiculeId);
          setCurrentStep(4);
          showToast("Un email de vérification vous a été envoyé !", "success");
        } else {
          // Mode édition pour invité (ne devrait pas arriver normalement)
          showToast("Annonce modifiée avec succès !", "success");
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Erreur publication:", error);
      
      // Parser l'erreur pour identifier le champ concerné
      const errorMessage = error?.message || error?.error_description || "Erreur inconnue";
      const errors: Record<string, string> = {};
      
      // Détecter les erreurs de validation spécifiques
      if (errorMessage.includes("Car-Pass") || errorMessage.includes("car_pass_url")) {
        errors.carPassUrl = "L'URL Car-Pass n'est pas valide. Le format attendu est : http://... ou https://...";
      } else if (errorMessage.includes("email")) {
        errors.contactEmail = "L'email de contact n'est pas valide";
      } else if (errorMessage.includes("téléphone") || errorMessage.includes("telephone")) {
        errors.telephone = "Le numéro de téléphone doit être au format belge (+32XXXXXXXXX)";
      } else if (errorMessage.includes("marque")) {
        errors.marque = "La marque n'est pas valide";
      } else if (errorMessage.includes("modèle") || errorMessage.includes("modele")) {
        errors.modele = "Le modèle n'est pas valide";
      } else if (errorMessage.includes("prix")) {
        errors.prix = "Le prix n'est pas valide";
      } else if (errorMessage.includes("année") || errorMessage.includes("annee")) {
        errors.annee = "L'année n'est pas valide";
      } else if (errorMessage.includes("kilométrage") || errorMessage.includes("km")) {
        errors.km = "Le kilométrage n'est pas valide";
      } else if (errorMessage.includes("description")) {
        errors.description = "La description n'est pas valide";
      }
      
      // Si on a identifié des erreurs spécifiques, les afficher
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        
        // Scroll vers le premier champ en erreur
        const firstErrorField = Object.keys(errors)[0];
        setTimeout(() => {
          const element = document.querySelector(`[data-field="${firstErrorField}"]`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            // Focus sur l'input si possible
            const input = element.querySelector("input, textarea");
            if (input instanceof HTMLElement) {
              input.focus();
            }
          }
        }, 100);
      } else {
        // Erreur générique
        showToast(errorMessage, "error");
      }
      
      // Log de l'erreur (seulement si connecté) - Non bloquant
      if (user) {
        try {
          await logError(
            `Submission failed for User [${user.id}]: ${errorMessage}`,
            user.id,
            {
              error_message: errorMessage,
              error_code: error?.code || null,
              marque: formData.marque,
              modele: isManualModel ? formData.modeleManuel : formData.modele,
            }
          );
        } catch (logError) {
          // Ne pas bloquer l'affichage de l'erreur si le log échoue
          console.warn("Erreur logging (non-bloquant):", logError);
        }
      }

      showToast(
        error?.message || error?.error_description || "Erreur lors de la publication de l'annonce",
        "error"
      );
    } finally {
      // C'EST LA LIGNE LA PLUS IMPORTANTE :
      setIsSubmitting(false); // Arrête le spinner quoiqu'il arrive
    }
  };

  // Les uploads sont maintenant gérés directement par MediaManager dans Step3Media

  // Toggle Historique
  const toggleHistory = (item: string) => {
    const newHistory = formData.history.includes(item)
      ? formData.history.filter((h) => h !== item)
      : [...formData.history, item];
    setFormData({ ...formData, history: newHistory });
  };

  // Réinitialiser marque/modèle si type change
  const handleTypeChange = (type: VehicleType) => {
    setHasCo2Data(false); // Réinitialiser car on change de type
    setFormData({ ...formData, type, marque: "", modele: "" });
  };

  const handleMarqueChange = (marque: string) => {
    setHasCo2Data(false); // Réinitialiser car on change de marque
    setFormData({ ...formData, marque, modele: "" });
  };

  // Afficher la page de blocage si le quota est atteint (uniquement en mode création)
  if (!isEditMode && user && !isCheckingQuota && canCreateAdvert === false) {
    const limitText = quotaInfo?.max_limit === 999999 
      ? "illimitées" 
      : `${quotaInfo?.max_limit || 3} annonces`;
    
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-neutral-900 rounded-3xl border border-red-600/30 p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} className="text-red-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
            Limite d&apos;annonces atteinte
          </h1>
          <p className="text-lg text-neutral-300 mb-6">
            En tant que membre <strong className="text-white">{quotaInfo?.role === "pro" ? "Professionnel" : "Particulier"}</strong>, 
            vous êtes limité à <strong className="text-red-500">{limitText}</strong>.
          </p>
          <div className="bg-neutral-800/50 rounded-2xl p-6 mb-8">
            <p className="text-neutral-400 mb-4">
              Vous avez actuellement <strong className="text-white">{quotaInfo?.current_count || 0}</strong> annonce{quotaInfo?.current_count !== 1 ? "s" : ""} active{quotaInfo?.current_count !== 1 ? "s" : ""}.
            </p>
            {quotaInfo?.is_founder && (
              <p className="text-yellow-400 text-sm font-semibold mb-2">
                ✨ Vous êtes Membre Fondateur - Accès illimité activé
              </p>
            )}
          </div>
          <div className="space-y-4">
            <Link
              href="/dashboard"
              className="block w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all"
            >
              Retour au Dashboard
            </Link>
            <p className="text-sm text-neutral-500">
              Devenez <strong className="text-red-500">Pionnier</strong> ou <strong className="text-blue-500">Pro</strong> pour plus de liberté.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Afficher un loader pendant la vérification du quota
  if (!isEditMode && user && isCheckingQuota) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-red-600 mx-auto mb-4" size={48} />
          <p className="text-neutral-300">Vérification de votre quota...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 sm:min-h-screen bg-neutral-950 pb-24 md:pb-0">
      {/* Header */}
      <div className="bg-neutral-900/50 border-b border-white/10 shadow-md">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-300 hover:text-red-600 font-bold transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Retour
          </Link>
          <h1 className="text-4xl font-black text-white tracking-wide mb-2">
            {isEditMode ? "Éditer la fiche technique" : "Confier un véhicule"}
          </h1>
          <p className="text-neutral-300 text-lg font-light tracking-wide">
            {isEditMode 
              ? "Mettez à jour les informations de votre véhicule" 
              : "Ajoutez votre véhicule au Showroom Octane98 • Visibilité premium • Commission 0%"}
          </p>
        </div>
      </div>

      {/* Barre de Progression Améliorée */}
      <StepperProgress
        currentStep={currentStep}
        onStepClick={handleStepClick}
        steps={[
          { number: 1, label: "Identité", shortLabel: "Identité" },
          { number: 2, label: "Mécanique", shortLabel: "Mécanique" },
          { number: 3, label: "Esthétique", shortLabel: "Esthétique" },
          { number: 4, label: "Galerie & Prix", shortLabel: "Galerie" },
        ]}
      />

      {/* Contenu du Wizard avec Animations */}
      <div className="max-w-4xl mx-auto px-6 py-6 sm:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={stepVariants}
            transition={stepTransition}
            className="bg-neutral-900/50 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/50 border border-white/10 p-8 md:p-12"
          >
            {/* ÉTAPE 1 : L'Identité */}
            {currentStep === 1 && (
              <Step1Identity
                formData={{
                  type: formData.type,
                  marque: formData.marque,
                  modele: formData.modele,
                  modeleManuel: formData.modeleManuel,
                  carburant: formData.carburant,
                }}
                onUpdate={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
                onTypeChange={handleTypeChange}
                onMarqueChange={handleMarqueChange}
                marques={marques}
                modeles={modeles}
                loadingBrands={loadingBrands}
                loadingModels={loadingModels}
                errorBrands={errorBrands}
                errorModels={errorModels}
                isManualModel={isManualModel}
                moderationCheck={moderationCheck}
                isEffectivelyBanned={isEffectivelyBanned}
              />
            )}

            {/* ÉTAPE 2 : Mécanique */}
            {currentStep === 2 && (
              <Step2Mechanic
                formData={{
                  prix: formData.prix,
                  annee: formData.annee,
                  km: formData.km,
                  transmission: formData.transmission,
                  puissance: formData.puissance,
                  cvFiscaux: formData.cvFiscaux,
                  co2: formData.co2,
                  cylindree: formData.cylindree,
                  moteur: formData.moteur,
                  architectureMoteur: formData.architectureMoteur,
                  co2Wltp: formData.co2Wltp,
                  drivetrain: formData.drivetrain,
                  topSpeed: formData.topSpeed,
                  normeEuro: formData.normeEuro,
                }}
                onUpdate={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
                isManualModel={isManualModel}
                hasCo2Data={hasCo2Data}
              />
            )}

            {/* ÉTAPE 3 : Esthétique */}
            {currentStep === 3 && (
              <Step3Aesthetic
                formData={{
                  carrosserie: formData.carrosserie,
                  couleurExterieure: formData.couleurExterieure,
                  couleurInterieure: formData.couleurInterieure,
                  nombrePlaces: formData.nombrePlaces,
                  description: formData.description,
                }}
                onUpdate={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
                descriptionCheck={descriptionCheck}
              />
            )}

            {/* ÉTAPE 4 : Galerie & Prix */}
            {currentStep === 4 && (
              <>
                {vehiculeIdForVerification ? (
                  <Step4Finalize
                    contactEmail={formData.contactEmail}
                    verificationCode={verificationCode}
                    onVerificationCodeChange={setVerificationCode}
                    onVerify={handleVerifyCode}
                    isVerifying={isVerifyingCode}
                  />
                ) : (
                  <Step4Gallery
                    formData={{
                      marque: formData.marque,
                      modele: formData.modele,
                      prix: formData.prix,
                      annee: formData.annee,
                      km: formData.km,
                      puissance: formData.puissance,
                      description: formData.description,
                      photos: formData.photos,
                      audioUrl: formData.audioUrl,
                      carPassUrl: formData.carPassUrl,
                      codePostal: formData.codePostal,
                      ville: formData.ville,
                      contactEmail: formData.contactEmail,
                      telephone: formData.telephone,
                      contactMethods: formData.contactMethods,
                      history: formData.history,
                      tvaNumber: formData.tvaNumber,
                      garageName: formData.garageName,
                      garageAddress: formData.garageAddress,
                    }}
                    onUpdate={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
                    onHistoryToggle={toggleHistory}
                    user={user}
                    isEffectivelyBanned={isEffectivelyBanned}
                    isSubmitting={isSubmitting}
                    turnstileToken={turnstileToken}
                    onTurnstileTokenChange={setTurnstileToken}
                    fieldErrors={fieldErrors}
                    onFieldErrorClear={(field) => {
                      setFieldErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors[field];
                        return newErrors;
                      });
                    }}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons (Fixed Bottom) - TOUJOURS VISIBLE */}
        <SellFormNavigation
          currentStep={currentStep}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSubmit={handleSubmit}
          isStep1Valid={isStep1Valid}
          isStep2Valid={isStep2Valid}
          isStep3Valid={isStep3Valid}
          isStep4Valid={isStep4Valid}
          isSubmitting={isSubmitting}
          moderationCheckAllowed={moderationCheck.isAllowed}
          isEffectivelyBanned={isEffectivelyBanned}
          isSimulatingBan={isSimulatingBan}
          userRole={user?.role || null}
          turnstileToken={turnstileToken}
          user={user}
        />
      </div>

      {/* Padding Bottom pour éviter que le contenu soit caché par les boutons fixes et le CookieBanner */}
      <div className="h-32" />
    </div>
  );
}

export default function SellPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-300">Chargement...</p>
        </div>
      </div>
    }>
      <SellPageContent />
    </Suspense>
  );
}
