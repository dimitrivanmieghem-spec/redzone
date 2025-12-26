"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Calendar,
  ChevronUp,
  ChevronDown,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { getTickets, resolveTicket, deleteTicket, reassignTicket, closeTicket, setTicketInProgress, addAdminReply } from "@/app/actions/tickets";
import { createClient } from "@/lib/supabase/client";

export default function SupportPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"mine" | "all">("mine");
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved" | "closed">("all");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyingToTicket, setReplyingToTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const assignedToFilter = activeTab === "all" && user?.role === "admin" ? "all" : undefined;
      let statusFilter: "open" | "closed" | "resolved" | undefined = undefined;
      if (filter === "open") statusFilter = "open";
      else if (filter === "resolved") statusFilter = "resolved";
      else if (filter === "closed") statusFilter = "closed";
      
      const result = await getTickets({
        status: statusFilter,
        assignedTo: assignedToFilter as "admin" | "moderator" | "all" | undefined,
      });
      
      if (result.success && result.tickets) {
        let filteredTickets = result.tickets;
        if (filter === "in_progress") {
          filteredTickets = filteredTickets.filter((t: any) => t.status === "in_progress");
        }
        setTickets(filteredTickets);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Erreur chargement tickets:", error);
      showToast("Erreur lors du chargement des tickets", "error");
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, filter, user, showToast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    if (!user) return;
    
    const supabase = createClient();
    
    const channel = supabase
      .channel('admin-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        (payload: any) => {
          loadTickets();
          
          if (payload.eventType === 'INSERT' && payload.new) {
            const newTicket = payload.new as any;
            if (newTicket.assigned_to === user?.role || user?.role === 'admin') {
              showToast(`Nouveau ticket ${newTicket.category} reçu`, "info");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showToast, loadTickets]);

  const handleResolve = async (ticketId: string) => {
    if (resolvingId) return;
    setResolvingId(ticketId);
    try {
      const result = await resolveTicket(ticketId);
      if (result.success) {
        showToast("Ticket marqué comme résolu", "success");
        loadTickets();
      } else {
        showToast(result.error || "Erreur", "error");
      }
    } catch (error) {
      console.error("Erreur résolution ticket:", error);
      showToast("Erreur lors de la résolution", "error");
    } finally {
      setResolvingId(null);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible.")) {
      return;
    }
    if (deletingId) return;
    setDeletingId(ticketId);
    try {
      const result = await deleteTicket(ticketId);
      if (result.success) {
        showToast("Ticket supprimé", "success");
        loadTickets();
      } else {
        showToast(result.error || "Erreur", "error");
      }
    } catch (error) {
      console.error("Erreur suppression ticket:", error);
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleClose = async (ticketId: string) => {
    if (closingId) return;
    setClosingId(ticketId);
    try {
      const result = await closeTicket(ticketId);
      if (result.success) {
        showToast("Ticket clôturé", "success");
        loadTickets();
      } else {
        showToast(result.error || "Erreur", "error");
      }
    } catch (error) {
      console.error("Erreur clôture ticket:", error);
      showToast("Erreur lors de la clôture", "error");
    } finally {
      setClosingId(null);
    }
  };

  const handleReassign = async (ticketId: string, newAssignee: "admin" | "moderator") => {
    if (reassigningId) return;
    setReassigningId(ticketId);
    try {
      const result = await reassignTicket(ticketId, newAssignee);
      if (result.success) {
        showToast(`Ticket réassigné à ${newAssignee === "admin" ? "l'admin" : "le modérateur"}`, "success");
        loadTickets();
      } else {
        showToast(result.error || "Erreur", "error");
      }
    } catch (error) {
      console.error("Erreur réassignation ticket:", error);
      showToast("Erreur lors de la réassignation", "error");
    } finally {
      setReassigningId(null);
    }
  };

  const handleSetInProgress = async (ticketId: string) => {
    try {
      const result = await setTicketInProgress(ticketId);
      if (result.success) {
        showToast("Ticket mis en traitement", "success");
        loadTickets();
      } else {
        showToast(result.error || "Erreur", "error");
      }
    } catch (error) {
      console.error("Erreur mise en traitement:", error);
      showToast("Erreur", "error");
    }
  };

  const handleAddReply = async (ticketId: string) => {
    if (!replyText.trim()) {
      showToast("Veuillez saisir une réponse", "error");
      return;
    }
    
    setSubmittingReply(true);
    try {
      const result = await addAdminReply(ticketId, replyText);
      if (result.success) {
        showToast("Réponse envoyée avec succès", "success");
        setReplyText("");
        setReplyingToTicket(null);
        loadTickets();
      } else {
        showToast(result.error || "Erreur lors de l'envoi", "error");
      }
    } catch (error) {
      console.error("Erreur ajout réponse:", error);
      showToast("Erreur lors de l'envoi de la réponse", "error");
    } finally {
      setSubmittingReply(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const myTickets = tickets.filter((t) => t.assigned_to === user?.role);
  const openTickets = tickets.filter((t) => t.status === "open");
  const resolvedTickets = tickets.filter((t) => t.status === "resolved");

  const categoryLabels: Record<string, { label: string; emoji: string; color: string }> = {
    Technique: { label: "Technique", emoji: "🔧", color: "bg-blue-100 text-blue-800 border-blue-200" },
    Contenu: { label: "Contenu", emoji: "📝", color: "bg-orange-100 text-orange-800 border-orange-200" },
    Commercial: { label: "Commercial", emoji: "💼", color: "bg-purple-100 text-purple-800 border-purple-200" },
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="bg-neutral-950 border-b border-white/10 px-8 py-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
          <MessageSquare className="text-red-600" size={28} />
          Support
        </h2>
      </header>

      <div className="p-8">
        <div className="flex items-center gap-4 mb-6 border-b border-white/10">
          <button onClick={() => setActiveTab("mine")} className={`px-6 py-3 font-bold transition-all border-b-2 ${activeTab === "mine" ? "border-red-600 text-red-400" : "border-transparent text-neutral-400 hover:text-white"}`}>
            Mes Tickets
            {myTickets.filter((t) => t.status === "open").length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">{myTickets.filter((t) => t.status === "open").length}</span>
            )}
          </button>
          {user?.role === "admin" && (
            <button onClick={() => setActiveTab("all")} className={`px-6 py-3 font-bold transition-all border-b-2 ${activeTab === "all" ? "border-red-600 text-red-400" : "border-transparent text-neutral-400 hover:text-white"}`}>
              Tous les Tickets
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4 border border-red-500/20">
              <AlertCircle className="text-red-500" size={24} />
            </div>
            <h3 className="text-sm font-medium text-neutral-400 mb-1">Tickets ouverts</h3>
            <p className="text-3xl font-black text-white">{openTickets.length}</p>
          </div>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4 border border-green-500/20">
              <CheckCircle className="text-green-500" size={24} />
            </div>
            <h3 className="text-sm font-medium text-neutral-400 mb-1">Tickets résolus</h3>
            <p className="text-3xl font-black text-white">{resolvedTickets.length}</p>
          </div>
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/20">
              <MessageSquare className="text-blue-500" size={24} />
            </div>
            <h3 className="text-sm font-medium text-neutral-400 mb-1">Total tickets</h3>
            <p className="text-3xl font-black text-white">{tickets.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {(["all", "open", "in_progress", "resolved", "closed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl font-medium transition-all ${filter === f ? "bg-red-600 text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700"}`}>
              {f === "all" ? "Tous" : f === "open" ? "Ouverts" : f === "in_progress" ? "En traitement" : f === "resolved" ? "Résolus" : "Fermés"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="animate-spin text-red-600 mx-auto mb-4" size={32} />
            <p className="text-neutral-400">Chargement des tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-12 text-center">
            <MessageSquare className="text-neutral-500 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold text-white mb-2">Aucun ticket</h3>
            <p className="text-neutral-400">{activeTab === "mine" ? "Aucun ticket ne vous est assigné." : "Aucun ticket ne correspond aux filtres sélectionnés."}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const categoryInfo = categoryLabels[ticket.category] || categoryLabels.Commercial;
              const isResolved = ticket.status === "resolved";
              const isClosed = ticket.status === "closed";
              const isInProgress = ticket.status === "in_progress";
              const isAssignedToMe = ticket.assigned_to === user?.role;
              const isAdmin = user?.role === "admin";
              const isExpanded = expandedTicket === ticket.id;
              
              return (
                <div key={ticket.id} className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 hover:border-neutral-700 transition-all">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${categoryInfo.color}`}>{categoryInfo.emoji} {categoryInfo.label}</span>
                        {isClosed ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                            <XCircle size={12} className="inline mr-1" />
                            Fermé
                          </span>
                        ) : isResolved ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle size={12} className="inline mr-1" />
                            Résolu
                          </span>
                        ) : isInProgress ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Clock size={12} className="inline mr-1" />
                            En traitement
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                            <Clock size={12} className="inline mr-1" />
                            Ouvert
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                          Assigné à: {ticket.assigned_to === "admin" ? "Admin (Dimitri)" : "Modérateur (Antoine)"}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-neutral-400">
                          <Mail size={16} />
                          <span className="font-medium">{ticket.email_contact}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-neutral-400">
                          <Calendar size={16} />
                          <span>{formatDate(ticket.created_at)}</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <p className="text-white whitespace-pre-wrap line-clamp-3">{ticket.message}</p>
                      </div>
                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          <div>
                            <h5 className="text-sm font-bold text-red-500 mb-2">Message complet :</h5>
                            <div className="bg-slate-50 rounded-xl p-4">
                              <p className="text-white whitespace-pre-wrap">{ticket.message}</p>
                            </div>
                          </div>
                          {ticket.admin_reply && (
                            <div className="mb-4">
                              <h5 className="text-sm font-bold text-green-400 mb-2">Réponse du support :</h5>
                              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                <p className="text-green-900 whitespace-pre-wrap">{ticket.admin_reply}</p>
                              </div>
                            </div>
                          )}
                          {ticket.user_reply && (
                            <div className="mb-4">
                              <h5 className="text-sm font-bold text-blue-400 mb-2">Réponse de l'utilisateur :</h5>
                              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                <p className="text-blue-900 whitespace-pre-wrap">{ticket.user_reply}</p>
                              </div>
                            </div>
                          )}
                          {!isClosed && isAssignedToMe && (
                            <div className="mt-4">
                              {replyingToTicket === ticket.id ? (
                                <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700">
                                  <h5 className="text-sm font-bold text-white mb-3">Ajouter une réponse :</h5>
                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Tapez votre réponse ici..."
                                    className="w-full min-h-[120px] p-3 border border-neutral-700 bg-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-y text-white placeholder:text-neutral-500"
                                    disabled={submittingReply}
                                  />
                                  <div className="flex items-center gap-2 mt-3">
                                    <button
                                      onClick={() => handleAddReply(ticket.id)}
                                      disabled={submittingReply || !replyText.trim()}
                                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {submittingReply ? (
                                        <>
                                          <Loader2 size={16} className="animate-spin" />
                                          Envoi...
                                        </>
                                      ) : (
                                        <>
                                          <Send size={16} />
                                          Envoyer la réponse
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReplyingToTicket(null);
                                        setReplyText("");
                                      }}
                                      disabled={submittingReply}
                                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 border border-neutral-700"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setReplyingToTicket(ticket.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
                                >
                                  <MessageSquare size={16} />
                                  {ticket.admin_reply ? "Modifier la réponse" : "Ajouter une réponse"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col gap-2">
                      <button
                        onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl transition-all border border-neutral-700"
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        {isExpanded ? "Réduire" : "Détails"}
                      </button>
                      {!isClosed && isAssignedToMe && (
                        <>
                          {!isInProgress && ticket.status === "open" && (
                            <button
                              onClick={() => handleSetInProgress(ticket.id)}
                              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all"
                            >
                              <Clock size={18} />
                              En traitement
                            </button>
                          )}
                          <button
                            onClick={() => handleResolve(ticket.id)}
                            disabled={resolvingId === ticket.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resolvingId === ticket.id ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                Traitement...
                              </>
                            ) : (
                              <>
                                <CheckCircle size={18} />
                                Résoudre
                              </>
                            )}
                          </button>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          {!isClosed && (
                            <>
                              <button
                                onClick={() => handleReassign(ticket.id, ticket.assigned_to === "admin" ? "moderator" : "admin")}
                                disabled={reassigningId === ticket.id}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {reassigningId === ticket.id ? (
                                  <>
                                    <Loader2 size={18} className="animate-spin" />
                                    ...
                                  </>
                                ) : (
                                  <>
                                    <Users size={18} />
                                    {ticket.assigned_to === "admin" ? "→ Modérateur" : "→ Admin"}
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleClose(ticket.id)}
                                disabled={closingId === ticket.id}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-600"
                              >
                                {closingId === ticket.id ? (
                                  <>
                                    <Loader2 size={18} className="animate-spin" />
                                    ...
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={18} />
                                    Clôturer
                                  </>
                                )}
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(ticket.id)}
                            disabled={deletingId === ticket.id}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === ticket.id ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                Suppression...
                              </>
                            ) : (
                              <>
                                <Trash2 size={18} />
                                Supprimer
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

