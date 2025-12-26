"use client";

import Link from "next/link";
import {
  Bell,
  BellRing,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";
import NotificationsPanel from "@/components/NotificationsPanel";
import { markNotificationAsRead } from "@/lib/supabase/notifications";
import type { Notification } from "@/lib/supabase/notifications";
import MyAds from "@/components/features/vehicles/my-ads";

interface GarageTabProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  notifications: Notification[];
  unreadCount: number;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  isLoadingNotifications: boolean;
}

export default function GarageTab({
  user,
  notifications,
  unreadCount,
  showNotifications,
  setShowNotifications,
  isLoadingNotifications,
}: GarageTabProps) {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">
            Mon Garage
          </h1>
          <p className="text-slate-400">
            Gérez vos annonces et suivez leurs performances
          </p>
        </div>
        <div className="hidden lg:block">
          <NotificationsPanel />
        </div>
      </div>

      {/* Bannière Notifications (si non lues) */}
      {unreadCount > 0 && !showNotifications && (
        <div className="mb-6 bg-red-600 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <BellRing size={24} className="animate-pulse" />
            <div>
              <p className="font-bold">
                {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""} notification{unreadCount > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-red-100">
                Une nouvelle annonce correspond à vos critères de recherche !
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowNotifications(true)}
            className="bg-slate-800 text-red-500 font-bold px-4 py-2 rounded-xl hover:bg-red-900/20 transition-colors"
          >
            Voir
          </button>
        </div>
      )}

      {/* Liste des Notifications (si affichée) */}
      {showNotifications && (
        <div className="mb-8 bg-slate-900/50 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <BellRing size={24} className="text-red-600" />
              Mes Notifications
            </h2>
            <button
              onClick={() => setShowNotifications(false)}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center"
            >
              <X size={20} className="text-slate-300" />
            </button>
          </div>

          {isLoadingNotifications ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-red-600" size={32} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-2xl border-2 ${
                    !notification.is_read
                      ? "bg-red-900/20 border-red-500/50"
                      : "bg-slate-800/50 border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-bold text-white">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-slate-300 mb-3">{notification.message}</p>
                      <div className="flex items-center gap-3">
                        {notification.link && (
                          <Link
                            href={notification.link}
                            onClick={async () => {
                              if (!notification.is_read) {
                                await markNotificationAsRead(notification.id);
                              }
                            }}
                            className="text-sm text-red-600 hover:text-red-700 font-bold"
                          >
                            Voir l'annonce →
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
                    {!notification.is_read && (
                      <button
                        onClick={async () => {
                          await markNotificationAsRead(notification.id);
                        }}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                        title="Marquer comme lu"
                      >
                        <CheckCircle size={20} className="text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section Mes Annonces */}
      <MyAds />
    </div>
  );
}

