"use client";

import { ArrowLeft, Car, Bike, Check, AlertTriangle, ChevronRight, ChevronLeft, Upload, Music, Shield, Loader2, Building2, MapPin, Mail } from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useRef, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { useBanSimulation } from "@/contexts/BanSimulationContext";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { VehicleType } from "@/lib/supabase/modelSpecs";
import { getBrands, getModels, getModelSpecs } from "@/lib/supabase/modelSpecs";
import { checkVehicleModeration, getModerationMessage } from "@/lib/moderationUtils";
import { uploadImages, uploadAudio } from "@/lib/supabase/uploads";
import MediaManager from "@/components/MediaManager";
import SearchableSelect from "@/components/SearchableSelect";
import { verifyEmailCode, storeVerificationCode } from "@/lib/supabase/vehicules";
import { createVehicule, saveVehicle } from "@/lib/supabase/server-actions/vehicules";
import { getVehiculeById } from "@/lib/supabase/vehicules";
import { logInfo, logError } from "@/lib/supabase/logs";
import { EXTERIOR_COLORS, INTERIOR_COLORS, CARROSSERIE_TYPES, EXTERIOR_COLOR_HEX, INTERIOR_COLOR_HEX } from "@/lib/vehicleData";
import { Turnstile } from "@marsidev/react-turnstile";
import { generateVerificationCode, sendVerificationEmail, getVerificationCodeExpiry } from "@/lib/emailVerification";

type Step = 1 | 2 | 3 | 4;

function SellPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { isSimulatingBan } = useBanSimulation();
  const { hasResponded } = useCookieConsent();

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
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
  
  // États pour la sécurité (CAPTCHA et vérification email)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [vehiculeIdForVerification, setVehiculeIdForVerification] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  
  // Refs pour les inputs file
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

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
      (!isManualModel || formData.moteur.trim()) &&
      formData.description.trim().length >= 20 && // Description min 20 caractères
      !descriptionCheck.hasError // Pas de mots interdits dans description
    );
  }, [formData.prix, formData.annee, formData.km, formData.transmission, formData.puissance, formData.cvFiscaux, formData.co2, formData.cylindree, formData.moteur, formData.description, descriptionCheck.hasError, isManualModel, hasCo2Data]);

  // Validation étape 3 : Au moins une photo obligatoire + coordonnées
  const isStep3Valid = useMemo(() => {
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
      showToast("Veuillez remplir tous les champs correctement", "error");
      return;
    }
    if (currentStep < 3) {
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
      showToast("⛔ Ce véhicule ne peut pas être publié sur RedZone", "error");
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
      showToast("⛔ RedZone est dédié aux sportives thermiques uniquement. Les véhicules électriques, hybrides et diesel ne sont pas acceptés.", "error");
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
        euro_standard: "euro6d",
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

      // Log de succès (seulement si connecté)
      if (user) {
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
          
          // Log pour invité
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
      
      // Log de l'erreur (seulement si connecté)
      if (user) {
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

  // Upload Photos Réel
  const handlePhotoInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhotos(true);
    try {
      const fileArray = Array.from(files);
      
      // Valider les fichiers avant upload
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      
      for (const file of fileArray) {
        if (file.size === 0) {
          throw new Error(`Le fichier "${file.name}" est vide.`);
        }
        if (file.size > maxSize) {
          throw new Error(`Le fichier "${file.name}" est trop volumineux (max 10MB). Taille actuelle: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Le fichier "${file.name}" n'est pas un format d'image valide. Formats acceptés: JPEG, PNG, WebP, GIF`);
        }
      }

      // Ajouter un timeout pour éviter les blocages
      const uploadPromise = uploadImages(fileArray, user?.id || null);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("L'upload prend trop de temps. Vérifiez votre connexion et réessayez.")), 30000);
      });

      const uploadedUrls = await Promise.race([uploadPromise, timeoutPromise]);
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls],
        photoFiles: [...prev.photoFiles, ...fileArray],
      }));
      
      showToast(`${uploadedUrls.length} photo(s) uploadée(s) avec succès !`, "success");
    } catch (error: any) {
      console.error("Erreur upload photos:", error);
      const errorMessage = error?.message || error?.error?.message || "Erreur lors de l'upload des photos. Vérifiez votre connexion et réessayez.";
      showToast(errorMessage, "error");
    } finally {
      setIsUploadingPhotos(false);
      // Reset input
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  };

  // Upload Audio Réel
  const handleAudioInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAudio(true);
    try {
      // Valider le fichier avant upload
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"];
      
      if (file.size === 0) {
        throw new Error(`Le fichier "${file.name}" est vide.`);
      }
      if (file.size > maxSize) {
        throw new Error(`Le fichier "${file.name}" est trop volumineux (max 5MB). Taille actuelle: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      }
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Le fichier "${file.name}" n'est pas un format audio valide. Formats acceptés: MP3, WAV, OGG, WebM`);
      }

      // Ajouter un timeout pour éviter les blocages
      const uploadPromise = uploadAudio(file, user?.id || null);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("L'upload prend trop de temps. Vérifiez votre connexion et réessayez.")), 30000);
      });

      const audioUrl = await Promise.race([uploadPromise, timeoutPromise]);
      
      setFormData(prev => ({
        ...prev,
        audioFile: file,
        audioUrl: audioUrl,
      }));
      
      showToast("Son uploadé avec succès !", "success");
    } catch (error: any) {
      console.error("Erreur upload audio:", error);
      const errorMessage = error?.message || error?.error?.message || "Erreur lors de l'upload du son. Vérifiez votre connexion et réessayez.";
      showToast(errorMessage, "error");
    } finally {
      setIsUploadingAudio(false);
      // Reset input
      if (audioInputRef.current) {
        audioInputRef.current.value = "";
      }
    }
  };

  // Supprimer une photo (gérée par MediaManager maintenant)
  // Cette fonction est conservée pour compatibilité mais n'est plus utilisée
  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
      photoFiles: prev.photoFiles.filter((_, i) => i !== index),
    }));
  };

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
              : "Ajoutez votre véhicule au Showroom RedZone • Visibilité premium • Commission 0%"}
          </p>
        </div>
      </div>

      {/* Barre de Progression */}
      <div className="bg-neutral-900/50 border-b border-white/10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Étape 1 */}
            <button
              type="button"
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={currentStep === 1}
              className={`flex items-center gap-3 flex-1 transition-opacity ${
                currentStep > 1 ? "cursor-pointer hover:opacity-80" : "cursor-default"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${
                  currentStep >= 1
                    ? "bg-red-600 text-white"
                    : "bg-neutral-200 text-neutral-500"
                } ${
                  currentStep > 1 ? "hover:scale-110" : ""
                }`}
              >
                {currentStep > 1 ? <Check size={20} /> : "1"}
              </div>
              <span
                className={`font-bold text-sm tracking-wide ${
                  currentStep >= 1 ? "text-white" : "text-neutral-400"
                }`}
              >
                L&apos;Identité
              </span>
            </button>

            <div className={`h-1 flex-1 ${currentStep >= 2 ? "bg-red-600" : "bg-neutral-700"}`} />

            {/* Étape 2 */}
            <button
              type="button"
              onClick={() => {
                if (currentStep > 2) {
                  setCurrentStep(2);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              disabled={currentStep === 2 || currentStep < 2}
              className={`flex items-center gap-3 flex-1 justify-center transition-opacity ${
                currentStep > 2 ? "cursor-pointer hover:opacity-80" : "cursor-default"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${
                  currentStep >= 2
                    ? "bg-red-600 text-white"
                    : "bg-neutral-700 text-neutral-400"
                } ${
                  currentStep > 2 ? "hover:scale-110" : ""
                }`}
              >
                {currentStep > 2 ? <Check size={20} /> : "2"}
              </div>
              <span
                className={`font-bold text-sm tracking-wide ${
                  currentStep >= 2 ? "text-white" : "text-neutral-400"
                }`}
              >
                Caractéristiques & Configuration
              </span>
            </button>

            <div className={`h-1 flex-1 ${currentStep >= 3 ? "bg-red-600" : "bg-neutral-700"}`} />

            {/* Étape 3 */}
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                  currentStep >= 3
                    ? "bg-red-600 text-white"
                    : "bg-neutral-700 text-neutral-400"
                }`}
              >
                3
              </div>
              <span
                className={`font-bold text-sm tracking-wide ${
                  currentStep >= 3 ? "text-white" : "text-neutral-400"
                }`}
              >
                La Galerie
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu du Wizard */}
      <div className="max-w-4xl mx-auto px-6 py-6 sm:py-12">
        <div className="bg-neutral-900/50 backdrop-blur-sm rounded-3xl shadow-2xl shadow-black/50 border border-white/10 p-8 md:p-12">
          {/* ÉTAPE 1 : L'Identité */}
          {currentStep === 1 && (
            <div className="space-y-8">
              {/* Section 1 : L'Identité (Card) */}
              <div className="bg-neutral-800/50 rounded-2xl border border-white/10 p-6 md:p-8">
                <h2 className="text-2xl font-black text-white mb-2 tracking-wide">
                  L&apos;Identité
                </h2>
                <p className="text-neutral-300 mb-6 font-light">Marque, modèle et essence</p>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleTypeChange("car")}
                    className={`p-6 rounded-2xl border-4 transition-all hover:scale-105 ${
                      formData.type === "car"
                        ? "border-red-600 bg-red-900/20 shadow-xl shadow-red-600/20"
                        : "border-neutral-700 hover:border-neutral-600 bg-neutral-800/50"
                    }`}
                  >
                    <Car
                      size={48}
                      className={formData.type === "car" ? "text-red-500 mx-auto mb-3" : "text-neutral-400 mx-auto mb-3"}
                    />
                    <p className="font-black text-lg text-white">Voiture</p>
                    {formData.type === "car" && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                          <Check size={14} />
                          Sélectionné
                        </span>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTypeChange("moto")}
                    className={`p-6 rounded-2xl border-4 transition-all hover:scale-105 ${
                      formData.type === "moto"
                        ? "border-red-600 bg-red-900/20 shadow-xl shadow-red-600/20"
                        : "border-neutral-700 hover:border-neutral-600 bg-neutral-800/50"
                    }`}
                  >
                    <Bike
                      size={48}
                      className={formData.type === "moto" ? "text-red-500 mx-auto mb-3" : "text-neutral-400 mx-auto mb-3"}
                    />
                    <p className="font-black text-lg text-white">Moto</p>
                    {formData.type === "moto" && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                          <Check size={14} />
                          Sélectionné
                        </span>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {formData.type && (
                <>
                  {/* Marque - SearchableSelect */}
                  <div>
                    <SearchableSelect
                      value={formData.marque}
                      onChange={(value) => handleMarqueChange(value)}
                      options={marques}
                      placeholder="Rechercher une marque..."
                      label="Marque"
                      loading={loadingBrands}
                      error={errorBrands}
                      disabled={isEffectivelyBanned || !formData.type}
                      required
                    />
                  </div>

                  {/* Modèle - SearchableSelect */}
                  {formData.marque && (
                    <div>
                      <SearchableSelect
                        value={formData.modele}
                        onChange={(value) => {
                          setFormData({ ...formData, modele: value });
                        }}
                        options={[...modeles, "__AUTRE__"]}
                        placeholder="Rechercher un modèle..."
                        label="Modèle"
                        loading={loadingModels}
                        error={errorModels}
                        disabled={!formData.marque}
                        required
                      />
                      {isManualModel && (
                        <div className="mt-3 space-y-3">
                          <div className="p-4 bg-amber-900/20 border-2 border-amber-600/40 rounded-xl">
                            <p className="text-sm font-bold text-amber-300 mb-2">
                              ⚠️ Modèle non listé : Tous les champs techniques deviennent obligatoires.
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-white mb-2">
                              Nom du modèle *
                            </label>
                            <input
                              type="text"
                              value={formData.modeleManuel}
                              onChange={(e) =>
                                setFormData({ ...formData, modeleManuel: e.target.value })
                              }
                              placeholder="Ex: 911 GT3 RS (992)"
                              className="w-full p-4 bg-neutral-800 border-2 border-amber-400 rounded-2xl focus:ring-4 focus:ring-amber-600/20 focus:border-amber-600 text-white font-medium"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Carburant */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-3">
                      Carburant *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { value: "essence", label: "Essence", emoji: "⛽" },
                        { value: "e85", label: "E85", emoji: "🌽" },
                        { value: "lpg", label: "LPG", emoji: "🔥" },
                      ].map((carb) => (
                        <button
                          key={carb.value}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, carburant: carb.value })
                          }
                          className={`p-4 rounded-2xl border-4 transition-all hover:scale-105 ${
                            formData.carburant === carb.value
                              ? "border-red-600 bg-red-900/20 shadow-lg"
                              : "border-white/10 hover:border-white/20 bg-neutral-800/50"
                          }`}
                        >
                          <span className="text-3xl mb-2 block">{carb.emoji}</span>
                          <p className="font-bold text-sm text-white">
                            {carb.label}
                          </p>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-red-400 mt-3 font-bold bg-red-900/20 p-3 rounded-xl border-2 border-red-600/40">
                      🏁 RedZone est dédié aux sportives thermiques uniquement. Pas de Diesel, Hybride ou Électrique.
                    </p>
                  </div>

                  {/* Alerte Modération */}
                  {!moderationCheck.isAllowed && (
                    <div className="bg-red-900/10 border-4 border-red-600 rounded-2xl p-6 animate-pulse">
                      <div className="flex items-start gap-4">
                        <AlertTriangle className="text-red-600 flex-shrink-0" size={32} />
                        <div>
                          <h3 className="text-xl font-black text-red-600 mb-2">
                            Le Videur a parlé 🛑
                          </h3>
                          <p className="text-red-800 mb-3">
                            {getModerationMessage(moderationCheck.detectedWords)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {moderationCheck.detectedWords.map((word, i) => (
                              <span
                                key={i}
                                className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase"
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ÉTAPE 2 : Caractéristiques & Configuration */}
          {currentStep === 2 && (
            <div className="space-y-8">
              {/* Section 2 : Caractéristiques & Configuration (Card) */}
              <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6 md:p-8">
                <h2 className="text-2xl font-black text-white mb-2 tracking-wide">
                  Caractéristiques & Configuration
                </h2>
                <p className="text-slate-300 mb-6 font-light">Moteur, transmission et configuration esthétique</p>

                {/* Sous-Section A : Mécanique & Performance */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent flex-1" />
                    <h3 className="text-lg font-bold text-red-500/90 tracking-wide">
                      Mécanique & Performance
                    </h3>
                    <div className="h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent flex-1" />
                  </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Prix */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">
                    Prix (€) *
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.prix}
                    onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                    placeholder="Ex: 145000"
                    className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-bold text-xl placeholder:text-slate-500"
                  />
                </div>

                {/* Année */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">
                    Année *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.annee}
                    onChange={(e) => setFormData({ ...formData, annee: e.target.value })}
                    placeholder="Ex: 2021"
                    min="1950"
                    max={new Date().getFullYear() + 1}
                    className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
                  />
                </div>

                {/* Kilométrage */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">
                    Kilométrage *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.km}
                    onChange={(e) => setFormData({ ...formData, km: e.target.value })}
                    placeholder="Ex: 18000"
                    min="0"
                    className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
                  />
                </div>

                {/* Puissance */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">
                    Puissance (ch) *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.puissance}
                    onChange={(e) =>
                      setFormData({ ...formData, puissance: e.target.value })
                    }
                    placeholder="Ex: 450"
                    min="1"
                    className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
                  />
                </div>

                {/* CV Fiscaux */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">
                    Puissance Fiscale (CV) *
                    <span className="text-xs font-normal text-slate-400 ml-2">(Pour taxe annuelle)</span>
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.cvFiscaux}
                    onChange={(e) =>
                      setFormData({ ...formData, cvFiscaux: e.target.value })
                    }
                    placeholder="Ex: 17"
                    min="1"
                    className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
                  />
                </div>

                {/* CO2 - Affiché uniquement si les specs contiennent des données CO2 */}
                {hasCo2Data && (
                  <div>
                    <label className="block text-sm font-bold text-white mb-3">
                      Émissions CO2 (g/km) *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={formData.co2}
                      onChange={(e) =>
                        setFormData({ ...formData, co2: e.target.value })
                      }
                      placeholder="Ex: 233"
                      min="0"
                      className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
                    />
                  </div>
                )}

                {/* Cylindrée */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">
                    Cylindrée (cc) {isManualModel ? "*" : ""}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.cylindree}
                    onChange={(e) =>
                      setFormData({ ...formData, cylindree: e.target.value })
                    }
                    placeholder="Ex: 3996"
                    min="0"
                    required={isManualModel}
                    className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
                  />
                </div>

                {/* Architecture Moteur */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">
                    Architecture Moteur {isManualModel ? "*" : "(Optionnel)"}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { value: "L4", label: "L4", subtitle: "4 cyl. ligne" },
                      { value: "L5", label: "L5", subtitle: "5 cyl. ligne" },
                      { value: "L6", label: "L6", subtitle: "6 cyl. ligne" },
                      { value: "V6", label: "V6", subtitle: "" },
                      { value: "V8", label: "V8", subtitle: "" },
                      { value: "V10", label: "V10", subtitle: "" },
                      { value: "V12", label: "V12", subtitle: "" },
                      { value: "Flat-6", label: "Flat-6", subtitle: "Boxer 6" },
                      { value: "Moteur Rotatif", label: "Rotatif", subtitle: "" },
                    ].map((arch) => (
                      <button
                        key={arch.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, architectureMoteur: arch.value, moteur: arch.value })
                        }
                      className={`px-6 py-3 min-h-[48px] rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                        formData.architectureMoteur === arch.value
                          ? "bg-red-600 border-red-600 text-white font-bold shadow-lg shadow-red-600/30"
                          : "bg-slate-800/50 border-white/10 text-white hover:border-white/20 hover:shadow-md"
                      }`}
                      >
                        <div className="text-center">
                          <div className="font-bold text-base">{arch.label}</div>
                          {arch.subtitle && (
                            <div className={`text-xs mt-0.5 ${
                              formData.architectureMoteur === arch.value ? "text-red-100" : "text-slate-500"
                            }`}>
                              {arch.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {isManualModel && !formData.architectureMoteur && (
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      ⚠️ Architecture moteur requise pour les modèles non listés
                    </p>
                  )}
                </div>
              </div>

                  {/* Note de pré-remplissage */}
                  {!isManualModel && formData.modele && formData.puissance && (
                    <div className="mt-4 p-4 bg-green-900/20 border-2 border-green-600/40 rounded-xl">
                      <p className="text-sm text-green-300 font-medium flex items-center gap-2">
                        <Check size={16} className="text-green-500" />
                        <span className="font-bold">Données constructeur pré-remplies automatiquement.</span> Vous pouvez les modifier si votre véhicule est différent (ex: Stage 1, préparation).
                      </p>
                    </div>
                  )}

                  {/* Transmission */}
                  <div>
                <label className="block text-sm font-bold text-white mb-3">
                  Transmission *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { value: "manuelle", label: "Manuelle", emoji: "🎯" },
                    { value: "automatique", label: "Automatique", emoji: "⚡" },
                    { value: "sequentielle", label: "Séquentielle", emoji: "🏁" },
                  ].map((trans) => (
                    <button
                      key={trans.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, transmission: trans.value })
                      }
                      className={`p-4 rounded-2xl border-4 transition-all hover:scale-105 ${
                        formData.transmission === trans.value
                          ? "border-red-600 bg-red-900/20 shadow-lg"
                          : "border-white/10 hover:border-white/20 bg-slate-800/50"
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{trans.emoji}</span>
                      <p className="font-bold text-sm text-white">{trans.label}</p>
                    </button>
                  ))}
                  </div>
                </div>
                </div>

                {/* Champs optionnels supplémentaires (affichés si pré-remplis depuis la base) */}
                {(formData.co2Wltp || formData.topSpeed || formData.drivetrain) && (
                  <div className="mt-6 grid grid-cols-2 gap-6">
                    {/* CO2 WLTP */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-3">
                        CO2 WLTP (g/km) <span className="text-xs font-normal text-slate-400">(Pour Flandre)</span>
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={formData.co2Wltp}
                        onChange={(e) => setFormData({ ...formData, co2Wltp: e.target.value })}
                        placeholder="Ex: 245"
                        min="0"
                        className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
                      />
                    </div>

                    {/* Vitesse max */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-3">
                        Vitesse max (km/h)
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={formData.topSpeed}
                        onChange={(e) => setFormData({ ...formData, topSpeed: e.target.value })}
                        placeholder="Ex: 320"
                        min="0"
                        className="w-full p-4 min-h-[48px] bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
                      />
                    </div>

                    {/* Transmission (RWD/FWD/AWD) */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-3">
                        Type de transmission
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { value: "RWD", label: "RWD", subtitle: "Propulsion" },
                          { value: "FWD", label: "FWD", subtitle: "Traction" },
                          { value: "AWD", label: "AWD", subtitle: "4x4" },
                          { value: "4WD", label: "4WD", subtitle: "4x4" },
                        ].map((drivetrain) => (
                          <button
                            key={drivetrain.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, drivetrain: drivetrain.value })}
                            className={`px-4 py-3 rounded-xl border-2 transition-all text-center ${
                              formData.drivetrain === drivetrain.value
                                ? "bg-red-600 border-red-600 text-white font-bold"
                                : "bg-slate-800/50 border-white/10 text-white hover:border-white/20"
                            }`}
                          >
                            <div className="font-bold text-sm">{drivetrain.label}</div>
                            <div className="text-xs text-slate-400">{drivetrain.subtitle}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sous-Section B : Configuration Esthétique */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent flex-1" />
                    <h3 className="text-lg font-bold text-red-500/90 tracking-wide">
                      Configuration Esthétique
                    </h3>
                    <div className="h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent flex-1" />
                  </div>

                  {/* Type de Carrosserie */}
                  <div>
                <label className="block text-sm font-bold text-white mb-3">
                  Type de Carrosserie (Optionnel)
                </label>
                <div className="flex flex-wrap gap-3">
                  {CARROSSERIE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, carrosserie: type })
                      }
                      className={`px-6 py-3 min-h-[48px] rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                        formData.carrosserie === type
                          ? "bg-red-600 border-red-600 text-white font-bold shadow-lg shadow-red-600/30"
                          : "bg-slate-800/50 border-white/10 text-white hover:border-white/20 hover:shadow-md"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, carrosserie: "" })}
                  className={`mt-3 text-xs px-4 py-2 rounded-lg transition-all ${
                    formData.carrosserie
                      ? "text-red-600 hover:text-red-700 font-medium"
                      : "text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {formData.carrosserie ? "✕ Réinitialiser" : ""}
                </button>
              </div>

                  {/* Couleur Extérieure */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-3">
                      Couleur Extérieure (Optionnel)
                    </label>
                    <div className="overflow-x-auto -mx-2 px-2 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      <div className="flex gap-3 md:grid md:grid-cols-6 lg:grid-cols-8 md:gap-4 min-w-max md:min-w-0">
                        {EXTERIOR_COLORS.map((color) => {
                          const isSelected = formData.couleurExterieure === color;
                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() =>
                                setFormData({ ...formData, couleurExterieure: color })
                              }
                              className="group relative flex flex-col items-center gap-2 flex-shrink-0"
                              title={color}
                            >
                              <div
                                className={`w-12 h-12 rounded-full border-4 transition-all duration-200 hover:scale-110 active:scale-95 ${
                                  isSelected
                                    ? "border-red-600 shadow-lg shadow-red-600/50 ring-4 ring-red-600/30 ring-offset-2 ring-offset-slate-800"
                                    : "border-slate-300 hover:border-slate-400"
                                }`}
                                style={{
                                  backgroundColor: EXTERIOR_COLOR_HEX[color],
                                }}
                              />
                              <span
                                className={`text-xs font-medium transition-colors text-center ${
                                  isSelected ? "text-red-500 font-bold" : "text-slate-400"
                                }`}
                              >
                                {color}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, couleurExterieure: "" })}
                      className={`mt-3 text-xs px-4 py-2 rounded-lg transition-all ${
                        formData.couleurExterieure
                          ? "text-red-600 hover:text-red-700 font-medium"
                          : "text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {formData.couleurExterieure ? "✕ Réinitialiser" : ""}
                    </button>
                  </div>

                  {/* Couleur Intérieure */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-3">
                      Couleur Intérieure (Optionnel)
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {INTERIOR_COLORS.map((couleur) => (
                        <button
                          key={couleur}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, couleurInterieure: couleur })
                          }
                          className={`px-6 py-3 min-h-[48px] rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                            formData.couleurInterieure === couleur
                              ? "bg-red-600 border-red-600 text-white font-bold shadow-lg shadow-red-600/30 ring-2 ring-red-600/50 ring-offset-2 ring-offset-slate-800"
                              : "bg-slate-800/50 border-white/10 text-white hover:border-white/20 hover:shadow-md"
                          }`}
                        >
                          {couleur}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, couleurInterieure: "" })}
                      className={`mt-3 text-xs px-4 py-2 rounded-lg transition-all ${
                        formData.couleurInterieure
                          ? "text-red-600 hover:text-red-700 font-medium"
                          : "text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {formData.couleurInterieure ? "✕ Réinitialiser" : ""}
                    </button>
                  </div>

                  {/* Nombre de Places */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-3">
                      Nombre de Places (Optionnel)
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: "2", label: "2 places" },
                        { value: "4", label: "4 places" },
                        { value: "5", label: "5 places" },
                        { value: "2+2", label: "2+2" },
                      ].map((places) => (
                        <button
                          key={places.value}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, nombrePlaces: places.value })
                          }
                          className={`px-6 py-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95 ${
                            formData.nombrePlaces === places.value
                              ? "bg-red-600 border-red-600 text-white font-bold shadow-lg shadow-red-600/30"
                              : "bg-slate-800/50 border-white/10 text-white hover:border-white/20 hover:shadow-md"
                          }`}
                        >
                          {places.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, nombrePlaces: "" })}
                      className={`mt-3 text-xs px-4 py-2 rounded-lg transition-all ${
                        formData.nombrePlaces
                          ? "text-red-600 hover:text-red-700 font-medium"
                          : "text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {formData.nombrePlaces ? "✕ Réinitialiser" : ""}
                    </button>
                  </div>
                </div>

              {/* L'Histoire du véhicule */}
              <div>
                <label className="block text-sm font-bold text-white mb-3 tracking-wide">
                  L&apos;Histoire du véhicule *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={8}
                  placeholder="Racontez l'histoire de ce véhicule : entretien, options, modifications (Stage 1, préparation...), édition limitée, garantie, historique... (Minimum 20 caractères)"
                  className={`w-full p-4 bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 text-white font-light resize-none placeholder:text-slate-500 ${
                    descriptionCheck.hasError
                      ? "border-red-600 focus:border-red-600"
                      : "focus:border-red-600"
                  }`}
                />

                {/* Compteur de caractères */}
                <div className="flex items-center justify-between mt-2">
                  <p
                    className={`text-xs font-bold ${
                      formData.description.length < 20
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {formData.description.length >= 20 ? (
                      <>✓ {formData.description.length} caractères</>
                    ) : (
                      <>⚠️ {formData.description.length}/20 caractères minimum</>
                    )}
                  </p>
                </div>

                {/* Le Videur V2 - Alerte Inline */}
                {descriptionCheck.hasError && (
                  <div className="mt-4 bg-red-900/10 border-2 border-red-600 rounded-2xl p-4 animate-pulse">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
                      <div className="flex-1">
                        <p className="text-red-300 font-bold mb-2">
                          ⛔ Termes interdits détectés dans votre description
                        </p>
                        <p className="text-red-400 text-sm mb-3 font-light">
                          RedZone est réservé à la vente pure de sportives essence. Merci de retirer ces termes :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {descriptionCheck.detectedWords.map((word, i) => (
                            <span
                              key={i}
                              className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase"
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : La Galerie */}
          {currentStep === 3 && (
            <div className="space-y-8">
              {/* Section 3 : La Galerie (Card) */}
              <div className="bg-slate-800/50 rounded-2xl border border-white/10 p-6 md:p-8">
                <h2 className="text-2xl font-black text-white mb-2 tracking-wide">
                  La Galerie
                </h2>
                <p className="text-slate-300 mb-6 font-light">
                  Photos, son et histoire du véhicule
                </p>

                {/* RÉCAPITULATIF DE L'ANNONCE */}
                <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 border-2 border-red-600 rounded-3xl p-8 shadow-2xl">
                  <h3 className="text-xl font-black text-white mb-4 flex items-center gap-2">
                    <Check className="text-red-500" size={28} />
                    Récapitulatif de votre annonce
                  </h3>

                  <div className="bg-slate-800/50 rounded-2xl p-6 space-y-4 border border-white/10">
                    {/* Titre */}
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-1">TITRE</p>
                      <p className="text-2xl font-black text-white">
                        {formData.marque} {formData.modele}
                      </p>
                    </div>

                    {/* Prix */}
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-1">PRIX</p>
                      <p className="text-3xl font-black text-red-500">
                        {parseFloat(formData.prix).toLocaleString("fr-BE")} €
                      </p>
                    </div>

                    {/* Détails */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                      <div>
                        <p className="text-xs font-bold text-slate-400">ANNÉE</p>
                        <p className="text-lg font-bold text-white">{formData.annee}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400">KM</p>
                        <p className="text-lg font-bold text-white">
                          {parseInt(formData.km).toLocaleString("fr-BE")} km
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400">PUISSANCE</p>
                        <p className="text-lg font-bold text-white">{formData.puissance} ch</p>
                      </div>
                    </div>
                  </div>

                  {/* L'Histoire */}
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs font-bold text-slate-400 mb-2 tracking-wide">L&apos;HISTOIRE</p>
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-4 font-light">
                      {formData.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Localisation - Où voir le véhicule ? */}
              <div>
                <label className="block text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-red-500" />
                  Où voir le véhicule ? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Code Postal */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Code Postal <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.codePostal}
                      onChange={(e) => setFormData((prev) => ({ ...prev, codePostal: e.target.value }))}
                      placeholder="Ex: 5000, 7181"
                      required
                      maxLength={4}
                      pattern="[0-9]{4}"
                      className="w-full px-4 py-4 bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/20 transition-all text-white placeholder:text-slate-500"
                    />
                    <p className="text-xs text-slate-500 mt-2">Format: 4 chiffres (ex: 5000)</p>
                  </div>

                  {/* Ville */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Ville <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.ville}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ville: e.target.value }))}
                      placeholder="Ex: Namur, Liège, Bruxelles"
                      required
                      className="w-full px-4 py-4 bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/20 transition-all text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3 flex items-center gap-2">
                  <MapPin size={14} className="text-slate-400" />
                  Cette information permettra aux acheteurs de localiser votre véhicule sur une carte.
                </p>
              </div>

              {/* Module Média Pro (Photos & Audio) */}
              <MediaManager
                photos={formData.photos}
                audioUrl={formData.audioUrl}
                onPhotosChange={(newPhotos) => {
                  setFormData(prev => ({ ...prev, photos: newPhotos }));
                }}
                onAudioChange={(newAudioUrl) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    audioUrl: newAudioUrl,
                    audioFile: newAudioUrl ? prev.audioFile : null
                  }));
                }}
                userId={user?.id || null}
                disabled={isEffectivelyBanned || isSubmitting}
              />

              {/* Car-Pass URL */}
              <div data-field="carPassUrl">
                <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Shield size={20} className="text-green-600" />
                  Lien Car-Pass (URL) <span className="text-xs font-normal text-slate-400">(Optionnel)</span>
                </label>
                <input
                  type="url"
                  value={formData.carPassUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, carPassUrl: e.target.value });
                    // Effacer l'erreur quand l'utilisateur modifie le champ
                    if (fieldErrors.carPassUrl) {
                      setFieldErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.carPassUrl;
                        return newErrors;
                      });
                    }
                  }}
                  placeholder="https://www.car-pass.be/..."
                  className={`w-full p-4 bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium transition-all placeholder:text-slate-500 ${
                    fieldErrors.carPassUrl
                      ? "border-red-600 bg-red-900/20"
                      : ""
                  }`}
                />
                {fieldErrors.carPassUrl ? (
                  <div className="mt-2 p-3 bg-red-900/20 border-2 border-red-600/40 rounded-xl">
                    <p className="text-sm font-bold text-red-300 flex items-center gap-2">
                      <AlertTriangle size={16} className="text-red-400" />
                      {fieldErrors.carPassUrl}
                    </p>
                    <p className="text-xs text-red-400 mt-2 ml-6">
                      Format attendu : <code className="bg-red-900/30 px-2 py-1 rounded text-red-200">https://www.car-pass.be/...</code> ou <code className="bg-red-900/30 px-2 py-1 rounded text-red-200">http://www.car-pass.be/...</code>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-2 font-light">
                    🔒 Plus sécurisé qu'un upload de fichier. Partagez le lien vers votre Car-Pass en ligne.
                  </p>
                )}
              </div>

              {/* Vos Coordonnées */}
              <div className="mt-8 pt-8 border-t-2 border-white/10">
                <h3 className="text-xl font-black text-white mb-6 tracking-wide">
                  Vos coordonnées
                </h3>

                {/* Email de contact */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-white mb-3">
                    Email de contact {!user && <span className="text-red-600">*</span>}
                    {user && <span className="text-xs font-normal text-slate-400">(Optionnel - utilisera {user.email} par défaut)</span>}
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, contactEmail: e.target.value })
                    }
                    placeholder={user ? user.email : "votre@email.be"}
                    required={!user}
                    className="w-full p-4 bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    {user 
                      ? "Cet email sera visible par les acheteurs intéressés. Si vide, votre email de compte sera utilisé."
                      : "⚠️ Email obligatoire pour les invités. Cet email sera visible par les acheteurs intéressés."
                    }
                  </p>
                </div>

                {/* Téléphone */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-white mb-3">
                    Téléphone {formData.contactMethods.includes('whatsapp') || formData.contactMethods.includes('tel') ? <span className="text-red-500">*</span> : <span className="text-xs font-normal text-slate-400">(Optionnel)</span>}
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => {
                      // Format automatique belge +32
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.startsWith('32')) {
                        value = '+' + value;
                      } else if (value && !value.startsWith('+')) {
                        value = '+32' + value;
                      }
                      setFormData({ ...formData, telephone: value });
                    }}
                    placeholder="+32 471 23 45 67"
                    required={formData.contactMethods.includes('whatsapp') || formData.contactMethods.includes('tel')}
                    className="w-full p-4 bg-slate-800/50 border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white font-medium placeholder:text-slate-500"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Format belge : +32 XXX XX XX XX
                  </p>
                </div>

                {/* Préférences de contact */}
                <div>
                  <label className="block text-sm font-bold text-white mb-3">
                    Préférences de contact *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-300 hover:border-red-400 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.contactMethods.includes('email')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              contactMethods: [...prev.contactMethods, 'email']
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              contactMethods: prev.contactMethods.filter(m => m !== 'email')
                            }));
                          }
                        }}
                        className="w-5 h-5 text-red-600 rounded border-2 border-slate-400 focus:ring-red-600"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-white">Accepter les contacts par Email</span>
                        <p className="text-xs text-slate-400">Les acheteurs pourront vous envoyer un email</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-300 hover:border-green-400 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.contactMethods.includes('whatsapp')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              contactMethods: [...prev.contactMethods, 'whatsapp']
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              contactMethods: prev.contactMethods.filter(m => m !== 'whatsapp')
                            }));
                          }
                        }}
                        className="w-5 h-5 text-green-600 rounded border-2 border-slate-400 focus:ring-green-600"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-white">Accepter les contacts par WhatsApp</span>
                        <p className="text-xs text-slate-400">Nécessite un numéro de téléphone</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-300 hover:border-red-400 transition-all cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.contactMethods.includes('tel')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              contactMethods: [...prev.contactMethods, 'tel']
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              contactMethods: prev.contactMethods.filter(m => m !== 'tel')
                            }));
                          }
                        }}
                        className="w-5 h-5 text-red-600 rounded border-2 border-slate-400 focus:ring-red-600"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-white">Accepter les appels téléphoniques</span>
                        <p className="text-xs text-slate-400">Nécessite un numéro de téléphone</p>
                      </div>
                    </label>
                  </div>
                  {formData.contactMethods.length === 0 && (
                    <p className="text-sm text-red-600 font-medium mt-2">
                      ⚠️ Veuillez sélectionner au moins une méthode de contact.
                    </p>
                  )}
                </div>
              </div>

              {/* Champs Professionnels (si role === 'pro') */}
              {user?.role === "pro" && (
                <div className="bg-gradient-to-br from-red-950/30 to-red-900/20 border-2 border-red-600/30 rounded-3xl p-8 shadow-xl">
                  <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                    <Building2 size={28} className="text-red-600" />
                    Informations Professionnelles
                  </h3>
                  <div className="space-y-6">
                    {/* Nom du Garage */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-3">
                        Nom du Garage *
                      </label>
                      <input
                        type="text"
                        value={formData.garageName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, garageName: e.target.value }))}
                        placeholder="Ex: Garage Auto Premium"
                        required={user.role === "pro"}
                        className="w-full px-4 py-4 bg-slate-800 border-2 border-slate-600 rounded-2xl focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/20 transition-all text-white"
                      />
                    </div>

                    {/* Numéro de TVA */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-3">
                        Numéro de TVA (BE) *
                      </label>
                      <input
                        type="text"
                        value={formData.tvaNumber}
                        onChange={(e) => setFormData((prev) => ({ ...prev, tvaNumber: e.target.value }))}
                        placeholder="Ex: BE0123456789"
                        required={user.role === "pro"}
                        pattern="BE[0-9]{10}"
                        className="w-full px-4 py-4 bg-slate-800 border-2 border-slate-600 rounded-2xl focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/20 transition-all text-white"
                      />
                      <p className="text-xs text-slate-400 mt-2">
                        Format: BE suivi de 10 chiffres
                      </p>
                    </div>

                    {/* Adresse du Garage */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-3">
                        Adresse du Garage
                      </label>
                      <textarea
                        value={formData.garageAddress}
                        onChange={(e) => setFormData((prev) => ({ ...prev, garageAddress: e.target.value }))}
                        placeholder="Rue, Numéro, Code postal, Ville"
                        rows={3}
                        className="w-full px-4 py-4 bg-slate-800 border-2 border-slate-600 rounded-2xl focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/20 transition-all resize-y text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Historique */}
              <div>
                <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Shield size={20} className="text-red-600" />
                  Transparence & Historique (Optionnel)
                </label>
                <div className="space-y-3">
                  {[
                    "Carnet d'entretien complet",
                    "Factures disponibles",
                    "Véhicule non accidenté",
                    "Origine Belgique",
                    "2 clés disponibles",
                  ].map((item) => {
                    const isSelected = formData.history.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleHistory(item)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${
                          isSelected
                            ? "border-green-600 bg-green-50"
                            : "border-slate-300 hover:border-slate-400 bg-slate-800/50"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                            isSelected
                              ? "bg-green-600 border-green-600"
                              : "border-slate-400"
                          }`}
                        >
                          {isSelected && (
                            <Check size={16} className="text-white" />
                          )}
                        </div>
                        <span className={`font-medium ${
                          isSelected 
                            ? "text-green-900" 
                            : "text-white"
                        }`}>
                          {item}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CAPTCHA Turnstile - Uniquement pour les invités */}
              {!user && (
                <div className="mt-8 pt-8 border-t-2 border-slate-200">
                  <label className="block text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-red-600" />
                    Vérification anti-robot <span className="text-red-600">*</span>
                  </label>
                  <div className="flex justify-center">
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"} // Clé de test par défaut
                      onSuccess={(token) => {
                        setTurnstileToken(token);
                      }}
                      onError={() => {
                        setTurnstileToken(null);
                        showToast("Erreur lors de la vérification anti-robot", "error");
                      }}
                      onExpire={() => {
                        setTurnstileToken(null);
                      }}
                      options={{
                        theme: "light",
                        size: "normal",
                      }}
                    />
                  </div>
                  {!turnstileToken && (
                    <p className="text-xs text-red-600 mt-3 text-center font-medium">
                      ⚠️ Veuillez compléter la vérification anti-robot pour continuer
                    </p>
                  )}
                  {turnstileToken && (
                    <p className="text-xs text-green-600 mt-3 text-center font-medium flex items-center justify-center gap-2">
                      <Check size={14} />
                      Vérification réussie
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 4 : Vérification Email (Uniquement pour les invités) */}
          {currentStep === 4 && vehiculeIdForVerification && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight flex items-center gap-2">
                  <Mail size={28} className="text-red-600" />
                  Vérification de votre email
                </h2>
                <p className="text-slate-400 mb-6">
                  Un code de vérification à 6 chiffres vous a été envoyé à <strong>{formData.contactEmail}</strong>
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-950/30 to-red-900/20 border-2 border-red-600/30 rounded-3xl p-8 shadow-xl">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-4">
                      <Mail size={40} className="text-white" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-2">
                      Vérifiez votre boîte email
                    </h3>
                    <p className="text-slate-300">
                      Entrez le code à 6 chiffres reçu par email pour confirmer votre annonce.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-white mb-3">
                      Code de vérification <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={verificationCode}
                      onChange={(e) => {
                        // Limiter à 6 chiffres
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                      }}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full p-6 text-center text-3xl font-black tracking-widest bg-slate-800 border-4 border-slate-600 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-white"
                      autoFocus
                    />
                    <p className="text-xs text-slate-400 mt-3 text-center font-light">
                      {verificationCode.length}/6 chiffres
                    </p>
                  </div>

                  <div className="bg-amber-900/20 border-2 border-amber-600/40 rounded-xl p-4">
                    <p className="text-sm text-amber-300 font-light">
                      ⚠️ <strong>Code expiré ?</strong> Le code est valide pendant 15 minutes. Si vous ne l'avez pas reçu, vérifiez vos spams ou contactez le support.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isVerifyingCode || verificationCode.length !== 6}
                    className={`w-full py-4 rounded-full font-black text-lg transition-all shadow-2xl ${
                      isVerifyingCode || verificationCode.length !== 6
                        ? "bg-slate-400 cursor-not-allowed text-white opacity-60"
                        : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:scale-105 shadow-red-600/50 active:scale-95"
                    }`}
                  >
                    {isVerifyingCode ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white inline-block mr-2" />
                        Vérification...
                      </>
                    ) : (
                      <>
                        ✓ Vérifier le code
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons (Fixed Bottom) - TOUJOURS VISIBLE */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-white/10 shadow-2xl z-[90] pointer-events-auto">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            {/* Bouton Précédent - Visible uniquement si étape > 1 et <= 3 */}
            {currentStep > 1 && currentStep <= 3 ? (
              <button
                type="button"
                onClick={handlePrevious}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-medium rounded-full transition-all duration-200"
              >
                <ChevronLeft size={18} />
                Retour
              </button>
            ) : (
              <div className="w-0" />
            )}

            <div className="flex-1" />

            {/* Bouton Suivant - Visible si étape 1 ou 2 */}
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid)
                }
                className={`flex items-center gap-2 px-8 py-4 rounded-full font-black text-lg transition-all shadow-2xl ${
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid)
                    ? "bg-slate-400 cursor-not-allowed text-white opacity-60"
                    : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:scale-105 shadow-red-600/50 active:scale-95"
                }`}
              >
                Suivant
                <ChevronRight size={24} />
              </button>
            ) : currentStep === 3 ? (
              <>
                {/* Note BETA - Publication gratuite */}
                <div className="w-full mb-4">
                  <div className="bg-red-900/20 border-2 border-red-600/40 rounded-xl p-4">
                    <p className="text-sm text-red-300 font-light text-center tracking-wide">
                      ℹ️ Durant la phase Bêta, la publication d&apos;annonces est entièrement gratuite et illimitée.
                    </p>
                  </div>
                </div>

                {/* Bouton Publier/Enregistrer - Visible uniquement étape 3 */}
                {isEffectivelyBanned && (
                  <div className="mb-4 p-4 bg-red-900/20 border-2 border-red-600/40 rounded-xl">
                    <p className="text-sm font-bold text-red-300 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      {isSimulatingBan && user?.role === "admin"
                        ? "Mode test actif : Publication d'annonces désactivée (simulation)"
                        : "Votre compte est suspendu. Vous ne pouvez pas publier d'annonces."}
                    </p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    isSubmitting || 
                    !moderationCheck.isAllowed || 
                    !isStep3Valid || 
                    (!user && !turnstileToken) || // CAPTCHA requis pour les invités
                    isEffectivelyBanned // Bloqué si banni ou en simulation
                  }
                  className={`flex items-center gap-2 px-8 py-4 rounded-full font-black text-lg transition-all shadow-2xl ${
                    isSubmitting || 
                    !moderationCheck.isAllowed || 
                    !isStep3Valid || 
                    (!user && !turnstileToken) ||
                    isEffectivelyBanned
                      ? "bg-slate-400 cursor-not-allowed text-white opacity-60"
                      : "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white hover:scale-105 shadow-red-600/50 active:scale-95"
                  }`}
                  title={
                    isEffectivelyBanned
                      ? (isSimulatingBan && user?.role === "admin"
                          ? "Mode test actif : Publication d'annonces désactivée (simulation)"
                          : "Votre compte est suspendu. Vous ne pouvez pas publier d'annonces.")
                      : !isStep3Valid 
                      ? "Une annonce de sportive doit avoir au moins une photo pour être validée." 
                      : (!user && !turnstileToken)
                      ? "Veuillez compléter la vérification anti-robot"
                      : ""
                  }
                >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    <span className="tracking-wide">
                      {isEditMode ? "Enregistrement en cours..." : "Envoi du dossier en cours..."}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="tracking-wide">
                      {isEditMode ? "Enregistrer les modifications" : "Ajouter au Showroom"}
                    </span>
                  </>
                )}
              </button>
              </>
            ) : null}
          </div>
        </div>
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
