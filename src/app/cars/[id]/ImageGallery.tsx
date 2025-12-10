"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Gérer la navigation au clavier (Echap, flèches)
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, currentIndex]);

  // Empêcher le scroll du body quand la lightbox est ouverte
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [lightboxOpen]);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Filtrer les images vides (placeholders)
  const validImages = images.filter((img) => img && !img.includes("placeholder"));

  if (validImages.length === 0) {
    return (
      <div className="grid grid-cols-4 gap-4 h-[600px]">
        <div className="col-span-4 md:col-span-2 row-span-2 relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <span className="text-slate-400 text-lg font-medium">Aucune photo disponible</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Galerie Bento */}
      <div className="grid grid-cols-4 gap-4 h-[600px]">
        {/* Grande image à gauche */}
        <div
          className="col-span-4 md:col-span-2 row-span-2 relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-2xl shadow-slate-300/50 cursor-zoom-in group"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={validImages[0]}
            alt={alt}
            fill
            className="object-cover hover:scale-110 transition-transform duration-700"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>

        {/* 4 petites images à droite */}
        {validImages.slice(1, 5).map((image, index) => (
          <div
            key={index}
            className="col-span-2 md:col-span-1 row-span-1 relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-xl shadow-slate-200/50 cursor-zoom-in group"
            onClick={() => openLightbox(index + 1)}
          >
            <Image
              src={image}
              alt={`${alt} - Vue ${index + 2}`}
              fill
              className="object-cover hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ))}

        {/* Si moins de 5 images, remplir avec des placeholders */}
        {Array.from({ length: Math.max(0, 5 - validImages.length) }).map((_, index) => (
          <div
            key={`placeholder-${index}`}
            className="col-span-2 md:col-span-1 row-span-1 relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center"
          >
            <span className="text-slate-400 text-sm font-medium">
              Photo {validImages.length + index + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center"
          style={{ animation: 'fadeInLightbox 0.3s ease-in-out' }}
          onClick={closeLightbox}
        >
          {/* Bouton Fermer */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 backdrop-blur-sm"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>

          {/* Bouton Précédent */}
          {validImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 backdrop-blur-sm"
              aria-label="Photo précédente"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          {/* Bouton Suivant */}
          {validImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 backdrop-blur-sm"
              aria-label="Photo suivante"
            >
              <ChevronRight size={32} />
            </button>
          )}

          {/* Image en grand */}
          <div
            className="relative w-full h-full max-w-[90vw] max-h-[90vh] p-8 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={validImages[currentIndex]}
              alt={`${alt} - Photo ${currentIndex + 1}`}
              width={1920}
              height={1080}
              className="object-contain w-full h-full"
              priority
            />
          </div>

          {/* Indicateur de position (ex: 1/5) */}
          {validImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-bold">
              {currentIndex + 1} / {validImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}

