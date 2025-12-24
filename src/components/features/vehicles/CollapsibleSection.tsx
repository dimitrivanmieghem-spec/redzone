"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function CollapsibleSection({
  title,
  icon,
  defaultExpanded = false,
  children,
  className = "",
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`mt-12 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 bg-neutral-900 border border-neutral-800 rounded-3xl hover:border-red-600/50 transition-all group"
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-red-600">{icon}</div>}
          <h2 className="text-2xl font-black text-white tracking-tight">
            {title}
          </h2>
        </div>
        {isExpanded ? (
          <ChevronUp className="text-slate-400 group-hover:text-red-600 transition-colors" size={24} />
        ) : (
          <ChevronDown className="text-slate-400 group-hover:text-red-600 transition-colors" size={24} />
        )}
      </button>
      {isExpanded && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
}
