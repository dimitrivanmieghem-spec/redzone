// RedZone - Actions Supabase pour les Véhicules

import { createClient } from "./client";
import { Vehicule, VehiculeInsert, VehiculeUpdate } from "./types";
import { validateVehiculeData, sanitizeVehiculeData } from "../validation";
import { requireAdmin } from "./auth-utils";

/**
 * Créer un nouveau véhicule
 * @param vehicule - Données du véhicule
 * @param userId - ID de l'utilisateur (optionnel si invité)
 * @param guestEmail - Email de l'invité (obligatoire si userId est null)
 * @returns ID du véhicule créé
 */
export async function createVehicule(
  vehicule: Omit<VehiculeInsert, "id" | "user_id" | "status" | "created_at" | "guest_email">,
  userId: string | null = null,
  guestEmail: string | null = null
): Promise<string> {
  // Validation : soit userId soit guestEmail doit être présent
  if (!userId && !guestEmail) {
    throw new Error("userId ou guestEmail doit être fourni");
  }

  if (!userId && (!guestEmail || !guestEmail.includes('@'))) {
    throw new Error("guestEmail doit être un email valide si userId n'est pas fourni");
  }

  // Validation des données
  const validation = validateVehiculeData({
    marque: vehicule.marque,
    modele: vehicule.modele,
    prix: vehicule.prix,
    annee: vehicule.annee,
    km: vehicule.km,
    description: vehicule.description || undefined,
    car_pass_url: vehicule.car_pass_url || undefined,
    contact_email: vehicule.contact_email || undefined,
    telephone: vehicule.telephone || undefined,
    contact_methods: vehicule.contact_methods || undefined,
  });

  if (!validation.isValid) {
    throw new Error(
      `Données invalides: ${validation.errors.join(", ")}`
    );
  }

  // Sanitization des données
  const sanitized = sanitizeVehiculeData(vehicule);

  const supabase = createClient();

  // Déterminer le statut selon le type d'utilisateur
  // Pour les invités : pending_validation (exigé par la politique RLS)
  // Pour les utilisateurs connectés : pending (en attente de validation admin)
  const status = userId ? "pending" : "pending_validation";

  const { data, error } = await supabase
    .from("vehicules")
    .insert({
      ...sanitized,
      user_id: userId || null,
      guest_email: guestEmail || null,
      status: status,
      // Pour les invités, stocker l'email de contact
      email_contact: !userId ? guestEmail : null,
      is_email_verified: false,
    })
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
 */
export async function updateVehicule(
  id: string,
  updates: VehiculeUpdate
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("vehicules")
    .update(updates)
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

  const { error } = await supabase.from("vehicules").delete().eq("id", id);

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
    .from("vehicules")
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

  return (data as Vehicule[]) || [];
}

/**
 * Récupérer un véhicule par ID
 * @param id - ID du véhicule
 * @returns Véhicule ou null
 */
export async function getVehiculeById(id: string): Promise<Vehicule | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("vehicules")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erreur récupération véhicule:", error);
    return null;
  }

  return data as Vehicule;
}

/**
 * Approuver un véhicule (admin uniquement)
 * @param id - ID du véhicule
 */
export async function approveVehicule(id: string): Promise<void> {
  // Vérification admin côté code (défense en profondeur)
  await requireAdmin();
  
  const supabase = createClient();
  
  const { error } = await supabase
    .from("vehicules")
    .update({ status: "active" })
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur approbation: ${error.message}`);
  }
}

/**
 * Rejeter un véhicule (admin uniquement)
 * @param id - ID du véhicule
 */
export async function rejectVehicule(id: string): Promise<void> {
  // Vérification admin côté code (défense en profondeur)
  await requireAdmin();
  
  const supabase = createClient();
  
  const { error } = await supabase
    .from("vehicules")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur rejet: ${error.message}`);
  }
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
    .from("vehicules")
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

  return {
    data: (data as Vehicule[]) || [],
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
    .from("vehicules")
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
      .from("vehicules")
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
    .from("vehicules")
    .update({
      verification_code: hashedCode,
      verification_code_expires_at: expiresAt.toISOString(),
    })
    .eq("id", vehiculeId);

  if (error) {
    throw new Error(`Erreur stockage code: ${error.message}`);
  }
}

