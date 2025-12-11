import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import BetaBadge from "@/components/BetaBadge";
import { ToastProvider } from "@/components/ui/Toast";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CookieConsentProvider } from "@/contexts/CookieConsentContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RedZone - Le Sanctuaire du Moteur Thermique",
  description: "Supercars, youngtimers, GTI. V8, atmosphérique, manuelle. La marketplace des passionnés automobiles en Belgique.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RedZone",
  },
  openGraph: {
    type: "website",
    locale: "fr_BE",
    url: "https://redzone.be",
    siteName: "RedZone",
    title: "RedZone - Le Sanctuaire du Moteur Thermique",
    description: "Supercars, youngtimers, GTI. V8, atmosphérique, manuelle. La marketplace des passionnés automobiles en Belgique.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RedZone - Le Sanctuaire du Moteur Thermique",
    description: "Supercars, youngtimers, GTI. V8, atmosphérique, manuelle. La marketplace des passionnés automobiles en Belgique.",
  },
};

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: "#DC2626",
    viewportFit: "cover",
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
        <meta name="apple-mobile-web-app-title" content="RedZone" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <CookieConsentProvider>
          <AuthProvider>
            <ToastProvider>
              <FavoritesProvider>
                <Navbar />
                <div className="flex-1 pb-20 md:pb-0">{children}</div>
                <MobileNav />
                <Footer />
                <CookieBanner />
                <BetaBadge />
              </FavoritesProvider>
            </ToastProvider>
          </AuthProvider>
        </CookieConsentProvider>
      </body>
    </html>
  );
}
