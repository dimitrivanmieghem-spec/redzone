"use client";

// Octane98 - Panneau de Notifications

import { useState, useEffect } from "react";
import { Bell, BellRing, X, Check, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { getAllNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, getUnreadNotificationsCount } from "@/lib/supabase/notifications";
import type { Notification } from "@/lib/supabase/notifications";

export default function NotificationsPanel() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Charger les notifications
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const [allNotifications, count] = await Promise.all([
          getAllNotifications(20),
          getUnreadNotificationsCount(),
        ]);
        setNotifications(allNotifications);
        setUnreadCount(count);
      } catch (error) {
        console.error("Erreur chargement notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();

    // Recharger toutes les 30 secondes
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Marquer une notification comme lue
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erreur marquage notification:", error);
      showToast("Erreur lors du marquage de la notification", "error");
    }
  };

  // Marquer toutes comme lues
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      showToast("Toutes les notifications ont été marquées comme lues", "success");
    } catch (error) {
      console.error("Erreur marquage notifications:", error);
      showToast("Erreur lors du marquage des notifications", "error");
    }
  };

  // Supprimer une notification
  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      const deleted = notifications.find((n) => n.id === notificationId);
      if (deleted && !deleted.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Erreur suppression notification:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  if (!user) return null;

  const unreadNotifications = notifications.filter((n) => !n.is_read);

  return (
    <div className="relative">
      {/* Bouton Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing size={24} className="text-red-600" />
        ) : (
          <Bell size={24} className="text-slate-600" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau de Notifications */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/20 z-[90]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-3xl shadow-2xl z-[100] max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <BellRing size={20} className="text-red-600" />
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-red-600 text-white text-xs font-bold rounded-full px-2 py-1">
                    {unreadCount}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-slate-600 hover:text-red-600 font-medium"
                  >
                    Tout marquer lu
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
                >
                  <X size={18} className="text-slate-600" />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-red-600" size={32} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Bell size={48} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 transition-colors ${
                        !notification.is_read ? "bg-red-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-bold text-slate-900 text-sm">
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2">
                            {notification.link && (
                              <Link
                                href={notification.link}
                                onClick={() => {
                                  if (!notification.is_read) {
                                    handleMarkAsRead(notification.id);
                                  }
                                  setIsOpen(false);
                                }}
                                className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1"
                              >
                                Voir l'annonce
                                <ExternalLink size={12} />
                              </Link>
                            )}
                            <span className="text-xs text-slate-400">
                              {new Date(notification.created_at).toLocaleDateString("fr-BE", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {!notification.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1.5 hover:bg-slate-200 rounded-full transition-colors"
                              title="Marquer comme lu"
                            >
                              <Check size={16} className="text-slate-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1.5 hover:bg-red-100 rounded-full transition-colors"
                            title="Supprimer"
                          >
                            <X size={16} className="text-slate-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

