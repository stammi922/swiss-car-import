'use client';

import { createContext, useContext } from 'react';
import type { ImportType, TransportMethod } from './calculator';

export interface WizardData {
  // Step 1: Vehicle
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vehicleWeight: number;
  co2Emissions: number;
  purchasePrice: number;
  purchaseCurrency: string;
  vehicleValueCHF: number;
  isNew: boolean;
  firstRegistrationDate: string;
  vehicleKm: number;

  // Step 2: Origin & Transport
  originCountry: string;
  hasProofOfOrigin: boolean;
  transportMethod: TransportMethod;
  transportCostCHF: number;

  // Step 3: Import Type
  importType: ImportType;

  // Step 4: Personal Details
  canton: string;
  ownershipMonths: number;
  alreadyInSwitzerland: boolean;
}

export const defaultWizardData: WizardData = {
  vehicleMake: '',
  vehicleModel: '',
  vehicleYear: new Date().getFullYear(),
  vehicleWeight: 0,
  co2Emissions: 0,
  purchasePrice: 0,
  purchaseCurrency: 'EUR',
  vehicleValueCHF: 0,
  isNew: false,
  firstRegistrationDate: '',
  vehicleKm: 0,
  originCountry: 'DE',
  hasProofOfOrigin: true,
  transportMethod: 'self',
  transportCostCHF: 0,
  importType: 'standard',
  canton: 'ZH',
  ownershipMonths: 0,
  alreadyInSwitzerland: true,
};

interface WizardContextType {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

export const WizardContext = createContext<WizardContextType>({
  data: defaultWizardData,
  updateData: () => {},
  currentStep: 0,
  setCurrentStep: () => {},
});

export function useWizard() {
  return useContext(WizardContext);
}
