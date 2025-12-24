// RedZone - Actions Supabase pour les Véhicules

import { createClient } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Vehicule, VehiculeInsert, VehiculeUpdate } from "./types";
import { validateVehiculeData, sanitizeVehiculeData } from "../validation";
// ⚠️ Les fonctions admin (approveVehicule, rejectVehicule) sont dans server-actions/vehicules.ts

/**
 * Convertit les colonnes françaises en colonnes anglaises pour la table vehicles
 * @param data - Données avec noms de colonnes français
 * @returns Données avec noms de colonnes anglais
 */
/**
 * Convertit les colonnes françaises en colonnes anglaises pour la table vehicles
 * IMPORTANT: La table vehicles utilise owner_id au lieu de user_id
 */
function mapFrenchToEnglishColumns(data: any): any {
  const mapped: any = {};
  
  // Mapping des colonnes françaises -> anglaises
  if (data.marque !== undefined) mapped.brand = data.marque;
  if (data.modele !== undefined) mapped.model = data.modele;
  if (data.prix !== undefined) mapped.price = data.prix;
  if (data.annee !== undefined) mapped.year = data.annee;
  if (data.km !== undefined) mapped.mileage = data.km;
  if (data.carburant !== undefined) mapped.fuel_type = data.carburant;
  if (data.carrosserie !== undefined) mapped.body_type = data.carrosserie;
  if (data.puissance !== undefined) mapped.power_hp = data.puissance;
  if (data.etat !== undefined) mapped.condition = data.etat;
  if (data.norme_euro !== undefined) mapped.euro_standard = data.norme_euro;
  if (data.architecture_moteur !== undefined) mapped.engine_architecture = data.architecture_moteur;
  if (data.cv_fiscaux !== undefined) mapped.fiscal_horsepower = data.cv_fiscaux;
  if (data.couleur_interieure !== undefined) mapped.interior_color = data.couleur_interieure;
  if (data.nombre_places !== undefined) mapped.seats_count = data.nombre_places;
  if (data.telephone !== undefined) mapped.phone = data.telephone;
  if (data.ville !== undefined) mapped.city = data.ville;
  if (data.code_postal !== undefined) mapped.postal_code = data.code_postal;
  
  // email_contact est mappé vers guest_email dans la table vehicles
  if (data.email_contact !== undefined) {
    mapped.guest_email = data.email_contact;
  }
  
  // IMPORTANT: user_id est mappé vers owner_id dans la table vehicles
  if (data.user_id !== undefined) {
    mapped.owner_id = data.user_id;
  }
  
  // Colonnes qui restent identiques
  const unchangedColumns = [
    'id', 'created_at', 'type', 'transmission', 'car_pass', 'image', 'images',
    'description', 'status', 'guest_email', 'is_email_verified',
    'verification_code', 'verification_code_expires_at', 'edit_token',
    'admission', 'zero_a_cent', 'co2', 'poids_kg', 'audio_file', 'history',
    'car_pass_url', 'is_manual_model', 'contact_email', 'contact_methods',
    'owner_id', // owner_id reste owner_id (mais on ne l'utilise jamais directement dans le code)
    // Nouveaux champs pour taxes (déjà en anglais)
    'displacement_cc', 'co2_wltp', 'first_registration_date', 'is_hybrid', 'is_electric', 'region_of_registration',
    // Nouveaux champs pour véhicules sportifs (déjà en anglais)
    'drivetrain', 'top_speed', 'torque_nm', 'engine_configuration', 'number_of_cylinders',
    'redline_rpm', 'limited_edition', 'number_produced', 'racing_heritage', 'modifications',
    'track_ready', 'warranty_remaining', 'service_history_count'
  ];
  
  unchangedColumns.forEach(col => {
    if (data[col] !== undefined) {
      // Ne pas écraser guest_email si on l'a déjà mappé depuis email_contact
      if (col === 'guest_email' && mapped.guest_email !== undefined) {
        return;
      }
      // Ne pas écraser owner_id si on l'a déjà mappé depuis user_id
      if (col === 'owner_id' && mapped.owner_id !== undefined) {
        return;
      }
      mapped[col] = data[col];
    }
  });
  
  return mapped;
}

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

/**
 * Créer un nouveau véhicule
 * @param vehicule - Données du véhicule
 * @param userId - ID de l'utilisateur (optionnel si invité)
 * @param guestEmail - Email de l'invité (obligatoire si userId est null)
 * @param supabaseClient - Client Supabase optionnel (pour Server Actions, utilisez le client serveur)
 * @returns ID du véhicule créé
 */
export async function createVehicule(
  vehicule: Omit<VehiculeInsert, "id" | "user_id" | "status" | "created_at" | "guest_email">,
  userId: string | null = null,
  guestEmail: string | null = null,
  supabaseClient?: SupabaseClient
): Promise<string> {
  // Validation : soit userId soit guestEmail doit être présent
  if (!userId && !guestEmail) {
    throw new Error("userId ou guestEmail doit être fourni");
  }

  if (!userId && (!guestEmail || !guestEmail.includes('@'))) {
    throw new Error("guestEmail doit être un email valide si userId n'est pas fourni");
  }

  // Validation des données (convertir les colonnes anglaises en françaises pour la validation)
  const validation = validateVehiculeData({
    marque: vehicule.brand,
    modele: vehicule.model,
    prix: vehicule.price,
    annee: vehicule.year,
    km: vehicule.mileage,
    description: vehicule.description || undefined,
    car_pass_url: vehicule.car_pass_url || undefined,
    contact_email: vehicule.contact_email || undefined,
    telephone: vehicule.phone || undefined,
    contact_methods: vehicule.contact_methods || undefined,
  });

  if (!validation.isValid) {
    throw new Error(
      `Données invalides: ${validation.errors.join(", ")}`
    );
  }

  // Sanitization des données
  const sanitized = sanitizeVehiculeData(vehicule);

  // Utiliser le client fourni (serveur) ou créer un client navigateur
  const supabase = supabaseClient || createClient();

  // Déterminer le statut selon le type d'utilisateur
  // Pour les invités : pending_validation (exigé par la politique RLS)
  // Pour les utilisateurs connectés : pending (en attente de validation admin)
  const status = userId ? "pending" : "pending_validation";

  // Convertir les colonnes françaises en anglaises pour la table vehicles
  const mappedData = mapFrenchToEnglishColumns({
    ...sanitized,
    user_id: userId || null,
    guest_email: guestEmail || null, // Utiliser guest_email directement (pas email_contact)
    status: status,
    is_email_verified: false,
  });

  const { data, error } = await supabase
    .from("vehicles")
    .insert(mappedData)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Erreur création véhicule: ${error.message}`);
  }

  return data.id;
}

/**
 * Mettre à jour un véhicule
 * @param id - ID du véhicule
 * @param updates - Champs à mettre à jour
 * @param supabaseClient - Client Supabase optionnel (pour Server Actions, utilisez le client serveur)
 */
export async function updateVehicule(
  id: string,
  updates: VehiculeUpdate,
  supabaseClient?: SupabaseClient
): Promise<void> {
  // Utiliser le client fourni (serveur) ou créer un client navigateur
  const supabase = supabaseClient || createClient();

  // Convertir les colonnes françaises en anglaises
  const mappedUpdates = mapFrenchToEnglishColumns(updates);

  const { error } = await supabase
    .from("vehicles")
    .update(mappedUpdates)
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur mise à jour: ${error.message}`);
  }
}

/**
 * Supprimer un véhicule
 * @param id - ID du véhicule
 */
export async function deleteVehicule(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("vehicles").delete().eq("id", id);

  if (error) {
    throw new Error(`Erreur suppression: ${error.message}`);
  }
}

/**
 * Récupérer tous les véhicules (avec filtres)
 * @param filters - Filtres optionnels
 * @returns Liste des véhicules
 */
export async function getVehicules(filters?: {
  status?: "pending" | "active" | "rejected";
  type?: "car" | "moto";
  limit?: number;
}): Promise<Vehicule[]> {
  const supabase = createClient();

  let query = supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur récupération: ${error.message}`);
  }

  // Utiliser directement les colonnes anglaises (pas de mapping)
  // S'assurer que les valeurs numériques sont bien des nombres
  return ((data || []).map((v: any) => ({
    ...v,
    price: parseNumber(v.price),
    year: parseNumber(v.year),
    mileage: parseNumber(v.mileage),
    power_hp: parseNumber(v.power_hp),
    fiscal_horsepower: parseNumber(v.fiscal_horsepower),
    seats_count: parseNumber(v.seats_count),
  })) as Vehicule[]) || [];
}

/**
 * Récupérer un véhicule par ID
 * @param id - ID du véhicule
 * @returns Véhicule ou null
 */
export async function getVehiculeById(id: string): Promise<Vehicule | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    // Erreur récupération véhicule
    return null;
  }

  // Utiliser directement les colonnes anglaises (pas de mapping)
  // S'assurer que les valeurs numériques sont bien des nombres
  return {
    ...data,
    price: parseNumber(data.price),
    year: parseNumber(data.year),
    mileage: parseNumber(data.mileage),
    power_hp: parseNumber(data.power_hp),
    fiscal_horsepower: parseNumber(data.fiscal_horsepower),
    seats_count: parseNumber(data.seats_count),
  } as Vehicule;
}

/**
 * Approuver un véhicule (admin uniquement)
 * Cette fonction est utilisée par server-actions/vehicules.ts
 * Le trigger SQL se déclenchera automatiquement pour créer les notifications
 * @param id - ID du véhicule
 * @param supabaseClient - Client Supabase optionnel (pour Server Actions, utilisez le client serveur)
 */
export async function approveVehicule(id: string, supabaseClient?: SupabaseClient): Promise<void> {
  // Utiliser le client fourni (serveur) ou créer un client navigateur
  const supabase = supabaseClient || createClient();

  const { error } = await supabase
    .from("vehicles")
    .update({ status: "active" })
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur approbation véhicule: ${error.message}`);
  }

  // Note: Le trigger SQL `on_vehicule_active_notify_searches` se déclenchera automatiquement
  // et créera les notifications pour les recherches sauvegardées correspondantes
}

/**
 * Rejeter un véhicule (admin uniquement)
 * Cette fonction est utilisée par server-actions/vehicules.ts
 * @param id - ID du véhicule
 * @param rejectionReason - Motif du refus (optionnel, pour logging/email)
 * @param supabaseClient - Client Supabase optionnel (pour Server Actions, utilisez le client serveur)
 */
export async function rejectVehicule(id: string, rejectionReason?: string, supabaseClient?: SupabaseClient): Promise<void> {
  // Utiliser le client fourni (serveur) ou créer un client navigateur
  const supabase = supabaseClient || createClient();

  const { error } = await supabase
    .from("vehicles")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur rejet véhicule: ${error.message}`);
  }

  // TODO: Envoyer un email au vendeur avec le motif si rejectionReason est fourni
  // Pour l'instant, le motif est juste utilisé pour le logging
}

/**
 * Récupérer les véhicules avec pagination (admin)
 * @param page - Numéro de page (commence à 1)
 * @param pageSize - Nombre d'éléments par page
 * @param filters - Filtres optionnels
 * @returns Liste des véhicules et total
 */
export async function getVehiculesPaginated(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    status?: "pending" | "active" | "rejected";
    type?: "car" | "moto";
  }
): Promise<{ data: Vehicule[]; total: number }> {
  const supabase = createClient();

  let query = supabase
    .from("vehicles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Erreur récupération paginée: ${error.message}`);
  }

  // Convertir les colonnes anglaises en français pour le type TypeScript
  return {
    data: ((data || []).map((v: any) => ({
      ...v,
      price: parseNumber(v.price),
      year: parseNumber(v.year),
      mileage: parseNumber(v.mileage),
      power_hp: parseNumber(v.power_hp),
      fiscal_horsepower: parseNumber(v.fiscal_horsepower),
      seats_count: parseNumber(v.seats_count),
    })) as Vehicule[]) || [],
    total: count || 0,
  };
}

/**
 * Vérifier le code de vérification email pour un véhicule invité
 * @param vehiculeId - ID du véhicule
 * @param code - Code de vérification à 6 chiffres
 * @returns True si le code est valide
 */
export async function verifyEmailCode(
  vehiculeId: string,
  code: string
): Promise<boolean> {
  const supabase = createClient();

  // Récupérer le véhicule
  const { data: vehicule, error: fetchError } = await supabase
    .from("vehicles")
    .select("verification_code, verification_code_expires_at, is_email_verified")
    .eq("id", vehiculeId)
    .single();

  if (fetchError || !vehicule) {
    throw new Error("Véhicule introuvable");
  }

  // Vérifier si déjà vérifié
  if (vehicule.is_email_verified) {
    return true; // Déjà vérifié
  }

  // Vérifier si le code existe
  if (!vehicule.verification_code) {
    throw new Error("Aucun code de vérification trouvé");
  }

  // Vérifier l'expiration
  if (vehicule.verification_code_expires_at) {
    const expiresAt = new Date(vehicule.verification_code_expires_at);
    if (expiresAt < new Date()) {
      throw new Error("Code de vérification expiré");
    }
  }

  // Importer la fonction de vérification
  const { verifyCode } = await import("../emailVerification");
  
  // Vérifier le code
  const isValid = verifyCode(code, vehicule.verification_code);

  if (isValid) {
    // Mettre à jour le statut : passer à pending_validation (visible par l'admin)
    const { error: updateError } = await supabase
      .from("vehicles")
      .update({
        is_email_verified: true,
        status: "pending_validation",
        verification_code: null, // Supprimer le code après vérification
        verification_code_expires_at: null,
      })
      .eq("id", vehiculeId);

    if (updateError) {
      throw new Error(`Erreur mise à jour: ${updateError.message}`);
    }
  }

  return isValid;
}

/**
 * Stocker le code de vérification pour un véhicule
 * @param vehiculeId - ID du véhicule
 * @param code - Code de vérification (sera hashé)
 * @param expiresAt - Date d'expiration
 */
export async function storeVerificationCode(
  vehiculeId: string,
  code: string,
  expiresAt: Date
): Promise<void> {
  const supabase = createClient();

  // Importer la fonction de hash
  const { hashVerificationCode } = await import("../emailVerification");
  const hashedCode = hashVerificationCode(code);

  const { error } = await supabase
    .from("vehicles")
    .update({
      verification_code: hashedCode,
      verification_code_expires_at: expiresAt.toISOString(),
    })
    .eq("id", vehiculeId);

  if (error) {
    throw new Error(`Erreur stockage code: ${error.message}`);
  }
}

