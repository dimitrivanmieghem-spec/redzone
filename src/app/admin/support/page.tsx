"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { getTickets, resolveTicket } from "@/app/actions/tickets";
import {
  MessageSquare,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  Calendar,
  User,
  AlertCircle,
} from "lucide-react";

interface Ticket {
  id: string;
  created_at: string;
  user_id: string | null;
  email_contact: string;
  subject: "bug" | "question" | "signalement" | "autre";
  message: string;
  status: "open" | "closed" | "resolved";
  resolved_at: string | null;
  resolved_by: string | null;
}

const subjectLabels: Record<string, { label: string; emoji: string; color: string }> = {
  bug: { label: "Bug", emoji: "🐛", color: "bg-red-100 text-red-800 border-red-200" },
  question: { label: "Question", emoji: "❓", color: "bg-blue-100 text-blue-800 border-blue-200" },
  signalement: { label: "Signalement", emoji: "⚠️", color: "bg-orange-100 text-orange-800 border-orange-200" },
  autre: { label: "Autre", emoji: "📧", color: "bg-slate-100 text-slate-800 border-slate-200" },
};

export default function AdminSupportPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    loadTickets();
  }, [filter]);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const result = await getTickets({
        status: filter === "all" ? undefined : filter === "open" ? "open" : "resolved",
      });

      if (result.success && result.tickets) {
        setTickets(result.tickets as Ticket[]);
      } else {
        showToast(result.error || "Erreur de chargement", "error");
      }
    } catch (error) {
      console.error("Erreur chargement tickets:", error);
      showToast("Erreur de chargement", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (ticketId: string) => {
    if (resolvingId) return;

    setResolvingId(ticketId);
    try {
      const result = await resolveTicket(ticketId);
      if (result.success) {
        showToast("Ticket marqué comme résolu", "success");
        loadTickets(); // Recharger la liste
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center">
              <MessageSquare className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Support</h2>
              <p className="text-sm text-slate-600">Gestion des tickets et demandes</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === "all"
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter("open")}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === "open"
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Ouverts
            </button>
            <button
              onClick={() => setFilter("resolved")}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                filter === "resolved"
                  ? "bg-red-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Résolus
            </button>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertCircle className="text-red-600" size={24} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Tickets ouverts</h3>
            <p className="text-3xl font-black text-slate-900">
              {tickets.filter((t) => t.status === "open").length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Tickets résolus</h3>
            <p className="text-3xl font-black text-slate-900">
              {tickets.filter((t) => t.status === "resolved").length}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <MessageSquare className="text-blue-600" size={24} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-slate-600 mb-1">Total tickets</h3>
            <p className="text-3xl font-black text-slate-900">{tickets.length}</p>
          </div>
        </div>

        {/* Liste des tickets */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement des tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-12 text-center">
            <MessageSquare className="text-slate-400 mx-auto mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun ticket</h3>
            <p className="text-slate-600">Aucun ticket ne correspond aux filtres sélectionnés.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const subjectInfo = subjectLabels[ticket.subject] || subjectLabels.autre;
              const isResolved = ticket.status === "resolved";

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-2xl shadow-xl shadow-slate-100/50 border-0 p-6 hover:shadow-2xl transition-all"
                >
                  <div className="flex items-start justify-between gap-6">
                    {/* Infos principales */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${subjectInfo.color}`}
                        >
                          {subjectInfo.emoji} {subjectInfo.label}
                        </span>
                        {isResolved ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle size={12} className="inline mr-1" />
                            Résolu
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                            <Clock size={12} className="inline mr-1" />
                            Ouvert
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail size={16} />
                          <span className="font-medium">{ticket.email_contact}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar size={16} />
                          <span>{formatDate(ticket.created_at)}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <p className="text-slate-900 whitespace-pre-wrap">{ticket.message}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {!isResolved && (
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleResolve(ticket.id)}
                          disabled={resolvingId === ticket.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resolvingId === ticket.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Traitement...
                            </>
                          ) : (
                            <>
                              <CheckCircle size={18} />
                              Marquer résolu
                            </>
                          )}
                        </button>
                      </div>
                    )}
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

