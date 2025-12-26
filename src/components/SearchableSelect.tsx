"use client";

// Octane98 - Sélecteur Searchable (Recherchable au clavier)
// Design harmonisé avec le thème Puriste

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Loader2, AlertCircle } from "lucide-react";

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
  required?: boolean;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Rechercher...",
  label,
  loading = false,
  error = null,
  disabled = false,
  required = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filtrer les options selon le terme de recherche
  // "__AUTRE__" est toujours visible même si la recherche ne correspond pas
  const filteredOptions = options.filter((option) => {
    if (option === "__AUTRE__") return true; // Toujours afficher l'option "Autre"
    return option.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Gérer la navigation au clavier
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        onChange(filteredOptions[focusedIndex]);
        setIsOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
        setFocusedIndex(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, focusedIndex, filteredOptions, onChange]);

  // Scroll vers l'élément focusé
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [focusedIndex]);

  const selectedOption = options.find((opt) => opt === value);

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-black text-slate-900 mb-3">
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}

      {/* Bouton trigger */}
      <button
        type="button"
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }
        }}
        disabled={disabled || loading}
        className={`w-full p-4 bg-white border-2 rounded-2xl focus:ring-4 focus:ring-red-600/20 focus:border-red-600 text-slate-900 font-medium transition-all flex items-center justify-between ${
          error
            ? "border-red-500"
            : disabled
            ? "border-slate-200 bg-slate-50 cursor-not-allowed"
            : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              Chargement...
            </span>
          ) : selectedOption ? (
            selectedOption
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          size={20}
          className={`text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Message d'erreur */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-[70] w-full mt-2 bg-white border-2 border-slate-300 rounded-2xl shadow-2xl max-h-64 overflow-hidden">
          {/* Barre de recherche */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFocusedIndex(-1);
                }}
                placeholder="Tapez pour rechercher..."
                className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600/20 focus:border-red-600 text-slate-900 font-medium"
                autoFocus
              />
            </div>
          </div>

          {/* Liste des options */}
          <ul
            ref={listRef}
            className="overflow-y-auto max-h-48"
            role="listbox"
          >
            {loading ? (
              <li className="p-4 text-center text-slate-500">
                <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                <span className="text-sm">Chargement des options...</span>
              </li>
            ) : filteredOptions.length === 0 ? (
              <li className="p-4 text-center text-slate-500">
                <span className="text-sm">
                  {searchTerm
                    ? `Aucun résultat pour "${searchTerm}"`
                    : "Aucune option disponible"}
                </span>
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                // Gérer le cas spécial "__AUTRE__" pour l'affichage
                const displayText = option === "__AUTRE__" ? "⚠️ Autre / Modèle non listé" : option;
                return (
                  <li
                    key={option}
                    role="option"
                    aria-selected={value === option}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                      setSearchTerm("");
                      setFocusedIndex(-1);
                    }}
                    className={`px-4 py-3 cursor-pointer transition-all font-medium ${
                      value === option
                        ? "bg-red-600 text-white"
                        : focusedIndex === index
                        ? "bg-red-50 text-slate-900"
                        : option === "__AUTRE__"
                        ? "text-amber-700 hover:bg-amber-50 font-bold"
                        : "text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {displayText}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

