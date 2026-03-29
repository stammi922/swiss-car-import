'use client';

import { useTranslations } from 'next-intl';
import { Car, MapPin, FileText, User, BarChart3 } from 'lucide-react';

const stepIcons = [Car, MapPin, FileText, User, BarChart3];

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const t = useTranslations('steps');
  const stepKeys = ['vehicle', 'origin', 'import_type', 'details', 'results'];

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const Icon = stepIcons[i];
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;

          return (
            <div key={i} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {i > 0 && (
                <div
                  className={`absolute top-5 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                    isCompleted ? 'bg-swiss-red' : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Circle */}
              <div
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-swiss-red text-white ring-4 ring-swiss-red/20'
                    : isCompleted
                    ? 'bg-swiss-red text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Label */}
              <span
                className={`mt-2 text-xs font-medium hidden sm:block ${
                  isActive ? 'text-swiss-red' : isCompleted ? 'text-dark' : 'text-gray-400'
                }`}
              >
                {t(stepKeys[i])}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
