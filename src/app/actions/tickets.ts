"use server";

import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { createNotification } from "@/lib/supabase/notifications-server";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@octane98.be";

/**
 * Créer un nouveau ticket avec routage automatique
 */
export async function createTicket(data: {
  email: string;
  category: "Technique" | "Contenu" | "Commercial";
  message: string;
  subject?: "bug" | "question" | "signalement" | "autre"; // Garder pour compatibilité
}): Promise<{ success: boolean; error?: string; ticketId?: string }> {
  try {
    const supabase = await createClient();
    
    // Récupérer l'utilisateur connecté (peut être null pour invités)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Déterminer la catégorie et le routage automatique
    // Si category est fournie, l'utiliser directement, sinon mapper depuis subject (compatibilité)
    const category = data.category || (data.subject === "bug" ? "Technique" : data.subject === "signalement" ? "Contenu" : "Commercial");
    
    // Routage automatique selon la catégorie
    // Technique -> admin, Contenu -> moderator, Commercial -> admin
    const assignedTo = category === "Contenu" ? "moderator" : "admin";
    
    // Mapper category vers subject pour compatibilité avec l'ancienne structure
    const subject = data.subject || (category === "Technique" ? "bug" : category === "Contenu" ? "signalement" : "question");
    
    // Créer le ticket
    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        user_id: user?.id || null,
        email_contact: data.email,
        subject: subject,
        category: category,
        assigned_to: assignedTo,
        message: data.message,
        status: "open",
      })
      .select("id")
      .single();
    
    if (error) {
      console.error("Erreur création ticket:", error);
      return { success: false, error: error.message };
    }
    
    // Envoyer un email de confirmation à l'utilisateur
    if (resend) {
      try {
        await resend.emails.send({
          from: "Octane98 Support <onboarding@resend.dev>",
          to: data.email,
          subject: "Votre ticket de support a été créé - Octane98",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #dc2626;">Ticket de Support Créé</h1>
              <p style="color: #4b5563; font-size: 16px;">Bonjour,</p>
              <p style="color: #4b5563; font-size: 16px;">Votre ticket de support a été créé avec succès. Nous vous répondrons dans les plus brefs délais.</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>ID Ticket :</strong> ${ticket.id}</p>
                <p style="margin: 5px 0 0 0;"><strong>Catégorie :</strong> ${category}</p>
                <p style="margin: 5px 0 0 0;"><strong>Statut :</strong> Reçu</p>
              </div>
              <div style="background: #fff; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0;">
                <h3 style="color: #1f2937;">Votre message :</h3>
                <p style="white-space: pre-wrap; color: #4b5563;">${data.message}</p>
              </div>
              <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
                Vous pouvez suivre l'état de votre ticket depuis votre espace membre.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Erreur envoi email confirmation:", emailError);
      }
    }

    // Envoyer une notification email à l'admin/modérateur via Resend
    if (resend) {
      try {
        const categoryLabels: Record<string, string> = {
          Technique: "🔧 Technique (Bug)",
          Contenu: "📝 Contenu (Signalement)",
          Commercial: "💼 Commercial (Question)",
        };
        
        // Envoyer l'email au bon destinataire selon le routage
        const recipientEmail = assignedTo === "moderator" 
          ? (process.env.MODERATOR_EMAIL || ADMIN_EMAIL) 
          : ADMIN_EMAIL;
        
        await resend.emails.send({
          from: "Octane98 Support <onboarding@resend.dev>",
          to: recipientEmail,
          subject: `🚨 Nouveau Ticket [${categoryLabels[category] || category}] de ${data.email}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #dc2626;">Nouveau Ticket Octane98</h1>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Email :</strong> ${data.email}</p>
                <p><strong>Catégorie :</strong> ${categoryLabels[category] || category}</p>
                <p><strong>Assigné à :</strong> ${assignedTo === "admin" ? "Admin (Dimitri)" : "Modérateur (Antoine)"}</p>
                <p><strong>ID Ticket :</strong> ${ticket.id}</p>
              </div>
              <div style="background: #fff; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0;">
                <h3 style="color: #1f2937;">Message :</h3>
                <p style="white-space: pre-wrap; color: #4b5563;">${data.message}</p>
              </div>
              <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin?tab=support" style="color: #dc2626; text-decoration: none; font-weight: bold;">Connectez-vous au panel admin pour répondre à ce ticket →</a>
              </p>
            </div>
          `,
        });
        
      } catch (emailError) {
        console.error("Erreur envoi email notification admin:", emailError);
      }
    }

    // Créer une notification pour l'admin/modérateur assigné
    try {
      // Récupérer l'ID de l'admin ou modérateur assigné
      const { data: assignedUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", assignedTo)
        .limit(1)
        .single();

      if (assignedUser) {
        await createNotification(
          assignedUser.id,
          "Nouveau ticket de support",
          `Un nouveau ticket ${category} a été créé par ${data.email}. ID: ${ticket.id}`,
          "info",
          `/admin?tab=support`,
          { ticket_id: ticket.id, category, assigned_to: assignedTo }
        );
      }
    } catch (notifError) {
      console.error("Erreur création notification:", notifError);
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
 * Marquer un ticket comme résolu (admin ou moderator selon l'assignation)
 */
export async function resolveTicket(ticketId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est admin ou moderator
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Non autorisé" };
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
      return { success: false, error: "Accès refusé - Admin ou Modérateur requis" };
    }
    
    // Vérifier que le ticket est assigné à ce rôle (sauf pour admin qui peut tout faire)
    if (profile.role === "moderator") {
      const { data: ticketCheck } = await supabase
        .from("tickets")
        .select("assigned_to")
        .eq("id", ticketId)
        .single();
      
      if (ticketCheck?.assigned_to !== "moderator") {
        return { success: false, error: "Ce ticket n'est pas assigné à votre rôle" };
      }
    }
    
    // Récupérer les infos du ticket avant mise à jour pour la notification
    const { data: ticket } = await supabase
      .from("tickets")
      .select("user_id, subject, category")
      .eq("id", ticketId)
      .single();
    
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
    
    // Créer une notification pour le créateur du ticket
    if (ticket && ticket.user_id) {
      const categoryLabels: Record<string, string> = {
        Technique: "votre ticket technique",
        Contenu: "votre signalement",
        Commercial: "votre question commerciale",
      };
      
      const ticketLabel = categoryLabels[ticket.category] || "votre ticket";
      
      await createNotification(
        ticket.user_id,
        "Ticket résolu",
        `Le support a résolu ${ticketLabel} : ${ticket.subject || "Demande traitée"}`,
        "success",
        undefined, // Pas de lien pour les tickets
        { ticket_id: ticketId, action: "resolve" }
      );
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
 * Récupérer les tickets selon le rôle de l'utilisateur
 * - Admin : peut voir tous les tickets OU seulement ceux assignés à 'admin'
 * - Moderator : peut voir seulement ceux assignés à 'moderator'
 */
export async function getTickets(filters?: {
  status?: "open" | "in_progress" | "closed" | "resolved";
  assignedTo?: "admin" | "moderator" | "all"; // Nouveau filtre
}): Promise<{ success: boolean; tickets?: any[]; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Vérifier que l'utilisateur est admin ou moderator
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Non autorisé" };
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
      return { success: false, error: "Accès refusé - Admin ou Modérateur requis" };
    }
    
    let query = supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Filtrage par statut
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    
    // Filtrage par assignation
    // Si assignedTo est "all" ou non spécifié ET que l'utilisateur est admin, voir tous les tickets
    // Sinon, filtrer selon le rôle de l'utilisateur
    if (filters?.assignedTo === "all" && profile.role === "admin") {
      // Admin peut voir tous les tickets - pas de filtre
    } else {
      // Filtrer selon le rôle (moderator voit seulement moderator, admin voit seulement admin par défaut)
      const assignedToFilter = filters?.assignedTo || profile.role;
      if (assignedToFilter !== "all") {
        query = query.eq("assigned_to", assignedToFilter);
      }
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

/**
 * Supprimer un ticket (admin uniquement)
 */
export async function deleteTicket(ticketId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non autorisé" };
    
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "admin") return { success: false, error: "Accès refusé - Admin requis" };
    
    const { error } = await supabase.from("tickets").delete().eq("id", ticketId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

/**
 * Rediriger un ticket vers un autre rôle (admin uniquement)
 */
export async function reassignTicket(ticketId: string, newAssignee: "admin" | "moderator"): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non autorisé" };
    
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "admin") return { success: false, error: "Accès refusé - Admin requis" };
    
    const { data: ticket } = await supabase.from("tickets").select("user_id, category, email_contact").eq("id", ticketId).single();
    if (!ticket) return { success: false, error: "Ticket introuvable" };
    
    const { error } = await supabase.from("tickets").update({ assigned_to: newAssignee, status: "open" }).eq("id", ticketId);
    if (error) return { success: false, error: error.message };
    
    try {
      const { data: assignedUser } = await supabase.from("profiles").select("id").eq("role", newAssignee).limit(1).single();
      if (assignedUser) {
        await createNotification(assignedUser.id, "Ticket réassigné", `Un ticket ${ticket.category} vous a été réassigné. ID: ${ticketId}`, "info", `/admin?tab=support`, { ticket_id: ticketId, category: ticket.category, assigned_to: newAssignee });
      }
    } catch (notifError) {
      console.error("Erreur création notification réassignation:", notifError);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

/**
 * Clôturer un ticket (admin uniquement)
 */
export async function closeTicket(ticketId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non autorisé" };
    
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || profile.role !== "admin") return { success: false, error: "Accès refusé - Admin requis" };
    
    const { data: ticket } = await supabase.from("tickets").select("user_id, subject, category").eq("id", ticketId).single();
    const { error } = await supabase.from("tickets").update({ status: "closed", closed_at: new Date().toISOString(), closed_by: user.id }).eq("id", ticketId);
    if (error) return { success: false, error: error.message };
    
    if (ticket && ticket.user_id) {
      await createNotification(ticket.user_id, "Ticket clôturé", `Votre ticket ${ticket.category} a été clôturé. ID: ${ticketId}`, "info", `/dashboard?tab=support`, { ticket_id: ticketId, action: "close" });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

/**
 * Mettre un ticket en cours de traitement
 */
export async function setTicketInProgress(ticketId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non autorisé" };
    
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) return { success: false, error: "Accès refusé - Admin ou Modérateur requis" };
    
    // Récupérer les infos du ticket avant mise à jour pour la notification
    const { data: ticket } = await supabase
      .from("tickets")
      .select("user_id, category")
      .eq("id", ticketId)
      .single();
    
    const { error } = await supabase.from("tickets").update({ status: "in_progress" }).eq("id", ticketId);
    if (error) return { success: false, error: error.message };
    
    // Créer une notification pour le créateur du ticket
    if (ticket && ticket.user_id) {
      await createNotification(
        ticket.user_id,
        "Ticket en cours de traitement",
        `Votre ticket ${ticket.category} est maintenant en cours de traitement. ID: ${ticketId}`,
        "info",
        `/dashboard?tab=support`,
        { ticket_id: ticketId, action: "in_progress" }
      );
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

/**
 * Ajouter une réponse admin à un ticket
 */
export async function addAdminReply(ticketId: string, reply: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non autorisé" };
    
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || (profile.role !== "admin" && profile.role !== "moderator")) {
      return { success: false, error: "Accès refusé - Admin ou Modérateur requis" };
    }
    
    if (!reply || reply.trim().length === 0) {
      return { success: false, error: "La réponse ne peut pas être vide" };
    }
    
    // Récupérer les infos du ticket avant mise à jour pour la notification
    const { data: ticket } = await supabase
      .from("tickets")
      .select("user_id, category, subject, email_contact")
      .eq("id", ticketId)
      .single();
    
    if (!ticket) {
      return { success: false, error: "Ticket introuvable" };
    }
    
    // Mettre à jour le ticket avec la réponse
    const { error } = await supabase
      .from("tickets")
      .update({ 
        admin_reply: reply.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("id", ticketId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    // Créer une notification pour le créateur du ticket
    if (ticket.user_id) {
      const categoryLabels: Record<string, string> = {
        Technique: "votre ticket technique",
        Contenu: "votre signalement",
        Commercial: "votre question commerciale",
      };
      
      const ticketLabel = categoryLabels[ticket.category] || "votre ticket";
      
      await createNotification(
        ticket.user_id,
        "Réponse à votre ticket",
        `Le support a répondu à ${ticketLabel} : ${ticket.subject || "Demande"}`,
        "success",
        `/dashboard?tab=support`,
        { ticket_id: ticketId, action: "reply" }
      );
    }
    
    // Envoyer un email de notification si possible
    if (resend && ticket.email_contact) {
      try {
        await resend.emails.send({
          from: "AutoMarket <noreply@automarket.be>",
          to: ticket.email_contact,
          subject: `Réponse à votre ticket - ${ticket.subject || "Support"}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Réponse à votre ticket</h2>
              <p>Bonjour,</p>
              <p>Le support a répondu à votre ticket : <strong>${ticket.subject || "Demande"}</strong></p>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="white-space: pre-wrap; margin: 0;">${reply.trim()}</p>
              </div>
              <p>Vous pouvez consulter votre ticket et répondre depuis votre <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?tab=support" style="color: #dc2626;">tableau de bord</a>.</p>
              <p>Cordialement,<br>L'équipe AutoMarket</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Erreur envoi email notification:", emailError);
        // Ne pas bloquer si l'email échoue
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

/**
 * Ajouter une réponse utilisateur à un ticket
 */
export async function addUserReply(ticketId: string, reply: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Non autorisé" };
    
    if (!reply || reply.trim().length === 0) {
      return { success: false, error: "La réponse ne peut pas être vide" };
    }
    
    // Vérifier que le ticket appartient à l'utilisateur
    const { data: ticket } = await supabase
      .from("tickets")
      .select("user_id, category, subject, email_contact, assigned_to, status")
      .eq("id", ticketId)
      .single();
    
    if (!ticket) {
      return { success: false, error: "Ticket introuvable" };
    }
    
    // Vérifier que l'utilisateur est le propriétaire du ticket
    if (ticket.user_id !== user.id) {
      return { success: false, error: "Vous n'êtes pas autorisé à répondre à ce ticket" };
    }
    
    // Vérifier que le ticket n'est pas fermé
    if (ticket.status === "closed") {
      return { success: false, error: "Ce ticket est fermé, vous ne pouvez plus y répondre" };
    }
    
    // Mettre à jour le ticket avec la réponse utilisateur
    const { error } = await supabase
      .from("tickets")
      .update({ 
        user_reply: reply.trim(),
        updated_at: new Date().toISOString(),
        status: "open" // Remettre le ticket en "open" pour indiquer qu'il y a une nouvelle réponse
      })
      .eq("id", ticketId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    // Créer une notification pour l'admin/moderator assigné
    try {
      const { data: assignedUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", ticket.assigned_to)
        .limit(1)
        .single();
      
      if (assignedUser) {
        await createNotification(
          assignedUser.id,
          "Nouvelle réponse utilisateur",
          `L'utilisateur a répondu au ticket ${ticket.category} : ${ticket.subject || "Demande"}`,
          "info",
          `/admin?tab=support`,
          { ticket_id: ticketId, action: "user_reply" }
        );
      }
    } catch (notifError) {
      console.error("Erreur création notification réponse utilisateur:", notifError);
      // Ne pas bloquer si la notification échoue
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Erreur inconnue" };
  }
}

