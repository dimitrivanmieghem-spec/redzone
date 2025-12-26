// Octane98 - Actions Supabase pour la Gestion de la FAQ

import { createClient } from "./client";

export interface FAQItem {
  id: string;
  created_at: string;
  updated_at: string;
  question: string;
  answer: string;
  order: number;
  is_active: boolean;
}

export interface FAQItemInsert {
  question: string;
  answer: string;
  order?: number;
  is_active?: boolean;
}

export interface FAQItemUpdate {
  question?: string;
  answer?: string;
  order?: number;
  is_active?: boolean;
}

/**
 * Récupérer toutes les FAQ actives (publique)
 * @returns Liste des FAQ actives, triées par ordre
 */
export async function getActiveFAQ(): Promise<FAQItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("faq_items")
    .select("*")
    .eq("is_active", true)
    .order("order", { ascending: true });

  if (error) {
    console.error("Erreur récupération FAQ:", error);
    return [];
  }

  return (data as FAQItem[]) || [];
}

/**
 * Récupérer toutes les FAQ (admin uniquement)
 * @returns Liste de toutes les FAQ
 */
export async function getAllFAQ(): Promise<FAQItem[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("faq_items")
    .select("*")
    .order("order", { ascending: true });

  if (error) {
    throw new Error(`Erreur récupération FAQ: ${error.message}`);
  }

  return (data as FAQItem[]) || [];
}

/**
 * Créer une nouvelle FAQ (admin uniquement)
 * @param item - Données de la FAQ
 * @returns ID de la FAQ créée
 */
export async function createFAQItem(item: FAQItemInsert): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("faq_items")
    .insert({
      question: item.question,
      answer: item.answer,
      order: item.order ?? 0,
      is_active: item.is_active ?? true,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Erreur création FAQ: ${error.message}`);
  }

  return data.id;
}

/**
 * Mettre à jour une FAQ (admin uniquement)
 * @param id - ID de la FAQ
 * @param updates - Champs à mettre à jour
 */
export async function updateFAQItem(
  id: string,
  updates: FAQItemUpdate
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("faq_items")
    .update(updates)
    .eq("id", id);

  if (error) {
    throw new Error(`Erreur mise à jour FAQ: ${error.message}`);
  }
}

/**
 * Supprimer une FAQ (admin uniquement)
 * @param id - ID de la FAQ
 */
export async function deleteFAQItem(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("faq_items").delete().eq("id", id);

  if (error) {
    throw new Error(`Erreur suppression FAQ: ${error.message}`);
  }
}

