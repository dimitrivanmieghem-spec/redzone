import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import MobileNav from "@/components/MobileNav";
import { Footer } from "@/components/layout/footer";
import CookieBanner from "@/components/CookieBanner";
import BetaBadge from "@/components/BetaBadge";
import SupportButton from "@/components/SupportButton";
import { ToastProvider } from "@/components/ui/Toast";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CookieConsentProvider } from "@/contexts/CookieConsentContext";
import { BanSimulationProvider } from "@/contexts/BanSimulationContext";
import BanSimulationBanner from "@/components/BanSimulationBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Octane98 | La mécanique des puristes",
  description: "Supercars, youngtimers, GTI. V8, atmosphérique, manuelle. La marketplace des passionnés automobiles en Belgique.",
  keywords: "Octane98, marketplace automobile Belgique, voiture sportive Belgique, calculateur taxes Belgique, annonces véhicules Belgique",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Octane98",
  },
  openGraph: {
    type: "website",
    locale: "fr_BE",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://octane98.be",
    siteName: "Octane98",
    title: "Octane98 | La mécanique des puristes",
    description: "Supercars, youngtimers, GTI. V8, atmosphérique, manuelle. La marketplace des passionnés automobiles en Belgique.",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://octane98.be"}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Octane98 - Le Sanctuaire du Moteur Thermique",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Octane98 | La mécanique des puristes",
    description: "Supercars, youngtimers, GTI. V8, atmosphérique, manuelle. La marketplace des passionnés automobiles en Belgique.",
  },
};

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 2, // Réduit pour éviter zoom excessif sur mobile
    userScalable: true,
    themeColor: "#DC2626",
    viewportFit: "cover", // Utilise "cover" pour combler la notch iPhone
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <head>
        <meta name="theme-color" content="#DC2626" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Octane98" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-[100dvh] bg-neutral-950 text-white`}
      >
        <CookieConsentProvider>
          <AuthProvider>
            <BanSimulationProvider>
              <ToastProvider>
                <FavoritesProvider>
                  <BanSimulationBanner />
                  <Navbar />
                  <div className="flex-1 pb-24 md:pb-0">{children}</div>
                  <MobileNav />
                  <Footer />
                  <CookieBanner />
                  <BetaBadge />
                  <SupportButton />
                </FavoritesProvider>
              </ToastProvider>
            </BanSimulationProvider>
          </AuthProvider>
        </CookieConsentProvider>
      </body>
    </html>
  );
}
