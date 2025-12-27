import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculateur Taxe Auto Belgique 2025 | TMC & Taxe Circulation | Octane98",
  description: "Calculez gratuitement la Taxe de Mise en Circulation (TMC) et Taxe de Circulation en Belgique 2025. Calculateur officiel pour Wallonie, Bruxelles et Flandre. Précis et gratuit.",
  keywords: "calculateur taxe auto belgique, TMC belgique 2025, taxe circulation belgique, calculateur fiscal voiture, coût immatriculation belgique, taxe voiture belgique, TMC wallonie, TMC flandre, CV fiscaux belgique",
  openGraph: {
    title: "Calculateur Taxe Auto Belgique 2025 | TMC & Taxe Circulation",
    description: "Calculez gratuitement la Taxe de Mise en Circulation (TMC) et Taxe de Circulation en Belgique. Calculateur officiel 2025 pour Wallonie, Bruxelles et Flandre.",
    type: "website",
    locale: "fr_BE",
    siteName: "Octane98",
  },
  twitter: {
    card: "summary_large_image",
    title: "Calculateur Taxe Auto Belgique 2025 | TMC & Taxe Circulation",
    description: "Calculez gratuitement la Taxe de Mise en Circulation (TMC) et Taxe de Circulation en Belgique. Calculateur officiel 2025.",
  },
  alternates: {
    canonical: "https://octane98.be/coming-soon",
  },
  other: {
    "robots": "index, follow",
    "googlebot": "index, follow",
  },
};

export default function ComingSoonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

