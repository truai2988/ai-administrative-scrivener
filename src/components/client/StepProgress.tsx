'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export const StepProgress: React.FC<StepProgressProps> = ({ currentStep, totalSteps, steps }) => {
  return (
    <div className="w-full py-6 px-4">
      <div className="flex items-center justify-between relative max-w-md mx-auto">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
        <motion.div 
          className="absolute top-1/2 left-0 h-0.5 bg-indigo-500 -translate-y-1/2 z-0"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div key={index} className="relative z-10 flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor: isCompleted || isActive ? '#6366f1' : '#f8fafc',
                  scale: isActive ? 1.1 : 1,
                  borderColor: isActive ? '#6366f1' : isCompleted ? '#6366f1' : '#e2e8f0',
                }}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-shadow duration-300 ${
                  isActive ? 'shadow-[0_0_15px_rgba(99,102,241,0.4)]' : ''
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {stepNumber}
                  </span>
                )}
              </motion.div>
              <span className={`absolute -bottom-6 text-[10px] font-bold whitespace-nowrap tracking-tighter ${
                isActive ? 'text-indigo-600' : 'text-slate-400'
              }`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
