// Octane98 - Gestion des Uploads Supabase

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import imageCompression from "browser-image-compression";

/**
 * Crée un client Supabase dédié pour les uploads avec un timeout plus long
 * Évite les timeouts prématurés pour les images HD
 */
function createUploadClient() {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // Pas besoin de session pour les uploads
    },
    global: {
      // Timeout augmenté à 120 secondes (2 minutes) pour les gros fichiers HD
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 secondes pour les uploads
        
        return fetch(url, {
          ...options,
          signal: options.signal 
            ? (() => {
                // Si un signal est déjà fourni, créer un signal combiné
                const combinedController = new AbortController();
                const abort = () => combinedController.abort();
                options.signal?.addEventListener('abort', abort);
                controller.signal.addEventListener('abort', abort);
                return combinedController.signal;
              })()
            : controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        });
      },
    },
  });
}

// Types MIME autorisés
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"];

// Limites de taille (en bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Valider un fichier image
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Vérifier le type MIME
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types acceptés: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }

  // Vérifier l'extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = ["jpg", "jpeg", "png", "webp", "gif"];
  if (!ext || !allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `Extension non autorisée. Extensions acceptées: ${allowedExts.join(", ")}`,
    };
  }

  // Vérifier la taille
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille maximale: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "Le fichier est vide",
    };
  }

  return { valid: true };
}

/**
 * Valider un fichier audio
 */
function validateAudioFile(file: File): { valid: boolean; error?: string } {
  // Vérifier le type MIME
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types acceptés: ${ALLOWED_AUDIO_TYPES.join(", ")}`,
    };
  }

  // Vérifier l'extension
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedExts = ["mp3", "wav", "ogg", "webm"];
  if (!ext || !allowedExts.includes(ext)) {
    return {
      valid: false,
      error: `Extension non autorisée. Extensions acceptées: ${allowedExts.join(", ")}`,
    };
  }

  // Vérifier la taille
  if (file.size > MAX_AUDIO_SIZE) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille maximale: ${MAX_AUDIO_SIZE / 1024 / 1024}MB`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "Le fichier est vide",
    };
  }

  return { valid: true };
}

/**
 * Applique un filigrane (watermark) sur une image
 * @param file - Fichier image (compressé ou original)
 * @returns Blob WebP avec watermark appliqué
 */
async function applyWatermark(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Créer un canvas pour manipuler l'image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Impossible de créer le contexte canvas');
      }

      // Charger l'image
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        try {
          // Définir la taille du canvas à la taille de l'image
          canvas.width = img.width;
          canvas.height = img.height;

          // Dessiner l'image sur le canvas
          ctx.drawImage(img, 0, 0);

          // Paramètres du watermark adaptatifs selon la taille de l'image
          const baseFontSize = Math.max(16, Math.min(img.width, img.height) * 0.03); // 3% de la plus petite dimension, min 16px
          const fontSize = Math.round(baseFontSize);
          const padding = Math.max(10, fontSize * 0.5); // Padding proportionnel
          
          // Position : en bas à droite
          const text = 'OCTANE98.BE';
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';

          // Mesurer le texte pour calculer la position exacte
          const textMetrics = ctx.measureText(text);
          const textWidth = textMetrics.width;
          const textHeight = fontSize;
          
          const x = img.width - padding;
          const y = img.height - padding;

          // Dessiner le contour noir (ombre portée pour visibilité)
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.lineWidth = Math.max(2, fontSize * 0.1);
          ctx.lineJoin = 'round';
          ctx.miterLimit = 2;
          ctx.strokeText(text, x, y);

          // Dessiner le texte blanc semi-transparent
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fillText(text, x, y);

          // Convertir le canvas en Blob WebP
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);
              if (blob) {
                console.log('🛡️ Watermark appliqué avec succès', {
                  originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
                  watermarkedSize: `${(blob.size / 1024 / 1024).toFixed(2)}MB`,
                  dimensions: `${img.width}x${img.height}`,
                  fontSize: `${fontSize}px`
                });
                resolve(blob);
              } else {
                reject(new Error('Erreur lors de la conversion en Blob'));
              }
            },
            'image/webp',
            0.92 // Qualité WebP (92% pour maintenir une bonne qualité)
          );
        } catch (error) {
          URL.revokeObjectURL(objectUrl);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Erreur lors du chargement de l\'image'));
      };

      img.src = objectUrl;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Compresse une image avant l'upload pour optimiser la performance et le stockage
 * @param file - Fichier image original
 * @returns Fichier compressé ou original en cas d'erreur
 */
async function compressImage(file: File): Promise<File> {
  const oldSize = file.size;
  
  try {
    // Options de compression optimisées pour le web
    const options = {
      maxSizeMB: 1, // Cible : 1 Mo maximum
      maxWidthOrHeight: 1920, // Full HD suffit largement pour le web
      useWebWorker: true, // Compression asynchrone pour ne pas figer l'interface
      fileType: 'image/webp' as const, // Format WebP pour une meilleure compression
      initialQuality: 0.85, // Qualité initiale (85% = bon compromis qualité/taille)
    };

    console.log('📦 Compression de l\'image en cours...', { 
      fileName: file.name, 
      originalSize: `${(oldSize / 1024 / 1024).toFixed(2)}MB` 
    });

    const compressedFile = await imageCompression(file, options);
    const newSize = compressedFile.size;
    const reduction = ((oldSize - newSize) / oldSize * 100).toFixed(1);

    console.log(`📉 Compression : ${(oldSize / 1024 / 1024).toFixed(2)}MB -> ${(newSize / 1024 / 1024).toFixed(2)}MB (${reduction}% de réduction)`);

    return compressedFile;
  } catch (error) {
    // En cas d'erreur de compression, utiliser le fichier original (fallback)
    console.warn('⚠️ Erreur lors de la compression, utilisation du fichier original:', error);
    console.warn('   → Le fichier sera uploadé sans compression');
    return file;
  }
}

/**
 * Upload une image vers Supabase Storage
 * @param file - Fichier image
 * @param userId - ID de l'utilisateur (optionnel pour les invités)
 * @returns URL publique de l'image
 */
export async function uploadImage(file: File, userId?: string | null): Promise<string> {
  console.log('🚀 Uploading to vehicles bucket...', { fileName: file.name, size: `${(file.size / 1024 / 1024).toFixed(2)}MB` });
  
  // Valider le fichier AVANT l'upload
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Fichier invalide");
  }

  // Séquence d'optimisation : 1. Compression -> 2. Watermark -> 3. Upload
  console.log('📦 Étape 1/3 : Compression de l\'image...');
  const compressedFile = await compressImage(file);

  // Appliquer le watermark avec fallback sur le fichier compressé en cas d'erreur
  let fileToUpload: File;
  try {
    console.log('🛡️ Étape 2/3 : Application du watermark...');
    const watermarkedBlob = await applyWatermark(compressedFile);
    
    // Convertir le Blob en File pour l'upload Supabase
    fileToUpload = new File(
      [watermarkedBlob],
      compressedFile.name.replace(/\.[^/.]+$/, '.webp') || 'image.webp',
      { type: 'image/webp' }
    );
  } catch (watermarkError) {
    // Fallback : utiliser le fichier compressé sans watermark si l'application échoue
    console.warn('⚠️ Erreur lors de l\'application du watermark, utilisation du fichier compressé sans watermark:', watermarkError);
    fileToUpload = compressedFile;
  }

  console.log('📤 Étape 3/3 : Upload vers Supabase...');

  // Utiliser un client dédié avec timeout long pour les uploads
  const supabase = createUploadClient();

  // Générer un nom unique
  // Pour les invités, utiliser un UUID temporaire basé sur timestamp
  const folderId = userId || `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  // Utiliser l'extension du fichier compressé (probablement .webp) ou l'extension originale
  const fileExt = fileToUpload.name.split(".").pop() || file.name.split(".").pop() || "webp";
  const fileName = `${folderId}/${Date.now()}.${fileExt}`;
  const filePath = `images/${fileName}`;

  // Upload avec gestion du timeout pour les images HD
  // Utiliser un AbortController avec un timeout long (60 secondes) pour éviter les aborts prématurés
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, 60000); // 60 secondes pour les gros fichiers HD

  try {
    // Upload vers le bucket 'vehicles' (nouveau bucket officiel)
    // Utiliser le fichier compressé (ou original en cas d'erreur de compression)
    const { data, error } = await supabase.storage
      .from("vehicles")
      .upload(filePath, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
        contentType: fileToUpload.type || 'image/webp', // S'assurer que le type MIME est correct
        // Pas de signal d'abort ici car Supabase gère déjà le timeout interne
        // Le timeout de 60s ci-dessus est une sécurité supplémentaire
      });

    clearTimeout(timeoutId);

    if (error) {
      // Détection spécifique des erreurs RLS
      if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
        console.error('[uploadImage] BLOQUAGE RLS DÉTECTÉ');
        console.error('   → Vérifiez que la politique "Authenticated users can upload vehicle images" existe sur storage.objects');
        console.error('   → Le bucket "vehicles" doit être créé et public');
      }
      
      // Détection des erreurs de timeout/abort
      if (error.message?.includes('aborted') || error.message?.includes('signal') || error.message?.includes('timeout')) {
        console.error('[uploadImage] TIMEOUT/ABORT DÉTECTÉ');
        console.error('   → Le fichier est peut-être trop volumineux ou la connexion est lente');
        console.error('   → Taille du fichier:', `${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
        throw new Error(`Upload interrompu (timeout). Le fichier est peut-être trop volumineux (${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB). Réessayez avec une image plus petite ou vérifiez votre connexion.`);
      }
      
      throw new Error(`Erreur upload image: ${error.message}`);
    }

    // Récupérer l'URL publique
    const { data: publicData } = supabase.storage
      .from("vehicles")
      .getPublicUrl(data.path);

    console.log('✅ Upload réussi:', publicData.publicUrl);
    return publicData.publicUrl;
  } catch (err: any) {
    clearTimeout(timeoutId);
    
    // Si c'est une erreur d'abort de notre timeout
    if (err.name === 'AbortError' || abortController.signal.aborted) {
      throw new Error(`Upload interrompu (timeout après 60s). Le fichier est peut-être trop volumineux (${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB). Réessayez avec une image plus petite.`);
    }
    
    // Re-throw les autres erreurs
    throw err;
  }
}

/**
 * Upload plusieurs images
 * @param files - Liste de fichiers
 * @param userId - ID de l'utilisateur (optionnel pour les invités)
 * @returns Liste des URLs
 */
export async function uploadImages(
  files: File[],
  userId?: string | null
): Promise<string[]> {
  const uploads = files.map((file) => uploadImage(file, userId));
  return Promise.all(uploads);
}

/**
 * Upload un fichier audio vers Supabase Storage
 * @param file - Fichier audio
 * @param userId - ID de l'utilisateur (optionnel pour les invités)
 * @returns URL publique de l'audio
 */
export async function uploadAudio(file: File, userId?: string | null): Promise<string> {
  // Valider le fichier AVANT l'upload
  const validation = validateAudioFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Fichier invalide");
  }

  // Utiliser un client dédié avec timeout long pour les uploads
  const supabase = createUploadClient();

  // Pour les invités, utiliser un UUID temporaire basé sur timestamp
  const folderId = userId || `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const fileExt = file.name.split(".").pop();
  const fileName = `${folderId}/${Date.now()}.${fileExt}`;
  const filePath = `audio/${fileName}`;

  const { data, error } = await supabase.storage
    .from("vehicles")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    // Détection spécifique des erreurs RLS
    if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
      console.error('[uploadAudio] BLOQUAGE RLS DÉTECTÉ');
      console.error('   → Vérifiez que la politique "Authenticated users can upload vehicle images" existe sur storage.objects');
      console.error('   → Le bucket "vehicles" doit être créé et public');
    }
    
    throw new Error(`Erreur upload audio: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from("vehicles")
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}

/**
 * Supprimer un fichier de Supabase Storage
 * @param url - URL du fichier à supprimer
 */
export async function deleteFile(url: string): Promise<void> {
  // Utiliser le client standard pour les suppressions (plus rapide)
  const { createClient } = await import("./client");
  const supabase = createClient();

  // Extraire le path du fichier depuis l'URL
  // Format attendu : https://xxx.supabase.co/storage/v1/object/public/vehicles/images/...
  let path: string | null = null;

  // Essayer plusieurs formats d'URL (support ancien 'files' et nouveau 'vehicles')
  if (url.includes("/vehicles/")) {
    path = url.split("/vehicles/")[1];
  } else if (url.includes("/storage/v1/object/public/vehicles/")) {
    path = url.split("/storage/v1/object/public/vehicles/")[1];
  } else if (url.includes("/files/")) {
    // Support rétrocompatibilité avec l'ancien bucket 'files'
    path = url.split("/files/")[1];
  } else if (url.includes("/storage/v1/object/public/files/")) {
    // Support rétrocompatibilité avec l'ancien bucket 'files'
    path = url.split("/storage/v1/object/public/files/")[1];
  } else if (url.startsWith("images/") || url.startsWith("audio/")) {
    // Si c'est déjà un path relatif
    path = url;
  }

  if (!path) {
    // Impossible d'extraire le path de l'URL
    // Ne pas throw d'erreur, juste logger un avertissement
    // Car certaines URLs peuvent être des URLs externes (non Supabase)
    return;
  }

  // Essayer de supprimer depuis 'vehicles' d'abord, puis 'files' en fallback
  let error = null;
  const { error: vehiclesError } = await supabase.storage.from("vehicles").remove([path]);
  if (vehiclesError) {
    // Si erreur sur 'vehicles', essayer 'files' (rétrocompatibilité)
    const { error: filesError } = await supabase.storage.from("files").remove([path]);
    error = filesError;
  }

  if (error) {
    // Logger l'erreur mais ne pas bloquer l'application
    console.error("[deleteFile] Erreur suppression fichier:", {
      error: error.message,
      path,
      url
    });
    // Ne pas throw pour éviter de bloquer l'UI si le fichier n'existe plus
    // throw new Error(`Erreur suppression fichier: ${error.message}`);
  } else {
    // Fichier supprimé avec succès
  }
}

