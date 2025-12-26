// Octane98 - Fonctions pour les Tickets (Utilisateur)

import { createClient } from "./client";

export interface UserTicket {
  id: string;
  created_at: string;
  updated_at?: string;
  user_id: string | null;
  email_contact: string;
  subject: string;
  category: "Technique" | "Contenu" | "Commercial";
  message: string;
  status: "open" | "in_progress" | "closed" | "resolved";
  admin_notes: string | null;
  admin_reply: string | null;
  user_reply: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  closed_at: string | null;
  closed_by: string | null;
  assigned_to: "admin" | "moderator";
}

/**
 * Récupérer les tickets de l'utilisateur connecté
 */
export async function getUserTickets(): Promise<UserTicket[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur récupération tickets:", error);
    return [];
  }

  return (data as UserTicket[]) || [];
}

