"use client";

// Octane98 - Bannière fixe en haut pour le mode simulation (Admin uniquement)

import { XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBanSimulation } from "@/contexts/BanSimulationContext";

export default function BanSimulationBanner() {
  const { user } = useAuth();
  const { isSimulatingBan, stopSimulation } = useBanSimulation();

  // Afficher uniquement si admin et simulation active
  if (!user || user.role !== "admin" || !isSimulatingBan) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[110] bg-red-600 border-b-2 border-red-700 px-4 py-3 text-white shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 bg-red-700 rounded-full flex items-center justify-center">
            <span className="text-lg">🛑</span>
          </div>
          <p className="font-black text-sm sm:text-base">
            🛑 MODE TEST : Simulation de bannissement active
          </p>
        </div>
        <button
          onClick={stopSimulation}
          className="flex-shrink-0 bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm whitespace-nowrap"
        >
          <XCircle size={16} />
          Quitter le mode test
        </button>
      </div>
    </div>
  );
}
