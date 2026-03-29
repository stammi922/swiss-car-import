'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useWizard } from '@/lib/store';
import {
  fuzzyMatchMakes,
  getStaticModels,
  getStaticVariants,
  getModelNames,
  lookupVehicle,
  lookupByVin,
  searchVehicleSpecs,
  type StaticVariant,
  type Co2Standard,
  type SearchResult,
} from '@/lib/vehicleLookup';
import { Info, Search, Loader2, Check, X, ChevronDown, ExternalLink, AlertTriangle } from 'lucide-react';

const currencies = ['EUR', 'USD', 'GBP', 'JPY', 'CHF'];

type DataSource = 'static' | 'epa' | 'nhtsa' | 'manual';

interface AutoFillState {
  weight: DataSource | null;
  co2: DataSource | null;
  engine: DataSource | null;
  fuel: DataSource | null;
}

const SOURCE_BADGES: Record<DataSource, { label: string; emoji: string }> = {
  static: { label: 'EEA', emoji: '📊' },
  epa: { label: 'EPA', emoji: '🇺🇸' },
  nhtsa: { label: 'NHTSA', emoji: '🇺🇸' },
  manual: { label: 'Manual', emoji: '✏️' },
};

export default function VehicleStep() {
  const t = useTranslations('vehicle');
  const { data, updateData } = useWizard();

  // Autocomplete states
  const [makeQuery, setMakeQuery] = useState(data.vehicleMake);
  const [makeSuggestions, setMakeSuggestions] = useState<string[]>([]);
  const [showMakeSuggestions, setShowMakeSuggestions] = useState(false);
  const [selectedMake, setSelectedMake] = useState(data.vehicleMake);

  const [modelQuery, setModelQuery] = useState(data.vehicleModel);
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);
  const [selectedModel, setSelectedModel] = useState(data.vehicleModel);

  const [variants, setVariants] = useState<StaticVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState('');

  const [vinInput, setVinInput] = useState('');
  const [vinLoading, setVinLoading] = useState(false);
  const [vinError, setVinError] = useState('');
  const [euVinNotice, setEuVinNotice] = useState('');

  const [lookupLoading, setLookupLoading] = useState(false);
  const [autoFill, setAutoFill] = useState<AutoFillState>({
    weight: null, co2: null, engine: null, fuel: null,
  });
  const [co2Standard, setCo2Standard] = useState<Co2Standard>('WLTP');
  const [noMatch, setNoMatch] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (makeRef.current && !makeRef.current.contains(e.target as Node)) {
        setShowMakeSuggestions(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setShowModelSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Update make suggestions on query change
  useEffect(() => {
    if (makeQuery.length >= 1) {
      const matches = fuzzyMatchMakes(makeQuery);
      setMakeSuggestions(matches);
    } else {
      setMakeSuggestions([]);
    }
  }, [makeQuery]);

  // Load models when make + year are selected
  const loadModels = useCallback(async (make: string, year: number) => {
    if (!make || !year) return;
    const staticModels = getStaticModels(make);
    setModelSuggestions(staticModels);

    // Fetch from NHTSA in background to augment
    try {
      const allModels = await getModelNames(make, year);
      setModelSuggestions(allModels);
    } catch { /* keep static models */ }
  }, []);

  useEffect(() => {
    if (selectedMake && data.vehicleYear) {
      loadModels(selectedMake, data.vehicleYear);
    }
  }, [selectedMake, data.vehicleYear, loadModels]);

  // Load variants when model selected
  useEffect(() => {
    if (selectedMake && selectedModel) {
      const v = getStaticVariants(selectedMake, selectedModel, data.vehicleYear || undefined);
      setVariants(v);
      setSelectedVariant('');
    }
  }, [selectedMake, selectedModel, data.vehicleYear]);

  // Brave search fallback
  const doSearchFallback = useCallback(async (make: string, model: string, year: number) => {
    setSearchLoading(true);
    try {
      const results = await searchVehicleSpecs(make, model, year);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Perform lookup when make + model + year are set
  const doLookup = useCallback(async (make: string, model: string, year: number, variant?: string) => {
    if (!make || !model || !year) return;

    setLookupLoading(true);
    setNoMatch(false);
    setSearchResults([]);

    try {
      const specs = await lookupVehicle(make, model, year, variant);

      const newAutoFill: AutoFillState = { weight: null, co2: null, engine: null, fuel: null };
      const updates: Partial<typeof data> = {};

      if (specs.mass_kg) {
        updates.vehicleWeight = specs.mass_kg;
        newAutoFill.weight = specs.source;
      }
      if (specs.co2_wltp !== undefined) {
        updates.co2Emissions = specs.co2_wltp;
        newAutoFill.co2 = specs.source;
      }
      if (specs.co2_standard) {
        setCo2Standard(specs.co2_standard);
      }
      if (specs.engine_cc) {
        newAutoFill.engine = specs.source;
      }
      if (specs.fuel) {
        newAutoFill.fuel = specs.source;
      }

      if (specs.source === 'manual' && !specs.mass_kg && specs.co2_wltp === undefined) {
        setNoMatch(true);
        // Trigger Brave search fallback
        doSearchFallback(make, model, year);
      }

      setAutoFill(newAutoFill);
      if (Object.keys(updates).length > 0) {
        updateData(updates);
      }
    } catch {
      setNoMatch(true);
      doSearchFallback(make, model, year);
    } finally {
      setLookupLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateData, doSearchFallback]);

  // Handle make selection
  const selectMake = (make: string) => {
    setSelectedMake(make);
    setMakeQuery(make);
    setShowMakeSuggestions(false);
    updateData({ vehicleMake: make });
    // Reset model
    setSelectedModel('');
    setModelQuery('');
    updateData({ vehicleModel: '' });
    setVariants([]);
    setSelectedVariant('');
    setAutoFill({ weight: null, co2: null, engine: null, fuel: null });
    setNoMatch(false);
    setSearchResults([]);
    setEuVinNotice('');
  };

  // Handle model selection
  const selectModel = (model: string) => {
    setSelectedModel(model);
    setModelQuery(model);
    setShowModelSuggestions(false);
    updateData({ vehicleModel: model });
    setSelectedVariant('');

    if (selectedMake && data.vehicleYear) {
      doLookup(selectedMake, model, data.vehicleYear);
    }
  };

  // Handle variant selection
  const selectVariant = (variantName: string) => {
    setSelectedVariant(variantName);
    if (selectedMake && selectedModel && data.vehicleYear) {
      doLookup(selectedMake, selectedModel, data.vehicleYear, variantName);
    }
  };

  // Handle year change
  const handleYearChange = (year: number) => {
    updateData({ vehicleYear: year });
    if (selectedMake && selectedModel && year >= 1985 && year <= 2026) {
      doLookup(selectedMake, selectedModel, year, selectedVariant || undefined);
    }
  };

  // VIN decode
  const handleVinDecode = async () => {
    if (vinInput.length < 11) {
      setVinError(t('vin_too_short'));
      return;
    }

    setVinLoading(true);
    setVinError('');
    setNoMatch(false);
    setEuVinNotice('');
    setSearchResults([]);

    try {
      const result = await lookupByVin(vinInput);

      const updates: Partial<typeof data> = {};
      const newAutoFill: AutoFillState = { weight: null, co2: null, engine: null, fuel: null };

      if (result.isEuVin && result.source === 'manual') {
        // EU VIN detected, NHTSA couldn't decode
        if (result.make) {
          updates.vehicleMake = result.make;
          setSelectedMake(result.make);
          setMakeQuery(result.make);
          setEuVinNotice(t('eu_vin_detected', { make: result.make }));
          // Focus model input after state updates
          setTimeout(() => modelInputRef.current?.focus(), 100);
        } else {
          setEuVinNotice(t('eu_vin_unknown'));
        }
        updateData(updates);
        setAutoFill(newAutoFill);
        return;
      }

      if (result.make) {
        updates.vehicleMake = result.make;
        setSelectedMake(result.make);
        setMakeQuery(result.make);
      }
      if (result.model) {
        updates.vehicleModel = result.model;
        setSelectedModel(result.model);
        setModelQuery(result.model);
      }
      if (result.year) {
        updates.vehicleYear = result.year;
      }
      if (result.mass_kg) {
        updates.vehicleWeight = result.mass_kg;
        newAutoFill.weight = result.source;
      }
      if (result.co2_wltp !== undefined) {
        updates.co2Emissions = result.co2_wltp;
        newAutoFill.co2 = result.source;
      }
      if (result.co2_standard) {
        setCo2Standard(result.co2_standard);
      }
      if (result.fuel) {
        newAutoFill.fuel = result.source;
      }
      if (result.engine_cc) {
        newAutoFill.engine = result.source;
      }

      setAutoFill(newAutoFill);
      updateData(updates);
    } catch {
      setVinError(t('vin_error'));
    } finally {
      setVinLoading(false);
    }
  };

  // Determine CO2 label
  const co2Label = co2Standard === 'NEDC' ? t('co2_nedc') : t('co2');

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-swiss-red/20 focus:border-swiss-red outline-none transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  const SourceBadge = ({ source }: { source: DataSource | null }) => {
    if (!source) return null;
    const badge = SOURCE_BADGES[source];
    return (
      <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
        <Check className="w-3 h-3" />
        <span>{badge.emoji} {badge.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-dark">{t('title')}</h2>

      {/* Vehicle Search Section */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <Search className="w-4 h-4" />
          {t('search_title')}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Year */}
          <div>
            <label className={labelClass}>{t('year')}</label>
            <select
              value={data.vehicleYear || ''}
              onChange={(e) => handleYearChange(parseInt(e.target.value) || 0)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">{t('select_year')}</option>
              {Array.from({ length: 42 }, (_, i) => 2026 - i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Make */}
          <div ref={makeRef} className="relative">
            <label className={labelClass}>{t('make')}</label>
            <input
              type="text"
              value={makeQuery}
              onChange={(e) => {
                setMakeQuery(e.target.value);
                setShowMakeSuggestions(true);
                if (e.target.value !== selectedMake) {
                  setSelectedMake('');
                  updateData({ vehicleMake: e.target.value });
                }
              }}
              onFocus={() => makeQuery.length >= 1 && setShowMakeSuggestions(true)}
              placeholder={t('make_placeholder')}
              className={inputClass}
              autoComplete="off"
            />
            {showMakeSuggestions && makeSuggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {makeSuggestions.map((make) => (
                  <button
                    key={make}
                    onClick={() => selectMake(make)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-swiss-red-light hover:text-swiss-red transition-colors cursor-pointer"
                  >
                    {make}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model */}
          <div ref={modelRef} className="relative">
            <label className={labelClass}>{t('model')}</label>
            <input
              ref={modelInputRef}
              type="text"
              value={modelQuery}
              onChange={(e) => {
                setModelQuery(e.target.value);
                setShowModelSuggestions(true);
                if (e.target.value !== selectedModel) {
                  setSelectedModel('');
                  updateData({ vehicleModel: e.target.value });
                }
              }}
              onFocus={() => {
                if (modelSuggestions.length > 0) setShowModelSuggestions(true);
              }}
              placeholder={t('model_placeholder')}
              className={inputClass}
              disabled={!selectedMake}
              autoComplete="off"
            />
            {showModelSuggestions && modelSuggestions.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {(modelQuery
                  ? modelSuggestions.filter(m =>
                      m.toLowerCase().includes(modelQuery.toLowerCase())
                    )
                  : modelSuggestions
                ).map((model) => (
                  <button
                    key={model}
                    onClick={() => selectModel(model)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-swiss-red-light hover:text-swiss-red transition-colors cursor-pointer"
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
            {lookupLoading && (
              <div className="absolute right-3 top-9">
                <Loader2 className="w-4 h-4 animate-spin text-swiss-red" />
              </div>
            )}
          </div>
        </div>

        {/* Variant selector */}
        {variants.length > 0 && (
          <div>
            <label className={labelClass}>
              {t('variant')}
              {variants.length > 1 && (
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  ({variants.length} {t('variants_available')})
                </span>
              )}
            </label>
            <div className="relative">
              <select
                value={selectedVariant}
                onChange={(e) => selectVariant(e.target.value)}
                className={`${inputClass} cursor-pointer appearance-none pr-8`}
              >
                <option value="">{t('select_variant')}</option>
                {variants.map((v) => {
                  const co2Val = v.co2_wltp ?? v.co2_nedc;
                  const co2Std = v.co2_wltp !== undefined ? 'WLTP' : 'NEDC';
                  return (
                    <option key={v.variant} value={v.variant}>
                      {v.variant} — {v.power_kw} kW, {co2Val} g/km CO₂ ({co2Std}), {v.fuel}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* VIN decode */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <span className="border-t border-gray-300 flex-1" />
            <span>{t('or_vin')}</span>
            <span className="border-t border-gray-300 flex-1" />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={vinInput}
              onChange={(e) => {
                setVinInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                setVinError('');
                setEuVinNotice('');
              }}
              placeholder={t('vin_placeholder')}
              maxLength={17}
              className={`flex-1 ${inputClass} font-mono tracking-wider`}
            />
            <button
              onClick={handleVinDecode}
              disabled={vinLoading || vinInput.length < 11}
              className="px-4 py-2.5 bg-dark text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {vinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {t('decode')}
            </button>
          </div>
          {vinError && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <X className="w-3 h-3" /> {vinError}
            </p>
          )}
          {euVinNotice && (
            <div className="mt-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{euVinNotice}</span>
            </div>
          )}
        </div>

        {/* No match notice */}
        {noMatch && !searchLoading && searchResults.length === 0 && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{t('no_match')}</span>
          </div>
        )}

        {/* Search fallback results */}
        {searchLoading && (
          <div className="text-sm text-gray-500 flex items-center gap-2 p-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('searching_specs')}
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            <p className="font-medium text-blue-800 flex items-center gap-1">
              <Search className="w-3.5 h-3.5" />
              {t('search_results_title')}
            </p>
            <ul className="space-y-1.5">
              {searchResults.map((result, i) => (
                <li key={i}>
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:text-blue-900 underline underline-offset-2 flex items-start gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      <span className="font-medium">{result.title}</span>
                      {result.description && (
                        <span className="block text-xs text-blue-600 mt-0.5 line-clamp-1">{result.description}</span>
                      )}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Vehicle spec fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Weight */}
        <div>
          <label className={`${labelClass} flex items-center gap-2`}>
            {t('weight')}
            <SourceBadge source={autoFill.weight} />
          </label>
          <input
            type="number"
            value={data.vehicleWeight || ''}
            onChange={(e) => {
              updateData({ vehicleWeight: parseInt(e.target.value) || 0 });
              setAutoFill(prev => ({ ...prev, weight: prev.weight ? 'manual' : null }));
            }}
            min={0}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" /> {t('weight_help')}
          </p>
        </div>

        {/* CO2 */}
        <div>
          <label className={`${labelClass} flex items-center gap-2`}>
            {co2Label}
            <SourceBadge source={autoFill.co2} />
          </label>
          <input
            type="number"
            value={data.co2Emissions || ''}
            onChange={(e) => {
              updateData({ co2Emissions: parseInt(e.target.value) || 0 });
              setAutoFill(prev => ({ ...prev, co2: prev.co2 ? 'manual' : null }));
            }}
            min={0}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" /> {t('co2_help')}
          </p>
        </div>

        {/* First registration */}
        <div>
          <label className={labelClass}>{t('first_reg')}</label>
          <input
            type="date"
            value={data.firstRegistrationDate}
            onChange={(e) => updateData({ firstRegistrationDate: e.target.value })}
            className={inputClass}
          />
        </div>

        {/* KM */}
        <div>
          <label className={labelClass}>{t('km')}</label>
          <input
            type="number"
            value={data.vehicleKm || ''}
            onChange={(e) => updateData({ vehicleKm: parseInt(e.target.value) || 0 })}
            min={0}
            className={inputClass}
          />
        </div>

        {/* Is new */}
        <div className="flex items-center gap-3 pt-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data.isNew}
              onChange={(e) => updateData({ isNew: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-swiss-red/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-swiss-red"></div>
          </label>
          <span className="text-sm font-medium text-gray-700">{t('is_new')}</span>
        </div>
      </div>

      {/* Price section */}
      <div className="border-t border-gray-200 pt-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>{t('price')}</label>
            <input
              type="number"
              value={data.purchasePrice || ''}
              onChange={(e) => updateData({ purchasePrice: parseFloat(e.target.value) || 0 })}
              min={0}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t('currency')}</label>
            <select
              value={data.purchaseCurrency}
              onChange={(e) => updateData({ purchaseCurrency: e.target.value })}
              className={`${inputClass} cursor-pointer`}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>{t('value_chf')}</label>
          <input
            type="number"
            value={data.vehicleValueCHF || ''}
            onChange={(e) => updateData({ vehicleValueCHF: parseFloat(e.target.value) || 0 })}
            min={0}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" /> {t('value_chf_help')}
          </p>
        </div>
      </div>
    </div>
  );
}
