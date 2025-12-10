"use client";

import Link from "next/link";
import { Gauge } from "lucide-react";
import { useCookieConsent } from "@/contexts/CookieConsentContext";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { resetConsent } = useCookieConsent();

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Grille de contenu */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Colonne 1 - À propos */}
          <div>
            <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
              <Gauge className="text-red-600" size={24} />
              RedZone
            </h3>
            <p className="text-sm leading-relaxed">
              Le sanctuaire du moteur thermique. Supercars, youngtimers, GTI...
              La passion automobile à l&apos;état pur.
            </p>
          </div>

          {/* Colonne 2 - Navigation */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="hover:text-red-600 transition-colors"
                >
                  Acheter
                </Link>
              </li>
              <li>
                <Link
                  href="/sell"
                  className="hover:text-red-600 transition-colors"
                >
                  Vendre
                </Link>
              </li>
              <li>
                <Link
                  href="/calculateur"
                  className="hover:text-red-600 transition-colors"
                >
                  Calculateur de Taxes
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  className="hover:text-red-600 transition-colors"
                >
                  Favoris
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 - Informations légales */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/legal/privacy"
                  className="hover:text-red-500 transition-colors"
                >
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="hover:text-red-500 transition-colors"
                >
                  Conditions Générales
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/mentions"
                  className="hover:text-red-500 transition-colors"
                >
                  Mentions Légales
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/disclaimer"
                  className="hover:text-red-500 transition-colors"
                >
                  Avertissement
                </Link>
              </li>
              <li>
                <button
                  onClick={resetConsent}
                  className="hover:text-red-500 transition-colors text-left"
                >
                  🍪 Gestion des cookies
                </button>
              </li>
            </ul>
          </div>

          {/* Colonne 4 - Contact */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:contact@RedZone.be"
                  className="hover:text-red-500 transition-colors"
                >
                  contact@RedZone.be
                </a>
              </li>
              <li>
                <a
                  href="mailto:privacy@RedZone.be"
                  className="hover:text-red-500 transition-colors"
                >
                  privacy@RedZone.be
                </a>
              </li>
              <li>
                <a
                  href="mailto:report@RedZone.be"
                  className="hover:text-red-500 transition-colors"
                >
                  report@RedZone.be
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-slate-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>
              © {currentYear} RedZone. Tous droits réservés.
            </p>
            <p className="text-slate-400">
              Le sanctuaire du thermique • Belgique 🇧🇪 🏁
            </p>
          </div>
        </div>

        {/* Note Racing */}
        <div className="mt-6 text-xs text-slate-400 text-center">
          <p>
            V8 • V10 • Flat-6 • Atmosphérique • Manuelle • Car-Pass • RGPD
          </p>
        </div>

        {/* Note BETA */}
        <div className="mt-4 text-xs text-slate-500 text-center">
          <p>
            Version Alpha/Beta - En cas de bug, merci de prévenir l&apos;
            <a
              href="mailto:admin@redzone.be"
              className="text-red-500 hover:text-red-400 font-medium underline transition-colors"
            >
              administrateur
            </a>
            .
          </p>
        </div>

        {/* Mentions légales BETA */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <div className="text-center space-y-2">
            <p className="text-sm font-bold text-slate-300">
              Version Beta v0.1 - Projet indépendant non commercial.
            </p>
            <p className="text-xs text-slate-500">
              RedZone est un projet indépendant développé par des passionnés. 
              Site à but non lucratif durant la phase de test.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

