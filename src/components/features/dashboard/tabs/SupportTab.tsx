"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  CheckCircle,
  X,
  Clock,
  Loader2,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { getUserTickets } from "@/lib/supabase/tickets";
import type { UserTicket } from "@/lib/supabase/tickets";
import { createTicket, addUserReply } from "@/app/actions/tickets";
import { createClient } from "@/lib/supabase/client";

interface SupportTabProps {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export default function SupportTab({ user }: SupportTabProps) {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingToTicket, setReplyingToTicket] = useState<string | null>(null);
  const [userReplyText, setUserReplyText] = useState<string>("");
  const [submittingUserReply, setSubmittingUserReply] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    category: "Commercial" as "Technique" | "Contenu" | "Commercial",
    message: "",
  });

  // Charger les tickets
  const loadTickets = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const userTickets = await getUserTickets();
      setTickets(userTickets);
    } catch (error) {
      console.error("Erreur chargement tickets:", error);
      showToast("Erreur lors du chargement des tickets", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [user, showToast]);

  // Subscription en temps réel pour les tickets de l'utilisateur
  useEffect(() => {
    if (!user) return;
    
    const supabase = createClient();
    
    // Créer la subscription pour les changements sur les tickets de l'utilisateur
    const channel = supabase
      .channel('user-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Tous les événements (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tickets',
          filter: `user_id=eq.${user.id}`, // Seulement les tickets de cet utilisateur
        },
        (payload: any) => {
          // Recharger les tickets après un changement
          loadTickets();
          
          // Afficher une notification pour les mises à jour
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedTicket = payload.new as any;
            if (updatedTicket.status === 'resolved') {
              showToast("Votre ticket a été résolu !", "success");
            } else if (updatedTicket.status === 'closed') {
              showToast("Votre ticket a été clôturé", "info");
            } else if (updatedTicket.status === 'in_progress') {
              showToast("Votre ticket est en cours de traitement", "info");
            } else if (updatedTicket.admin_reply) {
              showToast("Vous avez reçu une réponse à votre ticket", "success");
            }
          } else if (payload.eventType === 'INSERT' && payload.new) {
            showToast("Votre ticket a été créé avec succès", "success");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, showToast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1.5 bg-green-600/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full border border-green-600/30">
            <CheckCircle size={12} />
            Résolu
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-600/20 text-slate-400 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-600/30">
            <X size={12} />
            Fermé
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-600/20 text-blue-400 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-600/30">
            <Clock size={12} />
            En traitement
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-600/20 text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-600/30">
            <Clock size={12} />
            Reçu
          </span>
        );
    }
  };

  // Fonction pour obtenir le pourcentage de progression du ticket
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "open":
        return 25; // Reçu
      case "in_progress":
        return 50; // En traitement
      case "resolved":
        return 75; // Résolu
      case "closed":
        return 100; // Fermé
      default:
        return 0;
    }
  };

  // Fonction pour obtenir les étapes de progression
  const getProgressSteps = (status: string) => {
    const steps = [
      { label: "Reçu", status: "open", completed: true },
      { label: "En traitement", status: "in_progress", completed: status !== "open" },
      { label: "Résolu", status: "resolved", completed: status === "resolved" || status === "closed" },
      { label: "Fermé", status: "closed", completed: status === "closed" },
    ];
    return steps;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "Technique":
        return "🐛 Technique";
      case "Contenu":
        return "📝 Contenu";
      case "Commercial":
        return "💼 Commercial";
      default:
        return category;
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createTicket({
        email: formData.email,
        category: formData.category,
        message: formData.message,
      });

      if (result.success) {
        showToast("Ticket créé avec succès !", "success");
        setFormData({
          email: user?.email || "",
          category: "Commercial",
          message: "",
        });
        setShowCreateForm(false);
        // Recharger les tickets
        const userTickets = await getUserTickets();
        setTickets(userTickets);
      } else {
        showToast(result.error || "Erreur lors de la création du ticket", "error");
      }
    } catch (error) {
      console.error("Erreur création ticket:", error);
      showToast("Erreur lors de la création du ticket", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserReply = async (ticketId: string) => {
    if (!userReplyText.trim()) {
      showToast("Veuillez saisir une réponse", "error");
      return;
    }
    
    setSubmittingUserReply(true);
    try {
      const result = await addUserReply(ticketId, userReplyText);
      if (result.success) {
        showToast("Réponse envoyée avec succès", "success");
        setUserReplyText("");
        setReplyingToTicket(null);
        // Recharger les tickets
        const userTickets = await getUserTickets();
        setTickets(userTickets);
      } else {
        showToast(result.error || "Erreur lors de l'envoi", "error");
      }
    } catch (error) {
      console.error("Erreur ajout réponse utilisateur:", error);
      showToast("Erreur lors de l'envoi de la réponse", "error");
    } finally {
      setSubmittingUserReply(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
          Support
        </h1>
        <p className="text-slate-400 mb-8">
          Gérez vos tickets de support
        </p>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-red-600" size={48} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Support
          </h1>
          <p className="text-slate-400">
            Créez et suivez vos tickets de support
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <MessageSquare size={18} />
            Créer un ticket
          </button>
        )}
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="mb-8 bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white">Nouveau Ticket</h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setFormData({
                  email: user?.email || "",
                  category: "Commercial",
                  message: "",
                });
              }}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center"
            >
              <X size={20} className="text-slate-300" />
            </button>
          </div>

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Email <span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
                placeholder="votre@email.com"
                disabled={!!user?.email}
              />
              {user?.email && (
                <p className="text-xs text-slate-500 mt-1">Email de votre compte connecté</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Catégorie <span className="text-red-600">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value as "Technique" | "Contenu" | "Commercial",
                  }))
                }
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white"
              >
                <option value="Technique">🔧 Technique (Bug, Problème technique)</option>
                <option value="Contenu">📝 Contenu (Signalement annonce/utilisateur)</option>
                <option value="Commercial">💼 Commercial (Question, Facturation)</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {formData.category === "Technique" && "→ Routé vers l'Admin (Dimitri)"}
                {formData.category === "Contenu" && "→ Routé vers le Modérateur (Antoine)"}
                {formData.category === "Commercial" && "→ Routé vers l'Admin (Dimitri)"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">
                Message <span className="text-red-600">*</span>
              </label>
              <textarea
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-xl focus:outline-none focus:border-red-600 text-white resize-none"
                placeholder="Décrivez votre problème ou votre question..."
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Envoyer
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({
                    email: user?.email || "",
                    category: "Commercial",
                    message: "",
                  });
                }}
                className="px-6 py-4 border-2 border-slate-700 hover:border-slate-600 text-slate-300 font-bold rounded-xl transition-all"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des tickets */}
      {tickets.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <MessageSquare size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-bold text-lg mb-2">Aucun ticket</h3>
          <p className="text-slate-400 mb-6">
            Vous n&apos;avez pas encore créé de ticket de support.
          </p>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              <MessageSquare size={18} />
              Créer un ticket
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors"
            >
              {/* Header du ticket */}
              <div
                className="p-6 cursor-pointer"
                onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-slate-400 text-sm font-medium">
                        {getCategoryLabel(ticket.category)}
                      </span>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <h3 className="text-white font-bold text-lg mb-2">
                      {ticket.subject === "bug" ? "🐛 Bug" : 
                       ticket.subject === "question" ? "❓ Question" :
                       ticket.subject === "signalement" ? "🚨 Signalement" :
                       ticket.subject}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2">
                      {ticket.message}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-slate-500 text-xs">
                      <span>
                        Créé le {new Date(ticket.created_at).toLocaleDateString("fr-BE", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {ticket.resolved_at && (
                        <span>
                          Résolu le {new Date(ticket.resolved_at).toLocaleDateString("fr-BE", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-white transition-colors">
                    {expandedTicket === ticket.id ? (
                      <ChevronUp size={24} />
                    ) : (
                      <ChevronDown size={24} />
                    )}
                  </button>
                </div>
              </div>

              {/* Contenu détaillé */}
              {expandedTicket === ticket.id && (
                <div className="border-t border-slate-800 p-6 space-y-6">
                  {/* Barre de suivi */}
                  <div>
                    <h4 className="text-slate-300 font-bold text-sm mb-4 uppercase tracking-wide">
                      Suivi du ticket
                    </h4>
                    <div className="bg-slate-800/50 rounded-xl p-6">
                      {/* Barre de progression */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-400 text-xs font-medium">Progression</span>
                          <span className="text-slate-300 text-xs font-bold">{getProgressPercentage(ticket.status)}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-500"
                            style={{ width: `${getProgressPercentage(ticket.status)}%` }}
                          />
                        </div>
                      </div>

                      {/* Étapes */}
                      <div className="grid grid-cols-4 gap-2">
                        {getProgressSteps(ticket.status).map((step, index) => (
                          <div key={step.status} className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all ${
                                step.completed
                                  ? "bg-red-600 text-white"
                                  : ticket.status === step.status
                                  ? "bg-red-600/50 text-red-300 border-2 border-red-600"
                                  : "bg-slate-700 text-slate-500"
                              }`}
                            >
                              {step.completed ? (
                                <CheckCircle size={20} />
                              ) : ticket.status === step.status ? (
                                <Clock size={20} />
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-slate-500" />
                              )}
                            </div>
                            <span
                              className={`text-xs text-center font-medium ${
                                step.completed || ticket.status === step.status
                                  ? "text-white"
                                  : "text-slate-500"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Message original */}
                  <div>
                    <h4 className="text-slate-300 font-bold text-sm mb-2 uppercase tracking-wide">
                      Votre message
                    </h4>
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <p className="text-slate-300 whitespace-pre-wrap">{ticket.message}</p>
                    </div>
                  </div>

                  {/* Réponse du support */}
                  {ticket.admin_reply ? (
                    <div className="mb-4">
                      <h4 className="text-green-400 font-bold text-sm mb-2 uppercase tracking-wide flex items-center gap-2">
                        <CheckCircle size={16} />
                        Réponse du Support
                      </h4>
                      <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4">
                        <p className="text-green-300 whitespace-pre-wrap">{ticket.admin_reply}</p>
                        {ticket.resolved_at && (
                          <p className="text-green-400/70 text-xs mt-3">
                            Répondu le {new Date(ticket.resolved_at).toLocaleDateString("fr-BE", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                      
                      {/* Réponse utilisateur existante */}
                      {ticket.user_reply && (
                        <div className="mt-4">
                          <h4 className="text-blue-400 font-bold text-sm mb-2 uppercase tracking-wide flex items-center gap-2">
                            <MessageSquare size={16} />
                            Votre Réponse
                          </h4>
                          <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
                            <p className="text-blue-300 whitespace-pre-wrap">{ticket.user_reply}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Formulaire de réponse utilisateur */}
                      {ticket.status !== "closed" && (
                        <div className="mt-4">
                          {replyingToTicket === ticket.id ? (
                            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                              <h5 className="text-sm font-bold text-white mb-3">Répondre au support :</h5>
                              <textarea
                                value={userReplyText}
                                onChange={(e) => setUserReplyText(e.target.value)}
                                placeholder="Tapez votre réponse ici..."
                                className="w-full min-h-[120px] p-3 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent resize-y text-white bg-slate-900"
                                disabled={submittingUserReply}
                              />
                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={() => handleUserReply(ticket.id)}
                                  disabled={submittingUserReply || !userReplyText.trim()}
                                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {submittingUserReply ? (
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
                                    setUserReplyText("");
                                  }}
                                  disabled={submittingUserReply}
                                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all disabled:opacity-50"
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
                              {ticket.user_reply ? "Modifier ma réponse" : "Répondre au support"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-amber-400">
                        <Clock size={16} />
                        <p className="text-sm font-medium">
                          En attente de réponse du support
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

