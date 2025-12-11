"use server";

import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dimitri@gmail.com"; // À remplacer par votre email

/**
 * Créer un nouveau ticket
 */
export async function createTicket(data: {
  email: string;
  subject: "bug" | "question" | "signalement" | "autre";
  message: string;
}): Promise<{ success: boolean; error?: string; ticketId?: string }> {
  try {
    const supabase = await createClient();
    
    // Récupérer l'utilisateur connecté (peut être null pour invités)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Créer le ticket
    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        user_id: user?.id || null,
        email_contact: data.email,
        subject: data.subject,
        message: data.message,
        status: "open",
      })
      .select("id")
      .single();
    
    if (error) {
      console.error("Erreur création ticket:", error);
      return { success: false, error: error.message };
    }
    
    // Envoyer une notification email à l'admin via Resend
    if (resend) {
      try {
        const subjectLabels: Record<string, string> = {
          bug: "🐛 Bug",
          question: "❓ Question",
          signalement: "⚠️ Signalement",
          autre: "📧 Autre",
        };
        
        await resend.emails.send({
          from: "RedZone Support <onboarding@resend.dev>", // À configurer avec votre domaine
          to: ADMIN_EMAIL,
          subject: `Nouveau Ticket de ${data.email} : ${subjectLabels[data.subject] || data.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #dc2626;">Nouveau Ticket RedZone</h1>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Email :</strong> ${data.email}</p>
                <p><strong>Sujet :</strong> ${subjectLabels[data.subject] || data.subject}</p>
                <p><strong>ID Ticket :</strong> ${ticket.id}</p>
              </div>
              <div style="background: #fff; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0;">
                <h3 style="color: #1f2937;">Message :</h3>
                <p style="white-space: pre-wrap; color: #4b5563;">${data.message}</p>
              </div>
              <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
                Connectez-vous au panel admin pour répondre à ce ticket.
              </p>
            </div>
          `,
        });
        
        console.log(`✅ Notification email envoyée à l'admin pour le ticket ${ticket.id}`);
      } catch (emailError) {
        // Ne pas faire échouer la création du ticket si l'email échoue
        console.error("Erreur envoi email notification:", emailError);
      }
    } else {
      // Mode simulation si Resend n'est pas configuré
      console.log("=".repeat(60));
      console.log("📧 NOTIFICATION TICKET (SIMULATION)");
      console.log("=".repeat(60));
      console.log(`Destinataire: ${ADMIN_EMAIL}`);
      console.log(`Sujet: Nouveau Ticket de ${data.email} : ${data.subject}`);
      console.log(`ID Ticket: ${ticket.id}`);
      console.log(`Message: ${data.message}`);
      console.log("=".repeat(60));
    }
    
    return { success: true, ticketId: ticket.id };
  } catch (error) {
    console.error("Erreur création ticket:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Marquer un ticket comme résolu (admin uniquement)
 */
export async function resolveTicket(ticketId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Non autorisé" };
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (profile?.role !== "admin") {
      return { success: false, error: "Accès refusé - Admin uniquement" };
    }
    
    // Mettre à jour le ticket
    const { error } = await supabase
      .from("tickets")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq("id", ticketId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erreur résolution ticket:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Récupérer tous les tickets (admin uniquement)
 */
export async function getTickets(filters?: {
  status?: "open" | "closed" | "resolved";
}): Promise<{ success: boolean; tickets?: any[]; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Non autorisé" };
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (profile?.role !== "admin") {
      return { success: false, error: "Accès refusé - Admin uniquement" };
    }
    
    let query = supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    
    const { data: tickets, error } = await query;
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, tickets: tickets || [] };
  } catch (error) {
    console.error("Erreur récupération tickets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

