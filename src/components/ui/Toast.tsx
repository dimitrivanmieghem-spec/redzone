"use client";

import { X, Heart, CheckCircle, AlertCircle } from "lucide-react";
import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";

export type ToastType = "success" | "info" | "error";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove après 3 secondes
    const timeoutId = setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
      timeoutsRef.current.delete(id);
    }, 3000);
    
    timeoutsRef.current.set(id, timeoutId);
  }, []);

  // Nettoyage des timeouts au démontage
  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    // Nettoyer le timeout si le toast est fermé manuellement
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Ne rendre le conteneur que s'il y a des toasts pour éviter l'erreur d'hydratation */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[95] flex flex-col gap-2 max-w-md w-full">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center gap-3 p-4 rounded-2xl shadow-lg border backdrop-blur-sm animate-in slide-in-from-right-full ${
                toast.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : toast.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              {toast.type === "success" && (
                <CheckCircle size={20} className="flex-shrink-0" />
              )}
              {toast.type === "info" && (
                <Heart size={20} className="flex-shrink-0" />
              )}
              {toast.type === "error" && (
                <AlertCircle size={20} className="flex-shrink-0" />
              )}
              <p className="flex-1 text-sm font-medium">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-900 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

