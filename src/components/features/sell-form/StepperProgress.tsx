"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface StepperProgressProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  steps: Array<{
    number: number;
    label: string;
    shortLabel?: string; // Pour mobile
  }>;
}

export default function StepperProgress({
  currentStep,
  onStepClick,
  steps,
}: StepperProgressProps) {
  return (
    <div className="bg-neutral-900/50 border-b border-white/10 shadow-sm sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {/* Desktop View */}
        <div className="hidden md:flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const isAccessible = currentStep >= step.number;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle & Label */}
                <button
                  type="button"
                  onClick={() => onStepClick && isAccessible && onStepClick(step.number)}
                  disabled={!isAccessible}
                  className={`flex flex-col items-center gap-2 transition-all ${
                    isAccessible ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed"
                  }`}
                >
                  <motion.div
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center font-black text-sm transition-all ${
                      isActive
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/50 scale-110"
                        : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-neutral-700 text-neutral-400"
                    }`}
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {isCompleted ? (
                      <Check size={20} />
                    ) : (
                      <span>{step.number}</span>
                    )}
                    {/* Ripple effect on active */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-red-600"
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number], // Courbe de Bézier équivalente à easeOut
                        }}
                      />
                    )}
                  </motion.div>
                  <span
                    className={`font-bold text-xs sm:text-sm tracking-wide whitespace-nowrap ${
                      isActive || isCompleted
                        ? "text-white"
                        : "text-neutral-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 h-1 mx-2 sm:mx-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-neutral-700" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-red-600 to-green-600"
                      initial={{ width: 0 }}
                      animate={{
                        width: isCompleted ? "100%" : isActive ? "50%" : "0%",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile View - Compact */}
        <div className="md:hidden flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            const isAccessible = currentStep >= step.number;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <button
                  type="button"
                  onClick={() => onStepClick && isAccessible && onStepClick(step.number)}
                  disabled={!isAccessible}
                  className={`flex flex-col items-center gap-1 transition-all ${
                    isAccessible ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                >
                  <motion.div
                    className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all ${
                      isActive
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/50"
                        : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-neutral-700 text-neutral-400"
                    }`}
                    animate={{
                      scale: isActive ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {isCompleted ? (
                      <Check size={14} className="sm:w-4 sm:h-4" />
                    ) : (
                      <span>{step.number}</span>
                    )}
                  </motion.div>
                  {/* Short label on mobile */}
                  <span
                    className={`font-bold text-[10px] sm:text-xs tracking-tight whitespace-nowrap hidden sm:block ${
                      isActive || isCompleted
                        ? "text-white"
                        : "text-neutral-400"
                    }`}
                  >
                    {step.shortLabel || step.label}
                  </span>
                </button>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-1 sm:mx-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-neutral-700" />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-red-600 to-green-600"
                      initial={{ width: 0 }}
                      animate={{
                        width: isCompleted ? "100%" : isActive ? "50%" : "0%",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile - Current Step Label */}
        <div className="md:hidden mt-2 text-center">
          <span className="text-xs sm:text-sm font-bold text-red-500">
            Étape {currentStep} sur {steps.length}: {steps[currentStep - 1]?.label}
          </span>
        </div>
      </div>
    </div>
  );
}

