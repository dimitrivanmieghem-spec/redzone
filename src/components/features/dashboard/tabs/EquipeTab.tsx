"use client";

import { Users } from "lucide-react";

export default function EquipeTab() {
  return (
    <div>
      <h1 className="text-4xl font-black text-white tracking-tight mb-2">
        Mon Équipe
      </h1>
      <p className="text-slate-400 mb-8">
        Gérez les membres de votre équipe
      </p>
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-white/10 p-12 text-center">
        <Users size={48} className="text-slate-400 mx-auto mb-4" />
        <p className="text-slate-400 font-medium">Gestion d'équipe à venir</p>
      </div>
    </div>
  );
}

