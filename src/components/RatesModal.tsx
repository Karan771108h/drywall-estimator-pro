import React from 'react';
import type {
  MaterialCostRates,
  LaborProductionRates,
  ProjectSettings,
} from '../engine/types';
import {
  DEFAULT_MATERIAL_RATES_IMPERIAL,
  DEFAULT_MATERIAL_RATES_METRIC,
  DEFAULT_LABOR_RATES,
  DEFAULT_PROJECT_SETTINGS,
} from '../engine/takeoff';
import { X, Sliders, RotateCcw } from 'lucide-react';

interface RatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialRates: MaterialCostRates;
  onMaterialRatesChange: (rates: MaterialCostRates) => void;
  laborRates: LaborProductionRates;
  onLaborRatesChange: (rates: LaborProductionRates) => void;
  settings: ProjectSettings;
  onSettingsChange: (settings: ProjectSettings) => void;
}

export const RatesModal: React.FC<RatesModalProps> = ({
  isOpen,
  onClose,
  materialRates,
  onMaterialRatesChange,
  laborRates,
  onLaborRatesChange,
  settings,
  onSettingsChange,
}) => {
  if (!isOpen) return null;

  const sym = settings.currency;
  const isMetric = settings.unitSystem === 'metric';

  const resetDefaults = () => {
    onMaterialRatesChange(
      isMetric ? { ...DEFAULT_MATERIAL_RATES_METRIC } : { ...DEFAULT_MATERIAL_RATES_IMPERIAL }
    );
    onLaborRatesChange({ ...DEFAULT_LABOR_RATES });
    onSettingsChange({
      ...settings,
      wastePercent: DEFAULT_PROJECT_SETTINGS.wastePercent,
      dumpAndEquipmentFee: DEFAULT_PROJECT_SETTINGS.dumpAndEquipmentFee,
      overheadPercent: DEFAULT_PROJECT_SETTINGS.overheadPercent,
      profitPercent: DEFAULT_PROJECT_SETTINGS.profitPercent,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Rate Card & Production Margins</h2>
              <p className="text-xs text-slate-400">
                Adjust unit material costs, trade hourly wages, labor burden, and contract markups.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-xs text-slate-300">
          {/* Section 1: Markups & Waste */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
              1. Project Markups, Waste & Equipment Allowance
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Scrap Waste Margin (%)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={settings.wastePercent}
                  onChange={(e) =>
                    onSettingsChange({ ...settings, wastePercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Dump & Equip Fee ({sym})</label>
                <input
                  type="number"
                  min="0"
                  value={settings.dumpAndEquipmentFee}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      dumpAndEquipmentFee: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Contractor Overhead (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={settings.overheadPercent}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      overheadPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Net Profit Margin (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={settings.profitPercent}
                  onChange={(e) =>
                    onSettingsChange({
                      ...settings,
                      profitPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Material Unit Costs */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
              2. Material Unit Costs ({sym})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">1/2" Regular Sheet ({sym}/ea)</label>
                <input
                  type="number"
                  step="0.5"
                  value={materialRates.drywallSheetRegular}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      drywallSheetRegular: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">5/8" Type X Fire-Code ({sym}/ea)</label>
                <input
                  type="number"
                  step="0.5"
                  value={materialRates.drywallSheetTypeX}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      drywallSheetTypeX: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">1/2" Moisture Purple ({sym}/ea)</label>
                <input
                  type="number"
                  step="0.5"
                  value={materialRates.drywallSheetMoisture}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      drywallSheetMoisture: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Joint Compound 4.5g ({sym}/bkt)</label>
                <input
                  type="number"
                  step="0.5"
                  value={materialRates.jointCompoundBucket}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      jointCompoundBucket: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Joint Tape 500ft ({sym}/roll)</label>
                <input
                  type="number"
                  step="0.25"
                  value={materialRates.jointTapeRoll}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      jointTapeRoll: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Screws 5-lb Box ({sym}/box)</label>
                <input
                  type="number"
                  step="0.5"
                  value={materialRates.fastenersBox}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      fastenersBox: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Corner Bead ({sym}/stick)</label>
                <input
                  type="number"
                  step="0.25"
                  value={materialRates.cornerBeadStick}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      cornerBeadStick: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">PVA Drywall Primer ({sym}/gal)</label>
                <input
                  type="number"
                  step="1.0"
                  value={materialRates.primerGallon}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      primerGallon: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Finish Paint ({sym}/gal)</label>
                <input
                  type="number"
                  step="1.0"
                  value={materialRates.paintGallon}
                  onChange={(e) =>
                    onMaterialRatesChange({
                      ...materialRates,
                      paintGallon: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Trade Hourly Rates & Labor Burden */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">
              3. Crew Hourly Wages & Statutory Labor Burden
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Hanger Wage ({sym}/hr)</label>
                <input
                  type="number"
                  value={laborRates.hangingHourlyRate}
                  onChange={(e) =>
                    onLaborRatesChange({
                      ...laborRates,
                      hangingHourlyRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Taper Wage ({sym}/hr)</label>
                <input
                  type="number"
                  value={laborRates.finishingHourlyRate}
                  onChange={(e) =>
                    onLaborRatesChange({
                      ...laborRates,
                      finishingHourlyRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Painter Wage ({sym}/hr)</label>
                <input
                  type="number"
                  value={laborRates.paintingHourlyRate}
                  onChange={(e) =>
                    onLaborRatesChange({
                      ...laborRates,
                      paintingHourlyRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Labor Burden % (WC/FICA)</label>
                <input
                  type="number"
                  value={laborRates.laborBurdenPercent}
                  onChange={(e) =>
                    onLaborRatesChange({
                      ...laborRates,
                      laborBurdenPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 text-white font-mono px-3 py-1.5 rounded-lg focus:ring-1 focus:ring-amber-400"
                  title="FICA, Workers Comp class 5445, GL"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between sticky bottom-0 bg-slate-900/95 backdrop-blur">
          <button
            type="button"
            onClick={resetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Industry Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs transition-colors"
          >
            Done & Save Rates
          </button>
        </div>
      </div>
    </div>
  );
};
