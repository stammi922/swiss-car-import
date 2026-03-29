'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { WizardContext, defaultWizardData, type WizardData } from '@/lib/store';
import { convertToCHF, type ExchangeRates } from '@/lib/exchangeRates';
import ProgressBar from '@/components/ProgressBar';
import VehicleStep from '@/components/steps/VehicleStep';
import OriginStep from '@/components/steps/OriginStep';
import ImportTypeStep from '@/components/steps/ImportTypeStep';
import DetailsStep from '@/components/steps/DetailsStep';
import ResultsStep from '@/components/steps/ResultsStep';
import { ArrowLeft, ArrowRight, Calculator } from 'lucide-react';

const TOTAL_STEPS = 5;

export default function CalculatorPage() {
  const t = useTranslations('common');
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>(defaultWizardData);
  const [rates, setRates] = useState<ExchangeRates | null>(null);

  useEffect(() => {
    fetch('/api/rates')
      .then((r) => r.json())
      .then((d) => setRates(d.rates))
      .catch(() => {});
  }, []);

  const updateData = useCallback(
    (partial: Partial<WizardData>) => {
      setData((prev) => {
        const next = { ...prev, ...partial };
        // Auto-convert to CHF if rates available and price changed
        if (
          rates &&
          (partial.purchasePrice !== undefined || partial.purchaseCurrency !== undefined) &&
          next.purchaseCurrency !== 'CHF'
        ) {
          const converted = convertToCHF(
            next.purchasePrice,
            next.purchaseCurrency,
            rates
          );
          if (converted && !partial.vehicleValueCHF) {
            next.vehicleValueCHF = converted;
          }
        }
        return next;
      });
    },
    [rates]
  );

  const canGoNext = () => {
    switch (currentStep) {
      case 0:
        return data.vehicleWeight > 0 && data.purchasePrice > 0 && data.vehicleValueCHF > 0;
      case 1:
        return data.originCountry !== '';
      case 2:
        return !!data.importType;
      case 3:
        return data.canton !== '';
      default:
        return true;
    }
  };

  const goNext = () => {
    if (currentStep < TOTAL_STEPS - 1) setCurrentStep(currentStep + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const stepComponents = [
    <VehicleStep key="vehicle" />,
    <OriginStep key="origin" />,
    <ImportTypeStep key="import" />,
    <DetailsStep key="details" />,
    <ResultsStep key="results" />,
  ];

  return (
    <WizardContext.Provider value={{ data, updateData, currentStep, setCurrentStep }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {/* Step content */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
          {stepComponents[currentStep]}
        </div>

        {/* Navigation */}
        {currentStep < TOTAL_STEPS - 1 && (
          <div className="flex justify-between mt-6">
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentStep === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-dark border border-gray-300 hover:border-gray-400'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </button>

            <button
              onClick={goNext}
              disabled={!canGoNext()}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                canGoNext()
                  ? currentStep === TOTAL_STEPS - 2
                    ? 'bg-swiss-red hover:bg-swiss-red-dark text-white'
                    : 'bg-dark hover:bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {currentStep === TOTAL_STEPS - 2 ? (
                <>
                  <Calculator className="w-4 h-4" />
                  {t('calculate')}
                </>
              ) : (
                <>
                  {t('next')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </WizardContext.Provider>
  );
}
