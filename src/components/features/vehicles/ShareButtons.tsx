"use client";

import { Share2, Facebook, Twitter, Linkedin, MessageCircle } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
}

export default function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || "");

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
      <div className="flex items-center gap-2 mb-4">
        <Share2 size={20} className="text-red-600" />
        <h3 className="text-lg font-black text-white">Partager</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 text-blue-400 rounded-xl transition-all hover:scale-105 font-medium"
        >
          <Facebook size={18} />
          <span>Facebook</span>
        </a>
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-600/50 text-sky-400 rounded-xl transition-all hover:scale-105 font-medium"
        >
          <Twitter size={18} />
          <span>Twitter</span>
        </a>
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-700/20 hover:bg-blue-700/30 border border-blue-700/50 text-blue-300 rounded-xl transition-all hover:scale-105 font-medium"
        >
          <Linkedin size={18} />
          <span>LinkedIn</span>
        </a>
        <a
          href={shareLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 text-green-400 rounded-xl transition-all hover:scale-105 font-medium"
        >
          <MessageCircle size={18} />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
