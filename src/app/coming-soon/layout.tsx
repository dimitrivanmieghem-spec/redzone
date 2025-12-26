import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Octane98 - Le Sanctuaire du Moteur Thermique | Coming Soon",
  description: "La première marketplace belge dédiée aux puristes de la performance. Calculateur de taxes précis, annonces certifiées, et mélodies mécaniques. Bientôt disponible.",
  keywords: "Octane98, Belgique, moteur thermique, marketplace, voitures, calculateur taxes, annonces véhicules, passion automobile",
  openGraph: {
    title: "Octane98 - Le Sanctuaire du Moteur Thermique arrive",
    description: "La première marketplace belge dédiée aux puristes de la performance. Inscrivez-vous pour être informé du lancement.",
    type: "website",
    locale: "fr_BE",
    siteName: "Octane98",
  },
  twitter: {
    card: "summary_large_image",
    title: "Octane98 - Le Sanctuaire du Moteur Thermique",
    description: "La première marketplace belge dédiée aux puristes de la performance.",
  },
  alternates: {
    canonical: "https://octane98.be/coming-soon",
  },
};

export default function ComingSoonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

