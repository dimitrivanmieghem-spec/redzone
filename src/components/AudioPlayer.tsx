"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  audioSrc: string;
  architecture?: string;
}

export default function AudioPlayer({ audioSrc, architecture }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Mettre à jour le temps actuel
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Play/Pause
  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Changer le temps
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Changer le volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Mute/Unmute
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  // Formater le temps (mm:ss)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Calculer le pourcentage de progression
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full bg-gradient-to-br from-red-900 via-red-800 to-slate-900 rounded-3xl shadow-2xl border-2 border-red-600 p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center">
          <Volume2 className="text-white" size={36} />
        </div>
        <div className="flex-1">
          <h2 className="text-3xl font-black text-white mb-1 tracking-tight">
            Sonorité Moteur
          </h2>
          <p className="text-red-200 text-sm">
            {architecture ? `Écoutez ce ${architecture} rugir 🔥` : "Son authentique du véhicule 🔥"}
          </p>
        </div>
      </div>

      {/* Audio HTML5 (caché) */}
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {/* Lecteur Custom */}
      <div className="space-y-4">
        {/* Waveform Simulée / Barre de progression */}
        <div className="relative h-24 bg-slate-900/50 rounded-2xl overflow-hidden">
          {/* Progression */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          
          {/* Waveform visuelle simulée (barres décoratives) */}
          <div className="absolute inset-0 flex items-center justify-around px-4">
            {Array.from({ length: 40 }).map((_, i) => {
              const height = Math.random() * 60 + 20;
              const isActive = (i / 40) * 100 < progress;
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all ${
                    isActive ? "bg-white/90" : "bg-white/20"
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>

          {/* Slider de temps (invisible mais interactif) */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleTimeChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>

        {/* Contrôles */}
        <div className="flex items-center gap-4">
          {/* Bouton Play/Pause */}
          <button
            onClick={togglePlay}
            className="group relative w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-2xl shadow-red-600/50"
          >
            {isPlaying ? (
              <Pause className="text-white" size={28} />
            ) : (
              <Play className="text-white ml-1" size={28} />
            )}
          </button>

          {/* Temps */}
          <div className="flex-1 flex items-center gap-3">
            <span className="text-white font-bold text-sm tabular-nums">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-2 bg-slate-900/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-red-200 font-bold text-sm tabular-nums">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="w-10 h-10 bg-slate-900/50 hover:bg-slate-900 rounded-full flex items-center justify-center transition-all"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="text-white" size={18} />
              ) : (
                <Volume2 className="text-white" size={18} />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-slate-900/50 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-red-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        </div>

        {/* Note */}
        <p className="text-red-100 text-xs text-center mt-4">
          🎵 Son enregistré à l&apos;échappement • Qualité authentique
        </p>
      </div>
    </div>
  );
}

