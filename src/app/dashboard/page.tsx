"use client";

import MyAds from "@/components/MyAds";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Section Mes Annonces (Page par défaut) */}
        <MyAds />
      </div>
    </div>
  );
}
