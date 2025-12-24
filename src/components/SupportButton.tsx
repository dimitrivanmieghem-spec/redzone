"use client";

import { useState, useEffect } from "react";
import { HelpCircle, X, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createTicket } from "@/app/actions/tickets";

export default function SupportButton() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    category: "Commercial" as "Technique" | "Contenu" | "Commercial",
    message: "",
  });
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  // Pré-remplir l'email si l'utilisateur est connecté
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, [user?.email, formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      const result = await createTicket({
        email: formData.email,
        category: formData.category,
        message: formData.message,
      });

      if (result.success) {
        setSubmitStatus({
          type: "success",
          message: "Votre message a été envoyé avec succès ! Nous vous répondrons bientôt.",
        });
        // Réinitialiser le formulaire
        setFormData({
          email: user?.email || "",
          category: "Commercial",
          message: "",
        });
        // Fermer la modale après 2 secondes
        setTimeout(() => {
          setIsOpen(false);
          setSubmitStatus({ type: null, message: "" });
        }, 2000);
      } else {
        setSubmitStatus({
          type: "error",
          message: result.error || "Une erreur est survenue. Veuillez réessayer.",
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: "error",
        message: "Une erreur est survenue. Veuillez réessayer.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-4 md:bottom-6 md:right-6 z-30 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 group"
        aria-label="Contacter le support"
      >
        <HelpCircle size={24} className="group-hover:rotate-12 transition-transform" />
      </button>

      {/* Modale */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center">
                  <HelpCircle className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">Contacter le Support</h2>
                  <p className="text-sm text-slate-600">Votre demande sera automatiquement routée vers la bonne personne</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSubmitStatus({ type: null, message: "" });
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Fermer"
              >
                <X size={20} className="text-slate-600" />
              </button>
            </div>

            {/* Contenu */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-900 mb-2">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-red-600 focus:outline-none transition-colors"
                  placeholder="votre@email.com"
                  disabled={!!user?.email} // Désactivé si connecté
                />
                {user?.email && (
                  <p className="text-xs text-slate-500 mt-1">Email de votre compte connecté</p>
                )}
              </div>

              {/* Catégorie */}
              <div>
                <label htmlFor="category" className="block text-sm font-bold text-slate-900 mb-2">
                  Catégorie <span className="text-red-600">*</span>
                </label>
                <select
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      category: e.target.value as "Technique" | "Contenu" | "Commercial",
                    }))
                  }
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-red-600 focus:outline-none transition-colors"
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

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-bold text-slate-900 mb-2">
                  Message <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-red-600 focus:outline-none transition-colors resize-none"
                  placeholder="Décrivez votre problème ou votre question..."
                />
              </div>

              {/* Statut de soumission */}
              {submitStatus.type && (
                <div
                  className={`p-4 rounded-2xl ${
                    submitStatus.type === "success"
                      ? "bg-green-50 border-2 border-green-200"
                      : "bg-red-50 border-2 border-red-200"
                  }`}
                >
                  <p
                    className={`text-sm font-medium ${
                      submitStatus.type === "success" ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {submitStatus.message}
                  </p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    setIsOpen(false);
                    setSubmitStatus({ type: null, message: "" });
                  }}
                  className="px-6 py-4 border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-2xl transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

