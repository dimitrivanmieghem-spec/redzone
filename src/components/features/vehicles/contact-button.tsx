"use client";

interface ContactButtonProps {
  marque: string;
  modele: string;
}

export default function ContactButton({ marque, modele }: ContactButtonProps) {
  const handleContact = () => {
    window.alert(`Contactez le vendeur pour la ${marque} ${modele}`);
  };

  return (
    <button
      onClick={handleContact}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-xl hover:shadow-md text-lg hover:scale-105 transition-transform"
    >
      Contacter le vendeur
    </button>
  );
}

